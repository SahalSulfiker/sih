"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AnalyzeRequest, VoyageAnalysis } from "@/types/analysis";
import { analyzeVoyage, AnalyzeApiError } from "@/api/analyze";

const STORAGE_KEY = "freightiq:analyses";
const MAX_HISTORY = 10;

interface AnalysisContextValue {
  history: VoyageAnalysis[];
  current: VoyageAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  runAnalysis: (request: AnalyzeRequest) => Promise<VoyageAnalysis | null>;
  selectAnalysis: (id: string) => void;
  clearError: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

function loadHistory(): VoyageAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VoyageAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history: VoyageAnalysis[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage can fail (quota, private mode) — the app still works in-memory.
  }
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<VoyageAnalysis[]>([]);
  const [current, setCurrent] = useState<VoyageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadHistory();
    /* eslint-disable react-hooks/set-state-in-effect --
       syncing from localStorage (an external system) is exactly what this
       effect is for; it can only run client-side, so it cannot be a lazy
       initial state. */
    setHistory(loaded);
    if (loaded.length > 0) setCurrent(loaded[0]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const runAnalysis = useCallback(async (request: AnalyzeRequest) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await analyzeVoyage(request);
      const analysis: VoyageAnalysis = {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        request,
        response,
      };
      setHistory((prev) => {
        const next = [analysis, ...prev].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
      setCurrent(analysis);
      return analysis;
    } catch (err) {
      const message =
        err instanceof AnalyzeApiError
          ? err.message
          : "Unable to analyze this voyage. Please try again.";
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const selectAnalysis = useCallback(
    (id: string) => {
      const found = history.find((item) => item.id === id);
      if (found) setCurrent(found);
    },
    [history]
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ history, current, isAnalyzing, error, runAnalysis, selectAnalysis, clearError }),
    [history, current, isAnalyzing, error, runAnalysis, selectAnalysis, clearError]
  );

  return (
    <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
  );
}

export function useAnalysisStore(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error("useAnalysisStore must be used within an AnalysisProvider");
  }
  return ctx;
}
