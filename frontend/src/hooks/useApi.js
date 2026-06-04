import { useState, useEffect, useCallback } from 'react'

export const useApi = (apiFn, deps = []) => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFn()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('API error:', err)
    } finally {
      setLoading(false)
    }
  }, deps) 
  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export const usePolling = (apiFn, intervalMs = 2000, deps = []) => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const result = await apiFn()
        if (!cancelled) {
          setData(result)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    poll() 
    const timer = setInterval(poll, intervalMs)

    return () => {
      cancelled = true 
      clearInterval(timer)
    }
  }, deps)

  return { data, loading, error }
}