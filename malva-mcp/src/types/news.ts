/**
 * News API Type Definitions
 * For crypto news from api-production-729e.up.railway.app
 */

export interface NewsArticle {
  created_at: string;
  title: string;
  source: string;
  article_date: number;
  url: string;
  summary: string;
  id: string;
}

export interface NewsResponse {
  currentPage: number;
  totalPages: number;
  totalArticles: number;
  count: number;
  articles: NewsArticle[];
}

export interface NewsFilterOptions {
  page?: number;
  source?: string;
  searchTerm?: string;
}

export interface NewsSummary {
  totalArticles: number;
  sources: string[];
  latestArticle: {
    title: string;
    source: string;
    date: string;
    url: string;
  } | null;
  topSources: Array<{
    source: string;
    count: number;
  }>;
}
