import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMCPServer } from "./mcp-server.js";
import { initializeX402Payment, x402Manager, verifyToolPayment, settleToolPayment, TOOL_PRICING } from "./utils/x402-payment-handler.js";

import type { Request, Response } from "express";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Allowed CORS origins from environment or default to localhost for development
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ];

// Middleware - CORS configuration for MCP browser clients
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "mcp-session-id",
      "mcp-protocol-version",
      "Authorization",
      "X-PAYMENT",
      "X-PAYMENT-RESPONSE",
    ],
    exposedHeaders: ["mcp-session-id", "X-PAYMENT-RESPONSE"],
    credentials: false, // Changed to false for security - only use true if absolutely needed
  })
);
app.use(express.json());

// Transport storage for session management
const transports: Record<string, StreamableHTTPServerTransport> = {};

console.log("Starting Solana RWA Price Tracking MCP Server...");

// Initialize x402 payment system
try {
  initializeX402Payment();
  console.log("💳 x402 Payment System Enabled");
} catch (error) {
  console.error("⚠️  Failed to initialize x402 payment system:", error);
  console.log("⚠️  Server will run without payment gating");
}

// MCP endpoint handler function with x402 payment verification
const handleMCPRequest = async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    // Check if this is a tool call that requires payment
    const isToolCall = req.body?.method === "tools/call";
    const toolName = isToolCall ? req.body?.params?.name : null;

    // Verify payment for tool calls
    if (isToolCall && toolName) {
      const resourceUrl = `mcp://tools/${toolName}`;
      const headers = req.headers as Record<
        string,
        string | string[] | undefined
      >;

      const verificationResult = await verifyToolPayment(
        toolName,
        headers,
        resourceUrl
      );

      if (!verificationResult.verified) {
        // Return 402 Payment Required error in JSON-RPC format
        const pricing = TOOL_PRICING[toolName];
        res.status(402).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: verificationResult.error || "Payment Required",
            data: {
              payment: verificationResult.requirements,
              pricing: pricing
                ? {
                    amount: pricing.amount,
                    formatted: `$${(parseInt(pricing.amount) / 1_000_000).toFixed(3)} USDC`,
                    description: pricing.description,
                  }
                : null,
              instructions:
                "Include X-PAYMENT header with signed transaction proof. See https://docs.payai.network/x402",
            },
          },
          id: req.body?.id || null,
        });
        return;
      }

      console.log(`✅ Payment verified for tool: ${toolName}`);

      // Settle payment (submit transaction to blockchain)
      if (verificationResult.paymentHeader && verificationResult.requirements) {
        try {
          await settleToolPayment(
            verificationResult.paymentHeader,
            verificationResult.requirements
          );
          console.log(`✅ Payment settled for tool: ${toolName}`);
        } catch (error) {
          console.error(`❌ Payment settlement failed for ${toolName}:`, error);
          // Continue anyway - payment was verified, settlement can be retried
        }
      }
    }

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
        },
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
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message:
            "Bad Request: No valid session ID provided or not an initialization request",
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data:
            process.env.NODE_ENV === "development" && error instanceof Error
              ? { stack: error.stack, message: error.message }
              : undefined,
        },
        id: null,
      });
    }
  }
};

// MCP endpoint handlers
app.post("/", handleMCPRequest);
app.post("/mcp", handleMCPRequest);

// Health check endpoint with external API validation
app.get("/health", async (req: Request, res: Response) => {
  const health = {
    status: "ok",
    server: "solana-rwa-price-mcp",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supported_assets: {
      "wrapped-btc": ["WBTC", "BTC"],
      "rwa-stocks": ["TSLA", "AAPL", "MSFT"],
      gold: ["PAXG", "XAUT", "GOLD"],
    },
    time_intervals: ["1s", "1m", "5m", "1h", "1w", "1M"],
    data_sources: {
      jupiter_api: "operational",
      coingecko_api: "operational",
      solana_rpc: "operational",
    },
  };

  // Optional: Check external API health if requested
  if (req.query.check === "external") {
    try {
      // Quick health check for Jupiter API
      const jupiterResponse = await fetch(
        "https://price.jup.ag/v4/price?ids=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        {
          signal: AbortSignal.timeout(3000),
        }
      );
      health.data_sources.jupiter_api = jupiterResponse.ok
        ? "operational"
        : "degraded";
    } catch {
      health.data_sources.jupiter_api = "down";
      health.status = "degraded";
    }
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

// Server info endpoint - provides MCP server metadata
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "solana-rwa-price-mcp",
    version: "1.0.0",
    description:
      "Real-time price tracking for Solana RWA assets using Jupiter API",
    protocol: "Model Context Protocol (MCP)",
    transport: "Streamable HTTP",
    endpoints: {
      mcp: "POST /",
      health: "GET /health",
      info: "GET /",
      pricing: "GET /pricing",
    },
    capabilities: {
      resources: 1,
      tools: 11,
      prompts: 6,
    },
    payment: {
      enabled: true,
      protocol: "x402",
      network: "solana",
      documentation: "https://docs.payai.network/x402",
    },
    documentation: "https://github.com/modelcontextprotocol/specification",
  });
});

// Pricing endpoint - shows x402 payment requirements for tools
app.get("/pricing", (_req: Request, res: Response) => {
  try {
    const pricingInfo = x402Manager.getPricingInfo();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      payment: {
        protocol: "x402",
        network: pricingInfo.network,
        treasuryAddress: pricingInfo.treasury,
        token: {
          mint: pricingInfo.token,
          symbol: "USDC",
          decimals: 6,
          name: "USD Coin",
        },
        facilitator: pricingInfo.facilitator,
      },
      tools: Object.entries(pricingInfo.tools).map(([name, config]) => ({
        name,
        description: config.description,
        price: {
          amount: config.amount,
          formatted: `$${(parseInt(config.amount) / 1_000_000).toFixed(3)} USDC`,
        },
      })),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve pricing information",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Tracking: Wrapped BTC, RWA Stocks, Gold assets on Solana`);
});
