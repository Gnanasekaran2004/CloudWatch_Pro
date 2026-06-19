let db = null

export const setDb = (database) => { db = database }

export const insertAlert = async (alert) => {
  if (!db) return
  await db.execute({
    sql:  `INSERT INTO alerts
             (timestamp, severity, title, message, suggested_action, cpu, memory, disk)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      alert.timestamp,
      alert.severity,
      alert.title,
      alert.message,
      alert.suggestedAction ?? null,
      alert.metrics?.cpu    ?? 0,
      alert.metrics?.memory ?? 0,
      alert.metrics?.disk   ?? 0
    ]
  })
}

export const queryAlerts = async (limit = 50) => {
  if (!db) return []
  const { rows } = await db.execute({
    sql:  'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?',
    args: [limit]
  })
  return rows
}

export const deleteAlert = async (id) => {
  if (!db) return
  await db.execute({ sql: 'DELETE FROM alerts WHERE id = ?', args: [id] })
}

export const getAlertCount = async () => {
  if (!db) return { total: 0 }
  const { rows } = await db.execute('SELECT COUNT(*) as total FROM alerts')
  return { total: Number(rows[0]?.total ?? 0) }
}