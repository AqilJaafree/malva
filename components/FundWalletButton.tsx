'use client';

import { Button } from '@/components/ui/button';
import { useFundWallet, useWallets } from '@privy-io/react-auth/solana';
import { Wallet } from 'lucide-react';

/**
 * Fund Wallet Button Component
 * Allows users to onramp funds to their Solana wallet via card/bank
 */
export function FundWalletButton() {
  const { wallets } = useWallets();
  // Using Solana-specific hook - first wallet is always Solana
  const solanaWallet = wallets[0];

  const { fundWallet } = useFundWallet({
    onUserExited({ balance }) {
      console.log('[Fund Wallet] User exited with balance:', balance);
    },
  });

  const handleFundWallet = async () => {
    if (!solanaWallet) {
      console.error('[Fund Wallet] No Solana wallet found');
      return;
    }

    console.log('[Fund Wallet] Opening funding modal for:', solanaWallet.address);

    await fundWallet({
      address: solanaWallet.address,
    });
  };

  if (!solanaWallet) {
    return null;
  }

  return (
    <Button
      onClick={handleFundWallet}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Wallet size={16} />
      Add Funds
    </Button>
  );
}
