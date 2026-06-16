import { LineChart, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid,
         ReferenceLine } from 'recharts'
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

function CpuChart({ history = [], currentPercent }) {
  const data = useChartData(history, 'cpu')
  
  // CHANGED: Evaluated color thresholds using pure hex values
  const lineColor = currentPercent > 80 ? '#ef4444' :
                    currentPercent > 60 ? '#f59e0b' :
                                          '#38bdf8'

  const lastTen = history.slice(-10)
  const renderSparkline = () => {
    return lastTen.map((val, i) => {
      let block = '░'
      let color = '#475569'
      if (val > 80) { block = '█'; color = '#ef4444' }
      else if (val > 60) { block = '▓'; color = '#f59e0b' }
      else if (val > 30) { block = '▒'; color = '#38bdf8' }
      return <span key={i} style={{ color, fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px' }}>{block}</span>
    })
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          CPU Usage
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold',
                       color: lineColor }}>
          {currentPercent?.toFixed(1) ?? '--'}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}
                   margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          {/* CHANGED: CartesianGrid configured with slate-800 hex representation */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
          />
          <XAxis hide />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />

          <Line
            type="monotone"
            dataKey="cpu"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {history.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '11px', color: '#94a3b8' }}>
            <span>Min: <b style={{ color: '#22c55e' }}>{Math.min(...history).toFixed(1)}%</b></span>
            <span>Max: <b style={{ color: '#ef4444' }}>{Math.max(...history).toFixed(1)}%</b></span>
            <span>Avg: <b style={{ color: '#f8fafc' }}>{(history.reduce((a,b) => a+b, 0) / history.length).toFixed(1)}%</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px', color: '#94a3b8' }}>
            <span>Sparkline:</span>
            <div style={{ display: 'flex' }}>{renderSparkline()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CpuChart
