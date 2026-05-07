// debug-log.jsx — Debug Log Panel

const LEVEL_COLORS = {
  SUCCESS: '#4ade80',
  INFO:    'var(--text-2)',
  WARN:    '#f59e0b',
  ERROR:   '#f87171',
};

function DebugLogPanel({ onClose }) {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const bodyRef = React.useRef(null);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/__serverLogs');
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs);
        setError(null);
      } else {
        setError('Server returned an error');
      }
    } catch {
      setError('Server not available — start via start.bat');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-scroll to bottom when logs load
  React.useEffect(() => {
    if (bodyRef.current && logs.length) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLog = async () => {
    try {
      await fetch('/__clearDebugLog', { method: 'POST' });
      setLogs([]);
    } catch {
      // silently ignore if server unavailable
    }
  };

  const fmtTime = (entry) => {
    const s = (entry.relativeTime / 1000).toFixed(2);
    return `+${s}s`;
  };

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-modal editor-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <div>
            <div className="editor-title">Debug Log</div>
            <div className="editor-subtitle">{logs.length} entries — current server session</div>
          </div>
          <button className="editor-close" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>

        <div className="dl-body" ref={bodyRef}>
          {loading && <div className="editor-loading">Loading…</div>}
          {error && <div className="editor-error">{error}</div>}
          {!loading && !error && logs.length === 0 && (
            <div style={{color:'var(--text-3)',fontSize:12,padding:'24px',textAlign:'center'}}>No log entries yet</div>
          )}
          {logs.map((entry, i) => (
            <div key={i} className="dl-entry">
              <span className="dl-time">{fmtTime(entry)}</span>
              <span className="dl-level" style={{color: LEVEL_COLORS[entry.level] || 'var(--text-2)'}}>
                {entry.level}
              </span>
              <span className="dl-ep">{entry.endpoint}</span>
              <span className="dl-msg">{entry.message}</span>
              {entry.data && (
                <span className="dl-data">{JSON.stringify(entry.data)}</span>
              )}
            </div>
          ))}
        </div>

        <div className="editor-footer">
          <button className="btn-editor" style={{flex:'0 0 auto'}} onClick={fetchLogs}>
            <Icon name="list" size={13}/> Refresh
          </button>
          <button className="btn-editor btn-danger" style={{flex:'0 0 auto'}} onClick={clearLog}>
            <Icon name="trash" size={13}/> Clear
          </button>
          <div style={{flex:1}}/>
          <button className="btn-editor" style={{flex:'0 0 auto'}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DebugLogPanel });
