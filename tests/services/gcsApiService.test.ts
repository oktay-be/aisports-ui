import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Note: The service reads import.meta.env at module load time,
// so we test the behavior with whatever env is set in tests
const GCS_API_BASE = 'http://localhost:8080';

describe('gcsApiService', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should fetch user info successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        isAdmin: false,
      };

      server.use(
        http.get(`${GCS_API_BASE}/user`, () => {
          return HttpResponse.json(mockUserData);
        })
      );

      const { getUser } = await import('../../services/gcsApiService');
      const result = await getUser(mockToken);

      expect(result).toEqual(mockUserData);
    });

    it('should throw error when unauthorized', async () => {
      server.use(
        http.get(`${GCS_API_BASE}/user`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      const { getUser } = await import('../../services/gcsApiService');

      await expect(getUser(mockToken)).rejects.toThrow('Unauthorized');
    });
  });

  describe('getPreferences', () => {
    it('should fetch user preferences successfully', async () => {
      const mockPreferences = {
        email: 'test@example.com',
        scraperConfig: null,
        feedSettings: { defaultRegion: 'eu' },
      };

      server.use(
        http.get(`${GCS_API_BASE}/user/preferences`, () => {
          return HttpResponse.json(mockPreferences);
        })
      );

      const { getPreferences } = await import('../../services/gcsApiService');
      const result = await getPreferences(mockToken);

      expect(result).toEqual(mockPreferences);
    });

    it('should handle server error', async () => {
      server.use(
        http.get(`${GCS_API_BASE}/user/preferences`, () => {
          return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
        })
      );

      const { getPreferences } = await import('../../services/gcsApiService');

      await expect(getPreferences(mockToken)).rejects.toThrow();
    });
  });

  describe('savePreferences', () => {
    it('should save user preferences successfully', async () => {
      const newPreferences = {
        feedSettings: { defaultRegion: 'eu' },
      };

      server.use(
        http.put(`${GCS_API_BASE}/user/preferences`, () => {
          return HttpResponse.json({ ...newPreferences, lastUpdated: '2025-01-01' });
        })
      );

      const { savePreferences } = await import('../../services/gcsApiService');
      const result = await savePreferences(mockToken, newPreferences);

      expect(result).toMatchObject(newPreferences);
    });

    it('should handle validation error', async () => {
      server.use(
        http.put(`${GCS_API_BASE}/user/preferences`, () => {
          return HttpResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
        })
      );

      const { savePreferences } = await import('../../services/gcsApiService');

      await expect(savePreferences(mockToken, {})).rejects.toThrow('Invalid preferences format');
    });
  });

  describe('triggerScraper', () => {
    it('should trigger scraper successfully', async () => {
      const scraperRequest = {
        region: 'eu' as const,
        urls: ['https://example.com/news1', 'https://example.com/news2'],
        keywords: ['football', 'soccer'],
        scrape_depth: 2,
      };

      const mockResponse = {
        success: true,
        messageId: 'msg-123',
        triggeredBy: 'test@example.com',
        region: 'eu',
        sourcesCount: 2,
      };

      server.use(
        http.post(`${GCS_API_BASE}/trigger/scraper`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const { triggerScraper } = await import('../../services/gcsApiService');
      const result = await triggerScraper(mockToken, scraperRequest);

      expect(result).toMatchObject({
        success: true,
        messageId: 'msg-123',
      });
    });

    it('should handle scraper trigger failure', async () => {
      server.use(
        http.post(`${GCS_API_BASE}/trigger/scraper`, () => {
          return HttpResponse.json({ error: 'Scraper service unavailable' }, { status: 503 });
        })
      );

      const { triggerScraper } = await import('../../services/gcsApiService');
      const scraperRequest = {
        region: 'eu' as const,
        urls: [],
        keywords: [],
      };

      await expect(triggerScraper(mockToken, scraperRequest)).rejects.toThrow();
    });
  });

  describe('triggerNewsApi', () => {
    it('should trigger news API successfully', async () => {
      const apiConfig = {
        keywords: ['football', 'soccer'],
        time_range: 'last_24_hours',
        max_results: 50,
      };

      const mockResponse = {
        success: true,
        messageId: 'msg-456',
        triggeredBy: 'test@example.com',
        keywords: ['football', 'soccer'],
      };

      server.use(
        http.post(`${GCS_API_BASE}/trigger/news-api`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const { triggerNewsApi } = await import('../../services/gcsApiService');
      const result = await triggerNewsApi(mockToken, apiConfig);

      expect(result).toMatchObject({
        success: true,
        keywords: ['football', 'soccer'],
      });
    });

    it('should handle news API trigger failure', async () => {
      server.use(
        http.post(`${GCS_API_BASE}/trigger/news-api`, () => {
          return HttpResponse.json({ error: 'API quota exceeded' }, { status: 429 });
        })
      );

      const { triggerNewsApi } = await import('../../services/gcsApiService');

      await expect(triggerNewsApi(mockToken, { keywords: [] })).rejects.toThrow();
    });
  });

  describe('getArticles', () => {
    const sampleArticles = [
      {
        article_id: '1',
        original_url: 'https://example.com/1',
        title: 'Sample Article 1',
        summary: 'Summary 1',
        content: 'Content 1',
        source: 'Source 1',
        publish_date: '2025-01-01T12:00:00Z',
        categories: [{ tag: 'football', confidence: 0.9 }],
        key_entities: { teams: ['Team A'] },
        language: 'en',
        region: 'eu',
        source_type: 'api' as const,
      },
    ];

    it('should fetch articles successfully', async () => {
      server.use(
        http.get(`${GCS_API_BASE}/articles`, () => {
          return HttpResponse.json(sampleArticles);
        })
      );

      const { getArticles } = await import('../../services/gcsApiService');
      const result = await getArticles({ region: 'eu' });

      expect(result).toEqual(sampleArticles);
    });

    it('should include query parameters', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}/articles`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleArticles);
        })
      );

      const { getArticles } = await import('../../services/gcsApiService');
      await getArticles({
        region: 'eu',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        lastNDays: 7,
        noCache: true,
      });

      expect(capturedUrl).toContain('region=eu');
      expect(capturedUrl).toContain('startDate=2025-01-01');
      expect(capturedUrl).toContain('endDate=2025-01-31');
      expect(capturedUrl).toContain('last_n_days=7');
      expect(capturedUrl).toContain('no_cache=true');
    });

    it('should handle articles fetch error', async () => {
      server.use(
        http.get(`${GCS_API_BASE}/articles`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      const { getArticles } = await import('../../services/gcsApiService');

      await expect(getArticles({ region: 'eu' })).rejects.toThrow();
    });
  });

  describe('getNewsApiConfig', () => {
    it('should fetch news API config successfully', async () => {
      const mockConfig = {
        default_keywords: ['football', 'soccer'],
        default_time_range: 'last_24_hours',
        default_max_results: 50,
        available_time_ranges: ['last_24_hours', 'last_week'],
      };

      server.use(
        http.get(`${GCS_API_BASE}/config/news-api`, () => {
          return HttpResponse.json(mockConfig);
        })
      );

      const { getNewsApiConfig } = await import('../../services/gcsApiService');
      const result = await getNewsApiConfig(mockToken);

      expect(result).toEqual(mockConfig);
    });
  });

  describe('utility functions', () => {
    it('isGcsApiConfigured should return boolean based on env var', async () => {
      const { isGcsApiConfigured } = await import('../../services/gcsApiService');
      // The function checks if VITE_GCS_API_URL is set
      expect(typeof isGcsApiConfigured()).toBe('boolean');
    });

    it('getGcsApiUrl should return string', async () => {
      const { getGcsApiUrl } = await import('../../services/gcsApiService');
      expect(typeof getGcsApiUrl()).toBe('string');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${GCS_API_BASE}/user`, () => {
          return HttpResponse.error();
        })
      );

      const { getUser } = await import('../../services/gcsApiService');

      await expect(getUser(mockToken)).rejects.toThrow();
    });
  });
});
