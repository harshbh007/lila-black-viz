import { useEffect, useMemo, useState } from 'react';
import FilterPanel from './components/FilterPanel';
import HeatmapToggle from './components/HeatmapToggle';
import MapCanvas from './components/MapCanvas';
import StatsBar from './components/StatsBar';
import Timeline from './components/Timeline';

const isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

function App() {
  const [matches, setMatches] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedMap, setSelectedMap] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [allMatchEvents, setAllMatchEvents] = useState({});
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [maxTimestamp, setMaxTimestamp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [activeHeatmaps, setActiveHeatmaps] = useState({
    kills: false,
    deaths: false,
    storm: false,
    traffic: false,
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading matches and summary...');

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [matchesRes, summaryRes] = await Promise.all([
          fetch('/output_data/matches.json'),
          fetch('/output_data/summary.json'),
        ]);
        const [matchesJson, summaryJson] = await Promise.all([matchesRes.json(), summaryRes.json()]);
        setMatches(matchesJson);
        setSummary(summaryJson);
        setLoadingText('');
      } catch (error) {
        console.error(error);
        setLoadingText('Failed to load initial data');
      }
    };
    loadInitial();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((matchRow) => {
      const mapOk = selectedMap === 'all' || matchRow.map_id === selectedMap;
      const dateOk = selectedDate === 'all' || matchRow.date === selectedDate;
      return mapOk && dateOk;
    });
  }, [matches, selectedMap, selectedDate]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.match_id === selectedMatchId) || null,
    [matches, selectedMatchId],
  );

  const effectiveMap = selectedMatch?.map_id || (selectedMap === 'all' ? 'AmbroseValley' : selectedMap);

  const handleLoadMatch = async (matchId) => {
    if (!matchId) return;
    setLoadingMatch(true);
    setLoadingText('Loading match events...');
    try {
      let eventsCache = allMatchEvents;
      if (isEmptyObject(eventsCache)) {
        const eventsRes = await fetch('/output_data/events_by_match.json');
        eventsCache = await eventsRes.json();
        setAllMatchEvents(eventsCache);
      }
      const matchEvents = allMatchEvents[matchId] || []
    const tsValues = matchEvents.map(e => Number(e.ts_ms))
    const maxTs = tsValues.length > 0 ? Math.max(...tsValues) : 0
    setCurrentEvents(matchEvents);
    setMaxTimestamp(maxTs);
    setCurrentTimestamp(0);
      setIsPlaying(false);
      setLoadingText('');
    } catch (error) {
      console.error(error);
      setLoadingText('Failed to load match events');
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleHeatmapToggle = async (type) => {
    const willEnable = !activeHeatmaps[type];
    if (willEnable && isEmptyObject(heatmapData)) {
      setLoadingText('Loading heatmap data...');
      try {
        const heatmapRes = await fetch('/output_data/heatmap_data.json');
        const heatmapJson = await heatmapRes.json();
        setHeatmapData(heatmapJson);
        setLoadingText('');
      } catch (error) {
        console.error(error);
        setLoadingText('Failed to load heatmap data');
        return;
      }
    }
    setActiveHeatmaps((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div
      style={{
        height: '100vh',
        background: '#1a1a2e',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        display: 'grid',
        gridTemplateRows: '56px 1fr',
        overflow: 'hidden'
      }}
    >
      <StatsBar summary={summary} selectedMatch={selectedMatch} />

      <div style={{ 
        display: 'flex',
        flexDirection: 'row',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: '280px',
          minWidth: '280px',
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid #2a2a4a'
        }}>
          <FilterPanel
            matches={matches}
            filteredMatches={filteredMatches}
            selectedMap={selectedMap}
            selectedDate={selectedDate}
            selectedMatchId={selectedMatchId}
            onMapChange={setSelectedMap}
            onDateChange={setSelectedDate}
            onMatchChange={setSelectedMatchId}
            onLoadMatch={handleLoadMatch}
            currentEvents={currentEvents}
            selectedMatch={selectedMatch}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={setSelectedPlayerId}
            loadingMatch={loadingMatch}
          />
        </div>

        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{ 
            flexShrink: 0, 
            height: '48px'
          }}>
            <HeatmapToggle activeHeatmaps={activeHeatmaps} onToggle={handleHeatmapToggle} />
          </div>
          <div style={{ 
            flex: 1, 
            overflow: 'hidden',
            minHeight: 0
          }}>
            <MapCanvas
              currentEvents={currentEvents}
              heatmapData={heatmapData}
              currentTimestamp={currentTimestamp}
              activeHeatmaps={activeHeatmaps}
              selectedMap={effectiveMap}
              selectedPlayerId={selectedPlayerId}
              loadingMatch={loadingMatch}
            />
          </div>
          <div style={{ 
            flexShrink: 0, 
            height: '88px',
            minHeight: '88px'
          }}>
            <Timeline
              currentTimestamp={currentTimestamp}
              maxTimestamp={maxTimestamp}
              isPlaying={isPlaying}
              playSpeed={playSpeed}
              onTimestampChange={setCurrentTimestamp}
              onPlayPause={() => setIsPlaying((v) => !v)}
              onSpeedChange={setPlaySpeed}
              onReset={() => {
                setCurrentTimestamp(0);
                setIsPlaying(false);
              }}
              currentEvents={currentEvents}
              selectedPlayerId={selectedPlayerId}
              loadingMatch={loadingMatch}
            />
          </div>
        </div>
      </div>

      {loadingText && (
        <div
          style={{
            position: 'fixed',
            right: 12,
            bottom: 12,
            background: 'rgba(13, 13, 26, 0.95)',
            border: '1px solid #2a2a4a',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#ccc',
            fontSize: 13,
          }}
        >
          {loadingText}
        </div>
      )}
    </div>
  );
}

export default App;
