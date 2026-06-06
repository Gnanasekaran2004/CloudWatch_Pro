import { EventEmitter } from 'events'
import { getCleanSnapshot } from './index.js'

export class MetricsEmitter extends EventEmitter {
  constructor(intervalMs = 1000) {
    super()
    this.intervalMs   = intervalMs
    this.timer        = null
    this.isRunning    = false
    this.isPaused     = false
    this.latest       = null
    this.totalEmitted = 0
    this.startTime    = null
    this.lastEmitAt   = null
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused  = false
    this.startTime = Date.now()
    this._startTimer()
  }

  stop() {
    this._clearTimer()
    this.isRunning = false
    this.isPaused  = false
  }

  pause() {
    if (!this.isRunning || this.isPaused) return
    this._clearTimer()
    this.isPaused = true
    this.emit('paused')
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return
    this.isPaused = false
    this.emit('resumed')
    this._startTimer()
  }

  setIntervalMs(ms) {
    this.intervalMs = ms
    if (this.isRunning && !this.isPaused) {
      this._clearTimer()
      this._startTimer()
    }
  }

  getLatest() {
    return this.latest
  }

  stats() {
    return {
      isRunning:    this.isRunning,
      isPaused:     this.isPaused,
      intervalMs:   this.intervalMs,
      totalEmitted: this.totalEmitted,
      uptime:       this.startTime ? Date.now() - this.startTime : 0,
      lastEmitAt:   this.lastEmitAt
    }
  }

  _startTimer() {
    const tick = async () => {
      try {
        const snapshot    = await getCleanSnapshot()
        this.latest       = snapshot
        this.totalEmitted++
        this.lastEmitAt   = Date.now()
        this.emit('snapshot', snapshot)
      } catch (err) {
        this.emit('error', err)
      }
    }

    tick()
    this.timer = setInterval(tick, this.intervalMs)
  }

  _clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}