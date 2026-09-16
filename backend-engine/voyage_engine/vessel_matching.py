import os

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


def check_vessel_compatibility(
    vessel,
    origin_port,
    destination_port,
    cargo_quantity
):
    """
    Check whether a vessel type is physically compatible
    with a cargo request and the selected ports.
    """

   
    capacity_ok = vessel["dwt_max"] >= cargo_quantity

    
    origin_draft_ok = (
        vessel["max_draft_m"] <= origin_port["max_draft_m"]
    )

    
    destination_draft_ok = (
        vessel["max_draft_m"] <= destination_port["max_draft_m"]
    )

    
    loa_ok = (
        vessel["max_loa_m"] <= destination_port["max_loa_m"]
    )

    beam_ok = (
        vessel["max_beam_m"] <= destination_port["max_beam_m"]
    )

    
    compatible = all([
        capacity_ok,
        origin_draft_ok,
        destination_draft_ok,
        loa_ok,
        beam_ok
    ])

    return {
        "vessel_type": vessel["vessel_type"],
        "cargo_capacity_ok": capacity_ok,
        "origin_draft_ok": origin_draft_ok,
        "destination_draft_ok": destination_draft_ok,
        "loa_ok": loa_ok,
        "beam_ok": beam_ok,
        "compatible": compatible
    }


def find_compatible_vessels(
    request,
    vessels,
    origins,
    destinations
):
    """
    Find all vessel types that can handle a cargo request.
    """

    origin_matches = origins[
        origins["port"] == request["origin_port"]
    ]

    
    destination_matches = destinations[
        destinations["port"] == request["destination_port"]
    ]

   
    if origin_matches.empty:
        return {
            "success": False,
            "error": f"Origin port '{request['origin_port']}' not found.",
            "vessels": []
        }

    if destination_matches.empty:
        return {
            "success": False,
            "error": f"Destination port '{request['destination_port']}' not found.",
            "vessels": []
        }

    origin_port = origin_matches.iloc[0]
    destination_port = destination_matches.iloc[0]

    compatible_vessels = []


    for _, vessel in vessels.iterrows():

        result = check_vessel_compatibility(
            vessel,
            origin_port,
            destination_port,
            request["quantity_tonnes"]
        )

        if result["compatible"]:
            compatible_vessels.append(result)

    return {
        "success": True,
        "request_id": request["request_id"],
        "origin_port": request["origin_port"],
        "destination_port": request["destination_port"],
        "cargo_quantity_tonnes": request["quantity_tonnes"],
        "vessels": compatible_vessels
    }




if __name__ == "__main__":

   
    vessels = pd.read_csv(os.path.join(DATA_DIR, "vessel_types.csv"))
    origins = pd.read_csv(os.path.join(DATA_DIR, "origin_ports.csv"))
    destinations = pd.read_csv(os.path.join(DATA_DIR, "destination_ports.csv"))
    requests = pd.read_csv(os.path.join(DATA_DIR, "sample_cargo_requests.csv"))

    request = requests.iloc[0]

    result = find_compatible_vessels(
        request,
        vessels,
        origins,
        destinations
    )

    print("\n========================================")
    print("VESSEL MATCHING ENGINE")
    print("========================================")

    print(f"Request ID: {result['request_id']}")
    print(f"Cargo: {result['cargo_quantity_tonnes']} tonnes")
    print(f"Origin: {result['origin_port']}")
    print(f"Destination: {result['destination_port']}")

    print("\nCompatible vessels:")

    if result["vessels"]:

        for vessel in result["vessels"]:
            print(
                f"  ✓ {vessel['vessel_type']}"
            )

    else:
        print("  No compatible vessels found.")