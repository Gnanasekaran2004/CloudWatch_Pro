import { useState, useEffect } from 'react'
import MetricCard  from './components/MetricCard'
import ProcessRow  from './components/ProcessRow'
import Skeleton    from './components/Skeleton'
import { usePolling } from './hooks/useApi'
import { api }        from './api/client'

function App() {
  const [sortBy, setSortBy] = useState('cpu')

  const {
    data:    metrics,
    loading: metricsLoading,
    error:   metricsError
  } = usePolling(api.getMetrics, 2000)

  const formatNet = (bytes) => {
    if (!bytes) return '0 B/s'
    if (bytes > 1e6) return (bytes/1e6).toFixed(1) + ' MB/s'
    if (bytes > 1e3) return (bytes/1e3).toFixed(1) + ' KB/s'
    return bytes + ' B/s'
  }

  const cardStyle = {
    background:   'var(--bg-card)',
    border:       '1px solid var(--border)',
    borderRadius: '12px',
    padding:      '1.5rem',
    marginBottom: '1.5rem'
  }

  const sortedProcesses = [...(metrics?.processes || [])]
    .sort((a, b) => b[sortBy] - a[sortBy])

  const sortButtonStyle = (type) => ({
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    background: sortBy === type ? 'var(--blue)' : 'var(--bg-hover)',
    color: sortBy === type ? '#0f172a' : 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: '0.5rem',
    transition: 'background 0.2s'
  })

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ ...cardStyle, display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Resource Monitor</h1>
        <div style={{ display: 'flex', alignItems: 'center',
                      gap: '8px', fontSize: '14px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: metricsError ? 'var(--red)' :
                        metricsLoading ? 'var(--yellow)' : 'var(--green)'
          }} />
          {metricsError ? 'Error' : metricsLoading ? 'Connecting...' : 'Live'}
        </div>
      </div>

      <div style={{ paddingLeft: '0.5rem', marginBottom: '1.5rem', fontSize: '14px', color: 'var(--text-muted)' }}>
        {metrics?.timestamp ? `Updated: ${new Date(metrics.timestamp).toLocaleTimeString()}` : 'Updated: --:--:--'}
      </div>

      {metricsError && (
        <div style={{ background: '#450a0a', border: '1px solid var(--red)',
                      borderRadius: '8px', padding: '1rem',
                      marginBottom: '1rem', color: 'var(--red)' }}>
          ⚠ Backend error: {metricsError} — make sure node server.js is running
        </div>
      )}

      <div style={{ display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem', marginBottom: '2rem' }}>
        {metricsLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ background: 'var(--bg-card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '12px', padding: '1.5rem' }}>
              <Skeleton height="12px" width="60px" />
              <div style={{ marginTop: '0.75rem' }}>
                <Skeleton height="2rem" width="80px" />
              </div>
            </div>
          ))
        ) : metrics ? (
          <>
            <MetricCard
              label="CPU"
              value={metrics.cpu.percent}
              unit="%"
              percent={metrics.cpu.percent}
            />
            <MetricCard
              label="Memory"
              value={metrics.memory.percent}
              unit="%"
              percent={metrics.memory.percent}
            />
            <MetricCard
              label="Disk"
              value={metrics.disk.percent}
              unit="%"
              percent={metrics.disk.percent}
            />
            <MetricCard
              label="Network ↓"
              value={formatNet(metrics.network.rx_sec)}
            />
          </>
        ) : null}
      </div>
      <div style={cardStyle}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px' }}>Top Processes</h2>
            {metrics?.processes && (
              <span style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                {metrics.processes.length}
              </span>
            )}
          </div>

          <div style={{ display: 'flex' }}>
            <button style={sortButtonStyle('cpu')} onClick={() => setSortBy('cpu')}>
              Sort by CPU
            </button>
            <button style={sortButtonStyle('mem')} onClick={() => setSortBy('mem')}>
              Sort by Memory
            </button>
          </div>
        </div>

        <div style={{ display: 'grid',
                      gridTemplateColumns: '1fr 2fr 1fr 1fr',
                      padding: '0.5rem 1rem',
                      borderBottom: '2px solid var(--border)',
                      fontSize: '12px', color: 'var(--text-muted)',
                      textTransform: 'uppercase', fontWeight: 'bold' }}>
          <div>PID</div>
          <div>Name</div>
          <div style={{ color: sortBy === 'cpu' ? 'var(--blue)' : 'inherit' }}>CPU</div>
          <div style={{ color: sortBy === 'mem' ? 'var(--blue)' : 'inherit' }}>MEM</div>
        </div>
        {metricsLoading
          ? [1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: '0.75rem 1rem',
                                    borderBottom: '1px solid var(--border)' }}>
                <Skeleton height="14px" />
              </div>
            ))
          : sortedProcesses.map(proc => (
              <ProcessRow
                key={proc.pid}
                pid={proc.pid}
                name={proc.name}
                cpu={proc.cpu}
                mem={proc.mem}
              />
            ))
        }
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: '18px', marginBottom: '1rem' }}>
          Listening Ports
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(metrics?.ports || []).map(p => (
            <span key={`${p.port}-${p.protocol}`} style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              color: 'var(--blue)', padding: '0.4rem 0.8rem',
              borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace'
            }}>
              :{p.port}
              {p.label && (
                <span style={{ color: 'var(--text-muted)',
                               fontSize: '11px', marginLeft: '4px' }}>
                  {p.label}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}

export default App
