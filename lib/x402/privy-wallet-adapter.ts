/**
 * Privy Wallet Adapter for X402
 * Simple wrapper to make Privy wallet compatible with x402-solana client
 */

import {
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js';

export interface PrivyWalletAdapter {
  publicKey: PublicKey;
  address: string;
  signTransaction(transaction: VersionedTransaction): Promise<VersionedTransaction>;
  signAllTransactions(transactions: VersionedTransaction[]): Promise<VersionedTransaction[]>;
}

/**
 * Type for Privy's useSignTransaction hook function
 * Signature based on Privy docs: https://docs.privy.io/wallets/using-wallets/solana/sign-a-transaction
 */
export type PrivySignTransactionFn = (input: {
  transaction: Uint8Array;
  wallet: any; // ConnectedStandardSolanaWallet
  options?: any;
}) => Promise<{
  signedTransaction: Uint8Array;
}>;

/**
 * Creates a wallet adapter from Privy embedded wallet for x402-solana
 * The x402-solana client expects a wallet with signTransaction/signAllTransactions methods
 *
 * @param embeddedWallet - Privy's ConnectedSolanaWallet from useWallets()
 * @param signTransactionFn - The signTransaction function from useSignTransaction() hook
 */
export function createPrivyWalletAdapter(
  embeddedWallet: any, // Privy's ConnectedSolanaWallet type
  signTransactionFn: PrivySignTransactionFn
): PrivyWalletAdapter {
  console.log('[Wallet Adapter] Creating x402-compatible adapter for Privy wallet');
  console.log('[Wallet Adapter] Wallet address:', embeddedWallet.address);

  // The x402-solana client expects a wallet with signTransaction method
  // We provide that interface, but use Privy's useSignTransaction hook internally
  return {
    publicKey: new PublicKey(embeddedWallet.address),
    address: embeddedWallet.address,

    /**
     * Sign a transaction using Privy's useSignTransaction hook
     * This properly triggers Privy's signing modal for user confirmation
     */
    async signTransaction(transaction: VersionedTransaction): Promise<VersionedTransaction> {
      console.log('[Wallet Adapter] signTransaction called by x402-solana');
      console.log('[Wallet Adapter] Using Privy useSignTransaction hook...');

      try {
        // Serialize the transaction to Uint8Array (Privy expects this format)
        const serializedTx = transaction.serialize();

        console.log('[Wallet Adapter] Transaction serialized, requesting signature from Privy...');

        // Call Privy's signTransaction hook with proper parameters
        const result = await signTransactionFn({
          transaction: serializedTx,
          wallet: embeddedWallet,
        });

        console.log('[Wallet Adapter] ✅ Transaction signed by Privy');

        // Deserialize the signed transaction back to VersionedTransaction
        const signedTx = VersionedTransaction.deserialize(result.signedTransaction);

        return signedTx;
      } catch (error) {
        console.error('[Wallet Adapter] ❌ Failed to sign transaction:', error);
        throw error;
      }
    },

    /**
     * Sign multiple transactions
     * Privy doesn't have a batch signing API, so we sign one by one
     */
    async signAllTransactions(
      transactions: VersionedTransaction[]
    ): Promise<VersionedTransaction[]> {
      console.log('[Wallet Adapter] signAllTransactions called by x402-solana');
      console.log('[Wallet Adapter] Signing', transactions.length, 'transactions...');

      const signedTxs: VersionedTransaction[] = [];
      for (const tx of transactions) {
        const signed = await this.signTransaction(tx);
        signedTxs.push(signed);
      }

      console.log('[Wallet Adapter] ✅ All transactions signed');
      return signedTxs;
    },
  };
}
