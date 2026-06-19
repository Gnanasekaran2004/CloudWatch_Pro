import { useState, useEffect } from 'react'
import { getToken } from '../api/client'

const BASE = import.meta.env.VITE_BACKEND_URL || ''

function AiStats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${BASE}/api/ai/stats`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        if (!res.ok) return
        const data = await res.json()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  if (loading || !stats) return null

  const rows = [
    { label: 'Provider',      value: stats.provider },
    { label: 'Model',         value: stats.model },
    { label: 'Total calls',   value: stats.totalCalls },
    { label: 'Cost',          value: stats.cost },
    { label: 'Cooldown left', value: `${stats.cooldownLeft}s` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '13px',
                                  padding: '6px 0',
                                  borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
          <span style={{ color: 'var(--color-text-primary)',
                         fontWeight: '500', fontFamily: 'monospace' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default AiStats