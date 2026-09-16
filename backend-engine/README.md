# Backend Engine — Freight Forecasting & Vessel Chartering API

## Setup
1. `cd backend-engine`
2. `pip install -r requirements.txt`
3. Place these 4 files in the `data/` folder:
   - Baltic Dry Index Historical Data.csv
   - ports_infra.csv
   - vessel_fleet.csv
   - bdi_7_day_forecast.csv
4. Run: `python main.py`
5. API will be live at http://localhost:8000
6. Interactive test docs at http://localhost:8000/docs

## Main endpoint
POST /api/analyze

Example request body:
```json
{
  "cargo_type": "coal",
  "quantity_mt": 75000,
  "origin": "australia",
  "destination_port": "Paradip Garh",
  "required_date": "2026-10-15",
  "contract_preference": "open_to_mvc"
}
```
