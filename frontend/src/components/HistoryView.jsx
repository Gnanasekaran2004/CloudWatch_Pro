import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid } from 'recharts'
import { getToken } from '../api/client'

const cn = (...classes) => classes.filter(Boolean).join(' ')

const formatValue = (v, unit) => {
  if (v === undefined || v === null || isNaN(v)) return '--'
  if (unit === 'B' || unit === 'B/s' || unit === ' B/s') {
    if (v >= 1024 * 1024 * 1024) return `${(v / (1024 * 1024 * 1024)).toFixed(1)} GB${unit.trim() === 'B/s' ? '/s' : ''}`
    if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB${unit.trim() === 'B/s' ? '/s' : ''}`
    if (v >= 1024) return `${(v / 1024).toFixed(1)} KB${unit.trim() === 'B/s' ? '/s' : ''}`
    return `${v} ${unit.trim()}`
  }
  return `${v.toFixed(1)}${unit}`
}

const thinData = (dataArray) => {
  if (!Array.isArray(dataArray)) return []
  return dataArray
}

const ChartTooltip = ({ active, payload, unit, color }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px', padding: '6px 10px',
                  fontSize: '13px' }}>
      <span style={{ color: color }}>
        {formatValue(payload[0].value, unit)}
      </span>
    </div>
  )
}

function ChartCard({ title, color, dataKey, unit, data }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-3">
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              if (unit === 'B' || unit === 'B/s' || unit === ' B/s') {
                return v >= 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(0)}M` : `${(v / 1024).toFixed(0)}K`
              }
              return `${v}${unit}`
            }}
          />
          <Tooltip content={<ChartTooltip unit={unit} color={color} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.1}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function HistoryView() {
  const [historyData, setHistoryData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('30m')

  const ranges = [
    { label: '5m', value: '5m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '24h', value: '24h' }
  ]

  const fetchHistory = useCallback(async (selectedRange) => {
    setLoading(true)
    setError(null)
    const base = import.meta.env.VITE_BACKEND_URL || ''
    
    try {
      const res = await fetch(`${base}/api/history?range=${selectedRange}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to fetch history')

      let rawArray = []
      if (Array.isArray(body)) rawArray = body
      else if (Array.isArray(body?.data)) rawArray = body.data
      else if (body?.history) rawArray = body.history

      setHistoryData(thinData(rawArray))

      const statsRes = await fetch(`${base}/api/db/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (statsRes.ok) {
        const statsBody = await statsRes.json()
        setStats(statsBody)
      }
    } catch (err) {
      console.error('Failed to resolve historical payload:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(range)
  }, [range, fetchHistory])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer',
                range === r.value
                  ? 'bg-blue-400 text-slate-900 border-blue-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              )}>
              {r.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchHistory(range)}
          className="px-3 py-1.5 text-sm bg-slate-800 text-slate-400
                     border border-slate-700 rounded-lg hover:bg-slate-700
                     cursor-pointer transition-colors"
          title="Refresh Historical Views">
          ↻
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-xl">
          Error loading tracking metrics: {error}
        </div>
      )}

      {stats && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl text-xs text-slate-400">
          <div>DB Status: <span className="text-emerald-400 font-mono font-semibold">{stats.status || 'Active'}</span></div>
          <div>Records Logged: <span className="text-slate-200 font-mono">{stats.totalRecords ?? '--'}</span></div>
          <div>Disk Usage: <span className="text-slate-200 font-mono">{formatValue(stats.sizeBytes, 'B')}</span></div>
          <div>Pruned Logs: <span className="text-slate-200 font-mono">{stats.cleanedCount ?? 0}</span></div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400 animate-pulse">
          Loading historical trends...
        </div>
      ) : historyData.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No data for this range yet. Let the backend run for a few minutes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard title="CPU Usage"   dataKey="cpu"        color="#38bdf8" unit="%" data={historyData} />
          <ChartCard title="Memory Usage" dataKey="memory"    color="#a855f7" unit="%" data={historyData} />
          <ChartCard title="Disk Write"  dataKey="disk_write" color="#f59e0b" unit=" B/s" data={historyData} />
          <ChartCard title="Network Rx"  dataKey="rx"         color="#22c55e" unit=" B/s" data={historyData} />
        </div>
      )}
    </div>
  )
}

export default HistoryView
