# OCEAN-X (SAGAR-VIEW)
### 3D Ocean Intelligence & In-Situ Observation Platform

[![SIH 2026](https://img.shields.io/badge/SIH%202026-PS26067-0284c7.svg)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Ministry%20of%20Earth%20Sciences-INCOIS-0ea5e9.svg)](https://incois.gov.in)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-38bdf8.svg)](https://python.org)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Three.js%20%7C%20Vite-10b981.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20xarray-0284c7.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

Interactive 3D workstation built for the **Ministry of Earth Sciences — Indian National Centre for Ocean Information Services (INCOIS)** under Smart India Hackathon 2026 (Problem Statement `SIH26067`).

OCEAN-X bridges the gap between numerical 4D ocean models (such as NEMO or ROMS) and sparse in-situ observational networks across the Indian Ocean (Argo profiling floats, OMNI moored buoys, RAMA equatorial moorings, and underwater gliders). It allows oceanographers, forecasters, and disaster management authorities to interrogate underwater stratification, detect subsurface marine heatwaves, and validate model forecasts against physical observations in real time.

---

## Architecture Overview

```
                         OCEAN-X SYSTEM ARCHITECTURE

  +-------------------------------------------------------------------------+
  |                             CLIENT VIEWPORT                             |
  |  React 19 + TypeScript + Vite + Three.js / React Three Fiber            |
  |                                                                         |
  |  - 4 Product Modes: Research, Ops Room, Educational Journey, Data Mgr  |
  |  - 3D Globe: Satellite Earth + Custom WebGL DataTexture Colormaps (60 FPS)|
  |  - Vector Dynamics: Streaming particle streamlines & 3D arrow cones   |
  |  - In-Situ Network: Argo floats (cyan), OMNI buoys (gold), Gliders     |
  |  - Depth Soundings: Inverted depth-temperature / salinity profiles      |
  |  - Analysis Tools: 2D Vertical Transects, Basin Bounding Box Stats      |
  |  - Spatial Co-Location Studio: Radius & temporal matching engine        |
  +------------------------------------|------------------------------------+
                                       |
                     REST API / Raw Float32Array Slices
                                       |
  +------------------------------------v------------------------------------+
  |                             FASTAPI SERVER                              |
  |  Python 3.11+ / Uvicorn / Async Endpoints                               |
  |                                                                         |
  |  - /api/model/slice: Binary depth slice streaming (<50ms delivery)     |
  |  - /api/model/currents: Subsampled velocity grid (uo, vo, speed)        |
  |  - /api/observations: Unified Argo + OMNI/RAMA buoys + Glider registry  |
  |  - /api/analytics/colocate: Haversine distance + 2D bilinear grid match |
  |  - /api/anomaly: Scikit-learn Isolation Forest on 5D feature vectors    |
  |  - /api/ai/analyze: Residual-grounded natural language synthesizer      |
  +------------------------------------|------------------------------------+
                                       |
                             In-Memory xarray Engine
                                       |
  +------------------------------------v------------------------------------+
  |                          DATA STORAGE LAYER                             |
  |  - data/model/sample_bob_model.nc (CF-1.8 Compliant NetCDF-4)           |
  |  - data/argo/sample_argo_profiles.nc (WMO Standard In-Situ Profiles)    |
  +-------------------------------------------------------------------------+
```

### Core Technical Decisions

1. **Server-Side Subsetting over Full Cube Transmission**:
   Numerical ocean models produce tens to hundreds of gigabytes of data. Instead of transmitting heavy NetCDF or Zarr chunks to the browser, the FastAPI backend subsets the active time step and depth level server-side using `xarray`. It streams raw `Float32Array` binary buffers via `application/octet-stream` with grid dimensions and metadata exposed in HTTP headers (`X-Width`, `X-Height`, `X-Min`, `X-Max`).
2. **GPU Texture Mapping for 60 FPS Globe Interaction**:
   The client receives the binary buffer, maps scalar values through an oceanographic colormap (e.g. Temperature navy-to-red or Salinity teal-to-navy), generates a `THREE.DataTexture`, and projects it onto a curved spherical patch slightly above the globe surface (`GLOBE_RADIUS + 0.014`) with custom blending.
3. **Multi-Sensor INCOIS Network Support**:
   Supports four distinct oceanographic platforms:
   - **Argo Profiling Floats**: Autonomous drifting floats cycling between surface and 2,000 m.
   - **INCOIS OMNI Moored Buoys**: Deep-sea surface buoys (e.g. BD08, BD11 in the Bay of Bengal; AD02, AD07 in the Arabian Sea) recording meteorology and upper-ocean thermistor chains.
   - **RAMA Equatorial Moorings**: Research Moored Array across the tropical Indian Ocean monitoring air-sea interactions.
   - **Ocean Gliders**: Autonomous buoyancy-driven vehicles executing sawtooth transects across frontal zones.
4. **Authentic Anomaly Detection (No Fake Hardcoded Rules)**:
   Subsurface anomalies are classified using a trained `scikit-learn` `IsolationForest` model fitted on 5-dimensional feature vectors: mean temperature delta, maximum vertical delta, 200 m integrated heat divergence, thermocline gradient anomaly, and divergence depth.

---

## Desktop Setup Guide

Follow these instructions to run the entire stack locally on your machine.

### Prerequisites

Ensure you have the following installed:
* **Python**: `3.11` or `3.12` ([python.org](https://www.python.org/downloads/))
* **Node.js**: `18.x`, `20.x`, or `22.x` ([nodejs.org](https://nodejs.org/))
* **Git**: ([git-scm.com](https://git-scm.com/))
* *(Optional)* **Docker & Docker Compose**: If you prefer containerized execution.

Verify versions in your terminal:
```bash
python --version
node -v
npm -v
git --version
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

# Create a virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1
# Note: If PowerShell blocks script execution, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### On Linux / macOS (Bash):

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 3: Verify or Generate Dataset

The repository comes pre-packaged with sample CF-compliant NetCDF-4 model datasets in the `data/` directory. If you ever need to regenerate fresh synthetic datasets:

```bash
# From the project root with the virtual environment activated:
python scripts/generate_sample_data.py
```

This creates:
* `data/model/sample_bob_model.nc` — 4D hydrodynamic model grid ($113 \times 161$ spatial cells, 14 depth levels, 7 time steps, including variables `thetao`, `so`, `uo`, `vo`).
* `data/argo/sample_argo_profiles.nc` — In-situ vertical soundings with temperature, salinity, and WMO quality control flags.

---

### Step 4: Run the Backend Server

From the `backend/` directory with your virtual environment active:

```bash
python -m uvicorn app.main:app --port 8000 --host 0.0.0.0 --reload
```

Verify backend health in your browser or terminal:
* Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
* Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* Model Metadata: [http://localhost:8000/api/model/info](http://localhost:8000/api/model/info)

---

### Step 5: Set Up and Run the Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will start at:
* Local URL: **[http://localhost:5173/](http://localhost:5173/)**

Open that URL in Google Chrome, Mozilla Firefox, or Microsoft Edge.

---

## Running with Docker (Alternative)

If you have Docker installed and prefer a single-command setup:

```bash
# Build and run backend + frontend containers
docker compose up --build
```

Services will be accessible at:
* **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
* **FastAPI Backend API**: [http://localhost:8000](http://localhost:8000)
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers:
```bash
docker compose down
```

---

## Product Modes Walkthrough

OCEAN-X features four specialized operational views selectable from the top navigation bar:

### 1. Research Workstation
The primary diagnostic interface for physical oceanographers:
* **Interactive 3D Globe**: Left-click anywhere on the ocean to drop a sounding probe reticle. Right-click to open a comprehensive regional dossier.
* **Vertical Sounding HUD**: Compares numerical model output against in-situ float data down to 500 m depth.
* **Depth Scrubber**: Toggle presets (`Surface`, `50m`, `100m`, `200m`, `500m`) or use the continuous depth slider to slice the ocean subsurface.
* **Ocean Currents**: Toggle particle streamlines showing current direction, speed, and circulation gyres across the Bay of Bengal and Arabian Sea.
* **Vertical Transect Tool (`T`)**: Draw a cross-section line across any two coordinates to inspect internal waves, thermocline slope, and water column stratification.
* **Basin Analytics (`R`)**: Draw a bounding box to inspect statistical distributions, surface area calculations, and value histograms.

### 2. Operational Situation Room
Designed for emergency management, coast guards, and cyclone forecasting:
* **Subsurface Marine Heatwave Alert**: Highlights trapped subsurface thermal anomalies (such as Float `#2902345` with $+3.22^\circ\text{C}$ excess heat at 110 m depth).
* **Tropical Cyclone Heat Potential (TCHP)**: Monitors upper-ocean heat reservoirs ($>78\text{ kJ/cm}^2$) capable of rapid cyclone intensification.
* **Fleet Readiness**: Live telemetry synchronization counter tracking active Argo floats, moored buoys, and gliders.
* **Collapsible Ticker**: Toggle between a detailed status view and a compact 1-line mission ticker to maximize 3D globe visibility.

### 3. Learn Story Journey
An educational walkthrough introducing non-specialists to physical oceanography:
* **Step 1: The Dual-Basin Engine**: Contrasts the saline Arabian Sea with the freshwater-capped Bay of Bengal.
* **Step 2: The Underwater Thermocline**: Explains the sharp temperature boundary separating warm surface water from deep cold layers.
* **Step 3: In-Situ Autonomous Sentinels**: Demonstrates how Argo floats and moored buoys anchor numerical models to ground truth.
* **Step 4: Subsurface Heatwaves & Cyclones**: Illustrates why surface satellite skin temperature alone is insufficient for predicting severe weather.

### 4. Data Manager
An operational metadata inspector for scientific validation:
* **CF-1.8 NetCDF Metadata**: Inspects global attributes, coordinate variables, spatial resolution, and time dimensions.
* **Platform Registry**: Table of all registered observing platforms with WMO IDs, basin assignments, sampling rates, and sensor payloads.
* **Pipeline Telemetry**: Monitors binary slice latency, server cache hits, and data freshness.

---

## Spatial Co-Location Studio

Located under **`ANALYSIS ▾` -> `Co-Location Engine`**:
* **Haversine Distance Matching**: Finds all in-situ platforms within a customizable search radius ($25 - 250\text{ km}$).
* **Temporal Coincidence**: Matches observations within a user-defined time window ($\pm 1 - 7\text{ days}$).
* **Bilinear Spatial Interpolation**: Interpolates model values at the exact float coordinates rather than using coarse grid-box centroids.
* **Statistical Metrics**: Calculates Root Mean Square Error (RMSE), mean bias, maximum divergence, and overall match confidence score.

---

## Keyboard Shortcuts

| Key | Function |
| :---: | :--- |
| `1` | Jump camera to **All India Domain** |
| `2` | Jump camera to **Arabian Sea Basin** |
| `3` | Jump camera to **Bay of Bengal Basin** |
| `4` | Focus camera on **Critical Thermal Anomaly** (`#2902345`) |
| `5` | Jump camera to **Equatorial Indian Ocean** |
| `C` | Toggle **Ocean Current Vectors & Streamlines** (ON / OFF) |
| `L` | Toggle **Scientific Layer Rail** drawer (ON / OFF) |
| `T` | Open **2D Vertical Transect Cross-Section** tool |
| `R` | Open **Basin Regional Analytics** tool |
| `A` | Open **Grounded AI Ocean Analyst** |
| `F` | Open **In-Situ Multi-Sensor Fleet** drawer |
| `P` | Toggle **Vertical Profile Sounding HUD** |
| `B` | Open **Scientific Mission Briefing** |
| `⌘K` / `Ctrl+K` | Open **Global Reconnaissance Search** |
| `?` | Show **Keyboard Shortcuts Legend** |
| `Esc` | Close all active modal dialogs and side drawers |

---

## Configuration & Environment Variables

Default configurations are defined in `backend/app/config.py`. You can override them by creating a `.env` file in the `backend/` directory:

```env
# backend/.env
APP_NAME=OCEAN-X API
DEBUG=false
DATA_DIR=../data
MODEL_DATA_PATH=../data/model/sample_bob_model.nc
ARGO_DATA_PATH=../data/argo/sample_argo_profiles.nc
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend environment variables (optional) can be placed in `frontend/.env`:
```env
# frontend/.env
VITE_API_URL=http://localhost:8000
```
*(If omitted, Vite defaults to calling the local backend at `http://localhost:8000`).*

---

## Verification & Testing

### 1. Automated Frontend Build Check
Ensure TypeScript compiles with zero errors and assets bundle cleanly:
```bash
cd frontend
npm run build
```
Expected output: `✓ built in ~1.5s` with zero errors.

### 2. Backend Health Verification
```bash
curl http://localhost:8000/api/health
```
Expected JSON response:
```json
{
  "status": "healthy",
  "app_name": "OCEAN-X API",
  "data_loaded": true,
  "profiles_count": 8,
  "buoys_count": 5,
  "gliders_count": 1
}
```

### 3. Binary Slice Test
Verify the high-efficiency binary depth slice endpoint returns valid IEEE 754 float arrays:
```bash
curl -I "http://localhost:8000/api/model/slice?variable=thetao&depth=0&time_index=0"
```
Headers should contain:
```http
HTTP/1.1 200 OK
content-type: application/octet-stream
x-width: 161
x-height: 113
x-min: 25.867
x-max: 29.524
```

---

## Troubleshooting Guide

### Port 8000 or 5173 Already in Use
* **Port 8000**: Another process is using FastAPI's default port.
  * Windows: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
  * Linux/macOS: `lsof -i :8000` then `kill -9 <PID>`
  * Or start uvicorn on another port: `uvicorn app.main:app --port 8005 --reload` (and set `VITE_API_URL=http://localhost:8005` in `frontend/.env`).
* **Port 5173**: Vite will automatically offer port 5174 if 5173 is occupied.

### Missing `netCDF4` or `HDF5` Library Errors on Linux/macOS
If `pip install -r requirements.txt` fails compiling `netcdf4`:
* Ubuntu/Debian: `sudo apt-get install libnetcdf-dev libhdf5-dev`
* macOS (Homebrew): `brew install netcdf hdf5`
* Alternatively, use conda: `conda install -c conda-forge netcdf4 xarray`

### Black / Empty Globe in Browser
* Check your browser's WebGL support at [get.webgl.org](https://get.webgl.org/).
* Ensure hardware acceleration is enabled in your browser settings (`Settings` -> `System` -> `Use graphics acceleration when available`).
* If textures fail to load, ensure the files in `frontend/public/textures/` (`earth_atmos_2048.jpg`, etc.) are present and accessible.

---

## Directory Structure

```
OceanX/
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── main.py                 # Application factory & CORS setup
│   │   ├── config.py               # Pydantic environment configuration
│   │   ├── routers/                # API endpoint modules
│   │   │   ├── model_data.py       # Slices, currents, and grid info
│   │   │   ├── observations.py     # Argo, buoys, gliders endpoints
│   │   │   ├── comparison.py       # Observation vs model comparison
│   │   │   ├── anomaly.py          # Isolation Forest ML pipeline
│   │   │   └── analytics.py        # Co-location, transect, region stats
│   │   └── services/               # Core data computation services
│   │       ├── netcdf_service.py   # xarray reader & bilinear interpolation
│   │       ├── argo_service.py     # In-situ sensor network repository
│   │       ├── anomaly_detector.py # scikit-learn ML anomaly engine
│   │       └── ai_service.py       # Grounded diagnostic synthesizer
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Production backend container
│
├── frontend/                       # React 19 + Three.js application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe/              # 3D visualization components
│   │   │   │   ├── Globe.tsx       # Core Canvas & Earth mesh
│   │   │   │   ├── OceanDataLayer.tsx # WebGL surface colormap raster
│   │   │   │   ├── CurrentVectors.tsx # Particle streamlines & arrow cones
│   │   │   │   └── ArgoMarkers.tsx # 3D buoys, floats, and glider markers
│   │   │   ├── Controls/           # Navigation & toolbars
│   │   │   │   ├── ProductModeSelector.tsx # 4-Mode switcher
│   │   │   │   ├── SectorNavigator.tsx     # Compact basin jump dropdown
│   │   │   │   ├── ControlBar.tsx          # Depth, variable, timeline bar
│   │   │   │   └── LayerRail.tsx           # Scientific layer controls
│   │   │   └── Panels/             # Modals and analysis drawers
│   │   │       ├── OperationalSituationRoom.tsx # C2 disaster dashboard
│   │   │       ├── CoLocationModal.tsx          # Spatial co-location engine
│   │   │       ├── ComparisonPanel.tsx          # Dual-curve sounding drawer
│   │   │       ├── TransectModal.tsx            # 2D cross-section viewer
│   │   │       ├── RegionAnalysisModal.tsx      # Bounding box statistics
│   │   │       ├── DataManagerModal.tsx         # CF-1.8 NetCDF inspector
│   │   │       └── LearnStoryJourney.tsx        # Guided educational tour
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
│   └── generate_sample_data.py     # Synthetic ocean model generator
├── docker-compose.yml              # Multi-container orchestration
└── README.md                       # Platform documentation
```

---

## Citation & Acknowledgments

* **Indian National Centre for Ocean Information Services (INCOIS)**, Ministry of Earth Sciences, Government of India.
* **International Argo Program** and the national data centers for ocean profile measurements.
* **Copernicus Marine Environment Monitoring Service (CMEMS)** for numerical physics references.
* Developed for **Smart India Hackathon (SIH 2026)** — Problem Statement `SIH26067`.
