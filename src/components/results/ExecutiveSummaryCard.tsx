import { Card, CardBody } from "@/components/ui/Card";
import type { VoyageAnalysis } from "@/types/analysis";
import {
  contractLabels,
  marketAdviceLabels,
  portLabels,
  vesselLabels,
} from "@/lib/format";

export function ExecutiveSummaryCard({ analysis }: { analysis: VoyageAnalysis }) {
  const { summary } = analysis.response;

  const advice = marketAdviceLabels[summary.market_entry_advice].toLowerCase();

  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
          Executive summary
        </p>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-900">
          {advice.charAt(0).toUpperCase() + advice.slice(1)} before fixing the voyage,
          then prefer a {contractLabels[summary.recommended_contract].toLowerCase()}{" "}
          through {portLabels[summary.recommended_port]} using a{" "}
          {vesselLabels[summary.recommended_vessel]}.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-400">Based on</dt>
            <dd className="mt-0.5 text-sm text-ink-700">Forecasted freight trends</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Based on</dt>
            <dd className="mt-0.5 text-sm text-ink-700">Vessel–port compatibility</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Based on</dt>
            <dd className="mt-0.5 text-sm text-ink-700">Estimated waiting time</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
