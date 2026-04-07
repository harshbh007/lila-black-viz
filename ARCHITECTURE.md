# Architecture Document - LILA BLACK Player Journey Visualization Tool

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Data Processing | Python 3.13, PyArrow, Pandas | Native parquet support, fast data wrangling |
| Frontend Framework | React 18 + Vite | Fast builds, component-based UI |
| Map Rendering | React-Konva (Canvas) | Hardware-accelerated 2D canvas for game data |
| Styling | Inline CSS + CSS Variables | No framework overhead, full control |
| Hosting | Vercel | Free, instant GitHub integration, global CDN |
| Data Format | JSON (pre-processed) | No backend needed, served as static files |

## Data Flow
1243 .nakama-0 files (Apache Parquet)
    |
    v
process_data.py (Python)

Reads all parquet files across 5 date folders
Decodes event column from bytes to UTF-8 string
Detects bots vs humans from filename (numeric ID = bot)
Converts world coordinates to pixel coordinates
Groups events by match_id
Outputs 4 JSON files to output_data/
    |
    v
4 Static JSON Files:
matches.json (796 matches metadata)
events_by_match.json (all events grouped by match)
heatmap_data.json (pre-aggregated heatmap points)
summary.json (global statistics)
    |
    v
React Frontend (fetches JSON on demand)
matches.json + summary.json fetched on load
events_by_match.json fetched once, cached in state
heatmap_data.json fetched on first heatmap toggle
    |
    v
React-Konva Canvas
Renders player paths as lines
Renders event markers as shapes
Renders heatmap as overlapping circles
Timeline filters events by timestamp


## Coordinate Mapping

This was the most critical technical challenge.

The game uses a 3D world coordinate system (x, y, z) where:
- x = horizontal position
- y = elevation/height (NOT used for 2D mapping)
- z = depth position

Each map has a different scale and origin point defined in the README:

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

Conversion formula (world -> 1024x1024 pixel):
u = (x - origin_x) / scale
v = (z - origin_z) / scale
pixel_x = u * 1024
pixel_y = (1 - v) * 1024   <- Y axis flipped (image origin = top-left)

In the frontend, pixel coordinates are further scaled:
SCALE = mapSize / 1024
canvas_x = pixel_x * SCALE
canvas_y = pixel_y * SCALE

## Assumptions Made

| Assumption | Reasoning |
|-----------|-----------|
| Bot detection by filename | README states numeric user_id = bot. Parsed from filename not data column for reliability |
| y column = elevation | README explicitly states y is elevation. Used x and z for 2D mapping |
| Timestamps are epoch ms | ts values like 1770754537 are absolute epoch milliseconds. Relative ts_ms calculated per match |
| Match duration synthetic | Raw duration per file was <1s (position sampling interval). Synthetic 10min timeline applied based on relative event order |
| February 14 is partial | README states data collection was ongoing. Included but noted in filters |
| Static JSON approach | 23MB events file is acceptable for browser fetch. No backend needed |

## Major Tradeoffs

| Decision | Considered | Chose | Why |
|---------|-----------|-------|-----|
| Backend vs Static | FastAPI backend | Static JSON | Simpler deployment, no server costs |
| SVG vs Canvas | SVG rendering | React-Konva canvas | Canvas handles 89k events without lag |
| Real-time vs Pre-processed | Query parquet in browser | Pre-process to JSON | DuckDB-WASM was overkill for this scale |
| Heatmap library vs Custom | heatmap.js | Custom Konva circles | Better integration with existing canvas layers |
| Full data vs Sampled | Load all events | Cache on first fetch | 23MB is manageable, avoids complexity |
