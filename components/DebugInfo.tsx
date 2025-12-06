'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';

export default function DebugInfo() {
  const { authenticated, ready: privyReady, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-xs font-mono">
      <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
        🐛 Debug Info
      </h4>
      <div className="space-y-1 text-yellow-800 dark:text-yellow-200">
        <p>Privy Ready: {privyReady ? '✅' : '❌'}</p>
        <p>Authenticated: {authenticated ? '✅' : '❌'}</p>
        <p>Wallets Ready: {walletsReady ? '✅' : '❌'}</p>
        <p>Wallet Count: {wallets.length}</p>
        {wallets.length > 0 && (
          <div className="mt-2 pt-2 border-t border-yellow-400">
            <p className="font-bold mb-1">Wallets:</p>
            {wallets.map((wallet, i) => (
              <div key={i} className="ml-2 mb-2">
                <p>#{i + 1}: {wallet.walletClientType}</p>
                <p className="break-all">{wallet.address.slice(0, 20)}...</p>
              </div>
            ))}
          </div>
        )}
        {user && (
          <div className="mt-2 pt-2 border-t border-yellow-400">
            <p className="font-bold">User ID:</p>
            <p className="break-all">{user.id}</p>
          </div>
        )}
      </div>
    </div>
  );
}

