# Zero-Cloud Career Fair

An offline-first platform for career fairs. Company profiles and job listings are distributed from a **local server over the venue's Wi-Fi** and stored **on each visitor's device**, so attendees don't repeatedly download the same data from the cloud and can keep browsing without an Internet connection.

The app also measures itself: it compares a traditional cloud-style approach with the Zero-Cloud approach under the same user scenario (requests, data transferred, access time, offline availability and estimated CO₂e).

## Features

- Company list with search, company profiles and job offers
- One QR code per company booth (`/qr`), opening the company profile directly
- Offline-first PWA: Service Worker for the app shell, IndexedDB for the data
- Incremental sync: only companies that changed are downloaded again
- Metrics dashboard (`/dashboard`) with a Traditional vs. Zero-Cloud comparison and a one-click benchmark
- Carbon estimate with [CO2.js](https://developers.thegreenwebfoundation.org/co2js/overview/) (Sustainable Web Design model v4)
- Dependency-free Node.js local server with optional HTTPS

## Tech stack

Vite · React · TypeScript · Tailwind CSS · vite-plugin-pwa · IndexedDB (`idb`) · qrcode.react · CO2.js (`@tgwf/co2`) · Node.js

## Getting started

```bash
pnpm install
pnpm dev          # development server → http://localhost:5173
```

## Running the local server (at the fair)

```bash
pnpm serve        # build + start the Node server: app + API on https://<your-ip>:3000
pnpm start        # start without rebuilding
```

`server/index.js` has no dependencies. It serves `dist/`, the API from `server/api.js`, and uses HTTPS when `certs/` exists. Every `/api/*` request is logged in the terminal, which makes it easy to show during the demo that Zero-Cloud stops requesting data. Use another port with `PORT=8080 pnpm start`. Stop the server with Ctrl+C.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server with the local API (no Service Worker) |
| `pnpm build` | Type-check and build the PWA into `dist/` |
| `pnpm offline` | Build and run `vite preview` on port 4173 (Service Worker enabled) |
| `pnpm serve` | Build and run the standalone Node server on port 3000 |
| `pnpm start` | Run the Node server using the existing `dist/` |
| `pnpm cert` | Create an HTTPS certificate for your local IP with mkcert |

## Project structure

```
server/
  data/companies.json     Dataset: version + companies + jobs
  api.js                  API handler (used by Vite and by the Node server)
  index.js                Standalone local server (static files + API, HTTP/HTTPS)
scripts/cert.mjs          mkcert helper for local HTTPS
src/
  components/             CompanyCard, JobCard, QRCode
  pages/                  Home, CompanyDetail, QrCodes, Dashboard
  services/
    api.ts                Single data access point for the pages
    database.ts           IndexedDB storage
    sync.ts               Full / incremental synchronization
    http.ts               fetch wrapper that records real bytes and timings
    metrics.ts            Per-mode metrics (persisted in localStorage)
    settings.ts           Traditional / Zero-Cloud mode switch
    benchmark.ts          Reproducible scenario used by the dashboard and Green Metrics Tool
    carbon.ts             CO₂e estimate with CO2.js
  types/                  Shared types
Dockerfile                Container image of the local server
usage_scenario.yml        Green Metrics Tool scenario
```

## API

| Endpoint | Response |
| --- | --- |
| `GET /api/companies` | Full dataset |
| `GET /api/companies/:id` | A single company (used by Traditional mode) |
| `GET /api/updates?since=<ISO date>` | Only companies whose `updatedAt` is newer than `since` |

## How the data flows

- **Zero-Cloud mode (default):** on the first visit the full dataset is downloaded once and saved to IndexedDB. Pages always read from IndexedDB (0 bytes of network). On later visits and whenever the connection comes back, only updated companies are fetched.
- **Traditional mode:** every page view fetches its data from the server, like a typical cloud platform.

To test incremental sync, edit a company in `server/data/companies.json` and **bump its `updatedAt`** (also when you only change one of its jobs). On the next sync only that company is downloaded.

Company ids (`greengrid`, `ecoterra`, `pixelforge`, `medalink`) are used in the URLs `/company/<id>` encoded in the QR codes.

## Testing offline mode

The Service Worker only runs on a production build:

```bash
pnpm offline      # → http://localhost:4173   (or: pnpm serve → port 3000)
```

1. Open the app and browse a few companies.
2. Stop the server (Ctrl+C) **or** set DevTools → Network → "Offline".
3. Reload: the app and the profiles still work.

Note: turning off Wi-Fi is not enough on `localhost`, because the server runs on your own machine.

## Traditional vs. Zero-Cloud comparison

On `/dashboard`:

- **Mode switch.** Each mode has its own counters.
- **Run benchmark.** Runs the same scenario in both modes (1 list view + 20 profile views). Zero-Cloud starts from an empty device, so its initial download is included.
- **Comparison table.** Page views, server requests, data transferred, average access time, views served offline, failed views and estimated CO₂e, plus a projection for 1,000 attendees.

Requests, data and timings are **measured** in the browser. CO₂e is an **estimate** calculated from the transferred bytes with CO2.js; it is not an energy measurement. For energy in Wh, see [GREEN-METRICS.md](GREEN-METRICS.md).

Fair offline test: browse in each mode with DevTools → Network → Offline and compare "Views served offline" and "Failed views".

## HTTPS on the local network (offline mode on phones)

Service Workers require a secure context: `localhost`, or HTTPS with a trusted certificate.

```bash
brew install mkcert   # once
pnpm cert             # creates certs/ for your current IP (run again if you change Wi-Fi)
pnpm serve            # now serves https://<your-ip>:3000
```

Each demo phone must trust the mkcert root CA (`rootCA.pem`; `pnpm cert` prints its location):

- **iPhone:** send it via AirDrop → Settings → Profile Downloaded → Install, then Settings → General → About → Certificate Trust Settings → enable mkcert.
- **Android:** Settings → Security → Encryption & credentials → Install a certificate → CA certificate.

Without a certificate (e.g. judges' phones over HTTP), data is still stored in IndexedDB and in-app navigation keeps working offline; only **reloading** the page while offline fails.

`certs/` is git-ignored because it contains a private key. Delete the folder to go back to HTTP.

## Troubleshooting

- **Phones can't open the QR link:** check your current IP with `ipconfig getifaddr en0`. If it changed, run `pnpm cert` and `pnpm serve` again and reopen `/qr`. Also make sure the macOS firewall allows `node`, and that the Wi-Fi doesn't isolate devices (a phone hotspot is a reliable fallback).
- **`EADDRINUSE` on port 3000:** another server or a Docker container is using the port. Check with `lsof -i :3000`.
- **Sync shows "local server not reachable":** the page is open on a port where no server is running (the Service Worker can still show the app). Open the URL printed by the server.

## Next steps

- Energy measurement (Wh) with Green Metrics Tool, see [GREEN-METRICS.md](GREEN-METRICS.md)
