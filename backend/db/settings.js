let db = null
export const setDb = (database) => { db = database }

export const getSetting = (key) => {
  if (!db) return null
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

export const getAllSettings = () => {
  if (!db) return {}
  const rows = db.prepare('SELECT key, value FROM settings').all()
  return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {})
}

export const updateSetting = (key, value) => {
  if (!db) return
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, String(value))
}

export const getThresholds = () => {
  const all = getAllSettings()
  return {
    cpu:    parseFloat(all.threshold_cpu    ?? 85),
    memory: parseFloat(all.threshold_memory ?? 90),
    disk:   parseFloat(all.threshold_disk   ?? 95)
  }
}