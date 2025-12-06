import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { setupMinimalResource } from "./minimal/resource.js";
import { setupMinimalTool } from "./minimal/tool.js";
import { setupMinimalPrompt } from "./minimal/prompt.js";

/**
 * Creates and configures the Solana RWA price tracking MCP server instance
 */
export function createMCPServer(): McpServer {
  const serverName = "solana-rwa-price-mcp";
  const serverVersion = "1.0.0";

  // Create the MCP server instance
  const server = new McpServer({
    name: serverName,
    version: serverVersion
  });

  console.log(`🔧 Initializing MCP server: ${serverName} v${serverVersion}`);

  // Register capabilities
  setupMinimalResource(server);
  console.log("✅ Resource: server-info");

  setupMinimalTool(server);
  console.log("✅ Tools (11): Price tracking, OHLC data, RSI analysis, Crypto news");
  console.log("   Price Tools: get-current-prices, get-ohlc-data, get-interval-prices, get-ohlc-stats");
  console.log("   RSI Tools: get-rsi-analysis, get-portfolio-signals, get-rsi-divergence");
  console.log("   News Tools: get-crypto-news, search-crypto-news, get-asset-news, get-news-summary");

  setupMinimalPrompt(server);
  console.log("✅ Prompt: analyze-rwa-prices");

  console.log("🎉 MCP Server Ready - Real-time tracking via Jupiter API v3");
  console.log("💰 Tracking: Wrapped BTC (3), RWA Stocks (6), Gold Tokens (4)");
  console.log("📊 RSI Trading Signals: Buy/Sell recommendations with confidence scores");
  console.log("📰 Crypto News: Latest articles, search, and asset-specific news");

  return server;
}
