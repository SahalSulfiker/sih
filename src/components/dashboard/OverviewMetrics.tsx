import { TrendingDown, ShieldAlert, PiggyBank, FileCheck2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface Metric {
  label: string;
  value: string;
  detail: string;
  icon: typeof TrendingDown;
  tone: "positive" | "caution" | "neutral";
}

const metrics: Metric[] = [
  {
    label: "Freight market",
    value: "-4.2%",
    detail: "30-day average, East Coast routes",
    icon: TrendingDown,
    tone: "positive",
  },
  {
    label: "Port risk",
    value: "Moderate",
    detail: "Seasonal congestion across 4 ports",
    icon: ShieldAlert,
    tone: "caution",
  },
  {
    label: "Potential savings",
    value: "₹7 Cr",
    detail: "Vs. spot booking, last analysis",
    icon: PiggyBank,
    tone: "positive",
  },
  {
    label: "Recommended strategy",
    value: "3-Month MVC",
    detail: "Across recent voyage analyses",
    icon: FileCheck2,
    tone: "neutral",
  },
];

const toneText: Record<Metric["tone"], string> = {
  positive: "text-positive-700",
  caution: "text-caution-700",
  neutral: "text-ink-900",
};

const toneIconBg: Record<Metric["tone"], string> = {
  positive: "bg-positive-100 text-positive-700",
  caution: "bg-caution-100 text-caution-700",
  neutral: "bg-marine-100 text-marine-700",
};

export function OverviewMetrics() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-ink-500">{metric.label}</p>
            <span className={cn("rounded-md p-1.5", toneIconBg[metric.tone])}>
              <metric.icon className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <p className={cn("num mt-3 text-2xl font-semibold", toneText[metric.tone])}>
            {metric.value}
          </p>
          <p className="mt-1 text-xs text-ink-400">{metric.detail}</p>
        </Card>
      ))}
    </div>
  );
}
