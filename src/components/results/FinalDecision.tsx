"use client";

import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { VoyageAnalysis } from "@/types/analysis";
import {
  contractLabels,
  formatCroreINR,
  marketAdviceLabels,
  portLabels,
  vesselLabels,
} from "@/lib/format";

export function FinalDecision({ analysis }: { analysis: VoyageAnalysis }) {
  const { summary, risk } = analysis.response;

  function handleExport() {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freightiq-analysis-${analysis.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const rows: { label: string; value: string }[] = [
    { label: "Vessel", value: vesselLabels[summary.recommended_vessel] },
    { label: "Port", value: portLabels[summary.recommended_port] },
    { label: "Contract", value: contractLabels[summary.recommended_contract] },
    { label: "Timing", value: marketAdviceLabels[summary.market_entry_advice] },
    { label: "Estimated cost", value: formatCroreINR(summary.estimated_total_cost_cr) },
    { label: "Estimated savings", value: formatCroreINR(summary.estimated_savings_cr) },
    { label: "Risk", value: `${risk.risk_score} / 100` },
  ];

  return (
    <Card className="border-marine-500">
      <CardHeader>
        <CardTitle>Final recommendation</CardTitle>
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-ink-400">{row.label}</dt>
              <dd className="num mt-0.5 text-sm font-semibold text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" aria-hidden />
            Export Analysis
          </Button>
          <Link href="/analyze">
            <Button variant="secondary" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4" aria-hidden />
              Start New Analysis
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
