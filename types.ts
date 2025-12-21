export enum PostStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  DISCARDED = 'DISCARDED'
}

export type SourceRegion = 'eu' | 'tr';

export interface KeyEntities {
  teams: string[];
  players: string[];
  amounts: string[];
  dates: string[];
  competitions: string[];
  locations: string[];
}

export interface CategoryAssignment {
  tag: string;
  confidence: number;
  evidence?: string;
}

export interface ProcessedArticle {
  article_id: string;
  original_url: string;
  merged_from_urls?: string[];
  title: string;
  summary: string;
  source: string;
  published_date: string;
  categories: CategoryAssignment[];
  key_entities: KeyEntities;
  content_quality: 'high' | 'medium' | 'low';
  confidence: number;
  language: string;
  summary_translation?: string;
  x_post?: string;
  _grouping_metadata?: {
    group_id: number;
    group_size: number;
    max_similarity: number;
    merge_decision: string;
  };
  _merge_metadata?: {
    decision: 'MERGED' | 'KEPT_SEPARATE';
    reason: string;
    group_id: number;
    merged_from_count?: number;
    merged_from_urls?: string[];
    group_size?: number;
  };
  _processing_metadata?: {
    source_type: string;
    date: string;
    run_id: string;
    group_type: 'singleton' | 'grouped';
    group_id?: number;
  };
  source_type?: 'scraped' | 'api' | 'processed';
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