# Faultline Frontend

React + Vite dashboard for the Faultline API (`faultline-backend/apps/api`).

## Running it

1. **Start the API** (from the backend repo):

   ```bash
   npm run start -w @faultline/api      # listens on http://127.0.0.1:3000
   ```

   It needs PostgreSQL and ClickHouse, per `faultline-backend/compose.infrastructure.yml`.

2. **Start the frontend**:

   ```bash
   cp .env.example .env      # first time only
   npm install
   npm run dev               # http://127.0.0.1:5173
   ```

3. Log in, then pick a cluster on **Deployments** — the rest of the workspace is scoped to it.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | What the browser calls. |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:3000` | Where the dev server forwards `/api`. |
| `VITE_API_TIMEOUT_MS` | `20000` | Per-request timeout. |
| `VITE_API_POLL_MS` | `15000` | Poll interval for live views. |

The API enables no CORS, so requests must be same-origin. In development Vite proxies
`/api/*` to the API and strips the prefix (see `vite.config.js`); in production serve this
app behind the same origin as the API, or set `VITE_API_BASE_URL` to an absolute URL
**only** if that deployment allows this origin.

## How the frontend talks to the API

All network code lives in `src/api/`:

- **`client.js`** — the fetch wrapper. Builds query strings the way the backend validators
  read them (arrays become comma-joined), applies the timeout, and normalises failures
  into `ApiError` with the status intact, because the API's statuses mean different
  things: `400` a rejected filter, `403` a cluster outside the configured query scope,
  `404` missing, `503` storage down, `0` the API unreachable.
- **`endpoints.js`** — one function per route, with parameter names mirroring the backend
  validators exactly (note the metrics endpoint takes `bucket`, not `bucketMs`).
- **`adapters.js`** — maps backend objects onto the shapes the components render, and
  mirrors `encodeTelemetryResourceId` so an incident's resource can be used directly in
  the `/resources/:id/timeline` and `/baselines/:id/:metric` routes.
- **`window.js`** — time windows. Every telemetry read must name a bounded window, and the
  ranges offered here stay inside the API's maxima (24h for logs and events, 7d for
  metrics) so a picker can't build a request the API will reject.

`src/hooks/useApiResource.js` does the fetching: a refresh never clears data already on
screen, and an in-flight request is aborted when its inputs change or the view unmounts.
`src/components/ui/AsyncState.jsx` renders loading, empty, and per-status error states.

### Page → endpoint map

| Page | Endpoints |
| --- | --- |
| Deployments | `GET /incidents` (cluster discovery), `/health/ready`, `/system/info` |
| Dashboard | `GET /incidents`, `/telemetry/metrics`, `/health/ready` |
| Incidents | `GET /incidents` with `cluster`/`namespace`/`status`/`severity`/`classification` |
| Incident detail | `GET /incidents/:id`, `/incidents/:id/evidence`, `/baselines` |
| Alerts | `GET /incidents` (unresolved only) |
| Runtime | `GET /telemetry/logs`, `/telemetry/kubernetes-events`, `/health/ready` |
| Ledger | `GET /incidents` (timeline entries, merged) |
| Reports | `GET /incidents` (analytics + JSON/CSV export) |

### What is still mock data

The API is read-only and has no endpoint for these, so they remain on `src/mocks/` and are
labelled in the UI where they appear: PR issuance (diff, CI checks, submission),
Integrations, Team & Roles, Subscription, Voice Agent, Settings, login/MFA, and the
code-quality / Slack / stored-report sections of Reports.

There is also no cluster registry in the API, so **Deployments** derives its cluster list
from the clusters that recorded incidents reference. A cluster with no incidents yet can be
opened by entering its ID in the "Open a cluster by ID" box.
