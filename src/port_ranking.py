import pandas as pd

FUEL_CONSUMPTION = {
    "Handysize": 24.75,
    "Supramax": 33.0,
    "Panamax": 41.25,
    "Capesize": 57.75
}

PORT_COST_PER_TONNE = 1.50
DAILY_WAITING_COST = 15000


def rank_ports(
    vessel_type,
    cargo_quantity,
    origin_port,
    candidate_ports,
    vessels,
    destinations,
    distances,
    freight_rates
):
    vessel = vessels[
        vessels["vessel_type"] == vessel_type
    ]

    if vessel.empty:
        return {"success": False, "error": "Vessel type not found."}

    vessel = vessel.iloc[0]

    results = []

    for port_name in candidate_ports:

        port = destinations[
            destinations["port"] == port_name
        ]

        if port.empty:
            continue

        port = port.iloc[0]

        draft_ok = vessel["max_draft_m"] <= port["max_draft_m"]
        loa_ok = vessel["max_loa_m"] <= port["max_loa_m"]
        beam_ok = vessel["max_beam_m"] <= port["max_beam_m"]

        if not (draft_ok and loa_ok and beam_ok):
            continue

        distance = distances[
            (distances["origin_port"] == origin_port)
            & (distances["destination_port"] == port_name)
        ]

        if distance.empty:
            continue

        distance_nm = distance.iloc[0]["distance_nm"]

        freight = freight_rates[
            freight_rates["vessel_type"] == vessel_type
        ].copy()

        if freight.empty:
            continue

        freight["date"] = pd.to_datetime(freight["date"])
        freight = freight.sort_values("date").iloc[-1]

        freight_rate = freight["freight_rate_usd_per_tonne"]
        bunker_price = freight["bunker_price_usd_per_tonne_ifo380"]
        congestion = freight["port_congestion_index"]

        voyage_days = distance_nm / vessel["typical_speed_knots"] / 24

        freight_cost = cargo_quantity * freight_rate

        fuel_used = voyage_days * FUEL_CONSUMPTION[vessel_type]
        bunker_cost = fuel_used * bunker_price

        handling_days = (
            cargo_quantity / port["cargo_handling_rate_tpd"]
        )

        waiting_days = congestion * 2

        port_cost = cargo_quantity * PORT_COST_PER_TONNE

        waiting_cost = waiting_days * DAILY_WAITING_COST

        total_cost = (
            freight_cost
            + bunker_cost
            + port_cost
            + waiting_cost
        )

        results.append({
            "port": port_name,
            "distance_nm": round(distance_nm, 2),
            "voyage_days": round(voyage_days, 2),
            "freight_cost_usd": round(freight_cost, 2),
            "bunker_cost_usd": round(bunker_cost, 2),
            "handling_days": round(handling_days, 2),
            "waiting_days": round(waiting_days, 2),
            "port_cost_usd": round(port_cost, 2),
            "waiting_cost_usd": round(waiting_cost, 2),
            "total_cost_usd": round(total_cost, 2)
        })

    results.sort(key=lambda x: x["total_cost_usd"])

    for i, result in enumerate(results, 1):
        result["rank"] = i

    return {
        "success": True,
        "vessel_type": vessel_type,
        "cargo_quantity_tonnes": cargo_quantity,
        "origin_port": origin_port,
        "ranked_ports": results
    }


if __name__ == "__main__":
    vessels = pd.read_csv("Data/vessel_types.csv")
    destinations = pd.read_csv("Data/destination_ports.csv")
    distances = pd.read_csv("Data/distance_matrix.csv")
    freight_rates = pd.read_csv("Data/historical_freight_rates.csv")

    result = rank_ports(
        vessel_type="Supramax",
        cargo_quantity=55000,
        origin_port="Gladstone",
        candidate_ports=[
            "Paradip",
            "Visakhapatnam",
            "Gangavaram",
            "Gopalpur",
            "Dhamra"
        ],
        vessels=vessels,
        destinations=destinations,
        distances=distances,
        freight_rates=freight_rates
    )

    print("\n========================================")
    print("PORT RANKING")
    print("========================================")

    for port in result["ranked_ports"]:
        print(
            f"{port['rank']}. {port['port']} | "
            f"Total Cost: ${port['total_cost_usd']:,.0f} | "
            f"Distance: {port['distance_nm']:,.0f} nm | "
            f"Waiting: {port['waiting_days']:.2f} days"
        )
        