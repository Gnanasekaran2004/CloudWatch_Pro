import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export const useMetrics = () => {
  const [metrics,   setMetrics]   = useState(null)
  const [connected, setConnected] = useState(false)
  const [error,     setError]     = useState(null)

  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
      reconnection:          true,
      reconnectionDelay:     1000,
      reconnectionAttempts:  10
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      setConnected(false)
      setError(`Connection failed: ${err.message}`)
    })

    socket.on('metrics', (data) => {
      setMetrics(prev => prev ? { ...prev, ...data } : data)
      setError(null)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const subscribe    = (metric) => socketRef.current?.emit('subscribe', metric)
  const resetSubscribe = ()     => socketRef.current?.emit('subscribe', null)
  const changeInterval = (ms)  => socketRef.current?.emit('set-interval', ms)

  return { metrics, connected, error, subscribe, resetSubscribe, changeInterval }
}