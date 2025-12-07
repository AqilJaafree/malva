/**
 * MCP Client with X402 Payment Integration
 * Uses custom payment handler for MCP server's specific 402 format
 */

import type { WalletSigner } from './manual-payment';
import { fetchWithMCPPayment } from './custom-payment-handler';

const MCP_SERVER_URL =
  process.env.NEXT_PUBLIC_MALVA_MCP_API_ENDPOINT ||
  process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
  'http://localhost:3001';

export interface MCPToolCall {
  jsonrpc: '2.0';
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
  id: number;
}

export interface MCPToolResponse {
  jsonrpc: '2.0';
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

/**
 * Parse Server-Sent Events (SSE) response format
 */
function parseSSEResponse(sseText: string): MCPToolResponse {
  const lines = sseText.split('\n');
  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      currentEvent = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      currentData = line.substring(5).trim();

      // If this is a message event, parse the JSON data
      if (currentEvent === 'message' && currentData) {
        try {
          return JSON.parse(currentData) as MCPToolResponse;
        } catch (error) {
          console.error('[MCP Client] Failed to parse SSE data:', currentData);
          throw error;
        }
      }
    }
  }

  throw new Error('No valid message event found in SSE response');
}

/**
 * Creates an MCP client with X402 payment capabilities using x402-solana built-in client
 */
export function createMCPClient(walletAdapter: WalletSigner) {
  console.log('[MCP Client] Creating MCP client with custom X402 payment handler...');
  console.log('[MCP Client] ✅ MCP client created successfully');

  // Session state
  let sessionId: string | null = null;

  /**
   * Initialize MCP session (required before making tool calls)
   */
  async function initializeSession(): Promise<void> {
    if (sessionId) {
      console.log('[MCP Client] Session already initialized:', sessionId);
      return;
    }

    console.log('[MCP Client] 🔌 Initializing MCP session...');

    // Send initialize request (NO mcp-session-id header for init!)
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true,
          },
        },
        clientInfo: {
          name: 'malva-x402-client',
          version: '1.0.0',
        },
      },
    };

    const initResponse = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(initRequest),
    });

    console.log('[MCP Client] Initialize response status:', initResponse.status);

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('[MCP Client] Initialize failed:', errorText);
      throw new Error(`Failed to initialize MCP session: ${initResponse.statusText}`);
    }

    // Get session ID from response header
    const newSessionId = initResponse.headers.get('mcp-session-id');
    if (!newSessionId) {
      throw new Error('Server did not provide mcp-session-id header');
    }

    sessionId = newSessionId;
    console.log('[MCP Client] ✅ Session initialized:', sessionId);

    // Send notifications/initialized
    const notifyRequest = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    };

    await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify(notifyRequest),
    });

    console.log('[MCP Client] ✅ Session confirmed');
  }

  return {
    /**
     * Calls an MCP tool with automatic X402 payment handling
     * The x402-solana client will handle 402 responses and trigger Privy's signing UI
     */
    async callTool<T = any>(
      toolName: string,
      args?: Record<string, any>
    ): Promise<T> {
      console.log(`[MCP Client] 🔧 Calling tool: ${toolName}`, args);

      // Initialize session if not already done
      await initializeSession();

      const request: MCPToolCall = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args || {},
        },
        id: Date.now(),
      };

      console.log('[MCP Client] 📡 Sending request to:', `${MCP_SERVER_URL}/mcp`);

      try {
        // Use custom payment handler for MCP server's 402 format
        // This will:
        // 1. Make the initial request
        // 2. Detect 402 Payment Required response (MCP format)
        // 3. Create the payment transaction
        // 4. Call Privy's signTransaction (triggers UI modal)
        // 5. Retry the request with X-PAYMENT header
        const response = await fetchWithMCPPayment(
          walletAdapter,
          `${MCP_SERVER_URL}/mcp`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/event-stream',
              'Mcp-Session-Id': sessionId!,
            },
            body: JSON.stringify(request),
          }
        );

        console.log('[MCP Client] 📨 Response status:', response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error('[MCP Client] ❌ Request failed:', JSON.stringify(error, null, 2));
          throw new Error(
            `MCP tool call failed: ${error.message || error.error?.message || response.statusText}`
          );
        }

        // Check if response is SSE (text/event-stream) or JSON
        const contentType = response.headers.get('content-type') || '';
        let result: MCPToolResponse;

        if (contentType.includes('text/event-stream')) {
          // Parse SSE format
          console.log('[MCP Client] Parsing SSE response...');
          const text = await response.text();
          result = parseSSEResponse(text);
        } else {
          // Parse JSON
          result = await response.json();
        }

        if (result.error) {
          console.error('[MCP Client] ❌ MCP Error:', result.error);
          throw new Error(`MCP Error: ${result.error.message}`);
        }

        if (result.result?.isError) {
          console.error('[MCP Client] ❌ Tool Error:', result.result.content);
          throw new Error(
            `Tool Error: ${result.result.content[0]?.text || 'Unknown error'}`
          );
        }

        // Parse the response
        const content = result.result?.content[0]?.text;
        if (!content) {
          throw new Error('No content in MCP response');
        }

        const data = JSON.parse(content) as T;
        console.log('[MCP Client] ✅ Tool call successful:', toolName);
        return data;
      } catch (error) {
        console.error('[MCP Client] ❌ Error in callTool:', error);

        // Provide helpful error messages
        if (error instanceof Error) {
          if (error.message.includes('402')) {
            throw new Error(
              'Payment required but failed. Please ensure you have sufficient USDC balance.'
            );
          }
          if (error.message.includes('rejected') || error.message.includes('denied')) {
            throw new Error('Payment was rejected by user');
          }
          if (error.message.includes('Failed to connect')) {
            throw new Error(
              'Wallet connection error. Please try refreshing the page.'
            );
          }
        }

        throw error;
      }
    },

    /**
     * Get current prices for RWA assets
     */
    async getCurrentPrices(category?: 'wrapped-btc' | 'rwa-stocks' | 'gold') {
      return this.callTool<{
        status: string;
        prices: Array<{
          asset: string;
          symbol: string;
          price: number;
          change24h: number;
          category: string;
        }>;
      }>('get-current-prices', category ? { category } : undefined);
    },

    /**
     * Get RSI analysis and trading signals
     */
    async getRSIAnalysis(options?: {
      asset?: string;
      category?: 'wrapped-btc' | 'rwa-stocks' | 'gold';
      interval?: '1m' | '5m' | '1h' | '1w' | '1M';
    }) {
      return this.callTool<{
        status: string;
        analyses: Array<{
          asset: string;
          symbol: string;
          rsi: number;
          signal: {
            action: 'BUY' | 'SELL' | 'HOLD';
            confidence: number;
            reason: string;
          };
        }>;
        summary: {
          buySignals: number;
          sellSignals: number;
          holdSignals: number;
          avgConfidence: number;
        };
      }>('get-rsi-analysis', options);
    },

    /**
     * Get crypto news
     */
    async getCryptoNews(options?: { limit?: number; category?: string }) {
      return this.callTool<{
        status: string;
        news: Array<{
          title: string;
          description: string;
          url: string;
          source: string;
          publishedAt: string;
          sentiment?: string;
        }>;
      }>('get-crypto-news', options);
    },

    /**
     * Get OHLC candlestick data
     */
    async getOHLCData(options: {
      asset?: string;
      category?: 'wrapped-btc' | 'rwa-stocks' | 'gold';
      interval: '1m' | '5m' | '1h' | '1w' | '1M';
      count?: number;
    }) {
      return this.callTool<{
        status: string;
        data: Array<{
          asset: string;
          symbol: string;
          candles: Array<{
            timestamp: number;
            open: number;
            high: number;
            low: number;
            close: number;
          }>;
        }>;
      }>('get-ohlc-data', options);
    },

    /**
     * Get portfolio-wide RSI signals
     */
    async getPortfolioSignals(options?: {
      interval?: '1m' | '5m' | '1h' | '1w' | '1M';
    }) {
      return this.callTool<{
        status: string;
        summary: {
          totalAssets: number;
          buySignals: number;
          sellSignals: number;
          holdSignals: number;
          strongBuys: number;
          strongSells: number;
        };
        signals: Array<{
          asset: string;
          symbol: string;
          rsi: number;
          signal: string;
          confidence: number;
        }>;
      }>('get-portfolio-signals', options);
    },
  };
}

export type MCPClient = ReturnType<typeof createMCPClient>;
