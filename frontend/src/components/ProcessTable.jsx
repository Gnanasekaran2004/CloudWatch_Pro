import { useState, useMemo, useCallback, memo } from 'react'
import { cn } from '../utils/cn'
import ProcessRow from './ProcessRow'

const SortButton = memo(({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer',
      active
        ? 'bg-blue-400 text-slate-900 border-blue-400'
        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
    )}>
    {label}
  </button>
))

function ProcessTable({ processes = [], loading }) {
  const [sortBy,  setSortBy]  = useState('cpu')
  const [search,  setSearch]  = useState('')
  const [showAll, setShowAll] = useState(false)

  const sortByCpu    = useCallback(() => setSortBy('cpu'), [])
  const sortByMem    = useCallback(() => setSortBy('mem'), [])
  const toggleAll    = useCallback(() => setShowAll(v => !v), [])
  const handleSearch = useCallback(e => setSearch(e.target.value), [])

  const stats = useMemo(() => {
    if (!processes.length) return null
    const totalCpu = processes.reduce((s, p) => s + p.cpu, 0)
    const top      = processes.reduce((t, p) => p.cpu > t.cpu ? p : t)
    return { totalCpu: totalCpu.toFixed(1), topName: top.name }
  }, [processes])

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

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Processes</h2>
          <span className="bg-slate-700 text-slate-400 text-xs font-bold
                           px-2 py-0.5 rounded-full">
            {processes.length}
          </span>
          {stats && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Total CPU: <b className="text-slate-300">{stats.totalCpu}%</b>
              {' · '}Top: <b className="text-yellow-400">{stats.topName}</b>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <SortButton active={sortBy === 'cpu'} onClick={sortByCpu} label="CPU" />
          <SortButton active={sortBy === 'mem'} onClick={sortByMem} label="MEM" />
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or PID...  (press / to focus)"
        value={search}
        onChange={handleSearch}
        className={cn(
          'w-full px-3 py-2 mb-4 text-sm rounded-lg outline-none transition-colors',
          'bg-slate-900 text-slate-200 placeholder-slate-500',
          'border',
          search ? 'border-blue-400' : 'border-slate-600',
          'focus:border-blue-400'
        )}
      />

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_2fr_1fr_1fr] px-4 py-2
                      border-b-2 border-slate-600
                      text-xs text-slate-400 uppercase font-bold tracking-wider">
        <div>PID</div>
        <div>Name</div>
        <div className={cn(sortBy === 'cpu' ? 'text-blue-400' : '')}>CPU</div>
        <div className={cn(sortBy === 'mem' ? 'text-blue-400' : '')}>MEM</div>
      </div>

      {/* Rows */}
      {loading
        ? [1,2,3,4,5].map(i => (
            <div key={i} className="px-4 py-3 border-b border-slate-700">
              <div className="h-3.5 bg-slate-700 rounded animate-pulse" />
            </div>
          ))
        : filtered.length === 0
          ? (
            <div className="py-10 text-center text-sm text-slate-500">
              {search ? `No processes matching "${search}"` : 'No processes'}
            </div>
          )
          : filtered.map(proc => (
              <ProcessRow
                key={proc.pid}
                pid={proc.pid}
                name={proc.name}
                cpu={proc.cpu}
                mem={proc.mem}
              />
            ))
      }

      {/* Show more */}
      {!loading && !search && processes.length > 10 && (
        <button
          onClick={toggleAll}
          className="mt-3 w-full py-2 text-xs text-slate-400
                     bg-slate-700 hover:bg-slate-600 border border-slate-600
                     rounded-lg cursor-pointer transition-colors">
          {showAll ? 'Show less ↑' : `Show all ${processes.length} processes ↓`}
        </button>
      )}
    </div>
  )
}

export default ProcessTable