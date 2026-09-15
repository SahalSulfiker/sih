import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export type Tone = "positive" | "caution" | "critical" | "neutral";

const toneStyles: Record<Tone, string> = {
  positive: "bg-positive-100 text-positive-700",
  caution: "bg-caution-100 text-caution-700",
  critical: "bg-critical-100 text-critical-700",
  neutral: "bg-ink-900/5 text-ink-700",
};

const toneIcons: Record<Tone, typeof CheckCircle2> = {
  positive: CheckCircle2,
  caution: AlertTriangle,
  critical: XCircle,
  neutral: Info,
};

export function StatusPill({
  tone,
  label,
  className,
}: {
  tone: Tone;
  label: string;
  className?: string;
}) {
  const Icon = toneIcons[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneStyles[tone],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
