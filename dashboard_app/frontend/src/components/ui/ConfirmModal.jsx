export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  confirmColor = '#ef4444',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card"
        style={{ maxWidth: 400, textAlign: 'center', padding: '32px 28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `${confirmColor}15`,
            border: `1px solid ${confirmColor}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 24,
          }}
        >
          {confirmColor === '#ef4444' ? '🗑' : '⚠️'}
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>

        <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-sub)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: confirmColor,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
