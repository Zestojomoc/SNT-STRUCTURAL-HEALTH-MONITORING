# Structural Health Monitoring Web Dashboard

A focused, responsive monitoring web app for current Raspberry Shake 4D structural vibration
data. It displays calibrated acceleration, dominant response frequency, baseline frequency
change, an estimated stiffness change, current monitoring status, and a bounded live waveform.

This repository intentionally contains no authentication, database, saved history, reporting,
Natural Frequency & Damping module, or Inter-Story Drift module.

## Technology stack

- Next.js, React, TypeScript, Tailwind CSS, Lucide icons, and Recharts
- FastAPI, NumPy, SciPy, and ObsPy
- One repository and one same-origin Vercel deployment

## Architecture

```text
Browser polling
  → GET /api/monitor
  → FastAPI serverless function
  → Raspberry Shake FDSN (or labeled demo generator)
  → response removal + signal processing + SHM analysis
  → typed JSON
  → responsive dashboard with bounded in-memory chart data
```

Each request is independent. Samples exist only inside the request and current browser state;
refreshing or closing the page discards the chart. There is no database or permanent sensor
storage.

## Important migration note

The supplied workspace was empty, so the previous Django project's station configuration,
baseline, site thresholds, and processing implementation were not available to validate or
reuse. Real mode therefore requires those site-specific values explicitly. The project never
silently applies demo baseline or threshold values to a real structure.

## Local setup

Requirements: Node.js 20.9+ and Python 3.11–3.13.

```bash
npm install
python -m venv .venv
```

Activate the virtual environment, then install Python dependencies:

```bash
pip install -e ".[test]"
```

Copy `.env.example` to `.env.local`. The default is labeled demo mode.

Start the complete local dashboard with one command:

```bash
npm run dev
```

This starts FastAPI on port 8000, waits for it to become healthy, then starts Next.js on port
3000 with a same-origin `/api/*` development proxy. Development chunks use `.next-dev`, while
production builds use `.next`, preventing cache collisions in OneDrive-synced folders.

To run the processes separately, use `npm run api:dev` and `npm run dev:web`, with
`SHM_LOCAL_API_URL=http://127.0.0.1:8000`. You can also use `vercel dev` for production-like
local routing. Production continues to use Vercel's native same-origin API routing.

## Environment variables

See [`.env.example`](.env.example). The key settings are:

| Variable | Purpose |
| --- | --- |
| `SHM_DEMO_MODE` | Uses clearly labeled synthetic data when `true` |
| `SHM_DEMO_FAIL` | Simulates sensor failure for UI/API testing |
| `SHM_STRUCTURE_NAME` | Display name for the monitored structure |
| `RASPBERRY_SHAKE_BASE_URL` | FDSN service base URL |
| `RASPBERRY_SHAKE_NETWORK` | FDSN network code |
| `RASPBERRY_SHAKE_STATION` | Required real station code |
| `RASPBERRY_SHAKE_LOCATION` | FDSN location code |
| `RASPBERRY_SHAKE_CHANNELS` | Comma-separated acceleration channels |
| `RASPBERRY_SHAKE_MODEL` | Sensor model displayed in the dashboard |
| `RASPBERRY_SHAKE_SITE` | General installation site label |
| `RASPBERRY_SHAKE_LATITUDE` / `RASPBERRY_SHAKE_LONGITUDE` | Published station coordinates used by the map |
| `RASPBERRY_SHAKE_DATA_DELAY_SECONDS` | Source delay used for the query window |
| `SHM_BASELINE_FREQUENCY_ENE_HZ` | East-West analytical reference frequency |
| `SHM_BASELINE_FREQUENCY_ENN_HZ` | North-South analytical reference frequency |
| `SHM_BASELINE_FREQUENCY_ENZ_HZ` | Optional vertical reference; currently unset |
| `SHM_THRESHOLDS_PROVISIONAL` | Marks threshold-based classifications as provisional screening results |
| `SHM_ATTENTION_FREQUENCY_CHANGE_PERCENT` | Provisional attention threshold: `10` percent |
| `SHM_WARNING_FREQUENCY_CHANGE_PERCENT` | Provisional warning threshold: `20` percent |
| `SHM_MODAL_TRACKING_WINDOW_PERCENT` | Search width around each configured modal reference (default `20`) |

Do not commit `.env` or `.env.local`.

## Demo mode

Set `SHM_DEMO_MODE=true`. The API generates three-axis, 100 Hz synthetic acceleration with a
slowly changing dominant frequency. Both the header and dashboard show **Demo Data / Simulation
Mode**, so it cannot be confused with a live sensor.

Set `SHM_DEMO_FAIL=true` to validate the initial error and last-known-reading behavior.

## Real Raspberry Shake mode

The configured sensor is Raspberry Shake 4D station `AM.RA909.00` in the Philippines. Its
official FDSN metadata exposes one 100 Hz velocity channel (`EHZ`) and three 100 Hz acceleration
channels (`ENE`, `ENN`, `ENZ`). This dashboard intentionally monitors the three acceleration
channels; `EHZ` is not mixed into acceleration calculations.

The dashboard includes a custom, theme-matched regional schematic. RA909 is plotted from the
coordinates published by the FDSN station service, with an animated location marker. The shared
[Raspberry Shake StationView](https://stationview.raspberryshake.org/#/?lat=15.01299&lon=120.44889&zoom=7.803&sta=RA909) remains the external reference for the station.

Set `SHM_DEMO_MODE=false` to acquire real RA909 readings. The confirmed bare-frame eigenvalue
analysis provides directional analytical references of 2.87078721 Hz for ENE/global Ux and
2.88420027 Hz for ENN/global Uy. It does not establish an ENZ vertical reference. Frequency and
stiffness changes are calculated per channel. Provisional screening thresholds are 10 percent
for attention and 20 percent for warning. Every resulting status is visibly marked **Provisional**
until the thresholds are replaced using measured healthy-state data and engineering review.
The service:

1. requests miniSEED waveform data from the configured FDSN endpoint;
2. requests the matching instrument response;
3. removes the response with ObsPy using `output="ACC"` (m/s²);
4. detrends and applies a zero-phase fourth-order Butterworth band-pass filter;
5. calculates acceleration and frequency metrics;
6. returns only the bounded current waveform and derived indicators.

The public Raspberry Shake FDSN archive is not a real-time stream and documents an approximately
30-minute delay. The default query delay is 35 minutes (`2100` seconds) to avoid requesting the
ingestion boundary. Set it to zero only for an endpoint that actually provides authorized
real-time data. The dashboard visibly reports the configured source delay.

## SHM calculations

Measured/processed indicators:

- peak and RMS calibrated acceleration in `g`;
- dominant frequency from a Welch power spectral density estimate within the configured band.

Derived/estimated indicators:

```text
frequency change (%) = ((current frequency - baseline frequency) / baseline frequency) × 100

estimated stiffness change (%) = ((current frequency / baseline frequency)² - 1) × 100
```

The stiffness estimate assumes effective modal mass is approximately constant. It is labeled as
an estimate throughout the UI. Status uses the absolute frequency-change magnitude and the two
explicitly configured thresholds; it never claims that a structure is damaged.

## API

- `GET /api/health` — service/configuration status
- `GET /api/config` — safe public dashboard configuration
- `GET /api/monitor?channel=ENZ` — current processed monitoring response
- `GET /api/docs` — FastAPI API documentation

Responses use ISO 8601 UTC timestamps and `Cache-Control: no-store`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:python
```

## Vercel deployment

1. Push the repository to GitHub.
2. Import it as one Vercel project.
3. Add the environment variables in Project Settings.
4. Deploy without a custom production API URL.

Vercel builds the Next.js app and packages `api/index.py` as the Python function. The frontend
always calls relative paths such as `fetch("/api/monitor")`; no production localhost dependency
exists.

## Folder structure

```text
app/                 Next.js routes and global styles
components/          Reusable dashboard UI
lib/                 TypeScript types, API client, constants, utilities
api/index.py         FastAPI routes and response schemas
api/services/        Sensor access, processing, SHM analysis, configuration
tests/               Backend formula, processing, endpoint, and failure tests
```
