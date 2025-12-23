/**
 * Minimal Static File Server
 *
 * Serves the built React application from the dist/ folder.
 * All API calls are handled by gcs_api_function (Cloud Function).
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from dist/
app.use(express.static('dist'));

// SPA catch-all: serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Static server listening on port ${port}`);
});
