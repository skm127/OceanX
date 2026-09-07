# 🌊 OCEAN-X

**Interactive 3D Ocean Intelligence & Visualization Platform**

SIH 2026 — PS26067 | Ministry of Earth Sciences — INCOIS

## Overview

OCEAN-X is a browser-native 3D ocean intelligence platform that unifies numerical ocean models and real-world observations, allowing scientists to explore ocean conditions across space, depth, and time — and directly compare model predictions with observed reality.

### Core Feature: Model vs Reality

The platform's differentiator is the ability to compare model predictions with real observations (e.g., Argo floats), calculate deviations, and flag anomalies.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| 3D Rendering | Three.js (via @react-three/fiber) |
| Charts | Plotly / ECharts |
| Backend | Python + FastAPI |
| Scientific Data | xarray (NetCDF) |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| Deployment | Docker + docker-compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for data generation)

### 1. Generate Sample Data
```bash
cd scripts
pip install xarray netCDF4 numpy
python generate_sample_data.py
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

### 3. Or run locally for development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

## Project Structure

```
oceanX/
├── frontend/          # React + Three.js client
├── backend/           # FastAPI + xarray server
├── data/              # NetCDF data files
│   ├── model/         # Ocean model data
│   └── argo/          # Argo float profiles
├── scripts/           # Data generation & utilities
├── docker-compose.yml
└── README.md
```

# 🌊 OCEAN-X

**Interactive 3D Ocean Intelligence & Visualization Platform**

SIH 2026 — PS26067 | Ministry of Earth Sciences — INCOIS

## Overview

OCEAN-X is a browser-native 3D ocean intelligence platform inspired by the OSIRIS (`osirisai.live`) / Palantir Command & Control (C2) aesthetic. It unifies numerical ocean models (NEMO) and real-world in-situ observations (Argo floats), allowing oceanographers, defense operators, and scientists to explore ocean conditions across space, depth, and time — and directly identify statistical and machine learning anomalies between model predictions and observed reality.

### Geographic Domain: All Oceans Around India
- **Coverage**: $0^\circ\text{N} - 28^\circ\text{N}$, $60^\circ\text{E} - 100^\circ\text{E}$ ($113 \times 161$ grid resolution at $0.25^\circ$).
- **Basins**: Arabian Sea (West Coast, Mumbai Offshore, Lakshadweep), Bay of Bengal & Andaman Sea (East Coast, Ganga Plume), and the Equatorial Indian Ocean.
- **Realistic Land-Sea Masking**: 6,233 land cells masked out so ocean data wraps naturally around peninsular India.

### Hero Feature: Model vs Reality Anomaly Intelligence
- **Isolation Forest ML Anomaly Engine**: Computes depth-stratified multi-feature divergence scores ($0.0 - 1.0$) across vertical soundings.
- **Scientific Root Cause Diagnosis**: Automated hypothesis generation (e.g. Subsurface Marine Heatwaves, Barrier Layer salinity anomalies, thermocline gradient displacements).
- **Target Comparison Dossier**: Inverted depth chart ($0-500\text{m}$), dual-curve polyline rendering, shaded anomaly difference zones, interactive crosshairs, and one-click INCOIS dossier export (JSON / CSV).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| 3D Engine | Three.js via `@react-three/fiber` & `@react-three/drei` |
| Textures | NASA Blue Marble Atmospheric, Specular, and Normal maps |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Scientific Data | xarray, netCDF4, NumPy, SciPy, scikit-learn |
| Database | PostgreSQL 17 + PostGIS |
| Cache | Redis 7 |
| Deployment | Docker Compose |

---

## Command & Control (C2) Features

1. **Quick-Jump Sector Navigator**:
   - `[ 🇮🇳 All India ]` — Panoramic framing of Indian Peninsula, Arabian Sea, and Bay of Bengal.
   - `[ 🌊 Arabian Sea ]` — Focused surveillance of west coast, Mumbai basin, and Lakshadweep.
   - `[ 🌊 Bay of Bengal ]` — Surveillance of east coast, Ganga outflow, and Andaman Sea.
   - `[ 🎯 Target #2902345 ]` — Flies camera straight to the active anomaly site and opens the Comparison Dossier.
   - `[ ⚓ Equatorial Ocean ]` — Southern convergence zone.
2. **In-Situ Observation Fleet Manager**: Collapsible tactical drawer grouping all 8 Argo floats around India by basin with status indicators.
3. **Interactive Ocean Surface Probe**: Click anywhere on the ocean surface on the 3D globe to sample the vertical profile and inspect local depth soundings.
4. **4D Time Playback & Surface Currents**: Dynamic animation scrubbing ($0.5x, 1x, 2x, 5x$) with GPU `InstancedMesh` directional arrow current vectors.
5. **WebGL Canvas Snapshot**: One-click high-resolution PNG snapshot capture.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check with dataset and service status |
| `GET /api/model/info` | Model dataset grid metadata and dimensions |
| `GET /api/model/slice` | 2D depth slice as binary Float32Array |
| `GET /api/model/slice/json` | 2D depth slice as JSON matrix |
| `GET /api/model/profile` | Vertical depth profile at specific lat/lon |
| `GET /api/model/currents` | Subsampled current vector fields (uo, vo, speed, heading) |
| `GET /api/observations/argo` | Active Argo profiling floats in domain |
| `GET /api/observations/argo/{id}` | Full observation soundings (depths, temps, salinities) |
| `GET /api/compare/profile/{id}` | Direct model vs in-situ comparison with anomaly flags |
| `GET /api/anomaly/summary` | Fleet-wide ML Isolation Forest anomaly scores & status |
| `GET /api/anomaly/detect/{id}` | Deep ML anomaly breakdown with root cause hypothesis |

---

## Quick Start

### 1. Run with Docker Compose
```bash
docker compose up --build
```

### 2. Or Run Locally for Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

---

## Build Phases

- [x] Phase 0 — Research & Environment Setup
- [x] Phase 1 — Data Pipeline & NetCDF Binary Streaming
- [x] Phase 2 — 3D Globe & Scientific Colormap Shader Engine
- [x] Phase 3 — 4D Time Playback & GPU Instanced Currents
- [x] Phase 4 — Distributed In-Situ Observations Across Indian Oceans
- [x] Phase 5 — Model vs Reality Comparison & Dual-Curve Profile Graph
- [x] Phase 6 — Machine Learning Anomaly Intelligence & Root Cause Diagnosis
- [x] Phase 7 — Interactive Ocean Grid Probe, Sector Navigation & C2 War Room UI

---

## License

SIH 2026 PS26067 | Ministry of Earth Sciences — INCOIS.

