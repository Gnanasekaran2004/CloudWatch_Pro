function Header({
  connected,
  error,
  timestamp,
  subscribe,
  resetSubscribe,
  changeInterval
}) {
  const dot = error ? 'var(--red)' : !connected ? 'var(--yellow)' : 'var(--green)'
  const label = error ? 'Error' : !connected ? 'Connecting...' : 'Live'

  const controls = [
    { label: 'All metrics',    action: resetSubscribe },
    { label: 'CPU only',       action: () => subscribe('cpu') },
    { label: 'Memory only',    action: () => subscribe('memory') },
    { label: '↑ Fast (500ms)', action: () => changeInterval?.(500) },
    { label: '→ Normal (1s)',  action: () => changeInterval?.(1000) },
    { label: '↓ Slow (3s)',    action: () => changeInterval?.(3000) },
  ]

  return (
    <div style={{ marginBottom: '1.5rem' }}>

      {/* Title row */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '1.5rem',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Resource Monitor</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <span style={{ width: '10px', height: '10px',
                         borderRadius: '50%', background: dot }} />
          {label}
        </div>
      </div>

      {/* Timestamp */}
      <div style={{ paddingLeft: '0.5rem', marginBottom: '0.75rem',
                    fontSize: '13px', color: 'var(--text-muted)' }}>
        {timestamp
          ? `Updated: ${new Date(timestamp).toLocaleTimeString()}`
          : 'Updated: --:--:--'}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {controls.map(({ label, action }) => (
          <button key={label} onClick={action} style={{
            padding: '6px 12px', fontSize: '12px',
            background: 'var(--bg-card)', color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: '6px',
            cursor: 'pointer'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: '#450a0a', border: '1px solid var(--red)',
                      borderRadius: '8px', padding: '1rem', marginTop: '1rem',
                      color: 'var(--red)' }}>
          ⚠ {error} — make sure node server.js is running
        </div>
      )}
    </div>
  )
}

export default Header