'use client';

import { useEffect, useState } from 'react';
import { useWallets, useFundWallet } from '@privy-io/react-auth/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Mainnet USDC
const MIN_USDC_BALANCE = 100000; // 0.1 USDC (in micro-units)

/**
 * Hook that automatically prompts users to fund their wallet if USDC balance is low
 */
export function useAutoFundPrompt() {
  const { wallets } = useWallets();
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const { fundWallet } = useFundWallet({
    onUserExited({ balance }) {
      console.log('[Auto Fund] User exited funding with balance:', balance);
      setHasPrompted(true);
    },
  });

  useEffect(() => {
    const checkBalanceAndPrompt = async () => {
      // Skip if already prompted or no wallet
      if (hasPrompted || isChecking || wallets.length === 0) return;

      // Using Solana-specific hook - first wallet is always Solana
      const solanaWallet = wallets[0];
      if (!solanaWallet) return;

      setIsChecking(true);

      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        // Get user's USDC token account
        const walletPubkey = new PublicKey(solanaWallet.address);
        const usdcMint = new PublicKey(USDC_MINT);
        const tokenAccount = await getAssociatedTokenAddress(usdcMint, walletPubkey);

        // Check USDC balance
        const balance = await connection.getTokenAccountBalance(tokenAccount);
        const usdcBalance = balance.value.uiAmount || 0;

        console.log('[Auto Fund] USDC Balance:', usdcBalance);

        // Prompt if balance is too low
        if (usdcBalance * 1_000_000 < MIN_USDC_BALANCE) {
          console.log('[Auto Fund] 💰 Low balance detected, prompting to fund...');

          setTimeout(() => {
            fundWallet({
              address: solanaWallet.address,
            });
          }, 1000); // Small delay for better UX
        }

        setHasPrompted(true);
      } catch (error) {
        console.log('[Auto Fund] Could not check balance:', error);
        // If token account doesn't exist, user has 0 USDC - prompt to fund
        if (error instanceof Error && error.message.includes('could not find account')) {
          console.log('[Auto Fund] 💰 No USDC account found, prompting to fund...');

          setTimeout(() => {
            fundWallet({
              address: solanaWallet.address,
            });
          }, 1000);
        }
        setHasPrompted(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkBalanceAndPrompt();
  }, [wallets, hasPrompted, isChecking, fundWallet]);

  return { isChecking };
}
