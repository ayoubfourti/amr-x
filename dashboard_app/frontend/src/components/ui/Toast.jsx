import { useCallback, useState } from 'react'
import { ToastContext } from '../../context/internalContexts'

const TYPE_COLORS = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#38bdf8',
}

const TYPE_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const MAX_TOASTS = 4
const AUTO_DISMISS_MS = 3500

function ToastItem({ toast, onClose }) {
  const color = TYPE_COLORS[toast.type] || TYPE_COLORS.info
  const icon = TYPE_ICONS[toast.type] || TYPE_ICONS.info

  return (
    <div
      className="toast-enter"
      style={{
        minWidth: 280,
        maxWidth: 380,
        background: '#111117',
        border: '1px solid #1c1c26',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          minWidth: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}26`,
          color,
          fontSize: 14,
        }}
      >
        {icon}
      </span>
      <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        style={{
          color: '#6b7280',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }].slice(-MAX_TOASTS))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, AUTO_DISMISS_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
