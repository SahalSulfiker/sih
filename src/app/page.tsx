"use client";

import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { NavBar } from "@/components/layout/NavBar";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { OverviewMetrics } from "@/components/dashboard/OverviewMetrics";
import { RecentAnalyses } from "@/components/dashboard/RecentAnalyses";
import { useAnalysisStore } from "@/lib/analysis-store";

export default function OverviewPage() {
  const { history } = useAnalysisStore();

  return (
    <div className="min-h-screen bg-canvas">
      <NavBar />
      <Container className="py-10">
        <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[13px] font-medium text-marine-700">
              AI-powered freight &amp; chartering intelligence
            </p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink-900">
              Chart every voyage with confidence
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
              FreightIQ evaluates freight pricing, port congestion, and vessel
              fit for each cargo movement, then recommends the vessel, port,
              and contract strategy that minimizes cost and risk.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link href="/analyze">
              <Button size="md" className="w-full sm:w-auto">
                New Voyage Analysis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="secondary" size="md" className="w-full sm:w-auto">
                <History className="h-4 w-4" aria-hidden />
                View Previous Analyses
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <OverviewMetrics />
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink-900">
              Recent analyses
            </h2>
            {history.length > 0 && (
              <Link
                href="/history"
                className="text-[13px] font-medium text-marine-700 hover:text-marine-900"
              >
                View all
              </Link>
            )}
          </div>
          <RecentAnalyses analyses={history.slice(0, 4)} />
        </div>
      </Container>
    </div>
  );
}
