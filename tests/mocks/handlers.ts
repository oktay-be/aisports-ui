/**
 * MSW request handlers for API mocking.
 *
 * Provides mock responses for all GCS API endpoints used by the UI.
 * These handlers are used by both tests and development preview.
 */

import { http, HttpResponse } from 'msw';

// Sample article data for tests
const sampleArticles = [
  {
    article_id: 'test-article-1',
    url: 'https://example.com/article-1',
    title: 'Test Article 1: Transfer News',
    body: 'This is a test article about transfer news. The transfer is worth 50 million euros.',
    summary: 'Test article about a 50M transfer.',
    source: 'example.com',
    publish_date: '2025-12-28T10:00:00',
    language: 'en',
    region: 'eu',
    categories: ['transfer', 'football'],
    key_entities: {
      teams: ['Team A', 'Team B'],
      players: ['Star Player'],
      amounts: ['50 million euros'],
      dates: ['2025-12-28'],
      competitions: [],
      locations: [],
    },
    content_quality: 'high',
    confidence: 0.85,
    x_post: 'Breaking: Star player completes 50M move!',
    merged_from_urls: [
      'https://othernews.com/same-story',
      'https://sportsite.com/transfer',
    ],
  },
  {
    article_id: 'test-article-2',
    url: 'https://example.com/article-2',
    title: 'Test Article 2: Match Preview',
    body: 'Preview of the upcoming match between City and United.',
    summary: 'Derby match preview.',
    source: 'example.com',
    publish_date: '2025-12-28T08:00:00',
    language: 'en',
    region: 'eu',
    categories: ['match-preview'],
    key_entities: {
      teams: ['City', 'United'],
      players: [],
      amounts: [],
      dates: ['this weekend'],
      competitions: ['Premier League'],
      locations: [],
    },
    content_quality: 'medium',
    confidence: 0.75,
    x_post: 'Big derby coming up!',
    merged_from_urls: [],
  },
];

// Sample run data
const sampleRuns = [
  { date: '2025-12-28', run_id: '17-07-10' },
  { date: '2025-12-28', run_id: '14-30-00' },
  { date: '2025-12-27', run_id: '18-00-00' },
];

// Base URL for GCS API (uses environment variable or default)
const GCS_API_BASE = 'http://localhost:8080';

export const handlers = [
  // GET /runs - List available runs
  http.get(`${GCS_API_BASE}/runs`, () => {
    return HttpResponse.json({
      runs: sampleRuns,
      total: sampleRuns.length,
    });
  }),

  // GET /runs/:date/:runId/articles - Get articles for a specific run
  http.get(`${GCS_API_BASE}/runs/:date/:runId/articles`, ({ params }) => {
    const { date, runId } = params;
    return HttpResponse.json({
      articles: sampleArticles,
      total: sampleArticles.length,
      date,
      run_id: runId,
    });
  }),

  // GET /runs/latest/articles - Get articles from latest run
  http.get(`${GCS_API_BASE}/runs/latest/articles`, () => {
    return HttpResponse.json({
      articles: sampleArticles,
      total: sampleArticles.length,
      date: '2025-12-28',
      run_id: '17-07-10',
    });
  }),

  // POST /trigger/scraper - Trigger scraper function
  http.post(`${GCS_API_BASE}/trigger/scraper`, async ({ request }) => {
    const body = await request.json() as { urls?: string[] };
    return HttpResponse.json({
      success: true,
      message: 'Scraper triggered successfully',
      urls_count: body?.urls?.length || 0,
    });
  }),

  // POST /trigger/fetcher - Trigger news API fetcher
  http.post(`${GCS_API_BASE}/trigger/fetcher`, async ({ request }) => {
    const body = await request.json() as { keywords?: string[] };
    return HttpResponse.json({
      success: true,
      message: 'Fetcher triggered successfully',
      keywords: body?.keywords || [],
    });
  }),

  // GET /health - Health check
  http.get(`${GCS_API_BASE}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  serverError: http.get(`${GCS_API_BASE}/runs`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  notFound: http.get(`${GCS_API_BASE}/runs/:date/:runId/articles`, () => {
    return HttpResponse.json(
      { error: 'Run not found' },
      { status: 404 }
    );
  }),

  unauthorized: http.get(`${GCS_API_BASE}/runs`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),
};
