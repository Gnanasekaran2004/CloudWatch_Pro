let db = null

export const setDb = (database) => { db = database }

export const getSetting = async (key) => {
  if (!db) return null
  const { rows } = await db.execute({
    sql:  'SELECT value FROM settings WHERE key = ?',
    args: [key]
  })
  return rows[0] ? rows[0].value : null
}

export const getAllSettings = async () => {
  if (!db) return {}
  const { rows } = await db.execute('SELECT key, value FROM settings')
  return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {})
}

export const updateSetting = async (key, value) => {
  if (!db) return
  await db.execute({
    sql:  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, String(value)]
  })
}

export const getThresholds = async () => {
  const all = await getAllSettings()
  return {
    cpu:    parseFloat(all.threshold_cpu    ?? 85),
    memory: parseFloat(all.threshold_memory ?? 90),
    disk:   parseFloat(all.threshold_disk   ?? 95)
  }
}