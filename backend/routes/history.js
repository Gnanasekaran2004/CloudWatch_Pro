// ─── Placeholder — will be built on Day 53 (SQLite week) ───
// Routes this file will contain:
//   GET /api/history?range=30m → returns rows from SQLite

import { Router } from 'express'
export const historyRouter = Router()

historyRouter.get('/history', (req, res) => {
  res.json({ message: 'not implemented yet — coming in Week 8' })
})