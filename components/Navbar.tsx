'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export default function Navbar() {
  const { logout, user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Apply theme to document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const displayWallet = wallets.length > 0 ? wallets[0] : null;

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
          <span className="text-background font-bold text-xl">M</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-foreground">
          Malva
        </span>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Switch */}
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-muted-foreground" />
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={handleToggleTheme}
            aria-label="Toggle dark mode"
          />
          <Moon size={16} className="text-muted-foreground" />
        </div>

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

