import si from 'systeminformation'
import { safeFetch } from './fetcher.js'

const KNOWN_PORTS = {
  21:   'FTP',
  22:   'SSH',
  23:   'Telnet',
  25:   'SMTP',
  53:   'DNS',
  80:   'HTTP',
  443:  'HTTPS',
  3000: 'Dev server',
  3306: 'MySQL',
  5173: 'Vite',
  5432: 'PostgreSQL',
  6379: 'Redis',
  8080: 'HTTP alt',
  27017:'MongoDB'
}

export const getPorts = async ({ stateFilter = 'LISTEN' } = {}) => {
  const raw = await safeFetch(
    () => si.networkConnections(),
    [],
    'ports'
  )

  const filtered = stateFilter === 'ALL'
    ? raw
    : raw.filter(c => c.state === stateFilter)

  const portMap = new Map()

  filtered.forEach(c => {
    const portNum = parseInt(c.localPort, 10)
    const key     = `${portNum}-${c.protocol}-${c.pid}`

    if (!portMap.has(key)) {
      portMap.set(key, {
        port:      portNum,
        protocol:  c.protocol,
        state:     c.state,
        pid:       c.pid,
        label:     KNOWN_PORTS[portNum] || null,
        isKnown:   Boolean(KNOWN_PORTS[portNum])
      })
    }
  })

  const ports = Array.from(portMap.values())
    .sort((a, b) => a.port - b.port)

  return {
    total:   ports.length,
    ports
  }
}

export const isPortInUse = async (portNum) => {
  const { ports } = await getPorts({ stateFilter: 'ALL' })
  return ports.some(p => p.port === portNum)
}