# TIGERS-X Mission Archive

![mission-patch](public/patch.png)

Static archive dashboard for the TIGERS-X payload in the ICE Cubes Facility on the Columbus Module aboard the International Space Station. Mission elapsed time is frozen at experiment cube deactivation (`2026-06-05T07:50:00.000Z`); wall clocks remain live.

## Features

1. Mission operation timeline with TDRSS S/KU link pass rows
2. Live GMT and timezone clocks; frozen mission elapsed time
3. Activity monitor with archived mission schedule text
4. Static payload telemetry and experiment diagram panels
5. `/countdown` page showing permanent deactivation state

## Data sources

Bundled JSON only — no live APIs or external fetches:

1. `src/data/mission-operation.json` — mission epoch, timeline events, activity descriptions
2. `src/data/tdrss.json` — S-band and Ku-band link pass windows (timeline display)
3. `src/data/telemetry-snapshot.json` — final payload telemetry at deactivation

## Build and run

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or the port shown in the terminal).

### Static export

```bash
npm run build
npm run serve
```

The build writes a fully static site to `out/`. Use `npm run serve` locally or deploy `out/` to any static host.

## TDRSS data maintenance

Scripts under `scripts/` merge updated TDRSS pass schedules into `src/data/tdrss.json`.
