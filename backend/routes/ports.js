import { Router }                       from 'express'
import { asyncHandler, notFound,
         badRequest, unavailable }      from '../utils/index.js'

export const createPortsRouter = (monitor) => {
  const router = Router()

  router.get('/', asyncHandler(async (req, res) => {
    const latest = monitor.getLatest()
    if (!latest) throw unavailable('No data yet')
    res.json({ total: latest.ports.length, ports: latest.ports })
  }))

  router.get('/:port', asyncHandler(async (req, res) => {
    const latest  = monitor.getLatest()
    if (!latest)  throw unavailable('No data yet')

    const portNum = parseInt(req.params.port, 10)
    if (isNaN(portNum)) throw badRequest('Port must be a valid number')

    const found = latest.ports.find(p => p.port === portNum)
    res.json({ port: portNum, inUse: Boolean(found), detail: found || null })
  }))

  return router
}