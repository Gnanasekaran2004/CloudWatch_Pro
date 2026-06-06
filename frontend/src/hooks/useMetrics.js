import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export const useMetrics = () => {
  const [metrics,   setMetrics]   = useState(null)
  const [connected, setConnected] = useState(false)
  const [error,     setError]     = useState(null)

  const socketRef = useRef(null)

  useEffect(() => {
    
    const socket = io('http://localhost:3000', {
      reconnection:          true,
      reconnectionDelay:     1000,
      reconnectionAttempts:  10
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
      console.log('[WS] Connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      console.log('[WS] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      setConnected(false)
      setError(`Connection failed: ${err.message}`)
      console.error('[WS] Error:', err.message)
    })

    socket.on('metrics', (data) => {
      // Merge partial payloads (e.g. cpu-only subscribe) into existing state
      // so other metric fields keep their last-known values
      setMetrics(prev => prev ? { ...prev, ...data } : data)
      setError(null)
    })

    return () => {
      console.log('[WS] Cleaning up connection')
      socket.disconnect()
      socketRef.current = null
    }
  }, [])  

  const subscribe    = (metric) => socketRef.current?.emit('subscribe', metric)
  const resetSubscribe = ()     => socketRef.current?.emit('subscribe', null)
  const changeInterval = (ms)  => socketRef.current?.emit('set-interval', ms)

  return { metrics, connected, error, subscribe, resetSubscribe, changeInterval }
}