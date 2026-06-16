const BASE = import.meta.env.VITE_BACKEND_URL || ''
const TOKEN_KEY = 'cwp_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const authHeaders = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    // window.location.reload()
    return
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.error || `HTTP ${res.status}`)
    err.status = res.status
    err.code   = body.code
    throw err
  }
  return res.json()
}

export const api = {
  getMetrics:   () => fetch(`${BASE}/api/metrics`,
    { headers: authHeaders() }).then(handleResponse),

  getHealth:    () => fetch(`${BASE}/api/health`,
    { headers: authHeaders() }).then(handleResponse),

  getProcesses: ({ limit = 20, sortBy = 'cpu' } = {}) =>
    fetch(`${BASE}/api/processes?limit=${limit}&sortBy=${sortBy}`,
    { headers: authHeaders() }).then(handleResponse),

  getPorts:     () => fetch(`${BASE}/api/ports`,
    { headers: authHeaders() }).then(handleResponse),

  getSummary:   () => fetch(`${BASE}/api/metrics/summary`,
    { headers: authHeaders() }).then(handleResponse),
}