export class AppError extends Error {
  constructor(message, status = 500, code = null) {
    super(message)
    this.status  = status
    this.code    = code
    this.name    = 'AppError'
  }
}

export const notFound     = (what)    => new AppError(`${what} not found`, 404, 'NOT_FOUND')
export const badRequest   = (msg)     => new AppError(msg, 400, 'BAD_REQUEST')
export const serverError  = (msg)     => new AppError(msg, 500, 'SERVER_ERROR')
export const unavailable  = (msg)     => new AppError(msg, 503, 'UNAVAILABLE')