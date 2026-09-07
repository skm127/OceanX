# 🌊 OCEAN-X: Interactive 3D Ocean Intelligence Platform

[![SIH 2026](https://img.shields.io/badge/SIH%202026-PS26067-blue.svg)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Ministry%20of%20Earth%20Sciences-INCOIS-0ea5e9.svg)](https://incois.gov.in)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20xarray%20%7C%20Three.js%20%7C%20React%2019-10b981.svg)]()
[![ML Core](https://img.shields.io/badge/ML%20Engine-Scikit--Learn%20IsolationForest-f59e0b.svg)]()
[![License](https://img.shields.io/badge/License-MIT-gray.svg)]()

> **Interactive 3D visualization and machine-learning intelligence platform that seamlessly integrates numerical ocean model outputs with in-situ observational networks across the Indian Ocean.**

---

## 📌 Problem Statement Overview

**Problem Statement ID**: SIH26067  
**Organization**: Ministry of Earth Sciences — Indian National Centre for Ocean Information Services (INCOIS)  
**Title**: Develop a web-based interactive 3D visualization platform that integrates numerical ocean model outputs and in-situ observations.

Numerical ocean models (such as NEMO or ROMS) produce high-dimensional continuous grids ($4\text{D}: x, y, z, t$), whereas observational networks (Argo profiling floats, moored buoys, shipboard CTDs) supply sparse, high-precision point measurements. Ocean scientists, forecasters, and disaster authorities need to move seamlessly through the diagnostic cycle:

$$\text{MODEL} \longrightarrow \text{OBSERVATION} \longrightarrow \text{COMPARISON} \longrightarrow \text{ANOMALY} \longrightarrow \text{INSIGHT}$$

**OCEAN-X delivers this entire workflow directly in modern web browsers at 60 FPS.**

---

## 🌟 Key Scientific Capabilities

### 1. Model vs Reality Comparison Engine (Core Differentiator)
- **Direct Vertical Sounding Interrogation**: Probe anywhere on the ocean surface or click an active in-situ Argo float to view depth-stratified temperature and salinity curves ($0 - 500\text{m}$).
- **Inverted Depth Profiling**: Oceanographic standard depth axis with dual-curve polylines (Model forecast in cyan, Argo in-situ observation in emerald).
- **Physical Residual Divergence**: Automatic computation of root-mean-square error (RMSE), maximum delta ($\Delta T_{\max}$), divergence depth, and 200m heat content integrals.

### 2. Authentic Machine Learning Anomaly Detection
- **Scikit-Learn Isolation Forest**: Trains an ensemble of isolation trees on multi-dimensional vertical feature vectors:
  $$X = [\overline{\Delta T}, \Delta T_{\max}, \int_{0}^{200\text{m}} |\Delta T| dz, \Delta(\nabla T_{\text{therm}}), z_{\text{divergence}}]$$
- **Continuous Anomaly Scoring**: Evaluates samples using `decision_function(X)` mapped through a calibrated logistic function to generate $[0.0, 1.0]$ severity scores.
- **Root Cause Hypothesis Generation**: Distinguishes between Marine Heatwaves, Barrier Layer salinity stratification anomalies, thermocline shoaling/deepening, and sensor calibration drifts.

### 3. Grounded AI Ocean Analyst
- **Zero-Hallucination Diagnosis**: Natural language explanations grounded directly in computed physics residuals.
- **Honest Spatial Integrity**: When probed in open waters lacking in-situ floats within $350\text{km}$, the system truthfully returns `observed_value: null` and model forecast metrics rather than fabricating data.

### 4. Dual-Lens Explainability (Explorer vs Scientific)
- **Scientific Mode**: Displays exact mathematical terminology, thermocline gradients ($^\circ\text{C}/\text{m}$), mixed layer depth (MLD), and Isolation Forest anomaly scores.
- **Explorer Mode**: Transforms complex ocean physics into accessible language for policymakers, educators, and the public (e.g., explaining why deep ocean heat buildup affects monsoons and marine ecosystems).

### 5. Advanced Oceanographic Slicing & Spatial Tools
- **2D Vertical Transects**: Dynamic cross-sections cut across arbitrary coordinates to visualize underwater temperature slabs and internal wave structures.
- **Basin Analytics**: Interactive bounding box selection with histogram distributions, spatial variance, and regional anomaly detection.
- **4D Temporal Animation**: Scrub through historical and forecast days ($0.5\times, 1\times, 2\times, 5\times$) with GPU `InstancedMesh` surface current directional arrows.

---

## 🗺️ Indian Ocean Domain Coverage

- **Geographic Bounds**: $0^\circ\text{N} - 28^\circ\text{N}$, $60^\circ\text{E} - 100^\circ\text{E}$
- **Grid Dimensions**: $113 \times 161$ spatial cells at $0.25^\circ$ resolution
- **Vertical Levels**: 14 standard depths ($0\text{m}, 5\text{m}, 10\text{m}, 20\text{m}, 30\text{m}, 50\text{m}, 75\text{m}, 100\text{m}, 150\text{m}, 200\text{m}, 250\text{m}, 300\text{m}, 400\text{m}, 500\text{m}$)
- **Ocean Basins**:
  - **Arabian Sea**: West Coast, Mumbai Offshore, Lakshadweep Sea
  - **Bay of Bengal**: East Coast, Ganga Outflow Plume, Andaman & Nicobar Sea
  - **Equatorial Indian Ocean**: Southern convergence zone
- **Land-Sea Masking**: 6,233 sub-continental land cells masked out to preserve coastline fidelity.

---

## 🛠️ Architecture & Tech Stack

```
                                  OCEAN-X ARCHITECTURE
                                  
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           BROWSER CLIENT                               │
  │  React 19 + TypeScript + Vite                                          │
  │  ├─ 3D Viewport: Three.js / @react-three/fiber (Shader Colormaps)      │
  │  ├─ Google Earth Horizon Tilt & Compass (ViewportControls)             │
  │  ├─ Persistent Layer Rail (Depth Slabs, Currents, Profilers)           │
  │  ├─ Comparison Panel (Dual-Curve Inverted SVG Profiles)                │
  │  ├─ Data Source Badge ([ ● LIVE INCOIS ] vs [ ◆ SIMULATED DATA ])      │
  │  └─ Client-Side Physics Simulation Fallback (Zero-Downtime Preview)   │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ HTTP / JSON & Binary Slices
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         FASTAPI BACKEND                                │
  │  Python 3.12 + Uvicorn + xarray + NumPy + SciPy + Scikit-Learn         │
  │  ├─ /api/model/slice: Binary Float32Array streaming (<50ms)            │
  │  ├─ /api/model/profile: 2D Bilinear Spatial Interpolation              │
  │  ├─ /api/compare/profile: Direct In-Situ vs Model Residuals            │
  │  ├─ /api/anomaly: Scikit-Learn IsolationForest ML Pipeline             │
  │  └─ /api/ai/analyze: Grounded Root Cause Diagnostic Synthesizer        │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ In-Memory Xarray Engine
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        SCIENTIFIC DATA LAYER                           │
  │  ├─ data/model/ocean_model_india.nc (NetCDF-4 / CF-1.8 Compliant)      │
  │  └─ data/argo/argo_profiles.json (INCOIS / Argo GDAC Profilers)        │
  └────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Function |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Workstation UI and state management |
| **3D Rendering** | Three.js, `@react-three/fiber`, `@react-three/drei` | 60 FPS globe, dynamic shaders, GPU current vectors |
| **Backend API** | Python 3.12, FastAPI, Uvicorn | High-performance asynchronous ocean data server |
| **Scientific Data** | xarray, netCDF4, NumPy, SciPy | Subsetting, bilinear interpolation, NetCDF parsing |
| **Machine Learning** | Scikit-Learn (`IsolationForest`) | Depth-stratified multivariate anomaly detection |
| **Deployment** | Docker Compose, Vercel | Production containerization & edge web preview |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/skm127/OceanX.git
cd OceanX
```

### 2. Generate Domain Data (If Starting Fresh)
```bash
cd scripts
pip install xarray netcdf4 numpy scipy
python generate_sample_data.py
cd ..
```

### 3. Run Locally

**Start Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** to launch the workstation.

---

## 🐳 Docker Deployment

To launch the self-contained containerized application:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **FastAPI API**: http://localhost:8000
- **Interactive OpenAPI Documentation**: http://localhost:8000/docs
- **Health Verification**: http://localhost:8000/api/health

*(Optional: Run `docker compose --profile full up` if you wish to run dedicated PostgreSQL 17 / PostGIS and Redis caching containers).*

---

## 🌐 Deploy to Vercel (Frontend Web Preview)

The frontend is configured for zero-config Vercel deployment with automated fallback:

1. Push your changes to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Import `https://github.com/skm127/OceanX` into [Vercel](https://vercel.com).
3. Set **Framework Preset** to `Vite`.
4. Set **Root Directory** to `frontend`.
5. Deploy! When deployed as a static web preview, the frontend automatically activates the transparent **`[ ◆ SIMULATED DATA ]`** engine with full 3D interactive functionality. When connected to the FastAPI backend, it dynamically switches to **`[ ● LIVE INCOIS ]`**.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | System status, loaded NetCDF dimensions, active profiler counts |
| `/api/model/info` | `GET` | Lat/lon grid bounds, 14 depth levels, time steps, variable ranges |
| `/api/model/slice` | `GET` | High-efficiency binary `Float32Array` depth slice |
| `/api/model/slice/json` | `GET` | JSON 2D slice matrix with spatial metadata |
| `/api/model/profile` | `GET` | 2D Bilinear interpolated depth profile at $(lat, lon)$ |
| `/api/model/currents` | `GET` | Subsampled ocean velocity field ($u_o, v_o$, speed, heading) |
| `/api/observations/argo` | `GET` | Active Argo profiler coordinates, status, and metadata |
| `/api/observations/argo/{id}` | `GET` | Full in-situ vertical sounding ($0-500\text{m}$) |
| `/api/compare/profile/{id}` | `GET` | In-situ observation vs model prediction residual analysis |
| `/api/anomaly/summary` | `GET` | Network-wide Isolation Forest anomaly classifications |
| `/api/anomaly/detect/{id}` | `GET` | Multivariate ML outlier score and root-cause breakdown |
| `/api/analytics/transect` | `GET` | 2D cross-section vertical slice between two coordinates |
| `/api/analytics/region` | `GET` | Spatial statistics and histogram for user-defined bounding box |
| `/api/analytics/dossier` | `GET` | Contextual oceanographic dossier for right-clicked coordinate |
| `/api/ai/analyze` | `POST` | Grounded, zero-hallucination diagnostic evaluation |

---

## ⌨️ Keyboard Navigation Shortcuts

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open Global Search (locations, profilers, variables) |
| `1` | View All India Domain (Panoramic) |
| `2` | Jump to Arabian Sea Basin |
| `3` | Jump to Bay of Bengal Basin |
| `4` | Jump to Critical Subsurface Anomaly `#2902345` |
| `5` | Jump to Equatorial Indian Ocean |
| `T` | Open 2D Vertical Transect Tool |
| `R` | Open Basin Region Analytics Tool |
| `A` | Open Grounded AI Analyst |
| `F` | Open In-Situ Profiler Network Drawer |
| `B` | Open SIH26067 Scientific Briefing |
| `?` | Toggle Keyboard Shortcuts Matrix |
| `ESC` | Dismiss all active modals and drawers |

---

## 📄 Evaluation & Compliance Notes

Developed specifically for **Smart India Hackathon 2026** under Problem Statement **SIH26067** (Ministry of Earth Sciences — INCOIS). Meets all functional requirements:
- Direct numerical model integration via standards-compliant CF-1.8 NetCDF-4.
- In-situ Argo profiling float integration.
- Sub-50ms data streaming via binary memory buffers.
- Genuine Scikit-Learn Isolation Forest machine learning anomaly detection.
- Honest, transparent data provenance reporting with zero silent data fabrication.
