import { fetchAllRaw, getFailedSources } from './fetcher.js'
import { shapeSnapshot }                 from './shaper.js'

export const getCleanSnapshot = async () => {
  const raw = await fetchAllRaw()
  return shapeSnapshot(raw)
}

export const getHealth = () => {
  const failed = getFailedSources()
  const count  = failed.length
  return {
    status:        count === 0 ? 'ok' : count <= 2 ? 'degraded' : 'error',
    failedSources: failed
  }
}

export { MetricsEmitter } from './emitter.js'
export { shapeSnapshot }  from './shaper.js'
export { safeFetch }      from './fetcher.js'
export { getTopProcesses, getProcessByPid } from './processes.js'
export { getPorts, isPortInUse }            from './ports.js'