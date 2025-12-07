/**
 * Manual X402 Payment Handler
 * Bypasses the x402-solana client to handle payments directly
 * This gives us full control over the payment flow
 */

import {
  PublicKey,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
// Simple wallet interface for signing
export interface WalletSigner {
  publicKey: PublicKey;
  address: string;
  signTransaction(transaction: VersionedTransaction): Promise<VersionedTransaction>;
}

// Use a browser-friendly RPC endpoint
// The public api.mainnet-beta.solana.com blocks browser requests
const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://api.devnet.solana.com'; // Fallback to devnet if no RPC configured

export interface PaymentRequirements {
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
  [key: string]: any;
}

export interface PaymentResult {
  success: boolean;
  paymentHeader?: string;
  error?: string;
}

/**
 * Create and sign a USDC payment transaction using VersionedTransaction
 * Compatible with x402-solana protocol and Privy wallet
 * @throws Error if insufficient funds or transaction fails
 */
export async function createPaymentTransaction(
  wallet: WalletSigner,
  requirements: PaymentRequirements
): Promise<string> {
  console.log('[Manual Payment] Creating payment transaction...');
  console.log('[Manual Payment] Requirements:', requirements);

  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

  // Extract fee payer from payment requirements (facilitator pays network fees)
  const feePayer = (requirements as any)?.extra?.feePayer;
  if (!feePayer) {
    throw new Error('Missing facilitator feePayer in payment requirements (extra.feePayer)');
  }
  const feePayerPubkey = new PublicKey(feePayer);
  console.log('[Manual Payment] Facilitator fee payer:', feePayer);

  // Parse payment details
  const userPubkey = wallet.publicKey;
  const recipient = new PublicKey(requirements.payTo);
  const mintPubkey = new PublicKey(requirements.asset);
  const amount = BigInt(requirements.maxAmountRequired);

  console.log('[Manual Payment] Payment details:', {
    user: userPubkey.toBase58(),
    recipient: recipient.toBase58(),
    amount: amount.toString(),
    mint: mintPubkey.toBase58(),
  });

  // Determine program (TOKEN or TOKEN_2022) by reading mint account owner
  const mintInfo = await connection.getAccountInfo(mintPubkey, 'confirmed');
  const programId =
    mintInfo?.owner?.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

  console.log('[Manual Payment] Token program:', programId.toBase58());

  // Fetch mint to get decimals
  const mint = await getMint(connection, mintPubkey, undefined, programId);

  // Get token accounts
  const payerTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    userPubkey,
    false,
    programId
  );

  const recipientTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    recipient,
    false,
    programId
  );

  console.log('[Manual Payment] Token accounts:', {
    payer: payerTokenAccount.toBase58(),
    recipient: recipientTokenAccount.toBase58(),
  });

  // Check if source ATA exists
  const sourceAtaInfo = await connection.getAccountInfo(payerTokenAccount, 'confirmed');
  if (!sourceAtaInfo) {
    throw new Error(
      `User does not have an Associated Token Account for ${requirements.asset}. Please create one first or ensure you have the required token.`
    );
  }

  // Check if destination ATA exists
  const destAtaInfo = await connection.getAccountInfo(recipientTokenAccount, 'confirmed');
  if (!destAtaInfo) {
    throw new Error(
      `Destination does not have an Associated Token Account for ${requirements.asset}. The receiver must create their token account before receiving payments.`
    );
  }

  // Check balance before creating transaction
  try {
    const balance = await connection.getTokenAccountBalance(payerTokenAccount);
    const currentBalance = BigInt(balance.value.amount);

    console.log('[Manual Payment] Current token balance:', balance.value.uiAmount);
    console.log('[Manual Payment] Required amount:', requirements.maxAmountRequired);

    if (currentBalance < amount) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_FUNDS') {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }

  // Build instructions array
  const instructions = [];

  // CRITICAL: The facilitator REQUIRES ComputeBudget instructions in positions 0 and 1
  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 7_000, // Sufficient for SPL token transfer
    })
  );

  instructions.push(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1, // Minimal price
    })
  );

  // Create transfer instruction using TransferChecked (more secure)
  instructions.push(
    createTransferCheckedInstruction(
      payerTokenAccount,
      mintPubkey,
      recipientTokenAccount,
      userPubkey,
      amount,
      mint.decimals,
      [],
      programId
    )
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  // Create TransactionMessage with facilitator as fee payer
  const message = new TransactionMessage({
    payerKey: feePayerPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  // Create VersionedTransaction (v0)
  const transaction = new VersionedTransaction(message);

  console.log('[Manual Payment] VersionedTransaction created');
  console.log('[Manual Payment] Transaction needs to be signed by user...');

  // For Privy embedded wallets, signTransaction will trigger their UI modal
  console.log('[Manual Payment] Requesting signature from Privy wallet...');

  let signedTx: VersionedTransaction;
  try {
    // This will trigger Privy's UI modal for user confirmation
    signedTx = await wallet.signTransaction(transaction);
    console.log('[Manual Payment] ✅ Transaction signed successfully');
  } catch (signError) {
    console.error('[Manual Payment] ❌ Failed to sign transaction:', signError);
    throw new Error(`Failed to sign transaction: ${signError instanceof Error ? signError.message : String(signError)}`);
  }

  console.log('[Manual Payment] Serializing signed transaction...');

  // Serialize the SIGNED transaction to base64
  const serialized = signedTx.serialize();
  const txBase64 = Buffer.from(serialized).toString('base64');

  console.log('[Manual Payment] Signed transaction base64 length:', txBase64.length);

  // Format X-PAYMENT header according to X402 spec
  // https://docs.payai.network/x402/reference
  const paymentPayload = {
    x402Version: 1,
    scheme: requirements.scheme || 'exact',
    network: requirements.network,
    payload: {
      transaction: txBase64,
    },
  };

  // Encode the payment payload as base64 for X-PAYMENT header
  const paymentProof = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

  console.log('[Manual Payment] ✅ Transaction signed and X-PAYMENT header created');
  console.log('[Manual Payment] Payment proof length:', paymentProof.length);

  return paymentProof;
}

/**
 * Make a fetch request with X402 payment handling
 */
export async function fetchWithPayment(
  url: string,
  options: RequestInit,
  wallet: WalletSigner
): Promise<Response> {
  console.log('[Manual Payment] Fetching:', url);

  // First request - expect 402
  let response = await fetch(url, options);

  if (response.status === 402) {
    console.log('[Manual Payment] 💰 402 Payment Required detected');

    // Parse payment requirements
    const errorResponse = await response.json();
    const requirements = errorResponse.error?.data?.payment;

    if (!requirements) {
      throw new Error('No payment requirements in 402 response');
    }

    console.log('[Manual Payment] Payment required:', {
      amount: requirements.maxAmountRequired,
      description: requirements.description,
    });

    // Create payment transaction
    const paymentProof = await createPaymentTransaction(wallet, requirements);

    console.log('[Manual Payment] 🔄 Retrying request with payment...');

    // Retry with X-PAYMENT header
    const newOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-PAYMENT': paymentProof,
      },
    };

    response = await fetch(url, newOptions);
    console.log('[Manual Payment] Response status after payment:', response.status);
  }

  return response;
}
