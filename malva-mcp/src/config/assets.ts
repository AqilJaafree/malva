import { SolanaAsset } from '../types/assets.js';

// Solana RWA asset mint addresses - real-time tracking via Jupiter
export const SOLANA_ASSETS: SolanaAsset[] = [
  // Wrapped BTC assets on Solana
  {
    name: 'Wrapped Bitcoin (Portal)',
    symbol: 'WBTC',
    mintAddress: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    category: 'wrapped-btc',
    description: 'Wrapped Bitcoin on Solana via Portal Bridge'
  },
  {
    name: 'Coinbase Wrapped BTC',
    symbol: 'cbBTC',
    mintAddress: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
    category: 'wrapped-btc',
    description: 'Coinbase Wrapped Bitcoin on Solana'
  },
  {
    name: 'Zeus Bitcoin',
    symbol: 'zBTC',
    mintAddress: 'zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg',
    category: 'wrapped-btc',
    description: 'Bitcoin on Solana via Zeus Network - permissionless Bitcoin bridge'
  },

  // RWA Stock tokens on Solana (xStocks)
  {
    name: 'Tesla xStock',
    symbol: 'TSLAx',
    mintAddress: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB',
    category: 'rwa-stocks',
    description: 'Real World Asset - Tokenized Tesla stock on Solana via xStocks'
  },
  {
    name: 'Apple xStock',
    symbol: 'AAPLx',
    mintAddress: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp',
    category: 'rwa-stocks',
    description: 'Real World Asset - Tokenized Apple stock on Solana via xStocks'
  },
  {
    name: 'Microsoft xStock',
    symbol: 'MSFTx',
    mintAddress: 'XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX',
    category: 'rwa-stocks',
    description: 'Real World Asset - Tokenized Microsoft stock on Solana via xStocks'
  },
  {
    name: 'Amazon xStock',
    symbol: 'AMZNx',
    mintAddress: 'Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg',
    category: 'rwa-stocks',
    description: 'Real World Asset - Tokenized Amazon stock on Solana via xStocks'
  },
  {
    name: 'Alphabet xStock',
    symbol: 'GOOGLx',
    mintAddress: 'XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN',
    category: 'rwa-stocks',
    description: 'Real World Asset - Tokenized Alphabet/Google stock on Solana via xStocks'
  },
  {
    name: 'Netflix xStock',
    symbol: 'NFLXx',
    mintAddress: 'XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL',
    category: 'rwa-stocks',
    description: 'Real World Asset - Tokenized Netflix stock on Solana via xStocks'
  },

  // Gold-backed tokens on Solana
  {
    name: 'Paxos Gold',
    symbol: 'PAXG',
    mintAddress: 'C6oFsE8nXRDThzrMEQ5SxaNFGKoyyfWDDVPw37JKvPTe',
    category: 'gold',
    description: 'Physical gold-backed token (1 PAXG = 1 troy oz of gold)'
  },
  {
    name: 'Tether Gold',
    symbol: 'XAUT',
    mintAddress: 'AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P',
    category: 'gold',
    description: 'Physical gold-backed token by Tether (1 XAUt = 1 troy oz of gold)'
  }
];

export const TIME_INTERVALS = {
  '1s': { name: '1 Second', duration: 1000 },
  '1m': { name: '1 Minute', duration: 60 * 1000 },
  '5m': { name: '5 Minutes', duration: 5 * 60 * 1000 },
  '1h': { name: '1 Hour', duration: 60 * 60 * 1000 },
  '1w': { name: '1 Week', duration: 7 * 24 * 60 * 60 * 1000 },
  '1M': { name: '1 Month', duration: 30 * 24 * 60 * 60 * 1000 }
} as const;

export type TimeInterval = keyof typeof TIME_INTERVALS;