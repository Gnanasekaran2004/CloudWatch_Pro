import { Router }      from 'express'
import { getAllSettings, updateSetting,
         getThresholds }                from '../db/settings.js'
import { asyncHandler, badRequest }    from '../utils/index.js'

export const createSettingsRouter = (detector) => {
  const router = Router()

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await getAllSettings())
  }))

  router.get('/thresholds', asyncHandler(async (req, res) => {
    res.json(await getThresholds())
  }))

  router.put('/:key', asyncHandler(async (req, res) => {
    const { key }   = req.params
    const { value } = req.body

    const allowedKeys = ['threshold_cpu','threshold_memory',
                         'threshold_disk','cooldown_seconds']

    if (!allowedKeys.includes(key)) throw badRequest(`Invalid key: ${key}`)

    const num = parseFloat(value)
    if (isNaN(num))                 throw badRequest('Value must be a number')
    if (key.startsWith('threshold_') && (num < 1 || num > 99))
                                    throw badRequest('Threshold must be 1–99')
    if (key === 'cooldown_seconds' && (num < 10 || num > 3600))
                                    throw badRequest('Cooldown must be 10–3600s')

    await updateSetting(key, num)

    const newThresholds = await getThresholds()
    detector.setThresholds(newThresholds)
    if (key === 'cooldown_seconds') {
      detector.cooldownMs = num * 1000
    }

    res.json({ key, value: num, updated: true })
  }))

  return router
}