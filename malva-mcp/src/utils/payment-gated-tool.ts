import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { verifyToolPayment, TOOL_PRICING } from "./x402-payment-handler.js";

/**
 * Payment-gated tool wrapper
 * Wraps MCP tool handlers with x402 payment verification
 */

export interface ToolContext {
  headers?: Record<string, string | string[] | undefined>;
  sessionId?: string;
}

export type ToolHandler<T = any> = (args: T, context?: ToolContext) => Promise<any>;

/**
 * Register a payment-gated tool
 */
export function registerPaymentGatedTool<T = any>(
  server: McpServer,
  toolName: string,
  schema: {
    title: string;
    description: string;
    inputSchema: any;
  },
  handler: ToolHandler<T>,
  options: {
    requirePayment?: boolean;
    customPrice?: string;
  } = {}
): void {
  const { requirePayment = true, customPrice } = options;

  // Get price information for logging
  const pricing = TOOL_PRICING[toolName];
  const priceFormatted = pricing
    ? `$${(parseInt(pricing.amount) / 1_000_000).toFixed(3)} USDC`
    : 'Free';

  console.log(`   📌 ${toolName} - ${priceFormatted}${requirePayment ? ' (Payment Required)' : ' (Free)'}`);

  server.registerTool(
    toolName,
    schema,
    async (args: T, context?: any) => {
      // Skip payment verification if not required
      if (!requirePayment) {
        return handler(args, context);
      }

      // Extract headers from context
      const headers = context?.headers || {};

      // Construct resource URL
      const resourceUrl = `mcp://tools/${toolName}`;

      try {
        // Verify payment
        const verificationResult = await verifyToolPayment(toolName, headers, resourceUrl);

        if (!verificationResult.verified) {
          // Return 402 Payment Required error
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: {
                  code: 402,
                  message: verificationResult.error || 'Payment Required',
                  payment: verificationResult.requirements
                },
                toolName,
                pricing: pricing ? {
                  amount: pricing.amount,
                  formatted: `$${(parseInt(pricing.amount) / 1_000_000).toFixed(3)} USDC`,
                  description: pricing.description
                } : null,
                instructions: {
                  protocol: 'x402',
                  steps: [
                    '1. Create a signed transaction for the required amount',
                    '2. Submit transaction to facilitator',
                    '3. Include X-PAYMENT header with payment proof',
                    '4. Retry the tool request with payment header'
                  ],
                  documentation: 'https://docs.payai.network/x402'
                }
              }, null, 2)
            }],
            isError: true
          };
        }

        // Payment verified - execute the tool
        console.log(`✅ Payment verified for ${toolName}`);
        return handler(args, context);

      } catch (error) {
        console.error(`Payment verification error for ${toolName}:`, error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: {
                code: 500,
                message: 'Payment verification failed',
                details: error instanceof Error ? error.message : 'Unknown error'
              }
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}

/**
 * Helper to check if payment is enabled
 */
export function isPaymentEnabled(): boolean {
  return process.env.X402_PAYMENT_ENABLED !== 'false';
}
