'use client';

import { useCreateWallet } from '@privy-io/react-auth/solana';
import { useState } from 'react';

interface CreateWalletButtonProps {
  createAdditional?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function CreateWalletButton({ 
  createAdditional = false,
  variant = 'primary' 
}: CreateWalletButtonProps) {
  const [isCreating, setIsCreating] = useState(false);

  const { createWallet } = useCreateWallet();

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      const wallet = await createWallet({ createAdditional });
      console.log('Created wallet:', wallet);
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert(`Failed to create wallet: ${error}`);
      setIsCreating(false);
    }
  };

  const buttonClasses = variant === 'primary'
    ? 'flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm text-card-foreground transition-colors hover:bg-card/80 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      onClick={handleCreateWallet}
      disabled={isCreating}
      className={buttonClasses}
      aria-label={createAdditional ? 'Create additional wallet' : 'Create wallet'}
    >
      {isCreating ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Creating...</span>
        </div>
      ) : (
        <span>{createAdditional ? 'Create Additional Wallet' : 'Create Wallet'}</span>
      )}
    </button>
  );
}

