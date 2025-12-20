# Multi-User Architecture

This document describes the multi-user system for NewsPulse, including user authentication, preferences storage, run ownership, and feed filtering.

## Overview

The system supports multiple users with:
- **Google OAuth authentication** with GCS-based allowlist
- **User preferences** stored in GCS, auto-saved on every change
- **Run ownership** via `triggered_by` field in metadata
- **Feed filtering** by user (My Feeds / All Feeds)
- **Admin capabilities** for viewing all users' feeds

## GCS Folder Structure

```
gs://aisports-scraping/
├── config/
│   ├── allowed_users.json      # List of allowed user emails
│   └── admin_users.json        # List of admin user emails
├── user_preferences/
│   └── {email_hash}/           # SHA256(email).slice(0,16)
│       └── preferences.json    # User's scraper config, feed settings
└── news_data/
    ├── sources/{region}/{date}/{domain}/
    │   └── session_data_*.json # Contains: triggered_by
    └── batch_processing/{region}/{date}/run_{time}/
        ├── metadata.json       # Contains: triggered_by
        ├── stage1_extraction/
        └── stage2_deduplication/
            └── results/predictions.jsonl
```

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UI User   │────▶│  server.js  │────▶│ scraper_function│────▶│ batch_builder   │
│ (triggers)  │     │ (adds email)│     │ (session_data)  │     │ (metadata.json) │
└─────────────┘     └─────────────┘     └─────────────────┘     └─────────────────┘
                           │                    │                        │
                           ▼                    ▼                        ▼
                    triggered_by:        triggered_by:           triggered_by:
                    "user@email.com"     in session_data         in metadata.json
```

## Key Fields

### `triggered_by`
- **Type**: `string`
- **Format**: User's email address
- **Default**: `"system"` (for automated runs or missing field)
- **Location**: 
  - Pub/Sub message (UI → scraper_function)
  - `session_data.json` (scraper_function)
  - `metadata.json` (batch_builder_function)

### `email_hash`
- **Type**: `string`
- **Format**: First 16 characters of SHA256 hash of email
- **Usage**: GCS folder name for user preferences
- **Example**: `oktay.burak.ertas@gmail.com` → `a1b2c3d4e5f67890`

### `is_admin`
- **Type**: `boolean`
- **Derived**: Email exists in `config/admin_users.json`
- **Capabilities**: Can view all users' feeds, manage users

## API Endpoints

### Config Endpoints

#### `GET /api/config/allowed-users`
Returns list of allowed user emails (admin only).
```json
["user1@email.com", "user2@email.com"]
```

#### `GET /api/config/admin-users`
Returns list of admin user emails (admin only).
```json
["oktay.burak.ertas@gmail.com"]
```

### User Preferences Endpoints

#### `GET /api/user/preferences`
Returns current user's preferences.
```json
{
  "scraperConfig": {
    "keywords": ["..."],
    "scrapeDepth": 2,
    "sources": [...]
  },
  "feedSettings": {
    "defaultRegion": "tr",
    "autoRefresh": false
  },
  "lastUpdated": "2025-12-14T10:30:00Z"
}
```

#### `PUT /api/user/preferences`
Saves user preferences. Called automatically on every config change.
```json
{
  "scraperConfig": {...},
  "feedSettings": {...}
}
```

### News API

#### `GET /api/news`
Query parameters:
- `region`: `eu` | `tr` (required)
- `date`: `YYYY-MM-DD` (optional)
- `triggered_by`: Email filter (optional)
  - Omit or `me`: Show only current user's runs
  - `all`: Show all runs (admin only)
  - `user@email.com`: Show specific user's runs (admin only)

### Scraper Trigger

#### `POST /api/trigger-scraper`
Body:
```json
{
  "keywords": [...],
  "urls": [...],
  "scrape_depth": 2,
  "region": "tr"
}
```
Server automatically adds `triggered_by: req.user.email` to the Pub/Sub message.

## Authentication Flow

1. User clicks "Sign In with Google"
2. Frontend receives ID token from Google
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Server verifies token with Google OAuth
5. Server checks email against `config/allowed_users.json` in GCS
6. If allowed, `req.user` is populated with user info

## User Preferences Flow

1. **On Login**: Frontend calls `GET /api/user/preferences`
2. **Load State**: ScraperTrigger initializes with saved config
3. **On Change**: Frontend calls `PUT /api/user/preferences`
4. **Auto-save**: Every config change triggers immediate save

## Feed Filtering Flow

1. UI displays dropdown: "My Feeds" | "All Feeds" (admin) | User list (admin)
2. API call includes `?triggered_by=` parameter
3. Server reads `metadata.json` from each run folder
4. Filters runs where `metadata.triggered_by` matches filter
5. Returns only matching predictions.jsonl content

## Backward Compatibility

- **Missing `triggered_by`**: Treated as `"system"`
- **Historical data**: Continues to work, shown under "All Feeds" or filtered out when viewing "My Feeds"
- **No migration needed**: Field is handled gracefully when missing

## Config Files Format

### allowed_users.json
```json
{
  "allowed_users": [
    "oktay.burak.ertas@gmail.com",
    "user2@example.com"
  ],
  "last_updated": "2025-12-14T10:00:00Z"
}
```

### admin_users.json
```json
{
  "admin_users": [
    "oktay.burak.ertas@gmail.com"
  ],
  "last_updated": "2025-12-14T10:00:00Z"
}
```

### preferences.json
```json
{
  "email": "user@example.com",
  "scraperConfig": {
    "keywords": ["transfer", "futbol"],
    "scrapeDepth": 2,
    "sources": [
      {"url": "https://example.com", "enabled": true, "name": "Example"}
    ]
  },
  "feedSettings": {
    "defaultRegion": "tr",
    "autoRefresh": false,
    "selectedTags": ["transfers-rumors", "match-results"]
  },
  "createdAt": "2025-12-14T10:00:00Z",
  "lastUpdated": "2025-12-14T10:30:00Z"
}
```

## Implementation Checklist

### Backend (aisports-ui/server.js)
- [ ] Add GCS config endpoints
- [ ] Replace hardcoded ALLOWED_EMAILS with GCS lookup
- [ ] Add user preferences GET/PUT endpoints
- [ ] Add `triggered_by` to scraper trigger
- [ ] Add `triggered_by` filter to news API

### Cloud Functions (aisports-functions)
- [ ] scraper_function: Extract and store `triggered_by`
- [ ] batch_builder_function: Read from session_data, write to metadata.json

### Frontend (aisports-ui)
- [ ] Create userPreferencesService.ts
- [ ] Update App.tsx header with user info and feed filter
- [ ] Update ScraperTrigger.tsx to load/save preferences
