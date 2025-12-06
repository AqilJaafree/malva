import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMCPServer } from "./mcp-server.js";

import type { Request, Response } from "express";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Allowed CORS origins from environment or default to localhost for development
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

// Middleware - CORS configuration for MCP browser clients
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'mcp-session-id',
    'mcp-protocol-version',
    'Authorization'
  ],
  exposedHeaders: ['mcp-session-id'],
  credentials: false // Changed to false for security - only use true if absolutely needed
}));
app.use(express.json());

// Transport storage for session management
const transports: Record<string, StreamableHTTPServerTransport> = {};

console.log("Starting Solana RWA Price Tracking MCP Server...");

// MCP endpoint handler function
const handleMCPRequest = async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport for the session
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Create new transport for initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          // Store the transport by session ID
          transports[newSessionId] = transport;
          console.log(`Session initialized: ${newSessionId}`);
        }
      });

      // Cleanup on transport close
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          console.log(`Session cleaned up: ${transport.sessionId}`);
        }
      };

      // Create and connect MCP server
      const server = createMCPServer();
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided or not an initialization request',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: process.env.NODE_ENV === 'development' && error instanceof Error
            ? { stack: error.stack, message: error.message }
            : undefined
        },
        id: null,
      });
    }
  }
};

// MCP endpoint handlers
app.post('/', handleMCPRequest);
app.post('/mcp', handleMCPRequest);

// Health check endpoint with external API validation
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    server: 'solana-rwa-price-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supported_assets: {
      'wrapped-btc': ['WBTC', 'BTC'],
      'rwa-stocks': ['TSLA', 'AAPL', 'MSFT'],
      'gold': ['PAXG', 'XAUT', 'GOLD']
    },
    time_intervals: ['1s', '1m', '5m', '1h', '1w', '1M'],
    data_sources: {
      jupiter_api: 'operational',
      coingecko_api: 'operational',
      solana_rpc: 'operational'
    }
  };

  // Optional: Check external API health if requested
  if (req.query.check === 'external') {
    try {
      // Quick health check for Jupiter API
      const jupiterResponse = await fetch('https://price.jup.ag/v4/price?ids=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', {
        signal: AbortSignal.timeout(3000)
      });
      health.data_sources.jupiter_api = jupiterResponse.ok ? 'operational' : 'degraded';
    } catch (error) {
      health.data_sources.jupiter_api = 'down';
      health.status = 'degraded';
    }
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Server info endpoint - provides MCP server metadata
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'solana-rwa-price-mcp',
    version: '1.0.0',
    description: 'Real-time price tracking for Solana RWA assets using Jupiter API',
    protocol: 'Model Context Protocol (MCP)',
    transport: 'Streamable HTTP',
    endpoints: {
      mcp: 'POST /',
      health: 'GET /health',
      info: 'GET /'
    },
    capabilities: {
      resources: 1,
      tools: 3,
      prompts: 1
    },
    documentation: 'https://github.com/modelcontextprotocol/specification'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Tracking: Wrapped BTC, RWA Stocks, Gold assets on Solana`);
});
