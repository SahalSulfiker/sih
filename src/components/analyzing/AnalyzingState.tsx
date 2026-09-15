"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const steps = [
  "Reading freight market",
  "Evaluating port conditions",
  "Matching vessel capacity",
  "Comparing charter strategies",
  "Generating recommendation",
];

const STEP_INTERVAL_MS = 480;

export function AnalyzingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= steps.length - 1) return;
    const timer = setTimeout(() => setActiveStep((s) => s + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div className="mx-auto max-w-md py-16 text-center" role="status" aria-live="polite">
      <h2 className="text-lg font-semibold text-ink-900">Analyzing voyage…</h2>
      <p className="mt-1 text-sm text-ink-500">
        Cross-checking market, port, and vessel data for this cargo movement.
      </p>

      <ul className="mt-8 space-y-3 text-left">
        {steps.map((step, i) => {
          const complete = i < activeStep;
          const current = i === activeStep;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-md border px-4 py-2.5 transition-colors duration-200",
                complete && "border-positive-100 bg-positive-100/60",
                current && "border-marine-500 bg-marine-100/50",
                !complete && !current && "border-border bg-surface"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  complete && "bg-positive-600 text-white animate-check-pop",
                  current && "text-marine-700",
                  !complete && !current && "text-ink-300"
                )}
              >
                {complete ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : current ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  complete && "text-positive-700",
                  current && "font-medium text-ink-900",
                  !complete && !current && "text-ink-400"
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
