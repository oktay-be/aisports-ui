export enum PostStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  DISCARDED = 'DISCARDED'
}

export type SourceRegion = 'eu' | 'tr';

export interface KeyEntities {
  competitions: string[];
  locations: string[];
  players: string[];
  teams: string[];
}

export interface ProcessedArticle {
  article_id?: string;
  original_url: string;
  title: string;
  summary: string;
  source: string;
  published_date: string;
  categories: string[];
  key_entities: KeyEntities;
  content_quality: 'high' | 'medium' | 'low';
  confidence: number;
  language: string;
  summary_translation?: string;
  x_post?: string;
  _dedup_metadata?: any;
}

export interface NewsEntry extends ProcessedArticle {
  id: string;
  status: PostStatus;
}

export interface FilterState {
  search: string;
  startDate: string;
  endDate: string;
  status: PostStatus | 'ALL';
}

export interface GeminiAnalysis {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  trendingTags: string[];
}