import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-14 text-center",
        className
      )}
    >
      <Icon className="h-8 w-8 text-ink-300" aria-hidden />
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="text-sm text-ink-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
