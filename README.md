# LILA BLACK — Player Journey Visualization Tool

A web-based visualization tool for level designers to explore 
player behavior across LILA BLACK's 3 maps.

## Live Demo
https://lila-black-viz-sable.vercel.app/

## Tech Stack
- Python 3.13 + PyArrow + Pandas (data processing)
- React 18 + Vite (frontend)
- React-Konva (canvas rendering)
- Vercel (hosting)

## Features
- Player journey paths on minimap (humans vs bots)
- Event markers: kills, deaths, loot, storm deaths
- Filter by map, date, match
- Timeline playback with speed control
- Heatmap overlays: kill zones, death zones, storm, traffic
- Player list with individual journey focus
- Zoom and pan support

## Setup Steps

### 1. Process data
pip install pyarrow pandas
python process_data.py

### 2. Copy data to frontend
xcopy /E /I /Y output_data frontend\public\output_data
xcopy /E /I /Y player_data\minimaps frontend\public\minimaps

### 3. Run frontend locally
cd frontend
npm install
npm run dev

### 4. Open in browser
http://localhost:5173

## Environment Variables
No environment variables required. 
All data is served as static JSON files.

## Data
Place raw game data in player_data/ folder:
player_data/
├── February_10/
├── February_11/
├── February_12/
├── February_13/
├── February_14/
└── minimaps/

## Deployment
Deployed on Vercel with root directory set to frontend/.
Any push to main branch auto-deploys.

## Docs
- ARCHITECTURE.md — system design and coordinate mapping
- INSIGHTS.md — three data insights with evidence
