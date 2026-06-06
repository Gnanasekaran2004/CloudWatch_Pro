import { useState, useMemo, useCallback, memo } from 'react'

const MemoPortRow = memo(({ port, label, protocol }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr',
                padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
                fontSize: '14px', alignItems: 'center' }}>
    <div style={{ fontWeight: '500', color: 'var(--blue)' }}>{port}</div>
    <div style={{ color: label ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontStyle: label ? 'normal' : 'italic' }}>
      {label || 'unknown'}
    </div>
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
      {protocol || 'tcp'}
    </div>
  </div>
))

function PortsList({ ports = [], loading }) {
  const [filter, setFilter] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFilter = useCallback((e) => {
    setFilter(e.target.value)
  }, [])
  const filteredPorts = useMemo(() => {
    return ports.filter(p => filter ? String(p.port).includes(filter) : true)
  }, [ports, filter])

  const stats = useMemo(() => ({
    total:   ports.length,
    known:   ports.filter(p => p.label).length,
    unknown: ports.filter(p => !p.label).length
  }), [ports])
  const copyPorts = useCallback(() => {
    if (!ports.length) return
    const portString = ports.map(p => p.port).join(', ')
    navigator.clipboard.writeText(portString)
    setCopied(true)
    
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer) 
  }, [ports])

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '1rem',
                    flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '18px' }}>Active Ports</h2>
        </div>
        
        <button 
          onClick={copyPorts} 
          disabled={ports.length === 0}
          style={{
            padding: '4px 12px', fontSize: '12px', fontWeight: '500',
            background: copied ? 'var(--green, #10b981)' : 'var(--bg-hover)',
            color: copied ? '#ffffff' : 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: '6px', 
            cursor: ports.length ? 'pointer' : 'not-allowed',
            opacity: ports.length ? 1 : 0.5,
            transition: 'all 0.2s ease'
          }}
        >
          {copied ? '✓ Copied!' : 'Copy all'}
        </button>
      </div>

      {ports.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '12px',
                      color: 'var(--text-muted)', marginBottom: '0.75rem',
                      paddingLeft: '0.25rem', alignItems: 'center' }}>
          <span>{stats.total} total</span>
          <span>•</span>
          <span>{stats.known} known</span>
          <span>•</span>
          <span>{stats.unknown} unknown</span>
        </div>
      )}

      <input
        type="text"
        placeholder="Filter by port number..."
        value={filter}
        onChange={handleFilter}
        style={{
          width: '100%', padding: '8px 12px', marginBottom: '1rem',
          background: 'var(--bg-primary)', fontSize: '14px',
          border: `1px solid ${filter ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr',
                    padding: '0.5rem 1rem', borderBottom: '2px solid var(--border)',
                    fontSize: '12px', color: 'var(--text-muted)',
                    textTransform: 'uppercase', fontWeight: 'bold' }}>
        <div>Port</div>
        <div>Service Label</div>
        <div>Protocol</div>
      </div>

      {loading
        ? [1, 2, 3].map(i => (
            <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ height: '14px', background: 'var(--bg-hover)',
                            borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))
        : filteredPorts.length === 0
          ? <div style={{ padding: '2rem', textAlign: 'center',
                          color: 'var(--text-muted)', fontSize: '14px' }}>
              {filter ? `No ports matching "${filter}"` : 'No active ports'}
            </div>
          : filteredPorts.map(p => (
              <MemoPortRow
                key={`${p.port}-${p.protocol || 'tcp'}`}
                port={p.port}
                label={p.label}
                protocol={p.protocol}
              />
            ))
      }
    </div>
  )
}

export default PortsList
