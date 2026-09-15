"use client";

import Link from "next/link";
import { ArrowRight, Ship } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import type { VoyageAnalysis } from "@/types/analysis";
import {
  contractLabels,
  formatCroreINR,
  formatDate,
  formatMT,
  originLabels,
  portLabels,
  riskTone,
} from "@/lib/format";

export function RecentAnalyses({ analyses }: { analyses: VoyageAnalysis[] }) {
  if (analyses.length === 0) {
    return (
      <EmptyState
        icon={Ship}
        title="No analyses yet"
        description="Run your first voyage analysis to see forecasts, vessel and port recommendations here."
        action={
          <Link
            href="/analyze"
            className="text-sm font-medium text-marine-700 hover:text-marine-900"
          >
            Start a new analysis →
          </Link>
        }
      />
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {analyses.map((analysis) => {
        const { request, response, id } = analysis;
        return (
          <Link
            key={id}
            href={`/results?id=${id}`}
            className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-marine-100/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-ink-900">
                {originLabels[request.origin]} → {portLabels[request.destination_port]}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {formatMT(request.quantity_mt)} · {formatDate(request.required_date)} ·{" "}
                {contractLabels[response.summary.recommended_contract]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="num text-sm font-semibold text-ink-900">
                  {formatCroreINR(response.summary.estimated_total_cost_cr)}
                </p>
                <p className="text-xs text-ink-400">
                  saved {formatCroreINR(response.summary.estimated_savings_cr)}
                </p>
              </div>
              <StatusPill
                tone={riskTone(response.risk.risk_level)}
                label={`${response.risk.risk_level} risk`}
              />
              <ArrowRight className="h-4 w-4 text-ink-300" aria-hidden />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
