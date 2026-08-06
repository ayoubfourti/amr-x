import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div className="modal-card" style={{ maxWidth: 420, textAlign: 'center', padding: 48 }}>
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-blue))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          404
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Page not found</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
          The page you're looking for doesn't exist or you don't have permission to view it.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="primary-button" type="button" onClick={() => navigate('/')}>
            ← Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '9px 20px',
              color: 'var(--text-sub)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
