# OCEAN-X (SAGAR-VIEW)
### 3D Ocean Intelligence & In-Situ Observation Platform
**Smart India Hackathon 2026 — Problem Statement PS26067**  
**Sponsoring Organization:** Ministry of Earth Sciences — Indian National Centre for Ocean Information Services (INCOIS)

[![SIH 2026](https://img.shields.io/badge/SIH%202026-PS26067-0284c7.svg)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Ministry%20of%20Earth%20Sciences-INCOIS-0ea5e9.svg)](https://incois.gov.in)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-38bdf8.svg)](https://python.org)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Three.js%20%7C%20Vite-10b981.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20xarray-0284c7.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

---

## 📑 Table of Contents

1. [The Problem Statement & Scientific Challenge](#1-the-problem-statement--scientific-challenge)
2. [The OCEAN-X Solution Architecture](#2-the-ocean-x-solution-architecture)
3. [What Data OCEAN-X Displays & Provenance](#3-what-data-ocean-x-displays--provenance)
4. [Live Deployment & Public Access Links](#4-live-deployment--public-access-links)
5. [Complete Desktop Setup & Local Installation Guide](#5-complete-desktop-setup--local-installation-guide)
6. [Operational Manual (How to Operate Everything)](#6-operational-manual-how-to-operate-everything)
7. [Product Modes Walkthrough](#7-product-modes-walkthrough)
8. [Advanced Analytical Workstations](#8-advanced-analytical-workstations)
9. [Keyboard Shortcuts Matrix](#9-keyboard-shortcuts-matrix)
10. [Engineering Challenges & War Stories ("How We Built It")](#10-engineering-challenges--war-stories-how-we-built-it)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)
12. [Project Structure & Technology Stack](#12-project-structure--technology-stack)

---

## 1. The Problem Statement & Scientific Challenge

### Problem Statement (SIH26067)
> *"Develop a web-based interactive 3D visualization platform that integrates numerical ocean model outputs and in-situ observations."*  
> **Authority:** Ministry of Earth Sciences — Indian National Centre for Ocean Information Services (INCOIS), Hyderabad.

### Why Existing Solutions Fail
Physical oceanographers, operational forecasters, and disaster management authorities face three critical bottlenecks:

1. **The Dimensionality Disconnect (Models vs. Reality)**:
   - **Numerical Models** (such as INCOIS IND-NEMO, ROMS, or Copernicus CMEMS) produce 4D continuous regular grids ($T, S, U, V$) across millions of computational cells.
   - **In-Situ Sensor Networks** (Argo profiling floats, OMNI moored buoys, RAMA moorings, underwater gliders) record asynchronous, sparse, discrete Lagrangian depth profiles.
   - Existing software packages (e.g. ncview, Ferret, GrADS) are offline desktop utilities incapable of real-time 4D co-location or interactive browser-native 3D exploration.

2. **The Satellite "Skin Effect" Blindspot**:
   - Satellite radiometers (AVHRR, MODIS) only observe the top **1 millimeter** of the sea surface (skin temperature).
   - Destructive weather phenomena in the North Indian Ocean (such as rapid cyclone intensification during Cyclones Fani, Amphan, and Mocha) are driven by **subsurface heat reservoirs** trapped between 80 m and 200 m depth.
   - Surface satellites cannot see these subsurface marine heatwaves. Without vertical integration down to the $26^\circ\text{C}$ isotherm ($D_{26}$), forecasters miss rapid cyclone deepening.

3. **The WebGL Data Transfer Bottleneck**:
   - A single 4D ocean model file exceeds tens to hundreds of gigabytes.
   - Attempting to transmit raw NetCDF or GeoJSON arrays to the client stalls the browser event loop, consumes hundreds of megabytes of RAM, and drops frame rates below 10 FPS.

---

## 2. The OCEAN-X Solution Architecture

OCEAN-X bridges the gap between numerical simulation and physical observation by pairing an asynchronous **FastAPI + xarray** calculation server with a hardware-accelerated **React 19 + Three.js** WebGL client.

```
                                OCEAN-X SYSTEM ARCHITECTURE

  +---------------------------------------------------------------------------------------+
  |                                   CLIENT VIEWPORT                                     |
  |  React 19 + TypeScript + Vite + Three.js / React Three Fiber                          |
  |                                                                                       |
  |  - 5 Product Modes: Research, Situation Room, Sounding Studio, Learn, Data Manager   |
  |  - 3D Globe: Satellite Earth + Custom WebGL DataTexture Colormaps (60 FPS)            |
  |  - Vector Dynamics: 500 Streaming particle streamlines & 3D arrow cones               |
  |  - In-Situ Network: Argo floats (cyan), OMNI buoys (gold), Gliders (green)            |
  |  - High-Res Sounding Studio: Full-page dual-curve comparison, 70-layer data matrix   |
  |  - Analysis Tools: 2D Vertical Transects, Basin Bounding Box Stats, Co-Location Studio|
  +-------------------------------------------|-------------------------------------------+
                                              |
                          REST API / Raw Float32Array Binary Slices
                                              |
  +-------------------------------------------v-------------------------------------------+
  |                                    FASTAPI SERVER                                     |
  |  Python 3.11+ / Uvicorn / Async Endpoints / In-Memory LRU + Redis Cache               |
  |                                                                                       |
  |  - /api/model/slice: Raw IEEE 754 binary depth slice streaming (72 KB, <15ms delivery)|
  |  - /api/model/currents: Subsampled velocity vector field (uo, vo, speed)              |
  |  - /api/observations/all: Unified Argo + OMNI/RAMA buoys + Glider registry (14 plat.) |
  |  - /api/analytics/colocate: Haversine distance + 2D bilinear model-obs spatial match  |
  |  - /api/analytics/heat-potential: Vectorized D26 isotherm & TCHP integral (<40ms)     |
  |  - /api/anomaly/detect: Scikit-learn Isolation Forest on 5D vertical feature vectors  |
  |  - /api/ai/analyze: Residual-grounded natural language diagnostic synthesizer         |
  +-------------------------------------------|-------------------------------------------+
                                              |
                                    In-Memory xarray Engine
                                              |
  +-------------------------------------------v-------------------------------------------+
  |                                 DATA STORAGE LAYER                                    |
  |  - data/model/sample_bob_model.nc (CF-1.8 Compliant NetCDF-4, 113x161x14x7)          |
  |  - data/argo/sample_argo_profiles.nc (WMO Standard In-Situ Soundings & QC Flags)      |
  |  - CMEMS / Argo ERDDAP Ingestion Pipelines via scripts/refresh_model_data.py          |
  +---------------------------------------------------------------------------------------+
```

### The 5 Pillars of the Solution

1. **4D Zero-Centroid-Displacement Co-Location**:
   Computes exact point-to-point validation between floating in-situ sensors and 4D numerical grids. Uses 2D bilinear interpolation horizontally and 1D piecewise linear interpolation vertically to calculate true Root Mean Square Error (RMSE), forecast bias, and standard deviation.
2. **Tropical Cyclone Heat Potential (TCHP) & Marine Heatwave (MHW) Engine**:
   Integrates Upper Ocean Heat Content from surface down to the $26^\circ\text{C}$ isotherm ($D_{26}$) to trigger INCOIS Rapid Intensification (RI) alerts ($Q_{\text{TCHP}} \ge 50\text{ kJ/cm}^2$).
3. **High-Performance Binary Slice Streaming**:
   Replaces bulky JSON serialization with direct `Float32Array` binary buffer transfers over HTTP, slashing slice payloads from 420 KB down to 72 KB and rendering in under 15 ms.
4. **Machine Learning Subsurface Anomaly Intelligence**:
   An unsupervised `IsolationForest` model fitted on 5-dimensional feature vectors detects subsurface trapped heat anomalies that surface satellites completely miss.
5. **Full-Page In-Situ Sounding Studio**:
   A dedicated full-width oceanographic workstation enabling deep-dive analysis of individual soundings with a complete 70-layer data matrix, interactive threshold crosshair, and CSV export.

---

## 3. What Data OCEAN-X Displays & Provenance

OCEAN-X visualizes operational multi-sensor oceanographic data across space ($0^\circ-28^\circ\text{N}$, $60^\circ-100^\circ\text{E}$), depth ($0-500\text{ m}$), and time:

| Dataset / Variable | Physical Parameter | Units | Range | Visualization & Representation | Source & Provenance |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Potential Temperature (`thetao`)** | Seawater Temperature | $^\circ\text{C}$ | $5.0 - 32.0$ | Continuous color ramp texture on 3D globe + vertical profile curves | INCOIS IND-NEMO / CMEMS Global Reanalysis |
| **Practical Salinity (`so`)** | Ocean Salinity | $\text{PSU}$ | $28.0 - 37.0$ | Distinct teal-to-navy raster texture highlighting low-salinity river discharge plumes | INCOIS IND-NEMO / CMEMS Physics |
| **Current Velocities (`uo`, `vo`)** | Zonal & Meridional Current Speed | $\text{m/s}$ | $0.0 - 2.5$ | 500 animated particle streamlines + 3D directional arrow cones | Numerical Hydrodynamic Model Output |
| **Cyclone Heat Potential ($Q_{\text{TCHP}}$)** | Upper Ocean Heat Content | $\text{kJ/cm}^2$ | $0.0 - 120.0$ | Dynamic thermal hazard layer + INCOIS Rapid Intensification ($>50\text{ kJ/cm}^2$) markers | Derived from $T(z)$ integration down to $D_{26}$ |
| **Marine Heatwaves (MHW)** | Thermal Severity Categories | Cat I–IV | 1 to 4 | Category I (Moderate) to Category IV (Extreme) classification badges | Hobday et al. (2016) International Standard |
| **Argo Profiling Floats** | Vertical CTD Soundings | Multiple | $0 - 2000\text{ m}$ | Pulsing cyan 3D buoy markers on globe; dual-curve sounding HUD | International Argo Program / Ifremer GDAC |
| **INCOIS OMNI Moored Buoys** | Surface Meteorology & Subsurface Chain | Multiple | Surface | Gold markers (e.g. BD08, BD11 in Bay of Bengal; AD02, AD07 in Arabian Sea) | INCOIS Ocean Observation Network (OON) |
| **RAMA Equatorial Moorings** | Air-Sea Interaction Telemetry | Multiple | Surface | Research Moored Array buoys monitoring monsoon dynamics | Ministry of Earth Sciences / NOAA PMEL |
| **Autonomous Ocean Gliders** | Sawtooth Subsurface Density Sections | Multiple | $0 - 1000\text{ m}$ | Green 3D vehicle markers showing frontal crossing missions | INCOIS Deep-Ocean Mission Glider Fleet |

---

## 4. Live Deployment & Public Access Links

| Environment | Access Link | Description |
| :--- | :--- | :--- |
| **Public Live URL** | **[https://riddance-majestic-backtalk.ngrok-free.dev](https://riddance-majestic-backtalk.ngrok-free.dev)** | Public HTTPS URL accessible from any computer, phone, or tablet |
| **Local Web Application** | **[http://localhost:5173/](http://localhost:5173/)** | Local Vite development client (fast 60 FPS rendering) |
| **Local Wi-Fi Network** | **`http://<YOUR-LOCAL-IP>:5173/`** | Testing on mobile devices or laptops connected to same Wi-Fi |
| **FastAPI Interactive Docs** | **[http://localhost:8000/docs](http://localhost:8000/docs)** | Complete Swagger UI for testing all 12 REST API endpoints |
| **Backend Health Check** | **[http://localhost:8000/api/health](http://localhost:8000/api/health)** | Live system telemetry and platform counts |
| **GitHub Repository** | **[https://github.com/skm127/OceanX](https://github.com/skm127/OceanX)** | Official open-source repository on branch `main` |

---

## 5. Complete Desktop Setup & Local Installation Guide

Follow these step-by-step instructions to clone, install, and run the entire platform on your personal machine.

### Prerequisites

Ensure the following tools are installed on your desktop or laptop:
* **Python**: `3.11` or `3.12` ([python.org](https://www.python.org/downloads/))
* **Node.js**: `18.x`, `20.x`, or `22.x` ([nodejs.org](https://nodejs.org/))
* **Git**: ([git-scm.com](https://git-scm.com/))
* *(Optional)* **Docker & Docker Compose**: If you prefer containerized deployment.

Verify your environment in terminal:
```bash
python --version   # Should output Python 3.11.x or 3.12.x
node -v           # Should output v18.x, v20.x, or v22.x
npm -v            # Should output 9.x or 10.x
git --version     # Should output 2.x
```

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/skm127/OceanX.git
cd OceanX
```

---

### Step 2: Set Up Python Backend

#### On Windows (PowerShell):
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1
# If PowerShell script execution is restricted, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### On Linux / macOS (Terminal):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 3: Dataset Ingestion (CMEMS, Argo GDAC ERDDAP, or Synthetic)

OCEAN-X comes pre-packaged with baseline CF-compliant NetCDF-4 model datasets in `data/`. You can refresh data at any time using the `refresh_model_data.py` CLI utility:

#### Option A: Fast Local Baseline (Offline / Hackathon Demo)
```bash
# Ingest or regenerate physics-grounded Indian Ocean baseline:
python scripts/refresh_model_data.py --source synthetic
```

#### Option B: Live Copernicus Marine Service (CMEMS) Ingestion
To fetch real global ocean physics analysis & forecast data:
1. Register for free at [marine.copernicus.eu](https://marine.copernicus.eu/).
2. Add your credentials to `backend/.env`:
   ```env
   COPERNICUS_USERNAME=your_username
   COPERNICUS_PASSWORD=your_password
   ```
3. Run the ingest script:
   ```bash
   python scripts/refresh_model_data.py --source cmems --days 7
   ```

#### Option C: Live Argo GDAC In-Situ Soundings from Ifremer ERDDAP
```bash
python scripts/refresh_model_data.py --source erddap --days 15
```

---

### Step 4: Run the Backend Server

From the `backend/` directory with your virtual environment active:
```bash
python -m uvicorn app.main:app --port 8000 --host 0.0.0.0 --reload
```

Verify backend health:
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 5: Set Up and Run the Frontend

Open a **new terminal window**:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host
```

The application will be accessible at:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

### Step 6 (Optional): Containerized Run via Docker Compose

If you have Docker installed and prefer a single-command setup:
```bash
docker compose up --build
```
This builds and launches both the frontend web app on port `5173` and the FastAPI backend on port `8000`.

---

## 6. Operational Manual (How to Operate Everything)

### 3D Globe Navigation & Camera Controls

| Action | Control | Description |
| :--- | :--- | :--- |
| **Orbit & Rotate Globe** | Left-Click + Drag | Freely rotate the 3D globe around any axis |
| **Zoom In / Out** | Mouse Wheel / Pinch | Zoom from global Indian Ocean perspective down to regional soundings |
| **Pan Camera** | Right-Click + Drag | Pan across the sea surface |
| **Adjust Camera Pitch** | Pitch Slider / On-Screen Dial | Tilt between top-down nadir view and dramatic 3D horizon perspective |
| **Reset to Top-Down Nadir** | Click Compass / Reset Button | Instantly aligns camera to North and restores optimal flat view |
| **Drop Sounding Probe** | Left-Click on Ocean | Drops a probe reticle and samples the model water column at that coordinate |
| **Contextual Dossier** | Right-Click on Ocean | Opens a full oceanographic regional dossier with nearby float telemetry |

---

## 7. Product Modes Walkthrough

Located in the top header bar, OCEAN-X features five specialized operational modes:

### 1. 🧑‍🔬 Research Workstation (Default Mode)
Designed for physical oceanographers and numerical modelers:
- Full 3D globe with interactive scalar layers (Temperature, Salinity).
- Animated current particle streamlines and directional vector cones.
- In-situ sensor markers with live depth soundings.
- Interactive depth scrubber (`Surface`, `50m`, `100m`, `200m`, `500m`).

### 2. 🚨 Operational Situation Room
Designed for disaster management authorities (NDRF, Indian Navy, Coast Guard):
- Real-time **Subsurface Marine Heatwave Alert Banner** highlighting trapped thermal anomalies.
- **Tropical Cyclone Heat Potential (TCHP)** monitoring to assess explosive cyclogenesis risk.
- Fleet readiness counter tracking all active observing sentinels.
- Collapsible C2 ticker to maximize 3D viewport visibility.

### 3. 📊 In-Situ Sounding Studio (Dedicated Full Page)
A dedicated, full-width analytical workstation:
- High-definition dual-curve vertical profile chart (0–500m) comparing Model vs Float.
- Translucent red polygon shading highlighting where divergence exceeds the threshold.
- Interactive hover crosshair inspector with real-time value readouts.
- Complete **70-layer data matrix** with depth search filter and one-click CSV export.
- 5D Isolation Forest feature breakdown and physical oceanography diagnosis.
- Platform selector to switch across all 14 fleet platforms instantly.

### 4. 🎓 Learn Story Journey
An educational walkthrough explaining physical oceanography to non-specialists:
- **Step 1: The Dual-Basin Engine**: Contrasts the saline Arabian Sea with the freshwater-capped Bay of Bengal.
- **Step 2: The Underwater Thermocline**: Explains the sharp temperature boundary separating warm surface water from deep cold layers.
- **Step 3: Autonomous In-Situ Sentinels**: Demonstrates how Argo floats anchor numerical models to ground truth.
- **Step 4: Subsurface Heatwaves & Cyclones**: Illustrates why surface satellite skin temperature alone is insufficient.

### 5. 🗂️ Data Manager Mode
An operational metadata inspector for scientific validation:
- **CF-1.8 NetCDF Metadata**: Inspects coordinate dimensions, global attributes, and grid resolution.
- **Platform Registry**: Table of all registered observing platforms with WMO IDs, sampling frequencies, and sensors.
- **Pipeline Telemetry**: Monitors binary slice latency, server cache hits, and data freshness.

---

## 8. Advanced Analytical Workstations

### 4D Spatial Co-Location Studio (`ANALYSIS ▾` -> `Co-Location Engine`)
- Finds all in-situ platforms within a customizable search radius ($25 - 250\text{ km}$) and time window ($\pm 1 - 7\text{ days}$).
- Performs horizontal 2D bilinear interpolation and vertical 1D piecewise linear interpolation at the exact float coordinates.
- Generates quantitative validation metrics: Root Mean Square Error (RMSE), mean forecast bias, and match confidence scores.

### 2D Vertical Transect Cross-Section (Hotkey `T`)
- Draws a vertical cross-section slice between any two geographic coordinates (or choose presets like Chennai -> Port Blair).
- Visualizes thermocline slope, internal waves, and vertical stratification down to 500 m.

### Basin Regional Analytics (Hotkey `R`)
- Draws a geographic bounding box over any basin area.
- Computes surface area ($\text{km}^2$), minimum, maximum, mean, and standard deviation, accompanied by value distribution histograms.

### Grounded AI Ocean Analyst (Hotkey `A`)
- Residual-grounded natural language diagnostic engine that synthesizes physical oceanography observations into natural language briefings.

---

## 9. Keyboard Shortcuts Matrix

| Hotkey | Action | Description |
| :---: | :--- | :--- |
| `1` | **All India Domain** | Jumps 3D camera to national overview |
| `2` | **Arabian Sea Basin** | Jumps 3D camera to Arabian Sea |
| `3` | **Bay of Bengal Basin** | Jumps 3D camera to Bay of Bengal |
| `4` | **Critical Thermal Anomaly** | Targets Argo Float `#2902345` with subsurface heatwave |
| `5` | **Equatorial Indian Ocean** | Jumps 3D camera to equatorial waters |
| `C` | **Toggle Ocean Currents** | Switches animated particle streamlines and vector cones ON / OFF |
| `L` | **Toggle Scientific Layer Rail** | Opens or collapses left-side layer controls |
| `T` | **Vertical Transect Tool** | Opens 2D depth-distance cross-section modal |
| `R` | **Basin Regional Analytics** | Opens bounding box statistics and histogram tool |
| `P` | **Vertical Sounding HUD** | Toggles dual-curve depth sounding profile |
| `A` | **Grounded AI Analyst** | Opens natural language ocean diagnostic engine |
| `F` | **Fleet Registry** | Opens in-situ multi-sensor fleet drawer |
| `B` | **Mission Briefing** | Opens SIH 2026 PS26067 evaluation guide |
| `⌘K` / `Ctrl+K` | **Global Search** | Searches regions, floats, and coordinates |
| `?` | **Shortcuts Legend** | Displays complete keyboard shortcuts guide |
| `Esc` | **Dismiss Overlays** | Closes any active modal or returns to 3D globe |

---

## 10. Engineering Challenges & War Stories ("How We Built It")

### 1. The Binary Slice Optimization (72 KB IEEE 754 vs 400 KB JSON)
- **Problem**: Serializing 2D ocean model slices ($161 \times 113 = 18,193$ floats) to JSON generated payloads exceeding 420 KB per time step. Slicing through depth levels caused garbage collection stutter and dropped frame rates below 20 FPS.
- **Solution**: Engineered a zero-copy binary streaming endpoint (`/api/model/slice`) returning raw IEEE 754 float32 buffers via `application/octet-stream` ($72.7\text{ KB}$). The client instantiates a `Float32Array` directly from the `ArrayBuffer` and uploads it to a `THREE.DataTexture` on the GPU in under $15\text{ ms}$.

### 2. 4D Spatiotemporal Co-Location across Irregular Grids
- **Problem**: Models output on structured rectangular coordinate grids, while drifting floats sample at irregular, continuous physical depths. Comparing coarse grid centroids created substantial displacement error.
- **Solution**: Implemented 4D co-location in `analytics.py` combining spherical Haversine distance filtering ($\le 250\text{ km}$), 2D bilinear spatial interpolation, and vertical piecewise linear interpolation to calculate authentic RMSE and bias.

### 3. Detecting Trapped Subsurface Marine Heatwaves
- **Problem**: Surface satellites only observe skin temperature ($<1\text{ mm}$). Mesoscale eddies frequently trap massive heat anomalies 100 meters underwater with zero surface signature.
- **Solution**: Trained an unsupervised `IsolationForest` model on 5D vertical feature vectors ($[\Delta T_{\text{mean}}, \Delta T_{\max}, \Delta Q_{200\text{m}}, \nabla T_{\text{thermocline}}, z_{\text{div}}]$) to autonomously detect subsurface thermal traps.

### 4. Zero-Drift Offline Simulation Fallback
- **Problem**: Network connectivity during hackathon judging and offshore operations is frequently unreliable.
- **Solution**: Implemented `mockFallback.ts`, mirroring all physical equations (Hobday MHW tiers, $D_{26}$ isotherm integration, Haversine distance) directly in client-side TypeScript. If the backend drops offline, the client transitions seamlessly to simulation mode without crashing, displaying the amber `[ ◆ SIMULATED DATA ]` badge for scientific transparency.

---

## 11. Troubleshooting & FAQ

### Port 8000 or 5173 already in use
* **Windows**: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
* **Linux / macOS**: `lsof -i :8000` then `kill -9 <PID>`
* Or launch uvicorn on another port: `uvicorn app.main:app --port 8005 --reload` (and update `VITE_API_URL` in `frontend/.env`).

### Black or empty globe in browser
* Verify WebGL support at [get.webgl.org](https://get.webgl.org/).
* Ensure hardware acceleration is enabled in your browser settings (`Settings` -> `System` -> `Use graphics acceleration when available`).
* Confirm texture files exist in `frontend/public/textures/`.

---

## 12. Project Structure & Technology Stack

```
OceanX/
├── .github/workflows/ci.yml        # Automated GitHub Actions CI pipeline
├── backend/                        # FastAPI Python 3.11 backend
│   ├── app/
│   │   ├── main.py                 # FastAPI application factory & routes
│   │   ├── config.py               # Pydantic configuration settings
│   │   ├── models/schemas.py       # Pydantic request/response schemas
│   │   ├── routers/                # REST API endpoint modules
│   │   │   ├── model_data.py       # Binary depth slices & current vectors
│   │   │   ├── observations.py     # Argo floats, OMNI buoys, Gliders
│   │   │   ├── comparison.py       # Dual-curve sounding comparison
│   │   │   ├── anomaly.py          # Isolation Forest ML anomaly scoring
│   │   │   └── analytics.py        # Co-location, TCHP, transects, stats
│   │   ├── services/               # Computation & data services
│   │   │   ├── netcdf_service.py   # xarray reader & bilinear interpolation
│   │   │   ├── argo_service.py     # In-situ sensor network repository
│   │   │   ├── anomaly_service.py  # Scikit-learn ML anomaly engine
│   │   │   ├── cache_service.py    # In-memory LRU + Redis multi-tier cache
│   │   │   └── ai_service.py       # Grounded diagnostic synthesizer
│   │   └── ingestion/              # Live data fetchers
│   │       ├── copernicus_ingest.py # CMEMS subset fetcher
│   │       └── argo_ingest.py      # Ifremer GDAC ERDDAP fetcher
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Container definition
│
├── frontend/                       # React 19 + TypeScript + Vite client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe/              # Three.js 3D visualization components
│   │   │   │   ├── Globe.tsx       # Core Canvas & Earth mesh
│   │   │   │   ├── OceanDataLayer.tsx # WebGL surface colormap raster
│   │   │   │   ├── CurrentVectors.tsx # Particle streamlines & arrow cones
│   │   │   │   └── ArgoMarkers.tsx # 3D buoys, floats, and glider markers
│   │   │   ├── Controls/           # Navigation & toolbars
│   │   │   │   ├── ProductModeSelector.tsx # 5-Mode switcher
│   │   │   │   ├── SectorNavigator.tsx     # Compact basin jump dropdown
│   │   │   │   ├── ControlBar.tsx          # Depth, variable, timeline bar
│   │   │   │   └── LayerRail.tsx           # Scientific layer controls
│   │   │   └── Panels/             # Modals and dedicated workstations
│   │   │       ├── SoundingStudioPage.tsx  # Dedicated full-page sounding studio
│   │   │       ├── ComparisonPanel.tsx     # Docked comparison drawer
│   │   │       ├── OperationalSituationRoom.tsx # C2 disaster dashboard
│   │   │       ├── TCHPInspectorCard.tsx   # Cyclone heat potential inspector
│   │   │       ├── CoLocationModal.tsx     # 4D spatial co-location engine
│   │   │       ├── TransectModal.tsx       # 2D cross-section viewer
│   │   │       ├── RegionAnalysisModal.tsx # Bounding box statistics
│   │   │       ├── DataManagerModal.tsx    # CF-1.8 NetCDF inspector
│   │   │       └── LearnStoryJourney.tsx   # Guided educational tour
│   │   ├── hooks/                  # Custom React hooks (useOceanData, etc.)
│   │   ├── services/               # API clients with offline simulation fallback
│   │   └── utils/                  # Coordinate projections & scientific colormaps
│   ├── package.json
│   └── vite.config.ts
│
├── data/                           # CF-1.8 NetCDF & in-situ datasets
│   ├── model/sample_bob_model.nc
│   └── argo/sample_argo_profiles.nc
│
├── scripts/
│   ├── refresh_model_data.py       # Data refresh utility (CMEMS, ERDDAP, Synthetic)
│   └── generate_sample_data.py     # Synthetic ocean model generator
├── docker-compose.yml              # Multi-container orchestration
└── README.md                       # Comprehensive platform documentation
```

---

## 13. Citation & Acknowledgments

* **Ministry of Earth Sciences — Indian National Centre for Ocean Information Services (INCOIS)**, Hyderabad, Government of India.
* **International Argo Program** and the national data assembly centres.
* **Copernicus Marine Environment Monitoring Service (CMEMS)** for numerical physics references.
* Built for **Smart India Hackathon (SIH 2026)** — Problem Statement `SIH26067`.
