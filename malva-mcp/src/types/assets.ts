export interface SolanaAsset {
  name: string;
  symbol: string;
  mintAddress: string;
  category: 'wrapped-btc' | 'rwa-stocks' | 'gold';
  description: string;
}

export interface PriceData {
  asset: string;
  symbol: string;
  category: string;
  price: number;
  priceChange24h?: number;
  volume24h?: number;
  timestamp: number;
  source: 'jupiter' | 'coingecko';
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TimeIntervalData {
  asset: string;
  symbol: string;
  interval: string;
  data: PriceData[];
  ohlc?: OHLCData[];
  lastUpdated: number;
}