# ISS Telemetry Dashboard Starter

This is a Next.js starter website for an ISS experiment telemetry dashboard.
It currently uses only public APIs and is set up to be extended into a full
mission-control UI.

## Public APIs integrated

- ISS live position and speed: [wheretheiss.at](https://wheretheiss.at/w/developer)
- People in space and ISS pass prediction:
  [Open Notify](http://open-notify.org/Open-Notify-API/)
- Upcoming launch feed:
  [The Space Devs Launch Library 2](https://thespacedevs.com/llapi)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current dashboard sections

- ISS position, altitude, and velocity cards
- Current number of people in space
- Crew list with associated spacecraft
- Next ISS passes over Houston (example ground station)
- Upcoming launches from public launch feed

## Next development ideas

- Add charting for telemetry trends (velocity, altitude, ground track)
- Add a world map with real-time ISS location marker
- Move public API calls behind typed internal API routes
- Add auth/role gates for mission operator dashboards
- Add alert thresholds and telemetry anomaly highlighting
