/**
 * Custom Payment Handler for MCP Server's X402 Format
 * The MCP server uses a custom 402 response format that x402-solana doesn't recognize
 * This handler bridges the gap between MCP's format and our payment flow
 */

import type { WalletSigner } from './manual-payment';
import { createPaymentTransaction } from './manual-payment';

export interface MCPPaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  asset: string;
  payTo: string;
  extra?: {
    feePayer?: string;
  };
}

/**
 * Enhanced fetch that handles MCP server's X402 payment format
 */
export async function fetchWithMCPPayment(
  wallet: WalletSigner,
  url: string,
  options: RequestInit
): Promise<Response> {
  console.log('[Payment Handler] Making request to:', url);

  // First request - expect 402
  let response = await fetch(url, options);

  console.log('[Payment Handler] Response status:', response.status);

  // Handle 402 Payment Required (MCP Server Format)
  if (response.status === 402) {
    console.log('[Payment Handler] 💰 402 Payment Required detected');

    const errorResponse = await response.json();
    console.log('[Payment Handler] 402 Response:', errorResponse);

    // MCP server returns payment requirements in error.data.payment
    const paymentRequirements: MCPPaymentRequirements = errorResponse.error?.data?.payment;

    if (!paymentRequirements) {
      console.error('[Payment Handler] No payment requirements found in 402 response');
      throw new Error('Server returned 402 but no payment requirements found');
    }

    if (paymentRequirements.network !== 'solana') {
      throw new Error(`Unsupported payment network: ${paymentRequirements.network}`);
    }

    console.log('[Payment Handler] Payment requirements:', {
      amount: paymentRequirements.maxAmountRequired,
      description: paymentRequirements.description,
      network: paymentRequirements.network,
      payTo: paymentRequirements.payTo,
    });

    // Create and sign payment transaction
    console.log('[Payment Handler] Creating payment transaction...');
    const paymentProof = await createPaymentTransaction(wallet, paymentRequirements);

    console.log('[Payment Handler] 🔄 Retrying request with payment...');

    // Retry with X-PAYMENT header
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-PAYMENT': paymentProof,
      },
    });

    console.log('[Payment Handler] Response status after payment:', response.status);
  }

  return response;
}
