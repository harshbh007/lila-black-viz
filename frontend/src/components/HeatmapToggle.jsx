import { useState } from 'react';

const BUTTONS = [
  { key: 'kills', label: '🔴 Kill Zones', color: '#FF4444', tooltip: 'Where kills happened most. Hot spots = high combat areas. Useful for identifying choke points and overpowered positions.' },
  { key: 'deaths', label: '🟠 Death Zones', color: '#FF8C00', tooltip: 'Where players died most. Isolated death zones may indicate unfair sightlines or spawn disadvantages.' },
  { key: 'storm', label: '🟣 Storm Deaths', color: '#9B59B6', tooltip: 'Where players were caught by the storm. Clusters near edges suggest storm timing is too aggressive.' },
  { key: 'traffic', label: '🔵 Player Traffic', color: '#4169E1', tooltip: 'Overall movement density across the map. Empty areas = ignored zones. Use to spot underused regions.' },
];

export default function HeatmapToggle({ activeHeatmaps, onToggle }) {
  const [hoveredButton, setHoveredButton] = useState(null);
  
  const showTooltip = (key) => setHoveredButton(key);
  const hideTooltip = () => setHoveredButton(null);
  
  return (
    <div
      style={{
        height: '100%',
        background: '#12122a',
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
      }}
    >
      {BUTTONS.map((button) => {
        const active = activeHeatmaps[button.key];
        return (
          <div key={button.key} style={{ position: 'relative' }}>
            <button
              onClick={() => onToggle(button.key)}
              onMouseEnter={() => showTooltip(button.key)}
              onMouseLeave={hideTooltip}
              style={{
                background: active ? `${button.color}33` : '#1e1e3a',
                border: `1px solid ${active ? button.color : '#2a2a4a'}`,
                color: '#fff',
                borderRadius: 999,
                padding: '7px 10px',
              }}
            >
              {button.label}
            </button>
            {hoveredButton === button.key && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 4,
                  background: '#2a2a4a',
                  color: 'white',
                  fontSize: 11,
                  borderRadius: 4,
                  padding: '6px 10px',
                  maxWidth: 210,
                  zIndex: 200,
                  border: '1px solid #3a3a6a',
                  lineHeight: 1.5,
                }}
              >
                {button.tooltip}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
