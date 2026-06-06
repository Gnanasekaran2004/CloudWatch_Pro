import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react'
import ProcessRow from './ProcessRow'

// Wrap ProcessRow with memo — skips re-render if props unchanged
const MemoProcessRow = memo(ProcessRow)

function ProcessTable({ processes = [], loading }) {
  const [sortBy,  setSortBy]  = useState('cpu')
  const [search,  setSearch]  = useState('')
  const [showAll, setShowAll] = useState(false)

  // 1. Setup the scrollable container reference
  const tableRef = useRef(null)
  
  // 2. Setup a ref to track the previous top process PID across renders
  const currentTopPid = processes[0]?.pid
  const prevTopPidRef = useRef(currentTopPid)

  // 3. Auto-scroll mechanism when the top process changes
  useEffect(() => {
    if (currentTopPid !== prevTopPidRef.current) {
      if (tableRef.current) {
        tableRef.current.scrollTop = 0
      }
      // Update the tracking ref to the new PID value
      prevTopPidRef.current = currentTopPid
    }
  }, [currentTopPid])

  // useCallback — setSortBy is stable, so these never change
  const sortByCpu = useCallback(() => setSortBy('cpu'), [])
  const sortByMem = useCallback(() => setSortBy('mem'), [])
  const toggleShowAll = useCallback(() => setShowAll(v => !v), [])

  // useMemo — same as before, all 4 dependencies correct
  const filtered = useMemo(() => {
    let list = [...processes]
    if (search.trim()) {
      const term = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        String(p.pid).includes(term)
      )
    }
    list.sort((a, b) => b[sortBy] - a[sortBy])
    return showAll ? list : list.slice(0, 10)
  }, [processes, sortBy, search, showAll])

  const stats = useMemo(() => {
    if (!processes.length) return null
    const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0)
    const totalMem = processes.reduce((sum, p) => sum + p.mem, 0)
    const topCpu   = processes.reduce((top, p) => p.cpu > top.cpu ? p : top)
    return {
      totalCpu: totalCpu.toFixed(1),
      totalMem: totalMem.toFixed(1),
      topName:  topCpu.name
    }
  }, [processes])

  // useCallback for search handler
  const handleSearch = useCallback((e) => {
    setSearch(e.target.value)
  }, [])

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '1rem',
                    flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '18px' }}>Processes</h2>
          <span style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)',
                         padding: '2px 8px', borderRadius: '12px',
                         fontSize: '13px', fontWeight: 'bold' }}>
            {processes.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SortButton active={sortBy === 'cpu'} onClick={sortByCpu} label="CPU" />
          <SortButton active={sortBy === 'mem'} onClick={sortByMem} label="MEM" />
        </div>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px',
                      color: 'var(--text-muted)', marginBottom: '0.75rem',
                      paddingLeft: '0.25rem' }}>
          <span>Total CPU: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalCpu}%</strong></span>
          <span>Total MEM: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalMem}%</strong></span>
          <span>Top: <strong style={{ color: 'var(--yellow)' }}>{stats.topName}</strong></span>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name or PID..."
        value={search}
        onChange={handleSearch}
        style={{
          width: '100%', padding: '8px 12px', marginBottom: '1rem',
          background: 'var(--bg-primary)', fontSize: '14px',
          border: `1px solid ${search ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr',
                    padding: '0.5rem 1rem', borderBottom: '2px solid var(--border)',
                    fontSize: '12px', color: 'var(--text-muted)',
                    textTransform: 'uppercase', fontWeight: 'bold' }}>
        <div>PID</div>
        <div>Name</div>
        <div style={{ color: sortBy === 'cpu' ? 'var(--blue)' : 'inherit' }}>CPU</div>
        <div style={{ color: sortBy === 'mem' ? 'var(--blue)' : 'inherit' }}>MEM</div>
      </div>

      {/* 4. Scrollable target wrapper wrapped around the table rendering logic */}
      <div ref={tableRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading
          ? [1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: '0.75rem 1rem',
                                    borderBottom: '1px solid var(--border)' }}>
                <div style={{ height: '14px', background: 'var(--bg-hover)',
                              borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              </div>
            ))
          : filtered.length === 0
            ? <div style={{ padding: '2rem', textAlign: 'center',
                            color: 'var(--text-muted)', fontSize: '14px' }}>
                {search ? `No processes matching "${search}"` : 'No processes'}
              </div>
            : filtered.map(proc => (
                <MemoProcessRow
                  key={proc.pid}
                  pid={proc.pid}
                  name={proc.name}
                  cpu={proc.cpu}
                  mem={proc.mem}
                />
              ))
        }
      </div>

      {!loading && !search && processes.length > 10 && (
        <button onClick={toggleShowAll} style={{
          marginTop: '0.75rem', padding: '6px 16px', width: '100%',
          background: 'var(--bg-hover)', color: 'var(--text-muted)',
          border: '1px solid var(--border)', borderRadius: '8px',
          cursor: 'pointer', fontSize: '13px'
        }}>
          {showAll ? 'Show less ↑' : `Show all ${processes.length} processes ↓`}
        </button>
      )}
    </div>
  )
}

const SortButton = memo(({ active, onClick, label }) => (
  <button onClick={onClick} style={{
    padding: '4px 10px', fontSize: '12px', fontWeight: '500',
    background: active ? 'var(--blue)' : 'var(--bg-hover)',
    color:      active ? '#0f172a'     : 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer'
  }}>
    {label}
  </button>
))

export default ProcessTable
