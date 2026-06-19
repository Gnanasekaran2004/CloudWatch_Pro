import { cn } from '../utils/cn'

const SEVERITY = {
  high: {
    card:  'bg-red-950/40 border border-red-500/50 border-l-4 border-l-red-500',
    badge: 'bg-red-500 text-white',
    icon:  '🔴'
  },
  medium: {
    card:  'bg-yellow-950/40 border border-yellow-500/50 border-l-4 border-l-yellow-500',
    badge: 'bg-yellow-400 text-slate-900',
    icon:  '🟡'
  },
  low: {
    card:  'bg-green-950/40 border border-green-500/50 border-l-4 border-l-green-500',
    badge: 'bg-green-500 text-white',
    icon:  '🟢'
  }
}

const AlertCard = ({ alert, onDismiss }) => {
  const s    = SEVERITY[alert.severity] ?? SEVERITY.medium
  const time = new Date(alert.timestamp).toLocaleTimeString()
  const date = new Date(alert.timestamp).toLocaleDateString()

  return (
    <div className={cn('rounded-xl p-4 mb-3', s.card)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span>{s.icon}</span>
          <span className="font-semibold text-sm text-slate-100">
            {alert.title}
          </span>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full uppercase', s.badge)}>
            {alert.severity}
          </span>
        </div>
        <button
          onClick={() => alert.id ? onDismiss(alert.id) : null}
          disabled={!alert.id}
          className={cn(
            'text-slate-400 hover:text-slate-200 cursor-pointer bg-transparent border-none text-lg leading-none px-1 flex-shrink-0 transition-colors',
            !alert.id && 'opacity-50 cursor-not-allowed'
          )}>
          ×
        </button>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        {alert.message}
      </p>

      {alert.suggested_action && (
        <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-xs text-slate-400 mb-3">
          <span className="font-semibold text-slate-200">Action: </span>
          {alert.suggested_action}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        {alert.cpu    != null && <span>CPU {alert.cpu?.toFixed(1)}%</span>}
        {alert.memory != null && <span>MEM {alert.memory?.toFixed(1)}%</span>}
        {alert.disk   != null && <span>DISK {alert.disk?.toFixed(1)}%</span>}
        <span className="ml-auto">{date} {time}</span>
      </div>
    </div>
  )
}

function AlertPanel({ alerts = [], loading, onDismiss }) {
  if (loading) return (
    <div className="py-16 text-center text-sm text-slate-500">
      Loading alerts...
    </div>
  )

  if (alerts.length === 0) return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl py-16 text-center">
      <div className="text-4xl mb-3">✅</div>
      <div className="text-base font-medium text-slate-200 mb-1">
        All systems normal
      </div>
      <div className="text-sm text-slate-500">
        No anomalies detected. AI monitoring is active.
      </div>
    </div>
  )

  const high   = alerts.filter(a => a.severity === 'high')
  const medium = alerts.filter(a => a.severity === 'medium')
  const low    = alerts.filter(a => a.severity === 'low')

  return (
    <div>
      <div className="flex gap-3 mb-5 flex-wrap">
        {[
          { label: 'Critical', count: high.length,   dot: 'bg-red-500'    },
          { label: 'Warning',  count: medium.length, dot: 'bg-yellow-400' },
          { label: 'Info',     count: low.length,    dot: 'bg-green-500'  },
        ].map(({ label, count, dot }) => (
          <div key={label}
               className="bg-slate-800 border border-slate-700 rounded-lg
                          px-4 py-2 flex items-center gap-2 text-sm">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />
            <span className="text-slate-400">{label}</span>
            <span className="font-semibold text-slate-100">{count}</span>
          </div>
        ))}
      </div>

      {[...high, ...medium, ...low].map(alert => (
        <AlertCard
          key={alert.id ?? alert.timestamp}
          alert={alert}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

export default AlertPanel