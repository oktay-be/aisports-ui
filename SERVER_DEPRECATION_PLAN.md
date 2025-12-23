# Plan: Strip API from server.js - Keep as Static File Server Only

## Goal
Remove all API endpoints from aisports-ui's server.js, keeping only static file serving. All API calls will go to gcs_api_function.

---

## Current State Analysis

### server.js API Endpoints (to be removed)
| Endpoint | Purpose | Status in gcs_api |
|----------|---------|-------------------|
| `GET /api/user` | Get current user info | ✅ EXISTS |
| `GET /api/user/preferences` | Get/save user prefs | ✅ EXISTS |
| `PUT /api/user/preferences` | Save user preferences | ✅ EXISTS |
| `GET /api/config/allowed-users` | Admin: list allowed users | ❌ MISSING |
| `GET /api/config/admin-users` | Get user's admin status | ❌ MISSING |
| `GET /api/config/news-api` | Get News API config | ✅ EXISTS |
| `GET /api/news` | Fetch articles (eu/tr/diff) | ✅ EXISTS (as /articles) |
| `POST /api/trigger-scraper` | Trigger scraper | ✅ EXISTS |
| `POST /api/trigger-news-api` | Trigger News API fetch | ✅ EXISTS |

**Only 2 endpoints need to be added to gcs_api:** `/config/allowed-users` and `/config/admin-users`

---

## Approach: Minimal Static Server

Keep server.js but strip it to ~20 lines:

```javascript
// server.js (after refactor)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;

// Serve static files
app.use(express.static('dist'));

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`Server on port ${port}`));
```

---

## Implementation Steps

### Phase 1: Add Missing Endpoints to gcs_api_function
**File:** `aisports-functions/gcs_api_function/main.py`

Add:
- `GET /config/allowed-users` (admin only) - copy from server.js
- `GET /config/admin-users` (user's admin status) - copy from server.js

### Phase 2: No UI Changes Needed - Already Migrated!
**Finding:** `aisports-ui/services/gcsApiService.ts` already points ALL API calls to `VITE_GCS_API_URL`:
- `/user` ✅
- `/user/preferences` ✅
- `/config/news-api` ✅
- `/trigger/scraper` ✅
- `/trigger/news-api` ✅
- `/articles` ✅

**server.js API code is effectively dead code** - the UI already uses gcs_api exclusively.

### Phase 3: Strip server.js
**File:** `aisports-ui/server.js`

Remove:
- All imports except express, path, fileURLToPath
- All middleware (express.json, rate limiters)
- All API route handlers (/api/*)
- All GCS/PubSub/OAuth client code
- All helper functions (hashEmail, loadAllowedUsers, etc.)
- All validation schemas

Keep:
- express.static('dist')
- SPA catch-all route
- app.listen()

### Phase 4: Clean Up Dependencies
**File:** `aisports-ui/package.json`

Remove from dependencies:
- `@google-cloud/storage`
- `@google-cloud/pubsub`
- `google-auth-library`
- `express-rate-limit`
- `zod`
- `crypto` (built-in, no need to list)

Keep:
- `express`

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `gcs_api_function/main.py` | MODIFY | Add 2 missing endpoints |
| `aisports-ui/server.js` | MODIFY | Strip to static-only (~750 lines removed) |
| `aisports-ui/package.json` | MODIFY | Remove server deps |
| `aisports-ui/.github/workflows/deploy-ui.yml` | MODIFY | Remove env vars no longer needed |
| `aisports-ui/vite.config.ts` | MODIFY | Strip dev server API middleware (~500 lines) |

---

## Benefits

1. **Same deployment workflow** - Cloud Run still works
2. **Simpler server.js** - 20 lines vs 780 lines
3. **Centralized API** - All business logic in gcs_api_function
4. **Fewer dependencies** - Remove 5 npm packages from UI
5. **Easier maintenance** - One place to update API logic

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API compatibility | Test all endpoints on gcs_api before stripping server.js |
| Missing endpoints | Add /config/allowed-users and /config/admin-users first |
| UI breaks | UI already uses gcsApiService.ts - no changes needed |
