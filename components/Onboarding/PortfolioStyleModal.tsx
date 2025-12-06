'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Bitcoin, Gem } from 'lucide-react';

interface PortfolioStyleModalProps {
  open: boolean;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  selectedAsset: string;
  monthlyInvestment: string;
  investmentGoal: string;
}

const assets = [
  {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    icon: Bitcoin,
    description: 'Digital gold - decentralized cryptocurrency',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: Gem,
    description: 'Traditional store of value',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
];

export function PortfolioStyleModal({ open, onComplete }: PortfolioStyleModalProps) {
  const [step, setStep] = useState<'asset' | 'investment' | 'goal'>('asset');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [monthlyInvestment, setMonthlyInvestment] = useState<string>('');
  const [investmentGoal, setInvestmentGoal] = useState<string>('');

  const handleAssetSelect = (assetId: string) => {
    setSelectedAsset(assetId);
  };

  const handleNextFromAsset = () => {
    if (selectedAsset) {
      setStep('investment');
    }
  };

  const handleNextFromInvestment = () => {
    if (monthlyInvestment) {
      setStep('goal');
    }
  };

  const handleComplete = () => {
    if (investmentGoal) {
      onComplete({
        selectedAsset: selectedAsset,
        monthlyInvestment,
        investmentGoal,
      });
    }
  };

  const handleSkip = () => {
    onComplete({
      selectedAsset: selectedAsset || 'btc',
      monthlyInvestment: monthlyInvestment || '0',
      investmentGoal: investmentGoal || 'General investing',
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Step 1: Asset Selection */}
        {step === 'asset' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                Choose Your Asset
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select Bitcoin or Gold to start your investment journey.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetSelect(asset.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all hover:border-primary/50 ${
                    selectedAsset === asset.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-xl ${asset.bgColor} ${asset.color}`}>
                      <asset.icon size={32} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground mb-1">
                        {asset.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {asset.description}
                      </p>
                    </div>
                    {selectedAsset === asset.id && (
                      <div className="absolute top-3 right-3 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleNextFromAsset}
                disabled={!selectedAsset}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Monthly Investment */}
        {step === 'investment' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                Monthly Investment Amount
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                How much do you plan to invest each month? This helps us optimize your DCA strategy.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="monthly-amount" className="text-sm font-medium text-foreground">
                  Monthly Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="monthly-amount"
                    type="number"
                    placeholder="500"
                    value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(e.target.value)}
                    className="pl-8 h-14 text-lg"
                    min="0"
                    step="50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can adjust this anytime. Enter 0 if you&apos;re not sure yet.
                </p>
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['100', '250', '500', '1000'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setMonthlyInvestment(amount)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      monthlyInvestment === amount
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-accent'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('asset')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleNextFromInvestment}
                disabled={!monthlyInvestment}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Investment Goal */}
        {step === 'goal' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                What&apos;s Your Investment Goal?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Understanding your goal helps us provide better recommendations.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="investment-goal" className="text-sm font-medium text-foreground">
                  Primary Goal
                </label>
                <Input
                  id="investment-goal"
                  type="text"
                  placeholder="e.g., Retirement, Wealth building, Passive income..."
                  value={investmentGoal}
                  onChange={(e) => setInvestmentGoal(e.target.value)}
                  className="h-14 text-base"
                />
              </div>

              {/* Quick goal buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Popular goals:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Long-term wealth',
                    'Retirement savings',
                    'Passive income',
                    'Financial freedom',
                  ].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setInvestmentGoal(goal)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                        investmentGoal === goal
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card hover:bg-accent'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('investment')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!investmentGoal}
                className="flex-1"
              >
                Complete Setup
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

