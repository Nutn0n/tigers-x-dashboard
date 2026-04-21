# TIGERS-X Mission Dashboard

Web dashboard for **TIGERS-X** — *Thailand Innovative G-force varied Emulsification Research for Space Exploration* — a Thai-built experiment bound for the International Space Station (ISS).

This repository is a **Next.js** application: a mission-oriented control-room style UI. Today it focuses on **context and public space data** (ISS position, crew, passes, launches). **Deeper mission features** — live payload telemetry, operator workflows, alerts, and authenticated mission control — are **planned and will ship in later iterations**.

---

## About the mission

**TIGERS-X** is an active payload with data connectivity, launching **May 2026** on **SpaceX Dragon CRS-34** to the **ISS Columbus** module. The mission advances **medical research for Earth and space**, centered on **Total Parenteral Nutrition (TPN)** in **low Earth orbit**.

TPN delivers nutrients (lipids, proteins, carbohydrates) intravenously when the digestive system cannot be used. As an **emulsion**, oil- and water-based phases separate quickly under **Earth gravity**, which limits how we study long-term stability. **Microgravity** lets researchers study fluid dynamics and interfacial behavior without that dominant gravitational settling — supporting work on how complex formulations can be mixed **reliably without gravity or constant human intervention**, with implications for resilient, decentralized manufacturing closer to patients.

The payload is **designed and built in Thailand** (system design, hardware integration, test, and operations), using **local resources and facilities**, and represents **Thailand’s first active ISS payload** with **near–real-time telemetry and telecommand** to **mission control in Bangkok** (via the ISS onboard network, ground services, and secure links). It is a **compact lab-on-chip style platform** with **data connectivity** for science and operations.

### Payload snapshot

| Item | Detail |
|------|--------|
| **Dimensions** | 100 × 100 × 200 mm |
| **Material** | Anodized aluminum |
| **Launch mass** | 2.5 kg |
| **On-board computer** | Orange Pi |
| **Power (peak)** | 18 W |
| **Data** | Telemetry and telecommands |

### Mission timeline (summary)

| Phase | When | Notes |
|--------|------|--------|
| Introduction | 2024 | Initiated following heritage from KEETA / NASA Space Food Challenge participation |
| Design reviews | 2024 | PDR and CDR passed; payload development aligned to science goals |
| Zero-G flight test | Nov 2024 | Proof of concept in reduced gravity |
| Integration & test | Nov 2024 – Feb 2026 | Designed, built, and tested in Thailand |
| Delivery | Mar 2026 | Delivered and tested in Belgium; handover toward ESA / NASA |
| Launch & install | May 2026 | CRS-34 from Cape Canaveral; installation in Columbus |
| Station science | May – Sep 2026 | Operations including experiment video downlink |
| Return | Late 2026 | Return to Earth with CRS-34 |

The program also emphasizes **documentation and knowledge transfer** so future Thai space programs build on proven heritage rather than starting from zero.

---

## About this dashboard (software)

This app is a **mission dashboard shell**: it presents **mission framing** and **public space environment** data useful for demos, outreach, and early UI work. It does **not** yet connect to **classified or payload-specific** TIGERS-X channels; those integrations, charts, maps, and operator tools will arrive **in future releases**.

**Current sections (public APIs only):**

- ISS position, altitude, and velocity
- People in space and crew / spacecraft
- Example ISS passes (Houston)
- Upcoming launches (public launch library)

**Coming later (roadmap):**

- Live or archived **payload telemetry** and experiment status
- **Charts** and ground track / map views
- **Internal API routes** with typed contracts and safer data handling
- **Authentication** and role-based views for operators
- **Alerts**, thresholds, and anomaly highlighting

---

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal if 3000 is busy).

**Production build (local or any Node host):**

```bash
npm run build
npm start
```

Serve on the host’s configured port (often `3000`). Use your platform’s process manager or container orchestration for restarts and scaling.

### Deploying the dashboard

This is a standard **Next.js** app. Typical options:

1. **Vercel** (or similar): connect the Git repository, select the Next.js preset, use defaults for build (`npm run build`) and output. No extra config is required for a basic deploy.
2. **Self-hosted Node**: run `npm run build` then `npm start` behind a reverse proxy (e.g. nginx) with HTTPS and your domain.
3. **Container**: wrap `npm run build` + `npm start` in a multi-stage Dockerfile if you deploy to Kubernetes or another container platform.

Set **environment variables** only when you add features that need them (e.g. API keys or backend URLs); the current public-data demo does not require a `.env` for basic operation.

---

## Public APIs used today

- ISS position and velocity — [Where The ISS At?](https://wheretheiss.at/w/developer)
- People in space and ISS pass predictions — [Open Notify](http://open-notify.org/Open-Notify-API/)
- Upcoming launches — [The Space Devs Launch Library 2](https://thespacedevs.com/llapi)

---

*Built with Thai researchers and engineers — TIGERS-X links national capability in space systems to healthcare innovation.*
