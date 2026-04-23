# TIGERS-X Mission Operations Dashboard

![mission-patch](public/patch.png)

This is a web-based dashboard designed to display telemetry, telecommands, and status updates to support mission operations for the TIGERS-X payload in the ICE Cubes Facility on the Columbus Module aboard the International Space Station.

**Deployed at:** https://dashboard.tigers-x.ishalab.space

## Features

1. Display operation timeline alongside ISS mission operations  
2. Display Mission Time, Ground Station Time, and Local Time  
3. Display payload status and telemetry in real time  
4. Display payload telecommand uplinks to the station in real time  

## Objective

The goal of this dashboard is to support mission operations in coordination with ESA, the ICE Cubes YAMS system, and mission planning software.

## User Manual

The website utilizes data from three sources:

1. `mission-operation.json` for station and mission operation planning 
2. Public API for telemetry and telecommand status  
3. International Space Station public API  

## `timeline.json` Format Example

```json
[
  {
  "mission": {
    "id": "tigers-x",
    "name": "Tigers-X",
    "epoch": "2026-04-20T20:20:20.000Z"
  },
  "events": [
    {
      "id": "example-1",
      "name": "Day 1 Operations",
      "type": "operation",
      "start": "2026-04-27T00:00:00.000Z",
      "end": "2026-04-28T00:00:00.000Z"
    },
    {
      "id": "example-2",
      "name": "Daily Planning Conference",
      "type": "iss-event",
      "start": "2026-04-27T06:15:00.000Z",
      "end": "2026-04-27T06:45:00.000Z"
    },
    {
      "id": "example-3",
      "name": "COL/MPCC Coordination Window",
      "type": "col-mpcc",
      "start": "2026-04-27T07:00:00.000Z",
      "end": "2026-04-27T07:45:00.000Z"
    },
    {
      "id": "example-4",
      "name": "Channel 1 Operation",
      "type": "chanel-1",
      "start": "2026-04-27T10:10:00.000Z",
      "end": "2026-04-27T10:42:43.500Z"
    },
    {
      "id": "example-5",
      "name": "Channel 2 Observation",
      "type": "chanel-2",
      "start": "2026-04-27T11:15:27.000Z",
      "end": "2026-04-27T12:15:27.000Z"
    },
    {
      "id": "example-6",
      "name": "Channel 3 Sequence",
      "type": "chanel-3",
      "start": "2026-04-27T12:30:00.000Z",
      "end": "2026-04-27T13:00:00.000Z"
    }
  ]
}
]
```

## Field Description

- id: Unique identifier for each event  
- name: Event or operation name  
- type: Event type (e.g., iss-event, operation, col-mpcc)  
- start: Start time in ISO 8601 format (UTC)  
- end: End time in ISO 8601 format (UTC)  

## Build And Run

### Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or the port shown in the terminal).

### Production Build

```bash
npm run build
npm start
```

Served on the configured port (default: 3000). Use a process manager or container orchestration for reliability.

## Deployment

### Vercel (Recommended)

- Push project to GitHub/GitLab/Bitbucket  
- Import project into Vercel  
- Select Next.js preset  
- Use default build command: npm run build  
- Deploy  

No additional configuration is required for basic usage.

