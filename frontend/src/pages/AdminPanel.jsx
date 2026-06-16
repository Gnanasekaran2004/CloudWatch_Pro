import { useState, useEffect, useCallback } from 'react'
import { getToken } from '../api/client'
import { cn }       from '../utils/cn'

const authFetch = (url, opts = {}) =>
  fetch(url, {
    ...opts,
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${getToken()}`,
      ...opts.headers
    }
  })

function AdminPanel({ currentUser }) {
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({ username: '', password: '', role: 'viewer' })
  const [formError, setFormError] = useState('')
  const [saving,    setSaving]    = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      const res  = await authFetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to load users')
      setUsers(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const res  = await authFetch('/api/admin/users', {
        method: 'POST',
        body:   JSON.stringify(form)
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setUsers(prev => [...prev, body])
      setForm({ username: '', password: '', role: 'viewer' })
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      const res = await authFetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        body:   JSON.stringify({ role })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try {
      const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return (
    <div className="py-8 text-center text-sm text-slate-500">
      Loading users...
    </div>
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            User Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {users.length} user{users.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500
                     text-white rounded-lg cursor-pointer transition-colors">
          {showForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-950 border border-red-500 rounded-lg
                        px-4 py-3 mb-4 text-sm text-red-400 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-300 cursor-pointer">×</button>
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <form onSubmit={handleCreate}
              className="bg-slate-900 border border-slate-600 rounded-xl
                         p-5 mb-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200">New user</h3>

          {formError && (
            <div className="bg-red-950 border border-red-500 rounded-lg
                            px-3 py-2 text-xs text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              required
              className="px-3 py-2 bg-slate-800 border border-slate-600
                         rounded-lg text-sm text-slate-100 placeholder-slate-500
                         outline-none focus:border-blue-400"
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
              className="px-3 py-2 bg-slate-800 border border-slate-600
                         rounded-lg text-sm text-slate-100 placeholder-slate-500
                         outline-none focus:border-blue-400"
            />
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="px-3 py-2 bg-slate-800 border border-slate-600
                         rounded-lg text-sm text-slate-100 outline-none
                         focus:border-blue-400 cursor-pointer">
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-colors self-start',
              saving
                ? 'bg-slate-700 text-slate-500 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
            )}>
            {saving ? 'Creating...' : 'Create user'}
          </button>
        </form>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_100px_120px_80px] px-4 py-2
                      border-b-2 border-slate-600
                      text-xs text-slate-400 uppercase font-bold tracking-wider">
        <div>Username</div>
        <div>Role</div>
        <div>Created</div>
        <div>Actions</div>
      </div>

      {/* User rows */}
      {users.map(u => {
        const isSelf      = u.id === currentUser?.id
        const createdDate = new Date(u.created_at).toLocaleDateString()

        return (
          <div key={u.id}
               className="grid grid-cols-[1fr_100px_120px_80px] px-4 py-3
                          border-b border-slate-700 items-center text-sm
                          hover:bg-slate-700/40 transition-colors">

            {/* Username */}
            <div className="flex items-center gap-2">
              <span className="text-slate-100 font-medium">{u.username}</span>
              {isSelf && (
                <span className="text-xs bg-slate-700 text-slate-400
                                 px-2 py-0.5 rounded-full">you</span>
              )}
            </div>

            {/* Role badge + toggle */}
            <div>
              {isSelf ? (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  u.role === 'admin'
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-slate-700 text-slate-400'
                )}>
                  {u.role}
                </span>
              ) : (
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  className="bg-slate-700 text-slate-200 text-xs rounded-md
                             px-2 py-1 border border-slate-600 cursor-pointer
                             outline-none focus:border-blue-400">
                  <option value="viewer">viewer</option>
                  <option value="admin">admin</option>
                </select>
              )}
            </div>

            {/* Created date */}
            <div className="text-xs text-slate-500">{createdDate}</div>

            {/* Delete button */}
            <div>
              {!isSelf && (
                <button
                  onClick={() => handleDelete(u.id, u.username)}
                  className="text-xs text-red-400 hover:text-red-300
                             cursor-pointer transition-colors bg-transparent border-none">
                  Delete
                </button>
              )}
            </div>
          </div>
        )
      })}

      {users.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          No users found
        </div>
      )}
    </div>
  )
}

export default AdminPanel