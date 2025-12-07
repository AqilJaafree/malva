'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Development button to manually clear Privy session
 * Use this to force re-creation of wallets
 */
export function ClearSessionButton() {
  const handleClearSession = () => {
    console.log('[ClearSession] 🧹 Manually clearing all Privy data...');

    // Clear all localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('privy:') || key.includes('privy') || key.includes('wallet')) {
        localStorage.removeItem(key);
      }
    });

    // Clear all sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('privy:') || key.includes('privy') || key.includes('wallet')) {
        sessionStorage.removeItem(key);
      }
    });

    console.log('[ClearSession] ✅ Session cleared! Reloading...');

    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Button
      onClick={handleClearSession}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      <RefreshCw size={16} />
      Clear Session & Reload
    </Button>
  );
}
