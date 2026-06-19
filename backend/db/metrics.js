import Database from 'better-sqlite3'
import path     from 'path'

let db = null
const DATA_DIR = process.env.DATA_DIR || process.cwd()
const DB_PATH  = path.join(DATA_DIR, 'metrics.db')

export const openDb = () => {
  db = new Database(DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp  INTEGER NOT NULL,
      cpu        REAL    DEFAULT 0,
      memory     REAL    DEFAULT 0,
      disk       REAL    DEFAULT 0,
      rx_sec     REAL    DEFAULT 0,
      tx_sec     REAL    DEFAULT 0,
      disk_read  REAL    DEFAULT 0,
      disk_write REAL    DEFAULT 0
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics (timestamp)
  `)

  console.log('  ✓ SQLite database opened:', DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp        INTEGER NOT NULL,
      severity         TEXT    DEFAULT 'medium',
      title            TEXT    NOT NULL,
      message          TEXT    NOT NULL,
      suggested_action TEXT,
      cpu              REAL    DEFAULT 0,
      memory           REAL    DEFAULT 0,
      disk             REAL    DEFAULT 0
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts (timestamp)
  `)

  console.log('  ✓ Alerts table ready')

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    DEFAULT 'viewer',
      created_at    INTEGER DEFAULT (strftime('%s','now') * 1000)
    )
  `)

  console.log('  ✓ Users table ready')

  const defaults = [
    { key: 'threshold_cpu',    value: '85' },
    { key: 'threshold_memory', value: '90' },
    { key: 'threshold_disk',   value: '95' },
    { key: 'cooldown_seconds', value: '60' }
  ]

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `)
  defaults.forEach(({ key, value }) => insertSetting.run(key, value))

  console.log('  ✓ Settings table ready')
  return db
}

export const insertSnapshot = (snapshot) => {
  if (!db || !snapshot) return
  const stmt = db.prepare(`
    INSERT INTO metrics
      (timestamp, cpu, memory, disk, rx_sec, tx_sec, disk_read, disk_write)
    VALUES
      (@timestamp, @cpu, @memory, @disk, @rx_sec, @tx_sec, @disk_read, @disk_write)
  `)
  stmt.run({
    timestamp:  snapshot.timestamp,
    cpu:        snapshot.cpu?.percent     ?? 0,
    memory:     snapshot.memory?.percent  ?? 0,
    disk:       snapshot.disk?.percent    ?? 0,
    rx_sec:     snapshot.network?.rx_sec  ?? 0,
    tx_sec:     snapshot.network?.tx_sec  ?? 0,
    disk_read:  snapshot.disk?.read       ?? 0,
    disk_write: snapshot.disk?.write      ?? 0
  })
}

const parseRange = (range) => {
  const units = { m: 60000, h: 3600000, d: 86400000 }
  const match = String(range).match(/^(\d+)([mhd])$/)
  if (!match) return 30 * 60000
  return parseInt(match[1]) * units[match[2]]
}

export const queryHistory = (range = '30m') => {
  if (!db) return []
  const since = Date.now() - parseRange(range)
  const stmt  = db.prepare(`
    SELECT * FROM metrics
    WHERE  timestamp > ?
    ORDER  BY timestamp ASC
  `)
  return stmt.all(since)
}

export const deleteOldRows = () => {
  if (!db) return
  const cutoff = Date.now() - 24 * 3600000
  db.prepare('DELETE FROM metrics WHERE timestamp < ?').run(cutoff)
  console.log('  ✓ Old metrics cleaned up')
}

export const getDbStats = () => {
  if (!db) return null
  const count  = db.prepare('SELECT COUNT(*) as count FROM metrics').get()
  const oldest = db.prepare('SELECT MIN(timestamp) as ts FROM metrics').get()
  const newest = db.prepare('SELECT MAX(timestamp) as ts FROM metrics').get()
  return {
    rows:   count.count,
    oldest: oldest.ts ? new Date(oldest.ts).toLocaleTimeString() : null,
    newest: newest.ts ? new Date(newest.ts).toLocaleTimeString() : null
  }
}