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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-52">
            <div className="h-3 w-20 bg-slate-700 rounded animate-pulse mb-4" />
            <div className="h-28 bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
    <CpuChart     history={cpuHistory} currentPercent={metrics.cpu.percent} />
    <MemoryChart  history={memHistory} current={memDisplay} />
    <NetworkChart rxHistory={rxHistory} txHistory={txHistory} current={metrics.network} />
    <DiskChart    readHistory={diskReadHistory} writeHistory={diskWriteHistory}
                  currentRead={metrics.disk?.read ?? 0}
                  currentWrite={metrics.disk?.write ?? 0} />
  </div>
  )
}

export default MetricsGrid