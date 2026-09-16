import type {
  CargoType,
  CharterType,
  DestinationPort,
  MarketEntryAdvice,
  Origin,
  RiskLevel,
  VesselType,
} from "@/types/analysis";

export function formatCroreINR(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
}

export function formatMT(value: number): string {
  return `${value.toLocaleString("en-IN")} MT`;
}

export function formatUsdPerMt(value: number): string {
  return `$${value.toFixed(2)}/MT`;
}

export function formatHours(value: number): string {
  if (value < 24) return `${value}h`;
  const days = Math.floor(value / 24);
  const hours = value % 24;
  return hours === 0 ? `${days}d` : `${days}d ${hours}h`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const cargoLabels: Record<CargoType, string> = {
  coal: "Coal",
  iron_ore: "Iron Ore",
  grain: "Grain",
  other: "Other",
};

export const originLabels: Record<Origin, string> = {
  australia: "Australia",
  other: "Other",
};

export const portLabels: Record<DestinationPort, string> = {
  paradip: "Paradip",
  gangavaram: "Gangavaram",
  dhamra: "Dhamra",
  vizag: "Visakhapatnam",
  gopalpur: "Gopalpur",
  sagar_sandheads: "Sagar Sandheads",
};

export const contractLabels: Record<CharterType, string> = {
  spot: "Spot",
  "3_month_mvc": "3-Month MVC",
  "6_month_mvc": "6-Month MVC",
};

export const vesselLabels: Record<VesselType, string> = {
  handysize: "Handysize",
  supramax: "Supramax",
  panamax: "Panamax",
  capesize: "Capesize",
};

export const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export const marketAdviceLabels: Record<MarketEntryAdvice, string> = {
  book_now: "Book now",
  wait_7_days: "Wait 5–7 days",
  wait_10_to_14_days: "Wait 10–14 days",
  wait_and_monitor: "Wait and monitor",
};

export function riskTone(level: RiskLevel): "positive" | "caution" | "critical" {
  if (level === "low") return "positive";
  if (level === "moderate") return "caution";
  return "critical";
}
