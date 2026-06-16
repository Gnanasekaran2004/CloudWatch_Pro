import { useState, useEffect, useCallback } from 'react'

const TOKEN_KEY = 'cwp_token'

export const useAuth = () => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) { setLoading(false); return }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          localStorage.removeItem(TOKEN_KEY)
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY)
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  const login = useCallback(async (username, password) => {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
    })

    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'Login failed')

    localStorage.setItem(TOKEN_KEY, body.token)
    setUser(body.user)
    return body.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY)
  }, [])

  return { user, loading, login, logout, getToken }
}