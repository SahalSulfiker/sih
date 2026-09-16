# Backend Engine — Freight Forecasting & Vessel Chartering API

## Setup
1. `cd backend-engine`
2. `pip install -r requirements.txt`
3. `data/` already ships with the BDI history/forecast files. `voyage_engine/data/`
   ships with the vessel/port/distance/freight-rate datasets.
4. Run: `python main.py`
5. API will be live at http://localhost:8000
6. Interactive test docs at http://localhost:8000/docs

## Structure
- `main.py` — FastAPI app. Builds the forecast from the BDI data in `data/`,
  then calls into `voyage_engine/` for vessel scoring and port ranking, and
  shapes everything into the exact response contract in
  `../src/types/analysis.ts`.
- `voyage_engine/` — vessel matching (`vessel_matching.py`), vessel scoring
  (`vessel_scoring.py`), and port ranking (`port_ranking.py`), with their own
  dataset in `voyage_engine/data/`. Each module can still be run standalone
  (`python voyage_engine/vessel_scoring.py`) for a printed demo.

## Known data limitations
- `AnalyzeRequest.origin` is only `"australia"` or `"other"` — there's no
  specific-origin-port field in the frontend contract, so `main.py` maps
  each bucket to one representative origin port (`Gladstone` for Australia,
  `New Orleans` for other). Change `ORIGIN_PORT_BY_REQUEST_ORIGIN` in
  `main.py` if you want different defaults or to expose origin choice in the
  UI.
- `voyage_engine/data/destination_ports.csv` has some ports with very shallow
  draft (e.g. Haldia at 8.5m) that no vessel in `vessel_types.csv` can call
  at (smallest is Handysize at 11.5m draft). Requests to those ports
  correctly return `422` rather than a fabricated recommendation.
- Freight-rate history only covers Australia, Indonesia, Mozambique, Russia,
  and USA as origin countries.

## Main endpoint
POST /api/analyze

Example request body:
```json
{
  "cargo_type": "coal",
  "quantity_mt": 75000,
  "origin": "australia",
  "destination_port": "vizag",
  "required_date": "2026-10-15",
  "contract_preference": "open_to_mvc"
}
```
