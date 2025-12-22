/**
 * GCS API Service
 * 
 * Centralized API client for the GCS API Cloud Function.
 * Handles all API calls to the unified GCS API endpoint.
 */

// API Configuration from environment
const GCS_API_URL = import.meta.env.VITE_GCS_API_URL || '';
const API_KEY = import.meta.env.VITE_GCS_API_KEY;

/**
 * Make an authenticated request to the GCS API
 */
async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    token?: string;
    body?: any;
    useApiKey?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', token, body, useApiKey = false } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Use Bearer token for user-authenticated requests
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use API key for article fetching (backward compatibility)
  if (useApiKey && API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  const url = `${GCS_API_URL}${path}`;
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// USER ENDPOINTS
// =============================================================================

export interface UserInfo {
  email: string;
  name: string;
  picture: string;
  isAdmin: boolean;
}

export async function getUser(token: string): Promise<UserInfo> {
  return apiRequest<UserInfo>('/user', { token });
}

// =============================================================================
// PREFERENCES ENDPOINTS
// =============================================================================

export interface ScraperRegionConfig {
  id: 'eu' | 'tr';
  name: string;
  keywords: string[];
  sources: Array<{ id: string; name: string; url: string; enabled: boolean }>;
  scrapeDepth: number;
}

export interface UserScraperConfig {
  eu: ScraperRegionConfig;
  tr: ScraperRegionConfig;
}

export interface UserPreferences {
  email?: string;
  scraperConfig: UserScraperConfig | null;
  feedSettings?: {
    defaultRegion?: string;
    autoRefresh?: boolean;
    feedFilter?: string;
  };
  createdAt?: string;
  lastUpdated?: string;
}

export async function getPreferences(token: string): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/user/preferences', { token });
}

export async function savePreferences(
  token: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/user/preferences', {
    method: 'PUT',
    token,
    body: preferences,
  });
}

// =============================================================================
// CONFIG ENDPOINTS
// =============================================================================

export interface NewsApiConfig {
  default_keywords: string[];
  default_time_range: string;
  default_max_results: number;
  available_time_ranges: string[];
}

export async function getNewsApiConfig(token: string): Promise<NewsApiConfig> {
  return apiRequest<NewsApiConfig>('/config/news-api', { token });
}

// =============================================================================
// TRIGGER ENDPOINTS
// =============================================================================

export interface TriggerScraperRequest {
  urls: string[];
  keywords: string[];
  region: 'eu' | 'tr';
  scrape_depth?: number;
  persist?: boolean;
}

export interface TriggerResponse {
  success: boolean;
  messageId: string;
  triggeredBy: string;
}

export async function triggerScraper(
  token: string,
  request: TriggerScraperRequest
): Promise<TriggerResponse & { region: string; sourcesCount: number }> {
  return apiRequest('/trigger/scraper', {
    method: 'POST',
    token,
    body: request,
  });
}

export interface TriggerNewsApiRequest {
  keywords: string[];
  time_range?: string;
  max_results?: number;
}

export async function triggerNewsApi(
  token: string,
  request: TriggerNewsApiRequest
): Promise<TriggerResponse & { keywords: string[] }> {
  return apiRequest('/trigger/news-api', {
    method: 'POST',
    token,
    body: request,
  });
}

// =============================================================================
// ARTICLES ENDPOINT
// =============================================================================

export interface ArticleEntry {
  article_id: string;
  original_url: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  publish_date: string;
  categories: Array<{ tag: string; confidence: number }>;
  key_entities: Record<string, string[]>;
  language: string;
  region: string;
  source_type: 'api' | 'scraped';
  summary_translation?: string;
  x_post?: string;
}

export async function getArticles(options: {
  region?: string;
  startDate?: string;
  endDate?: string;
  lastNDays?: number;
  search?: string;
  noCache?: boolean;
}): Promise<ArticleEntry[]> {
  const params = new URLSearchParams();
  
  if (options.region) params.append('region', options.region);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.lastNDays) params.append('last_n_days', options.lastNDays.toString());
  if (options.search) params.append('search', options.search);
  if (options.noCache) params.append('no_cache', 'true');

  const queryString = params.toString();
  const path = queryString ? `/articles?${queryString}` : '/articles';

  return apiRequest<ArticleEntry[]>(path, { useApiKey: true });
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Check if GCS API is configured
 */
export function isGcsApiConfigured(): boolean {
  return !!GCS_API_URL;
}

/**
 * Get the GCS API URL for debugging
 */
export function getGcsApiUrl(): string {
  return GCS_API_URL || '';
}
