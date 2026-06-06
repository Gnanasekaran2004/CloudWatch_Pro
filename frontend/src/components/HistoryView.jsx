import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid } from 'recharts'

const formatValue = (v, unit) => {
  if (v === undefined || v === null || isNaN(v)) return '--'
  if (unit === 'B' || unit === 'B/s') {
    if (v >= 1024 * 1024 * 1024) return `${(v / (1024 * 1024 * 1024)).toFixed(1)} GB${unit === 'B/s' ? '/s' : ''}`
    if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB${unit === 'B/s' ? '/s' : ''}`
    if (v >= 1024) return `${(v / 1024).toFixed(1)} KB${unit === 'B/s' ? '/s' : ''}`
    return `${v} ${unit}`
  }
  return `${v.toFixed(1)}${unit}`
}

const ChartTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '6px 10px',
                  fontSize: '13px' }}>
      <span style={{ color: payload[0].color }}>
        {formatValue(payload[0].value, unit)}
      </span>
    </div>
  )
}

function ChartCard({ title, color, dataKey, unit, data }) {
  return (
    <div style={{ background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              if (unit === 'B' || unit === 'B/s') {
                return v >= 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(0)}M` : `${(v / 1024).toFixed(0)}K`
              }
              return `${v}${unit}`
            }}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function HistoryView() {
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL || ''
    fetch(`${base}/api/history?range=30m`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistoryData(data)
        } else if (Array.isArray(data?.data)) {
          setHistoryData(data.data)
        } else if (data?.history) {
          setHistoryData(data.history)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load chart metrics history:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading historical snapshots...</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
      <ChartCard title="Historical CPU" color="var(--blue)" dataKey="cpu" unit="%" data={historyData} />
      <ChartCard title="Historical Memory" color="var(--purple)" dataKey="memory" unit="%" data={historyData} />
      <ChartCard title="Historical Disk Read" color="var(--blue)" dataKey="disk_read" unit="B/s" data={historyData} />
      <ChartCard title="Historical Disk Write" color="var(--red)" dataKey="disk_write" unit="B/s" data={historyData} />
    </div>
  )
}

export default HistoryView
