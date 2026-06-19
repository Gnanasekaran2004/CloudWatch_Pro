import 'dotenv/config'
import express          from 'express'
import { createServer } from 'http'
import cors             from 'cors'
import { adminRouter }  from './routes/admin.js'
import { openDb }       from './db/index.js'
import { MetricsEmitter }          from './collector/index.js'
import { historyRouter, createMetricsRouter,
         createProcessesRouter, createPortsRouter } from './routes/index.js'
import { createSocketServer }      from './socket/index.js'
import { AnomalyDetector }         from './services/anomalyDetector.js'
import { insertAlert, queryAlerts, deleteAlert,
         getAlertCount, setDb }    from './db/alerts.js'
import { getThresholds, setDb as setSettingsDb } from './db/settings.js'
import { createSettingsRouter }    from './routes/settings.js'
import { createUser, getUserCount,
         setDb as setUsersDb }     from './db/users.js'
import { authRouter }              from './routes/auth.js'
import { insertSnapshot, deleteOldRows, getDbStats } from './db/metrics.js'
import { requestLogger, rateLimit, errorHandler, requireAuth } from './middleware/index.js'

const app     = express()
const server  = createServer(app)
const PORT    = process.env.PORT || 3000
const monitor = new MetricsEmitter(1000)
let isShuttingDown = false
let insertCount    = 0
let isAnalyzing    = false

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CORS_ORIGIN,
      process.env.CORS_ORIGIN?.replace(/\/$/, ''),
      'http://localhost:5173',
      'http://localhost:4000'
    ].filter(Boolean)

    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true
}))

app.use(express.json())
app.use(requestLogger)
app.use(rateLimit({ windowMs: 60000, max: 200 }))

const dbInstance = await openDb()
setDb(dbInstance)
setSettingsDb(dbInstance)
setUsersDb(dbInstance)

if (await getUserCount() === 0) {
  await createUser('admin', 'admin123', 'admin')
  console.log('  ✓ Admin user seeded (username: admin, password: admin123)')
  console.log('  ⚠ Change the password after first login!')
}

const detector   = new AnomalyDetector()
const thresholds = await getThresholds()
detector.setThresholds(thresholds)
console.log(`  ✓ Thresholds loaded: CPU>${thresholds.cpu}% MEM>${thresholds.memory}% DISK>${thresholds.disk}%`)

const recentHistory = []

app.use('/api/auth', authRouter)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    time:   new Date().toISOString()
  })
})

app.use('/api', requireAuth)

app.use('/api/admin',    adminRouter)
app.use('/api/metrics',   createMetricsRouter(monitor))
app.use('/api/processes', createProcessesRouter(monitor))
app.use('/api/ports',     createPortsRouter(monitor))
app.use('/api/history',   historyRouter)
app.use('/api/settings',  createSettingsRouter(detector))

app.get('/api/alerts', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  res.json(await queryAlerts(limit))
})

app.get('/api/alerts/count', async (req, res) => {
  res.json(await getAlertCount())
})

app.delete('/api/alerts/:id', async (req, res) => {
  await deleteAlert(parseInt(req.params.id))
  res.json({ success: true })
})

app.get('/api/ai/stats', (req, res) => {
  res.json(detector.getStats())
})

app.get('/api/ai/test', async (req, res) => {
  const testSnapshot = {
    cpu:     { percent: 94.2 },
    memory:  { percent: 87.4, used: 14200000000, total: 16000000000 },
    disk:    { percent: 75.1 },
    network: { rx_sec: 52000000, tx_sec: 1200000 }
  }

  try {
    const alert = await detector.analyze(testSnapshot, [])
    res.json({ alert, stats: detector.getStats() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/db/stats', async (req, res) => {
  res.json(await getDbStats())
})

app.get('/api/socket-stats', (req, res) => {
  const sockets = io.sockets.sockets
  const clients = []

  sockets.forEach((socket) => {
    clients.push({
      id:        socket.id,
      connected: socket.connected,
      rooms:     Array.from(socket.rooms)
    })
  })

  res.json({
    connected:    io.engine.clientsCount,
    clients,
    emitterStats: monitor.stats()
  })
})

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.path}` })
})

app.use(errorHandler)

const io = createSocketServer(server, monitor)
monitor.start()

monitor.on('snapshot', async (data) => {
  const snapshotCopy = JSON.parse(JSON.stringify(data))

  recentHistory.push(snapshotCopy)
  if (recentHistory.length > 10) recentHistory.shift()

  insertCount++
  if (insertCount % 5 === 0) {
    await insertSnapshot(snapshotCopy)
  }

  if (isAnalyzing) return

  try {
    isAnalyzing = true
    const alert = await detector.analyze(snapshotCopy, [...recentHistory])
    if (alert) {
      await insertAlert(alert)
      io.emit('alert', alert)
      console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`)
    }
  } catch (err) {
    console.error('[Pipeline] Operational error analyzing system telemetry:', err.message)
  } finally {
    isAnalyzing = false
  }
})

setInterval(() => deleteOldRows().catch(console.error), 3600000)
deleteOldRows().catch(console.error)

const shutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`\n[${signal}] Shutting down gracefully...`)

  io.close(() => {
    console.log('  ✓ WebSocket server closed')
  })

  monitor.stop()
  console.log('  ✓ MetricsEmitter stopped')

  server.close(() => {
    console.log('  ✓ HTTP server closed')
    console.log('  Shutdown complete.\n')
    process.exit(0)
  })

  setTimeout(() => {
    console.error('  Forced shutdown after timeout')
    process.exit(1)
  }, 5000)
}

process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught exception:', err.message)
  console.error(err.stack)
  shutdown('uncaughtException')
})

process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled rejection:', reason)
  shutdown('unhandledRejection')
})

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

server.listen(PORT, () => {
  console.log(`\nServer     → http://localhost:${PORT}`)
  console.log(`WebSocket  → ws://localhost:${PORT}`)
  console.log(`REST API   → http://localhost:${PORT}/api/db/stats\n`)
})
