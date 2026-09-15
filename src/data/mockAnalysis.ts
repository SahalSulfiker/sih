import type {
  AnalysisResponse,
  AnalyzeRequest,
  DestinationPort,
} from "@/types/analysis";

/**
 * Baseline mock response — matches the AGREED API CONTRACT exactly.
 * Field names must stay identical to what the backend returns.
 */
export const baseMockAnalysis: AnalysisResponse = {
  forecast: {
    current_rate: 19.2,
    unit: "USD/MT",
    forecast: [
      { days_ahead: 7, predicted_rate: 18.5, confidence_low: 17.9, confidence_high: 19.1 },
      { days_ahead: 14, predicted_rate: 17.8, confidence_low: 16.9, confidence_high: 18.7 },
      { days_ahead: 30, predicted_rate: 20.4, confidence_low: 19.0, confidence_high: 21.8 },
    ],
    trend: "decreasing",
    confidence_score: 81,
    recommendation: "wait_10_to_14_days",
  },
  vessel_recommendations: [
    {
      vessel_type: "panamax",
      score: 91,
      reason: "Best draft/LOA fit, 94% cargo utilization",
      recommended: true,
      capacity_mt: 80000,
      utilization_pct: 94,
      draft_compatible: true,
    },
    {
      vessel_type: "supramax",
      score: 78,
      reason: "Good fit, lower capacity utilization",
      recommended: false,
      capacity_mt: 58000,
      utilization_pct: 76,
      draft_compatible: true,
    },
    {
      vessel_type: "handysize",
      score: 61,
      reason: "Draft-safe but requires two additional port calls",
      recommended: false,
      capacity_mt: 35000,
      utilization_pct: 58,
      draft_compatible: true,
    },
    {
      vessel_type: "capesize",
      score: 43,
      reason: "Oversized for cargo volume, draft-restricted at berth",
      recommended: false,
      capacity_mt: 180000,
      utilization_pct: 31,
      draft_compatible: false,
    },
  ],
  port_comparison: [
    { port: "gangavaram", total_cost_cr: 93, waiting_hours: 12, risk: "low", recommended: true },
    { port: "dhamra", total_cost_cr: 96, waiting_hours: 20, risk: "low", recommended: false },
    { port: "paradip", total_cost_cr: 100, waiting_hours: 38, risk: "moderate", recommended: false },
    { port: "haldia", total_cost_cr: 104, waiting_hours: 46, risk: "moderate", recommended: false },
  ],
  charter_strategy: [
    { type: "spot", estimated_cost_cr: 100, recommended: false },
    { type: "3_month_mvc", estimated_cost_cr: 93, recommended: true },
    { type: "6_month_mvc", estimated_cost_cr: 92, recommended: false },
  ],
  risk: {
    port_congestion_score: 45,
    congestion_level: "moderate",
    expected_waiting_hours: 32,
    risk_score: 32,
    risk_level: "moderate",
    risk_factors: [
      "Freight volatility elevated this month",
      "Port congestion moderate due to seasonal cargo volume",
    ],
    idle_time_predicted: false,
    idle_time_suggestion: null,
  },
  summary: {
    recommended_vessel: "panamax",
    recommended_port: "gangavaram",
    recommended_contract: "3_month_mvc",
    market_entry_advice: "wait_10_to_14_days",
    estimated_total_cost_cr: 93,
    estimated_savings_cr: 7,
    risk_score: 32,
  },
};

/**
 * Predefined demo scenarios (per BUILD spec §26) — used to keep the live
 * demo reliable regardless of what the presenter types into the form.
 */
export const demoScenarios: { label: string; request: AnalyzeRequest }[] = [
  {
    label: "Australia → Paradip · 75,000 MT",
    request: {
      cargo_type: "coal",
      quantity_mt: 75000,
      origin: "australia",
      destination_port: "paradip",
      required_date: "2026-10-15",
      contract_preference: "open_to_mvc",
    },
  },
  {
    label: "Australia → Gangavaram · 100,000 MT",
    request: {
      cargo_type: "coal",
      quantity_mt: 100000,
      origin: "australia",
      destination_port: "gangavaram",
      required_date: "2026-11-02",
      contract_preference: "3_month_mvc",
    },
  },
  {
    label: "Other origin → Dhamra · 45,000 MT iron ore",
    request: {
      cargo_type: "iron_ore",
      quantity_mt: 45000,
      origin: "other",
      destination_port: "dhamra",
      required_date: "2026-10-28",
      contract_preference: "spot",
    },
  },
];

/**
 * Deterministically varies the baseline mock based on the request, so
 * different form inputs produce visibly different (but still contract-shaped)
 * results without needing a real model.
 */
export function buildMockAnalysis(request: AnalyzeRequest): AnalysisResponse {
  const scaleFactor = Math.max(0.7, Math.min(1.6, request.quantity_mt / 75000));
  const portRates: Record<DestinationPort, number> = {
    gangavaram: 1,
    dhamra: 1.03,
    paradip: 1.075,
    haldia: 1.12,
    vizag: 1.05,
  };
  const baseCost = 93 * scaleFactor * portRates[request.destination_port];

  const round = (n: number) => Math.round(n * 10) / 10;

  const vesselOrder =
    request.quantity_mt > 95000
      ? (["capesize", "panamax", "supramax", "handysize"] as const)
      : request.quantity_mt < 40000
      ? (["handysize", "supramax", "panamax", "capesize"] as const)
      : (["panamax", "supramax", "handysize", "capesize"] as const);

  const vesselMeta = {
    handysize: { capacity_mt: 35000, base: 61, reason: "Draft-safe, efficient for smaller parcel sizes" },
    supramax: { capacity_mt: 58000, base: 78, reason: "Good fit, balanced utilization" },
    panamax: { capacity_mt: 80000, base: 91, reason: "Best draft/LOA fit, high cargo utilization" },
    capesize: { capacity_mt: 180000, base: 43, reason: "Efficient at scale, draft-restricted at some berths" },
  };

  const vessel_recommendations = vesselOrder.map((type, i) => {
    const meta = vesselMeta[type];
    const utilization = Math.min(97, Math.round((request.quantity_mt / meta.capacity_mt) * 100));
    return {
      vessel_type: type,
      score: Math.max(30, meta.base - i * 4),
      reason: meta.reason,
      recommended: i === 0,
      capacity_mt: meta.capacity_mt,
      utilization_pct: Math.max(28, Math.min(utilization, 96)),
      draft_compatible: utilization <= 100,
    };
  });

  const ports: DestinationPort[] = ["gangavaram", "dhamra", "paradip", "haldia"];
  const port_comparison = ports
    .map((port, i) => ({
      port,
      total_cost_cr: round(93 * scaleFactor * portRates[port]),
      waiting_hours: [12, 20, 38, 46][i],
      risk: (["low", "low", "moderate", "moderate"] as const)[i],
      recommended: port === request.destination_port || i === 0,
    }))
    .sort((a, b) => a.total_cost_cr - b.total_cost_cr)
    .map((entry, i) => ({ ...entry, recommended: i === 0 }));

  const spot = round(baseCost * 1.075);
  const threeMonth = round(baseCost);
  const sixMonth = round(baseCost * 0.99);

  const trend: "decreasing" | "increasing" | "stable" =
    request.contract_preference === "spot" ? "increasing" : "decreasing";

  const forecast = {
    current_rate: round(19.2 * scaleFactor),
    unit: "USD/MT",
    forecast: [
      { days_ahead: 7, predicted_rate: round(18.5 * scaleFactor), confidence_low: round(17.9 * scaleFactor), confidence_high: round(19.1 * scaleFactor) },
      { days_ahead: 14, predicted_rate: round(17.8 * scaleFactor), confidence_low: round(16.9 * scaleFactor), confidence_high: round(18.7 * scaleFactor) },
      { days_ahead: 30, predicted_rate: round(20.4 * scaleFactor), confidence_low: round(19.0 * scaleFactor), confidence_high: round(21.8 * scaleFactor) },
    ],
    trend,
    confidence_score: 81,
    recommendation: "wait_10_to_14_days" as const,
  };

  const recommendedPort = port_comparison[0].port;
  const riskScore = recommendedPort === "gangavaram" || recommendedPort === "dhamra" ? 32 : 48;

  return {
    forecast,
    vessel_recommendations,
    port_comparison,
    charter_strategy: [
      { type: "spot", estimated_cost_cr: spot, recommended: false },
      { type: "3_month_mvc", estimated_cost_cr: threeMonth, recommended: true },
      { type: "6_month_mvc", estimated_cost_cr: sixMonth, recommended: false },
    ],
    risk: {
      port_congestion_score: riskScore + 13,
      congestion_level: riskScore > 40 ? "moderate" : "low",
      expected_waiting_hours: port_comparison[0].waiting_hours + 20,
      risk_score: riskScore,
      risk_level: riskScore > 45 ? "moderate" : "low",
      risk_factors: [
        "Freight volatility elevated this month",
        `Port congestion ${riskScore > 40 ? "moderate" : "low"} due to seasonal cargo volume`,
      ],
      idle_time_predicted: false,
      idle_time_suggestion: null,
    },
    summary: {
      recommended_vessel: vessel_recommendations[0].vessel_type,
      recommended_port: recommendedPort,
      recommended_contract: "3_month_mvc",
      market_entry_advice: "wait_10_to_14_days",
      estimated_total_cost_cr: threeMonth,
      estimated_savings_cr: round(spot - threeMonth),
      risk_score: riskScore,
    },
  };
}
