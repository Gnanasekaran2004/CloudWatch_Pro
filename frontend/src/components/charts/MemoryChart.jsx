import { LineChart, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid } from 'recharts'
import { useChartData } from '../../hooks/useChartData'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '6px 10px',
                  fontSize: '13px' }}>
      <span style={{ color: 'var(--blue)' }}>
        {payload[0].value.toFixed(1)}%
      </span>
    </div>
  )
}

function MemoryChart({ history = [], current }) {
  const data = useChartData(history, 'memory')
  
  const currentPercent = current?.percent ?? 0
  const totalGb        = current?.total   ?? 16
  const currentUsedGb  = current?.used    ?? 0
  const freeMemoryGb   = current?.free    ?? (totalGb - currentUsedGb)

  const freeMemoryColor = freeMemoryGb > 4 ? 'var(--green)' :
                          freeMemoryGb > 1 ? 'var(--yellow)' :
                                             'var(--red)'

  return (
    <div style={{ background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Memory Usage
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--blue)' }}>
          {currentPercent.toFixed(1)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
          <XAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="memory" stroke="var(--blue)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Used: <b style={{ color: 'var(--text-primary)' }}>{currentUsedGb.toFixed(1)} GB</b></span>
        <span>Total: <b style={{ color: 'var(--text-muted)' }}>{totalGb.toFixed(0)} GB</b></span>
        <span>Free: <b style={{ color: freeMemoryColor }}>{freeMemoryGb.toFixed(1)} GB</b></span>
      </div>
    </div>
  )
}

export default MemoryChart
