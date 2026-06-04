import { Router } from 'express'
import { MetricsEmitter, getHealth } from '../collector/index.js'

export const createMetricsRouter = (monitor) => {
  const router = Router()

  router.get('/', (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) return res.status(503).json({ error: 'No data yet' })
    res.json(latest)
  })
  router.get('/summary', (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) return res.status(503).json({ error: 'No data yet' })
    
    res.json({
      cpu: latest.cpu?.percent ?? 0,
      mem: latest.memory?.percent ?? 0,
      disk: latest.disk?.percent ?? 0,
      rx: latest.network?.rx ?? 0,
      tx: latest.network?.tx ?? 0,
      procs: latest.procs ?? 0,
      ports: latest.ports ?? 0,
      uptime: process.uptime()
    })
  })
  router.get('/cpu', (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) return res.status(503).json({ error: 'No data yet' })
    res.json(latest.cpu)
  })

  router.get('/memory', (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) return res.status(503).json({ error: 'No data yet' })
    res.json(latest.memory)
  })

  router.get('/disk', (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) return res.status(503).json({ error: 'No data yet' })
    res.json(latest.disk)
  })

  router.get('/network', (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) return res.status(503).json({ error: 'No data yet' })
    res.json(latest.network)
  })

  router.get('/health', (req, res) => {
    const health = getHealth()
    const status = health.status === 'ok' ? 200 : 207
    res.status(status).json({
      ...health,
      uptime:  process.uptime(),
      emitter: monitor.stats()
    })
  })

  return router
}