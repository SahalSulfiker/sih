import { Ship } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { VesselRecommendation } from "@/types/analysis";
import { formatMT, vesselLabels } from "@/lib/format";

export function VesselRanking({ vessels }: { vessels: VesselRecommendation[] }) {
  const ranked = [...vessels].sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vessel recommendations</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2.5">
        {ranked.map((vessel, i) => (
          <div
            key={vessel.vessel_type}
            className={cn(
              "flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
              vessel.recommended
                ? "border-marine-500 bg-marine-100/40"
                : "border-border bg-surface"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  vessel.recommended
                    ? "bg-marine-700 text-white"
                    : "bg-ink-900/5 text-ink-500"
                )}
              >
                {i + 1}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <Ship className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                  {vesselLabels[vessel.vessel_type]}
                  {vessel.recommended && (
                    <span className="rounded-full bg-marine-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Recommended
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">{vessel.reason}</p>
              </div>
            </div>

            <div className="flex items-center gap-5 pl-11 sm:pl-0">
              {vessel.capacity_mt && (
                <div className="text-right">
                  <p className="num text-xs font-medium text-ink-700">
                    {formatMT(vessel.capacity_mt)}
                  </p>
                  <p className="text-[11px] text-ink-400">capacity</p>
                </div>
              )}
              {typeof vessel.utilization_pct === "number" && (
                <div className="text-right">
                  <p className="num text-xs font-medium text-ink-700">
                    {vessel.utilization_pct}%
                  </p>
                  <p className="text-[11px] text-ink-400">utilization</p>
                </div>
              )}
              <div className="text-right">
                <p
                  className={cn(
                    "num text-sm font-semibold",
                    vessel.recommended ? "text-marine-700" : "text-ink-900"
                  )}
                >
                  {vessel.score}
                </p>
                <p className="text-[11px] text-ink-400">score</p>
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
