import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { CharterStrategyEntry } from "@/types/analysis";
import { contractLabels, formatCroreINR } from "@/lib/format";

export function CharterStrategy({ strategies }: { strategies: CharterStrategyEntry[] }) {
  const spot = strategies.find((s) => s.type === "spot");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Charter strategy</CardTitle>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {strategies.map((strategy) => {
          const diff = spot ? spot.estimated_cost_cr - strategy.estimated_cost_cr : 0;
          return (
            <div
              key={strategy.type}
              className={cn(
                "flex flex-col gap-2 rounded-md border px-4 py-4",
                strategy.recommended ? "border-marine-500 bg-marine-100/40" : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-ink-500">
                  {contractLabels[strategy.type]}
                </p>
                {strategy.recommended && (
                  <span className="rounded-full bg-marine-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Recommended
                  </span>
                )}
              </div>
              <p className="num text-2xl font-semibold text-ink-900">
                {formatCroreINR(strategy.estimated_cost_cr)}
              </p>
              {strategy.type !== "spot" && (
                <p className={cn("text-xs font-medium", diff >= 0 ? "text-positive-700" : "text-critical-700")}>
                  {diff >= 0 ? "Saves" : "Costs"} {formatCroreINR(Math.abs(diff))} vs. spot
                </p>
              )}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
