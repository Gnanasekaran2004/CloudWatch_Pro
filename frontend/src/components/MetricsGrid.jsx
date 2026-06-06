import { useMemo } from 'react'
import Skeleton      from './Skeleton'
import CpuChart      from './charts/CpuChart'
import MemoryChart   from './charts/MemoryChart'
import NetworkChart  from './charts/NetworkChart'
import DiskChart     from './charts/DiskChart'

function MetricsGrid({
  metrics,
  loading,
  cpuHistory,
  memHistory,
  rxHistory,
  txHistory,
  diskReadHistory,
  diskWriteHistory
}) {

  const memDisplay = useMemo(() => {
    if (!metrics?.memory) return null
    return {
      ...metrics.memory,
      used:  metrics.memory.used  / 1e9,
      total: metrics.memory.total / 1e9,
      free:  metrics.memory.free  / 1e9
    }
  }, [metrics?.memory])

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '1rem', marginBottom: '2rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px', padding: '1.25rem',
                                height: '200px' }}>
            <Skeleton height="12px" width="80px" />
            <div style={{ marginTop: '1rem' }}>
              <Skeleton height="120px" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div style={{ display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem' }}>

      <CpuChart
        history={cpuHistory}
        currentPercent={metrics.cpu.percent}
      />

      <MemoryChart
        history={memHistory}
        current={memDisplay}
      />

      <NetworkChart
        rxHistory={rxHistory}
        txHistory={txHistory}
        current={metrics.network}
      />

      <DiskChart
        readHistory={diskReadHistory}
        writeHistory={diskWriteHistory}
        currentRead={metrics.disk?.read  ?? 0}
        currentWrite={metrics.disk?.write ?? 0}
      />

    </div>
  )
}

export default MetricsGrid