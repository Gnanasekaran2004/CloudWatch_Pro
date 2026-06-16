
import { useState, useEffect } from 'react'

import { useAuth }        from './hooks/useAuth'
import { useMetrics }     from './hooks/useMetrics'
import { useAlerts }      from './hooks/useAlerts'
import { useRollingData } from './hooks/useRollingData'
import { usePrevious }    from './hooks/usePrevious'
import { useToast }       from './components/Toast'

import Header             from './components/Header'
import MetricsGrid        from './components/MetricsGrid'
import ProcessTable       from './components/ProcessTable'
import PortsList          from './components/PortsList'
import HistoryView        from './components/HistoryView'
import AlertPanel         from './components/AlertPanel'
import ThresholdSettings  from './components/ThresholdSettings'
import AiStats            from './components/AiStats'
import LoginPage          from './pages/LoginPage'
import { ToastContainer } from './components/Toast'
import AdminPanel from './pages/AdminPanel'
import { cn }             from './utils/cn'

function App() {
  const { user, loading: authLoading, login, logout } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={login} />
  }
  return <Dashboard user={user} onLogout={logout} />
}

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('live')

  const {
    metrics, connected, error,
    subscribe, resetSubscribe, changeInterval, socketRef
  } = useMetrics()

  const { 
    alerts, loading: alertsLoading,
    unreadCount, dismissAlert, clearUnread 
  } = useAlerts(socketRef?.current)

  const { toasts, remove, toast } = useToast()

  const [cpuHistory,       addCpuPoint]   = useRollingData(60)
  const [memHistory,       addMemPoint]   = useRollingData(60)
  const [rxHistory,        addRxPoint]    = useRollingData(60)
  const [txHistory,        addTxPoint]    = useRollingData(60)
  const [diskReadHistory,  addDiskRead]   = useRollingData(60)
  const [diskWriteHistory, addDiskWrite]  = useRollingData(60)

  const metricsLoading = metrics === null && !error
  const currentCpu     = metrics?.cpu?.percent
  const prevCpu        = usePrevious(currentCpu)

  useEffect(() => {
    if (!metrics) return
    if (metrics.cpu?.percent     !== undefined) addCpuPoint(metrics.cpu.percent)
    if (metrics.memory?.percent  !== undefined) addMemPoint(metrics.memory.percent)
    if (metrics.network?.rx_sec  !== undefined) addRxPoint(metrics.network.rx_sec)
    if (metrics.network?.tx_sec  !== undefined) addTxPoint(metrics.network.tx_sec)
    if (metrics.disk?.read       !== undefined) addDiskRead(metrics.disk.read)
    if (metrics.disk?.write      !== undefined) addDiskWrite(metrics.disk.write)
  }, [
    metrics?.cpu?.percent, 
    metrics?.memory?.percent,
    metrics?.network?.rx_sec,  
    metrics?.network?.tx_sec,
    metrics?.disk?.read,       
    metrics?.disk?.write
  ])

  useEffect(() => {
    if (currentCpu > 80 && (prevCpu ?? 0) <= 80) {
      toast.warning(`CPU spike: ${currentCpu.toFixed(1)}%`)
    }
  }, [currentCpu])

  useEffect(() => {
    if (alerts.length > 0) {
      const latest = alerts[0]
      if (Date.now() - latest.timestamp < 5000) {
        toast.warning(`AI Alert: ${latest.title}`)
      }
    }
  }, [alerts.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === '1') setActiveTab('live')
      if (e.key === '2') setActiveTab('history')
      if (e.key === '3') { setActiveTab('alerts'); clearUnread() }
      if (e.key === '4') setActiveTab('settings')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <Header
        connected={connected}
        error={error}
        timestamp={metrics?.timestamp}
        subscribe={subscribe}
        resetSubscribe={resetSubscribe}
        changeInterval={changeInterval}
        unreadCount={unreadCount}
        onAlertsClick={() => { setActiveTab('alerts'); clearUnread() }}
        user={user}
        onLogout={onLogout}
      />

      <div className="flex gap-2 mb-6">
        {[
          { key: 'live',     label: 'Live' },
          { key: 'history',  label: 'History' },
          { key: 'alerts',   label: 'Alerts',    badge: unreadCount },
          { key: 'settings', label: '⚙ Settings' },
        ].map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key)
              if (key === 'alerts') clearUnread()
            }}
            className={cn(
              'relative px-5 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer',
              activeTab === key
                ? 'bg-slate-800 text-slate-100 border-slate-600'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-300'
            )}>
            {label}
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white
                               text-xs font-bold w-4 h-4 rounded-full
                               flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'live' && (
        <>
          <MetricsGrid
            metrics={metrics}
            loading={metricsLoading}
            cpuHistory={cpuHistory}
            memHistory={memHistory}
            rxHistory={rxHistory}
            txHistory={txHistory}
            diskReadHistory={diskReadHistory}
            diskWriteHistory={diskWriteHistory}
          />
          <ProcessTable
            processes={metrics?.processes || []}
            loading={metricsLoading}
          />
          <PortsList ports={metrics?.ports || []} />
        </>
      )}

      {activeTab === 'history' && <HistoryView />}

      {activeTab === 'alerts' && (
        <AlertPanel
          alerts={alerts}
          loading={alertsLoading}
          onDismiss={dismissAlert}
        />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <ThresholdSettings />
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              AI Monitor Stats
            </h2>
            <AiStats />
          </div>
          {user?.role === 'admin' && (
            <AdminPanel currentUser={user} />
          )}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-slate-700
                      flex flex-wrap gap-5 text-xs text-slate-500">
        {[
          ['1', 'Live'],
          ['2', 'History'],
          ['3', 'Alerts'],
          ['4', 'Settings'],
          ['/', 'Search']
        ].map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <kbd className="bg-slate-800 border border-slate-600 rounded
                            px-1.5 py-0.5 font-mono text-slate-300">
              {key}
            </kbd>
            {label}
          </span>
        ))}
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  )
}

export default App
