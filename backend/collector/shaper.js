import { formatPercent } from '../utils/index.js'

export const shapeSnapshot = (rawData) => {
  const { cpuLoad, mem, disk, net, procs, conns } = rawData

  const mainDisk = disk?.[0]  || { size: 0, used: 0, use: 0 }
  const mainNet  = net?.[0]   || { rx_sec: 0, tx_sec: 0 }

  const processes = (procs?.list || [])
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 20)
    .map(p => ({
      pid:  p.pid,
      name: p.name,
      cpu:  formatPercent(p.cpu),
      mem:  formatPercent(p.mem)
    }))

  const portMap = new Map()
  ;(conns || [])
    .filter(c => c.state === 'LISTEN')
    .forEach(c => {
      const key = `${c.localPort}-${c.protocol}-${c.pid}`
      if (!portMap.has(key)) {
        portMap.set(key, {
          port:     parseInt(c.localPort, 10),
          protocol: c.protocol,
          pid:      c.pid
        })
      }
    })

  return {
    timestamp: Date.now(),

    cpu: {
      percent: formatPercent(cpuLoad.currentLoad),
      cores:   (cpuLoad.cpus || []).map(c => formatPercent(c.load))
    },

    memory: {
      total:   mem.total,
      used:    mem.used,
      free:    mem.free,
      percent: formatPercent((mem.used / mem.total) * 100)
    },

    disk: {
      total:   mainDisk.size,
      used:    mainDisk.used,
      percent: formatPercent(mainDisk.use)
    },

    network: {
      rx_sec: mainNet.rx_sec ?? 0,
      tx_sec: mainNet.tx_sec ?? 0
    },

    processes,
    ports: Array.from(portMap.values())
  }
}