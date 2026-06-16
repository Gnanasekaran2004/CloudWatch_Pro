import { useState, useEffect, useCallback } from 'react'
import { getToken } from '../api/client' 

export const useAlerts = (socket) => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts?limit=50',{headers: { Authorization: `Bearer ${getToken()}`}})
        if (!res.ok) { setLoading(false); return }
        const data = await res.json()
        setAlerts(data)
        setUnreadCount(data.length)
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleAlert = (alert) => {
      setAlerts(prev => [alert, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('alert', handleAlert)
    return () => socket.off('alert', handleAlert)
  }, [socket])

  const dismissAlert = useCallback(async (id) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}`}})
      setAlerts(prev => prev.filter(a => a.id !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }, [])

  const clearUnread = useCallback(() => setUnreadCount(0), [])

  return { alerts, loading, unreadCount, dismissAlert, clearUnread }
}