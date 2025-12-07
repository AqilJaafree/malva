'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

/**
 * Clear stale Privy session data when wallet config changes
 * Suppresses "Error destroying session" warnings
 */
function SessionCleanup() {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    const WALLET_CONFIG_VERSION = 'solana-mainnet-rpc-v4'; // Added Solana mainnet RPC config
    const storedVersion = localStorage.getItem('privy-wallet-config-version');

    if (storedVersion !== WALLET_CONFIG_VERSION) {
      console.log('[SessionCleanup] 🔧 Wallet config changed, clearing ALL session data...');

      // Clear ALL Privy-related storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('privy:') || key.includes('privy')) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('privy:') || key.includes('privy')) {
          sessionStorage.removeItem(key);
        }
      });

      // Mark version as updated
      localStorage.setItem('privy-wallet-config-version', WALLET_CONFIG_VERSION);
      console.log('[SessionCleanup] ✅ All session data cleared!');

      setNeedsRefresh(true);
      // Auto-refresh after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

    // Suppress "Error destroying session" console errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';
      if (errorMessage.includes('Error destroying session')) {
        // Suppress this specific error - it's benign
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (needsRefresh) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-foreground">Refreshing session...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const solanaRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const solanaWssUrl = solanaRpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        // Appearance customization
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          walletChainType: 'solana-only', // Only show Solana wallets in UI
        },
        // Solana RPC configuration for mainnet
        // Required for Privy's embedded wallet UI to sign transactions
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc(solanaRpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(solanaWssUrl),
            },
          },
        },
        // Explicitly disable EVM wallets and enable only Solana
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'off', // Disable Ethereum wallet creation
          },
          solana: {
            createOnLogin: 'all-users', // Only create Solana wallets
          },
        },
        // Enable email login
        loginMethods: ['email', 'wallet'],
      }}
    >
      <SessionCleanup />
      {children}
    </PrivyProvider>
  );
}

