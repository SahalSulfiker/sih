"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Forecast } from "@/types/analysis";
import { formatUsdPerMt } from "@/lib/format";

interface ChartPoint {
  label: string;
  daysAhead: number;
  rate: number | null;
  band: [number, number] | null;
}

function buildChartData(forecast: Forecast): ChartPoint[] {
  const points: ChartPoint[] = [
    { label: "Today", daysAhead: 0, rate: forecast.current_rate, band: null },
  ];
  for (const point of forecast.forecast) {
    points.push({
      label: `${point.days_ahead}D`,
      daysAhead: point.days_ahead,
      rate: point.predicted_rate,
      band: [point.confidence_low, point.confidence_high],
    });
  }
  return points;
}

const trendCopy: Record<Forecast["trend"], string> = {
  decreasing: "Freight rates are expected to soften over the coming weeks.",
  increasing: "Freight rates are expected to firm up over the coming weeks.",
  stable: "Freight rates are expected to stay broadly stable.",
};

export function ForecastChart({ forecast }: { forecast: Forecast }) {
  const data = buildChartData(forecast);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Freight forecast</CardTitle>
        <span className="text-xs font-medium text-ink-400">
          Confidence {forecast.confidence_score}%
        </span>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-3 gap-4 pb-5">
          <Stat label="Current rate" value={formatUsdPerMt(forecast.current_rate)} />
          <Stat
            label="Trend"
            value={forecast.trend[0].toUpperCase() + forecast.trend.slice(1)}
            tone={forecast.trend === "decreasing" ? "text-positive-700" : "text-ink-900"}
          />
          <Stat label="Confidence" value={`${forecast.confidence_score}%`} />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#5b6577" }}
                axisLine={{ stroke: "#e2e6ec" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#5b6577" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => `$${v}`}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name !== "rate" || value === undefined || value === null) return null;
                  return [`$${Number(value).toFixed(2)}/MT`, "Rate"];
                }}
                labelFormatter={(label) => label}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e6ec",
                  fontSize: 12,
                }}
              />
              <Area
                dataKey={(point: ChartPoint) => point.band?.[1] ?? null}
                stroke="none"
                fill="#2f66b3"
                fillOpacity={0.08}
                isAnimationActive
              />
              <Area
                dataKey={(point: ChartPoint) => point.band?.[0] ?? null}
                stroke="none"
                fill="#f6f7f9"
                fillOpacity={1}
                isAnimationActive
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#1e4b8c"
                strokeWidth={2.25}
                dot={{ r: 3, fill: "#1e4b8c", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Market outlook
          </p>
          <p className="mt-1 text-sm text-ink-700">{trendCopy[forecast.trend]}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`num mt-1 text-base font-semibold ${tone ?? "text-ink-900"}`}>{value}</p>
    </div>
  );
}
