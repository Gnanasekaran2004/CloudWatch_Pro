import { useState, useEffect, useCallback } from 'react'

// Toast item
const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 3000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const colors = {
    info:    { bg: '#1e3a5f', border: 'var(--blue)',   text: 'var(--blue)'   },
    success: { bg: '#1a3a1a', border: 'var(--green)',  text: 'var(--green)'  },
    warning: { bg: '#3a2a0a', border: 'var(--yellow)', text: 'var(--yellow)' },
    error:   { bg: '#450a0a', border: 'var(--red)',    text: 'var(--red)'    },
  }
  const c = colors[toast.type] ?? colors.info

  return (
    <div style={{
      background:   c.bg,
      border:       `1px solid ${c.border}`,
      borderRadius: '8px',
      padding:      '10px 14px',
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      minWidth:     '260px',
      maxWidth:     '380px',
      boxShadow:    '0 4px 12px rgba(0,0,0,0.4)',
      animation:    'slideIn 0.2s ease'
    }}>
      <span style={{ color: c.text, fontSize: '16px' }}>
        {toast.type === 'success' ? '✓' :
         toast.type === 'warning' ? '⚠' :
         toast.type === 'error'   ? '✕' : 'ℹ'}
      </span>
      <span style={{ flex: 1, fontSize: '13px',
                     color: 'var(--text-primary)' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none',
                 color: 'var(--text-muted)', cursor: 'pointer',
                 fontSize: '16px', padding: '0 2px' }}>
        ×
      </button>
    </div>
  )
}

// Toast container — fixed position, stacks toasts
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position:      'fixed',
      bottom:        '1.5rem',
      right:         '1.5rem',
      display:       'flex',
      flexDirection: 'column',
      gap:           '0.5rem',
      zIndex:        1000
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Hook — useToast()
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    info:    (msg) => add(msg, 'info'),
    success: (msg) => add(msg, 'success'),
    warning: (msg) => add(msg, 'warning'),
    error:   (msg) => add(msg, 'error'),
  }

  return { toasts, remove, toast }
}