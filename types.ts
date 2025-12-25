export enum PostStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  DISCARDED = 'DISCARDED'
}

export type SourceRegion = 'eu' | 'tr' | 'diff';

export interface DiffArticle {
  article_id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  max_similarity: number;
  closest_match: {
    article_id: string;
    title: string;
    url: string;
  } | null;
}

export interface DiffResult {
  metadata: {
    region1: string;
    region2: string;
    run_folder: string;
    diff_threshold: number;
    generated_at: string;
  };
  summary: {
    total_region1_articles: number;
    total_region2_articles: number;
    unique_to_region1: number;
  };
  unique_articles: DiffArticle[];
}

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
  content?: string;  // Full article body
  source: string;
  publish_date: string;
  categories: CategoryAssignment[];
  key_entities: KeyEntities;
  content_quality: 'high' | 'medium' | 'low';
  confidence: number;
  language: string;
  summary_translation?: string;
  x_post?: string;
  keywords_used?: string[];  // Keywords that matched this article (for highlighting)
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