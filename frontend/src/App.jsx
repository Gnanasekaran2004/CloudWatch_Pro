import { useState, useEffect, useMemo } from 'react'
import { useMetrics } from './hooks/useMetrics'
import { useRollingData } from './hooks/useRollingData'
import Header from './components/Header'
import MetricsGrid from './components/MetricsGrid'
import ProcessTable from './components/ProcessTable'
import PortsList from './components/PortsList'
import HistoryView from './components/HistoryView'
import { usePrevious } from './hooks/usePrevious'
import { ToastContainer, useToast } from './components/Toast'

function App() {
  const [activeTab, setActiveTab] = useState('live')
  const { toasts, remove, toast } = useToast()

  const {
    metrics,
    connected,
    error,
    subscribe,
    resetSubscribe,
    changeInterval
  } = useMetrics()

  const [cpuHistory, addCpuPoint] = useRollingData(60)
  const [memHistory, addMemPoint] = useRollingData(60)
  const [rxHistory,  addRxPoint]  = useRollingData(60)
  const [txHistory,  addTxPoint]  = useRollingData(60)
  const [diskReadHistory,  addDiskRead]  = useRollingData(60)
  const [diskWriteHistory, addDiskWrite] = useRollingData(60)

  const metricsLoading = metrics === null && !error
  const currentCpu = metrics?.cpu?.percent
  const prevCpu = usePrevious(currentCpu)
  const prevMetrics = usePrevious(metrics)
  const prevConnected = usePrevious(connected)
  const prevError = usePrevious(error)
  
  const autoScrollPid = useMemo(() => {
    const prevTop = prevMetrics?.processes?.[0]?.pid 
    const currentTop = metrics?.processes?.[0]?.pid
    if (currentTop !== prevTop) {
      return currentTop
    }
    return undefined
  }, [metrics, prevMetrics])

  useEffect(() => {
    if (metrics?.cpu?.percent     !== undefined) addCpuPoint(metrics.cpu.percent)
    if (metrics?.memory?.percent  !== undefined) addMemPoint(metrics.memory.percent)
    if (metrics?.network?.rx_sec  !== undefined) addRxPoint(metrics.network.rx_sec)
    if (metrics?.network?.tx_sec  !== undefined) addTxPoint(metrics.network.tx_sec)
    if (metrics?.disk?.read  !== undefined) addDiskRead(metrics.disk.read)
    if (metrics?.disk?.write !== undefined) addDiskWrite(metrics.disk.write)
  }, [metrics?.cpu?.percent, metrics?.memory?.percent,
    metrics?.network?.rx_sec,  metrics?.network?.tx_sec,
    metrics?.disk?.read, metrics?.disk?.write,
    addCpuPoint, addMemPoint, addRxPoint, addTxPoint,
    addDiskRead, addDiskWrite])

  // CPU spike alert
  useEffect(() => {
    if (currentCpu !== undefined && prevCpu !== undefined) {
      if (currentCpu > 80 && prevCpu <= 80) {
        toast.warning(`CPU spike: ${currentCpu.toFixed(1)}%`)
      }
      if (currentCpu < 80 && prevCpu >= 80) {
        toast.success(`CPU back to normal: ${currentCpu.toFixed(1)}%`)
      }
    }
  }, [currentCpu, prevCpu, toast])

  // Connection status toasts
  useEffect(() => {
    if (connected && !prevConnected && prevConnected !== undefined) {
      toast.success('Connected to backend')
    }
  }, [connected, prevConnected, toast])

  useEffect(() => {
    if (error && error !== prevError) {
      toast.error(`Connection lost: ${error}`)
    }
  }, [error, prevError, toast])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return

      switch(e.key) {
        case '1':
          setActiveTab('live')
          break
        case '2':
          setActiveTab('history')
          break
        case 'r':
        case 'R':
          toast.info('Refreshing...')
          break
        case 'Escape':
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTab, toast])

  const tabStyle = (tab) => ({
    padding:    '8px 20px',
    fontSize:   '14px',
    fontWeight: '500',
    background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
    color:      activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
    border:     activeTab === tab ? '1px solid var(--border)' : '1px solid transparent',
    borderRadius: '8px',
    cursor:     'pointer'
  })

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Header
        connected={connected}
        error={error}
        timestamp={metrics?.timestamp}
        subscribe={subscribe}
        resetSubscribe={resetSubscribe}
        changeInterval={changeInterval}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle('live')} onClick={() => setActiveTab('live')}>
          Live
        </button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          History
        </button>
      </div>

      {activeTab === 'live' ? (
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
            autoScrollPid={autoScrollPid}
          />
          <PortsList
            ports={metrics?.ports || []}
          />
        </>
      ) : (
        <HistoryView />
      )}

      {/* Keyboard hints — bottom of return */}
      <div style={{ marginTop: '2rem', paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', gap: '1.5rem',
                    fontSize: '11px', color: 'var(--text-muted)' }}>
        {[
          ['1', 'Live view'],
          ['2', 'History'],
          ['/', 'Search processes'],
          ['R', 'Refresh'],
        ].map(([key, label]) => (
          <span key={key}>
            <kbd style={{ background: 'var(--bg-hover)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px', padding: '1px 6px',
                          fontFamily: 'monospace', fontSize: '11px',
                          marginRight: '4px' }}>
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
