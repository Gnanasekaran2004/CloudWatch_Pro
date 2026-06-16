import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error:  'Authentication required',
      code:   'NO_TOKEN'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload   // { userId, username, role, iat, exp }
    next()
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    return res.status(401).json({ error: err.message, code })
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NO_TOKEN' })
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' })
  }
  next()
}