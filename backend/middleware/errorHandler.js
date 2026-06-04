import { AppError } from '../utils/index.js'

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error:  err.message,
      code:   err.code,
      status: err.status
    })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error:  'Invalid JSON in request body',
      code:   'BAD_REQUEST',
      status: 400
    })
  }

  console.error('[Unhandled error]', err)
  res.status(500).json({
    error:  'Internal server error',
    code:   'SERVER_ERROR',
    status: 500
  })
}