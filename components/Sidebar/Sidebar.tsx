'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Home, Wallet, TrendingUp, Settings, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/marketplace', label: 'Marketplace', icon: TrendingUp },
//   { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark';
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
                  <span className="text-background font-bold text-xl">M</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-foreground">
                  Malva
                </span>
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onToggle}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-2 mb-4">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <div className="flex items-center gap-2">
                  <Sun size={16} className="text-muted-foreground" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={handleToggleTheme}
                    aria-label="Toggle dark mode"
                  />
                  <Moon size={16} className="text-muted-foreground" />
                </div>
              </div>
            {/* Footer with Theme Toggle */}
            <div className="p-4 border-t border-border space-y-4">

              {/* Copyright */}
              <div className="text-xs text-muted-foreground text-center">
                © 2025 Malva
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

