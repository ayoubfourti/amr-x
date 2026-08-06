// To test: temporarily add this to any page component:
// if (true) throw new Error('Test error boundary')
// The error UI should appear instead of a blank screen.
// Remove the line after testing.

import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('[WareBOT ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          padding: 32,
        }}
      >
        <div
          style={{
            background: '#111117',
            border: '1px solid #1c1c26',
            borderTop: '3px solid #ef4444',
            borderRadius: 16,
            padding: '40px 48px',
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ fontSize: 32, color: '#ef4444' }}>⚠</span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            Something went wrong
          </div>

          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred in the dashboard. Your robots are still running
            normally.
          </div>

          {this.state.error && (
            <div
              style={{
                background: '#0a0a0f',
                border: '1px solid #1c1c26',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 24,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#ef4444',
                maxHeight: 80,
                overflowY: 'auto',
              }}
            >
              {this.state.error?.message || 'Unknown error'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
                this.props.onReset?.()
              }}
              style={{
                background: '#38bdf8',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e2e8f0'
                e.currentTarget.style.borderColor = '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280'
                e.currentTarget.style.borderColor = '#1c1c26'
              }}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #1c1c26',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 16 }}>
            The error has been logged to the console.
          </div>

          <details style={{ marginTop: 8 }}>
            <summary
              style={{
                fontSize: 11,
                color: '#4b5563',
                cursor: 'pointer',
                listStyle: 'none',
              }}
            >
              Show technical details
            </summary>
            <pre
              style={{
                fontSize: 10,
                color: '#4b5563',
                background: '#0a0a0f',
                borderRadius: 6,
                padding: 12,
                marginTop: 8,
                overflowX: 'auto',
                textAlign: 'left',
                maxHeight: 160,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.errorInfo?.componentStack || ''}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
