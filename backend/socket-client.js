import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js'

export class SocketClient {
  constructor(url) {
    this.url        = url
    this.socket     = null
    this.handlers   = new Map()   // event → [callbacks]
    this.connected  = false
    this.metrics    = null        // latest metrics cache
  }

  connect() {
    this.socket = io(this.url, {
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionAttempts: 10
    })

    this.socket.on('connect', () => {
      this.connected = true
      this._emit('statusChange', { connected: true, id: this.socket.id })
    })

    this.socket.on('disconnect', (reason) => {
      this.connected = false
      this._emit('statusChange', { connected: false, reason })
    })

    this.socket.on('metrics', (data) => {
      this.metrics = data                          // cache locally
      this._emit('metrics', data)                  // notify all listeners
    })

    this.socket.on('warning', (data) => {
      this._emit('warning', data)
    })

    return this
  }

  disconnect() {
    if (this.socket) this.socket.disconnect()
  }

  // Subscribe to events — returns unsubscribe function
  on(event, callback) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event).push(callback)

    // Return cleanup function
    return () => {
      const callbacks = this.handlers.get(event) || []
      this.handlers.set(event, callbacks.filter(cb => cb !== callback))
    }
  }

  subscribe(metric) {
    this.socket?.emit('subscribe', metric)
  }

  setInterval(ms) {
    this.socket?.emit('set-interval', ms)
  }

  requestSnapshot(callback) {
    this.socket?.emit('get-snapshot', {}, callback)
  }

  _emit(event, data) {
    const callbacks = this.handlers.get(event) || []
    callbacks.forEach(cb => cb(data))
  }
}