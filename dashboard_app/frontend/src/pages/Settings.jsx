import { useEffect, useState } from 'react'
import PageTopbar from '../components/ui/PageTopbar'
import { useTheme } from '../context/ThemeContext'
import { useDemo } from '../context/DemoContext'

function ToggleSwitch({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? 'var(--accent)' : 'var(--border)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </div>
  )
}

function SettingsRow({ label, subtext, control }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>
      </div>
      <div>{control}</div>
    </div>
  )
}

function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className="filter-btn"
      onClick={onClick}
      style={active ? { background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)' } : undefined}
    >
      {children}
    </button>
  )
}

function SavedIndicator({ show }) {
  if (!show) return null
  return <span style={{ color: 'var(--online)', fontSize: 12, marginLeft: 8 }}>✓ Saved</span>
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { demo, toggleDemo } = useDemo()

  const [sidebarDefault, setSidebarDefault] = useState('open')

  const [robotIp, setRobotIp] = useState('')
  const [ipSaved, setIpSaved] = useState(false)

  const [wsUrl, setWsUrl] = useState('')
  const [wsSaved, setWsSaved] = useState(false)

  const [timeout_, setTimeout_] = useState('5')
  const [connStatus, setConnStatus] = useState(null)

  const [notifCritical, setNotifCritical] = useState(true)
  const [notifMission, setNotifMission] = useState(true)
  const [notifOffline, setNotifOffline] = useState(true)

  useEffect(() => {
    setSidebarDefault(localStorage.getItem('warebot-sidebar') === 'closed' ? 'closed' : 'open')
    setRobotIp(localStorage.getItem('amrx-robot-ip') || '')
    setWsUrl(localStorage.getItem('amrx-ws-url') || '')
    setTimeout_(localStorage.getItem('amrx-timeout') || '5')
    setNotifCritical(localStorage.getItem('amrx-notif-critical') !== 'false')
    setNotifMission(localStorage.getItem('amrx-notif-mission') !== 'false')
    setNotifOffline(localStorage.getItem('amrx-notif-offline') !== 'false')
  }, [])

  function handleSidebarDefault(next) {
    setSidebarDefault(next)
    localStorage.setItem('warebot-sidebar', next)
  }

  function handleSaveIp() {
    localStorage.setItem('amrx-robot-ip', robotIp)
    setIpSaved(true)
    setTimeout(() => setIpSaved(false), 1500)
  }

  function handleSaveWs() {
    localStorage.setItem('amrx-ws-url', wsUrl)
    setWsSaved(true)
    setTimeout(() => setWsSaved(false), 1500)
  }

  function handleTimeoutChange(e) {
    const next = e.target.value
    setTimeout_(next)
    localStorage.setItem('amrx-timeout', next)
  }

  function handleNotifChange(key, setter, value) {
    setter(value)
    localStorage.setItem(key, String(value))
  }

  async function handleTestConnection() {
    setConnStatus(null)
    try {
      const ws = new WebSocket(wsUrl || 'ws://localhost:9090')
      ws.onopen = () => {
        setConnStatus('ok')
        ws.close()
      }
      ws.onerror = () => setConnStatus('error')
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          setConnStatus('error')
        }
      }, 3000)
    } catch {
      setConnStatus('error')
    }
  }

  return (
    <div className="users-page">
      <PageTopbar title="Settings" />

      <div
        className="modal-card"
        style={{
          marginBottom: 20,
          borderColor: demo ? 'rgba(245,158,11,0.4)' : 'var(--border)',
          borderWidth: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                color: demo ? 'var(--warning)' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {demo && (
                <span
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    letterSpacing: 1,
                    color: 'var(--warning)',
                  }}
                >
                  ACTIVE
                </span>
              )}
              Demo Mode
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {demo
                ? 'App is showing fake data. Real API calls are bypassed.'
                : 'Show realistic fake data for presentations and client demos.'}
            </p>
          </div>
          <ToggleSwitch on={demo} onChange={toggleDemo} />
        </div>

        {demo && (
          <div
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: 'var(--warning)',
              lineHeight: 1.6,
            }}
          >
            ⚠ Demo mode is ON — all data shown is simulated. Disable before connecting a real robot.
          </div>
        )}
      </div>

      <div className="modal-card" style={{ marginBottom: 20 }}>
        <h3>Appearance</h3>
        <SettingsRow
          label="Theme"
          subtext="Choose between dark and light mode"
          control={
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton active={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()}>
                🌙 Dark
              </PillButton>
              <PillButton active={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()}>
                ☀️ Light
              </PillButton>
            </div>
          }
        />
        <SettingsRow
          label="Sidebar"
          subtext="Default sidebar state on startup"
          control={
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton active={sidebarDefault === 'open'} onClick={() => handleSidebarDefault('open')}>
                Expanded
              </PillButton>
              <PillButton active={sidebarDefault === 'closed'} onClick={() => handleSidebarDefault('closed')}>
                Collapsed
              </PillButton>
            </div>
          }
        />
      </div>

      <div className="modal-card" style={{ marginBottom: 20 }}>
        <h3>Robot Connection</h3>
        <SettingsRow
          label="Robot IP Address"
          subtext="Used for WebSocket connection and robot identification. Format: 192.168.x.x"
          control={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="search-input"
                value={robotIp}
                onChange={(e) => setRobotIp(e.target.value)}
                placeholder="192.168.1.xx"
                style={{ minWidth: 240 }}
              />
              <button className="primary-button" onClick={handleSaveIp} style={{ whiteSpace: 'nowrap' }}>
                Save
              </button>
              <SavedIndicator show={ipSaved} />
            </div>
          }
        />
        <SettingsRow
          label="WebSocket URL"
          subtext="Address the dashboard connects to for live telemetry and robot control. Used by Teleoperation page. Requires page reload to take effect."
          control={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="search-input"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://192.168.1.xx:9090"
                style={{ minWidth: 240 }}
              />
              <button className="primary-button" onClick={handleSaveWs} style={{ whiteSpace: 'nowrap' }}>
                Save
              </button>
              <SavedIndicator show={wsSaved} />
            </div>
          }
        />
        <SettingsRow
          label="Connection timeout"
          subtext="How long to wait before a connection attempt fails"
          control={
            <select className="search-input" value={timeout_} onChange={handleTimeoutChange} style={{ minWidth: 120 }}>
              <option value="3">3s</option>
              <option value="5">5s</option>
              <option value="10">10s</option>
              <option value="30">30s</option>
            </select>
          }
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
          }}
        >
          <button className="primary-button" type="button" onClick={handleTestConnection}>
            Test Connection
          </button>
          {connStatus && (
            <span
              style={{
                fontSize: 12,
                color: connStatus === 'ok' ? 'var(--online)' : 'var(--error)',
              }}
            >
              {connStatus === 'ok' ? '✓ WebSocket reachable' : '✕ Could not connect'}
            </span>
          )}
        </div>
      </div>

      <div className="modal-card" style={{ marginBottom: 20 }}>
        <h3>Notifications</h3>
        <SettingsRow
          label="Critical alerts"
          subtext="Robot errors and safety-critical events"
          control={
            <ToggleSwitch
              on={notifCritical}
              onChange={(v) => handleNotifChange('amrx-notif-critical', setNotifCritical, v)}
            />
          }
        />
        <SettingsRow
          label="Mission updates"
          subtext="Mission start, completion, and failure notifications"
          control={
            <ToggleSwitch
              on={notifMission}
              onChange={(v) => handleNotifChange('amrx-notif-mission', setNotifMission, v)}
            />
          }
        />
        <SettingsRow
          label="Robot offline alerts"
          subtext="Notify when a robot loses connection"
          control={
            <ToggleSwitch
              on={notifOffline}
              onChange={(v) => handleNotifChange('amrx-notif-offline', setNotifOffline, v)}
            />
          }
        />
      </div>

      <div className="modal-card">
        <h3>About</h3>
        <div className="detail-grid">
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>App Name</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>AMR-X Control System</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Version</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>v2.4.1</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Build</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>2025</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Backend</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>FastAPI</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Frontend</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>React + Vite</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Theme Engine</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>CSS Variables</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          This dashboard is built for CyberMech Systems autonomous robot fleet management.
        </p>
      </div>
    </div>
  )
}
