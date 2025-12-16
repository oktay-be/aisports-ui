import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import fs from 'fs';
import grpc from '@grpc/grpc-js';

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

      // Initialize Pub/Sub client with SSL workaround for WSL
      const pubsubConfig: any = {
        projectId: projectId,
        keyFilename: keyFilename,
      };

      // For WSL development, use custom gRPC settings to bypass SSL certificate issues
      if (envConfig.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
        pubsubConfig.grpc = grpc;
        pubsubConfig.sslCreds = grpc.credentials.createInsecure();
      }

      pubsub = new PubSub(pubsubConfig);

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

  // --- GCS DATA CACHE (Per-date article caching) ---
  interface DateCacheEntry {
    articles: any[];
    timestamp: number;
    TTL: number;
  }

  const GCS_DATA_CACHE: { [region: string]: { [date: string]: DateCacheEntry } } = {};

  const getDateCacheKey = (region: string, date: string): string => `${region}:${date}`;

  const isDateCacheValid = (cacheEntry: DateCacheEntry): boolean => {
    return Date.now() - cacheEntry.timestamp < cacheEntry.TTL;
  };

  const getCachedArticles = (region: string, date: string): any[] | null => {
    if (!GCS_DATA_CACHE[region]) return null;
    const entry = GCS_DATA_CACHE[region][date];
    if (!entry) return null;
    if (!isDateCacheValid(entry)) {
      delete GCS_DATA_CACHE[region][date];
      return null;
    }
    return entry.articles;
  };

  const setCachedArticles = (region: string, date: string, articles: any[], ttl: number = 10 * 60 * 1000) => {
    if (!GCS_DATA_CACHE[region]) {
      GCS_DATA_CACHE[region] = {};
    }
    GCS_DATA_CACHE[region][date] = {
      articles,
      timestamp: Date.now(),
      TTL: ttl
    };
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
          // Verify authentication
          const authHeader = req.headers.authorization as string | undefined;
          const user = await verifyAuth(authHeader);

          if (!user) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const region = url.searchParams.get('region') || 'eu';
          const startDate = url.searchParams.get('startDate'); // YYYY-MM-DD
          const endDate = url.searchParams.get('endDate'); // YYYY-MM-DD
          const lastNDays = parseInt(url.searchParams.get('last_n_days') || '0');

          // Helper: Generate array of dates between start and end (inclusive)
          const getDateRange = (start: string, end: string): string[] => {
            const dates: string[] = [];
            const currentDate = new Date(start);
            const endDateObj = new Date(end);

            while (currentDate <= endDateObj) {
              dates.push(currentDate.toISOString().split('T')[0]);
              currentDate.setDate(currentDate.getDate() + 1);
            }
            return dates;
          };

          // Helper: Get today's date
          const getTodayDate = (): string => {
            return new Date().toISOString().split('T')[0];
          };

          // Determine which dates to fetch
          let datesToFetch: string[] = [];

          if (startDate && endDate) {
            datesToFetch = getDateRange(startDate, endDate);
          } else if (lastNDays > 0) {
            const today = new Date();
            const endDateObj = today;
            const startDateObj = new Date(today);
            startDateObj.setDate(startDateObj.getDate() - lastNDays + 1);
            datesToFetch = getDateRange(
              startDateObj.toISOString().split('T')[0],
              endDateObj.toISOString().split('T')[0]
            );
          } else {
            // Default: today only
            datesToFetch = [getTodayDate()];
          }

          console.log(`📅 Requested dates: ${datesToFetch.join(', ')}`);

          let allArticles: any[] = [];
          const datesToFetchFromGCS: string[] = [];

          // Check cache for each date
          for (const date of datesToFetch) {
            const cached = getCachedArticles(region, date);
            if (cached) {
              console.log(`⚡ Cache HIT for ${date} (${cached.length} articles)`);
              allArticles.push(...cached);
            } else {
              console.log(`🌐 Cache MISS for ${date} - will fetch from GCS`);
              datesToFetchFromGCS.push(date);
            }
          }

          // --- FETCH MISSING DATES FROM GCS ---
          // Group articles by date as we fetch them
          const articlesByDate: { [date: string]: any[] } = {};

          if (datesToFetchFromGCS.length > 0) {
            console.log(`🔍 Fetching ${datesToFetchFromGCS.length} dates from GCS...`);

            // Helper function to parse articles from JSONL content
            const parseArticlesFromJSONL = (fileContent: string, sourceType: 'scraped' | 'api'): any[] => {
              const articles: any[] = [];
              const lines = fileContent.split('\n').filter(line => line.trim());

              for (const line of lines) {
                try {
                  const json = JSON.parse(line);
                  let articlesToAdd: any[] = [];

                  // Case 1: Vertex AI Batch Response (nested JSON in candidates)
                  if (json.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const text = json.response.candidates[0].content.parts[0].text;
                    const cleanText = text.replace(/```json\n?|\n?```/g, '');
                    try {
                      const parsedInner = JSON.parse(cleanText);
                      if (parsedInner.processed_articles) {
                        articlesToAdd = parsedInner.processed_articles;
                      } else if (parsedInner.consolidated_articles) {
                        articlesToAdd = parsedInner.consolidated_articles;
                      } else if (Array.isArray(parsedInner)) {
                        articlesToAdd = parsedInner;
                      } else if (parsedInner.title) {
                        articlesToAdd = [parsedInner];
                      }
                    } catch (e) {
                      console.error('Error parsing inner JSON:', e);
                    }
                  }
                  // Case 2: Direct article object (flat JSONL)
                  else if (json.title && json.summary && json.original_url) {
                    articlesToAdd = [json];
                  }
                  // Case 3: List of articles
                  else if (Array.isArray(json)) {
                    articlesToAdd = json;
                  }
                  // Case 4: Prediction wrapper
                  else if (json.prediction) {
                    if (Array.isArray(json.prediction)) {
                      articlesToAdd = json.prediction;
                    } else {
                      articlesToAdd = [json.prediction];
                    }
                  }

                  // Add source_type and add to results
                  for (const article of articlesToAdd) {
                    article.source_type = sourceType;
                    articles.push(article);
                  }
                } catch (err) {
                  console.error('Error parsing JSONL line:', err);
                }
              }
              return articles;
            };

            // Fetch data for each missing date
            for (const date of datesToFetchFromGCS) {
              const dateArticles: any[] = [];
              const [year, month] = date.split('-');

              // --- Fetch Scraped Data ---
              const scrapedPrefix = `news_data/batch_processing/${region}/${year}-${month}/${date}/`;
              console.log(`📂 Fetching scraped data for ${date}: ${scrapedPrefix}`);

              try {
                const [scrapedFiles] = await storage.bucket(bucketName).getFiles({
                  prefix: scrapedPrefix,
                  matchGlob: '**/stage2_deduplication/results/**predictions.jsonl'
                });

                for (const file of scrapedFiles) {
                  try {
                    const [content] = await file.download();
                    const articles = parseArticlesFromJSONL(content.toString(), 'scraped');
                    dateArticles.push(...articles);
                    console.log(`  ✅ ${file.name}: ${articles.length} articles`);
                  } catch (err: any) {
                    console.error(`  ❌ Error processing ${file.name}:`, err.message);
                  }
                }
              } catch (err: any) {
                console.error(`  ❌ Error fetching scraped files for ${date}:`, err.message);
              }

              // --- Fetch API Data ---
              const apiPrefix = `news_data/api/${year}-${month}/${date}/`;
              console.log(`📂 Fetching API data for ${date}: ${apiPrefix}`);

              try {
                const [apiFiles] = await storage.bucket(bucketName).getFiles({
                  prefix: apiPrefix,
                  matchGlob: '**/articles.json'
                });

                for (const file of apiFiles) {
                  try {
                    const [content] = await file.download();
                    const data = JSON.parse(content.toString());
                    if (data.articles && Array.isArray(data.articles)) {
                      for (const article of data.articles) {
                        article.source_type = 'api';
                        dateArticles.push(article);
                      }
                      console.log(`  ✅ ${file.name}: ${data.articles.length} articles`);
                    }
                  } catch (err: any) {
                    console.error(`  ❌ Error processing ${file.name}:`, err.message);
                  }
                }
              } catch (err: any) {
                console.error(`  ❌ Error fetching API files for ${date}:`, err.message);
              }

              // Store date's articles
              articlesByDate[date] = dateArticles;
              console.log(`💾 Caching ${dateArticles.length} articles for ${date}`);

              // Add to cache
              setCachedArticles(region, date, dateArticles);

              // Add to response
              allArticles.push(...dateArticles);
            }
          }

          console.log(`📊 Total articles: ${allArticles.length}`);

          // --- DEDUPLICATE BY URL ---
          const seenUrls = new Set<string>();
          const uniqueArticles: any[] = [];
          for (const article of allArticles) {
            const url = article.original_url || article.url;
            if (url && !seenUrls.has(url)) {
              seenUrls.add(url);
              uniqueArticles.push(article);
            }
          }

          if (uniqueArticles.length === 0) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No data found' }));
            return;
          }

          console.log(`Returning ${uniqueArticles.length} unique articles (${allArticles.length - uniqueArticles.length} duplicates removed)`);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(uniqueArticles));
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

      // GET /api/config/news-api - Get News API configuration
      server.middlewares.use('/api/config/news-api', async (req, res, next) => {
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

          if (!storage || !bucketName) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'GCS not configured' }));
            return;
          }

          // Load news API config from GCS
          const bucket = storage.bucket(bucketName);
          const file = bucket.file('config/news_api_config.json');
          const [exists] = await file.exists();

          if (!exists) {
            // Return default config if file doesn't exist
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              default_keywords: ['fenerbahce', 'galatasaray', 'tedesco'],
              default_time_range: 'last_24_hours',
              default_max_results: 100,
              available_time_ranges: ['last_24_hours', 'last_7_days', 'last_30_days']
            }));
            return;
          }

          const [content] = await file.download();
          const config = JSON.parse(content.toString());

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(config));
        } catch (error: any) {
          console.error('News API config endpoint error:', error);
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
