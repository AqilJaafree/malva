'use client';

import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { AssetCard } from "./AssetCard";
import { TrendingUp, X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { DCASetupModal } from '@/components/DCA';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 650 },
  { name: 'Jun', value: 600 },
];

interface AnalyticsPanelProps {
  onClose?: () => void;
}

export function AnalyticsPanel({ onClose }: AnalyticsPanelProps) {
  const [showDCAModal, setShowDCAModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'GOLD'>('BTC');

  const handleOpenDCA = (asset: 'BTC' | 'GOLD') => {
    setSelectedAsset(asset);
    setShowDCAModal(true);
  };

  return (
    <div className={`w-full pb-4 pt-0 md:pb-6 md:pt-6 overflow-y-auto md:border md:border-l md:border-r-0 md:border-t-0 md:border-b-0 relative ${
      onClose ? 'h-[calc(100vh-4rem)]' : 'h-full'
    }`}>
      {/* DCA Setup Modal */}
      <DCASetupModal 
        open={showDCAModal} 
        onOpenChange={setShowDCAModal}
        asset={selectedAsset}
      />
      {/* Mobile Close Button */}
      {onClose && (
        <div className="md:hidden sticky top-0 z-10 flex justify-between items-center mb-4 p-4 bg-background/95 backdrop-blur-sm border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      {/* Top Staking Assets Section */}
      <div className="mb-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Top Staking Assets</h2>
          <div className="flex gap-2">
            <select className="bg-card border border-border rounded-lg px-3 py-1 text-xs text-muted-foreground">
              <option>24H</option>
              <option>7D</option>
              <option>30D</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AssetCard 
            name="Ethereum" 
            symbol="ETH" 
            rewardRate="13.62%" 
            priceChange={6.25} 
            trend="up" 
            color="blue"
          />
          <AssetCard 
            name="BNB Chain" 
            symbol="BNB" 
            rewardRate="12.72%" 
            priceChange={5.67} 
            trend="up" 
            color="orange"
          />
          <AssetCard 
            name="Polygon" 
            symbol="MATIC" 
            rewardRate="6.29%" 
            priceChange={1.89} 
            trend="down" 
            color="purple"
          />
        </div>
      </div>

      {/* Start DCA & Active Staking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
        {/* Left: Start DCA Card */}
        <div className="lg:col-span-1 bg-linear-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-primary-foreground/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
                Automate
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Start Dollar-Cost Averaging</h3>
            <p className="text-primary-foreground/70 text-sm mb-8">
              Set up automatic investments in Bitcoin or Gold and grow your portfolio over time.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => handleOpenDCA('BTC')}
                className="w-full bg-primary-foreground text-primary font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-foreground/90 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                DCA Bitcoin
              </button>
              <button 
                onClick={() => handleOpenDCA('GOLD')}
                className="w-full bg-primary-foreground/20 backdrop-blur-md text-primary-foreground border border-primary-foreground/30 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-foreground/30 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                DCA Gold
              </button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary-foreground/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Right: Active Staking */}
        <div className="lg:col-span-2 bg-card/50 border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Update ~ 45 minutes ago</p>
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                Stake Avalanche (AVAX)
                <span className="bg-destructive/20 text-destructive p-1 rounded text-xs">▲</span>
              </h3>
            </div>
            <div className="flex gap-2">
              <button className="bg-muted p-2 rounded-lg hover:bg-muted/80 transition-colors">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Current Reward Balance</p>
              <h2 className="text-4xl font-bold text-foreground mb-4">31.39686</h2>
              <div className="flex gap-2">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium transition-colors">
                  Upgrade
                </button>
                <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-2 rounded-xl text-sm font-medium transition-colors">
                  Unstake
                </button>
              </div>
            </div>
            
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px',
                      color: '#000000'
                    }}
                    itemStyle={{ color: '#000000' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="bg-primary" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for AssetCard import (since it's in same file during this step for simplicity, but I'll fix imports)
function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

