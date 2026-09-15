import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import type { RiskAssessment } from "@/types/analysis";
import { formatHours, riskLabels, riskTone } from "@/lib/format";

export function RiskPanel({ risk }: { risk: RiskAssessment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk &amp; congestion</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RiskGauge
            label="Risk score"
            score={risk.risk_score}
            tone={riskTone(risk.risk_level)}
            badge={riskLabels[risk.risk_level]}
          />
          <RiskGauge
            label="Port congestion"
            score={risk.port_congestion_score}
            tone={riskTone(risk.congestion_level)}
            badge={riskLabels[risk.congestion_level]}
          />
          <div>
            <p className="text-xs text-ink-400">Expected waiting</p>
            <p className="num mt-1 text-2xl font-semibold text-ink-900">
              {formatHours(risk.expected_waiting_hours)}
            </p>
            <StatusPill tone={riskTone(risk.congestion_level)} label="At berth" className="mt-2" />
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Risk factors
          </p>
          <ul className="mt-2 space-y-1.5">
            {risk.risk_factors.map((factor) => (
              <li key={factor} className="flex items-start gap-2 text-sm text-ink-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution-600" aria-hidden />
                {factor}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-ink-900/[0.02] px-3.5 py-2.5">
          {risk.idle_time_predicted ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution-600" aria-hidden />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive-600" aria-hidden />
          )}
          <p className="text-sm text-ink-700">
            {risk.idle_time_predicted
              ? risk.idle_time_suggestion ?? "Idle time is predicted for this voyage."
              : "No significant idle time predicted."}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function RiskGauge({
  label,
  score,
  tone,
  badge,
}: {
  label: string;
  score: number;
  tone: "positive" | "caution" | "critical";
  badge: string;
}) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="num mt-1 text-2xl font-semibold text-ink-900">
        {score}
        <span className="text-sm font-normal text-ink-400"> / 100</span>
      </p>
      <StatusPill tone={tone} label={badge} className="mt-2" />
    </div>
  );
}
