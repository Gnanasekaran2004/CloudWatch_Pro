import { useState, useMemo, useCallback, memo } from 'react'
import { cn } from '../utils/cn'

const portColor = (port) => {
  if ([80, 443].includes(port))             return 'text-green-400 border-green-800'
  if ([3000, 5173, 8080].includes(port))    return 'text-yellow-400 border-yellow-800'
  if ([22, 21].includes(port))              return 'text-red-400 border-red-800'
  return 'text-blue-400 border-blue-900'
}

const MemoPortRow = memo(({ port, label, protocol, pid }) => (
  <div className="grid grid-cols-[80px_1fr_80px_80px] px-4 py-3
                  border-b border-slate-700 text-sm
                  hover:bg-slate-700/50 transition-colors">
    <div className={cn('font-mono font-bold', portColor(port))}>:{port}</div>
    <div className={cn('text-sm', label ? 'text-slate-200' : 'text-slate-500 italic')}>
      {label || 'unknown'}
    </div>
    <div className="text-xs text-slate-400 uppercase">{protocol || 'tcp'}</div>
    <div className="text-xs text-slate-500">PID {pid}</div>
  </div>
))

function PortsList({ ports = [], loading }) {
  const [filter, setFilter] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFilter = useCallback(e => setFilter(e.target.value), [])

  const filteredPorts = useMemo(() =>
    ports.filter(p => filter ? String(p.port).includes(filter) : true),
    [ports, filter]
  )

  const stats = useMemo(() => ({
    total:   ports.length,
    known:   ports.filter(p => p.label).length,
    unknown: ports.filter(p => !p.label).length
  }), [ports])

  const copyPorts = useCallback(() => {
    if (!ports.length) return
    navigator.clipboard.writeText(ports.map(p => p.port).join(', '))
    setCopied(true)
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [ports])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Active Ports</h2>
          <span className="bg-slate-700 text-slate-400 text-xs font-bold
                           px-2 py-0.5 rounded-full">
            {ports.length}
          </span>
        </div>
        <button
          onClick={copyPorts}
          disabled={!ports.length}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md border transition-all',
            copied
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600',
            !ports.length && 'opacity-50 cursor-not-allowed'
          )}>
          {copied ? '✓ Copied!' : 'Copy all'}
        </button>
      </div>

      {/* Stats */}
      {ports.length > 0 && (
        <div className="flex gap-3 text-xs text-slate-500 mb-3">
          <span>{stats.total} total</span>
          <span>·</span>
          <span className="text-green-500">{stats.known} known</span>
          <span>·</span>
          <span>{stats.unknown} unknown</span>
        </div>
      )}

      {/* Filter */}
      <input
        type="text"
        placeholder="Filter by port number..."
        value={filter}
        onChange={handleFilter}
        className={cn(
          'w-full px-3 py-2 mb-4 text-sm rounded-lg outline-none transition-colors',
          'bg-slate-900 text-slate-200 placeholder-slate-500 border',
          filter ? 'border-blue-400' : 'border-slate-600',
          'focus:border-blue-400'
        )}
      />

      {/* Column headers */}
      <div className="grid grid-cols-[80px_1fr_80px_80px] px-4 py-2
                      border-b-2 border-slate-600
                      text-xs text-slate-400 uppercase font-bold tracking-wider">
        <div>Port</div>
        <div>Service</div>
        <div>Protocol</div>
        <div>PID</div>
      </div>

      {/* Rows */}
      {loading
        ? [1,2,3].map(i => (
            <div key={i} className="px-4 py-3 border-b border-slate-700">
              <div className="h-3.5 bg-slate-700 rounded animate-pulse" />
            </div>
          ))
        : filteredPorts.length === 0
          ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {filter ? `No ports matching "${filter}"` : 'No active ports'}
            </div>
          )
          : filteredPorts.map(p => (
              <MemoPortRow
                key={`${p.port}-${p.protocol || 'tcp'}`}
                port={p.port}
                label={p.label}
                protocol={p.protocol}
                pid={p.pid}
              />
            ))
      }
    </div>
  )
}

export default PortsList