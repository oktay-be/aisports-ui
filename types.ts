export enum PostStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  DISCARDED = 'DISCARDED'
}

export interface NewsEntry {
  id: string;
  content: string;
  originalUrl: string;
  timestamp: string; // ISO string
  source: string;
  characterCount: number;
  status: PostStatus;
  category?: string;
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