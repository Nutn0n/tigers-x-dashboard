# TIGERS-X Mission Operations Dashboard

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

1. `timeline.json` for station and mission operation planning  
2. Public API for telemetry and telecommand status  
3. International Space Station public API  

## `timeline.json` Format Example

```json
[
  {
    "id": "unique-event-id",
    "name": "ISS proximity operations briefing",
    "type": "iss-event",
    "start": "2026-04-22T06:00:00.000Z",
    "end": "2026-04-22T07:30:00.000Z"
  },
  {
    "id": "unique-event-id-2",
    "name": "Payload operation - Day 1",
    "type": "operation",
    "start": "2026-04-22T00:00:00.000Z",
    "end": "2026-04-23T00:00:00.000Z"
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

### Self-Hosted Node (with Nginx)

Build and start the app:

```bash
npm run build
npm start
```

Configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS (e.g. Let's Encrypt)

### Docker (Container Deployment)

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

Run container:

```bash
docker build -t tigersx-dashboard .
docker run -p 3000:3000 tigersx-dashboard
```

### Kubernetes / Cloud

Deploy the container image to your cluster. Use:

- Horizontal scaling for traffic  
- Ingress controller for routing  
- HTTPS termination  

## Environment Variables

Only required when integrating external services (e.g. API keys, backend endpoints).  

The current implementation does not require a `.env` file for basic operation.
