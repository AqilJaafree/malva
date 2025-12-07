'use client';

import { Button } from '@/components/ui/button';
import { useWallets } from '@privy-io/react-auth/solana';
import { Coins } from 'lucide-react';

/**
 * Development-only button to show wallet address for manual funding
 * Remove this in production
 */
export function DevFundButton() {
  const { wallets } = useWallets();
  // Since we're using Solana-specific hook and configured Privy for Solana-only,
  // the first wallet will always be a Solana wallet
  const solanaWallet = wallets[0];

  if (!solanaWallet) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(solanaWallet.address);
    alert(`Wallet address copied!\n\nTo fund with USDC:\n1. Go to https://faucet.circle.com (testnet) or\n2. Transfer USDC from another wallet to:\n${solanaWallet.address}`);
  };

  return (
    <Button
      onClick={handleCopyAddress}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Coins size={16} />
      Copy Address (Fund Manually)
    </Button>
  );
}
