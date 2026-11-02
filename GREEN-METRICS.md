# Measuring energy (Wh) with Green Metrics Tool

## What is measured

`usage_scenario.yml` runs the same scenario in both modes: 50 visitors × (1 list view + 20 profile views).
Green Metrics Tool (GMT) measures the energy of each phase separately, including the local server (`zero-cloud`
container) and the browser (Playwright container). Compare the **"Traditional"** and **"Zero-Cloud"** phases
(and subtract the "Idle baseline" phase).

The scenario is started with `window.zeroCloud.runScenario(mode, profileViews, visitors)`, the same code used by
the dashboard's *Run benchmark* button.

## 1. Check the Docker image (5 min, no GMT needed)

```bash
docker build -t zero-cloud .
docker run --rm -p 3000:3000 zero-cloud
# open http://localhost:3000, stop with Ctrl+C
```

## 2. Option A — Run GMT locally

Installation: https://docs.green-coding.io (*Installation* section). Linux works best; on macOS it runs inside
Docker but with fewer energy sensors, so the measurement is more limited.

```bash
python3 runner.py --uri /path/to/zero-cloud --name "zero-cloud test"
# or from GitHub:
python3 runner.py --uri https://github.com/Aquino-Joaquin/<repo> --name "zero-cloud test"
```

Results appear in the local GMT dashboard (http://metrics.green-coding.internal:9142).

## 2. Option B — Green Coding measurement cluster

Green Coding offers measurements of public repositories on their cluster with calibrated hardware. See
https://www.green-coding.io and their documentation to submit the repository.

## Troubleshooting

- **The Playwright helper include doesn't exist:** the helper name/version has changed. Look up the current one at
  https://www.green-coding.io/blog/playwright-for-the-win/ and in the documentation, then update the
  `compose-file: !include-gmt-helper ...` line and the `container:` of each step.
- **`build: .` is not accepted:** build the image first (`docker build -t zero-cloud .`) and use
  `image: zero-cloud` under `services` instead.
- Inside GMT the app is served over HTTP, so the Service Worker is not registered. This does not affect the
  measurement: data still goes to IndexedDB and the app shell is the same in both modes.

## How to present it

If it works: "Measured with Green Metrics Tool: X Wh (Traditional) vs. Y Wh (Zero-Cloud) for 50 visitors."
If there is no time: present the CO₂e from CO2.js as an estimate and the Wh measurement as a next step.
