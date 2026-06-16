import { useState } from 'react'
import { cn }       from '../utils/cn'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">
            CloudWatch_Pro
          </h1>
          <p className="text-sm text-slate-400">
            Real-time server monitoring
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">
            Sign in
          </h2>

          {error && (
            <div className="bg-red-950 border border-red-500 rounded-lg
                            px-4 py-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                required
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600
                           rounded-lg text-sm text-slate-100 placeholder-slate-500
                           outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                autoComplete='new-password'
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600
                           rounded-lg text-sm text-slate-100 placeholder-slate-500
                           outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-2',
                loading || !username || !password
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer'
              )}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          <p className="mt-4 text-xs text-center text-slate-500">
            Default: admin / admin123
          </p>
        </div>

      </div>
    </div>
  )
}

export default LoginPage