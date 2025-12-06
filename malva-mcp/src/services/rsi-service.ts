/**
 * RSI (Relative Strength Index) Service
 *
 * Implements RSI calculation, signal detection, divergence analysis,
 * and multi-timeframe analysis for Solana RWA assets
 */

import { PriceService } from './price-service.js';
import { SolanaAsset } from '../types/assets.js';
import { TimeInterval } from '../config/assets.js';
import {
  RSIAnalysisResult,
  RSIThresholds,
  BuySignalResult,
  ExitSignalResult,
  DivergenceResult,
  MultiTimeframeRSI,
  PortfolioSignals
} from '../types/rsi.js';

/**
 * OHLC Candle interface (matches PriceService internal type)
 */
interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Asset-specific RSI thresholds and parameters
 */
const RSI_THRESHOLDS: Record<string, RSIThresholds> = {
  'wrapped-btc': {
    period: 14,
    oversold: 30,
    overbought: 70,
    timeframe: '1h',
    stopLoss: 0.03,      // 3%
    takeProfit: 0.05     // 5%
  },
  'rwa-stocks': {
    period: 14,
    oversold: 35,
    overbought: 65,
    timeframe: '5m',
    stopLoss: 0.025,     // 2.5%
    takeProfit: 0.04     // 4%
  },
  'gold': {
    period: 21,
    oversold: 25,
    overbought: 75,
    timeframe: '1h',
    stopLoss: 0.015,     // 1.5%
    takeProfit: 0.03     // 3%
  }
};

export class RSIService {
  constructor(private priceService: PriceService) {}

  /**
   * Calculate RSI using the standard Wilder's smoothing method
   *
   * Formula:
   * 1. Calculate price changes (gains and losses)
   * 2. Calculate average gain and loss using exponential smoothing
   * 3. Calculate RS = Average Gain / Average Loss
   * 4. Calculate RSI = 100 - (100 / (1 + RS))
   *
   * @param candles - Array of OHLC candles
   * @param period - RSI period (default 14)
   * @returns Array of RSI values (same length as candles, first N values will be null)
   */
  calculateRSI(candles: OHLCCandle[], period: number = 14): (number | null)[] {
    if (candles.length < period + 1) {
      console.warn(`Insufficient candles for RSI calculation. Need ${period + 1}, got ${candles.length}`);
      return candles.map(() => null);
    }

    const rsiValues: (number | null)[] = new Array(candles.length).fill(null);
    const gains: number[] = [];
    const losses: number[] = [];

    // Step 1: Calculate price changes
    for (let i = 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    if (gains.length < period) {
      return rsiValues;
    }

    // Step 2: Calculate first average gain and loss (simple average)
    let avgGain = gains.slice(0, period).reduce((sum, g) => sum + g, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, l) => sum + l, 0) / period;

    // Calculate first RSI value
    const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + firstRS));

    // Step 3: Calculate subsequent RSI values using Wilder's smoothing
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues[i + 1] = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    }

    return rsiValues;
  }

  /**
   * Detect buy signal based on asset type and RSI crossover
   */
  detectBuySignal(
    rsi: (number | null)[],
    candles: OHLCCandle[],
    assetType: 'wrapped-btc' | 'rwa-stocks' | 'gold'
  ): BuySignalResult {
    const thresholds = RSI_THRESHOLDS[assetType];
    const len = rsi.length;

    if (len < 2) {
      return { signal: false, confidence: 0, reason: 'Insufficient RSI data' };
    }

    const currentRSI = rsi[len - 1];
    const previousRSI = rsi[len - 2];
    const currentClose = candles[len - 1].close;
    const previousClose = candles[len - 2].close;

    if (currentRSI === null || previousRSI === null) {
      return { signal: false, confidence: 0, reason: 'RSI values not yet available' };
    }

    const baseScore = 0.5;
    let confidence = 0;
    const reasons: string[] = [];

    // Asset-specific buy conditions
    if (assetType === 'wrapped-btc') {
      // BTC: RSI(t-1) < 30 AND RSI(t) > 30 AND Close(t) > Close(t-1)
      if (previousRSI < thresholds.oversold && currentRSI > thresholds.oversold && currentClose > previousClose) {
        confidence = baseScore;
        reasons.push('RSI oversold reversal');

        // Bonus: Strong price action
        if (currentClose > previousClose * 1.005) {
          confidence += 0.1;
          reasons.push('strong upward price movement');
        }
      }
    } else if (assetType === 'rwa-stocks') {
      // Stocks: RSI(t-1) < 35 AND RSI(t) > 35 AND Close(t) > EMA50(t)
      if (previousRSI < thresholds.oversold && currentRSI > thresholds.oversold) {
        const ema50 = this.calculateEMA(candles.map(c => c.close), 50);
        const currentEMA = ema50[ema50.length - 1];

        if (currentEMA !== null && currentClose > currentEMA) {
          confidence = baseScore;
          reasons.push('RSI oversold reversal above EMA50');
        }
      }
    } else if (assetType === 'gold') {
      // Gold: RSI(t-1) < 25 AND RSI(t) > 25 AND 3 consecutive higher closes
      if (previousRSI < thresholds.oversold && currentRSI > thresholds.oversold) {
        const hasConsecutiveHigherCloses = len >= 3 &&
          candles[len - 1].close > candles[len - 2].close &&
          candles[len - 2].close > candles[len - 3].close;

        if (hasConsecutiveHigherCloses) {
          confidence = baseScore;
          reasons.push('RSI oversold reversal with consecutive higher closes');
        }
      }
    }

    if (confidence > 0) {
      // Additional bonuses for multi-timeframe alignment (placeholder - would need implementation)
      // For now, just return base confidence
      return {
        signal: true,
        confidence: Math.min(confidence, 1.0),
        reason: reasons.join(', ')
      };
    }

    return { signal: false, confidence: 0, reason: `RSI in neutral zone (${currentRSI.toFixed(2)})` };
  }

  /**
   * Detect exit signal based on overbought, profit targets, or stop loss
   */
  detectExitSignal(
    rsi: (number | null)[],
    candles: OHLCCandle[],
    entryPrice: number,
    assetType: 'wrapped-btc' | 'rwa-stocks' | 'gold'
  ): ExitSignalResult {
    const thresholds = RSI_THRESHOLDS[assetType];
    const currentRSI = rsi[rsi.length - 1];
    const currentPrice = candles[candles.length - 1].close;

    const stopLossPrice = entryPrice * (1 - thresholds.stopLoss);
    const takeProfitPrice = entryPrice * (1 + thresholds.takeProfit);

    // Check stop loss
    if (currentPrice <= stopLossPrice) {
      return {
        shouldExit: true,
        reason: `Stop loss triggered at ${currentPrice.toFixed(2)} (entry: ${entryPrice.toFixed(2)})`,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice
      };
    }

    // Check take profit
    if (currentPrice >= takeProfitPrice) {
      return {
        shouldExit: true,
        reason: `Take profit target reached at ${currentPrice.toFixed(2)} (entry: ${entryPrice.toFixed(2)})`,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice
      };
    }

    // Check overbought
    if (currentRSI !== null && currentRSI > thresholds.overbought) {
      return {
        shouldExit: true,
        reason: `RSI overbought (${currentRSI.toFixed(2)} > ${thresholds.overbought})`,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice
      };
    }

    return {
      shouldExit: false,
      reason: 'No exit signal',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice
    };
  }

  /**
   * Detect RSI divergence (bullish or bearish)
   *
   * Bullish divergence: Price makes lower lows, but RSI makes higher lows
   * Bearish divergence: Price makes higher highs, but RSI makes lower highs
   */
  detectRSIDivergence(
    rsi: (number | null)[],
    candles: OHLCCandle[],
    lookback: number = 10
  ): DivergenceResult {
    if (rsi.length < lookback || candles.length < lookback) {
      return { bullish: false, bearish: false, divergencePoints: [] };
    }

    const recentRSI = rsi.slice(-lookback).filter((r): r is number => r !== null);
    const recentCandles = candles.slice(-lookback);

    if (recentRSI.length < lookback) {
      return { bullish: false, bearish: false, divergencePoints: [] };
    }

    // Find local peaks and troughs
    const priceLows: number[] = [];
    const priceHighs: number[] = [];
    const rsiLows: number[] = [];
    const rsiHighs: number[] = [];

    for (let i = 1; i < lookback - 1; i++) {
      // Local low
      if (recentCandles[i].low < recentCandles[i - 1].low &&
          recentCandles[i].low < recentCandles[i + 1].low) {
        priceLows.push(recentCandles[i].low);
        rsiLows.push(recentRSI[i]);
      }

      // Local high
      if (recentCandles[i].high > recentCandles[i - 1].high &&
          recentCandles[i].high > recentCandles[i + 1].high) {
        priceHighs.push(recentCandles[i].high);
        rsiHighs.push(recentRSI[i]);
      }
    }

    // Detect bullish divergence
    let bullish = false;
    if (priceLows.length >= 2 && rsiLows.length >= 2) {
      const priceDowntrend = priceLows[priceLows.length - 1] < priceLows[priceLows.length - 2];
      const rsiUptrend = rsiLows[rsiLows.length - 1] > rsiLows[rsiLows.length - 2];
      bullish = priceDowntrend && rsiUptrend;
    }

    // Detect bearish divergence
    let bearish = false;
    if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
      const priceUptrend = priceHighs[priceHighs.length - 1] > priceHighs[priceHighs.length - 2];
      const rsiDowntrend = rsiHighs[rsiHighs.length - 1] < rsiHighs[rsiHighs.length - 2];
      bearish = priceUptrend && rsiDowntrend;
    }

    return {
      bullish,
      bearish,
      divergencePoints: [],
      strength: bullish || bearish ? 0.7 : undefined
    };
  }

  /**
   * Get multi-timeframe RSI analysis
   */
  async getMultiTimeframeRSI(
    mintAddress: string,
    intervals: TimeInterval[]
  ): Promise<MultiTimeframeRSI[]> {
    const results: MultiTimeframeRSI[] = [];

    for (const interval of intervals) {
      try {
        const ohlcData = await this.priceService.getOHLCData(mintAddress, interval, 50);
        const candles: OHLCCandle[] = ohlcData.map(d => ({
          timestamp: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        }));

        const rsi = this.calculateRSI(candles, 14);
        const currentRSI = rsi[rsi.length - 1];

        if (currentRSI !== null) {
          let status = 'neutral';
          if (currentRSI < 30) status = 'oversold';
          else if (currentRSI > 70) status = 'overbought';

          results.push({
            interval,
            rsi: currentRSI,
            status
          });
        }
      } catch (error) {
        console.warn(`Failed to get RSI for ${mintAddress} at ${interval}:`, error);
      }
    }

    return results;
  }

  /**
   * Complete RSI analysis for a single asset
   */
  async analyzeAsset(
    asset: SolanaAsset,
    interval?: TimeInterval
  ): Promise<RSIAnalysisResult> {
    const thresholds = RSI_THRESHOLDS[asset.category];
    const timeframe = interval || (thresholds.timeframe as TimeInterval);

    // Get OHLC data
    const ohlcData = await this.priceService.getOHLCData(asset.mintAddress, timeframe, 100);
    const candles: OHLCCandle[] = ohlcData.map(d => ({
      timestamp: d.timestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }));

    // Calculate RSI
    const rsi = this.calculateRSI(candles, thresholds.period);
    const currentRSI = rsi[rsi.length - 1];

    if (currentRSI === null) {
      throw new Error(`Unable to calculate RSI for ${asset.symbol}`);
    }

    const currentPrice = candles[candles.length - 1].close;

    // Determine RSI status
    let rsiStatus: 'oversold' | 'neutral' | 'overbought' = 'neutral';
    if (currentRSI < thresholds.oversold) rsiStatus = 'oversold';
    else if (currentRSI > thresholds.overbought) rsiStatus = 'overbought';

    // Detect buy signal
    const buySignal = this.detectBuySignal(rsi, candles, asset.category);

    // Detect divergence
    const divergence = this.detectRSIDivergence(rsi, candles, 10);

    // Determine action
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    let reason = 'No clear signal';
    let entryPrice: number | undefined;
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;
    let riskRewardRatio: number | undefined;

    if (buySignal.signal) {
      action = 'BUY';
      confidence = buySignal.confidence;
      reason = buySignal.reason;
      entryPrice = currentPrice;
      stopLoss = currentPrice * (1 - thresholds.stopLoss);
      takeProfit = currentPrice * (1 + thresholds.takeProfit);
      riskRewardRatio = thresholds.takeProfit / thresholds.stopLoss;

      // Bonus for divergence
      if (divergence.bullish) {
        confidence = Math.min(confidence + 0.2, 1.0);
        reason += ' with bullish divergence confirmation';
      }
    } else if (rsiStatus === 'overbought') {
      action = 'SELL';
      confidence = 0.6;
      reason = `RSI overbought at ${currentRSI.toFixed(2)}`;
    } else {
      reason = `RSI in neutral zone (${currentRSI.toFixed(2)})`;
    }

    // Calculate momentum
    const momentum = this.calculateMomentum(rsi, 5);

    // Multi-timeframe analysis
    const multiTimeframeIntervals: TimeInterval[] = ['5m', '1h', '1w'];
    const mtfRSI = await this.getMultiTimeframeRSI(asset.mintAddress, multiTimeframeIntervals);
    const multiTimeframe: { [interval: string]: number } = {};
    mtfRSI.forEach(m => {
      multiTimeframe[m.interval] = m.rsi;
    });

    return {
      asset: asset.name,
      symbol: asset.symbol,
      category: asset.category,
      currentPrice,
      rsi: {
        value: currentRSI,
        period: thresholds.period,
        timeframe,
        status: rsiStatus
      },
      signal: {
        action,
        confidence,
        entryPrice,
        stopLoss,
        takeProfit,
        riskRewardRatio,
        reason
      },
      analysis: {
        divergence: divergence.bullish || divergence.bearish ? divergence : null,
        momentum,
        multiTimeframe
      },
      timestamp: Date.now()
    };
  }

  /**
   * Get portfolio-wide signals
   */
  async getPortfolioSignals(
    assets: SolanaAsset[],
    minConfidence: number = 0.6
  ): Promise<PortfolioSignals> {
    const analysisPromises = assets.map(asset => this.analyzeAsset(asset));
    const analyses = await Promise.allSettled(analysisPromises);

    const signals: RSIAnalysisResult[] = [];
    const summary = {
      totalBuySignals: 0,
      totalSellSignals: 0,
      totalHoldSignals: 0,
      byCategory: {} as { [category: string]: { buy: number; sell: number; hold: number } }
    };

    analyses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const analysis = result.value;

        // Only include signals meeting minimum confidence
        if (analysis.signal.confidence >= minConfidence || analysis.signal.action === 'HOLD') {
          signals.push(analysis);

          // Update summary
          if (analysis.signal.action === 'BUY') summary.totalBuySignals++;
          else if (analysis.signal.action === 'SELL') summary.totalSellSignals++;
          else summary.totalHoldSignals++;

          // Update category summary
          if (!summary.byCategory[analysis.category]) {
            summary.byCategory[analysis.category] = { buy: 0, sell: 0, hold: 0 };
          }

          if (analysis.signal.action === 'BUY') summary.byCategory[analysis.category].buy++;
          else if (analysis.signal.action === 'SELL') summary.byCategory[analysis.category].sell++;
          else summary.byCategory[analysis.category].hold++;
        }
      } else {
        console.error(`Failed to analyze ${assets[index].symbol}:`, result.reason);
      }
    });

    return {
      timestamp: Date.now(),
      signals,
      summary
    };
  }

  /**
   * Calculate momentum from RSI values
   */
  private calculateMomentum(rsi: (number | null)[], lookback: number = 5): 'building' | 'weakening' | 'strong' | 'weak' | 'neutral' {
    const recentRSI = rsi.slice(-lookback).filter((r): r is number => r !== null);

    if (recentRSI.length < 2) return 'neutral';

    const currentRSI = recentRSI[recentRSI.length - 1];
    const previousRSI = recentRSI[0];
    const change = currentRSI - previousRSI;

    if (change > 10) return 'building';
    if (change < -10) return 'weakening';
    if (currentRSI > 60) return 'strong';
    if (currentRSI < 40) return 'weak';
    return 'neutral';
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): (number | null)[] {
    if (prices.length < period) {
      return prices.map(() => null);
    }

    const ema: (number | null)[] = new Array(prices.length).fill(null);
    const multiplier = 2 / (period + 1);

    // Calculate SMA for first EMA value
    const sma = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
    ema[period - 1] = sma;

    // Calculate EMA for subsequent values
    for (let i = period; i < prices.length; i++) {
      ema[i] = (prices[i] - ema[i - 1]!) * multiplier + ema[i - 1]!;
    }

    return ema;
  }
}
