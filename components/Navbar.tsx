'use client';

import { LogOut, Menu } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, user, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const displayWallet = wallets.length > 0 ? wallets[0] : null;

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-50">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-xl">M</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Malva
          </span>
        </div>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Wallet & User Dropdown */}
        {authenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 border border-border hover:bg-muted/80 transition-colors">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-mono text-muted-foreground">
                  {displayWallet 
                    ? `${displayWallet.address.slice(0, 4)}...${displayWallet.address.slice(-4)}`
                    : user?.email?.address?.slice(0, 10) || 'User'
                  }
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground">Wallet Address</p>
                <p className="text-xs font-mono text-foreground mt-1 break-all">
                  {displayWallet?.address || 'No wallet connected'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

