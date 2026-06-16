import { BarChart, Bar, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

const formatSpeed = (bytesPerSec) => {
  if (bytesPerSec === undefined || bytesPerSec === null || isNaN(bytesPerSec)) return '0 KB/s'
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
  }
  return `${(bytesPerSec / 1024).toFixed(0)} KB/s`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px', padding: '6px 10px',
                  fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ color: '#38bdf8' }}>
        Read: {formatSpeed(payload[0]?.value)}
      </span>
      <span style={{ color: '#ef4444' }}>
        Write: {formatSpeed(payload[1]?.value)}
      </span>
    </div>
  )
}

function DiskChart({ readHistory = [], writeHistory = [], currentRead = 0, currentWrite = 0 }) {
  const chartData = readHistory.map((readValue, index) => ({
    index: index,
    read: readValue ?? 0,
    write: writeHistory[index] ?? 0
  }))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: '1rem' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8',
                       textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Disk I/O
        </span>
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
          <span style={{ color: '#38bdf8' }}>
            ↓ Read &nbsp;{formatSpeed(currentRead)}
          </span>
          <span style={{ color: '#ef4444' }}>
            ↑ Write &nbsp;{formatSpeed(currentWrite)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          {/* CHANGED: CartesianGrid configured explicitly with hex colors */}
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(0)}M` : `${(v / 1024).toFixed(0)}K`} />
          <XAxis hide />
          <Tooltip content={<CustomTooltip />} />

          {/* VERIFIED: Cellular nodes execute conditional fill matching utilizing correct hex arrays */}
          <Bar dataKey="read" isAnimationActive={false}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.read > 1e7 ? '#38bdf8' : '#1e4a6e'} />
            ))}
          </Bar>
          <Bar dataKey="write" isAnimationActive={false}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.write > 1e7 ? '#f87171' : '#7c2d12'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {readHistory.length > 1 && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem',
                      fontSize: '11px', color: '#94a3b8' }}>
          <span>Max Read: <b style={{ color: '#f8fafc' }}>{formatSpeed(Math.max(...readHistory))}</b></span>
          <span>Max Write: <b style={{ color: '#f8fafc' }}>{formatSpeed(Math.max(...writeHistory))}</b></span>
        </div>
      )}
    </div>
  )
}

export default DiskChart
