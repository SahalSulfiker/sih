/**
 * Canonical types for the FreightIQ API contract.
 * These field names and shapes are the source of truth agreed with the
 * backend (Person 3) — do not rename them without updating the contract.
 */

export type CargoType = "coal" | "iron_ore" | "grain" | "other";

export type Origin = "australia" | "other";

export type DestinationPort =
  | "paradip"
  | "gangavaram"
  | "haldia"
  | "dhamra"
  | "vizag";

export type ContractPreference =
  | "spot"
  | "3_month_mvc"
  | "6_month_mvc"
  | "open_to_mvc";

export interface AnalyzeRequest {
  cargo_type: CargoType;
  quantity_mt: number;
  origin: Origin;
  destination_port: DestinationPort;
  required_date: string; // ISO date, e.g. "2026-10-15"
  contract_preference: ContractPreference;
}

export type ForecastTrend = "increasing" | "decreasing" | "stable";

export type MarketEntryAdvice =
  | "book_now"
  | "wait_7_days"
  | "wait_10_to_14_days"
  | "wait_and_monitor";

export interface ForecastPoint {
  days_ahead: number;
  predicted_rate: number;
  confidence_low: number;
  confidence_high: number;
}

export interface Forecast {
  current_rate: number;
  unit: string;
  forecast: ForecastPoint[];
  trend: ForecastTrend;
  confidence_score: number;
  recommendation: MarketEntryAdvice;
}

export type VesselType = "handysize" | "supramax" | "panamax" | "capesize";

export interface VesselRecommendation {
  vessel_type: VesselType;
  score: number;
  reason: string;
  recommended: boolean;
  capacity_mt?: number;
  utilization_pct?: number;
  draft_compatible?: boolean;
}

export type RiskLevel = "low" | "moderate" | "high";

export interface PortComparisonEntry {
  port: DestinationPort;
  total_cost_cr: number;
  waiting_hours: number;
  risk: RiskLevel;
  recommended: boolean;
}

export type CharterType = "spot" | "3_month_mvc" | "6_month_mvc";

export interface CharterStrategyEntry {
  type: CharterType;
  estimated_cost_cr: number;
  recommended: boolean;
}

export interface RiskAssessment {
  port_congestion_score: number;
  congestion_level: RiskLevel;
  expected_waiting_hours: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  idle_time_predicted: boolean;
  idle_time_suggestion: string | null;
}

export interface AnalysisSummary {
  recommended_vessel: VesselType;
  recommended_port: DestinationPort;
  recommended_contract: CharterType;
  market_entry_advice: MarketEntryAdvice;
  estimated_total_cost_cr: number;
  estimated_savings_cr: number;
  risk_score: number;
}

export interface AnalysisResponse {
  forecast: Forecast;
  vessel_recommendations: VesselRecommendation[];
  port_comparison: PortComparisonEntry[];
  charter_strategy: CharterStrategyEntry[];
  risk: RiskAssessment;
  summary: AnalysisSummary;
}

/** Wraps an AnalysisResponse together with the request that produced it. */
export interface VoyageAnalysis {
  id: string;
  createdAt: string;
  request: AnalyzeRequest;
  response: AnalysisResponse;
}

export interface ApiError {
  message: string;
  code?: string;
}
