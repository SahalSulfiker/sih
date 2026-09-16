import os

import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from voyage_engine import port_ranking, vessel_scoring
from voyage_engine.data_loader import load_data as load_voyage_data

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Market data (Baltic Dry Index) — drives the forecast + charter-strategy
# timing logic. Unchanged from the original backend-engine implementation.
# ---------------------------------------------------------------------------
df = pd.read_csv(os.path.join(BASE_DIR, "data", "Baltic Dry Index Historical Data.csv"))
df["Date"] = pd.to_datetime(df["Date"], format="%m/%d/%Y")
df["Price"] = df["Price"].astype(str).str.replace(",", "").astype(float)
df = df.sort_values("Date").reset_index(drop=True)

# ---------------------------------------------------------------------------
# Voyage engine data (vessel types, ports, distances, freight rates) — this
# is the dataset + logic contributed on the shair-backend branch. It powers
# vessel matching/scoring and port ranking, which used to be flat estimates.
# ---------------------------------------------------------------------------
_voyage_data = load_voyage_data()
VESSELS = _voyage_data["vessels"]
ORIGINS = _voyage_data["origins"]
DESTINATIONS = _voyage_data["destinations"]
DISTANCES = _voyage_data["distances"]
FREIGHT = _voyage_data["freight"]

USD_TO_INR = 83.0  # approximate, used only to express voyage cost in Cr (INR crore) for the frontend contract

# ---------------------------------------------------------------------------
# Mapping between the frontend's AnalyzeRequest contract (src/types/analysis.ts)
# and the voyage_engine dataset's naming.
#
# AnalyzeRequest.origin is only "australia" | "other" (no specific port), so
# we pick one representative origin port per bucket. Adjust these if you want
# a different default origin.
# ---------------------------------------------------------------------------
ORIGIN_PORT_BY_REQUEST_ORIGIN = {
    "australia": "Gladstone",
    "other": "New Orleans",
}
ORIGIN_COUNTRY_BY_PORT = {
    "Gladstone": "Australia",
    "New Orleans": "USA",
}

# Haldia is deliberately left out: its 8.5m draft is too shallow for every
# vessel in the fleet dataset (smallest, Handysize, needs 11.5m) so it can
# never return a valid analysis. See backend-engine/README.md.
DESTINATION_PORT_MAP = {
    "paradip": "Paradip",
    "gangavaram": "Gangavaram",
    "dhamra": "Dhamra",
    "vizag": "Visakhapatnam",
    "gopalpur": "Gopalpur",
    "sagar_sandheads": "Sagar-Sandheads",
}
DESTINATION_PORT_MAP_REVERSE = {v: k for k, v in DESTINATION_PORT_MAP.items()}
CANDIDATE_DESTINATIONS = list(DESTINATION_PORT_MAP.values())


# ---------------------------------------------------------------------------
# Forecast (BDI-based) — unchanged model, extended with the fields the
# frontend contract requires that the original implementation was missing
# (unit, confidence_score, recommendation).
# ---------------------------------------------------------------------------
def build_forecast(latest_bdi_price, bdi_forecast):
    forecast_points = []
    for i, row in bdi_forecast.reset_index(drop=True).iterrows():
        predicted = float(row["Predicted_BDI"])
        forecast_points.append({
            "days_ahead": i + 1,
            "predicted_rate": round(predicted, 2),
            "confidence_low": round(predicted * 0.95, 2),
            "confidence_high": round(predicted * 1.05, 2),
        })

    last_predicted = bdi_forecast["Predicted_BDI"].iloc[-1]
    forecast_change_pct = abs((last_predicted - latest_bdi_price) / latest_bdi_price * 100)
    trend_direction = "decreasing" if last_predicted < latest_bdi_price else "increasing"
    confidence_score = round(max(50, 100 - forecast_change_pct * 2))
    recommendation = "wait_10_to_14_days" if trend_direction == "decreasing" else "book_now"

    forecast = {
        "current_rate": float(latest_bdi_price),
        "unit": "BDI points",
        "forecast": forecast_points,
        "trend": trend_direction,
        "confidence_score": confidence_score,
        "recommendation": recommendation,
    }
    return forecast, trend_direction, forecast_change_pct


# ---------------------------------------------------------------------------
# Vessel recommendations — powered by voyage_engine.vessel_scoring, which
# checks real draft/LOA/beam compatibility and scores on cost, capacity
# utilization, voyage time and port fit (replaces the old flat estimate).
# ---------------------------------------------------------------------------
def rank_vessels(quantity_mt, origin_port, origin_country, destination_port):
    request = {
        "request_id": "live-request",
        "origin_port": origin_port,
        "origin_country": origin_country,
        "destination_port": destination_port,
        "quantity_tonnes": quantity_mt,
    }
    return vessel_scoring.rank_vessels(request, VESSELS, ORIGINS, DESTINATIONS, DISTANCES, FREIGHT)


def to_vessel_recommendations(ranked_result):
    if not ranked_result.get("success"):
        return [], None
    entries = []
    for i, v in enumerate(ranked_result["ranked_vessels"]):
        entries.append({
            "vessel_type": v["vessel_type"].lower(),
            "score": round(v["final_score"]),
            "reason": (
                f"{v['capacity_utilization_percent']}% cargo utilization, "
                f"{v['voyage_days']} day voyage, port fit {round(v['port_fit_score'])}/100"
            ),
            "recommended": i == 0,
            "capacity_mt": float(v["dwt_max"]),
            "utilization_pct": v["capacity_utilization_percent"],
            "draft_compatible": True,
        })
    top_vessel_type = ranked_result["ranked_vessels"][0]["vessel_type"] if entries else None
    return entries, top_vessel_type


# ---------------------------------------------------------------------------
# Port comparison — powered by voyage_engine.port_ranking, which computes
# real distance/bunker/handling/waiting cost per candidate port instead of
# the old flat formula. Cost is converted from USD to Cr (INR crore) to
# match the contract's unit.
# ---------------------------------------------------------------------------
def compare_ports(vessel_type, cargo_quantity, origin_port):
    return port_ranking.rank_ports(
        vessel_type=vessel_type,
        cargo_quantity=cargo_quantity,
        origin_port=origin_port,
        candidate_ports=CANDIDATE_DESTINATIONS,
        vessels=VESSELS,
        destinations=DESTINATIONS,
        distances=DISTANCES,
        freight_rates=FREIGHT,
    )


def to_port_comparison(port_result):
    if not port_result.get("success") or not port_result["ranked_ports"]:
        return []
    entries = []
    for p in port_result["ranked_ports"]:
        total_cost_cr = round((p["total_cost_usd"] * USD_TO_INR) / 1e7, 2)
        waiting_hours = round(p["waiting_days"] * 24, 1)
        risk = "low" if waiting_hours < 48 else "moderate" if waiting_hours < 96 else "high"
        entries.append({
            "port": DESTINATION_PORT_MAP_REVERSE[p["port"]],
            "total_cost_cr": total_cost_cr,
            "waiting_hours": waiting_hours,
            "risk": risk,
            "recommended": p["rank"] == 1,
        })
    return entries


# ---------------------------------------------------------------------------
# Charter strategy — same spot/3-month/6-month MVC model as the original
# implementation, now based on the best port's real voyage cost instead of
# a flat BDI multiplier.
# ---------------------------------------------------------------------------
def build_charter_strategy(best_port_cost_cr, trend_direction):
    if trend_direction == "decreasing":
        mvc_3_multiplier, mvc_6_multiplier = 0.93, 0.90
    else:
        mvc_3_multiplier, mvc_6_multiplier = 0.97, 0.95

    costs = {
        "spot": best_port_cost_cr,
        "3_month_mvc": round(best_port_cost_cr * mvc_3_multiplier, 2),
        "6_month_mvc": round(best_port_cost_cr * mvc_6_multiplier, 2),
    }
    best_type = min(costs, key=costs.get)

    strategy = [
        {"type": t, "estimated_cost_cr": costs[t], "recommended": t == best_type}
        for t in ("spot", "3_month_mvc", "6_month_mvc")
    ]
    return strategy, costs, best_type


# ---------------------------------------------------------------------------
# Risk assessment — combines BDI volatility with the real port congestion
# figure now available from the port ranking result.
# ---------------------------------------------------------------------------
def build_risk(waiting_hours, forecast_change_pct):
    port_congestion_score = round(min(100, (waiting_hours / 96) * 100))
    congestion_level = "low" if port_congestion_score < 30 else "moderate" if port_congestion_score < 60 else "high"

    volatility_score = min(50, forecast_change_pct * 2)
    congestion_component = min(50, port_congestion_score / 2)
    risk_score = round(volatility_score + congestion_component)
    risk_level = "low" if risk_score < 30 else "moderate" if risk_score < 60 else "high"

    risk_factors = []
    if volatility_score > 20:
        risk_factors.append("Freight volatility elevated over the forecast period")
    if congestion_component > 20:
        risk_factors.append("Port congestion moderate to high, longer waiting expected")
    if not risk_factors:
        risk_factors.append("Market conditions currently stable")

    idle_time_predicted = waiting_hours > 72
    idle_time_suggestion = (
        "Consider alternative cargo on the return leg or repositioning to reduce deadheading losses"
        if idle_time_predicted else None
    )

    return {
        "port_congestion_score": port_congestion_score,
        "congestion_level": congestion_level,
        "expected_waiting_hours": waiting_hours,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "idle_time_predicted": bool(idle_time_predicted),
        "idle_time_suggestion": idle_time_suggestion,
    }


def clean_for_json(obj):
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj


def analyze_request(cargo_type, quantity_mt, origin, destination_port, required_date, contract_preference):
    if origin not in ORIGIN_PORT_BY_REQUEST_ORIGIN:
        raise HTTPException(status_code=400, detail=f"Unknown origin '{origin}'.")
    if destination_port not in DESTINATION_PORT_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown destination_port '{destination_port}'.")
    if not quantity_mt or quantity_mt <= 0:
        raise HTTPException(status_code=400, detail="quantity_mt must be greater than zero.")

    origin_port = ORIGIN_PORT_BY_REQUEST_ORIGIN[origin]
    origin_country = ORIGIN_COUNTRY_BY_PORT[origin_port]
    dest_port_name = DESTINATION_PORT_MAP[destination_port]

    latest_bdi_price = df["Price"].iloc[-1]
    bdi_forecast = pd.read_csv(os.path.join(BASE_DIR, "data", "bdi_7_day_forecast.csv"))
    forecast, trend_direction, forecast_change_pct = build_forecast(latest_bdi_price, bdi_forecast)

    vessel_ranking_result = rank_vessels(quantity_mt, origin_port, origin_country, dest_port_name)
    vessel_recommendations, top_vessel_type = to_vessel_recommendations(vessel_ranking_result)
    if not vessel_recommendations:
        raise HTTPException(
            status_code=422,
            detail=vessel_ranking_result.get("error", "No compatible vessels found for this request."),
        )

    port_result = compare_ports(top_vessel_type, quantity_mt, origin_port)
    port_comparison = to_port_comparison(port_result)
    if not port_comparison:
        raise HTTPException(
            status_code=422,
            detail=port_result.get("error", "No viable ports found for this request."),
        )

    best_port = next(p for p in port_comparison if p["recommended"])
    charter_strategy, contract_costs, best_contract_type = build_charter_strategy(
        best_port["total_cost_cr"], trend_direction
    )
    risk_result = build_risk(best_port["waiting_hours"], forecast_change_pct)

    savings = round(contract_costs["spot"] - contract_costs[best_contract_type], 2)
    summary = {
        "recommended_vessel": vessel_recommendations[0]["vessel_type"],
        "recommended_port": best_port["port"],
        "recommended_contract": best_contract_type,
        "market_entry_advice": forecast["recommendation"],
        "estimated_total_cost_cr": contract_costs[best_contract_type],
        "estimated_savings_cr": savings,
        "risk_score": risk_result["risk_score"],
    }

    response = {
        "forecast": forecast,
        "vessel_recommendations": vessel_recommendations,
        "port_comparison": port_comparison,
        "charter_strategy": charter_strategy,
        "risk": risk_result,
        "summary": summary,
    }
    return clean_for_json(response)


@app.post("/api/analyze")
def analyze(request: dict):
    return analyze_request(
        request["cargo_type"],
        request["quantity_mt"],
        request["origin"],
        request["destination_port"],
        request["required_date"],
        request["contract_preference"],
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
