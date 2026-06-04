
function MetricCard({ label, value, unit, percent }) {

  const getColor = (pct) => {
    if (!pct && pct !== 0) return 'var(--text-primary)'
    if (pct > 80) return 'var(--red)'
    if (pct > 60) return 'var(--yellow)'
    return 'var(--green)'
  }

  const color = getColor(percent)

  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: '12px',
      padding:      '1.5rem',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '12px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    marginBottom: '0.5rem' }}>
        {label}
      </div>

      <div style={{ fontSize: '2rem', fontWeight: 'bold',
                    color, lineHeight: 1 }}>
        {value ?? '--'}
        {unit && <span style={{ fontSize: '1rem', marginLeft: '4px',
                                color: 'var(--text-muted)' }}>{unit}</span>}
      </div>

      {percent !== undefined && (
        <div style={{ marginTop: '0.75rem', background: 'var(--bg-primary)',
                      borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
          <div style={{
            width:        `${Math.min(percent, 100)}%`,
            height:       '100%',
            background:   color,
            borderRadius: '4px',
            transition:   'width 0.3s ease'
          }} />
        </div>
      )}
    </div>
  )
}

export default MetricCard