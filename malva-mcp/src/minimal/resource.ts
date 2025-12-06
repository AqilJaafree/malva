import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Sets up the single minimal resource
 */
export function setupMinimalResource(server: McpServer): void {
  server.registerResource(
    "server-info",
    "info://server",
    {
      title: "Server Information",
      description: "Information about this Solana RWA price tracking MCP server",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const serverInfo = {
        name: "solana-rwa-price-mcp",
        version: "1.0.0",
        description: "Real-time price tracking for Solana RWA assets using Jupiter API and Solana RPC - no fallback data",
        timestamp: new Date().toISOString(),
        features: ["resources", "tools", "prompts"],
        uri: uri.href,
        capabilities: {
          resources: 1,
          tools: 3,
          prompts: 1
        },
        supportedAssets: {
          "wrapped-btc": ["WBTC", "BTC"],
          "rwa-stocks": ["TSLA", "AAPL", "MSFT"],
          "gold": ["PAXG", "XAUT", "GOLD"]
        },
        timeIntervals: ["1s", "1m", "5m", "1h", "1w", "1M"],
        dataSources: {
          primary: "Jupiter API",
          rpc: "Solana RPC",
          historical: "CoinGecko (OHLC only)",
          fallback: "None - fails if APIs unavailable"
        },
        transport: "Streamable HTTP",
        status: "active",
        environment: {
          node_version: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
      };

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(serverInfo, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );
}
