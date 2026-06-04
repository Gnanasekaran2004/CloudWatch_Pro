import si from 'systeminformation'

let failedSources = []

export const getFailedSources  = () => [...failedSources]
export const resetFailedSources = () => { failedSources = [] }

export const safeFetch = async (fn, fallback, sourceName) => {
  try {
    return await fn()
  } catch (err) {
    console.warn(`⚠ ${sourceName} read failed: ${err.message}`)
    failedSources.push(sourceName)
    return fallback
  }
}

export const fetchAllRaw = async () => {
  resetFailedSources()

  const [cpuLoad, mem, disk, net, procs, conns] = await Promise.all([
    safeFetch(() => si.currentLoad(),        { currentLoad: 0, cpus: [] }, 'cpu'),
    safeFetch(() => si.mem(),                { used: 0, total: 1, free: 0 }, 'memory'),
    safeFetch(() => si.fsSize(),             [], 'disk'),
    safeFetch(() => si.networkStats(),       [], 'network'),
    safeFetch(() => si.processes(),          { list: [] }, 'processes'),
    safeFetch(() => si.networkConnections(), [], 'ports')
  ])

  return { cpuLoad, mem, disk, net, procs, conns }
}