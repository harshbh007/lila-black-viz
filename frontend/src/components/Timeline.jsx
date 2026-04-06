import { useEffect } from 'react';

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function Timeline({
  currentTimestamp,
  maxTimestamp,
  isPlaying,
  playSpeed,
  onTimestampChange,
  onPlayPause,
  onSpeedChange,
  onReset,
  currentEvents,
  selectedPlayerId,
}) {
  const disabled = maxTimestamp === 0;
  
  const visibleEventsCount = currentEvents.filter(e => Number(e.ts_ms) <= Number(currentTimestamp)).length;

  useEffect(() => {
    if (!isPlaying || disabled) return undefined;
    const id = setInterval(() => {
      onTimestampChange((prev) => {
        const next = prev + Math.max(500, Math.floor(maxTimestamp / 300)) * playSpeed;
        if (next >= maxTimestamp) return maxTimestamp;
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying, playSpeed, maxTimestamp, onTimestampChange, disabled]);

  useEffect(() => {
    if (isPlaying && currentTimestamp >= maxTimestamp && maxTimestamp > 0) {
      onPlayPause();
    }
  }, [currentTimestamp, maxTimestamp, isPlaying, onPlayPause]);

  return (
    <div
      style={{
        height: '100%',
        background: '#12122a',
        borderTop: '1px solid #2a2a4a',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 11, color: selectedPlayerId ? '#4169E1' : '#888' }}>
        {selectedPlayerId ? `🎯 Tracking: ${selectedPlayerId.slice(0,8)}...` : '👁 All players visible'} | Showing {visibleEventsCount} / {currentEvents.length} events
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={onPlayPause}
        disabled={disabled}
        style={{
          background: isPlaying ? '#e94560' : '#2a2a4a',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          width: 44,
          height: 34,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        onClick={onReset}
        disabled={disabled}
        style={{
          background: '#2a2a4a',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          width: 44,
          height: 34,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        ⏮
      </button>

      <div style={{ minWidth: 60, color: '#e94560', fontWeight: 700 }}>{formatMs(currentTimestamp)}</div>

      <input
        type="range"
        min={0}
        max={Number(maxTimestamp)}
        value={Number(currentTimestamp)}
        step={Math.max(100, Math.floor(maxTimestamp / 1000))}
        onChange={(e) => onTimestampChange(Number(e.target.value))}
        disabled={disabled}
        style={{
          flex: 1,
          height: 4,
          background: '#2a2a4a',
          outline: 'none',
          borderRadius: 2,
          WebkitAppearance: 'none',
        }}
      />

      <div style={{ color: '#888', minWidth: 70 }}>/ {formatMs(maxTimestamp)}</div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 5].map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            disabled={disabled}
            style={{
              background: playSpeed === speed ? '#e94560' : '#2a2a4a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              width: 42,
              height: 32,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {speed}x
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
