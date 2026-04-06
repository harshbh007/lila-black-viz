import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  RegularPolygon,
  Stage,
  Text,
} from 'react-konva';
import useImage from 'use-image';
import { EVENT_COLORS, HEATMAP_COLORS, MAP_CONFIG } from '../utils/constants';

function toPoints(events, scale) {
  const points = [];
  for (const e of events) {
    if (e.pixel_x == null || e.pixel_y == null) continue;
    points.push(e.pixel_x * scale, e.pixel_y * scale);
  }
  return points;
}

export default function MapCanvas({
  currentEvents,
  heatmapData,
  currentTimestamp,
  activeHeatmaps,
  selectedMap,
  selectedPlayerId,
  loadingMatch,
}) {
  const containerRef = useRef(null);
  const [mapSize, setMapSize] = useState(800);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [legendVisible, setLegendVisible] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 800 });
  
  const formatTime = (ms) => {
    if (ms > 60000) {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
    return `${Math.floor(ms / 1000)}s`;
  };
  
  const resetView = () => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const minimapPath = MAP_CONFIG[selectedMap]?.minimap || MAP_CONFIG.AmbroseValley.minimap;
  const [minimapImage] = useImage(minimapPath);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const nextSize = Math.min(clientWidth, clientHeight, 900);
      setMapSize(Math.max(nextSize, 400));
      setContainerSize({ width: clientWidth, height: clientHeight });
    };
    measure();
    
    // Use ResizeObserver for better responsiveness
    const resizeObserver = new ResizeObserver(measure);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const scale = mapSize / 1024;
  const visibleEvents = useMemo(
    () => currentEvents.filter((e) => Number(e.ts_ms) <= Number(currentTimestamp)),
    [currentEvents, currentTimestamp],
  );

  const positionsByUser = useMemo(() => {
    const grouped = {};
    for (const e of visibleEvents) {
      if (e.event !== 'Position' && e.event !== 'BotPosition') continue;
      if (!grouped[e.user_id]) grouped[e.user_id] = [];
      grouped[e.user_id].push(e);
    }
    return grouped;
  }, [visibleEvents]);

  const markerEvents = useMemo(
    () => visibleEvents.filter((e) => e.event !== 'Position' && e.event !== 'BotPosition'),
    [visibleEvents],
  );
  
  const getMarkerTooltipContent = (e) => {
    const time = formatTime(e.ts_ms);
    const playerId = e.user_id.slice(0, 8);
    
    switch (e.event) {
      case 'Kill':
        return `⚔️ PvP Kill | Player: ${playerId} | ${time}`;
      case 'Killed':
        return `💀 Killed by Player | ${playerId} | ${time}`;
      case 'BotKill':
        return `🎯 Killed a Bot | Player: ${playerId} | ${time}`;
      case 'BotKilled':
        return `☠️ Killed by Bot | Player: ${playerId} | ${time}`;
      case 'KilledByStorm':
        return `🌪️ Storm Death | ${playerId} | ${time}`;
      case 'Loot':
        return `📦 Loot Pickup | ${playerId} | ${time}`;
      default:
        return `${e.event} | ${playerId} | ${time}`;
    }
  };

  const hasHeatmap = activeHeatmaps.kills || activeHeatmaps.deaths || activeHeatmaps.storm || activeHeatmaps.traffic;
  const mapHeat = heatmapData?.[selectedMap] || {};
  const heatPoints = {
    kills: mapHeat.kills || [],
    deaths: mapHeat.deaths || [],
    storm: mapHeat.storm_deaths || [],
    traffic: mapHeat.positions || [],
  };

  const onWheel = (event) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldScale = stageScale;
    const factor = 1.05;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.3, Math.min(8, direction > 0 ? oldScale * factor : oldScale / factor));
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStageScale(newScale);
    setStagePos(newPos);
  };
  
  const onStageMouseMove = (event) => {
    const stage = event.target.getStage();
    const pointer = stage.getPointerPosition();
    if (pointer) {
      setMousePos({ x: pointer.x, y: pointer.y });
    }
  };

  if (loadingMatch) {
    return (
      <div
        ref={containerRef}
        style={{
          height: '100%',
          background: '#0a0a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        ⏳ Loading match data...
      </div>
    );
  }
  
  if (!currentEvents.length) {
    return (
      <div
        ref={containerRef}
        style={{
          height: '100%',
          background: '#0a0a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
        }}
      >
        Select a match and click LOAD MATCH
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({ 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top 
        })
      }}
      style={{
        background: '#0a0a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Legend Toggle Button */}
      <button
        onClick={() => setLegendVisible(!legendVisible)}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.65)',
          color: '#ccc',
          border: '1px solid #333',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'white';
          e.target.style.borderColor = '#888';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#ccc';
          e.target.style.borderColor = '#333';
        }}
      >
        📖 Legend
      </button>
      
      {/* Legend Panel */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0,0,0,0.82)',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 11,
          color: 'white',
          border: '1px solid #2a2a4a',
          zIndex: 10,
          lineHeight: '2',
          display: legendVisible ? 'block' : 'none'
        }}
      >
        {[
          { color: '#4169E1', label: 'Human Path' },
          { color: '#808080', label: 'Bot Path' },
          { color: '#FF4444', label: 'PvP Kill' },
          { color: '#FF8C00', label: 'PvP Death' },
          { color: '#FF6B6B', label: 'Bot Kill' },
          { color: '#FFA07A', label: 'Bot Death' },
          { color: '#9B59B6', label: 'Storm Death' },
          { color: '#2ECC71', label: 'Loot Pickup' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: item.color,
              flexShrink: 0
            }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      
      {/* Zoom Reset Button */}
      <button
        onClick={resetView}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.65)',
          color: '#ccc',
          border: '1px solid #333',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'white';
          e.target.style.borderColor = '#888';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#ccc';
          e.target.style.borderColor = '#333';
        }}
      >
        ⟲ Reset View
      </button>
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: mousePos.x + 15,
            top: mousePos.y - 10,
            background: '#1a1a3a',
            border: '1px solid #e94560',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: 'white',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'pre-line',
            maxWidth: 220,
            transform: mousePos.x > (mapSize - 240) ? 'translateX(-100%)' : 'none'
          }}
        >
          {tooltip.content}
        </div>
      )}
      <Stage
        width={mapSize}
        height={mapSize}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={onWheel}
        onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer listening={false}>
          <KonvaImage image={minimapImage} width={mapSize} height={mapSize} />
        </Layer>

        {hasHeatmap && (
          <Layer listening={false}>
            {activeHeatmaps.kills &&
              heatPoints.kills.map((p, idx) => (
                <Circle
                  key={`hk-${idx}`}
                  x={p[0] * scale}
                  y={p[1] * scale}
                  radius={15 * scale}
                  fill={HEATMAP_COLORS.kills}
                  opacity={0.12}
                  listening={false}
                />
              ))}
            {activeHeatmaps.deaths &&
              heatPoints.deaths.map((p, idx) => (
                <Circle
                  key={`hd-${idx}`}
                  x={p[0] * scale}
                  y={p[1] * scale}
                  radius={15 * scale}
                  fill={HEATMAP_COLORS.deaths}
                  opacity={0.12}
                  listening={false}
                />
              ))}
            {activeHeatmaps.storm &&
              heatPoints.storm.map((p, idx) => (
                <Circle
                  key={`hs-${idx}`}
                  x={p[0] * scale}
                  y={p[1] * scale}
                  radius={15 * scale}
                  fill={HEATMAP_COLORS.storm}
                  opacity={0.12}
                  listening={false}
                />
              ))}
            {activeHeatmaps.traffic &&
              heatPoints.traffic.map((p, idx) => (
                <Circle
                  key={`ht-${idx}`}
                  x={p[0] * scale}
                  y={p[1] * scale}
                  radius={15 * scale}
                  fill={HEATMAP_COLORS.traffic}
                  opacity={0.12}
                  listening={false}
                />
              ))}
          </Layer>
        )}

        <Layer listening={false}>
          {Object.entries(positionsByUser).map(([userId, events]) => {
            const sorted = [...events].sort((a, b) => Number(a.ts_ms) - Number(b.ts_ms));
            const points = toPoints(sorted, scale);
            if (points.length < 4) return null;
            const isBot = Boolean(sorted[0].is_bot);
            const isSelected = selectedPlayerId === userId;
            const opacity = selectedPlayerId ? (isSelected ? 0.6 : 0.08) : (isBot ? 0.4 : 0.6);
            
            return (
              <Line
                key={`path-${userId}`}
                points={points}
                stroke={isBot ? '#808080' : '#4169E1'}
                strokeWidth={isBot ? 1 * scale : 1.5 * scale}
                opacity={opacity}
                tension={0.3}
                listening={false}
              />
            );
          })}
        </Layer>

        <Layer>
          {markerEvents.map((e, idx) => {
            if (e.pixel_x == null || e.pixel_y == null) return null;
            const x = e.pixel_x * scale;
            const y = e.pixel_y * scale;
            const key = `evt-${idx}-${e.user_id}-${e.ts_ms}`;
            const isPlayerSelected = selectedPlayerId === e.user_id;
            
            // Only show markers for selected player if one is selected
            if (selectedPlayerId && !isPlayerSelected) return null;
            
            const onEnter = (event) => {
              setTooltip({
                visible: true,
                content: getMarkerTooltipContent(e),
              });
            };
            
            const onLeave = () => {
              setTooltip({ ...tooltip, visible: false });
            };

            if (e.event === 'Kill') {
              return (
                <Circle
                  key={key}
                  x={x}
                  y={y}
                  radius={7 * scale}
                  fill={EVENT_COLORS.Kill}
                  stroke="#ffffff"
                  strokeWidth={1}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                />
              );
            }
            if (e.event === 'Killed') {
              return (
                <Circle
                  key={key}
                  x={x}
                  y={y}
                  radius={6 * scale}
                  fill={EVENT_COLORS.Killed}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                />
              );
            }
            if (e.event === 'BotKill') {
              return (
                <Circle
                  key={key}
                  x={x}
                  y={y}
                  radius={5 * scale}
                  fill={EVENT_COLORS.BotKill}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                />
              );
            }
            if (e.event === 'BotKilled') {
              return (
                <Circle
                  key={key}
                  x={x}
                  y={y}
                  radius={4 * scale}
                  fill={EVENT_COLORS.BotKilled}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                />
              );
            }
            if (e.event === 'KilledByStorm') {
              return (
                <RegularPolygon
                  key={key}
                  x={x}
                  y={y}
                  sides={4}
                  radius={8 * scale}
                  fill={EVENT_COLORS.KilledByStorm}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                />
              );
            }
            if (e.event === 'Loot') {
              return (
                <Rect
                  key={key}
                  x={x}
                  y={y}
                  width={8 * scale}
                  height={8 * scale}
                  offsetX={4 * scale}
                  offsetY={4 * scale}
                  fill={EVENT_COLORS.Loot}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                />
              );
            }
            return null;
          })}

          {/* Remove old hover tooltip */}
        </Layer>
      </Stage>
    </div>
  );
}
