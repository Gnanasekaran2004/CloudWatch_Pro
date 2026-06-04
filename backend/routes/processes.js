import { Router }                          from 'express'
import { validateQuery }                   from '../middleware/index.js'
import { asyncHandler, notFound,
         badRequest, unavailable }         from '../utils/index.js'

export const createProcessesRouter = (monitor) => {
  const router = Router()

  router.get('/',
    validateQuery({
      limit:  { type: 'number', min: 1, max: 100 },
      sortBy: { oneOf: ['cpu', 'mem'] }
    }),
    asyncHandler(async (req, res) => {
      const latest = monitor.getLatest()
      if (!latest) throw unavailable('No data yet — server is warming up')

      const limit  = req.query.limit  || 20
      const sortBy = req.query.sortBy || 'cpu'

      const processes = [...latest.processes]
        .sort((a, b) => b[sortBy] - a[sortBy])
        .slice(0, limit)

      res.json({ total: latest.processes.length, processes })
    })
  )

  router.get('/:pid',
    asyncHandler(async (req, res) => {
      const latest = monitor.getLatest()
      if (!latest) throw unavailable('No data yet')

      const pid = parseInt(req.params.pid, 10)
      if (isNaN(pid)) throw badRequest('PID must be a valid number')

      const proc = latest.processes.find(p => p.pid === pid)
      if (!proc)  throw notFound(`Process ${pid}`)

      res.json(proc)
    })
  )

  return router
}