import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import fs from 'fs';

// Custom plugin to proxy GCS requests and handle scraper triggers
const gcsProxyPlugin = () => {
  let storage: Storage;
  let bucketName: string;
  let pubsub: PubSub;
  let projectId: string;
  let scrapingTopic: string;
  let authClient: OAuth2Client;
  let googleClientId: string;

  try {
    // Load env from current directory
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));

      // Disable SSL verification for development (WSL certificate issue)
      if (envConfig.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      // Resolve key file path relative to the .env file location
      const keyFilename = path.resolve(path.dirname(envPath), envConfig.GOOGLE_APPLICATION_CREDENTIALS);

      storage = new Storage({
        projectId: envConfig.GCP_PROJECT_ID,
        keyFilename: keyFilename,
      });
      bucketName = envConfig.GCS_BUCKET_NAME;
      projectId = envConfig.GCP_PROJECT_ID;
      scrapingTopic = envConfig.SCRAPING_REQUEST_TOPIC || 'scraping-requests';
      googleClientId = envConfig.VITE_GOOGLE_CLIENT_ID;

      // Initialize Pub/Sub client
      pubsub = new PubSub({
        projectId: projectId,
        keyFilename: keyFilename,
      });

      // Initialize OAuth2 client for JWT verification
      authClient = new OAuth2Client(googleClientId);

      console.log(`GCS Proxy configured for bucket: ${bucketName}`);
      console.log(`Pub/Sub configured for topic: ${scrapingTopic}`);
      console.log(`OAuth2 Client configured for: ${googleClientId}`);
    } else {
      console.warn('GCS Proxy: .env file not found in current directory');
    }
  } catch (e) {
    console.error('GCS Proxy Init Error:', e);
  }

  // --- CACHING LAYER ---
  const CACHE = {
    allowedUsers: { data: null as string[] | null, timestamp: null as number | null, TTL: 5 * 60 * 1000 }, // 5 minutes
    adminUsers: { data: null as string[] | null, timestamp: null as number | null, TTL: 5 * 60 * 1000 },
  };

  const isCacheValid = (cacheEntry: typeof CACHE.allowedUsers) => {
    return cacheEntry.data !== null &&
           cacheEntry.timestamp !== null &&
           (Date.now() - cacheEntry.timestamp) < cacheEntry.TTL;
  };

  // --- HELPER FUNCTIONS ---

  const FALLBACK_ALLOWED_EMAILS = ['oktay.burak.ertas@gmail.com'];

  const loadAllowedUsers = async (): Promise<string[]> => {
    if (isCacheValid(CACHE.allowedUsers)) {
      return CACHE.allowedUsers.data!;
    }

    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file('config/allowed_users.json');
      const [exists] = await file.exists();

      if (!exists) {
        console.warn('allowed_users.json not found in GCS, using fallback list');
        return FALLBACK_ALLOWED_EMAILS;
      }

      const [content] = await file.download();
      const config = JSON.parse(content.toString());
      const users = config.allowed_users || FALLBACK_ALLOWED_EMAILS;

      CACHE.allowedUsers.data = users;
      CACHE.allowedUsers.timestamp = Date.now();

      return users;
    } catch (error) {
      console.error('Error loading allowed users from GCS:', error);
      return FALLBACK_ALLOWED_EMAILS;
    }
  };

  const loadAdminUsers = async (): Promise<string[]> => {
    if (isCacheValid(CACHE.adminUsers)) {
      return CACHE.adminUsers.data!;
    }

    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file('config/admin_users.json');
      const [exists] = await file.exists();

      if (!exists) {
        console.warn('admin_users.json not found in GCS');
        return [];
      }

      const [content] = await file.download();
      const config = JSON.parse(content.toString());
      const admins = config.admin_users || [];

      CACHE.adminUsers.data = admins;
      CACHE.adminUsers.timestamp = Date.now();

      return admins;
    } catch (error) {
      console.error('Error loading admin users from GCS:', error);
      return [];
    }
  };

  const verifyAuth = async (authHeader: string | undefined): Promise<{ email: string; isAdmin: boolean } | null> => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify JWT token with Google
      const ticket = await authClient.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return null;
      }

      const email = payload.email;

      // Check if user is allowed
      const allowedEmails = await loadAllowedUsers();
      if (!allowedEmails.includes(email)) {
        console.warn(`Access denied for email: ${email}`);
        return null;
      }

      // Check if user is admin
      const adminUsers = await loadAdminUsers();
      const isAdmin = adminUsers.includes(email);

      return { email, isAdmin };
    } catch (error) {
      console.error('Auth verification failed:', error);
      return null;
    }
  };

  return {
    name: 'gcs-proxy',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res, next) => {
        if (!storage || !bucketName) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'GCS not configured' }));
          return;
        }

        try {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const region = url.searchParams.get('region') || 'eu';
          const dateParam = url.searchParams.get('date'); // Expecting YYYY-MM-DD
          const latestOnly = url.searchParams.get('latest') === 'true'; // Get only latest run
          const lastNDays = parseInt(url.searchParams.get('last_n_days') || '0'); // Get last N days

          let prefix = `news_data/batch_processing/${region}/`;
          
          if (dateParam) {
            // Structure: news_data/batch_processing/{region}/{YYYY-MM}/{YYYY-MM-DD}/
            const [year, month] = dateParam.split('-');
            prefix = `news_data/batch_processing/${region}/${year}-${month}/${dateParam}/`;
            console.log(`Targeting specific date: ${dateParam}`);
          } else if (lastNDays > 0) {
            // Get data from last N days (live data mode)
            console.log(`Fetching data from last ${lastNDays} days`);
          } else {
            // Default: Get current month's data
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            prefix = `news_data/batch_processing/${region}/${year}-${month}/`;
            console.log(`Defaulting to current month: ${year}-${month}`);
          }
          
          console.log(`Looking for files in ${bucketName} with prefix ${prefix}...`);

          const [files] = await storage.bucket(bucketName).getFiles({
            prefix: prefix
          });

          // Filter for stage 2 prediction results
          let resultFiles = files.filter(f => 
            f.name.includes('stage2_deduplication/results') && 
            f.name.endsWith('predictions.jsonl')
          );

          // If fetching last N days, filter by date
          if (lastNDays > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - lastNDays);
            resultFiles = resultFiles.filter(f => {
              const match = f.name.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                const fileDate = new Date(match[0]);
                return fileDate >= cutoffDate;
              }
              return false;
            });
          }

          if (resultFiles.length === 0) {
            console.log('No files found.');
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No data found' }));
            return;
          }

          // Sort by name descending (latest first) - file names include timestamps
          resultFiles.sort((a, b) => b.name.localeCompare(a.name));

          let filesToProcess = [];

          if (latestOnly) {
            // Get only the most recent file
            filesToProcess = [resultFiles[0]];
            console.log(`Fetching latest file only: ${filesToProcess[0].name}`);
          } else if (dateParam) {
            // If a specific date is selected, we get ALL runs for that day
            filesToProcess = resultFiles;
            console.log(`Found ${filesToProcess.length} runs for date ${dateParam}`);
          } else {
            // Default behavior: Get ALL files from the selected range
            filesToProcess = resultFiles;
            console.log(`Found ${filesToProcess.length} files to process`);
          }

          let allArticles: any[] = [];

          for (const file of filesToProcess) {
            console.log(`Downloading file: ${file.name}`);
            const [content] = await file.download();
            
            const fileContent = content.toString();
            const lines = fileContent.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                
                // Case 1: Vertex AI Batch Response (nested JSON in candidates)
                if (json.response && json.response.candidates && json.response.candidates[0].content && json.response.candidates[0].content.parts) {
                  const text = json.response.candidates[0].content.parts[0].text;
                  // Clean markdown code blocks if present
                  const cleanText = text.replace(/```json\n?|\n?```/g, '');
                  try {
                    const parsedInner = JSON.parse(cleanText);
                    if (parsedInner.processed_articles) {
                      allArticles = [...allArticles, ...parsedInner.processed_articles];
                    } else if (parsedInner.consolidated_articles) {
                      allArticles = [...allArticles, ...parsedInner.consolidated_articles];
                    } else if (Array.isArray(parsedInner)) {
                      allArticles = [...allArticles, ...parsedInner];
                    } else if (parsedInner.title) {
                       allArticles.push(parsedInner);
                    }
                  } catch (e) {
                    console.error('Error parsing inner JSON:', e);
                  }
                }
                // Case 2: Direct article object (flat JSONL)
                else if (json.title && json.summary && json.original_url) {
                   allArticles.push(json);
                }
                // Case 3: List of articles
                else if (Array.isArray(json)) {
                   allArticles = [...allArticles, ...json];
                }
                // Case 4: Prediction wrapper
                else if (json.prediction) {
                   if (Array.isArray(json.prediction)) {
                      allArticles = [...allArticles, ...json.prediction];
                   } else {
                      allArticles.push(json.prediction);
                   }
                }
              } catch (err) {
                console.error('Error parsing line in file ' + file.name, err);
              }
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(allArticles));
        } catch (error: any) {
          console.error('GCS Proxy Request Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      // Scraper trigger endpoint
      server.middlewares.use('/api/trigger-scraper', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!pubsub || !projectId || !scrapingTopic) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Pub/Sub not configured' }));
          return;
        }

        // Verify authentication first
        const authHeader = req.headers.authorization as string | undefined;
        const user = await verifyAuth(authHeader);

        if (!user) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);

            // Add triggered_by to payload
            payload.triggered_by = user.email;

            console.log(`Triggering scraper for ${payload.collection_id} by ${user.email}:`, payload);

            // Publish to Pub/Sub topic
            const topicPath = pubsub.topic(scrapingTopic);
            const dataBuffer = Buffer.from(JSON.stringify(payload));

            const messageId = await topicPath.publishMessage({ data: dataBuffer });

            console.log(`✅ Published message ${messageId} to topic ${scrapingTopic}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              messageId,
              region: payload.collection_id,
              sourcesCount: payload.urls.length,
              triggeredBy: user.email
            }));
          } catch (error: any) {
            console.error('Scraper trigger error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });

      // GET /api/user - Get current user info from JWT token
      server.middlewares.use('/api/user', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          const authHeader = req.headers.authorization as string | undefined;
          const user = await verifyAuth(authHeader);

          if (!user) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          // Get user's full profile from JWT token payload
          const token = authHeader!.split(' ')[1];
          const ticket = await authClient.verifyIdToken({
            idToken: token,
            audience: googleClientId,
          });
          const payload = ticket.getPayload();

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            email: user.email,
            name: payload?.name || '',
            picture: payload?.picture || '',
            isAdmin: user.isAdmin
          }));
        } catch (error: any) {
          console.error('User endpoint error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      // GET /api/config/allowed-users - Get list of allowed users (admin only)
      server.middlewares.use('/api/config/allowed-users', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          // Verify authentication
          const authHeader = req.headers.authorization as string | undefined;
          const user = await verifyAuth(authHeader);

          if (!user) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          // Check if user is admin
          if (!user.isAdmin) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: 'Admin access required' }));
            return;
          }

          if (!storage || !bucketName) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'GCS not configured' }));
            return;
          }

          const allowedUsers = await loadAllowedUsers();

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ allowed_users: allowedUsers }));
        } catch (error: any) {
          console.error('Allowed users endpoint error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      // GET /api/config/admin-users - Get current user's admin status (NOT the full admin list)
      server.middlewares.use('/api/config/admin-users', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          // Verify authentication
          const authHeader = req.headers.authorization as string | undefined;
          const user = await verifyAuth(authHeader);

          if (!user) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          // Only return the current user's admin status, not the full list
          // This prevents exposing who the admins are for security reasons
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            email: user.email,
            isAdmin: user.isAdmin
          }));
        } catch (error: any) {
          console.error('Admin users endpoint error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      // POST /api/trigger-news-api - Trigger News API fetch
      server.middlewares.use('/api/trigger-news-api', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!pubsub || !projectId) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Pub/Sub not configured' }));
          return;
        }

        // Verify authentication first
        const authHeader = req.headers.authorization as string | undefined;
        const user = await verifyAuth(authHeader);

        if (!user) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);

            // Build message payload
            const messagePayload = {
              keywords: payload.keywords || ['fenerbahce', 'galatasaray', 'tedesco'],
              time_range: payload.time_range || 'last_24_hours',
              max_results: payload.max_results || 50,
              triggered_by: user.email
            };

            console.log(`Triggering News API fetch by ${user.email}:`, messagePayload);

            // Publish to Pub/Sub topic
            const newsApiTopic = 'news-api-requests';
            const topicPath = pubsub.topic(newsApiTopic);
            const dataBuffer = Buffer.from(JSON.stringify(messagePayload));

            const messageId = await topicPath.publishMessage({ data: dataBuffer });

            console.log(`✅ Published message ${messageId} to topic ${newsApiTopic}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              messageId,
              keywords: messagePayload.keywords,
              time_range: messagePayload.time_range,
              triggeredBy: user.email
            }));
          } catch (error: any) {
            console.error('News API trigger error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), gcsProxyPlugin()],
      define: {
        // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Removed
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
