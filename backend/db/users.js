import bcrypt from 'bcryptjs'

let db = null

export const setDb = (database) => { db = database }

export const createUser = async (username, password, role = 'viewer') => {
  const hash = await bcrypt.hash(password, 10)
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(username, hash, role)
  return { id: result.lastInsertRowid, username, role }
}

export const findByUsername = (username) => {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
}

export const findById = (id) => {
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id)
}

export const getAllUsers = () => {
  return db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at').all()
}

export const updateRole = (id, role) => {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
}

export const deleteUser = (id) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

export const getUserCount = () => {
  return db.prepare('SELECT COUNT(*) as count FROM users').get().count
}

export const verifyPassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash)
}
