const BASE = ''

const handleResponse = async (res) => {
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
  getMetrics: () =>
    fetch(`${BASE}/api/metrics`).then(handleResponse),

  getCpu: () =>
    fetch(`${BASE}/api/metrics/cpu`).then(handleResponse),

  getHealth: () =>
    fetch(`${BASE}/api/health`).then(handleResponse),

  getProcesses: ({ limit = 20, sortBy = 'cpu' } = {}) =>
    fetch(`${BASE}/api/processes?limit=${limit}&sortBy=${sortBy}`).then(handleResponse),

  getPorts: () =>
    fetch(`${BASE}/api/ports`).then(handleResponse),

  getSummary: () =>
    fetch(`${BASE}/api/metrics/summary`).then(handleResponse),
}