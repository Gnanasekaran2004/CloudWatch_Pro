import express          from 'express'
import { createServer } from 'http'
import cors             from 'cors'

import { MetricsEmitter }          from './collector/index.js'
import { requestLogger, rateLimit} from './middleware/index.js'
import { errorHandler }            from './middleware/index.js'
import { createMetricsRouter,
         createProcessesRouter,
         createPortsRouter }       from './routes/index.js'
import { createSocketServer }      from './socket/index.js'

const app     = express()
const server  = createServer(app)   
const PORT    = 3000
const monitor = new MetricsEmitter(1000)
let isShuttingDown = false
app.use(cors({ origin: ['http://localhost:5173', 'null'] }))
app.use(express.json())
app.use(requestLogger)
app.use(rateLimit({ windowMs: 60000, max: 200 }))

app.use('/api/metrics',   createMetricsRouter(monitor))
app.use('/api/health',    (req, res) => res.redirect('/api/metrics/health'))
app.use('/api/processes', createProcessesRouter(monitor))
app.use('/api/ports',     createPortsRouter(monitor))

app.use((req, res, next) => {
  if (req.path === '/api/socket-stats') return next()
  res.status(404).json({ error: `Not found: ${req.path}` })
})
app.use(errorHandler)

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

monitor.start()
process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught exception:', err.message)
  console.error(err.stack)
  shutdown('uncaughtException')
})

process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled rejection:', reason)
  shutdown('unhandledRejection')
})
server.listen(PORT, () => {
  console.log(`\nServer     → http://localhost:${PORT}`)
  console.log(`WebSocket  → ws://localhost:${PORT}`)
  console.log(`REST API   → http://localhost:${PORT}/api/metrics\n`)
})

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

process.on('SIGINT',  () => shutdown('SIGINT')) 
process.on('SIGTERM', () => shutdown('SIGTERM'))