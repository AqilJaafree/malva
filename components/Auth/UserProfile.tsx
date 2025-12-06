'use client';

import { Button } from '@/components/ui/button';

interface UserProfileProps {
  email?: string;
  walletAddress?: string;
  onLogout: () => void;
}

export function UserProfile({ email, walletAddress, onLogout }: UserProfileProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Logged in as:
        </p>
        <p className="font-medium text-zinc-950 dark:text-zinc-50">
          {email || walletAddress}
        </p>
      </div>
      <Button
        onClick={onLogout}
        variant="destructive"
        className="w-full"
      >
        Logout
      </Button>
    </div>
  );
}

