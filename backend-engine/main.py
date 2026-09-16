import pandas as pd
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

df = pd.read_csv("data/Baltic Dry Index Historical Data.csv")
df["Date"] = pd.to_datetime(df["Date"], format="%m/%d/%Y")
df["Price"] = df["Price"].astype(str).str.replace(",", "").astype(float)
df = df.sort_values("Date").reset_index(drop=True)

port_infra = pd.read_csv("data/ports_infra.csv")
full_fleet = pd.read_csv("data/vessel_fleet.csv")


def rank_vessels(port_row, cargo_quantity, vessel_df):
    results = []
    for _, v in vessel_df.iterrows():
        fits_draft = v["draft_m"] <= port_row["max_draft_m"]
        fits_length = v["length"] <= port_row["max_loa_m"]
        fits_cargo = v["dwt"] >= cargo_quantity

        if fits_draft and fits_length and fits_cargo:
            utilization = cargo_quantity / v["dwt"]
            score = round(utilization * 100)
            reason = f"Fits port limits, {round(utilization*100)}% cargo utilization"
        else:
            score = 0
            reasons = []
            if not fits_draft: reasons.append("exceeds port draft limit")
            if not fits_length: reasons.append("exceeds port berth length")
            if not fits_cargo: reasons.append("too small for cargo quantity")
            reason = ", ".join(reasons)

        results.append({
            "vessel": v["Company_Name"],
            "type": v["ship_name"],
            "dwt": v["dwt"],
            "score": score,
            "reason": reason,
            "recommended": False
        })

    results_df = pd.DataFrame(results).sort_values("score", ascending=False).reset_index(drop=True)
    if len(results_df) > 0 and results_df.iloc[0]["score"] > 0:
        results_df.loc[0, "recommended"] = True
    return results_df.head(6)


def compare_ports(vessel_dwt, cargo_quantity, latest_bdi_price, ports_df):
    results = []
    freight_rate_per_mt = latest_bdi_price * 0.005
    for _, port in ports_df.iterrows():
        handling_cost_per_mt = 500 - (port["berths"] * 10)
        expected_wait_hours = max(0, 40 - (port["berths"] * 1.5))
        waiting_cost = expected_wait_hours * 5000
        freight_cost = freight_rate_per_mt * cargo_quantity
        total_cost = freight_cost + (handling_cost_per_mt * cargo_quantity) + waiting_cost
        results.append({
            "port": port["port_name"],
            "total_cost_cr": round(total_cost / 1e7, 2),
            "waiting_hours": round(expected_wait_hours, 1),
            "risk": "low" if expected_wait_hours < 20 else "moderate",
            "recommended": False
        })
    results_df = pd.DataFrame(results).sort_values("total_cost_cr").reset_index(drop=True)
    results_df.loc[0, "recommended"] = True
    return results_df


def compare_charter_strategy(cargo_quantity, latest_bdi_price, forecast_df):
    forecast_trend = forecast_df["Predicted_BDI"].iloc[-1] - forecast_df["Predicted_BDI"].iloc[0]
    trend_direction = "decreasing" if forecast_trend < 0 else "increasing"

    spot_rate = latest_bdi_price * 0.005
    spot_cost = spot_rate * cargo_quantity

    if trend_direction == "decreasing":
        mvc_3_rate = spot_rate * 0.93
        mvc_6_rate = spot_rate * 0.90
    else:
        mvc_3_rate = spot_rate * 0.97
        mvc_6_rate = spot_rate * 0.95

    mvc_3_cost = mvc_3_rate * cargo_quantity
    mvc_6_cost = mvc_6_rate * cargo_quantity

    results = pd.DataFrame({
        "type": ["spot", "3_month_mvc", "6_month_mvc"],
        "estimated_cost_cr": [round(spot_cost/1e7, 2), round(mvc_3_cost/1e7, 2), round(mvc_6_cost/1e7, 2)],
        "recommended": [False, False, False]
    })
    best_idx = results["estimated_cost_cr"].idxmin()
    results.loc[best_idx, "recommended"] = True
    return results, trend_direction


def calculate_risk_and_idle(port_row, waiting_hours, bdi_forecast, latest_bdi_price):
    forecast_change_pct = abs((bdi_forecast["Predicted_BDI"].iloc[-1] - latest_bdi_price) / latest_bdi_price * 100)
    volatility_score = min(50, forecast_change_pct * 2)
    congestion_score = min(50, waiting_hours * 1.2)

    risk_score = round(volatility_score + congestion_score)
    risk_level = "low" if risk_score < 30 else "moderate" if risk_score < 60 else "high"

    risk_factors = []
    if volatility_score > 20:
        risk_factors.append("Freight volatility elevated over forecast period")
    if congestion_score > 20:
        risk_factors.append("Port congestion moderate to high, longer waiting expected")
    if not risk_factors:
        risk_factors.append("Market conditions currently stable")

    idle_time_predicted = waiting_hours > 25
    idle_time_suggestion = (
        "Consider alternative cargo on return leg or repositioning to reduce deadheading losses"
        if idle_time_predicted else None
    )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "idle_time_predicted": bool(idle_time_predicted),
        "idle_time_suggestion": idle_time_suggestion
    }


def build_final_summary(port_comparison, ranking, charter_strategy, risk_result, bdi_forecast, latest_bdi_price):
    best_port = port_comparison.iloc[0]
    best_vessel = ranking.iloc[0]

    trend = "decreasing" if bdi_forecast["Predicted_BDI"].iloc[-1] < latest_bdi_price else "increasing"
    cost_multiplier = {"spot": 1.0, "3_month_mvc": 0.93, "6_month_mvc": 0.90} if trend == "decreasing" \
        else {"spot": 1.0, "3_month_mvc": 0.97, "6_month_mvc": 0.95}

    contract_costs = {k: round(best_port["total_cost_cr"] * v, 2) for k, v in cost_multiplier.items()}
    best_contract_type = min(contract_costs, key=contract_costs.get)

    market_entry_advice = "wait_7_to_14_days" if trend == "decreasing" else "book_now"
    savings = round(contract_costs["spot"] - contract_costs[best_contract_type], 2)

    summary = {
        "recommended_vessel": best_vessel["vessel"],
        "recommended_port": best_port["port"],
        "recommended_contract": best_contract_type,
        "market_entry_advice": market_entry_advice,
        "estimated_total_cost_cr": contract_costs[best_contract_type],
        "estimated_savings_cr": savings,
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"]
    }
    return summary, contract_costs


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
    latest_bdi_price = df["Price"].iloc[-1]
    bdi_forecast = pd.read_csv("data/bdi_7_day_forecast.csv")

    port_row = port_infra[port_infra["port_name"] == destination_port].iloc[0]
    ranking = rank_vessels(port_row, quantity_mt, full_fleet)

    port_comparison = compare_ports(quantity_mt, quantity_mt, latest_bdi_price, port_infra)

    charter_strategy, trend = compare_charter_strategy(quantity_mt, latest_bdi_price, bdi_forecast)

    best_port_row_for_risk = port_comparison.iloc[0]
    port_infra_row = port_infra[port_infra["port_name"] == best_port_row_for_risk["port"]].iloc[0]
    risk_result = calculate_risk_and_idle(port_infra_row, best_port_row_for_risk["waiting_hours"], bdi_forecast, latest_bdi_price)

    final_summary, reconciled_costs = build_final_summary(port_comparison, ranking, charter_strategy, risk_result, bdi_forecast, latest_bdi_price)

    forecast_output = {
        "current_rate": float(latest_bdi_price),
        "forecast": bdi_forecast.to_dict(orient="records"),
        "trend": trend
    }

    response = {
        "input": {
            "cargo_type": cargo_type,
            "quantity_mt": quantity_mt,
            "origin": origin,
            "destination_port": destination_port,
            "required_date": required_date,
            "contract_preference": contract_preference
        },
        "forecast": forecast_output,
        "vessel_recommendations": ranking.to_dict(orient="records"),
        "port_comparison": port_comparison.to_dict(orient="records"),
        "charter_strategy": charter_strategy.to_dict(orient="records"),
        "risk": risk_result,
        "summary": final_summary
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
        request["contract_preference"]
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
