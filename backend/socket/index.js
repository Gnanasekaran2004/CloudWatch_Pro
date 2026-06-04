import { Server } from 'socket.io'

export const createSocketServer = (httpServer, monitor) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'null'],
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected:    ${socket.id}`)

    let subscribedMetric = null
    let clientIntervalMs = null
    let intervalTimer = null

    const latest = monitor.getLatest()
    if (latest) {
      socket.emit('metrics', buildPayload(latest, subscribedMetric))
    }

    socket.emit('connected', {
      id: socket.id,
      time: Date.now(),
      interval: 1000,
      serverInfo: {
        node: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    })

    function buildPayload(data, metric) {
      if (metric && data[metric] !== undefined) {
        return { [metric]: data[metric], timestamp: data.timestamp }
      }
      return data
    }

    const onSnapshot = (data) => {
      if (intervalTimer) return
      socket.emit('metrics', buildPayload(data, subscribedMetric))
    }
    monitor.on('snapshot', onSnapshot)

    const startCustomInterval = (ms) => {
      if (intervalTimer) clearInterval(intervalTimer)
      intervalTimer = setInterval(() => {
        const latest = monitor.getLatest()
        if (latest) socket.emit('metrics', buildPayload(latest, subscribedMetric))
      }, ms)
    }

    const stopCustomInterval = () => {
      if (intervalTimer) {
        clearInterval(intervalTimer)
        intervalTimer = null
      }
    }


    socket.on('watch', (page) => {
      const validPages = ['dashboard', 'processes', 'ports', 'history']
      if (!validPages.includes(page)) {
        socket.emit('error-event', { message: `Invalid page: ${page}` })
        return
      }
      validPages.forEach(p => socket.leave(p))
      socket.join(page)
      socket.emit('watched', { room: page })
      console.log(`[WS] ${socket.id} watching: ${page}`)
    })

    socket.on('subscribe', (metric) => {
      const valid = ['cpu', 'memory', 'disk', 'network', 'processes', 'ports']
      subscribedMetric = (metric === null || valid.includes(metric)) ? metric : subscribedMetric
      const latest = monitor.getLatest()
      if (latest) socket.emit('metrics', buildPayload(latest, subscribedMetric))
    })

    socket.on('set-interval', (ms) => {
      if (typeof ms !== 'number' || ms < 500 || ms > 10000) {
        socket.emit('error-event', { message: 'Interval must be between 500 and 10000ms' })
        return
      }
      startCustomInterval(ms)
      socket.emit('interval-set', { intervalMs: ms })
    })

    socket.on('reset-interval', () => {
      stopCustomInterval()
      socket.emit('interval-set', { intervalMs: 1000, source: 'global' })
    })

    socket.on('get-snapshot', (payload, ack) => {
      const latest = monitor.getLatest()
      if (typeof ack !== 'function') return
      if (!latest) { ack({ error: 'No data yet' }); return }
      ack({ data: buildPayload(latest, subscribedMetric) })
    })

    socket.on('request-snapshot', () => {
      const latest = monitor.getLatest()
      if (latest) socket.emit('metrics', buildPayload(latest, subscribedMetric))
    })

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id} — ${reason}`)
      stopCustomInterval()
      monitor.off('snapshot', onSnapshot)
    })
  })

  monitor.on('snapshot', (data) => {
    io.to('dashboard').emit('metrics', data)

    io.to('processes').emit('metrics', {
      processes: data.processes,
      timestamp: data.timestamp
    })

    io.to('ports').emit('metrics', {
      ports:     data.ports,
      timestamp: data.timestamp
    })

    if (io.engine.clientsCount > 0 && data.cpu && data.memory && data.cpu.percent === 0 && data.memory.percent === 0) {
      io.emit('warning', {
        message: 'Metrics collector may be degraded',
        time: Date.now()
      })
    }
  })

  return io
}
