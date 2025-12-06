"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useCreateWallet } from "@privy-io/react-auth/solana";
import { useState } from "react";

interface WalletInfoProps {
  variant?: "card" | "compact";
}

export default function WalletInfo({ variant = "card" }: WalletInfoProps) {
  const { authenticated } = usePrivy();
  const { wallets, ready } = useWallets();
  const [manualCreationError, setManualCreationError] = useState<string | null>(
    null
  );

  const { createWallet } = useCreateWallet();

  // Derive loading state from props instead of setting state in useEffect
  const isCreatingWallet = authenticated && ready && wallets.length === 0;

  const handleManualCreateWallet = async () => {
    setManualCreationError(null);
    try {
      const wallet = await createWallet();
      console.log("Wallet created successfully:", wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      setManualCreationError(String(error));
    }
  };

  if (!authenticated) {
    return null;
  }

  if (!ready || isCreatingWallet) {
    if (variant === "compact") {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
          Creating wallet...
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 w-full max-w-md p-6 rounded-2xl border border-border bg-card">
        <h3 className="text-xl font-semibold text-card-foreground">
          Your Wallet
        </h3>
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full"></div>
          <p className="text-sm text-muted-foreground">
            Creating your embedded wallet...
          </p>
        </div>
      </div>
    );
  }

  // Get the first wallet (Privy embedded wallet for Solana)
  const displayWallet = wallets.length > 0 ? wallets[0] : null;

  if (variant === "compact") {
    return displayWallet ? (
      <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 border border-border">
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-xs font-mono text-muted-foreground">
          {displayWallet.address.slice(0, 4)}...
          {displayWallet.address.slice(-4)}
        </span>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md p-6 rounded-2xl border border-border bg-card">
      <h3 className="text-xl font-semibold text-card-foreground">
        Your Wallet
      </h3>

      {displayWallet ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Wallet Address:</p>
          <code className="text-xs font-mono text-card-foreground bg-muted p-2 rounded break-all">
            {displayWallet.address}
          </code>
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-xs text-muted-foreground">
              Type: Embedded Wallet (Privy)
            </p>
            <p className="text-xs text-muted-foreground">Chain: Solana</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">No wallet found.</p>
          <p className="text-xs text-muted-foreground">
            Automatic wallet creation didn&apos;t complete. You can create one
            manually below.
          </p>

          {manualCreationError && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">
                Error: {manualCreationError}
              </p>
            </div>
          )}

          <button
            onClick={handleManualCreateWallet}
            disabled={isCreatingWallet}
            className="flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Create wallet manually"
          >
            {isCreatingWallet ? "Creating Wallet..." : "Create Wallet Manually"}
          </button>

          <p className="text-xs text-muted-foreground">
            Or try logging out and back in to trigger automatic creation.
          </p>
        </div>
      )}
    </div>
  );
}
