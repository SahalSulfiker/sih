import pandas as pd


def load_data():
    vessels = pd.read_csv("Data/vessel_types.csv")
    origins = pd.read_csv("Data/origin_ports.csv")
    destinations = pd.read_csv("Data/destination_ports.csv")
    distances = pd.read_csv("Data/distance_matrix.csv")
    freight = pd.read_csv("Data/historical_freight_rates.csv")
    coal = pd.read_csv("Data/coal_price_index.csv")
    requests = pd.read_csv("Data/sample_cargo_requests.csv")

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