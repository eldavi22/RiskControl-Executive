# RiskControl Executive

RiskControl Executive is a Node.js and Express project I built to work with economic indicators and make them easier to track. The API lets you retrieve records, add new ones, and update existing entries without creating duplicates for the same date. It's a practical foundation for exploring business intelligence and risk monitoring.

Right now, the published version uses a local JSON file for storage. It has two endpoints:

- `GET /api/indicators` returns the saved indicators.
- `POST /api/indicators` adds an indicator or updates the record for an existing date.

The API checks dates and numeric inputs before saving them. It also handles invalid requests and storage errors with appropriate HTTP responses. Writes use a temporary file before replacing the stored data to reduce the risk of leaving a partial file.

## Getting started

You'll need Node.js 22 or newer. Clone the repository and run:

```bash
npm ci
npm start
```

The server starts on port 4000 unless you set a different `PORT`.

Here's an example request using sample values:

```bash
curl -X POST http://localhost:4000/api/indicators \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-10-30","inflacion":2.5,"pbi":1000,"tipoCambioOficial":1200}'
```

The field names follow the original indicator data: inflation (`inflacion`), GDP (`pbi`), and the official exchange rate (`tipoCambioOficial`).

## Testing

I added automated tests for the API, including successful reads and writes, updates by date, invalid inputs, malformed JSON, and corrupted data files.

```bash
npm run lint
npm test
```

GitHub Actions runs the same checks whenever changes are pushed or a pull request is opened.

## About the project

This repository contains the Express API and example data. Some of my earlier development notes discuss a broader dashboard and other technologies, but that additional source code isn't included here. The current API doesn't have authentication or multi-process write coordination, so it should be treated as a development project rather than a service ready to expose directly to the internet.

I maintain this repository under [eldavi22](https://github.com/eldavi22). The code is available under the MIT license; see [LICENSE](LICENSE).
