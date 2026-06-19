let db = null

export const setDb = (database) => { db = database }

export const insertAlert = (alert) => {
  if (!db) return
  const stmt = db.prepare(`
    INSERT INTO alerts (timestamp, severity, title, message, suggested_action, cpu, memory, disk)
    VALUES (@timestamp, @severity, @title, @message, @suggestedAction, @cpu, @memory, @disk)
  `)
  stmt.run({
    timestamp:       alert.timestamp,
    severity:        alert.severity,
    title:           alert.title,
    message:         alert.message,
    suggestedAction: alert.suggestedAction,
    cpu:             alert.metrics?.cpu    ?? 0,
    memory:          alert.metrics?.memory ?? 0,
    disk:            alert.metrics?.disk   ?? 0
  })
}

export const queryAlerts = (limit = 50) => {
  if (!db) return []
  return db.prepare(`
    SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?
  `).all(limit)
}

export const deleteAlert = (id) => {
  if (!db) return
  db.prepare('DELETE FROM alerts WHERE id = ?').run(id)
}

export const getAlertCount = () => {
  if (!db) return { total: 0 }
  const row = db.prepare('SELECT COUNT(*) as total FROM alerts').get()
  return { total: row.total }
}