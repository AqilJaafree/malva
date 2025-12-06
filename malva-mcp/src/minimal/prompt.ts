import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Sets up the single minimal prompt
 */
export function setupMinimalPrompt(server: McpServer): void {
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
}
