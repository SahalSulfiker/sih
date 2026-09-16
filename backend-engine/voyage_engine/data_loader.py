import os

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


def load_data():
    vessels = pd.read_csv(os.path.join(DATA_DIR, "vessel_types.csv"))
    origins = pd.read_csv(os.path.join(DATA_DIR, "origin_ports.csv"))
    destinations = pd.read_csv(os.path.join(DATA_DIR, "destination_ports.csv"))
    distances = pd.read_csv(os.path.join(DATA_DIR, "distance_matrix.csv"))
    freight = pd.read_csv(os.path.join(DATA_DIR, "historical_freight_rates.csv"))
    coal = pd.read_csv(os.path.join(DATA_DIR, "coal_price_index.csv"))
    requests = pd.read_csv(os.path.join(DATA_DIR, "sample_cargo_requests.csv"))

    return {
        "vessels": vessels,
        "origins": origins,
        "destinations": destinations,
        "distances": distances,
        "freight": freight,
        "coal": coal,
        "requests": requests
    }


if __name__ == "__main__":
    data = load_data()

    for name, df in data.items():
        print("\n" + "=" * 50)
        print(name.upper())
        print("=" * 50)

        print("\nFirst 5 rows:")
        print(df.head())

        print("\nColumns:")
        print(list(df.columns))

        print("\nShape:")
        print(df.shape)