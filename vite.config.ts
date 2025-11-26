import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import fs from 'fs';

// Custom plugin to proxy GCS requests
const gcsProxyPlugin = () => {
  let storage: Storage;
  let bucketName: string;

  try {
    // Load env from sibling directory
    const envPath = path.resolve(__dirname, '../aisports-functions/.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      
      // Resolve key file path relative to the .env file location
      const keyFilename = path.resolve(path.dirname(envPath), envConfig.GOOGLE_APPLICATION_CREDENTIALS);
      
      storage = new Storage({
        projectId: envConfig.GCP_PROJECT_ID,
        keyFilename: keyFilename,
      });
      bucketName = envConfig.GCS_BUCKET_NAME;
      console.log(`GCS Proxy configured for bucket: ${bucketName}`);
    } else {
      console.warn('GCS Proxy: .env file not found in ../aisports-functions/');
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

          let prefix = `news_data/batch_processing/${region}/`;
          
          if (dateParam) {
            // Structure: news_data/batch_processing/{region}/{YYYY-MM}/{YYYY-MM-DD}/
            const [year, month] = dateParam.split('-');
            prefix = `news_data/batch_processing/${region}/${year}-${month}/${dateParam}/`;
            console.log(`Targeting specific date: ${dateParam}`);
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
          // We ignore stage 1 as requested
          const resultFiles = files.filter(f => 
            f.name.includes('stage2_deduplication/results') && 
            f.name.endsWith('predictions.jsonl')
          );

          if (resultFiles.length === 0) {
            console.log('No files found.');
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No data found' }));
            return;
          }

          let filesToProcess = [];

          if (dateParam) {
            // If a specific date is selected, we get ALL runs for that day
            filesToProcess = resultFiles;
            console.log(`Found ${filesToProcess.length} runs for date ${dateParam}`);
          } else {
            // Default behavior: Get ALL files from current month
            filesToProcess = resultFiles;
            console.log(`Found ${filesToProcess.length} files for current month`);
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
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
