
const requests = new Map()  

export const rateLimit = ({
  windowMs = 60000,    
  max      = 100       
} = {}) => {
  return (req, res, next) => {
    const ip  = req.ip
    const now = Date.now()

    const record = requests.get(ip)

    if (!record || now > record.resetAt) {
      requests.set(ip, { count: 1, resetAt: now + windowMs })
      return next()
    }

    record.count++

    if (record.count > max) {
      return res.status(429).json({
        error:     'Too many requests',
        retryAfter: Math.ceil((record.resetAt - now) / 1000) + 's'
      })
    }

    next()
  }
}