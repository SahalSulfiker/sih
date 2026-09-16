import pandas as pd
from vessel_matching import find_compatible_vessels


FUEL_CONSUMPTION = {
    "Handysize": 24.75,
    "Supramax": 33.0,
    "Panamax": 41.25,
    "Capesize": 57.75
}


def normalize_inverse(value, minimum, maximum):
    if maximum == minimum:
        return 100
    return ((maximum - value) / (maximum - minimum)) * 100


def calculate_vessel_score(
    vessel,
    origin_port,
    destination_port,
    cargo_quantity,
    distance_nm,
    freight_rate,
    bunker_price,
    congestion_index
):
    utilization = (cargo_quantity / vessel["dwt_max"]) * 100
    voyage_days = distance_nm / vessel["typical_speed_knots"] / 24

    freight_cost = cargo_quantity * freight_rate

    fuel_consumption = FUEL_CONSUMPTION[vessel["vessel_type"]]
    fuel_used = voyage_days * fuel_consumption
    bunker_cost = fuel_used * bunker_price

    total_voyage_cost = freight_cost + bunker_cost

    waiting_days = congestion_index * 2

    draft_margin = (
        destination_port["max_draft_m"] - vessel["max_draft_m"]
    )

    loa_margin = (
        destination_port["max_loa_m"] - vessel["max_loa_m"]
    )

    beam_margin = (
        destination_port["max_beam_m"] - vessel["max_beam_m"]
    )

    port_fit_score = (
        min(draft_margin / destination_port["max_draft_m"], 1) * 40
        + min(loa_margin / destination_port["max_loa_m"], 1) * 30
        + min(beam_margin / destination_port["max_beam_m"], 1) * 30
    )

    return {
        "vessel_type": vessel["vessel_type"],
        "dwt_max": vessel["dwt_max"],
        "capacity_utilization_percent": round(utilization, 2),
        "voyage_days": round(voyage_days, 2),
        "freight_rate_usd_per_tonne": round(freight_rate, 2),
        "estimated_freight_cost_usd": round(freight_cost, 2),
        "fuel_consumption_mt_per_day": fuel_consumption,
        "fuel_used_mt": round(fuel_used, 2),
        "bunker_price_usd_per_mt": round(bunker_price, 2),
        "estimated_bunker_cost_usd": round(bunker_cost, 2),
        "total_voyage_cost_usd": round(total_voyage_cost, 2),
        "waiting_days_estimate": round(waiting_days, 2),
        "port_fit_score": round(port_fit_score, 2)
    }


def rank_vessels(request, vessels, origins, destinations, distances, freight):
    matching_result = find_compatible_vessels(
        request,
        vessels,
        origins,
        destinations
    )

    if not matching_result["success"]:
        return matching_result

    origin_port = origins[
        origins["port"] == request["origin_port"]
    ].iloc[0]

    destination_port = destinations[
        destinations["port"] == request["destination_port"]
    ].iloc[0]

    distance_match = distances[
        (distances["origin_port"] == request["origin_port"])
        & (distances["destination_port"] == request["destination_port"])
    ]

    if distance_match.empty:
        return {
            "success": False,
            "error": "Distance between selected ports not found.",
            "vessels": []
        }

    distance_nm = distance_match.iloc[0]["distance_nm"]

    freight_match = freight[
        (freight["vessel_type"].isin(
            [v["vessel_type"] for v in matching_result["vessels"]]
        ))
        & (freight["origin_country"] == request["origin_country"])
    ].copy()

    if freight_match.empty:
        return {
            "success": False,
            "error": "Freight data not found for this route.",
            "vessels": []
        }

    freight_match["date"] = pd.to_datetime(freight_match["date"])

    latest_freight = (
        freight_match
        .sort_values("date")
        .groupby("vessel_type")
        .tail(1)
    )

    ranked_vessels = []

    for vessel_result in matching_result["vessels"]:
        vessel = vessels[
            vessels["vessel_type"] == vessel_result["vessel_type"]
        ].iloc[0]

        rate_row = latest_freight[
            latest_freight["vessel_type"] == vessel["vessel_type"]
        ]

        if rate_row.empty:
            continue

        rate_row = rate_row.iloc[0]

        result = calculate_vessel_score(
            vessel,
            origin_port,
            destination_port,
            request["quantity_tonnes"],
            distance_nm,
            rate_row["freight_rate_usd_per_tonne"],
            rate_row["bunker_price_usd_per_tonne_ifo380"],
            rate_row["port_congestion_index"]
        )

        ranked_vessels.append(result)

    if not ranked_vessels:
        return {
            "success": False,
            "error": "No freight rates available for compatible vessels.",
            "vessels": []
        }

    costs = [
        v["total_voyage_cost_usd"]
        for v in ranked_vessels
    ]

    voyage_times = [
        v["voyage_days"]
        for v in ranked_vessels
    ]

    for vessel in ranked_vessels:
        capacity_score = vessel["capacity_utilization_percent"]

        cost_score = normalize_inverse(
            vessel["total_voyage_cost_usd"],
            min(costs),
            max(costs)
        )

        time_score = normalize_inverse(
            vessel["voyage_days"],
            min(voyage_times),
            max(voyage_times)
        )

        port_score = vessel["port_fit_score"]

        final_score = (
            0.30 * capacity_score
            + 0.30 * cost_score
            + 0.20 * time_score
            + 0.20 * port_score
        )

        vessel["capacity_score"] = round(capacity_score, 2)
        vessel["cost_score"] = round(cost_score, 2)
        vessel["time_score"] = round(time_score, 2)
        vessel["final_score"] = round(final_score, 2)

    ranked_vessels.sort(
        key=lambda x: x["final_score"],
        reverse=True
    )

    return {
        "success": True,
        "request_id": request["request_id"],
        "origin_port": request["origin_port"],
        "destination_port": request["destination_port"],
        "cargo_quantity_tonnes": request["quantity_tonnes"],
        "distance_nm": distance_nm,
        "ranked_vessels": ranked_vessels
    }


if __name__ == "__main__":
    vessels = pd.read_csv("Data/vessel_types.csv")
    origins = pd.read_csv("Data/origin_ports.csv")
    destinations = pd.read_csv("Data/destination_ports.csv")
    distances = pd.read_csv("Data/distance_matrix.csv")
    freight = pd.read_csv("Data/historical_freight_rates.csv")
    requests = pd.read_csv("Data/sample_cargo_requests.csv")

    request = requests.iloc[0]

    result = rank_vessels(
        request,
        vessels,
        origins,
        destinations,
        distances,
        freight
    )

    print("\n========================================")
    print("VESSEL OPTIMIZATION")
    print("========================================")

    print(f"Request: {result['request_id']}")
    print(f"Route: {result['origin_port']} -> {result['destination_port']}")
    print(f"Cargo: {result['cargo_quantity_tonnes']} tonnes")
    print(f"Distance: {result['distance_nm']} nautical miles")

    print("\nRanked vessels:")

    for i, vessel in enumerate(result["ranked_vessels"], 1):
        print(
            f"{i}. {vessel['vessel_type']} | "
            f"Score: {vessel['final_score']} | "
            f"Freight: ${vessel['estimated_freight_cost_usd']:,.0f} | "
            f"Bunker: ${vessel['estimated_bunker_cost_usd']:,.0f} | "
            f"Total: ${vessel['total_voyage_cost_usd']:,.0f}"
        )