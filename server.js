import express from 'express';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { OAuth2Client } from 'google-auth-library';
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

// HARDCODED ALLOWED EMAILS
const ALLOWED_EMAILS = [
  'oktay.burak.ertas@gmail.com', 
  // Add other emails here
];

// Initialize Clients
const storage = new Storage({ projectId: PROJECT_ID });
const pubsub = new PubSub({ projectId: PROJECT_ID });
const authClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(express.json());

// --- AUTH MIDDLEWARE ---
const requireAuth = async (req, res, next) => {
  // Allow public access to static files so the login page can load
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For now, if no token is present, we might want to return 401.
    // But if the user hasn't implemented frontend auth yet, this will block everything.
    // I will enforce it as requested.
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

    if (ALLOWED_EMAILS.includes(email)) {
      req.user = payload;
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
    const payload = req.body;
    console.log(`Triggering scraper for ${payload.collection_id}:`, payload);

    const topicPath = pubsub.topic(SCRAPING_TOPIC);
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const messageId = await topicPath.publishMessage({ data: dataBuffer });

    console.log(`✅ Published message ${messageId} to topic ${SCRAPING_TOPIC}`);
    res.json({ 
      success: true, 
      messageId,
      region: payload.collection_id,
      sourcesCount: payload.urls ? payload.urls.length : 0
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
