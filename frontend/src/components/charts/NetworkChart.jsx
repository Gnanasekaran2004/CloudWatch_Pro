import { useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid } from 'recharts'

const formatDataAmount = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B'
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px', padding: '6px 10px',
                  fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ color: '#38bdf8' }}>Rx: {formatDataAmount(payload[0]?.value)}/s</span>
      <span style={{ color: '#a855f7' }}>Tx: {formatDataAmount(payload[1]?.value)}/s</span>
    </div>
  )
}

function NetworkChart({ rxHistory = [], txHistory = [], currentRx = 0, currentTx = 0 }) {
  const totalRxRef = useRef(0)
  const totalTxRef = useRef(0)

  useEffect(() => {
    if (rxHistory.length > 0) {
      totalRxRef.current += (rxHistory[rxHistory.length - 1] ?? 0)
    }
    if (txHistory.length > 0) {
      totalTxRef.current += (txHistory[txHistory.length - 1] ?? 0)
    }
  }, [rxHistory.length, txHistory.length])

  const chartData = rxHistory.map((rxValue, index) => ({
    index: index,
    rx: rxValue ?? 0,
    tx: txHistory[index] ?? 0
  }))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Network I/O
        </span>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
          <span style={{ color: '#38bdf8' }}>↓ {formatDataAmount(currentRx)}/s</span>
          <span style={{ color: '#a855f7' }}>↑ {formatDataAmount(currentTx)}/s</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          {/* CHANGED: Swapped track lines for pure hex codes */}
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(0)}M` : `${(v / 1024).toFixed(0)}K`} />
          <XAxis hide />
          <Tooltip content={<CustomTooltip />} />
          {/* CHANGED: Assigned explicit hex tracks across lines */}
          <Line type="monotone" dataKey="rx" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="tx" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '0.75rem', fontSize: '11px', color: '#94a3b8' }}>
        <span>Session: <b style={{ color: '#38bdf8' }}>↓ {formatDataAmount(totalRxRef.current)}</b> &nbsp;<b style={{ color: '#a855f7' }}>↑ {formatDataAmount(totalTxRef.current)}</b></span>
      </div>
    </div>
  )
}

export default NetworkChart
