import express from 'express';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { OAuth2Client } from 'google-auth-library';
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
const USER_PREFERENCES_FOLDER = 'user_preferences/';

// Fallback allowed emails (used if GCS config not available)
const FALLBACK_ALLOWED_EMAILS = [
  'oktay.burak.ertas@gmail.com', 
];

// Initialize Clients
const storage = new Storage({ projectId: PROJECT_ID });
const pubsub = new PubSub({ projectId: PROJECT_ID });
const authClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- HELPER FUNCTIONS ---

/**
 * Generate a hash of the email for folder naming
 */
const hashEmail = (email) => {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
};

/**
 * Load allowed users from GCS config
 */
const loadAllowedUsers = async () => {
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
    return config.allowed_users || FALLBACK_ALLOWED_EMAILS;
  } catch (error) {
    console.error('Error loading allowed users from GCS:', error);
    return FALLBACK_ALLOWED_EMAILS;
  }
};

/**
 * Load admin users from GCS config
 */
const loadAdminUsers = async () => {
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
    return config.admin_users || [];
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

app.use(express.json());

// --- AUTH MIDDLEWARE ---
const requireAuth = async (req, res, next) => {
  // Allow public access to static files so the login page can load
  if (!req.path.startsWith('/api/')) {
    return next();
  }

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
    const emailHash = hashEmail(req.user.email);
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(`${USER_PREFERENCES_FOLDER}${emailHash}/preferences.json`);
    
    // Check if preferences already exist to preserve createdAt
    let existingPrefs = {};
    const [exists] = await file.exists();
    if (exists) {
      const [content] = await file.download();
      existingPrefs = JSON.parse(content.toString());
    }
    
    const preferences = {
      email: req.user.email,
      scraperConfig: req.body.scraperConfig || existingPrefs.scraperConfig,
      feedSettings: req.body.feedSettings || existingPrefs.feedSettings,
      createdAt: existingPrefs.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await file.save(JSON.stringify(preferences, null, 2), {
      contentType: 'application/json'
    });
    
    console.log(`Saved preferences for ${req.user.email} to ${USER_PREFERENCES_FOLDER}${emailHash}/preferences.json`);
    res.json(preferences);
  } catch (error) {
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

// GET /api/config/admin-users - Get admin users (admin only)
app.get('/api/config/admin-users', async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const adminUsers = await loadAdminUsers();
    res.json({ admin_users: adminUsers });
  } catch (error) {
    console.error('Error loading admin users:', error);
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

    let prefix = `news_data/batch_processing/${region}/`;

    if (dateParam) {
      const [year, month] = dateParam.split('-');
      prefix = `news_data/batch_processing/${region}/${year}-${month}/${dateParam}/`;
    } else if (lastNDays > 0) {
      // Fetching data from last N days
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      prefix = `news_data/batch_processing/${region}/${year}-${month}/`;
    }

    console.log(`Looking for files in ${BUCKET_NAME} with prefix ${prefix}...`);

    const [files] = await storage.bucket(BUCKET_NAME).getFiles({ prefix });

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
          // Extract run folder path from predictions file path
          // Example: news_data/batch_processing/tr/2025-12/2025-12-13/run_21-51-39/stage2_deduplication/results/...predictions.jsonl
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
              // No metadata = system triggered (historical data)
              if (targetEmail === 'system') {
                filteredFiles.push(file);
              }
            }
          }
        } catch (err) {
          console.warn(`Error checking metadata for ${file.name}:`, err.message);
          // Include file if we can't determine ownership (backward compatibility)
          if (triggeredByFilter === 'all' || !triggeredByFilter) {
            filteredFiles.push(file);
          }
        }
      }
      resultFiles = filteredFiles;
    }

    if (resultFiles.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Sort by name descending (latest first)
    resultFiles.sort((a, b) => b.name.localeCompare(a.name));

    let filesToProcess = latestOnly ? [resultFiles[0]] : resultFiles;
    let allArticles = [];

    for (const file of filesToProcess) {
      const [content] = await file.download();
      const fileContent = content.toString();
      const lines = fileContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          // Logic copied from vite.config.ts
          if (json.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = json.response.candidates[0].content.parts[0].text;
            const cleanText = text.replace(/```json\n?|\n?```/g, '');
            try {
              const parsedInner = JSON.parse(cleanText);
              if (parsedInner.processed_articles) allArticles.push(...parsedInner.processed_articles);
              else if (parsedInner.consolidated_articles) allArticles.push(...parsedInner.consolidated_articles);
              else if (Array.isArray(parsedInner)) allArticles.push(...parsedInner);
              else if (parsedInner.title) allArticles.push(parsedInner);
            } catch (e) { console.error('Error parsing inner JSON:', e); }
          } else if (json.title && json.summary && json.original_url) {
            allArticles.push(json);
          } else if (Array.isArray(json)) {
            allArticles.push(...json);
          } else if (json.prediction) {
            if (Array.isArray(json.prediction)) allArticles.push(...json.prediction);
            else allArticles.push(json.prediction);
          }
        } catch (err) {
          console.error('Error parsing line in file ' + file.name, err);
        }
      }
    }

    res.json(allArticles);
  } catch (error) {
    console.error('GCS Proxy Request Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trigger-scraper
app.post('/api/trigger-scraper', async (req, res) => {
  if (!SCRAPING_TOPIC) {
    return res.status(500).json({ error: 'SCRAPING_REQUEST_TOPIC not configured' });
  }

  try {
    const payload = {
      ...req.body,
      triggered_by: req.user.email  // Add user email to track who triggered the scrape
    };
    console.log(`Triggering scraper for ${payload.collection_id} by ${req.user.email}:`, payload);

    const topicPath = pubsub.topic(SCRAPING_TOPIC);
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const messageId = await topicPath.publishMessage({ data: dataBuffer });

    console.log(`✅ Published message ${messageId} to topic ${SCRAPING_TOPIC}`);
    res.json({ 
      success: true, 
      messageId,
      region: payload.collection_id,
      sourcesCount: payload.urls ? payload.urls.length : 0,
      triggeredBy: req.user.email
    });
  } catch (error) {
    console.error('Scraper trigger error:', error);
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
