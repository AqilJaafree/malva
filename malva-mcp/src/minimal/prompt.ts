import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Sets up all MCP prompts for RWA trading and analysis
 */
export function setupMinimalPrompt(server: McpServer): void {
  // Prompt 1: RWA Price Analysis
  server.registerPrompt(
    "analyze-rwa-prices",
    {
      title: "RWA Price Analysis Prompt",
      description: "Generate analysis prompts for Solana RWA asset prices including market trends, comparisons, and investment insights",
      argsSchema: {
        analysis_type: z.enum(["market_overview", "category_comparison", "price_prediction", "risk_analysis"]).optional().describe("Type of analysis to perform (default: market_overview)"),
        asset_category: z.enum(["wrapped-btc", "rwa-stocks", "gold", "all"]).optional().describe("Asset category to focus on (default: all)"),
        time_frame: z.enum(["1h", "1d", "1w", "1m"]).optional().describe("Time frame for analysis (default: 1d)"),
        focus: z.string().optional().describe("Specific focus area or asset to emphasize")
      }
    },
    ({ analysis_type = "market_overview", asset_category = "all", time_frame = "1d", focus }) => {
      const prompts: Record<string, string> = {
        market_overview: `Please analyze the current Solana RWA market overview for ${asset_category} assets over the ${time_frame} timeframe. 

Focus on:
- Current price levels and trends
- Market cap and volume analysis  
- Cross-asset correlations
- Notable price movements or volatility
- Market sentiment indicators

Provide insights on overall market health and key drivers affecting ${asset_category === 'all' ? 'wrapped BTC, RWA stocks, and gold tokens' : asset_category} on Solana.${focus ? ` Pay special attention to: ${focus}` : ''}`,

        category_comparison: `Please provide a comparative analysis between different RWA asset categories on Solana over the ${time_frame} timeframe.

Compare:
- Performance metrics (returns, volatility, trading volume)
- Wrapped BTC vs RWA stocks vs gold-backed tokens
- Risk-adjusted returns and Sharpe ratios
- Correlation patterns and diversification benefits
- Liquidity and market depth differences

Identify which category is performing best and explain the underlying factors.${focus ? ` Give special consideration to: ${focus}` : ''}`,

        price_prediction: `Please generate a price forecast analysis for ${asset_category} RWA assets on Solana based on ${time_frame} historical data.

Include:
- Technical analysis indicators and patterns
- Support and resistance levels
- Momentum and trend indicators
- Potential price targets and scenarios
- Risk factors that could impact predictions
- Market catalysts and upcoming events

Provide both bullish and bearish scenarios with probability assessments.${focus ? ` Focus particularly on: ${focus}` : ''}`,

        risk_analysis: `Please conduct a comprehensive risk assessment for ${asset_category} RWA investments on Solana over the ${time_frame} period.

Analyze:
- Price volatility and downside risk
- Liquidity risks and slippage concerns
- Smart contract and bridge risks
- Regulatory and compliance risks
- Market concentration and counterparty risks
- Correlation risks during market stress

Provide risk mitigation strategies and portfolio allocation recommendations.${focus ? ` Emphasize risks related to: ${focus}` : ''}`
      };

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: prompts[analysis_type]
          }
        }]
      };
    }
  );

  // Prompt 2: RSI Trading Signals
  server.registerPrompt(
    "rsi-trading-signals",
    {
      title: "RSI Trading Signals Analysis",
      description: "Generate RSI-based trading recommendations with entry/exit points and risk management",
      argsSchema: {
        asset: z.string().optional().describe("Specific asset symbol (e.g., 'WBTC', 'TSLAx', 'PAXG')"),
        category: z.enum(["wrapped-btc", "rwa-stocks", "gold", "all"]).optional().describe("Asset category (default: all)"),
        signal_type: z.enum(["buy_opportunities", "sell_warnings", "neutral_analysis", "comprehensive"]).optional().describe("Type of signals to focus on (default: comprehensive)"),
        risk_tolerance: z.enum(["conservative", "moderate", "aggressive"]).optional().describe("Risk tolerance level (default: moderate)")
      }
    },
    ({ asset, category = "all", signal_type = "comprehensive", risk_tolerance = "moderate" }) => {
      const assetFocus = asset ? `for ${asset}` : category !== "all" ? `for ${category} assets` : "across all RWA assets";

      const prompts: Record<string, string> = {
        buy_opportunities: `Analyze current BUY opportunities ${assetFocus} using RSI indicators.

Focus on:
- RSI oversold conditions (RSI < 30-35)
- Bullish divergences and reversal patterns
- Entry points with optimal risk/reward ratios
- Stop-loss and take-profit levels
- Position sizing recommendations for ${risk_tolerance} risk tolerance
- Confluence with other technical indicators

Provide actionable buy signals ranked by confidence score, with clear entry/exit strategies.`,

        sell_warnings: `Identify SELL warnings and exit opportunities ${assetFocus} based on RSI analysis.

Analyze:
- RSI overbought levels (RSI > 70-75)
- Bearish divergences and topping patterns
- Profit-taking zones and exit signals
- Risk management: when to cut losses
- Portfolio rebalancing recommendations
- Market conditions favoring exits

Prioritize signals by urgency and confidence for ${risk_tolerance} traders.`,

        neutral_analysis: `Provide a balanced RSI market analysis ${assetFocus} for HOLD positions.

Evaluate:
- Current RSI levels and trend strength
- Neutral zone consolidation patterns (RSI 40-60)
- Waiting for better entry/exit opportunities
- Market momentum and trend indicators
- Risk assessment for existing positions
- Upcoming catalysts that might trigger signals

Guide ${risk_tolerance} investors on whether to wait, accumulate, or reduce positions.`,

        comprehensive: `Generate a comprehensive RSI trading report ${assetFocus} with all signal types.

Deliver:
1. **Market Overview**: Current RSI readings and trend analysis
2. **Buy Signals**: Oversold opportunities with entry points
3. **Sell Signals**: Overbought warnings and exit strategies
4. **Hold Recommendations**: Neutral positions worth monitoring
5. **Risk Management**: Stop-losses, position sizing, portfolio allocation
6. **Multi-timeframe Analysis**: 5m, 1h, 1w RSI alignment
7. **Divergence Patterns**: Bullish and bearish divergences
8. **Action Plan**: Prioritized next steps for ${risk_tolerance} traders

Include confidence scores and timeframes for each signal.`
      };

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: prompts[signal_type]
          }
        }]
      };
    }
  );

  // Prompt 3: Portfolio Optimization
  server.registerPrompt(
    "optimize-rwa-portfolio",
    {
      title: "RWA Portfolio Optimization",
      description: "Generate portfolio allocation strategies based on current market conditions and RSI signals",
      argsSchema: {
        investment_amount: z.string().optional().describe("Total investment amount in USD (e.g., '10000')"),
        strategy: z.enum(["balanced", "growth", "defensive", "income"]).optional().describe("Investment strategy type (default: balanced)"),
        rebalance: z.enum(["yes", "no"]).optional().describe("Whether to consider rebalancing existing positions (default: no)")
      }
    },
    ({ investment_amount, strategy = "balanced", rebalance = "no" }) => {
      const amountText = investment_amount ? `with $${parseFloat(investment_amount).toLocaleString()} to deploy` : "";
      const rebalanceText = rebalance === "yes" ? "\n- Analyze current positions for rebalancing opportunities" : "";

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Create an optimized RWA portfolio allocation ${amountText} following a ${strategy} strategy on Solana.

Provide:
1. **Asset Allocation**: Percentage breakdown across wrapped-btc, rwa-stocks, and gold
2. **Specific Recommendations**: Which tokens to buy and in what amounts
3. **Entry Strategy**: Optimal timing based on RSI signals
4. **Risk Management**: Diversification, position limits, stop-losses
5. **Expected Returns**: Projected returns and risk metrics
6. **Monitoring Plan**: Key indicators to track${rebalanceText}

Consider current RSI levels, market trends, and correlation patterns to maximize risk-adjusted returns for a ${strategy} investor.`
          }
        }]
      };
    }
  );

  // Prompt 4: Market Sentiment Analysis
  server.registerPrompt(
    "crypto-market-sentiment",
    {
      title: "Crypto Market Sentiment Analysis",
      description: "Analyze overall crypto market sentiment using news, price action, and technical indicators",
      argsSchema: {
        focus_area: z.enum(["bitcoin", "defi", "rwa", "solana", "general"]).optional().describe("Specific market segment (default: general)"),
        sentiment_depth: z.enum(["quick", "detailed", "comprehensive"]).optional().describe("Level of analysis depth (default: detailed)")
      }
    },
    ({ focus_area = "general", sentiment_depth = "detailed" }) => {
      const depths: Record<string, string> = {
        quick: "Provide a concise sentiment summary with key takeaways (3-5 bullet points).",

        detailed: `Analyze the following aspects:
- Overall market sentiment (bullish, bearish, neutral)
- Key news events and their impact
- Technical indicators alignment
- On-chain metrics and volume trends
- Fear & Greed sentiment indicators
- Short-term and medium-term outlook`,

        comprehensive: `Deliver an in-depth sentiment analysis covering:
- **News Analysis**: Recent headlines and their market impact
- **Price Action**: Technical analysis of key assets
- **RSI Sentiment**: Overbought/oversold conditions
- **Volume Analysis**: Money flow and trading activity
- **Social Sentiment**: Community mood and retail interest
- **Institutional Activity**: Large wallet movements
- **Correlation Analysis**: Asset relationships during current conditions
- **Predictions**: Near-term (1-3 days) and medium-term (1-2 weeks) outlook
- **Risk Factors**: Potential catalysts for volatility`
      };

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Analyze current crypto market sentiment${focus_area !== "general" ? ` with focus on ${focus_area}` : ""}.

${depths[sentiment_depth]}

Synthesize news data, price trends, and technical indicators to provide actionable insights for traders and investors.`
          }
        }]
      };
    }
  );

  // Prompt 5: Risk Alert Dashboard
  server.registerPrompt(
    "risk-alerts",
    {
      title: "Risk Alerts and Warnings",
      description: "Generate alerts for high-risk market conditions and portfolio warnings",
      argsSchema: {
        alert_level: z.enum(["critical", "warning", "monitoring", "all"]).optional().describe("Severity level of alerts (default: all)"),
        timeframe: z.enum(["immediate", "short_term", "medium_term"]).optional().describe("Time horizon for risks (default: immediate)")
      }
    },
    ({ alert_level = "all", timeframe = "immediate" }) => {
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Generate ${timeframe} risk alerts for Solana RWA investments${alert_level !== "all" ? ` at ${alert_level} level` : ""}.

Identify and prioritize:
1. **Price Alerts**: Extreme overbought/oversold conditions
2. **Volatility Warnings**: Unusual price swings or volatility spikes
3. **Liquidity Risks**: Low volume or wide spreads
4. **Technical Breakdowns**: Support level breaks, bearish patterns
5. **Divergence Warnings**: RSI diverging from price action
6. **Correlation Risks**: Unusual correlation changes
7. **Market Structure**: Signs of market manipulation or anomalies
8. **News-Based Risks**: Fundamental developments requiring attention

For each alert, provide:
- Severity rating (Critical, High, Medium, Low)
- Affected assets
- Recommended action (Exit, Reduce, Monitor)
- Timeline for decision-making

Present alerts in order of urgency with clear, actionable recommendations.`
          }
        }]
      };
    }
  );

  // Prompt 6: Educational Trading Insights
  server.registerPrompt(
    "learn-rwa-trading",
    {
      title: "RWA Trading Education",
      description: "Educational content about RWA assets, RSI trading, and Solana DeFi strategies",
      argsSchema: {
        topic: z.enum([
          "rwa_basics",
          "rsi_trading",
          "solana_defi",
          "risk_management",
          "technical_analysis"
        ]).optional().describe("Educational topic (default: rwa_basics)"),
        skill_level: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("User skill level (default: beginner)")
      }
    },
    ({ topic = "rwa_basics", skill_level = "beginner" }) => {
      const topics: Record<string, Record<string, string>> = {
        rwa_basics: {
          beginner: "Explain what Real World Assets (RWA) are and how they work on Solana blockchain.\n\nCover:\n- What are tokenized assets?\n- Benefits of RWA on Solana (speed, low fees)\n- Types of RWAs: wrapped BTC, tokenized stocks, gold-backed tokens\n- How to buy and trade RWAs safely\n- Key risks and considerations\n\nUse simple language with practical examples.",

          intermediate: "Provide an intermediate guide to RWA trading on Solana.\n\nExplain:\n- RWA market structure and liquidity\n- Differences between asset types (BTC bridges, xStocks, PAXG)\n- On-chain vs off-chain components\n- Smart contract risks and audits\n- Arbitrage opportunities between RWAs and their underlying assets\n- Tax implications and regulatory considerations",

          advanced: "Deep dive into advanced RWA strategies on Solana.\n\nAnalyze:\n- RWA protocol architectures and trust models\n- Cross-chain bridging mechanisms and risks\n- Yield farming with RWA collateral\n- Hedging strategies using RWAs\n- Market making and liquidity provision\n- Regulatory landscape and compliance frameworks\n- Future developments in tokenization"
        },

        rsi_trading: {
          beginner: "Teach RSI (Relative Strength Index) basics for crypto trading.\n\nCover:\n- What is RSI and how is it calculated?\n- Reading RSI values (0-100 scale)\n- Overbought (>70) and oversold (<30) levels\n- How to identify buy and sell signals\n- Common mistakes to avoid\n- Practice examples with real RWA data",

          intermediate: "Explain intermediate RSI trading strategies.\n\nTeach:\n- RSI divergences (bullish and bearish)\n- Multi-timeframe RSI analysis\n- RSI with other indicators (moving averages, volume)\n- Position sizing based on RSI signals\n- Risk management with RSI trades\n- Backtesting RSI strategies",

          advanced: "Advanced RSI techniques for professional traders.\n\nExplore:\n- RSI optimization and custom periods\n- Hidden divergences and complex patterns\n- RSI in trending vs ranging markets\n- Algorithmic RSI trading strategies\n- Statistical validation of RSI signals\n- Combining RSI with order flow analysis\n- Building automated RSI trading systems"
        },

        solana_defi: {
          beginner: "Introduction to Solana DeFi ecosystem.\n\nExplain:\n- What is DeFi and why Solana?\n- Setting up a Solana wallet (Phantom, Solflare)\n- Understanding SOL and USDC\n- Basic DeFi operations: swaps, liquidity\n- How to use Jupiter DEX\n- Safety tips and common scams",

          intermediate: "Navigate Solana DeFi protocols efficiently.\n\nCover:\n- DEX aggregators and routing\n- Lending and borrowing platforms\n- Yield farming strategies\n- Staking and liquid staking\n- NFTs and tokenization\n- Transaction optimization and MEV\n- Risk assessment frameworks",

          advanced: "Master advanced Solana DeFi strategies.\n\nDive into:\n- Program-derived addresses and accounts\n- Cross-program invocations\n- Flash loans and arbitrage\n- Liquidity provision strategies\n- Governance and protocol economics\n- Security auditing and exploit analysis\n- Building on Solana (Anchor framework)"
        },

        risk_management: {
          beginner: "Essential risk management for crypto traders.\n\nLearn:\n- Never invest more than you can afford to lose\n- Position sizing: the 1-2% rule\n- Setting stop-losses effectively\n- Diversification basics\n- When to take profits\n- Emotional discipline in trading",

          intermediate: "Professional risk management techniques.\n\nImplement:\n- Kelly criterion for position sizing\n- Risk/reward ratio analysis (minimum 2:1)\n- Portfolio heat and correlation\n- Trailing stops and scaling out\n- Hedging with correlated assets\n- Drawdown management and recovery\n- Performance metrics (Sharpe, Sortino ratios)",

          advanced: "Institutional-grade risk frameworks.\n\nDevelop:\n- Value at Risk (VaR) models\n- Stress testing and scenario analysis\n- Tail risk hedging strategies\n- Optimal portfolio theory (Markowitz)\n- Dynamic position sizing algorithms\n- Risk parity and volatility targeting\n- Options strategies for downside protection"
        },

        technical_analysis: {
          beginner: "Introduction to chart reading and technical analysis.\n\nCover:\n- Reading candlestick charts\n- Support and resistance levels\n- Trend lines and channels\n- Basic patterns (head & shoulders, triangles)\n- Volume analysis\n- When technical analysis works best",

          intermediate: "Comprehensive technical analysis toolkit.\n\nStudy:\n- Advanced chart patterns\n- Fibonacci retracements and extensions\n- Moving averages (SMA, EMA)\n- MACD, RSI, Bollinger Bands\n- Volume-based indicators (OBV, CVD)\n- Multiple timeframe analysis\n- Combining indicators effectively",

          advanced: "Professional technical analysis mastery.\n\nExplore:\n- Market structure and auction theory\n- Order flow and footprint charts\n- Volume profile and POC\n- Elliot Wave and Wyckoff methods\n- Statistical pattern recognition\n- Backtesting technical strategies\n- Building custom indicators and systems"
        }
      };

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: topics[topic][skill_level]
          }
        }]
      };
    }
  );
}
