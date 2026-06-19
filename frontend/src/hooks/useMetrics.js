import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { getToken } from '../api/client'

export const useMetrics = () => {
  const [metrics,   setMetrics]   = useState(null)
  const [connected, setConnected] = useState(false)
  const [error,     setError]     = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const token = getToken()

    if (!token) {
      setConnected(false)
      return
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const socket = io(backendUrl, {
      auth: { token },
      reconnection:         true,
      reconnectionDelay:    1000,
      reconnectionAttempts: 10
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      setConnected(false)
      const isAuthError = err.message.includes('Authentication') || err.message.includes('Invalid')
      if (!isAuthError) {
        setError(`Connection failed: ${err.message}`)
      }
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

  const subscribe      = (metric) => socketRef.current?.emit('subscribe', metric)
  const resetSubscribe = ()       => socketRef.current?.emit('subscribe', null)
  const changeInterval = (ms)     => socketRef.current?.emit('set-interval', ms)

  return { metrics, connected, error, subscribe, resetSubscribe, changeInterval, socketRef }
}
