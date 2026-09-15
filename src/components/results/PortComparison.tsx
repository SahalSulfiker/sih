import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import type { PortComparisonEntry } from "@/types/analysis";
import { formatCroreINR, formatHours, portLabels, riskLabels, riskTone } from "@/lib/format";

export function PortComparison({ ports }: { ports: PortComparisonEntry[] }) {
  const sorted = [...ports].sort((a, b) => a.total_cost_cr - b.total_cost_cr);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Port comparison</CardTitle>
      </CardHeader>
      <CardBody className="pt-0">
        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-md border border-border sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-ink-900/[0.02] text-left text-xs font-medium uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5">Port</th>
                <th className="px-4 py-2.5">Total cost</th>
                <th className="px-4 py-2.5">Waiting time</th>
                <th className="px-4 py-2.5">Risk</th>
                <th className="px-4 py-2.5">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((port, i) => (
                <tr
                  key={port.port}
                  className={cn(
                    "border-b border-border last:border-0",
                    i === 0 && "bg-marine-100/30"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-ink-900">{portLabels[port.port]}</td>
                  <td className="num px-4 py-3 text-ink-900">{formatCroreINR(port.total_cost_cr)}</td>
                  <td className="num px-4 py-3 text-ink-700">{formatHours(port.waiting_hours)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={riskTone(port.risk)} label={riskLabels[port.risk]} />
                  </td>
                  <td className="px-4 py-3">
                    {i === 0 ? (
                      <span className="text-xs font-semibold text-marine-700">Recommended</span>
                    ) : (
                      <span className="text-xs text-ink-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-2.5 sm:hidden">
          {sorted.map((port, i) => (
            <div
              key={port.port}
              className={cn(
                "rounded-md border px-4 py-3",
                i === 0 ? "border-marine-500 bg-marine-100/30" : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{portLabels[port.port]}</p>
                {i === 0 && (
                  <span className="text-xs font-semibold text-marine-700">Recommended</span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-ink-400">Cost</p>
                  <p className="num mt-0.5 font-medium text-ink-900">
                    {formatCroreINR(port.total_cost_cr)}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400">Waiting</p>
                  <p className="num mt-0.5 font-medium text-ink-900">
                    {formatHours(port.waiting_hours)}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400">Risk</p>
                  <p className="mt-0.5">
                    <StatusPill tone={riskTone(port.risk)} label={riskLabels[port.risk]} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
