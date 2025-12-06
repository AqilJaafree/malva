/**
 * News Service
 * Fetches crypto news from the news API
 */

import { NewsResponse, NewsArticle, NewsSummary } from '../types/news.js';

export class NewsService {
  private newsApiUrl: string;
  private cache: Map<string, { data: NewsResponse; timestamp: number }>;
  private cacheTTL: number = 300000; // 5 minutes cache

  constructor() {
    this.newsApiUrl = process.env.NEWS_API_URL || 'https://api-production-729e.up.railway.app/news';
    this.cache = new Map();
  }

  /**
   * Fetch news with caching
   */
  private async fetchWithCache(url: string): Promise<NewsResponse> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as NewsResponse;

    // Cache the response
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries (keep max 50)
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    return data;
  }

  /**
   * Get latest crypto news
   */
  async getLatestNews(page: number = 1): Promise<NewsResponse> {
    try {
      const url = `${this.newsApiUrl}?page=${page}`;
      return await this.fetchWithCache(url);
    } catch (error) {
      console.error('Error fetching latest news:', error);
      throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search news by keyword in title or summary
   */
  async searchNews(searchTerm: string, page: number = 1): Promise<NewsResponse> {
    try {
      const newsData = await this.getLatestNews(page);

      // Filter articles by search term (case-insensitive)
      const searchLower = searchTerm.toLowerCase();
      const filteredArticles = newsData.articles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.source.toLowerCase().includes(searchLower)
      );

      return {
        ...newsData,
        count: filteredArticles.length,
        articles: filteredArticles
      };
    } catch (error) {
      console.error('Error searching news:', error);
      throw new Error(`Failed to search news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get news by specific source
   */
  async getNewsBySource(source: string, page: number = 1): Promise<NewsResponse> {
    try {
      const newsData = await this.getLatestNews(page);

      // Filter articles by source (case-insensitive)
      const sourceLower = source.toLowerCase();
      const filteredArticles = newsData.articles.filter(article =>
        article.source.toLowerCase() === sourceLower
      );

      return {
        ...newsData,
        count: filteredArticles.length,
        articles: filteredArticles
      };
    } catch (error) {
      console.error('Error fetching news by source:', error);
      throw new Error(`Failed to fetch news by source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get news summary statistics
   */
  async getNewsSummary(pageCount: number = 3): Promise<NewsSummary> {
    try {
      const allArticles: NewsArticle[] = [];

      // Fetch multiple pages for better statistics
      for (let page = 1; page <= pageCount; page++) {
        const newsData = await this.getLatestNews(page);
        allArticles.push(...newsData.articles);
      }

      // Count articles by source
      const sourceCounts = new Map<string, number>();
      allArticles.forEach(article => {
        sourceCounts.set(article.source, (sourceCounts.get(article.source) || 0) + 1);
      });

      // Get unique sources
      const sources = Array.from(new Set(allArticles.map(a => a.source))).sort();

      // Get top sources
      const topSources = Array.from(sourceCounts.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get latest article
      const latestArticle = allArticles.length > 0
        ? {
            title: allArticles[0].title,
            source: allArticles[0].source,
            date: new Date(allArticles[0].created_at).toISOString(),
            url: allArticles[0].url
          }
        : null;

      return {
        totalArticles: allArticles.length,
        sources,
        latestArticle,
        topSources
      };
    } catch (error) {
      console.error('Error generating news summary:', error);
      throw new Error(`Failed to generate news summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get trending topics based on keyword frequency in recent articles
   */
  async getTrendingTopics(topN: number = 10): Promise<Array<{ topic: string; count: number }>> {
    try {
      const newsData = await this.getLatestNews(1);

      // Extract keywords from titles (simple approach)
      const keywords = new Map<string, number>();
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'as', 'by', 'are', 'from', 'this', 'that']);

      newsData.articles.forEach(article => {
        const words = article.title.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3 && !stopWords.has(word));

        words.forEach(word => {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        });
      });

      // Get top N keywords
      return Array.from(keywords.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);
    } catch (error) {
      console.error('Error getting trending topics:', error);
      throw new Error(`Failed to get trending topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get news related to specific assets (Bitcoin, Ethereum, Solana, etc.)
   */
  async getAssetRelatedNews(assetKeywords: string[], page: number = 1): Promise<NewsResponse> {
    try {
      const newsData = await this.getLatestNews(page);

      // Filter articles mentioning any of the asset keywords
      const assetKeywordsLower = assetKeywords.map(k => k.toLowerCase());
      const filteredArticles = newsData.articles.filter(article => {
        const content = `${article.title} ${article.summary}`.toLowerCase();
        return assetKeywordsLower.some(keyword => content.includes(keyword));
      });

      return {
        ...newsData,
        count: filteredArticles.length,
        articles: filteredArticles
      };
    } catch (error) {
      console.error('Error fetching asset-related news:', error);
      throw new Error(`Failed to fetch asset-related news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
