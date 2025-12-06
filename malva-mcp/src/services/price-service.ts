import { PriceData, OHLCData, SolanaAsset, TimeIntervalData } from '../types/assets.js';
import { SOLANA_ASSETS, TimeInterval, TIME_INTERVALS } from '../config/assets.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export class PriceService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cacheTTL = parseInt(process.env.CACHE_TTL || '5000');
  private readonly MAX_CACHE_SIZE = 100;

  // Jupiter Price API - Use lite API for public access (no auth required)
  private jupiterPriceApiUrl = process.env.JUPITER_PRICE_API_URL || 'https://lite-api.jup.ag/price/v3';
  private solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  // OHLC candle storage: Map<mintAddress, Map<interval, candles[]>>
  private ohlcStorage = new Map<string, Map<TimeInterval, OHLCCandle[]>>();
  private maxCandlesPerInterval = parseInt(process.env.MAX_CANDLES || '1000');

  constructor() {
    // Validate cache TTL
    if (isNaN(this.cacheTTL) || this.cacheTTL < 0) {
      this.cacheTTL = 5000;
    }
  }

  private fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return Promise.resolve(cached.data);
    }

    return fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });

      // LRU eviction if cache grows too large
      if (this.cache.size > this.MAX_CACHE_SIZE) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }

      return data;
    });
  }

  /**
   * Get current prices for all or filtered assets using Jupiter Price API v2
   */
  async getCurrentPrices(category?: string): Promise<PriceData[]> {
    const assets = category
      ? SOLANA_ASSETS.filter(asset => asset.category === category)
      : SOLANA_ASSETS;

    const pricePromises = assets.map(asset => this.getAssetPrice(asset));
    const prices = await Promise.allSettled(pricePromises);

    return prices
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch price for ${assets[index].name}:`, result.reason);
          return null;
        }
      })
      .filter((price): price is PriceData => price !== null);
  }

  /**
   * Get current price for a single asset from Jupiter Price API v2
   */
  private async getAssetPrice(asset: SolanaAsset): Promise<PriceData> {
    const cacheKey = `price_${asset.mintAddress}`;

    return this.fetchWithCache(cacheKey, async () => {
      try {
        const response = await fetch(
          `${this.jupiterPriceApiUrl}?ids=${asset.mintAddress}&showExtraInfo=true`
        );

        if (!response.ok) {
          throw new Error(`Jupiter Price API error: ${response.status}`);
        }

        const data = await response.json();
        const priceInfo = data[asset.mintAddress];

        if (!priceInfo || !priceInfo.usdPrice) {
          throw new Error(`No price data available for ${asset.symbol}`);
        }

        const price = parseFloat(priceInfo.usdPrice.toString());
        const timestamp = Date.now();

        // Update OHLC candles with this new price
        this.updateOHLCCandles(asset.mintAddress, price, timestamp);

        // Extract 24h price change if available
        const priceChange24h = priceInfo.priceChange24h
          ? parseFloat(priceInfo.priceChange24h.toString())
          : this.calculatePriceChange24h(asset.mintAddress, price);

        return {
          asset: asset.name,
          symbol: asset.symbol,
          category: asset.category,
          price: price,
          priceChange24h,
          volume24h: undefined, // v3 API doesn't provide volume in basic response
          timestamp: timestamp,
          source: 'jupiter'
        };
      } catch (error) {
        throw new Error(
          `Unable to fetch real-time price for ${asset.symbol} from Jupiter API: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    });
  }

  /**
   * Update OHLC candles for all intervals when a new price comes in
   */
  private updateOHLCCandles(mintAddress: string, price: number, timestamp: number): void {
    if (!this.ohlcStorage.has(mintAddress)) {
      this.ohlcStorage.set(mintAddress, new Map());
    }

    const assetCandles = this.ohlcStorage.get(mintAddress)!;

    // Update candles for each interval
    Object.keys(TIME_INTERVALS).forEach(interval => {
      const timeInterval = interval as TimeInterval;
      const intervalDuration = TIME_INTERVALS[timeInterval].duration;

      if (!assetCandles.has(timeInterval)) {
        assetCandles.set(timeInterval, []);
      }

      const candles = assetCandles.get(timeInterval)!;
      const currentCandleTime = Math.floor(timestamp / intervalDuration) * intervalDuration;

      // Find or create current candle
      let currentCandle = candles.find(c => c.timestamp === currentCandleTime);

      if (!currentCandle) {
        // Create new candle
        currentCandle = {
          timestamp: currentCandleTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0
        };
        candles.push(currentCandle);

        // Keep only last N candles (LRU)
        if (candles.length > this.maxCandlesPerInterval) {
          candles.shift();
        }
      } else {
        // Update existing candle
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
      }
    });
  }

  /**
   * Calculate price change from Jupiter's quoted price data
   */
  private calculatePriceChangeFromQuoted(currentPrice: number, quotedPrice: Record<string, unknown>): number | undefined {
    const buyPrice = quotedPrice.buyPrice as number | undefined;
    const sellPrice = quotedPrice.sellPrice as number | undefined;

    if (!buyPrice || !sellPrice) return undefined;

    const avgPrice = (buyPrice + sellPrice) / 2;
    return ((currentPrice - avgPrice) / avgPrice) * 100;
  }

  /**
   * Estimate 24h volume from depth data
   */
  private estimateVolume24h(depth: Record<string, unknown>): number | undefined {
    const buyImpact = depth.buyPriceImpactRatio as Record<string, Record<string, number>> | undefined;
    const sellImpact = depth.sellPriceImpactRatio as Record<string, Record<string, number>> | undefined;

    if (!buyImpact?.depth || !sellImpact?.depth) return undefined;

    // Use the 100 depth level as volume estimate
    const buyDepth = buyImpact.depth['100'] || 0;
    const sellDepth = sellImpact.depth['100'] || 0;

    return (buyDepth + sellDepth) * 100; // Rough estimate
  }

  /**
   * Calculate 24h price change percentage from stored OHLC data
   */
  private calculatePriceChange24h(mintAddress: string, currentPrice: number): number | undefined {
    const assetCandles = this.ohlcStorage.get(mintAddress);
    if (!assetCandles) return undefined;

    const hourCandles = assetCandles.get('1h');
    if (!hourCandles || hourCandles.length < 24) return undefined;

    const price24hAgo = hourCandles[Math.max(0, hourCandles.length - 24)].open;
    return ((currentPrice - price24hAgo) / price24hAgo) * 100;
  }

  /**
   * Get OHLC data for a specific asset and interval
   */
  async getOHLCData(assetId: string, interval: TimeInterval, count: number = 100): Promise<OHLCData[]> {
    const asset = SOLANA_ASSETS.find(a =>
      a.mintAddress === assetId ||
      a.symbol.toLowerCase() === assetId.toLowerCase()
    );

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Ensure we have recent price data
    await this.getAssetPrice(asset);

    const assetCandles = this.ohlcStorage.get(asset.mintAddress);
    if (!assetCandles) {
      throw new Error(`No OHLC data available for ${asset.symbol}. Please wait for data collection.`);
    }

    const candles = assetCandles.get(interval);
    if (!candles || candles.length === 0) {
      throw new Error(`No OHLC data available for ${asset.symbol} at ${interval} interval`);
    }

    // Return the most recent 'count' candles
    const recentCandles = candles.slice(-count);

    return recentCandles.map(candle => ({
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));
  }

  /**
   * Get interval-based price tracking with OHLC data
   */
  async getIntervalPrices(assetId: string, interval: TimeInterval, count: number = 100): Promise<TimeIntervalData> {
    const asset = SOLANA_ASSETS.find(a =>
      a.mintAddress === assetId ||
      a.symbol.toLowerCase() === assetId.toLowerCase()
    );

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Get OHLC data
    const ohlcData = await this.getOHLCData(assetId, interval, count);

    // Convert OHLC to price data points
    const priceData: PriceData[] = ohlcData.map(ohlc => ({
      asset: asset.name,
      symbol: asset.symbol,
      category: asset.category,
      price: ohlc.close,
      timestamp: ohlc.timestamp,
      source: 'jupiter'
    }));

    return {
      asset: asset.name,
      symbol: asset.symbol,
      interval: interval,
      data: priceData,
      ohlc: ohlcData,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get token metadata from Solana RPC
   */
  async getTokenInfo(mintAddress: string): Promise<Record<string, unknown> | null> {
    const cacheKey = `token_info_${mintAddress}`;

    return this.fetchWithCache(cacheKey, async () => {
      try {
        const response = await fetch(this.solanaRpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getAccountInfo',
            params: [
              mintAddress,
              {
                encoding: 'jsonParsed',
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Solana RPC error: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
      } catch (error) {
        console.error(`Failed to fetch token info for ${mintAddress}:`, error);
        return null;
      }
    });
  }

  /**
   * Start background price polling for real-time OHLC updates
   */
  startPricePolling(intervalMs: number = 5000): void {
    console.log(`🔄 Starting real-time price polling every ${intervalMs}ms`);
    setInterval(async () => {
      try {
        await this.getCurrentPrices();
      } catch (error) {
        console.error('Error polling prices:', error);
      }
    }, intervalMs);
  }

  /**
   * Get statistics about stored OHLC data
   */
  getOHLCStats(): Record<string, unknown> {
    const stats: Record<string, unknown> = {};

    this.ohlcStorage.forEach((intervals, mintAddress) => {
      const asset = SOLANA_ASSETS.find(a => a.mintAddress === mintAddress);
      if (!asset) return;

      const intervalStats: Record<string, number> = {};
      intervals.forEach((candles, interval) => {
        intervalStats[interval] = candles.length;
      });

      stats[asset.symbol] = intervalStats;
    });

    return stats;
  }
}
