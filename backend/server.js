import express          from 'express'
import { createServer } from 'http'
import cors             from 'cors'
import { openDb, insertSnapshot,
         deleteOldRows, getDbStats } from './db/index.js'
import { MetricsEmitter }          from './collector/index.js'
import { requestLogger, rateLimit,
         errorHandler }            from './middleware/index.js'
import { historyRouter,
         createMetricsRouter,
         createProcessesRouter,
         createPortsRouter }       from './routes/index.js'
import { createSocketServer }      from './socket/index.js'

const app     = express()
const server  = createServer(app)   
const PORT    = process.env.PORT || 3000
const monitor = new MetricsEmitter(1000)
let isShuttingDown = false
let insertCount = 0

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(requestLogger)
app.use(rateLimit({ windowMs: 60000, max: 200 }))

openDb()

app.use('/api/metrics',   createMetricsRouter(monitor))
app.use('/api/health',    (req, res) => res.redirect('/api/metrics/health'))
app.use('/api/processes', createProcessesRouter(monitor))
app.use('/api/ports',     createPortsRouter(monitor))
app.use('/api/history',   historyRouter)

app.get('/api/db/stats', (req, res) => {
  res.json(getDbStats())
})

const io = createSocketServer(server, monitor)

app.get('/api/socket-stats', (req, res) => {
  const sockets   = io.sockets.sockets
  const clients   = []

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

app.use((req, res, next) => {
  res.status(404).json({ error: `Not found: ${req.path}` })
})

app.use(errorHandler)

monitor.start()

monitor.on('snapshot', (data) => {
  insertCount++
  if (insertCount % 5 === 0) {
    insertSnapshot(data)
  }
})

setInterval(deleteOldRows, 3600000)
deleteOldRows()

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
