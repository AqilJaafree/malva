# Solana RWA Price Tracking MCP Server

A Model Context Protocol (MCP) server for real-time price tracking of Solana Real World Assets (RWA) including Wrapped BTC, tokenized stocks (TSLA, AAPL, MSFT), and gold-backed tokens.

## Overview

This MCP server provides AI assistants with the ability to:
- Fetch real-time prices for Solana RWA assets via Jupiter API
- Retrieve historical OHLC data via CoinGecko API
- Track price movements at various time intervals
- Analyze market trends and volatility

## Features

### Resources (1)
- **server-info**: Server metadata and capabilities

### Tools (3)
1. **get-current-prices**: Fetch real-time prices from Jupiter API
   - Optional category filter (wrapped-btc, rwa-stocks, gold)
   - Returns prices with summary statistics

2. **get-ohlc-data**: Get historical OHLC (Open, High, Low, Close) data
   - Requires CoinGecko for historical data
   - Supports multiple time intervals
   - Returns price statistics and trends

3. **get-interval-prices**: Track price movements at specific intervals
   - Real-time simulated data for 1s/1m intervals
   - Historical data for longer intervals
   - Includes volatility and trend analysis

### Prompts (1)
- **analyze-rwa-prices**: Generate analysis prompts for RWA market analysis
  - Market overview
  - Category comparison
  - Price prediction
  - Risk analysis

## Supported Assets

### Wrapped BTC
- WBTC (Wrapped Bitcoin via Portal)
- BTC (Bitcoin via Sollet)

### RWA Stocks
- TSLA (Tokenized Tesla Stock)
- AAPL (Tokenized Apple Stock)
- MSFT (Tokenized Microsoft Stock)

### Gold Tokens
- PAXG (Paxos Gold)
- XAUT (Tether Gold)
- GOLD (VeChain Gold)

## Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd malva-mcp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration (optional)
# nano .env

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

### Docker Deployment

```bash
# Build the Docker image
docker build -t solana-rwa-price-mcp .

# Run the container
docker run -p 3001:3001 \
  -e COINGECKO_API_KEY=your_api_key \
  -e ALLOWED_ORIGINS="*" \
  solana-rwa-price-mcp

# Or use docker-compose (create docker-compose.yml first)
docker-compose up -d
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

#### Required
None - all variables have sensible defaults

#### Recommended
- `COINGECKO_API_KEY`: For higher rate limits on CoinGecko API
- `ALLOWED_ORIGINS`: Comma-separated CORS origins (use "*" for development)

#### Optional
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `CACHE_TTL`: Cache duration in milliseconds (default: 5000)
- `JUPITER_PRICE_API_URL`: Jupiter Price API endpoint
- `JUPITER_API_URL`: Jupiter Quote API endpoint
- `COINGECKO_API_URL`: CoinGecko API endpoint
- `SOLANA_RPC_URL`: Solana RPC endpoint

### CoinGecko API Key

While optional, a CoinGecko API key is recommended for:
- Higher rate limits (Pro: unlimited, Free: 10-50 calls/min)
- More reliable historical data access

Get your API key: https://www.coingecko.com/en/api/pricing

## API Endpoints

### MCP Endpoints
- `POST /` - Main MCP endpoint
- `POST /mcp` - Alternative MCP endpoint

### Information Endpoints
- `GET /` - Server information and metadata
- `GET /health` - Health check (add `?check=external` for external API validation)

## Usage Examples

### Using with MCP Clients

Connect your MCP client to:
```
http://localhost:3001/
```

### Tool Usage Examples

#### Get Current Prices
```typescript
// Get all asset prices
{
  "tool": "get-current-prices"
}

// Get prices for specific category
{
  "tool": "get-current-prices",
  "arguments": {
    "category": "wrapped-btc"
  }
}
```

#### Get Historical OHLC Data
```typescript
{
  "tool": "get-ohlc-data",
  "arguments": {
    "asset": "WBTC",
    "interval": "1h",
    "days": 7
  }
}
```

#### Track Interval Prices
```typescript
{
  "tool": "get-interval-prices",
  "arguments": {
    "asset": "TSLA",
    "interval": "1m",
    "count": 100
  }
}
```

### Prompt Usage Examples

```typescript
{
  "prompt": "analyze-rwa-prices",
  "arguments": {
    "analysis_type": "market_overview",
    "asset_category": "all",
    "time_frame": "1d"
  }
}
```

## Architecture

```
src/
├── server.ts              # Express server with Streamable HTTP transport
├── mcp-server.ts          # MCP server configuration
├── services/
│   └── price-service.ts   # Price fetching logic (Jupiter, CoinGecko)
├── minimal/
│   ├── resource.ts        # Server info resource
│   ├── tool.ts            # Price tracking tools (3 tools)
│   └── prompt.ts          # Analysis prompts
├── config/
│   └── assets.ts          # Solana asset definitions
└── types/
    └── assets.ts          # TypeScript interfaces
```

## Data Sources

### Primary: Jupiter API
- Real-time price data for Solana assets
- High reliability and low latency
- No API key required
- Fallback: Jupiter Quote API

### Secondary: CoinGecko API
- Historical OHLC data
- Market statistics and trends
- Free tier: 10-50 calls/minute
- Pro tier: Higher rate limits

### Tertiary: Solana RPC
- On-chain token information
- Account validation
- Default: Public mainnet RPC

## Caching Strategy

- **Cache TTL**: 5 seconds (configurable via `CACHE_TTL`)
- **Max Cache Size**: 100 entries with LRU eviction
- **Cache Keys**: Unique per asset/operation/interval
- **Purpose**: Reduce API calls and improve response times

## Performance Considerations

- Parallel API requests using `Promise.allSettled()`
- LRU cache with automatic eviction
- Optimized Docker image with multi-stage builds
- Non-root user execution for security
- Health checks for monitoring

## Security

- CORS configured with origin validation
- Non-root Docker user (`mcpuser`)
- Input validation with Zod schemas
- No credentials in wildcard CORS mode
- Environment-based configuration
- Error messages sanitized in production

## Troubleshooting

### Price Data Not Available
- **Issue**: "No price data could be fetched from Jupiter API"
- **Solution**: Verify asset mint addresses are correct and tokens are tradeable on Jupiter
- **Check**: Asset liquidity on Solana DEXs

### OHLC Data Not Available
- **Issue**: "Asset requires CoinGecko ID for historical data"
- **Solution**: Ensure asset has a valid `coingeckoId` in `config/assets.ts`
- **Note**: Not all Solana tokens have CoinGecko listings

### Rate Limiting
- **Issue**: 429 Too Many Requests
- **Solution**: Add `COINGECKO_API_KEY` for higher limits
- **Alternative**: Increase `CACHE_TTL` to reduce API calls

### CORS Errors
- **Issue**: Origin not allowed
- **Solution**: Add your origin to `ALLOWED_ORIGINS` environment variable
- **Development**: Set `ALLOWED_ORIGINS=*` (not recommended for production)

### Server Won't Start
- **Issue**: Port already in use
- **Solution**: Change `PORT` environment variable or stop conflicting service
- **Check**: `lsof -i :3001` to find process using port 3001

## Development

### Build TypeScript
```bash
npm run build
```

### Run Development Server (with auto-reload)
```bash
npm run dev
```

### Clean Build Artifacts
```bash
npm run clean
```

### Test API Health
```bash
# Basic health check
curl http://localhost:3001/health

# Health check with external API validation
curl http://localhost:3001/health?check=external

# Server info
curl http://localhost:3001/
```

## MCP Protocol Compliance

This server implements the Model Context Protocol specification:
- Streamable HTTP transport
- Session management with UUID generation
- JSON-RPC 2.0 message format
- Proper error handling and responses
- Tool, resource, and prompt registration

Documentation: https://github.com/modelcontextprotocol/specification

## Limitations

- In-memory session storage (sessions lost on restart)
- Simulated data for 1s/1m intervals (not true real-time ticks)
- Depends on external APIs (Jupiter, CoinGecko)
- Limited to predefined asset list
- CoinGecko free tier has rate limits

## Future Enhancements

- [ ] Add WebSocket support for real-time price streaming
- [ ] Implement persistent session storage (Redis)
- [ ] Add more RWA assets (real estate, commodities)
- [ ] Support custom asset addition via API
- [ ] Add price alerts and notifications
- [ ] Implement rate limiting middleware
- [ ] Add comprehensive test suite
- [ ] Support multiple blockchain networks

## License

MIT

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: [Your repo URL]
- Documentation: This README
- MCP Specification: https://github.com/modelcontextprotocol/specification

## Credits

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- Express.js
- TypeScript
- Zod
- Jupiter API
- CoinGecko API
