import { Router }       from 'express'
import { queryHistory } from '../db/index.js'
import { asyncHandler } from '../utils/index.js'

export const historyRouter = Router()

historyRouter.get('/', asyncHandler(async (req, res) => {
  const range = req.query.range || '30m'

  if (!/^\d+[mhd]$/.test(range)) {
    return res.status(400).json({
      error: 'Invalid range. Use format: 30m, 1h, 6h, 24h'
    })
  }

  const rows = queryHistory(range)

  const data = rows.map(row => ({
    timestamp:  row.timestamp,
    time:       new Date(row.timestamp).toLocaleTimeString(),
    cpu:        row.cpu,
    memory:     row.memory,
    disk:       row.disk,
    rx_sec:     row.rx_sec,
    tx_sec:     row.tx_sec,
    disk_read:  row.disk_read,
    disk_write: row.disk_write
  }))

  res.json({ range, count: data.length, data })
}))