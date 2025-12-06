'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useCreateWallet } from '@privy-io/react-auth/solana';
import { useState } from 'react';

export default function WalletInfo() {
  const { authenticated } = usePrivy();
  const { wallets, ready } = useWallets();
  const [manualCreationError, setManualCreationError] = useState<string | null>(null);

  const { createWallet } = useCreateWallet();

  // Derive loading state from props instead of setting state in useEffect
  const isCreatingWallet = authenticated && ready && wallets.length === 0;

  const handleManualCreateWallet = async () => {
    setManualCreationError(null);
    try {
      const wallet = await createWallet();
      console.log('Wallet created successfully:', wallet);
    } catch (error) {
      console.error('Error creating wallet:', error);
      setManualCreationError(String(error));
    }
  };

  if (!authenticated) {
    return null;
  }

  if (!ready || isCreatingWallet) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-md p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Your Wallet
        </h3>
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-zinc-950 dark:border-zinc-50 border-t-transparent rounded-full"></div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Creating your embedded wallet...
          </p>
        </div>
      </div>
    );
  }

  // Get the first wallet (Privy embedded wallet for Solana)
  const displayWallet = wallets.length > 0 ? wallets[0] : null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
        Your Wallet
      </h3>
      
      {displayWallet ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Wallet Address:
          </p>
          <code className="text-xs font-mono text-zinc-950 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 p-2 rounded break-all">
            {displayWallet.address}
          </code>
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Type: Embedded Wallet (Privy)
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Chain: Solana
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No wallet found. 
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Automatic wallet creation didn&apos;t complete. You can create one manually below.
          </p>
          
          {manualCreationError && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-300">
                Error: {manualCreationError}
              </p>
            </div>
          )}
          
          <button
            onClick={handleManualCreateWallet}
            disabled={isCreatingWallet}
            className="flex h-10 items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-50 px-4 text-sm text-white dark:text-zinc-950 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Create wallet manually"
          >
            {isCreatingWallet ? 'Creating Wallet...' : 'Create Wallet Manually'}
          </button>
          
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Or try logging out and back in to trigger automatic creation.
          </p>
        </div>
      )}
    </div>
  );
}

