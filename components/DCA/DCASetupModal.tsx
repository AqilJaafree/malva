"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";

interface DCASetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: "BTC" | "GOLD";
}

const intervals = [
  { id: "daily", label: "Daily", description: "Every day" },
  { id: "weekly", label: "Weekly", description: "Every week" },
  { id: "biweekly", label: "Bi-weekly", description: "Every 2 weeks" },
  { id: "monthly", label: "Monthly", description: "Every month" },
];

// Mock trend data
const trendData = [
  { date: "29 Oct", value: 12500, projected: 6500 },
  { date: "30 Oct", value: 15200, projected: 7200 },
  { date: "31 Oct", value: 14800, projected: 7800 },
  { date: "1 Nov", value: 18500, projected: 8200 },
  { date: "2 Nov", value: 9800, projected: 8500 },
  { date: "3 Nov", value: 11200, projected: 8800 },
  { date: "4 Nov", value: 13500, projected: 9100 },
  { date: "5 Nov", value: 10800, projected: 9300 },
  { date: "6 Nov", value: 12000, projected: 9500 },
];

export function DCASetupModal({
  open,
  onOpenChange,
  asset,
}: DCASetupModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [selectedInterval, setSelectedInterval] = useState<string>("weekly");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("high");

  const handleSetupDCA = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    console.log("DCA Setup:", {
      asset,
      amount,
      interval: selectedInterval,
      riskLevel,
    });

    // TODO: Submit to backend
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Set Up Dollar-Cost Averaging
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Automate your {asset} investments with a smart DCA strategy.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left: Trend Chart */}
          <div className="bg-card rounded-2xl p-6 border border-border h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Trend</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setRiskLevel("high")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    riskLevel === "high"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  High
                </button>
                <button
                  onClick={() => setRiskLevel("medium")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    riskLevel === "medium"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setRiskLevel("low")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    riskLevel === "low"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Low
                </button>
              </div>
            </div>

            <div className="flex-1 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                >
                  <XAxis
                    dataKey="date"
                    stroke="#000"
                    fontSize={13}
                    tickLine={false}
                    axisLine={true}
                    dy={10}
                  />
                  <YAxis
                    stroke="#000"
                    fontSize={13}
                    tickLine={false}
                    axisLine={true}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #000000",
                      borderRadius: "8px",
                      color: "#000000",
                    }}
                    itemStyle={{ color: "#000000" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="#96e6a1"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Investment Settings */}
          <div className="h-[450px] overflow-y-auto pr-2 space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <label
                htmlFor="dca-amount"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Investment Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="dca-amount"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-14 text-lg"
                  min="1"
                  step="10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the amount you want to invest per interval
              </p>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {["50", "100", "250", "500"].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      amount === quickAmount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Investment Interval
              </label>
              <div className="grid grid-cols-2 gap-3">
                {intervals.map((interval) => (
                  <button
                    key={interval.id}
                    onClick={() => setSelectedInterval(interval.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedInterval === interval.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground mb-1">
                      {interval.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {interval.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-foreground">DCA Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset:</span>
                    <span className="font-medium text-foreground">{asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium text-foreground">
                      ${amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium text-foreground capitalize">
                      {selectedInterval}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-medium text-foreground capitalize">
                      {riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetupDCA}
                disabled={!amount || parseFloat(amount) <= 0}
                className="flex-1"
              >
                Start DCA
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
