"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/layout/NavBar";
import { Container } from "@/components/layout/Container";
import { RecentAnalyses } from "@/components/dashboard/RecentAnalyses";
import { useAnalysisStore } from "@/lib/analysis-store";

export default function HistoryPage() {
  const { history } = useAnalysisStore();

  return (
    <div className="min-h-screen bg-canvas">
      <NavBar />
      <Container className="py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Overview
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink-900">
          Previous analyses
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Every voyage analysis run in this session, most recent first.
        </p>
        <div className="mt-6">
          <RecentAnalyses analyses={history} />
        </div>
      </Container>
    </div>
  );
}
