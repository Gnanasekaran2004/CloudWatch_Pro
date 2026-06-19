import { useState, useEffect } from 'react'
import { cn } from '../utils/cn'
import { getToken } from '../api/client'

const BASE = import.meta.env.VITE_BACKEND_URL || ''

const SETTINGS = [
  { key: 'threshold_cpu',    label: 'CPU threshold',    icon: '🖥️', min: 10, max: 99,   step: 1,  unit: '%', desc: 'AI alerts when CPU exceeds this' },
  { key: 'threshold_memory', label: 'Memory threshold', icon: '💾', min: 10, max: 99,   step: 1,  unit: '%', desc: 'AI alerts when memory exceeds this' },
  { key: 'threshold_disk',   label: 'Disk threshold',   icon: '💿', min: 10, max: 99,   step: 1,  unit: '%', desc: 'AI alerts when disk exceeds this' },
  { key: 'cooldown_seconds', label: 'AI cooldown',      icon: '⏱️', min: 10, max: 3600, step: 10, unit: 's', desc: 'Min seconds between AI calls' },
]

function ThresholdSettings() {
  const [values,  setValues]  = useState({})
  const [saving,  setSaving]  = useState({})
  const [saved,   setSaved]   = useState({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${BASE}/api/settings`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => {
        const parsed = {}
        Object.entries(data).forEach(([k, v]) => { parsed[k] = parseFloat(v) })
        setValues(parsed)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load settings'); setLoading(false) })
  }, [])

  const handleChange = (key, val) =>
    setValues(prev => ({ ...prev, [key]: parseFloat(val) }))

  const handleSave = async (key) => {
    setSaving(prev => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`${BASE}/api/settings/${key}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ value: values[key] })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  if (loading) return (
    <div className="py-8 text-center text-sm text-slate-500">
      Loading settings...
    </div>
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        Alert Thresholds
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        AI anomaly detection triggers when any metric exceeds its threshold.
        Changes apply immediately — no restart needed.
      </p>

      {error && (
        <div className="bg-red-950 border border-red-500 rounded-lg
                        px-4 py-3 mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {SETTINGS.map(({ key, label, icon, min, max, step, unit, desc }) => {
          const val      = values[key] ?? min
          const isSaving = saving[key]
          const isSaved  = saved[key]

          const valColor = cn({
            'text-green-400':  val < 70,
            'text-yellow-400': val >= 70 && val < 90,
            'text-red-400':    val >= 90,
          })

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="text-sm font-medium text-slate-200">
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xl font-bold tabular-nums', valColor)}>
                    {val}{unit}
                  </span>
                  <button
                    onClick={() => handleSave(key)}
                    disabled={isSaving}
                    className={cn(
                      'px-4 py-1.5 text-xs font-semibold rounded-md border transition-all min-w-[60px]',
                      isSaved
                        ? 'bg-green-500 text-white border-green-500'
                        : isSaving
                          ? 'bg-slate-700 text-slate-500 border-slate-600 cursor-wait'
                          : 'bg-blue-950 text-blue-400 border-blue-800 hover:bg-blue-900 cursor-pointer'
                    )}>
                    {isSaved ? '✓ Saved' : isSaving ? '...' : 'Save'}
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={min} max={max} step={step}
                value={val}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full h-1 cursor-pointer accent-blue-400"
              />

              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>{min}{unit}</span>
                <span className="text-center flex-1 px-4">{desc}</span>
                <span>{max}{unit}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-slate-900 rounded-lg px-4 py-3 text-xs text-slate-400">
        <span className="text-slate-200 font-semibold">Current config: </span>
        AI alerts when CPU &gt; {values.threshold_cpu ?? 85}%,
        memory &gt; {values.threshold_memory ?? 90}%,
        or disk &gt; {values.threshold_disk ?? 95}%.
        Cooldown: {values.cooldown_seconds ?? 60}s between calls.
      </div>
    </div>
  )
}

export default ThresholdSettings