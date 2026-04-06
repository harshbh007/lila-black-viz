import { useMemo, useState } from 'react';

const MAP_OPTIONS = ['all', 'AmbroseValley', 'GrandRift', 'Lockdown'];
const DATE_OPTIONS = ['all', 'February_10', 'February_11', 'February_12', 'February_13', 'February_14'];

const EVENT_DISPLAY_NAMES = {
  'BotKill': 'Humans killed bots',
  'BotKilled': 'Bots killed humans',
  'Kill': 'PvP Kills',
  'Killed': 'PvP Deaths',
  'KilledByStorm': 'Storm Deaths',
  'Loot': 'Loot Pickups',
  'Position': 'Movement samples',
  'BotPosition': 'Bot movement samples'
};

const sectionTitleStyle = {
  color: '#888',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 6,
};

const selectStyle = {
  width: '100%',
  background: '#1e1e3a',
  color: '#fff',
  border: '1px solid #2a2a4a',
  borderRadius: 8,
  padding: '10px 8px',
};

const tooltipStyle = {
  position: 'absolute',
  background: '#2a2a4a',
  color: 'white',
  fontSize: 11,
  borderRadius: 4,
  padding: '6px 10px',
  maxWidth: 210,
  zIndex: 200,
  border: '1px solid #3a3a6a',
  lineHeight: 1.5,
};

const infoIconStyle = {
  color: '#888',
  cursor: 'pointer',
  marginLeft: 6,
  fontSize: 10,
  background: '#2a2a4a',
  borderRadius: '50%',
  padding: '1px 5px',
};

export default function FilterPanel({
  filteredMatches,
  selectedMap,
  selectedDate,
  selectedMatchId,
  onMapChange,
  onDateChange,
  onMatchChange,
  onLoadMatch,
  currentEvents,
  selectedMatch,
  selectedPlayerId,
  onPlayerSelect,
  loadingMatch,
}) {
  const [tooltips, setTooltips] = useState({});
  const [howToReadExpanded, setHowToReadExpanded] = useState(false);
  
  const duration = useMemo(() => {
    if (currentEvents.length === 0) return 0
    const timestamps = currentEvents.map(e => e.ts_ms)
    return Math.max(...timestamps) - Math.min(...timestamps)
  }, [currentEvents])
  
  const formatDuration = (ms) => {
    if (ms <= 0) return 'Unknown'
    const totalSec = Math.floor(ms / 1000)
    if (totalSec < 60) return totalSec + 's'
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return mins + 'm ' + secs + 's'
  }
  
  const breakdown = currentEvents.reduce((acc, row) => {
    if (row.event === 'Position' || row.event === 'BotPosition') return acc;
    acc[row.event] = (acc[row.event] || 0) + 1;
    return acc;
  }, {});
  
  const matchStats = {
    kills: (breakdown.Kill || 0) + (breakdown.BotKill || 0),
    loot: breakdown.Loot || 0,
    stormDeaths: breakdown.KilledByStorm || 0,
  };
  
  const playersByType = useMemo(() => {
    const players = { humans: [], bots: [] };
    const playerStats = {};
    
    currentEvents.forEach(event => {
      if (!playerStats[event.user_id]) {
        playerStats[event.user_id] = {
          kills: 0,
          deaths: 0,
          loot: 0,
          isBot: event.is_bot
        };
      }
      
      if (event.event === 'Kill' || event.event === 'BotKill') {
        playerStats[event.user_id].kills++;
      } else if (event.event === 'Killed' || event.event === 'BotKilled' || event.event === 'KilledByStorm') {
        playerStats[event.user_id].deaths++;
      } else if (event.event === 'Loot') {
        playerStats[event.user_id].loot++;
      }
    });
    
    Object.entries(playerStats).forEach(([id, stats]) => {
      if (stats.isBot) {
        players.bots.push({ id, ...stats });
      } else {
        players.humans.push({ id, ...stats });
      }
    });
    
    return players;
  }, [currentEvents]);
  
  const showTooltip = (key, event) => {
    setTooltips(prev => ({ ...prev, [key]: { visible: true, x: event.clientX, y: event.clientY } }));
  };
  
  const hideTooltip = (key) => {
    setTooltips(prev => ({ ...prev, [key]: { ...prev[key], visible: false } }));
  };

  return (
    <div
      style={{
        background: '#12122a',
        padding: 16,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center' }}>
          Map
          <span 
            style={infoIconStyle}
            onMouseEnter={(e) => showTooltip('map', e)}
            onMouseLeave={() => hideTooltip('map')}
          >
            (?)
          </span>
        </div>
        {tooltips.map?.visible && (
          <div style={{ ...tooltipStyle, left: tooltips.map.x, top: tooltips.map.y + 10 }}>
            Filter matches by map. Each map has different terrain and player flow patterns.
          </div>
        )}
        <select style={selectStyle} value={selectedMap} onChange={(e) => onMapChange(e.target.value)}>
          {MAP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center' }}>
          Date
          <span 
            style={infoIconStyle}
            onMouseEnter={(e) => showTooltip('date', e)}
            onMouseLeave={() => hideTooltip('date')}
          >
            (?)
          </span>
        </div>
        {tooltips.date?.visible && (
          <div style={{ ...tooltipStyle, left: tooltips.date.x, top: tooltips.date.y + 10 }}>
            Filter by day. Compare behavior across days to spot trends.
          </div>
        )}
        <select style={selectStyle} value={selectedDate} onChange={(e) => onDateChange(e.target.value)}>
          {DATE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center' }}>
          Match
          <span 
            style={infoIconStyle}
            onMouseEnter={(e) => showTooltip('match', e)}
            onMouseLeave={() => hideTooltip('match')}
          >
            (?)
          </span>
        </div>
        {tooltips.match?.visible && (
          <div style={{ ...tooltipStyle, left: tooltips.match.x, top: tooltips.match.y + 10 }}>
            Each match = one game session. 👤 = human players, 🤖 = bots (AI controlled). Select one to visualize all player journeys.
          </div>
        )}
        <select
          style={selectStyle}
          value={selectedMatchId || ''}
          onChange={(e) => onMatchChange(e.target.value || null)}
        >
          <option value="">select</option>
          {filteredMatches.map((m) => (
            <option key={m.match_id} value={m.match_id}>
              {`${m.match_id.slice(0, 8)}... | ${m.map_id} | 👤${m.human_count} 🤖${m.bot_count}`}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 14, position: 'relative' }}>
        <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center' }}>
          Load Match
          <span 
            style={infoIconStyle}
            onMouseEnter={(e) => showTooltip('load', e)}
            onMouseLeave={() => hideTooltip('load')}
          >
            (?)
          </span>
        </div>
        {tooltips.load?.visible && (
          <div style={{ ...tooltipStyle, left: tooltips.load.x, top: tooltips.load.y + 10 }}>
            Loads all player movement and events onto the map. Use the timeline below to replay the match step by step.
          </div>
        )}
        <button
          onClick={() => selectedMatchId && onLoadMatch(selectedMatchId)}
          disabled={!selectedMatchId || loadingMatch}
          style={{
            width: '100%',
            background: selectedMatchId ? '#e94560' : '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 10px',
            fontWeight: 700,
            cursor: selectedMatchId && !loadingMatch ? 'pointer' : 'not-allowed',
            marginBottom: 14,
            animation: selectedMatchId && !loadingMatch && currentEvents.length === 0 ? 'pulse 1.5s infinite' : 'none',
          }}
        >
          {loadingMatch ? 'Loading...' : 'LOAD MATCH'}
        </button>
      </div>

      {currentEvents.length > 0 && selectedMatch && (
        <div
          style={{
            border: '1px solid #2a2a4a',
            borderRadius: 10,
            padding: 10,
            background: '#18183a',
            fontSize: 13,
            color: '#cfcfea',
          }}
        >
          <div style={sectionTitleStyle}>Loaded Match</div>
          <div>Total events: {currentEvents.length}</div>
          <div>Duration: {formatDuration(duration)}</div>
          <div>Human players: {selectedMatch.human_count}</div>
          <div>
            Bots: {selectedMatch.bot_count > 0 
              ? selectedMatch.bot_count 
              : (() => {
                  const estimatedBots = new Set(
                    currentEvents
                      .filter(e => e.event === 'BotKill' || e.event === 'BotKilled')
                      .map(e => e.user_id)
                  ).size;
                  return estimatedBots > 0 ? `${estimatedBots}+` : '0';
                })()
            }
          </div>
          <div style={{ marginTop: 8, color: '#aaa' }}>Non-position events:</div>
          {Object.keys(breakdown).length === 0 ? (
            <div style={{ color: '#777' }}>None</div>
          ) : (
            Object.entries(breakdown).map(([k, v]) => (
              <div key={k}>
                {EVENT_DISPLAY_NAMES[k] || k}: {v}
              </div>
            ))
          )}
        </div>
      )}
      
      {currentEvents.length > 0 && (
        <div
          style={{
            background: '#0d0d2a',
            borderRadius: 6,
            padding: 8,
            textAlign: 'center',
            marginBottom: 8,
            fontSize: 12,
            color: '#ccc',
          }}
        >
          ⚔️ {matchStats.kills} kills  📦 {matchStats.loot} loots  🌪️ {matchStats.stormDeaths} storm deaths
        </div>
      )}
      
      {currentEvents.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={sectionTitleStyle}>PLAYERS IN MATCH</div>
          
          {playersByType.humans.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#4169E1', fontSize: 11, marginBottom: 4 }}>👤 HUMANS</div>
              {playersByType.humans.map((player) => (
                <div
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  style={{
                    padding: '6px 8px',
                    marginBottom: 2,
                    background: selectedPlayerId === player.id ? '#1e1e3a' : '#0a0a1a',
                    borderLeft: selectedPlayerId === player.id ? '3px solid #4169E1' : '3px solid transparent',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                    color: '#ccc',
                  }}
                >
                  {player.id.slice(0, 8)}... ⚔️{player.kills} 💀{player.deaths} 📦{player.loot}
                </div>
              ))}
            </div>
          )}
          
          {playersByType.bots.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#808080', fontSize: 11, marginBottom: 4 }}>🤖 BOTS</div>
              {playersByType.bots.map((player) => (
                <div
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  style={{
                    padding: '6px 8px',
                    marginBottom: 2,
                    background: selectedPlayerId === player.id ? '#1e1e3a' : '#0a0a1a',
                    borderLeft: selectedPlayerId === player.id ? '3px solid #808080' : '3px solid transparent',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                    color: '#ccc',
                  }}
                >
                  {player.id.slice(0, 8)}... ⚔️{player.kills} 💀{player.deaths} 📦{player.loot}
                </div>
              ))}
            </div>
          )}
          
          {selectedPlayerId && (
            <button
              onClick={() => onPlayerSelect(null)}
              style={{
                width: '100%',
                background: '#2a2a4a',
                color: '#ccc',
                border: '1px solid #444',
                borderRadius: 4,
                padding: '6px 8px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              👁 Show All
            </button>
          )}
        </div>
      )}
      
      {currentEvents.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div
            onClick={() => setHowToReadExpanded(!howToReadExpanded)}
            style={{
              ...sectionTitleStyle,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>📖 HOW TO READ THIS MAP</span>
            <span style={{ fontSize: 10 }}>{howToReadExpanded ? '▼' : '▶'}</span>
          </div>
          
          {howToReadExpanded && (
            <div
              style={{
                background: '#0d0d2a',
                border: '1px solid #2a2a4a',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 11,
                lineHeight: 1.9,
                color: '#aaa',
                marginTop: 8,
              }}
            >
              Each event is shown from that PLAYER's perspective:
              <br /><br />
              ⚔️ PvP Kill = this player killed another human here
              <br />
              💀 PvP Death = this player was killed by a human here
              <br />
              🎯 Bot Kill = this player killed a bot here
              <br />
              ☠️ Bot Death = a bot killed this player here
              <br />
              🌪️ Storm Death = storm caught this player here
              <br />
              📦 Loot = this player picked up an item here
              <br /><br />
              🔵 Blue line = human player movement
              <br />
              ⚫ Gray line = bot movement
              <br /><br />
              💡 Click any player above to focus on their individual journey.
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(233,69,96,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(233,69,96,0); }
          100% { box-shadow: 0 0 0 0 rgba(233,69,96,0); }
        }
      `}</style>
    </div>
  );
}
