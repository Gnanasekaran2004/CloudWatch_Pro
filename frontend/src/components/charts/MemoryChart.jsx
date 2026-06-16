import { AreaChart, Area, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid } from 'recharts'
import { useChartData } from '../../hooks/useChartData'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px', padding: '6px 10px',
                  fontSize: '13px' }}>
      <span style={{ color: '#38bdf8' }}>
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

  const freeMemoryColor = freeMemoryGb > 4 ? '#22c55e' :
                          freeMemoryGb > 1 ? '#f59e0b' :
                                             '#ef4444'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Memory Usage
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>
          {currentPercent.toFixed(1)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          {/* CHANGED: CartesianGrid updated to use clear hex border string */}
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
          <XAxis hide />
          <Tooltip content={<CustomTooltip />} />
          {/* CHANGED: Line updated to Area layout config with specified theme hex codes */}
          <Area 
            type="monotone" 
            dataKey="memory" 
            stroke="#a855f7" 
            fill="#a855f7" 
            fillOpacity={0.1}
            strokeWidth={2} 
            isAnimationActive={false} 
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '11px', color: '#94a3b8' }}>
        <span>Used: <b style={{ color: '#f8fafc' }}>{currentUsedGb.toFixed(1)} GB</b></span>
        <span>Total: <b style={{ color: '#94a3b8' }}>{totalGb.toFixed(0)} GB</b></span>
        <span>Free: <b style={{ color: freeMemoryColor }}>{freeMemoryGb.toFixed(1)} GB</b></span>
      </div>
    </div>
  )
}

export default MemoryChart
