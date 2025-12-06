'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Mock transaction data
const transactions = [
  {
    id: '1',
    type: 'buy',
    asset: 'BTC',
    amount: '0.05',
    value: '$2,500.00',
    date: '2024-11-05',
    status: 'completed',
  },
  {
    id: '2',
    type: 'sell',
    asset: 'GOLD',
    amount: '100g',
    value: '$6,800.00',
    date: '2024-11-04',
    status: 'completed',
  },
  {
    id: '3',
    type: 'buy',
    asset: 'BTC',
    amount: '0.02',
    value: '$1,000.00',
    date: '2024-11-03',
    status: 'completed',
  },
  {
    id: '4',
    type: 'buy',
    asset: 'GOLD',
    amount: '50g',
    value: '$3,400.00',
    date: '2024-11-02',
    status: 'pending',
  },
];

export default function PortfolioPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
            <p className="text-muted-foreground">Track your investments and transactions</p>
          </div>

          {/* Total Portfolio Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Value Card */}
            <div className="md:col-span-2 bg-linear-to-br from-primary to-primary/80 rounded-3xl p-8 text-primary-foreground relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-primary-foreground/70 text-sm mb-2">Total Portfolio Value</p>
                <h2 className="text-5xl font-bold mb-4">$13,700.00</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm bg-primary-foreground/20 backdrop-blur-md px-3 py-1 rounded-full">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">+12.5%</span>
                  </div>
                  <span className="text-primary-foreground/70 text-sm">this month</span>
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 h-64 w-64 bg-primary-foreground/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Assets Breakdown */}
            <div className="bg-card rounded-3xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Assets</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <span className="text-orange-500 font-bold">₿</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Bitcoin</p>
                      <p className="text-xs text-muted-foreground">0.07 BTC</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">$3,500</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-500">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>8.2%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <span className="text-yellow-500 font-bold text-lg">⚡</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Gold</p>
                      <p className="text-xs text-muted-foreground">1500g</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">$10,200</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-500">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>15.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Value</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'buy' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.type === 'buy' ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {tx.type.toUpperCase()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground">{tx.asset}</span>
                      </td>
                      <td className="p-4 text-foreground">{tx.amount}</td>
                      <td className="p-4 font-medium text-foreground">{tx.value}</td>
                      <td className="p-4 text-muted-foreground">{tx.date}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

