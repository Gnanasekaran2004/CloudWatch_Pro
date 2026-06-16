import { cn } from '../utils/cn'

function MetricCard({ label, value, unit, percent }) {

  const color = cn({
    'text-green-400':  !percent || percent < 60,
    'text-yellow-400':  percent >= 60 && percent < 80,
    'text-red-400':     percent >= 80,
  })

  const barColor = cn({
    'bg-green-400':  !percent || percent < 60,
    'bg-yellow-400':  percent >= 60 && percent < 80,
    'bg-red-400':     percent >= 80,
  })

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className={cn('text-3xl font-bold leading-none', color)}>
        {value ?? '--'}
        {unit && (
          <span className="text-base ml-1 text-slate-400">{unit}</span>
        )}
      </div>
      {percent !== undefined && (
        <div className="mt-3 bg-slate-900 rounded h-1 overflow-hidden">
          <div
            className={cn('h-full rounded transition-all duration-300', barColor)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default MetricCard