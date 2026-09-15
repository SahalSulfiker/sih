"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileSearch } from "lucide-react";
import { NavBar } from "@/components/layout/NavBar";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ResultsHero } from "@/components/results/ResultsHero";
import { ExecutiveSummaryCard } from "@/components/results/ExecutiveSummaryCard";
import { ForecastChart } from "@/components/results/ForecastChart";
import { VesselRanking } from "@/components/results/VesselRanking";
import { PortComparison } from "@/components/results/PortComparison";
import { CharterStrategy } from "@/components/results/CharterStrategy";
import { RiskPanel } from "@/components/results/RiskPanel";
import { FinalDecision } from "@/components/results/FinalDecision";
import { useAnalysisStore } from "@/lib/analysis-store";

function ResultsContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const { history, current } = useAnalysisStore();

  const analysis = id ? history.find((item) => item.id === id) ?? current : current;

  if (!analysis) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No analysis to show"
        description="Run a voyage analysis first — this is where your decision report will appear."
        action={
          <Link href="/analyze">
            <Button size="sm">New Voyage Analysis</Button>
          </Link>
        }
        className="mt-10"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ResultsHero analysis={analysis} />
      <ExecutiveSummaryCard analysis={analysis} />
      <ForecastChart forecast={analysis.response.forecast} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VesselRanking vessels={analysis.response.vessel_recommendations} />
        <PortComparison ports={analysis.response.port_comparison} />
      </div>
      <CharterStrategy strategies={analysis.response.charter_strategy} />
      <RiskPanel risk={analysis.response.risk} />
      <FinalDecision analysis={analysis} />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <NavBar />
      <Container className="py-8">
        <Suspense fallback={null}>
          <ResultsContent />
        </Suspense>
      </Container>
    </div>
  );
}
