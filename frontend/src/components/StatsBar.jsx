function statPill(label, value) {
  return (
    <div
      style={{
        background: '#1a1a33',
        border: '1px solid #2a2a4a',
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 12,
        color: '#d1d1e8',
      }}
    >
      {label}: <strong>{value ?? 0}</strong>
    </div>
  );
}

export default function StatsBar({ summary, selectedMatch }) {
  return (
    <div
      style={{
        height: 56,
        background: '#0d0d1a',
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#e94560', fontWeight: 800 }}>⚡ LILA BLACK</span>
        <span style={{ color: '#888' }}>// LEVEL DESIGNER TOOL</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {statPill('matches', summary.total_matches)}
        {statPill('players', summary.total_players)}
        {statPill('events', summary.total_events)}
      </div>

      <div style={{ color: '#aaa', fontSize: 13, minWidth: 280, textAlign: 'right' }}>
        {selectedMatch
          ? (
            <span>
              {selectedMatch.map_id} | {selectedMatch.date} | {' '}
              <span style={{ color: '#4169E1' }}>👤 {selectedMatch.human_count}</span> {' | '}
              <span style={{ color: '#808080' }}>🤖 {selectedMatch.bot_count}</span>
            </span>
          )
          : 'No match selected'
        }
      </div>
    </div>
  );
}
