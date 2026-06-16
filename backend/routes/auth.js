import { Router }                      from 'express'
import jwt                             from 'jsonwebtoken'
import { findByUsername, findById,
         verifyPassword, createUser,
         getUserCount }                from '../db/index.js'
import { asyncHandler, badRequest }    from '../utils/index.js'

export const authRouter = Router()

const signToken = (user) => jwt.sign(
  { userId: user.id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
)

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    throw badRequest('Username and password are required')
  }

  const user = findByUsername(username)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken(user)
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  })
}))

authRouter.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user    = findById(payload.userId)
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}))

authRouter.post('/register', asyncHandler(async (req, res) => {
  const { username, password, role = 'viewer' } = req.body

  if (!username || !password) throw badRequest('Username and password required')
  if (password.length < 8)   throw badRequest('Password must be at least 8 characters')
  if (!['admin','viewer'].includes(role)) throw badRequest('Role must be admin or viewer')

  try {
    const user  = await createUser(username, password, role)
    const token = signToken(user)
    res.status(201).json({ token, user })
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' })
    }
    throw err
  }
}))