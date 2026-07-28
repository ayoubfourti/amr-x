import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRobots } from '../api/robots'
import { useAuth } from '../context/AuthContext'
import WarehouseMapSVG from '../components/ui/WarehouseMapSVG'

const STATUS_COLORS = {
  online: '#10b981',
  offline: '#6b7280',
  error: '#ef4444',
}

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2']

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function avatarColor(name) {
  const i = (name || '').charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i] || AVATAR_COLORS[0]
}

function formatRelativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  return `${Math.round(diffHr / 24)} d ago`
}

function batteryColor(b) {
  if (b == null) return '#6b7280'
  if (b < 20) return '#ef4444'
  if (b < 40) return '#f59e0b'
  return '#10b981'
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 12, height: 12, backgroundColor: color, borderRadius: 3, display: 'inline-block' }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

export default function Map() {
  const { currentUser } = useAuth()
  const mapRef = useRef(null)

  const { data: robots, isLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 2000,
  })

  const robotList = robots || []

  const onlineCount = robotList.filter((r) => r.status === 'online').length
  const offlineCount = robotList.filter((r) => r.status === 'offline').length
  const firstOnline = robotList.find((r) => r.status === 'online')

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <h2 style={s.title}>Map</h2>
          <p style={s.subtext}>{new Date().toLocaleString()}</p>
        </div>
        <div style={s.topbarRight}>
          <span style={s.connectionPill}>
            📶 Connected · {firstOnline?.wifi_latency != null ? `${firstOnline.wifi_latency}ms` : 'N/A'}
          </span>
          {currentUser && (
            <span style={{ ...s.avatarChip, backgroundColor: avatarColor(currentUser.name) }}>
              {initials(currentUser.name)}
            </span>
          )}
        </div>
      </div>

      <div className="map-body" style={s.body}>
        <div className="map-panel" style={s.mapPanel}>
          <div style={s.mapControls}>
            <button className="map-icon-btn" style={s.iconBtn} onClick={() => mapRef.current?.zoomIn()} type="button">
              +
            </button>
            <button className="map-icon-btn" style={s.iconBtn} onClick={() => mapRef.current?.zoomOut()} type="button">
              −
            </button>
            <button className="map-icon-btn" style={s.iconBtn} onClick={() => mapRef.current?.reset()} type="button">
              ⤾
            </button>
          </div>

          {isLoading && <div className="map-shimmer" style={s.skeleton} />}

          {!isLoading && (
            <div className="map-svg-wrap" style={s.svgWrap}>
              <WarehouseMapSVG
                ref={mapRef}
                robots={robotList}
                height="100%"
                compact={false}
                colors={STATUS_COLORS}
              />
            </div>
          )}
        </div>

        <div className="map-fleet-panel" style={s.fleetPanel}>
          <div style={s.fleetHeader}>
            <span style={s.pill}>{robotList.length} total</span>
            <span style={{ ...s.pill, color: '#10b981' }}>{onlineCount} online</span>
            <span style={{ ...s.pill, color: '#6b7280' }}>{offlineCount} offline</span>
          </div>

          {isLoading && <div className="map-shimmer" style={s.panelSkeleton} />}

          {!isLoading && (
            <div style={s.robotCards}>
              {robotList.map((r) => (
                <div
                  key={r.id}
                  className="map-robot-card"
                  style={{ ...s.robotCard, borderLeft: `3px solid ${STATUS_COLORS[r.status] || '#6b7280'}` }}
                >
                  <div style={s.robotCardHeader}>
                    <strong>{r.name}</strong>
                    <span style={{ ...s.badge, backgroundColor: STATUS_COLORS[r.status] || '#6b7280' }}>
                      {r.status}
                    </span>
                  </div>
                  <div style={s.battRow}>
                    <div style={s.battBarBg}>
                      <div
                        style={{
                          ...s.battBarFill,
                          width: `${r.battery ?? 0}%`,
                          backgroundColor: batteryColor(r.battery),
                        }}
                      />
                    </div>
                    <span style={s.mono}>{r.battery ?? '—'}%</span>
                  </div>
                  <div style={s.mono}>
                    {r.speed ?? '—'} m/s · {r.wifi_latency ?? '—'} ms
                  </div>
                  <div style={{ ...s.badge, backgroundColor: '#2563eb', marginTop: 6 }}>{r.mode}</div>
                  <div style={s.rowBetween}>
                    <button
                      className="map-icon-btn"
                      style={s.focusBtn}
                      onClick={() => mapRef.current?.focusRobot(r)}
                      type="button"
                    >
                      Focus
                    </button>
                    <span style={s.lastSeen}>{formatRelativeTime(r.last_seen)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={s.legend}>
            <div style={s.legendTitle}>Legend</div>
            <LegendItem color="#10b981" label="Charging" />
            <LegendItem color="#ef4444" label="Restricted" />
            <LegendItem color="#38bdf8" label="Delivery" />
            <LegendItem color="#f59e0b" label="Inspection" />
            <LegendItem color="#1e293b" label="Obstacle" />
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'var(--text)' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtext: { color: 'var(--text-sub)', fontSize: '0.85rem', margin: '4px 0 0' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  connectionPill: {
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '5px 14px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    background: 'var(--card)',
  },
  avatarChip: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 700,
  },

  body: { display: 'flex', gap: 20, height: 'calc(100vh - 100px)' },

  mapPanel: {
    position: 'relative',
    flex: 1,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--card-hover)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: 16,
  },
  skeleton: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, var(--card) 25%, var(--border) 50%, var(--card) 75%)',
    backgroundSize: '200% 100%',
  },
  svgWrap: { width: '100%', height: '100%' },

  fleetPanel: {
    width: 280,
    flexShrink: 0,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  fleetHeader: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    background: 'var(--bg)',
  },
  panelSkeleton: {
    height: 200,
    borderRadius: 12,
    background: 'linear-gradient(90deg, var(--card) 25%, var(--border) 50%, var(--card) 75%)',
    backgroundSize: '200% 100%',
  },
  robotCards: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  robotCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 },
  robotCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  battRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  battBarBg: { flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' },
  battBarFill: { height: '100%', borderRadius: 3 },
  mono: { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: '0.7rem',
    color: '#fff',
    textTransform: 'capitalize',
  },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  focusBtn: {
    padding: '4px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--card-hover)',
    color: '#38bdf8',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  lastSeen: { fontSize: '0.7rem', color: 'var(--text-sub)' },

  legend: { borderTop: '1px solid var(--border)', paddingTop: 12 },
  legendTitle: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'var(--text-sub)',
    marginBottom: 8,
  },
}
