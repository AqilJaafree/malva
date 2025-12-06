import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetCardProps {
  name: string;
  symbol: string;
  rewardRate: string;
  priceChange: number;
  trend: "up" | "down";
  color?: string;
}

export function AssetCard({ name, symbol, rewardRate, priceChange, trend, color = "blue" }: AssetCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-card/50 p-6 border border-border backdrop-blur-xl">
      {/* Background Gradient */}
      <div className={cn(
        "absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-20 translate-x-10 -translate-y-10",
        color === "blue" && "bg-primary",
        color === "purple" && "bg-primary",
        color === "orange" && "bg-accent"
      )} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg",
              color === "blue" && "bg-primary",
              color === "purple" && "bg-primary",
              color === "orange" && "bg-accent"
            )}>
              {symbol[0]}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Proof of Stake</p>
              <h3 className="text-sm font-bold text-foreground">{name} ({symbol})</h3>
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-1">Reward Rate</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-foreground">{rewardRate}</h2>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {trend === "up" ? (
           <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 text-xs font-medium bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                {priceChange}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-destructive text-xs font-medium bg-destructive/10 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="h-3 w-3" />
                {priceChange}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

