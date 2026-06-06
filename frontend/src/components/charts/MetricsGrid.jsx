import MetricCard from './MetricCard'
import Skeleton   from './Skeleton'
import CpuChart   from './charts/CpuChart'
import NetworkChart from './charts/NetworkChart'
import MemChart from './charts/MemChart'
import DiskChart from './charts/DiskChart'
const formatNet = (bytes) => {
  if (!bytes) return '0 B/s'
  if (bytes > 1e6) return (bytes/1e6).toFixed(1) + ' MB/s'
  if (bytes > 1e3) return (bytes/1e3).toFixed(1) + ' KB/s'
  return bytes + ' B/s'
}

function MetricsGrid({ metrics, loading, cpuHistory, rxHistory, txHistory}) {
  if (loading) {
    return (
      <div style={{ display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem', marginBottom: '2rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px', padding: '1.5rem' }}>
            <Skeleton height="12px" width="60px" />
            <div style={{ marginTop: '0.75rem' }}>
              <Skeleton height="2rem" width="80px" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <CpuChart
          history={cpuHistory}
          currentPercent={metrics.cpu.percent}
        />
        <MemChart
          history={memHistory}
          currentPercent={metrics.memory.percent}
        />
        
      </div>
      <div style={{ display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem' }}>
        <MetricCard
          label="Memory"
          value={metrics.memory.percent}
          unit="%"
          percent={metrics.memory.percent}
        />
        <NetworkChart
        rxhistory = {rxHistory}
        txhistory = {txHistory}
        current = {metrics.network}
        />
        <MetricCard
          label="Disk"
          value={metrics.disk.percent}
          unit="%"
          percent={metrics.disk.percent}
        />
        <MetricCard
          label="Network ↓"
          value={formatNet(metrics.network.rx_sec)}
        />
      </div>
    </div>
  )
}

export default MetricsGrid