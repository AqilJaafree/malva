import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PriceService } from "../services/price-service.js";
import { RSIService } from "../services/rsi-service.js";
import { NewsService } from "../services/news-service.js";
import { SOLANA_ASSETS } from "../config/assets.js";

// Initialize price service globally and start polling
const priceService = new PriceService();
const rsiService = new RSIService(priceService);
const newsService = new NewsService();

// Start real-time price polling (every 5 seconds by default)
const pollInterval = parseInt(process.env.PRICE_POLL_INTERVAL || '5000');
priceService.startPricePolling(pollInterval);

/**
 * Sets up MCP tools for Solana RWA real-time price tracking
 */
export function setupMinimalTool(server: McpServer): void {
  // Tool 1: Get current real-time prices
  server.registerTool(
    "get-current-prices",
    {
      title: "Get Real-Time Asset Prices",
      description: "Fetch real-time prices for Solana RWA assets (Wrapped BTC, RWA Stocks, Gold) using Jupiter Price API v2",
      inputSchema: {
        category: z.enum(["wrapped-btc", "rwa-stocks", "gold"]).optional().describe("Filter by asset category (optional)")
      }
    },
    async ({ category }) => {
      try {
        const prices = await priceService.getCurrentPrices(category);

        if (prices.length === 0) {
          throw new Error("No real-time price data available from Jupiter API");
        }

        const response = {
          status: "success",
          timestamp: new Date().toISOString(),
          category: category || "all",
          totalAssets: prices.length,
          dataSource: "Jupiter Price API v2",
          apiEndpoint: process.env.JUPITER_PRICE_API_URL || 'https://api.jup.ag/price/v2',
          prices: prices.map(p => ({
            asset: p.asset,
            symbol: p.symbol,
            category: p.category,
            price: p.price,
            priceChange24h: p.priceChange24h,
            volume24h: p.volume24h,
            timestamp: new Date(p.timestamp).toISOString(),
            source: p.source
          })),
          summary: {
            avgPrice: prices.reduce((sum, p) => sum + p.price, 0) / prices.length,
            priceRange: {
              min: Math.min(...prices.map(p => p.price)),
              max: Math.max(...prices.map(p => p.price))
            },
            totalVolume24h: prices.reduce((sum, p) => sum + (p.volume24h || 0), 0)
          },
          ohlcStats: priceService.getOHLCStats()
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString(),
              note: "This server uses only Jupiter Price API v2 for real-time data. Ensure tokens are tradeable on Jupiter DEX.",
              supportedAssets: SOLANA_ASSETS.map(a => ({
                symbol: a.symbol,
                name: a.name,
                category: a.category
              }))
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 2: Get real-time OHLC candlestick data
  server.registerTool(
    "get-ohlc-data",
    {
      title: "Get Real-Time OHLC Candlestick Data",
      description: "Fetch OHLC (Open, High, Low, Close) candlestick data built from real-time Jupiter price polling. Data accumulates as the server runs.",
      inputSchema: {
        asset: z.string().min(1).describe("Asset symbol (e.g., 'WBTC', 'TSLA', 'PAXG') or mint address"),
        interval: z.enum(["1s", "1m", "5m", "1h", "1w", "1M"]).describe("Candlestick time interval"),
        count: z.number().min(1).max(1000).default(100).describe("Number of candles to return (max 1000)")
      }
    },
    async ({ asset, interval, count }) => {
      try {
        const foundAsset = SOLANA_ASSETS.find(a =>
          a.symbol.toLowerCase() === asset.toLowerCase() ||
          a.mintAddress === asset ||
          a.name.toLowerCase().includes(asset.toLowerCase())
        );

        if (!foundAsset) {
          throw new Error(`Asset not found: ${asset}. Available assets: ${SOLANA_ASSETS.map(a => a.symbol).join(', ')}`);
        }

        const ohlcData = await priceService.getOHLCData(foundAsset.mintAddress, interval, count);

        const response = {
          status: "success",
          asset: {
            name: foundAsset.name,
            symbol: foundAsset.symbol,
            category: foundAsset.category,
            mintAddress: foundAsset.mintAddress
          },
          interval: interval,
          requestedCount: count,
          actualCount: ohlcData.length,
          dataSource: "Real-time Jupiter API v2 (accumulated)",
          data: ohlcData,
          statistics: ohlcData.length > 0 ? {
            highestPrice: Math.max(...ohlcData.map(d => d.high)),
            lowestPrice: Math.min(...ohlcData.map(d => d.low)),
            avgClose: ohlcData.reduce((sum, d) => sum + d.close, 0) / ohlcData.length,
            priceChange: ohlcData.length > 1 ?
              ((ohlcData[ohlcData.length - 1].close - ohlcData[0].open) / ohlcData[0].open * 100).toFixed(2) + '%'
              : '0%',
            volatility: calculateVolatility(ohlcData.map(d => d.close)),
            trend: calculateTrend(ohlcData.map(d => d.close))
          } : null,
          timeRange: ohlcData.length > 0 ? {
            start: new Date(ohlcData[0].timestamp).toISOString(),
            end: new Date(ohlcData[ohlcData.length - 1].timestamp).toISOString()
          } : null,
          timestamp: new Date().toISOString(),
          note: "OHLC data is built in real-time from Jupiter price polling. More candles accumulate over time."
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              availableAssets: SOLANA_ASSETS.map(a => ({
                symbol: a.symbol,
                name: a.name,
                category: a.category
              })),
              timestamp: new Date().toISOString(),
              note: "OHLC data accumulates from real-time Jupiter price polling. If no data is available, wait a few minutes for candles to build up."
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 3: Get interval-based price tracking with analytics
  server.registerTool(
    "get-interval-prices",
    {
      title: "Get Time-Series Price Data with Analytics",
      description: "Track price movements over time with OHLC candles and advanced analytics (volatility, trend, price changes)",
      inputSchema: {
        asset: z.string().min(1).describe("Asset symbol (e.g., 'cbBTC', 'AAPL') or mint address"),
        interval: z.enum(["1s", "1m", "5m", "1h", "1w", "1M"]).describe("Time interval for data points"),
        count: z.number().min(1).max(1000).default(100).describe("Number of data points to return")
      }
    },
    async ({ asset, interval, count }) => {
      try {
        const foundAsset = SOLANA_ASSETS.find(a =>
          a.symbol.toLowerCase() === asset.toLowerCase() ||
          a.mintAddress === asset ||
          a.name.toLowerCase().includes(asset.toLowerCase())
        );

        if (!foundAsset) {
          throw new Error(`Asset not found: ${asset}. Try: ${SOLANA_ASSETS.slice(0, 5).map(a => a.symbol).join(', ')}, etc.`);
        }

        const intervalData = await priceService.getIntervalPrices(foundAsset.mintAddress, interval, count);

        const response = {
          status: "success",
          asset: {
            name: foundAsset.name,
            symbol: foundAsset.symbol,
            category: foundAsset.category,
            mintAddress: foundAsset.mintAddress
          },
          trackingInterval: interval,
          dataPoints: intervalData.data.length,
          dataSource: "Real-time Jupiter Price API v2",
          timeRange: {
            start: new Date(intervalData.data[0]?.timestamp || 0).toISOString(),
            end: new Date(intervalData.data[intervalData.data.length - 1]?.timestamp || 0).toISOString(),
            durationMs: intervalData.data.length > 0
              ? intervalData.data[intervalData.data.length - 1].timestamp - intervalData.data[0].timestamp
              : 0
          },
          priceData: intervalData.data.map(d => ({
            price: d.price,
            timestamp: new Date(d.timestamp).toISOString(),
            source: d.source
          })),
          ohlcData: intervalData.ohlc || null,
          analytics: {
            currentPrice: intervalData.data[intervalData.data.length - 1]?.price || 0,
            firstPrice: intervalData.data[0]?.price || 0,
            priceChange: intervalData.data.length > 1 ?
              intervalData.data[intervalData.data.length - 1].price - intervalData.data[0].price : 0,
            priceChangePercent: intervalData.data.length > 1 && intervalData.data[0].price > 0 ?
              ((intervalData.data[intervalData.data.length - 1].price - intervalData.data[0].price) / intervalData.data[0].price * 100).toFixed(2) + '%'
              : '0%',
            volatility: calculateVolatility(intervalData.data.map(d => d.price)),
            trend: calculateTrend(intervalData.data.map(d => d.price)),
            highestPrice: Math.max(...intervalData.data.map(d => d.price)),
            lowestPrice: Math.min(...intervalData.data.map(d => d.price))
          },
          lastUpdated: new Date(intervalData.lastUpdated).toISOString()
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString(),
              note: "All price data comes from real-time Jupiter API v2 polling. No fallback or historical APIs are used.",
              availableAssets: SOLANA_ASSETS.map(a => ({
                symbol: a.symbol,
                category: a.category
              }))
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 4: Get OHLC statistics
  server.registerTool(
    "get-ohlc-stats",
    {
      title: "Get OHLC Data Collection Statistics",
      description: "View statistics about accumulated OHLC candle data for all tracked assets and intervals",
      inputSchema: {}
    },
    async () => {
      try {
        const stats = priceService.getOHLCStats();

        const response = {
          status: "success",
          timestamp: new Date().toISOString(),
          totalAssets: Object.keys(stats).length,
          candleStats: stats,
          note: "Candle counts show how many OHLC data points have been accumulated for each interval. Longer server uptime = more historical data."
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 5: Get RSI Analysis
  server.registerTool(
    "get-rsi-analysis",
    {
      title: "Get RSI Trading Signal Analysis",
      description: "Get RSI-based trading signals with buy/sell recommendations for single asset or category",
      inputSchema: {
        asset: z.string().optional().describe("Asset symbol (e.g., 'WBTC', 'TSLA') or mint address (optional)"),
        category: z.enum(["wrapped-btc", "rwa-stocks", "gold"]).optional().describe("Asset category filter (optional)"),
        interval: z.enum(["1s", "1m", "5m", "1h", "1w", "1M"]).optional().describe("Time interval for RSI calculation (optional, uses default for asset type)")
      }
    },
    async ({ asset, category, interval }) => {
      try {
        let targetAssets = SOLANA_ASSETS;

        // Filter by asset if provided
        if (asset) {
          const foundAsset = SOLANA_ASSETS.find(a =>
            a.symbol.toLowerCase() === asset.toLowerCase() ||
            a.mintAddress === asset ||
            a.name.toLowerCase().includes(asset.toLowerCase())
          );

          if (!foundAsset) {
            throw new Error(`Asset not found: ${asset}. Available: ${SOLANA_ASSETS.map(a => a.symbol).join(', ')}`);
          }

          targetAssets = [foundAsset];
        } else if (category) {
          // Filter by category
          targetAssets = SOLANA_ASSETS.filter(a => a.category === category);
        }

        // Check available OHLC data first
        const stats = priceService.getOHLCStats();
        console.log('[RSI Analysis] Available OHLC data:', stats);

        // Analyze all target assets
        const analysisPromises = targetAssets.map(a =>
          rsiService.analyzeAsset(a, interval)
        );
        const analyses = await Promise.allSettled(analysisPromises);

        const results = analyses
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(`Failed to analyze ${targetAssets[index].symbol}:`, result.reason);
              return null;
            }
          })
          .filter(r => r !== null);

        if (results.length === 0) {
          throw new Error('No RSI analysis available. Ensure sufficient OHLC data has been collected.');
        }

        const response = {
          status: "success",
          timestamp: new Date().toISOString(),
          totalAnalyzed: results.length,
          filter: asset ? `asset: ${asset}` : category ? `category: ${category}` : 'all assets',
          analyses: results,
          summary: {
            buySignals: results.filter(r => r.signal.action === 'BUY').length,
            sellSignals: results.filter(r => r.signal.action === 'SELL').length,
            holdSignals: results.filter(r => r.signal.action === 'HOLD').length,
            avgConfidence: results.length > 0
              ? (results.reduce((sum, r) => sum + r.signal.confidence, 0) / results.length).toFixed(2)
              : 0
          }
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString(),
              note: "RSI analysis requires accumulated OHLC data. Wait for data collection or check asset availability."
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 6: Get Portfolio Signals
  server.registerTool(
    "get-portfolio-signals",
    {
      title: "Get Portfolio-Wide Trading Signals",
      description: "Get actionable trading signals for all tracked RWA assets with confidence scores",
      inputSchema: {
        minConfidence: z.number().min(0).max(1).default(0.6).describe("Minimum confidence threshold (0.0 to 1.0, default 0.6)")
      }
    },
    async ({ minConfidence }) => {
      try {
        const portfolioSignals = await rsiService.getPortfolioSignals(SOLANA_ASSETS, minConfidence);

        const response = {
          status: "success",
          timestamp: new Date(portfolioSignals.timestamp).toISOString(),
          minConfidence,
          totalAssets: SOLANA_ASSETS.length,
          totalSignals: portfolioSignals.signals.length,
          summary: portfolioSignals.summary,
          signals: portfolioSignals.signals.map(s => ({
            asset: s.asset,
            symbol: s.symbol,
            category: s.category,
            currentPrice: s.currentPrice,
            rsi: s.rsi,
            signal: s.signal,
            analysis: s.analysis
          })),
          actionableSignals: {
            strongBuys: portfolioSignals.signals.filter(s =>
              s.signal.action === 'BUY' && s.signal.confidence >= 0.8
            ),
            moderateBuys: portfolioSignals.signals.filter(s =>
              s.signal.action === 'BUY' && s.signal.confidence >= 0.6 && s.signal.confidence < 0.8
            ),
            sells: portfolioSignals.signals.filter(s => s.signal.action === 'SELL')
          }
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 7: Get RSI Divergence
  server.registerTool(
    "get-rsi-divergence",
    {
      title: "Detect RSI Divergence Patterns",
      description: "Detect RSI divergence patterns for high-confidence reversal signals",
      inputSchema: {
        asset: z.string().min(1).describe("Asset symbol (e.g., 'WBTC', 'PAXG') or mint address"),
        interval: z.enum(["1s", "1m", "5m", "1h", "1w", "1M"]).describe("Time interval for analysis"),
        lookback: z.number().min(5).max(50).default(10).describe("Lookback period for divergence detection (default 10)")
      }
    },
    async ({ asset, interval, lookback }) => {
      try {
        const foundAsset = SOLANA_ASSETS.find(a =>
          a.symbol.toLowerCase() === asset.toLowerCase() ||
          a.mintAddress === asset ||
          a.name.toLowerCase().includes(asset.toLowerCase())
        );

        if (!foundAsset) {
          throw new Error(`Asset not found: ${asset}. Available: ${SOLANA_ASSETS.map(a => a.symbol).join(', ')}`);
        }

        // Get OHLC data
        const ohlcData = await priceService.getOHLCData(foundAsset.mintAddress, interval, Math.max(lookback + 20, 50));
        const candles = ohlcData.map(d => ({
          timestamp: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        }));

        // Calculate RSI
        const rsi = rsiService.calculateRSI(candles, 14);

        // Detect divergence
        const divergence = rsiService.detectRSIDivergence(rsi, candles, lookback);

        const currentRSI = rsi[rsi.length - 1];
        const currentPrice = candles[candles.length - 1].close;

        const response = {
          status: "success",
          timestamp: new Date().toISOString(),
          asset: {
            name: foundAsset.name,
            symbol: foundAsset.symbol,
            category: foundAsset.category,
            currentPrice
          },
          interval,
          lookback,
          currentRSI: currentRSI !== null ? currentRSI.toFixed(2) : 'N/A',
          divergence: {
            bullish: divergence.bullish,
            bearish: divergence.bearish,
            strength: divergence.strength,
            interpretation: divergence.bullish
              ? "Bullish divergence detected - potential reversal to upside"
              : divergence.bearish
              ? "Bearish divergence detected - potential reversal to downside"
              : "No divergence detected"
          },
          tradingImplication: divergence.bullish
            ? "Consider LONG positions - price may reverse upward"
            : divergence.bearish
            ? "Consider closing LONG positions or SHORTING - price may reverse downward"
            : "No clear divergence signal - use other indicators",
          note: "Divergence signals are advanced reversal indicators with high significance when confirmed"
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString(),
              note: "Divergence detection requires sufficient OHLC data. Ensure the server has been running for adequate data collection."
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 8: Get Latest Crypto News
  server.registerTool(
    "get-crypto-news",
    {
      title: "Get Latest Crypto News",
      description: "Fetch the latest cryptocurrency news articles with pagination support",
      inputSchema: {
        page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
        limit: z.number().int().min(1).max(50).optional().describe("Number of articles to return (default: 10)")
      }
    },
    async ({ page = 1, limit = 10 }) => {
      try {
        const newsData = await newsService.getLatestNews(page);

        // Limit the number of articles returned
        const articles = newsData.articles.slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              timestamp: new Date().toISOString(),
              pagination: {
                currentPage: newsData.currentPage,
                totalPages: newsData.totalPages,
                totalArticles: newsData.totalArticles,
                showing: articles.length
              },
              articles: articles.map(article => ({
                title: article.title,
                source: article.source,
                summary: article.summary,
                url: article.url,
                publishedAt: new Date(article.article_date * 1000).toISOString(),
                id: article.id
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 9: Search Crypto News
  server.registerTool(
    "search-crypto-news",
    {
      title: "Search Crypto News",
      description: "Search cryptocurrency news by keyword in title, summary, or source",
      inputSchema: {
        query: z.string().min(1).describe("Search keyword (e.g., 'Bitcoin', 'Ethereum', 'DeFi')"),
        page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
        limit: z.number().int().min(1).max(50).optional().describe("Number of articles to return (default: 10)")
      }
    },
    async ({ query, page = 1, limit = 10 }) => {
      try {
        const newsData = await newsService.searchNews(query, page);

        // Limit the number of articles returned
        const articles = newsData.articles.slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              timestamp: new Date().toISOString(),
              searchQuery: query,
              resultsFound: newsData.count,
              showing: articles.length,
              articles: articles.map(article => ({
                title: article.title,
                source: article.source,
                summary: article.summary,
                url: article.url,
                publishedAt: new Date(article.article_date * 1000).toISOString(),
                relevance: article.title.toLowerCase().includes(query.toLowerCase()) ? 'high' : 'medium',
                id: article.id
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 10: Get Asset-Related News
  server.registerTool(
    "get-asset-news",
    {
      title: "Get Asset-Related Crypto News",
      description: "Get news articles related to specific crypto assets (Bitcoin, Ethereum, Solana, XRP, etc.)",
      inputSchema: {
        assets: z.array(z.string()).min(1).describe("Asset keywords to search for (e.g., ['Bitcoin', 'BTC', 'WBTC'])"),
        page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
        limit: z.number().int().min(1).max(50).optional().describe("Number of articles to return (default: 10)")
      }
    },
    async ({ assets, page = 1, limit = 10 }) => {
      try {
        const newsData = await newsService.getAssetRelatedNews(assets, page);

        // Limit the number of articles returned
        const articles = newsData.articles.slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              timestamp: new Date().toISOString(),
              assetKeywords: assets,
              resultsFound: newsData.count,
              showing: articles.length,
              articles: articles.map(article => ({
                title: article.title,
                source: article.source,
                summary: article.summary,
                url: article.url,
                publishedAt: new Date(article.article_date * 1000).toISOString(),
                mentionedAssets: assets.filter(asset =>
                  article.title.toLowerCase().includes(asset.toLowerCase()) ||
                  article.summary.toLowerCase().includes(asset.toLowerCase())
                ),
                id: article.id
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 11: Get News Summary
  server.registerTool(
    "get-news-summary",
    {
      title: "Get Crypto News Summary",
      description: "Get summary statistics about crypto news including top sources, trending topics, and latest articles",
      inputSchema: {
        pageCount: z.number().int().min(1).max(5).optional().describe("Number of pages to analyze (default: 2)")
      }
    },
    async ({ pageCount = 2 }) => {
      try {
        const summary = await newsService.getNewsSummary(pageCount);
        const trending = await newsService.getTrendingTopics(15);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              timestamp: new Date().toISOString(),
              summary: {
                totalArticlesAnalyzed: summary.totalArticles,
                uniqueSources: summary.sources.length,
                topSources: summary.topSources,
                latestArticle: summary.latestArticle,
                trendingTopics: trending
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error occurred",
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }
  );
}

// Helper functions for analytics
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;

  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
}

function calculateTrend(prices: number[]): string {
  if (prices.length < 2) return 'neutral';

  const firstThird = prices.slice(0, Math.floor(prices.length / 3));
  const lastThird = prices.slice(-Math.floor(prices.length / 3));

  const avgFirst = firstThird.reduce((sum, p) => sum + p, 0) / firstThird.length;
  const avgLast = lastThird.reduce((sum, p) => sum + p, 0) / lastThird.length;

  const change = (avgLast - avgFirst) / avgFirst;

  if (change > 0.02) return 'strongly_bullish';
  if (change > 0.005) return 'bullish';
  if (change < -0.02) return 'strongly_bearish';
  if (change < -0.005) return 'bearish';
  return 'neutral';
}
