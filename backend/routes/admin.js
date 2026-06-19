import { Router }                       from 'express'
import { getAllUsers, createUser,
         updateRole, deleteUser }        from '../db/index.js'
import { asyncHandler, badRequest }      from '../utils/index.js'
import { requireAdmin }                  from '../middleware/index.js'

export const adminRouter = Router()

adminRouter.use(requireAdmin)

adminRouter.get('/users', asyncHandler(async (req, res) => {
  res.json(getAllUsers())
}))

adminRouter.post('/users', asyncHandler(async (req, res) => {
  const { username, password, role = 'viewer' } = req.body

  if (!username || !password)
    throw badRequest('Username and password required')
  if (password.length < 8)
    throw badRequest('Password must be at least 8 characters')
  if (!['admin','viewer'].includes(role))
    throw badRequest('Role must be admin or viewer')

  try {
    const user = await createUser(username, password, role)
    res.status(201).json(user)
  } catch (err) {
    if (err.message?.includes('UNIQUE'))
      return res.status(409).json({ error: 'Username already exists' })
    throw err
  }
}))

adminRouter.put('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body
  const id       = parseInt(req.params.id)

  if (!['admin','viewer'].includes(role))
    throw badRequest('Role must be admin or viewer')

  if (role === 'viewer') {
    const allUsers = getAllUsers()
    const admins   = allUsers.filter(u => u.role === 'admin')
    const isAdmin  = allUsers.find(u => u.id === id)?.role === 'admin'
    if (isAdmin && admins.length === 1)
      throw badRequest('Cannot remove the last admin')
  }

  updateRole(id, role)
  res.json({ id, role, updated: true })
}))

adminRouter.delete('/users/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)

  if (id === req.user.userId)
    throw badRequest('Cannot delete your own account')

  deleteUser(id)
  res.json({ id, deleted: true })
}))