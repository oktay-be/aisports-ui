import express from 'express';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { OAuth2Client } from 'google-auth-library';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// --- CONFIGURATION ---
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const SCRAPING_TOPIC = process.env.SCRAPING_REQUEST_TOPIC || 'scraping-requests';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// GCS Config paths
const CONFIG_FOLDER = 'config/';
const USER_PREFERENCES_FOLDER = 'config/user_preferences/';
const AUDIT_LOG_FOLDER = 'audit_logs/';

// Fallback allowed emails (used if GCS config not available)
const FALLBACK_ALLOWED_EMAILS = [
  'oktay.burak.ertas@gmail.com',
];

// Initialize Clients
const storage = new Storage({ projectId: PROJECT_ID });
const pubsub = new PubSub({ projectId: PROJECT_ID });
const authClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- CACHING LAYER (Fix N+1 Query Problem) ---
const CACHE = {
  allowedUsers: { data: null, timestamp: null, TTL: 5 * 60 * 1000 }, // 5 minutes
  adminUsers: { data: null, timestamp: null, TTL: 5 * 60 * 1000 },
};

const isCacheValid = (cacheEntry) => {
  return cacheEntry.data !== null &&
         cacheEntry.timestamp !== null &&
         (Date.now() - cacheEntry.timestamp) < cacheEntry.TTL;
};

// --- VALIDATION SCHEMAS ---
const TriggerScraperSchema = z.object({
  collection_id: z.enum(['eu', 'tr', 'us'], { errorMap: () => ({ message: 'Invalid region' }) }),
  urls: z.array(z.string().url('Invalid URL format')).min(1, 'At least one URL required').max(50, 'Maximum 50 URLs allowed'),
  options: z.object({}).optional(),
});

const TriggerNewsAPISchema = z.object({
  keywords: z.array(z.string().min(1)).max(20, 'Maximum 20 keywords').optional(),
  time_range: z.enum(['last_24_hours', 'last_7_days', 'last_30_days']).optional(),
  max_results: z.number().int().min(1).max(100).optional(),
});

const UserPreferencesSchema = z.object({
  scraperConfig: z.any().optional(),
  feedSettings: z.object({
    defaultRegion: z.enum(['eu', 'tr', 'us']).optional(),
    autoRefresh: z.boolean().optional(),
  }).optional(),
});

// --- RATE LIMITERS ---
const scraperLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 scraper triggers per 15 minutes
  keyGenerator: (req) => req.user.email,
  message: 'Too many scraper requests. Please try again later.'
});

const newsAPILimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 API fetches per 15 minutes
  keyGenerator: (req) => req.user.email,
  message: 'Too many API requests. Please try again later.'
});

// --- HELPER FUNCTIONS ---

/**
 * Generate a hash of the email for folder naming
 */
const hashEmail = (email) => {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
};

/**
 * Load allowed users from GCS config (WITH CACHING)
 */
const loadAllowedUsers = async () => {
  // Check cache first
  if (isCacheValid(CACHE.allowedUsers)) {
    return CACHE.allowedUsers.data;
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`${CONFIG_FOLDER}allowed_users.json`);
    const [exists] = await file.exists();

    if (!exists) {
      console.warn('allowed_users.json not found in GCS, using fallback list');
      return FALLBACK_ALLOWED_EMAILS;
    }

    const [content] = await file.download();
    const config = JSON.parse(content.toString());
    const users = config.allowed_users || FALLBACK_ALLOWED_EMAILS;

    // Update cache
    CACHE.allowedUsers.data = users;
    CACHE.allowedUsers.timestamp = Date.now();

    return users;
  } catch (error) {
    console.error('Error loading allowed users from GCS:', error);
    return FALLBACK_ALLOWED_EMAILS;
  }
};

/**
 * Load admin users from GCS config (WITH CACHING)
 */
const loadAdminUsers = async () => {
  // Check cache first
  if (isCacheValid(CACHE.adminUsers)) {
    return CACHE.adminUsers.data;
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`${CONFIG_FOLDER}admin_users.json`);
    const [exists] = await file.exists();

    if (!exists) {
      console.warn('admin_users.json not found in GCS');
      return [];
    }

    const [content] = await file.download();
    const config = JSON.parse(content.toString());
    const admins = config.admin_users || [];

    // Update cache
    CACHE.adminUsers.data = admins;
    CACHE.adminUsers.timestamp = Date.now();

    return admins;
  } catch (error) {
    console.error('Error loading admin users from GCS:', error);
    return [];
  }
};

/**
 * Check if a user is an admin
 */
const isAdmin = async (email) => {
  const adminUsers = await loadAdminUsers();
  return adminUsers.includes(email);
};

/**
 * Write audit log entry
 */
const writeAuditLog = async (action, user, metadata = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const logEntry = {
      timestamp,
      action,
      user,
      ...metadata
    };

    const logFile = storage.bucket(BUCKET_NAME).file(
      `${AUDIT_LOG_FOLDER}${date}/audit.jsonl`
    );

    // Append to log file
    await logFile.save(JSON.stringify(logEntry) + '\n', {
      resumable: false,
      contentType: 'application/x-ndjson',
      metadata: {
        contentType: 'application/x-ndjson',
        metadata: { appendMode: 'true' }
      }
    });
  } catch (error) {
    console.error('Error writing audit log:', error);
    // Don't throw - audit logging shouldn't break the request
  }
};

app.use(express.json());

// --- AUTH MIDDLEWARE ---
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const ticket = await authClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email'];

    // Load allowed users from GCS
    const allowedEmails = await loadAllowedUsers();
    
    if (allowedEmails.includes(email)) {
      // Check if user is admin
      req.user = payload;
      req.user.isAdmin = await isAdmin(email);
      next();
    } else {
      console.warn(`Access denied for email: ${email}`);
      res.status(403).json({ error: 'Access denied: Email not in allowlist' });
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply Auth Middleware to API routes
app.use('/api', requireAuth);

// --- API ROUTES ---

// GET /api/user - Get current user info
app.get('/api/user', async (req, res) => {
  res.json({
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    isAdmin: req.user.isAdmin
  });
});

// GET /api/user/preferences - Get user preferences from GCS
app.get('/api/user/preferences', async (req, res) => {
  try {
    const emailHash = hashEmail(req.user.email);
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`${USER_PREFERENCES_FOLDER}${emailHash}/preferences.json`);
    
    const [exists] = await file.exists();
    if (!exists) {
      // Return default preferences for new users
      return res.json({
        email: req.user.email,
        scraperConfig: null,
        feedSettings: {
          defaultRegion: 'tr',
          autoRefresh: false
        },
        createdAt: null,
        lastUpdated: null
      });
    }
    
    const [content] = await file.download();
    const preferences = JSON.parse(content.toString());
    res.json(preferences);
  } catch (error) {
    console.error('Error loading user preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/user/preferences - Save user preferences to GCS
app.put('/api/user/preferences', async (req, res) => {
  try {
    // Validate input
    const validated = UserPreferencesSchema.parse(req.body);

    const emailHash = hashEmail(req.user.email);
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`${USER_PREFERENCES_FOLDER}${emailHash}/preferences.json`);

    // Check if preferences already exist to preserve createdAt and version
    let existingPrefs = { version: 0 };
    const [exists] = await file.exists();
    if (exists) {
      const [content] = await file.download();
      existingPrefs = JSON.parse(content.toString());
    }

    const preferences = {
      email: req.user.email,
      scraperConfig: validated.scraperConfig !== undefined ? validated.scraperConfig : existingPrefs.scraperConfig,
      feedSettings: validated.feedSettings !== undefined ? validated.feedSettings : existingPrefs.feedSettings,
      createdAt: existingPrefs.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      version: (existingPrefs.version || 0) + 1
    };

    await file.save(JSON.stringify(preferences, null, 2), {
      contentType: 'application/json'
    });

    console.log(`Saved preferences for ${req.user.email} to ${USER_PREFERENCES_FOLDER}${emailHash}/preferences.json`);
    res.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error saving user preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/allowed-users - Get allowed users (admin only)
app.get('/api/config/allowed-users', async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const allowedUsers = await loadAllowedUsers();
    res.json({ allowed_users: allowedUsers });
  } catch (error) {
    console.error('Error loading allowed users:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/admin-users - Get current user's admin status (NOT the full admin list)
app.get('/api/config/admin-users', async (req, res) => {
  try {
    // Only return the current user's admin status, not the full list
    // This prevents exposing who the admins are for security reasons
    res.json({
      email: req.user.email,
      isAdmin: req.user.isAdmin
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/news-api - Get News API configuration
app.get('/api/config/news-api', async (req, res) => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file('config/news_api_config.json');
    const [exists] = await file.exists();

    if (!exists) {
      // Return default config if file doesn't exist
      return res.json({
        default_keywords: ['fenerbahce', 'galatasaray', 'tedesco'],
        default_time_range: 'last_24_hours',
        default_max_results: 50,
        available_time_ranges: ['last_24_hours', 'last_7_days', 'last_30_days']
      });
    }

    const [content] = await file.download();
    const config = JSON.parse(content.toString());
    res.json(config);
  } catch (error) {
    console.error('Error loading news API config:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/news
app.get('/api/news', async (req, res) => {
  if (!BUCKET_NAME) {
    return res.status(500).json({ error: 'GCS_BUCKET_NAME not configured' });
  }

  try {
    const region = req.query.region || 'eu';
    const dateParam = req.query.date; // YYYY-MM-DD
    const latestOnly = req.query.latest === 'true';
    const lastNDays = parseInt(req.query.last_n_days || '0');
    const triggeredByFilter = req.query.triggered_by; // 'me', 'all', or specific email

    let allArticles = [];

    // --- FETCH FROM SCRAPED DATA (batch_processing path) ---
    let scraperPrefix = `news_data/batch_processing/${region}/`;

    if (dateParam) {
      const [year, month] = dateParam.split('-');
      scraperPrefix = `news_data/batch_processing/${region}/${year}-${month}/${dateParam}/`;
    } else if (lastNDays > 0) {
      // Fetching data from last N days - prefix stays broad
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      scraperPrefix = `news_data/batch_processing/${region}/${year}-${month}/`;
    }

    console.log(`Looking for scraped files in ${BUCKET_NAME} with prefix ${scraperPrefix}...`);

    const [scraperFiles] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: scraperPrefix });

    // Filter for stage 2 prediction results
    let resultFiles = scraperFiles.filter(f => 
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

    // Apply triggered_by filter if specified
    if (triggeredByFilter && triggeredByFilter !== 'all') {
      const targetEmail = triggeredByFilter === 'me' ? req.user.email : triggeredByFilter;
      
      // Non-admins can only filter by 'me'
      if (triggeredByFilter !== 'me' && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required to view other users\' feeds' });
      }
      
      // Filter result files by checking metadata.json in the same run folder
      const filteredFiles = [];
      for (const file of resultFiles) {
        try {
          const runFolderMatch = file.name.match(/(news_data\/batch_processing\/[^/]+\/\d{4}-\d{2}\/\d{4}-\d{2}-\d{2}\/run_[^/]+)\//);
          if (runFolderMatch) {
            const metadataPath = `${runFolderMatch[1]}/metadata.json`;
            const metadataFile = storage.bucket(BUCKET_NAME).file(metadataPath);
            const [metadataExists] = await metadataFile.exists();
            
            if (metadataExists) {
              const [metadataContent] = await metadataFile.download();
              const metadata = JSON.parse(metadataContent.toString());
              const triggeredBy = metadata.triggered_by || 'system';
              
              if (triggeredBy === targetEmail) {
                filteredFiles.push(file);
              }
            } else {
              if (targetEmail === 'system') {
                filteredFiles.push(file);
              }
            }
          }
        } catch (err) {
          console.warn(`Error checking metadata for ${file.name}:`, err.message);
          if (triggeredByFilter === 'all' || !triggeredByFilter) {
            filteredFiles.push(file);
          }
        }
      }
      resultFiles = filteredFiles;
    }

    // Sort by name descending (latest first)
    resultFiles.sort((a, b) => b.name.localeCompare(a.name));

    let filesToProcess = latestOnly ? (resultFiles.length > 0 ? [resultFiles[0]] : []) : resultFiles;

    // Process scraped files
    for (const file of filesToProcess) {
      const [content] = await file.download();
      const fileContent = content.toString();
      const lines = fileContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          let articlesToAdd = [];
          
          if (json.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = json.response.candidates[0].content.parts[0].text;
            const cleanText = text.replace(/```json\n?|\n?```/g, '');
            try {
              const parsedInner = JSON.parse(cleanText);
              if (parsedInner.processed_articles) articlesToAdd = parsedInner.processed_articles;
              else if (parsedInner.consolidated_articles) articlesToAdd = parsedInner.consolidated_articles;
              else if (Array.isArray(parsedInner)) articlesToAdd = parsedInner;
              else if (parsedInner.title) articlesToAdd = [parsedInner];
            } catch (e) { console.error('Error parsing inner JSON:', e); }
          } else if (json.title && json.summary && json.original_url) {
            articlesToAdd = [json];
          } else if (Array.isArray(json)) {
            articlesToAdd = json;
          } else if (json.prediction) {
            if (Array.isArray(json.prediction)) articlesToAdd = json.prediction;
            else articlesToAdd = [json.prediction];
          }
          
          // Add source_type: 'scraped' to each article
          for (const article of articlesToAdd) {
            article.source_type = 'scraped';
            allArticles.push(article);
          }
        } catch (err) {
          console.error('Error parsing line in file ' + file.name, err);
        }
      }
    }

    // --- FETCH FROM API DATA (news_data/api path) ---
    let apiPrefix = `news_data/api/`;

    if (dateParam) {
      const [year, month] = dateParam.split('-');
      apiPrefix = `news_data/api/${year}-${month}/${dateParam}/`;
    } else if (lastNDays > 0) {
      // Keep broad prefix for N days lookup
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      apiPrefix = `news_data/api/${year}-${month}/`;
    }

    console.log(`Looking for API-fetched files in ${BUCKET_NAME} with prefix ${apiPrefix}...`);

    try {
      const [apiFiles] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: apiPrefix });
      
      // Filter for articles.json files
      let apiResultFiles = apiFiles.filter(f => f.name.endsWith('articles.json'));
      
      // If fetching last N days, filter by date
      if (lastNDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - lastNDays);
        
        apiResultFiles = apiResultFiles.filter(f => {
          const match = f.name.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            const fileDate = new Date(match[0]);
            return fileDate >= cutoffDate;
          }
          return false;
        });
      }

      // Sort by name descending (latest first)
      apiResultFiles.sort((a, b) => b.name.localeCompare(a.name));

      let apiFilesToProcess = latestOnly ? (apiResultFiles.length > 0 ? [apiResultFiles[0]] : []) : apiResultFiles;

      // Process API files
      for (const file of apiFilesToProcess) {
        try {
          const [content] = await file.download();
          const data = JSON.parse(content.toString());
          
          if (data.articles && Array.isArray(data.articles)) {
            for (const article of data.articles) {
              // Transform API article to match ProcessedArticle schema
              const transformedArticle = {
                article_id: article.article_id || `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                original_url: article.url || article.original_url,
                title: article.title || 'Untitled',
                summary: article.content || article.summary || article.description || '',
                source: article.source || article.api_source || 'News API',
                published_date: article.published_at || article.published_date || new Date().toISOString(),
                categories: article.categories || [],
                key_entities: article.key_entities || {
                  competitions: [],
                  locations: [],
                  players: [],
                  teams: []
                },
                content_quality: article.content_quality || 'medium',
                confidence: article.confidence || 0.5,
                language: article.language || 'en',
                summary_translation: article.summary_translation,
                x_post: article.x_post,
                source_type: 'api',
                image_url: article.image_url
              };
              allArticles.push(transformedArticle);
            }
            console.log(`Added ${data.articles.length} articles from API file: ${file.name}`);
          }
        } catch (err) {
          console.error('Error parsing API file ' + file.name, err);
        }
      }
    } catch (apiErr) {
      console.warn('Error fetching API news data (may not exist yet):', apiErr.message);
    }

    // --- DEDUPLICATE BY URL ---
    const seenUrls = new Set();
    const uniqueArticles = [];
    for (const article of allArticles) {
      const url = article.original_url || article.url;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueArticles.push(article);
      }
    }

    if (uniqueArticles.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    console.log(`Returning ${uniqueArticles.length} unique articles (${allArticles.length - uniqueArticles.length} duplicates removed)`);
    res.json(uniqueArticles);
  } catch (error) {
    console.error('GCS Proxy Request Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trigger-scraper
app.post('/api/trigger-scraper', scraperLimiter, async (req, res) => {
  if (!SCRAPING_TOPIC) {
    return res.status(500).json({ error: 'SCRAPING_REQUEST_TOPIC not configured' });
  }

  try {
    // Validate input
    const validated = TriggerScraperSchema.parse(req.body);

    // Validate URLs are http/https only
    for (const url of validated.urls) {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
      }
    }

    const payload = {
      ...validated,
      triggered_by: req.user.email  // Add user email to track who triggered the scrape
    };
    console.log(`Triggering scraper for ${payload.collection_id} by ${req.user.email}:`, payload);

    const topicPath = pubsub.topic(SCRAPING_TOPIC);
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const messageId = await topicPath.publishMessage({ data: dataBuffer });

    // Write audit log
    await writeAuditLog('trigger_scraper', req.user.email, {
      region: payload.collection_id,
      urlCount: payload.urls.length,
      messageId
    });

    console.log(`✅ Published message ${messageId} to topic ${SCRAPING_TOPIC}`);
    res.json({
      success: true,
      messageId,
      region: payload.collection_id,
      sourcesCount: payload.urls.length,
      triggeredBy: req.user.email
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Scraper trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trigger-news-api
const NEWS_API_TOPIC = process.env.NEWS_API_REQUEST_TOPIC || 'news-api-requests';

app.post('/api/trigger-news-api', newsAPILimiter, async (req, res) => {
  try {
    // Validate input
    const validated = TriggerNewsAPISchema.parse(req.body);

    const payload = {
      keywords: validated.keywords || ['fenerbahce', 'galatasaray', 'tedesco'],
      time_range: validated.time_range || 'last_24_hours',
      max_results: validated.max_results || 50,
      triggered_by: req.user.email
    };
    console.log(`Triggering News API fetch by ${req.user.email}:`, payload);

    const topicPath = pubsub.topic(NEWS_API_TOPIC);
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const messageId = await topicPath.publishMessage({ data: dataBuffer });

    // Write audit log
    await writeAuditLog('trigger_news_api', req.user.email, {
      keywords: payload.keywords,
      time_range: payload.time_range,
      max_results: payload.max_results,
      messageId
    });

    console.log(`✅ Published message ${messageId} to topic ${NEWS_API_TOPIC}`);
    res.json({
      success: true,
      messageId,
      keywords: payload.keywords,
      triggeredBy: req.user.email
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('News API trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- STATIC FILES ---
app.use(express.static('dist'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

export { app };

// Always listen on the port, regardless of environment
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
