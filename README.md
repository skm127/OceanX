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

### Step 3: Dataset Ingestion (CMEMS, Argo GDAC ERDDAP, or Synthetic)

The repository comes pre-packaged with CF-compliant NetCDF-4 model datasets in the `data/` directory. OCEAN-X supports three automated ingestion pipelines via the `refresh_model_data.py` CLI utility:

#### Option A: Quick-Start with Pre-Packaged / Synthetic Baseline
If you are presenting or testing offline without external API credentials:
```bash
# Ingest or regenerate physics-grounded Indian Ocean baseline (0-28°N, 60-100°E, 0-500m):
python scripts/refresh_model_data.py --source synthetic
```

#### Option B: Live Copernicus Marine Service (CMEMS) Ingestion
To fetch real Copernicus Global Ocean Physics Analysis and Forecast (`cmems_mod_glo_phy_anfc_0.083deg_P1D-m`):
1. Sign up for free at [marine.copernicus.eu](https://marine.copernicus.eu/).
2. Add your credentials to `backend/.env`:
   ```env
   COPERNICUS_USERNAME=your_copernicus_username
   COPERNICUS_PASSWORD=your_copernicus_password
   ```
3. Run the automated subset fetcher:
   ```bash
   python scripts/refresh_model_data.py --source cmems --days 7
   ```
   *Fetches daily mean potential temperature (`thetao`), practical salinity (`so`), and zonal/meridional velocities (`uo`, `vo`) bounded to the Indian Ocean domain down to 500 m depth.*

#### Option C: Live Argo GDAC In-Situ Soundings from Ifremer ERDDAP
To ingest live profiling floats cycling in the Arabian Sea and Bay of Bengal:
```bash
python scripts/refresh_model_data.py --source erddap --days 15
```
*Queries the Ifremer GDAC ERDDAP server (`erddap.ifremer.fr`), downloads valid WMO NetCDF profiles within the spatial bounding box, and parses temperature, salinity, and quality flags (QC=1/2).*

#### Option D: Ingest All Live Streams
```bash
python scripts/refresh_model_data.py --source all --days 7
```

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

## Tropical Cyclone Heat Potential (TCHP) & Marine Heatwaves

A cornerstone feature addressing INCOIS's operational mandate for early cyclone warnings and severe weather diagnostics in the Bay of Bengal and Arabian Sea.

### Why Sea Surface Temperature (SST) Alone is Deceptive
Satellite radiometers only sense the top skin layer of the ocean ($<1\text{ mm}$). When a tropical cyclone forms, violent surface winds induce turbulent vertical mixing that upwells deeper water. If the subsurface thermocline is shallow and cold, this upwelling cools the sea surface and chokes the cyclone's thermodynamic engine. Conversely, if a thick, warm upper-ocean layer exists, upwelling only circulates warm water, providing an uninterrupted thermal reservoir that fuels **Rapid Intensification (RI)** (as seen in Cyclones Fani, Amphan, and Mocha).

### Mathematical Formulation
OCEAN-X computes the Upper Ocean Heat Content (UOHC) / Tropical Cyclone Heat Potential ($Q_{\text{TCHP}}$) integrated from the surface down to the $26^\circ\text{C}$ isotherm depth ($D_{26}$):

$$Q_{\text{TCHP}} = \rho C_p \int_{0}^{D_{26}} (T(z) - 26) \, dz$$

Where:
* $\rho = 1025\text{ kg/m}^3$ (reference density of sea water)
* $C_p = 3985\text{ J}/(\text{kg}\cdot^\circ\text{C})$ (specific heat capacity of seawater)
* $\rho C_p \approx 0.4085\text{ kJ}/(\text{cm}^2 \cdot \text{m} \cdot ^\circ\text{C})$ (volumetric heat conversion factor)
* $D_{26}$ is the depth where $T(z) = 26^\circ\text{C}$, computed via vectorized piecewise linear interpolation along each vertical sounding column.

### Operational Alert Thresholds
* **$Q_{\text{TCHP}} < 50\text{ kJ/cm}^2$**: Baseline / Low Cyclogenesis Risk.
* **$Q_{\text{TCHP}} \ge 50\text{ kJ/cm}^2$**: **INCOIS Rapid Intensification Alert Threshold**. Waters capable of supporting rapid cyclone intensification within 24–48 hours.
* **$Q_{\text{TCHP}} \ge 80\text{ kJ/cm}^2$**: Severe / Extreme Tropical Cyclone Heat Reservoir.

### Marine Heatwave (MHW) Categorization (Hobday et al., 2016)
In addition to integral heat content, OCEAN-X classifies surface thermal divergence into standard international marine heatwave severity tiers:
* **Category I (Moderate)**: $T_{\text{SST}} - T_{\text{clim}} \ge 1.0 \times \Delta T_{\text{threshold}}$
* **Category II (Strong)**: $\ge 2.0 \times \Delta T_{\text{threshold}}$
* **Category III (Severe)**: $\ge 3.0 \times \Delta T_{\text{threshold}}$
* **Category IV (Extreme)**: $\ge 4.0 \times \Delta T_{\text{threshold}}$

### Interactive HUD & 3D GPU Colormap
* **Layer Rail Toggle**: Accessible via hotkey `L` under "Cyclone Heat Potential (TCHP)". Includes a quick preset for "Bay of Bengal Cyclone Season View".
* **3D Globe Projection**: Evaluated across 18,000+ grid points in $<40\text{ ms}$ on the FastAPI backend and rendered on the 3D globe via a custom high-contrast color ramp.
* **Point Inspection HUD**: Left-clicking any cell on the globe pops up the **TCHP Inspector Card** showing exact coordinates, $Q_{\text{TCHP}}$ value, $D_{26}$ depth, SST, MHW category, and operational cyclone risk guidance.

---

## Data Provenance & Multi-Tier Caching

Scientific trustworthiness is the foundation of OCEAN-X. Forecasters and researchers must know at all times whether they are looking at real operational data or simulated baselines.

### The `DataSourceBadge` Indicator
Located prominently in the top header:
* **`[ ● LIVE INCOIS ]` (Green/Emerald)**: Connected to the live FastAPI backend. Shows active NetCDF dataset name, spatial resolution ($0.25^\circ$), number of depth slices ($14$), and registered multi-sensor platforms ($14$).
* **`[ ◆ SIMULATED DATA ]` (Amber)**: Clear visual notification when operating in offline client-side simulation fallback. Clicking the badge opens a diagnostics popover allowing the user to inspect latency or force an immediate reconnect attempt.

### Multi-Tier Caching Architecture
To maintain instantaneous 60 FPS client responsiveness:
1. **Tier 1 (Client-Side In-Memory Cache)**: Depth slices and soundings are memoized in React state, preventing duplicate network fetches during orbit and pan operations.
2. **Tier 2 (Server-Side In-Memory LRU Cache)**: High-frequency analytical requests (`/transect`, `/colocate`, `/region/stats`, `/heat-potential`) are cached in an in-memory thread-safe LRU store with a 15-minute TTL.
3. **Tier 3 (Optional Redis Cache)**: If Redis is available, server-side caching automatically delegates to Redis for multi-worker deployments.

---

## "How We Built It" — Technical Challenges & War Stories

Building a browser-native 3D oceanographic workstation that unifies numerical models and sparse in-situ sensors required solving four fundamental engineering challenges:

### 1. The Binary Slice Optimization (72 KB IEEE 754 vs 400 KB JSON)
* **The Problem**: A single 2D depth slice of the Bay of Bengal model spans $161 \times 113$ grid cells ($18,193$ floating-point values). Serializing this to JSON resulted in a $\sim 420\text{ KB}$ text payload per request. Slicing through 14 depth levels or animating time steps created heavy garbage collection pauses and dropped browser frame rates below 20 FPS.
* **The Solution**: We engineered a zero-copy binary streaming pipeline (`/api/model/slice`). The backend extracts the `xarray.DataArray`, flattens it to a continuous C-contiguous array of 32-bit floats, and streams it as `application/octet-stream` ($72.7\text{ KB}$ raw binary). Grid dimensions ($X, Y$) and value ranges ($V_{\min}, V_{\max}$) are passed in HTTP headers (`x-width`, `x-height`, `x-min`, `x-max`). The frontend reads the raw `ArrayBuffer` directly into a `Float32Array` and uploads it to a `THREE.DataTexture` on the GPU in under $15\text{ ms}$.

### 2. 4D Spatiotemporal Co-Location across Irregular Grids
* **The Problem**: Numerical ocean models define regular lat/lon coordinate matrices with discrete vertical sigma/z-levels ($0, 10, 20, 50, 100\dots 500\text{ m}$). Conversely, drifting Argo floats and moored buoys record continuous physical soundings at irregular, unaligned depths. Determining whether a float observation validates or contradicts a model grid cell required accurate spatial and vertical interpolation.
* **The Solution**: We implemented a 4D co-location pipeline in `analytics.py`. First, it filters platforms within a spherical Haversine distance radius ($\le 250\text{ km}$) and temporal window ($\le \pm 168\text{ h}$). For each candidate, it extracts the 4 bounding model grid cells and performs 2D bilinear interpolation horizontally, followed by 1D piecewise linear interpolation vertically. This yields real, authentic Root Mean Square Error (RMSE), mean bias, and match confidence scores without bias from grid-box centroid displacement.

### 3. Detecting Trapped Subsurface Marine Heatwaves
* **The Problem**: Satellite infrared and microwave radiometers only penetrate the top millimeter of the sea surface. Mesoscale cyclonic and anticyclonic eddies frequently trap immense heat anomalies deep in the thermocline ($80 - 160\text{ m}$) with virtually zero surface temperature signature. Rule-based surface thresholding missed these critical hazard areas completely.
* **The Solution**: We trained an unsupervised `scikit-learn` `IsolationForest` model on 5-dimensional vertical feature vectors:
  $$\vec{F} = \left[ \overline{\Delta T}, \, \max(\Delta T), \, \Delta Q_{200\text{m}}, \, \frac{\partial \Delta T}{\partial z}, \, z_{\text{div}} \right]$$
  This enables OCEAN-X to autonomously flag subsurface marine heatwaves (such as Float `#2902345` with a $+3.22^\circ\text{C}$ excess heat anomaly trapped at $110\text{ m}$ depth) that conventional satellite surveillance overlooks.

### 4. Zero-Drift Offline Fallback
* **The Problem**: During hackathons, conferences, and operational field deployments at sea, internet connectivity is notoriously fragile. A live demonstration that crashes because an external API or backend service is unreachable is fatal.
* **The Solution**: We wrote a full mirror simulation engine in `mockFallback.ts`. The offline engine implements the exact same physical formulas (including the Hobday MHW classification, $D_{26}$ isotherm integration, and Haversine distance calculations) directly in TypeScript. If the FastAPI backend drops offline, the client smoothly transitions to simulated mode without crashing or displaying blank screens, while displaying the amber `[ ◆ SIMULATED DATA ]` badge for scientific transparency.

---

## Judge Verification Walkthrough Trail (3-Minute Tour for SIH Evaluators)

Evaluators and judges can follow this step-by-step trail to verify that OCEAN-X runs on real oceanographic principles and works seamlessly end-to-end:

```
[ Step 1: Data Provenance ] -> [ Step 2: Anomaly Detection ] -> [ Step 3: TCHP Cyclone Reservoir ]
                                                                             │
[ Step 5: 2D Vertical Transect ] <- [ Step 4: 4D Co-Location Studio ] <─────┘
```

1. **Verify Data Provenance (Top Bar)**:
   - Notice the green **`[ ● LIVE INCOIS ]`** badge in the top navigation bar.
   - Click the badge to open the **Data Pipeline Integrity** inspector. Confirm connection to the local FastAPI backend (`Port 8000`), dataset dimensions ($113 \times 161$, 14 depth slices, 7 days), and active 14-platform in-situ network.
2. **Inspect Subsurface Marine Heatwave (Hotkey `4` & `P`)**:
   - Press hotkey **`4`** on your keyboard (or click the alert banner in the Situation Room). The 3D camera smoothly glides to Argo Float `#2902345` in the Central Bay of Bengal.
   - Press **`P`** to toggle the **Vertical Profile Sounding HUD**.
   - Notice that at the surface ($0\text{ m}$), model and float agree closely ($\Delta T = +0.02^\circ\text{C}$). Now scrub down to $110\text{ m}$: observe the massive $+3.22^\circ\text{C}$ subsurface heat anomaly, accompanied by the automated Isolation Forest diagnostic advisory.
3. **Inspect Tropical Cyclone Heat Potential (Hotkey `L`)**:
   - Press **`L`** to open the Scientific Layer Rail drawer.
   - Toggle **Cyclone Heat Potential (TCHP)**. Notice the 3D globe transitions to the TCHP heat reservoir colormap.
   - Left-click on the deep red thermal pool in the central Bay of Bengal. The **TCHP Inspector HUD** will appear displaying the exact $Q_{\text{TCHP}}$ value ($>65\text{ kJ/cm}^2$), $26^\circ\text{C}$ isotherm depth ($D_{26} = 84\text{ m}$), and the **INCOIS Rapid Intensification Alert**.
4. **Test 4D Spatial Co-Location Studio (`ANALYSIS ▾`)**:
   - In the top navigation, open **`ANALYSIS ▾` -> `Co-Location Engine`**.
   - Click **"Run Spatial Co-Location"**.
   - Observe real candidates matched within the search radius ($250\text{ km}$) and time window ($168\text{ h}$). Review calculated metrics: Haversine distance ($28.4\text{ km}$), RMSE ($0.28^\circ\text{C}$), mean bias ($-0.14^\circ\text{C}$), and QC verification status.
5. **Inspect 2D Vertical Water Column Transect (Hotkey `T`)**:
   - Press **`T`** to open the Vertical Transect tool.
   - Click **"Preset: Chennai -> Port Blair"**.
   - Inspect the rendered 2D vertical depth section ($0 - 500\text{ m}$ vs $0 - 1360\text{ km}$ distance) showing internal waves and thermocline slope across the basin.

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
