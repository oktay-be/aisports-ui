import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { PostStatus } from '../../types';

// Note: The service reads import.meta.env at module load time
const GCS_API_BASE = 'http://localhost:8080';

describe('dataService', () => {
  // Sample article data for tests
  const sampleProcessedArticles = [
    {
      original_url: 'https://example.com/article1',
      title: 'Test Article 1',
      summary: 'This is a test article about football.',
      source: 'example.com',
      publish_date: '2025-01-15T10:00:00Z',
      categories: ['football', 'sports'],
      key_entities: {
        competitions: ['Premier League'],
        locations: ['London'],
        players: ['Test Player'],
        teams: ['Test FC'],
      },
      content_quality: 'high',
      confidence: 0.9,
      language: 'english',
    },
    {
      original_url: 'https://example.com/article2',
      title: 'Test Article 2',
      summary: 'Another test article about basketball.',
      source: 'example.com',
      publish_date: '2025-01-15T11:00:00Z',
      categories: ['basketball', 'sports'],
      key_entities: {
        competitions: ['EuroLeague'],
        locations: ['Istanbul'],
        players: [],
        teams: ['Test Team'],
      },
      content_quality: 'medium',
      confidence: 0.85,
      language: 'turkish',
    },
  ];

  const sampleDiffResult = {
    summary: {
      total_eu: 10,
      total_tr: 15,
      unique_eu: 5,
      unique_tr: 8,
      overlap: 3,
      diff_percentage: 70.5,
    },
    unique_eu_articles: [
      {
        original_url: 'https://eu.example.com/article1',
        title: 'EU Only Article',
        summary: 'This article only in EU',
        source: 'eu.example.com',
        publish_date: '2025-01-15T10:00:00Z',
      },
    ],
    unique_tr_articles: [
      {
        original_url: 'https://tr.example.com/article1',
        title: 'TR Only Article',
        summary: 'This article only in TR',
        source: 'tr.example.com',
        publish_date: '2025-01-15T11:00:00Z',
      },
    ],
    overlapping_articles: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('fetchNews', () => {
    it('should fetch news with default parameters', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('region') === 'eu') {
            return HttpResponse.json(sampleProcessedArticles);
          }
          return HttpResponse.json([]);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      const result = await fetchNews();

      expect(result).toHaveLength(2);
    });

    it('should fetch news for specific region', async () => {
      let capturedRegion = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          const url = new URL(request.url);
          capturedRegion = url.searchParams.get('region') || '';
          return HttpResponse.json(sampleProcessedArticles);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      await fetchNews('tr');

      expect(capturedRegion).toBe('tr');
    });

    it('should fetch news with date range', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleProcessedArticles);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      await fetchNews('eu', '2025-01-01', '2025-01-31');

      expect(capturedUrl).toContain('startDate=2025-01-01');
      expect(capturedUrl).toContain('endDate=2025-01-31');
    });

    it('should fetch news with lastNDays parameter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleProcessedArticles);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      await fetchNews('eu', undefined, undefined, undefined, 7);

      expect(capturedUrl).toContain('last_n_days=7');
    });

    it('should fetch news with noCache parameter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleProcessedArticles);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      await fetchNews('eu', undefined, undefined, undefined, undefined, true);

      expect(capturedUrl).toContain('no_cache=true');
    });

    it('should return empty array when API returns error', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      const result = await fetchNews();

      expect(result).toEqual([]);
    });

    it('should transform articles to NewsEntry format', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.json(sampleProcessedArticles);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      const result = await fetchNews('eu');

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('status', PostStatus.PENDING);
      expect(result[0].id).toBe('entry-eu-0');
      expect(result[1].id).toBe('entry-eu-1');
    });

    it('should handle empty response', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.json([]);
        })
      );

      const { fetchNews } = await import('../../services/dataService');
      const result = await fetchNews();

      expect(result).toEqual([]);
    });

    it('should throw on network error', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.error();
        })
      );

      const { fetchNews } = await import('../../services/dataService');

      await expect(fetchNews()).rejects.toThrow();
    });
  });

  describe('fetchDiffArticles', () => {
    it('should fetch diff articles with default parameters', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleDiffResult);
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      const result = await fetchDiffArticles();

      expect(capturedUrl).toContain('region=diff');
      expect(result).toEqual(sampleDiffResult);
      expect(result?.summary.total_eu).toBe(10);
      expect(result?.summary.total_tr).toBe(15);
    });

    it('should fetch diff articles with date range', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleDiffResult);
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      await fetchDiffArticles('2025-01-01', '2025-01-31');

      expect(capturedUrl).toContain('startDate=2025-01-01');
      expect(capturedUrl).toContain('endDate=2025-01-31');
    });

    it('should fetch diff articles with lastNDays parameter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleDiffResult);
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      await fetchDiffArticles(undefined, undefined, 14);

      expect(capturedUrl).toContain('last_n_days=14');
    });

    it('should fetch diff articles with noCache parameter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${GCS_API_BASE}`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sampleDiffResult);
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      await fetchDiffArticles(undefined, undefined, undefined, true);

      expect(capturedUrl).toContain('no_cache=true');
    });

    it('should return null when API returns error', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      const result = await fetchDiffArticles();

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.error();
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      const result = await fetchDiffArticles();

      expect(result).toBeNull();
    });

    it('should return diff result with expected structure', async () => {
      server.use(
        http.get(`${GCS_API_BASE}`, () => {
          return HttpResponse.json(sampleDiffResult);
        })
      );

      const { fetchDiffArticles } = await import('../../services/dataService');
      const result = await fetchDiffArticles();

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('unique_eu_articles');
      expect(result).toHaveProperty('unique_tr_articles');
      expect(result?.summary).toHaveProperty('total_eu');
      expect(result?.summary).toHaveProperty('total_tr');
      expect(result?.summary).toHaveProperty('diff_percentage');
    });
  });
});
