import { cn } from '../utils/cn'

const CONTROLS = (subscribe, resetSubscribe, changeInterval) => [
  { label: 'All metrics',    action: resetSubscribe },
  { label: 'CPU only',       action: () => subscribe('cpu') },
  { label: 'Memory only',    action: () => subscribe('memory') },
  { label: '↑ Fast (500ms)', action: () => changeInterval?.(500) },
  { label: '→ Normal (1s)',  action: () => changeInterval?.(1000) },
  { label: '↓ Slow (3s)',    action: () => changeInterval?.(3000) },
]

function Header({
  connected, error, timestamp,
  subscribe, resetSubscribe, changeInterval,
  unreadCount = 0, onAlertsClick,
  user, onLogout 
}) {
  const controls = CONTROLS(subscribe, resetSubscribe, changeInterval)

  return (
    <div className="mb-6">

      {/* Title bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl
                      px-6 py-4 flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-slate-100">CloudWatch Pro</h1>

        <div className="flex items-center gap-3">

          {/* Bell badge — existing */}
          <button
            onClick={onAlertsClick}
            className="relative bg-transparent border border-slate-600
                       rounded-lg px-3 py-1.5 text-lg cursor-pointer
                       hover:bg-slate-700 transition-colors">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5
                               bg-red-500 text-white text-xs font-bold
                               w-4 h-4 rounded-full flex items-center justify-center
                               animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User info + logout */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-600">
            <span className="text-xs text-slate-400">
              {user?.username}
            </span>
            {user?.role === 'admin' && (
              <span className="text-xs bg-blue-900 text-blue-300
                               px-2 py-0.5 rounded-full font-medium">
                admin
              </span>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-slate-200
                         cursor-pointer transition-colors ml-1">
              Sign out
            </button>
          </div>

          {/* Status dot — existing */}
          <div className="flex items-center gap-2 text-sm pl-2">
            <span className={cn(
              'w-2.5 h-2.5 rounded-full inline-block',
              error      ? 'bg-red-400'    :
              !connected ? 'bg-yellow-400' : 'bg-green-400'
            )} />
            <span className="text-slate-300">
              {error ? 'Error' : !connected ? 'Connecting...' : 'Live'}
            </span>
          </div>

        </div>
      </div>

      {/* Timestamp */}
      <p className="text-xs text-slate-500 pl-1 mb-3">
        {timestamp
          ? `Updated: ${new Date(timestamp).toLocaleTimeString()}`
          : 'Updated: --:--:--'}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {controls.map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="px-3 py-1.5 text-xs font-medium
                       bg-slate-800 text-slate-400 border border-slate-700
                       rounded-lg hover:bg-slate-700 hover:text-slate-200
                       transition-colors cursor-pointer">
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3 bg-red-950 border border-red-500
                        rounded-lg px-4 py-3 text-sm text-red-400">
          ⚠ {error} — make sure node server.js is running
        </div>
      )}
    </div>
  )
}

export default Header
