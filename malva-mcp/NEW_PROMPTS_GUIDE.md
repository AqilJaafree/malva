# MCP Server Prompts Guide

## Overview

The Malva MCP server now includes **6 powerful prompts** to help users generate sophisticated trading analysis and educational content for Solana RWA assets.

## Prompts List

### 1. `analyze-rwa-prices` - RWA Price Analysis
**Description**: Generate comprehensive analysis prompts for Solana RWA asset prices including market trends, comparisons, and investment insights.

**Parameters**:
- `analysis_type` (optional): `"market_overview"` | `"category_comparison"` | `"price_prediction"` | `"risk_analysis"`
- `asset_category` (optional): `"wrapped-btc"` | `"rwa-stocks"` | `"gold"` | `"all"`
- `time_frame` (optional): `"1h"` | `"1d"` | `"1w"` | `"1m"`
- `focus` (optional): Specific focus area or asset to emphasize

**Example Usage**:
```typescript
{
  analysis_type: "market_overview",
  asset_category: "wrapped-btc",
  time_frame: "1d"
}
```

**Use Cases**:
- Daily market overview reports
- Asset category comparisons
- Price forecasting analysis
- Risk assessment for portfolios

---

### 2. `rsi-trading-signals` - RSI Trading Signals Analysis ⭐ NEW
**Description**: Generate RSI-based trading recommendations with entry/exit points and risk management strategies.

**Parameters**:
- `asset` (optional): Specific asset symbol (e.g., `"WBTC"`, `"TSLAx"`, `"PAXG"`)
- `category` (optional): `"wrapped-btc"` | `"rwa-stocks"` | `"gold"` | `"all"`
- `signal_type` (optional): `"buy_opportunities"` | `"sell_warnings"` | `"neutral_analysis"` | `"comprehensive"`
- `risk_tolerance` (optional): `"conservative"` | `"moderate"` | `"aggressive"`

**Example Usage**:
```typescript
{
  asset: "WBTC",
  signal_type: "buy_opportunities",
  risk_tolerance: "moderate"
}
```

**Generated Analysis Includes**:
- RSI oversold/overbought conditions
- Bullish/bearish divergences
- Entry points with risk/reward ratios
- Stop-loss and take-profit levels
- Position sizing recommendations
- Multi-timeframe RSI alignment
- Confidence scores for each signal

**Use Cases**:
- Finding optimal entry points
- Identifying exit signals
- Risk-managed trading strategies
- Portfolio rebalancing decisions

---

### 3. `optimize-rwa-portfolio` - Portfolio Optimization ⭐ NEW
**Description**: Generate optimized portfolio allocation strategies based on current market conditions and RSI signals.

**Parameters**:
- `investment_amount` (optional): Total investment in USD as string (e.g., `"10000"`)
- `strategy` (optional): `"balanced"` | `"growth"` | `"defensive"` | `"income"`
- `rebalance` (optional): `"yes"` | `"no"`

**Example Usage**:
```typescript
{
  investment_amount: "50000",
  strategy: "balanced",
  rebalance: "yes"
}
```

**Generated Allocation Includes**:
1. Asset allocation percentages
2. Specific token recommendations
3. Entry timing based on RSI
4. Diversification strategy
5. Risk management plan
6. Expected returns and metrics
7. Monitoring checklist

**Use Cases**:
- Building new RWA portfolios
- Rebalancing existing positions
- Strategy-specific allocations
- Risk-optimized investing

---

### 4. `crypto-market-sentiment` - Market Sentiment Analysis ⭐ NEW
**Description**: Analyze overall crypto market sentiment using news, price action, and technical indicators.

**Parameters**:
- `focus_area` (optional): `"bitcoin"` | `"defi"` | `"rwa"` | `"solana"` | `"general"`
- `sentiment_depth` (optional): `"quick"` | `"detailed"` | `"comprehensive"`

**Example Usage**:
```typescript
{
  focus_area: "solana",
  sentiment_depth: "comprehensive"
}
```

**Analysis Levels**:

**Quick**: 3-5 bullet point summary

**Detailed**:
- Overall sentiment (bullish/bearish/neutral)
- Key news impact
- Technical indicators
- Volume trends
- Short/medium-term outlook

**Comprehensive**:
- News analysis
- Price action & RSI sentiment
- Volume & money flow
- Social sentiment
- Institutional activity
- Correlation analysis
- Near/medium-term predictions
- Risk catalysts

**Use Cases**:
- Daily market check-ins
- Pre-trade market assessment
- News impact analysis
- Sentiment-driven strategies

---

### 5. `risk-alerts` - Risk Alerts and Warnings ⭐ NEW
**Description**: Generate prioritized alerts for high-risk market conditions and portfolio warnings.

**Parameters**:
- `alert_level` (optional): `"critical"` | `"warning"` | `"monitoring"` | `"all"`
- `timeframe` (optional): `"immediate"` | `"short_term"` | `"medium_term"`

**Example Usage**:
```typescript
{
  alert_level: "critical",
  timeframe: "immediate"
}
```

**Alert Categories**:
1. Price Alerts (extreme overbought/oversold)
2. Volatility Warnings (unusual swings)
3. Liquidity Risks (low volume, wide spreads)
4. Technical Breakdowns (support breaks)
5. Divergence Warnings (RSI vs price)
6. Correlation Risks (unusual changes)
7. Market Structure (manipulation signs)
8. News-Based Risks (fundamental events)

**Each Alert Includes**:
- Severity rating
- Affected assets
- Recommended action
- Decision timeline

**Use Cases**:
- Portfolio risk monitoring
- Emergency exit signals
- Proactive risk management
- Loss prevention

---

### 6. `learn-rwa-trading` - Educational Trading Insights ⭐ NEW
**Description**: Generate educational content about RWA assets, RSI trading, and Solana DeFi strategies tailored to skill level.

**Parameters**:
- `topic` (optional): `"rwa_basics"` | `"rsi_trading"` | `"solana_defi"` | `"risk_management"` | `"technical_analysis"`
- `skill_level` (optional): `"beginner"` | `"intermediate"` | `"advanced"`

**Example Usage**:
```typescript
{
  topic: "rsi_trading",
  skill_level: "intermediate"
}
```

**Topics Covered**:

**RWA Basics**:
- Beginner: What are RWAs, types, how to trade
- Intermediate: Market structure, smart contract risks
- Advanced: Protocol architecture, yield strategies

**RSI Trading**:
- Beginner: RSI calculation, signals, common mistakes
- Intermediate: Divergences, multi-timeframe analysis
- Advanced: Optimization, algorithmic strategies

**Solana DeFi**:
- Beginner: Wallet setup, basic operations, safety
- Intermediate: DEX aggregators, lending, yield farming
- Advanced: Program development, flash loans

**Risk Management**:
- Beginner: Position sizing, stop-losses, discipline
- Intermediate: Kelly criterion, portfolio heat
- Advanced: VaR models, tail risk hedging

**Technical Analysis**:
- Beginner: Chart reading, patterns, volume
- Intermediate: Indicators (MACD, Bollinger Bands)
- Advanced: Order flow, footprint charts, backtesting

**Use Cases**:
- Onboarding new traders
- Skill development
- Strategy education
- Reference documentation

---

## Integration with Tools

These prompts work seamlessly with the MCP server's paid tools:

| Prompt | Suggested Tools |
|--------|----------------|
| `analyze-rwa-prices` | `get-current-prices`, `get-ohlc-data` |
| `rsi-trading-signals` | `get-rsi-analysis`, `get-portfolio-signals` |
| `optimize-rwa-portfolio` | `get-rsi-analysis`, `get-current-prices` |
| `crypto-market-sentiment` | `get-crypto-news`, `get-rsi-analysis` |
| `risk-alerts` | `get-rsi-analysis`, `get-rsi-divergence` |
| `learn-rwa-trading` | Any tool for examples |

## Payment Information

**Prompts**: FREE (no X402 payment required)

**Tools Used**: Paid via X402 protocol
- Price data: $0.01-0.02 USDC
- RSI analysis: $0.05 USDC
- News: $0.005 USDC

## Example Workflow

**Step 1**: Use prompt to generate analysis request
```typescript
// Prompt: rsi-trading-signals
{
  category: "wrapped-btc",
  signal_type: "buy_opportunities",
  risk_tolerance: "moderate"
}
```

**Step 2**: Execute suggested tools
```typescript
// Tool: get-rsi-analysis (costs $0.05 USDC)
{
  category: "wrapped-btc"
}
```

**Step 3**: Review generated trading plan with real data

---

## Best Practices

### Combining Prompts
1. Start with `crypto-market-sentiment` for context
2. Use `rsi-trading-signals` for specific opportunities
3. Apply `risk-alerts` for safety checks
4. Execute with `optimize-rwa-portfolio` for allocation

### Daily Trading Routine
```
Morning:
1. crypto-market-sentiment (quick)
2. risk-alerts (immediate)

Mid-day:
3. rsi-trading-signals (comprehensive)
4. optimize-rwa-portfolio (if opportunities found)

Evening:
5. analyze-rwa-prices (market_overview)
6. learn-rwa-trading (skill development)
```

### Educational Path
```
Week 1-2: learn-rwa-trading (rwa_basics, beginner)
Week 3-4: learn-rwa-trading (rsi_trading, beginner)
Week 5-6: learn-rwa-trading (risk_management, intermediate)
Week 7-8: Practice with rsi-trading-signals (conservative)
Week 9+: Advanced strategies
```

---

## Updates

**Version**: 1.1.0
**Date**: December 7, 2025
**Changes**:
- Added 5 new prompts (2-6)
- Total prompts increased from 1 to 6
- Enhanced educational content
- Added risk management prompts
- Improved parameter validation

---

## Support

For issues or questions:
- Server endpoint: `https://malva-production-1bcd.up.railway.app`
- Health check: `GET /health`
- Pricing info: `GET /pricing`
- Documentation: Model Context Protocol specification
