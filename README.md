# Cadence + MyChart Demo (React + Node, Mock FHIR, KDiff/Kuiper Simulation)

A sharable, outside-work **example** project that demonstrates:
- **Cadence-style scheduling**: provider templates → slot expansion → appointment booking
- **MyChart self-scheduling UX**: decision-tree wizard → visit type selection → slot finder
- **Order-based scheduling** via mock FHIR (`ServiceRequest`, `Slot`, `Appointment`)
- **Strings Manager + KDiff** simulation: i18n JSON, diff tool, and PR-like report
- **Kuiper-like promotion** simulation: declarative manifest → dev→test→prod promotion script

> **No Epic IP** is used. This is a greenfield demonstration that mirrors common concepts using open data structures.

## Quick Start

### 1) Server (API + Mock FHIR)
```bash
cd server
npm install
npm run dev   # starts on http://localhost:4000
```

### 2) Client (React)
```bash
cd client
npm install
npm run dev   # starts on http://localhost:5173
```

The React app expects the API on `http://localhost:4000` by default.

## Highlights

- `server/data/*.json` — departments, providers, visit types, templates, decision tree
- `server/src/slotEngine.js` — expands templates into 15-min slots and enforces basic rules
- `server/src/mockFhir.js` — minimal FHIR-like endpoints for `Slot`, `Appointment`, `ServiceRequest`
- `client/src/features/*` — Symptom Wizard, Slot Finder, and Checkout
- `tools/strings/*` — i18n string packs and a **KDiff-like** diff report generator
- `tools/promotion/*` — **Kuiper-like** promotion simulation (manifest-driven copy)

## Scripts

### Strings diff (KDiff simulation)
```bash
node tools/strings/diff.js --from tools/strings/dev/en.json --to tools/strings/test/en.json
```

### Promotion (Kuiper simulation)
```bash
node tools/promotion/promote.js --env dev --to test
node tools/promotion/promote.js --env test --to prod
```

## Disclaimer

This is an **educational** sample that mirrors high-level workflows. It does not connect to Epic
and avoids any proprietary content. Suitable for GitHub portfolios.
