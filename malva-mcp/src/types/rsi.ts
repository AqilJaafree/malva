/**
 * RSI Analysis Type Definitions
 *
 * Types for RSI-based trading signal analysis system
 */

export interface RSIAnalysisResult {
  asset: string;
  symbol: string;
  category: string;
  currentPrice: number;
  rsi: {
    value: number;
    period: number;
    timeframe: string;
    status: 'oversold' | 'neutral' | 'overbought';
  };
  signal: {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;  // 0.0 to 1.0
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    riskRewardRatio?: number;
    reason: string;
  };
  analysis: {
    divergence: {
      bullish: boolean;
      bearish: boolean;
      strength?: number;
    } | null;
    momentum: 'building' | 'weakening' | 'strong' | 'weak' | 'neutral';
    multiTimeframe?: {
      [interval: string]: number;  // interval -> RSI value
    };
  };
  timestamp: number;
}

export interface PortfolioSignals {
  timestamp: number;
  signals: RSIAnalysisResult[];
  summary: {
    totalBuySignals: number;
    totalSellSignals: number;
    totalHoldSignals: number;
    byCategory: {
      [category: string]: {
        buy: number;
        sell: number;
        hold: number;
      };
    };
  };
}

export interface RSIThresholds {
  period: number;
  oversold: number;
  overbought: number;
  timeframe: string;
  stopLoss: number;
  takeProfit: number;
}

export interface BuySignalResult {
  signal: boolean;
  confidence: number;
  reason: string;
}

export interface ExitSignalResult {
  shouldExit: boolean;
  reason: string;
  stopLoss: number;
  takeProfit: number;
}

export interface DivergenceResult {
  bullish: boolean;
  bearish: boolean;
  divergencePoints: number[];
  strength?: number;
}

export interface MultiTimeframeRSI {
  interval: string;
  rsi: number;
  status: string;
}
