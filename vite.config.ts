import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';
import fs from 'fs';

// Custom plugin to proxy GCS requests and handle scraper triggers
const gcsProxyPlugin = () => {
  let storage: Storage;
  let bucketName: string;
  let pubsub: PubSub;
  let projectId: string;
  let scrapingTopic: string;

  try {
    // Load env from current directory
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      
      // Resolve key file path relative to the .env file location
      const keyFilename = path.resolve(path.dirname(envPath), envConfig.GOOGLE_APPLICATION_CREDENTIALS);
      
      storage = new Storage({
        projectId: envConfig.GCP_PROJECT_ID,
        keyFilename: keyFilename,
      });
      bucketName = envConfig.GCS_BUCKET_NAME;
      projectId = envConfig.GCP_PROJECT_ID;
      scrapingTopic = envConfig.SCRAPING_REQUEST_TOPIC || 'scraping-requests';
      
      // Initialize Pub/Sub client
      pubsub = new PubSub({
        projectId: projectId,
        keyFilename: keyFilename,
      });
      
      console.log(`GCS Proxy configured for bucket: ${bucketName}`);
      console.log(`Pub/Sub configured for topic: ${scrapingTopic}`);
    } else {
      console.warn('GCS Proxy: .env file not found in current directory');
    }
  } catch (e) {
    console.error('GCS Proxy Init Error:', e);
  }

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

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            
            console.log(`Triggering scraper for ${payload.collection_id}:`, payload);
            
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
              sourcesCount: payload.urls.length 
            }));
          } catch (error: any) {
            console.error('Scraper trigger error:', error);
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
