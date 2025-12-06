import { X402PaymentHandler } from '@payai/x402-solana/server';

/**
 * x402 Payment Configuration for Mainnet
 */
export interface X402Config {
  network: 'solana' | 'solana-devnet';
  treasuryAddress: string;
  facilitatorUrl: string;
  rpcUrl?: string;
  defaultToken: string;
}

/**
 * Tool pricing configuration
 */
export interface ToolPricing {
  [toolName: string]: {
    amount: string; // Amount in token micro-units (e.g., "100000" = $0.10 USDC)
    description: string;
  };
}

/**
 * Default mainnet configuration
 */
const MAINNET_CONFIG: X402Config = {
  network: 'solana',
  treasuryAddress: process.env.X402_TREASURY_ADDRESS || 'EQG76aS7Luk183CgnqEgb45Zv74mjsJBJWzRjUsYgnVt',
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://facilitator.payai.network',
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  defaultToken: process.env.USDC_MINT_MAINNET || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC Mainnet
};

/**
 * Tool pricing configuration - customize per tool
 */
export const TOOL_PRICING: ToolPricing = {
  // Price Tools - $0.01 per request
  'get-current-prices': {
    amount: '10000', // $0.01 USDC
    description: 'Real-time asset prices'
  },
  'get-ohlc-data': {
    amount: '20000', // $0.02 USDC
    description: 'OHLC candlestick data'
  },
  'get-interval-prices': {
    amount: '20000', // $0.02 USDC
    description: 'Time-series price data with analytics'
  },
  'get-ohlc-stats': {
    amount: '5000', // $0.005 USDC
    description: 'OHLC collection statistics'
  },

  // RSI Tools - $0.05 per analysis (more expensive due to computation)
  'get-rsi-analysis': {
    amount: '50000', // $0.05 USDC
    description: 'RSI trading signal analysis'
  },
  'get-portfolio-signals': {
    amount: '100000', // $0.10 USDC
    description: 'Portfolio-wide trading signals'
  },
  'get-rsi-divergence': {
    amount: '50000', // $0.05 USDC
    description: 'RSI divergence pattern detection'
  },

  // News Tools - $0.005 per request (cheaper, less compute)
  'get-crypto-news': {
    amount: '5000', // $0.005 USDC
    description: 'Latest crypto news articles'
  },
  'search-crypto-news': {
    amount: '5000', // $0.005 USDC
    description: 'Search crypto news by keyword'
  },
  'get-asset-news': {
    amount: '5000', // $0.005 USDC
    description: 'Asset-specific crypto news'
  },
  'get-news-summary': {
    amount: '10000', // $0.01 USDC
    description: 'Aggregated news summary'
  }
};

/**
 * Singleton x402 Payment Handler
 */
class X402Manager {
  private handler: X402PaymentHandler | null = null;
  private config: X402Config;

  constructor(config?: Partial<X402Config>) {
    this.config = {
      ...MAINNET_CONFIG,
      ...config
    };

    console.log('🔐 x402 Payment Handler Configuration:');
    console.log(`   Network: ${this.config.network}`);
    console.log(`   Treasury: ${this.config.treasuryAddress}`);
    console.log(`   Facilitator: ${this.config.facilitatorUrl}`);
    console.log(`   Token: ${this.config.defaultToken}`);
  }

  /**
   * Initialize the x402 payment handler
   */
  public initialize(): void {
    if (this.handler) {
      console.log('⚠️  x402 handler already initialized');
      return;
    }

    try {
      this.handler = new X402PaymentHandler({
        network: this.config.network,
        treasuryAddress: this.config.treasuryAddress,
        facilitatorUrl: this.config.facilitatorUrl,
        rpcUrl: this.config.rpcUrl,
        defaultToken: this.config.defaultToken
      });

      console.log('✅ x402 Payment Handler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize x402 handler:', error);
      throw error;
    }
  }

  /**
   * Get the payment handler instance
   */
  public getHandler(): X402PaymentHandler {
    if (!this.handler) {
      this.initialize();
    }
    return this.handler!;
  }

  /**
   * Create payment requirements for a specific tool
   */
  public async createPaymentRequirements(toolName: string, resourceUrl: string) {
    const handler = this.getHandler();
    const pricing = TOOL_PRICING[toolName];

    if (!pricing) {
      throw new Error(`No pricing configured for tool: ${toolName}`);
    }

    return await handler.createPaymentRequirements({
      price: {
        amount: pricing.amount,
        asset: {
          address: this.config.defaultToken
        }
      },
      network: this.config.network,
      config: {
        description: pricing.description,
        resource: resourceUrl,
        mimeType: 'application/json'
      }
    });
  }

  /**
   * Verify payment from X-PAYMENT header
   */
  public async verifyPayment(paymentHeader: string, requirements: any): Promise<boolean> {
    const handler = this.getHandler();

    try {
      console.log('🔍 Verifying payment...');
      console.log('   Payment Header Length:', paymentHeader?.length);
      console.log('   Requirements:', JSON.stringify(requirements, null, 2));

      const verified = await handler.verifyPayment(paymentHeader, requirements);

      console.log('   Verification Result:', verified);
      return verified;
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
      }
      return false;
    }
  }

  /**
   * Settle payment (submit transaction to blockchain)
   */
  public async settlePayment(paymentHeader: string, requirements: any): Promise<any> {
    const handler = this.getHandler();

    try {
      console.log('💰 Settling payment...');
      const result = await handler.settlePayment(paymentHeader, requirements);
      console.log('✅ Payment settled successfully');
      return result;
    } catch (error) {
      console.error('❌ Payment settlement failed:', error);
      throw error;
    }
  }

  /**
   * Extract payment header from request headers
   */
  public extractPayment(headers: Record<string, string | string[] | undefined>): string | undefined {
    const handler = this.getHandler();
    return handler.extractPayment(headers);
  }

  /**
   * Get pricing information for all tools
   */
  public getPricingInfo() {
    return {
      network: this.config.network,
      treasury: this.config.treasuryAddress,
      token: this.config.defaultToken,
      facilitator: this.config.facilitatorUrl,
      tools: TOOL_PRICING
    };
  }
}

// Export singleton instance
export const x402Manager = new X402Manager();

/**
 * Initialize x402 payment system
 */
export function initializeX402Payment(config?: Partial<X402Config>): void {
  const manager = config ? new X402Manager(config) : x402Manager;
  manager.initialize();
}

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
  verified: boolean;
  error?: string;
  requirements?: any;
  paymentHeader?: string;  // For settlement after tool execution
}

/**
 * Verify payment for MCP tool execution
 */
export async function verifyToolPayment(
  toolName: string,
  headers: Record<string, string | string[] | undefined>,
  resourceUrl: string
): Promise<PaymentVerificationResult> {
  try {
    const handler = x402Manager.getHandler();

    console.log(`💳 Verifying payment for tool: ${toolName}`);
    console.log(`   Resource: ${resourceUrl}`);

    // Create payment requirements for this tool
    const requirements = await x402Manager.createPaymentRequirements(toolName, resourceUrl);

    // Extract payment header
    const paymentHeader = x402Manager.extractPayment(headers);

    console.log(`   Payment Header Present: ${!!paymentHeader}`);
    if (paymentHeader) {
      console.log(`   Payment Header Length: ${paymentHeader.length}`);
      // Decode and show first part of header for debugging
      try {
        const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf8'));
        console.log(`   Payment Payload:`, {
          x402Version: decoded.x402Version,
          scheme: decoded.scheme,
          network: decoded.network,
          hasTransaction: !!decoded.payload?.transaction,
          transactionLength: decoded.payload?.transaction?.length
        });
      } catch (e) {
        console.log(`   Could not decode payment header for logging`);
      }
    }

    if (!paymentHeader) {
      return {
        verified: false,
        error: 'Payment Required',
        requirements
      };
    }

    // Verify payment
    const verified = await x402Manager.verifyPayment(paymentHeader, requirements);

    if (!verified) {
      return {
        verified: false,
        error: 'Payment verification failed',
        requirements
      };
    }

    console.log(`✅ Payment verified successfully for ${toolName}`);
    return {
      verified: true,
      paymentHeader,
      requirements
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown payment error'
    };
  }
}

/**
 * Settle a verified payment (submits transaction to blockchain)
 */
export async function settleToolPayment(
  paymentHeader: string,
  requirements: any
): Promise<void> {
  try {
    console.log('💰 Settling payment on blockchain...');
    await x402Manager.settlePayment(paymentHeader, requirements);
  } catch (error) {
    console.error('❌ Payment settlement failed:', error);
    throw error;
  }
}
