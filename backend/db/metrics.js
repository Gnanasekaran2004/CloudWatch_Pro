import { createClient } from '@libsql/client'

let db = null

export const openDb = async () => {
  db = createClient({
    url:       process.env.TURSO_URL || 'file:./metrics.db',
    authToken: process.env.TURSO_AUTH_TOKEN
  })

  await db.batch([
    `CREATE TABLE IF NOT EXISTS metrics (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp  INTEGER NOT NULL,
      cpu        REAL    DEFAULT 0,
      memory     REAL    DEFAULT 0,
      disk       REAL    DEFAULT 0,
      rx_sec     REAL    DEFAULT 0,
      tx_sec     REAL    DEFAULT 0,
      disk_read  REAL    DEFAULT 0,
      disk_write REAL    DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics (timestamp)`,
    `CREATE TABLE IF NOT EXISTS alerts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp        INTEGER NOT NULL,
      severity         TEXT    DEFAULT 'medium',
      title            TEXT    NOT NULL,
      message          TEXT    NOT NULL,
      suggested_action TEXT,
      cpu              REAL    DEFAULT 0,
      memory           REAL    DEFAULT 0,
      disk             REAL    DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts (timestamp)`,
    `CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    DEFAULT 'viewer',
      created_at    INTEGER DEFAULT (strftime('%s','now') * 1000)
    )`
  ], 'write')

  const defaults = [
    ['threshold_cpu',    '85'],
    ['threshold_memory', '90'],
    ['threshold_disk',   '95'],
    ['cooldown_seconds', '60']
  ]

  for (const [key, value] of defaults) {
    await db.execute({
      sql:  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      args: [key, value]
    })
  }

  console.log('  ✓ Turso database connected:', process.env.TURSO_URL || 'file:./metrics.db')
  return db
}

export const insertSnapshot = async (snapshot) => {
  if (!db || !snapshot) return
  await db.execute({
    sql:  `INSERT INTO metrics
             (timestamp, cpu, memory, disk, rx_sec, tx_sec, disk_read, disk_write)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      snapshot.timestamp,
      snapshot.cpu?.percent     ?? 0,
      snapshot.memory?.percent  ?? 0,
      snapshot.disk?.percent    ?? 0,
      snapshot.network?.rx_sec  ?? 0,
      snapshot.network?.tx_sec  ?? 0,
      snapshot.disk?.read       ?? 0,
      snapshot.disk?.write      ?? 0
    ]
  })
}

const parseRange = (range) => {
  const units = { m: 60000, h: 3600000, d: 86400000 }
  const match = String(range).match(/^(\d+)([mhd])$/)
  if (!match) return 30 * 60000
  return parseInt(match[1]) * units[match[2]]
}

export const queryHistory = async (range = '30m') => {
  if (!db) return []
  const since = Date.now() - parseRange(range)
  const { rows } = await db.execute({
    sql:  'SELECT * FROM metrics WHERE timestamp > ? ORDER BY timestamp ASC',
    args: [since]
  })
  return rows
}

export const deleteOldRows = async () => {
  if (!db) return
  const cutoff = Date.now() - 24 * 3600000
  await db.execute({ sql: 'DELETE FROM metrics WHERE timestamp < ?', args: [cutoff] })
  console.log('  ✓ Old metrics cleaned up')
}

export const getDbStats = async () => {
  if (!db) return null
  const { rows: c } = await db.execute('SELECT COUNT(*) as count FROM metrics')
  const { rows: o } = await db.execute('SELECT MIN(timestamp) as ts FROM metrics')
  const { rows: n } = await db.execute('SELECT MAX(timestamp) as ts FROM metrics')
  return {
    rows:   Number(c[0]?.count ?? 0),
    oldest: o[0]?.ts ? new Date(Number(o[0].ts)).toLocaleTimeString() : null,
    newest: n[0]?.ts ? new Date(Number(n[0].ts)).toLocaleTimeString() : null
  }
}