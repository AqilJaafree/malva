/**
 * React Hook for fetching MCP data with X402 payments
 * Integrates Privy wallet with MCP server for real-time crypto analytics
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWallets, useCreateWallet, useSignTransaction } from '@privy-io/react-auth/solana';
import { usePrivy } from '@privy-io/react-auth';
import { createPrivyWalletAdapter } from '@/lib/x402/privy-wallet-adapter';
import { createMCPClient, type MCPClient } from '@/lib/x402/mcp-client';

export function useMCPData() {
  const { authenticated } = usePrivy();
  const { wallets, ready } = useWallets();
  const { createWallet } = useCreateWallet();
  const { signTransaction } = useSignTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Auto-create wallet if user is authenticated but has no wallet
  useEffect(() => {
    const autoCreateWallet = async () => {
      if (authenticated && ready && wallets.length === 0 && !isCreatingWallet) {
        console.log('[useMCPData] 🔧 Auto-creating Solana wallet...');
        setIsCreatingWallet(true);
        try {
          const result = await createWallet();
          console.log('[useMCPData] ✅ Solana wallet auto-created:', result.wallet.address);
        } catch (err) {
          console.error('[useMCPData] ❌ Failed to auto-create wallet:', err);
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };

    autoCreateWallet();
  }, [authenticated, ready, wallets.length, createWallet, isCreatingWallet]);

  // Get the embedded Privy Solana wallet
  const embeddedWallet = useMemo(() => {
    if (!ready || wallets.length === 0) {
      console.log('[useMCPData] Wallet not ready:', { ready, walletCount: wallets.length });
      return null;
    }

    // Using Solana-specific hook - first wallet is always Solana
    // No need to filter by walletClientType since we're using @privy-io/react-auth/solana
    const solanaWallet = wallets[0];

    if (!solanaWallet) {
      console.error('[useMCPData] ❌ No Solana wallet found!');
      return null;
    }

    // Verify it's actually a Solana wallet (base58, not 0x)
    if (solanaWallet.address.startsWith('0x')) {
      console.error('[useMCPData] ❌ WRONG WALLET TYPE: EVM wallet detected!', solanaWallet.address);
      throw new Error('Configuration error: EVM wallet created instead of Solana. Please clear session and reload.');
    }

    // Log wallet details for debugging
    const walletAny = solanaWallet as any;
    console.log('[useMCPData] ✅ Using Solana wallet:', {
      address: solanaWallet.address,
      walletClientType: walletAny.walletClientType,
      chainId: walletAny.chainId,
      connectorType: walletAny.connectorType,
      hasSignTransaction: typeof solanaWallet.signTransaction,
      allKeys: Object.keys(solanaWallet),
    });
    return solanaWallet;
  }, [wallets, ready]);

  // Create MCP client instance
  const mcpClient = useMemo<MCPClient | null>(() => {
    if (!embeddedWallet) {
      console.log('[useMCPData] No wallet available for MCP client');
      return null;
    }

    try {
      console.log('[useMCPData] Creating wallet adapter...');
      const walletAdapter = createPrivyWalletAdapter(embeddedWallet, signTransaction);
      console.log('[useMCPData] Creating MCP client...');
      const client = createMCPClient(walletAdapter);
      console.log('[useMCPData] ✅ MCP client ready!');
      return client;
    } catch (err) {
      console.error('[useMCPData] ❌ Failed to create MCP client:', err);
      return null;
    }
  }, [embeddedWallet, signTransaction]);

  /**
   * Get current prices for RWA assets
   */
  const getCurrentPrices = useCallback(
    async (category?: 'wrapped-btc' | 'rwa-stocks' | 'gold') => {
      if (!mcpClient) {
        throw new Error('Wallet not connected. Please create a wallet first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await mcpClient.getCurrentPrices(category);
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch prices';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [mcpClient]
  );

  /**
   * Get RSI analysis and trading signals
   */
  const getRSIAnalysis = useCallback(
    async (options?: {
      asset?: string;
      category?: 'wrapped-btc' | 'rwa-stocks' | 'gold';
      interval?: '1m' | '5m' | '1h' | '1w' | '1M';
    }) => {
      if (!mcpClient) {
        throw new Error('Wallet not connected. Please create a wallet first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await mcpClient.getRSIAnalysis(options);
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch RSI analysis';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [mcpClient]
  );

  /**
   * Get crypto news
   */
  const getCryptoNews = useCallback(
    async (options?: { limit?: number; category?: string }) => {
      if (!mcpClient) {
        throw new Error('Wallet not connected. Please create a wallet first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await mcpClient.getCryptoNews(options);
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch news';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [mcpClient]
  );

  /**
   * Get OHLC candlestick data
   */
  const getOHLCData = useCallback(
    async (options: {
      asset?: string;
      category?: 'wrapped-btc' | 'rwa-stocks' | 'gold';
      interval: '1m' | '5m' | '1h' | '1w' | '1M';
      count?: number;
    }) => {
      if (!mcpClient) {
        throw new Error('Wallet not connected. Please create a wallet first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await mcpClient.getOHLCData(options);
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch OHLC data';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [mcpClient]
  );

  /**
   * Get portfolio-wide signals
   */
  const getPortfolioSignals = useCallback(
    async (options?: { interval?: '1m' | '5m' | '1h' | '1w' | '1M' }) => {
      if (!mcpClient) {
        throw new Error('Wallet not connected. Please create a wallet first.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await mcpClient.getPortfolioSignals(options);
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to fetch portfolio signals';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [mcpClient]
  );

  return {
    // State
    isLoading,
    error,
    isWalletReady: !!mcpClient,
    isCreatingWallet,

    // Methods
    getCurrentPrices,
    getRSIAnalysis,
    getCryptoNews,
    getOHLCData,
    getPortfolioSignals,
  };
}
