/**
 * Test fixtures for article data.
 *
 * Provides sample articles matching the EnrichedArticle type
 * used throughout the UI.
 */

export interface TestArticle {
  article_id: string;
  url: string;
  title: string;
  body: string;
  summary: string;
  source: string;
  publish_date: string;
  language: string;
  region: string;
  categories: string[];
  key_entities: {
    teams: string[];
    players: string[];
    amounts: string[];
    dates: string[];
    competitions: string[];
    locations: string[];
  };
  content_quality: string;
  confidence: number;
  x_post: string;
  merged_from_urls: string[];
}

export const createTestArticle = (overrides: Partial<TestArticle> = {}): TestArticle => ({
  article_id: 'test-article-' + Math.random().toString(36).substring(7),
  url: 'https://example.com/article',
  title: 'Test Article Title',
  body: 'This is a test article body with content.',
  summary: 'Test article summary.',
  source: 'example.com',
  publish_date: '2025-12-28T10:00:00',
  language: 'en',
  region: 'eu',
  categories: ['sports'],
  key_entities: {
    teams: [],
    players: [],
    amounts: [],
    dates: [],
    competitions: [],
    locations: [],
  },
  content_quality: 'medium',
  confidence: 0.75,
  x_post: '',
  merged_from_urls: [],
  ...overrides,
});

export const sampleTransferArticle = createTestArticle({
  article_id: 'transfer-article-001',
  title: 'Star Player Completes 50M Transfer',
  body: 'The highly anticipated transfer has been completed. The deal includes performance bonuses.',
  summary: 'Star player moves for 50 million euros.',
  categories: ['transfer', 'football'],
  key_entities: {
    teams: ['Buying Club', 'Selling Club'],
    players: ['Star Player'],
    amounts: ['50 million euros'],
    dates: ['2025-12-28'],
    competitions: [],
    locations: [],
  },
  content_quality: 'high',
  confidence: 0.9,
  x_post: 'BREAKING: Star player seals 50M move!',
  merged_from_urls: ['https://othernews.com/transfer', 'https://sportssite.com/deal'],
});

export const sampleMatchPreviewArticle = createTestArticle({
  article_id: 'match-preview-001',
  title: 'Big Derby Preview: City vs United',
  body: 'The much-anticipated derby takes place this weekend with both teams in good form.',
  summary: 'Derby match preview.',
  categories: ['match-preview', 'derby'],
  key_entities: {
    teams: ['City', 'United'],
    players: [],
    amounts: [],
    dates: ['this weekend'],
    competitions: ['Premier League'],
    locations: ['Home Stadium'],
  },
  content_quality: 'medium',
  confidence: 0.78,
  x_post: 'Big derby this weekend!',
});

export const sampleTurkishArticle = createTestArticle({
  article_id: 'turkish-article-001',
  title: 'Fenerbahce Transfer Haberleri',
  body: 'Fenerbahce yeni oyuncu transferi hakkinda bilgiler.',
  summary: 'Fenerbahce transfer news.',
  language: 'tr',
  region: 'tr',
  categories: ['transfer'],
  key_entities: {
    teams: ['Fenerbahce'],
    players: [],
    amounts: [],
    dates: [],
    competitions: ['Super Lig'],
    locations: ['Istanbul'],
  },
});

export const createArticleBatch = (count: number): TestArticle[] => {
  return Array.from({ length: count }, (_, i) =>
    createTestArticle({
      article_id: `batch-article-${i}`,
      title: `Batch Article ${i + 1}`,
      body: `This is batch article number ${i + 1}.`,
    })
  );
};
