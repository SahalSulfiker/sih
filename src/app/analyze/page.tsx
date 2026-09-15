"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { NavBar } from "@/components/layout/NavBar";
import { Container } from "@/components/layout/Container";
import { VoyageForm } from "@/components/form/VoyageForm";
import { AnalyzingState } from "@/components/analyzing/AnalyzingState";
import { useAnalysisStore } from "@/lib/analysis-store";
import type { AnalyzeRequest } from "@/types/analysis";

export default function AnalyzePage() {
  const router = useRouter();
  const { runAnalysis, isAnalyzing, error, clearError } = useAnalysisStore();

  async function handleSubmit(request: AnalyzeRequest) {
    const result = await runAnalysis(request);
    if (result) {
      router.push(`/results?id=${result.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <NavBar />
      <Container className="py-10">
        {isAnalyzing ? (
          <AnalyzingState />
        ) : (
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-semibold text-ink-900">
              Create Voyage Analysis
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Tell us about the cargo movement you&apos;re planning.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-md border border-critical-100 bg-critical-100/60 px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-critical-700" aria-hidden />
                <div className="text-sm">
                  <p className="font-medium text-critical-700">Unable to analyze this voyage.</p>
                  <p className="text-critical-700/80">{error} Please try again.</p>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="ml-auto text-xs font-medium text-critical-700 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="mt-6 rounded-lg border border-border bg-surface p-6">
              <VoyageForm onSubmit={handleSubmit} submitting={isAnalyzing} />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
