import bcrypt from 'bcryptjs'

let db = null

export const setDb = (database) => { db = database }

export const createUser = async (username, password, role = 'viewer') => {
  const hash   = await bcrypt.hash(password, 10)
  const result = await db.execute({
    sql:  'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    args: [username, hash, role]
  })
  return { id: Number(result.lastInsertRowid), username, role }
}

export const findByUsername = async (username) => {
  const { rows } = await db.execute({
    sql:  'SELECT * FROM users WHERE username = ?',
    args: [username]
  })
  return rows[0] || null
}

export const findById = async (id) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, username, role, created_at FROM users WHERE id = ?',
    args: [id]
  })
  return rows[0] || null
}

export const getAllUsers = async () => {
  const { rows } = await db.execute(
    'SELECT id, username, role, created_at FROM users ORDER BY created_at'
  )
  return rows
}

export const updateRole = async (id, role) => {
  await db.execute({
    sql:  'UPDATE users SET role = ? WHERE id = ?',
    args: [role, id]
  })
}

export const deleteUser = async (id) => {
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] })
}

export const getUserCount = async () => {
  const { rows } = await db.execute('SELECT COUNT(*) as count FROM users')
  return Number(rows[0]?.count ?? 0)
}

export const verifyPassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash)
}
