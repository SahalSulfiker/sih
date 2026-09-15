# FreightIQ — Voyage Decision Intelligence

AI-assisted freight forecasting and vessel chartering frontend for bulk cargo
imports into Indian East Coast ports. Built for the SIH hackathon team
(Person 4 — frontend).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts ·
Lucide React

## Running the project

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

The app ships fully functional on **mock data** — no backend is required to
demo it. Use the sample-scenario chips on the "New Analysis" screen, or fill
the form manually.

## Folder structure

```
src/
  api/
    analyze.ts          # The ONLY place that calls fetch(). USE_MOCK_DATA
                         # toggle lives here — components never fetch directly.
  types/
    analysis.ts          # Canonical API contract types (source of truth).
  data/
    mockAnalysis.ts       # Mock responses + demo scenarios, matches the
                         # contract exactly.
  lib/
    analysis-store.tsx   # Client-side store (React context + localStorage)
                         # holding analysis history and in-flight state.
    format.ts            # Currency/date/label formatting — no magic strings
                         # in components.
    cn.ts
  components/
    layout/              # NavBar, Container
    ui/                  # Button, Card, StatusPill, EmptyState, FormField
    dashboard/           # Overview metrics, recent analyses list
    form/                 # VoyageForm (the input form)
    analyzing/            # Multi-step "analyzing" loading state
    results/              # Everything on the results dashboard:
                         # ResultsHero, ExecutiveSummaryCard, ForecastChart,
                         # VesselRanking, PortComparison, CharterStrategy,
                         # RiskPanel, FinalDecision
  app/
    page.tsx              # Overview / dashboard
    analyze/page.tsx      # Input form -> analyzing state -> redirect to results
    results/page.tsx      # Results dashboard (reads ?id= or latest analysis)
    history/page.tsx      # All past analyses (this session)
    layout.tsx, globals.css
```

## Switching from mock data to the real API

Everything funnels through `analyzeVoyage()` in `src/api/analyze.ts`. To go
live:

1. Set environment variables (see below).
2. Set `NEXT_PUBLIC_USE_MOCK_DATA=false`.
3. No component changes are required — `VoyageForm`, the results dashboard,
   etc. all call `analyzeVoyage()` and know nothing about mocks vs. HTTP.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` | Set to `false` to call the real backend instead of mock data. |
| `NEXT_PUBLIC_API_BASE_URL` | `""` (same origin) | Base URL the frontend calls, e.g. `https://api.freightiq.example`. |

Copy `.env.example` to `.env.local` and adjust as needed.

## What the backend must provide (checklist for Person 3)

- [ ] `POST /api/analyze` — accepts the `AnalyzeRequest` shape in
      `src/types/analysis.ts` and returns `AnalysisResponse` **using the
      exact field names** already defined there (`forecast`,
      `vessel_recommendations`, `port_comparison`, `charter_strategy`,
      `risk`, `summary`) — this is the agreed contract; the frontend does
      not rename anything.
- [ ] Returns HTTP 4xx/5xx (not a 200 with an error payload) on failure —
      the frontend maps any non-OK response to a friendly "Unable to
      analyze this voyage" message.
- [ ] `forecast.forecast[]` always includes entries for `7`, `14`, and `30`
      days ahead, each with `predicted_rate`, `confidence_low`,
      `confidence_high`.
- [ ] `vessel_recommendations[]` and `port_comparison[]` are non-empty
      arrays; exactly one entry in each should have `recommended: true`
      (the frontend re-sorts and highlights based on that flag / cost, so
      order isn't relied upon).
- [ ] `risk.risk_factors` is a plain array of short strings (rendered
      verbatim as a bullet list).
- [ ] CORS enabled for the frontend's origin if the API is hosted
      separately from the Next.js app.

## Remaining integration work

- Wire real authentication/session handling if the product needs it
  (currently none — analyses are stored per-browser in `localStorage`).
- Replace the client-only history store with a persisted backend history
  endpoint if analyses need to survive across devices.
- Confirm final port list with the backend (`Paradip`, `Gangavaram`,
  `Haldia`, `Dhamra`, `Visakhapatnam` are wired in `src/lib/format.ts` /
  `src/types/analysis.ts` — add more there if the backend supports more).
