import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageTopbar from '../components/ui/PageTopbar'
import Icon from '../components/ui/Icon'
import { StatusPill } from '../components/ui/CommandUI'
import { useTheme } from '../hooks/useTheme'
import { useDemo } from '../hooks/useDemo'
import { useSidebarPreference } from '../hooks/useSidebarPreference'
import './SettingsProfile.css'

function ToggleSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      className={`control-toggle ${on ? 'is-on' : ''}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      aria-label={label}
    >
      <i />
    </button>
  )
}

function SectionCard({ icon, eyebrow, title, description, children, className = '', id }) {
  return (
    <section className={`command-surface settings-section ${className}`} id={id}>
      <header className="settings-section-header">
        <span className="settings-section-icon"><Icon name={icon} size={18} /></span>
        <span>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
          {description && <p>{description}</p>}
        </span>
      </header>
      <div className="settings-section-body">{children}</div>
    </section>
  )
}

function SettingsRow({ label, subtext, control }) {
  return (
    <div className="settings-row">
      <span className="settings-row-copy">
        <strong>{label}</strong>
        <small>{subtext}</small>
      </span>
      <div className="settings-row-control">{control}</div>
    </div>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className="settings-segmented">
      {options.map((option) => (
        <button
          type="button"
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          <Icon name={option.icon} size={14} />
          {option.label}
        </button>
      ))}
    </div>
  )
}

function SavedIndicator({ show }) {
  return show ? <span className="settings-saved"><Icon name="shield" size={13} /> Saved</span> : null
}

export default function Settings() {
  const [searchParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const { demo, toggleDemo } = useDemo()
  const { preference: sidebarDefault, setPreference: handleSidebarDefault } = useSidebarPreference()
  const [robotIp, setRobotIp] = useState('')
  const [ipSaved, setIpSaved] = useState(false)
  const [wsUrl, setWsUrl] = useState('')
  const [wsSaved, setWsSaved] = useState(false)
  const [timeout_, setTimeout_] = useState('5')
  const [connStatus, setConnStatus] = useState(null)
  const [notifCritical, setNotifCritical] = useState(true)
  const [notifMission, setNotifMission] = useState(true)
  const [notifOffline, setNotifOffline] = useState(true)
  const [highlightAppearance, setHighlightAppearance] = useState(false)
  const appearanceTimerRef = useRef(null)

  useEffect(() => {
    setRobotIp(localStorage.getItem('amrx-robot-ip') || '')
    setWsUrl(localStorage.getItem('amrx-ws-url') || '')
    setTimeout_(localStorage.getItem('amrx-timeout') || '5')
    setNotifCritical(localStorage.getItem('amrx-notif-critical') !== 'false')
    setNotifMission(localStorage.getItem('amrx-notif-mission') !== 'false')
    setNotifOffline(localStorage.getItem('amrx-notif-offline') !== 'false')

  }, [])

  useEffect(() => {
    if (searchParams.get('section') !== 'appearance') return undefined
    const requestedTheme = searchParams.get('theme')
    if ((requestedTheme === 'dark' || requestedTheme === 'light') && requestedTheme !== theme) {
      toggleTheme()
    }
    setHighlightAppearance(true)
    requestAnimationFrame(() => {
      document.getElementById('appearance-settings')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    window.clearTimeout(appearanceTimerRef.current)
    appearanceTimerRef.current = window.setTimeout(() => setHighlightAppearance(false), 2400)
    return () => window.clearTimeout(appearanceTimerRef.current)
  }, [searchParams, theme, toggleTheme])

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
      let settled = false
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true
          setConnStatus('error')
          ws.close()
        }
      }, 3000)
      ws.onopen = () => {
        settled = true
        window.clearTimeout(timer)
        setConnStatus('ok')
        ws.close()
      }
      ws.onerror = () => {
        if (!settled) {
          settled = true
          window.clearTimeout(timer)
          setConnStatus('error')
        }
      }
    } catch {
      setConnStatus('error')
    }
  }

  function selectTheme(next) {
    if (next !== theme) toggleTheme()
  }

  return (
    <div className="users-page settings-command-page">
      <PageTopbar
        title="Settings"
        subtitle="Configure workspace behavior, fleet connectivity, and operator alerts"
      />

      <section className={`command-surface demo-control-card ${demo ? 'is-active' : ''}`}>
        <span className="demo-control-icon"><Icon name="command" size={19} /></span>
        <span className="demo-control-copy">
          <small>Environment</small>
          <strong>Simulation mode</strong>
          <p>{demo ? 'Representative fleet data is active. Live API operations are bypassed.' : 'Use representative fleet data for demonstrations and interface validation.'}</p>
        </span>
        <StatusPill tone={demo ? 'amber' : 'neutral'}>{demo ? 'Simulation active' : 'Live data'}</StatusPill>
        <ToggleSwitch on={demo} onChange={toggleDemo} label="Toggle simulation mode" />
      </section>

      <div className="settings-layout">
        <div className="settings-main-column">
          <SectionCard
            id="appearance-settings"
            className={highlightAppearance ? 'settings-search-target' : ''}
            icon="overview"
            eyebrow="Workspace"
            title="Appearance"
            description="Personalize the command interface for this browser."
          >
            <SettingsRow
              label="Color theme"
              subtext="Select the interface contrast profile"
              control={
                <SegmentControl
                  value={theme}
                  onChange={selectTheme}
                  options={[
                    { value: 'dark', label: 'Dark', icon: 'moon' },
                    { value: 'light', label: 'Light', icon: 'sun' },
                  ]}
                />
              }
            />
            <SettingsRow
              label="Navigation state"
              subtext="Switch the sidebar layout now and keep it for your next visit"
              control={
                <SegmentControl
                  value={sidebarDefault}
                  onChange={handleSidebarDefault}
                  options={[
                    { value: 'open', label: 'Expanded', icon: 'chevron' },
                    { value: 'closed', label: 'Compact', icon: 'collapse' },
                  ]}
                />
              }
            />
          </SectionCard>

          <SectionCard
            icon="wifi"
            eyebrow="Infrastructure"
            title="Robot connection"
            description="Endpoints used for identification, telemetry, and remote control."
          >
            <SettingsRow
              label="Robot IP address"
              subtext="Primary unit address on the operations network"
              control={
                <div className="settings-field-action">
                  <input value={robotIp} onChange={(e) => setRobotIp(e.target.value)} placeholder="192.168.1.40" />
                  <button type="button" onClick={handleSaveIp}>Save</button>
                  <SavedIndicator show={ipSaved} />
                </div>
              }
            />
            <SettingsRow
              label="WebSocket endpoint"
              subtext="Live telemetry and teleoperation bridge"
              control={
                <div className="settings-field-action">
                  <input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} placeholder="ws://192.168.1.40:9090" />
                  <button type="button" onClick={handleSaveWs}>Save</button>
                  <SavedIndicator show={wsSaved} />
                </div>
              }
            />
            <SettingsRow
              label="Connection timeout"
              subtext="Maximum time allowed for a connection attempt"
              control={
                <select value={timeout_} onChange={handleTimeoutChange}>
                  <option value="3">3 seconds</option>
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                </select>
              }
            />
            <div className="connection-test-row">
              <button className="primary-action" type="button" onClick={handleTestConnection}>
                <Icon name="wifi" size={15} /> Test connection
              </button>
              {connStatus && (
                <StatusPill tone={connStatus === 'ok' ? 'green' : 'red'}>
                  {connStatus === 'ok' ? 'Endpoint reachable' : 'Connection failed'}
                </StatusPill>
              )}
            </div>
          </SectionCard>
        </div>

        <aside className="settings-side-column">
          <SectionCard
            icon="alert"
            eyebrow="Operator alerts"
            title="Notifications"
            description="Choose which operational events require attention."
          >
            <SettingsRow
              label="Critical alerts"
              subtext="Safety and system failures"
              control={<ToggleSwitch on={notifCritical} onChange={(v) => handleNotifChange('amrx-notif-critical', setNotifCritical, v)} label="Critical alerts" />}
            />
            <SettingsRow
              label="Mission updates"
              subtext="Starts, completions, and failures"
              control={<ToggleSwitch on={notifMission} onChange={(v) => handleNotifChange('amrx-notif-mission', setNotifMission, v)} label="Mission updates" />}
            />
            <SettingsRow
              label="Robot offline"
              subtext="Unexpected connectivity loss"
              control={<ToggleSwitch on={notifOffline} onChange={(v) => handleNotifChange('amrx-notif-offline', setNotifOffline, v)} label="Robot offline alerts" />}
            />
          </SectionCard>

          <SectionCard
            icon="command"
            eyebrow="System"
            title="Platform information"
            description="Current command-system build and runtime."
            className="platform-card"
          >
            <dl className="platform-facts">
              <div><dt>Product</dt><dd>AMR-X Control</dd></div>
              <div><dt>Version</dt><dd>2.4.1</dd></div>
              <div><dt>Runtime</dt><dd>React + Vite</dd></div>
              <div><dt>Services</dt><dd>FastAPI</dd></div>
              <div><dt>Build</dt><dd>2026.07</dd></div>
              <div><dt>Status</dt><dd className="online-value"><i /> Operational</dd></div>
            </dl>
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}
