import { Ship, Anchor, FileText, Clock3, Gauge } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { VoyageAnalysis } from "@/types/analysis";
import {
  contractLabels,
  formatCroreINR,
  formatDate,
  formatMT,
  marketAdviceLabels,
  originLabels,
  portLabels,
  riskTone,
  vesselLabels,
} from "@/lib/format";

export function ResultsHero({ analysis }: { analysis: VoyageAnalysis }) {
  const { request, response } = analysis;
  const { summary, risk } = response;

  return (
    <div className="animate-fade-in rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Voyage Analysis
          </p>
          <p className="mt-0.5 text-sm font-medium text-ink-900">
            {originLabels[request.origin]} → {portLabels[request.destination_port]} ·{" "}
            {formatMT(request.quantity_mt)} · {formatDate(request.required_date)}
          </p>
        </div>
        <StatusPill tone={riskTone(risk.risk_level)} label={`${risk.risk_level} risk · ${risk.risk_score}/100`} />
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-marine-700">
            Recommended strategy
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[22px] font-semibold text-ink-900 sm:text-[26px]">
            <span className="inline-flex items-center gap-2">
              <Ship className="h-5 w-5 text-marine-700" aria-hidden />
              {vesselLabels[summary.recommended_vessel]}
            </span>
            <span className="text-ink-300">+</span>
            <span className="inline-flex items-center gap-2">
              <Anchor className="h-5 w-5 text-marine-700" aria-hidden />
              {portLabels[summary.recommended_port]}
            </span>
            <span className="text-ink-300">+</span>
            <span className="inline-flex items-center gap-2">
              <FileText className="h-5 w-5 text-marine-700" aria-hidden />
              {contractLabels[summary.recommended_contract]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <Metric label="Estimated total cost" value={formatCroreINR(summary.estimated_total_cost_cr)} />
          <Metric
            label="Estimated savings"
            value={formatCroreINR(summary.estimated_savings_cr)}
            valueClass="text-positive-700"
          />
          <Metric
            label="Market advice"
            value={marketAdviceLabels[summary.market_entry_advice]}
            icon={Clock3}
          />
          <Metric
            label="Risk"
            value={`${risk.risk_level[0].toUpperCase()}${risk.risk_level.slice(1)} · ${risk.risk_score}/100`}
            icon={Gauge}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  valueClass,
  icon: Icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: typeof Clock3;
}) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p
        className={`num mt-1 flex items-center gap-1.5 text-base font-semibold text-ink-900 ${valueClass ?? ""}`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />}
        {value}
      </p>
    </div>
  );
}
