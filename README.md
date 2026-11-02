# RiskControl Executive — Indicators API

Node.js/Express API for recording macroeconomic indicators and supporting business intelligence and risk monitoring.

## Implemented in this repository

- `GET /api/indicators`: returns JSON records from `data.json` (or an empty list when no file exists).
- `POST /api/indicators`: creates or replaces an indicator for a valid calendar date (`YYYY-MM-DD`).
- Requires numeric `inflacion`, `pbi`, and positive `tipoCambioOficial` fields; invalid input returns HTTP 400.
- Data is written to a temporary file and renamed to reduce incomplete writes in a local single-process use case.
- Storage failures return controlled HTTP 500 responses.
- Optional static assets in `public/` are served if present; **no frontend source is currently committed**.

Earlier development notes referred to React, Prisma, PostgreSQL and Python, but those components are **not included as executable source in this repository**. Their absence does not establish what other project copies may contain.

## Run

Requires Node.js 22 or later.

```bash
npm ci
npm start
```

The API listens on port 4000 by default (configurable with `PORT`). Current storage is JSON, not a deployed SQL database.

Example with synthetic values:

```bash
curl -X POST http://localhost:4000/api/indicators -H 'Content-Type: application/json' -d '{"date":"2026-10-30","inflacion":2.5,"pbi":1000,"tipoCambioOficial":1200}'
```

## Quality checks

```bash
npm run lint
npm test
```

Tests check GET/POST, data persistence, updates by date, invalid dates and financial fields, malformed JSON and corrupted storage. A GitHub Actions workflow runs checks on push and pull requests.

## Data and security

The `data.json` file contains example/historical data; source provenance should be validated before reuse. Local `.env` and database artifacts are removed from the current development branch and excluded for future changes via `.gitignore`. Prior commits remain in Git history; rotate any actual exposed credentials. The code uses file persistence and has **no authentication**, so it is not intended to be exposed directly to the public internet without additional hardening.

## Authorship and license

Repository maintained under `eldavi22` by David Giacone. Git history retains original commit attribution. Licensed under MIT; see `LICENSE`.
