import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from 'recharts'
import EmptyState from './EmptyState'

const TYPE_COLORS = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#38bdf8',
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function buildTimeline(mission) {
  const events = []

  if (mission.created_at) {
    events.push({
      time: mission.created_at,
      label: 'Mission created',
      type: 'info',
      detail: `Type: ${mission.type} · Priority: ${mission.priority}`,
    })
  }

  if (mission.status === 'running' || mission.status === 'completed' || mission.status === 'failed') {
    events.push({
      time: mission.started_at || mission.created_at,
      label: 'Mission started',
      type: 'success',
      detail: `Heading to: ${mission.destination}`,
    })
  }

  if (mission.progress >= 50 && mission.status !== 'pending') {
    events.push({
      time: mission.completed_at || mission.started_at || mission.created_at,
      label: 'Halfway point reached',
      type: 'info',
      detail: `Progress: ${mission.progress}%`,
    })
  }

  if (mission.status === 'completed') {
    events.push({
      time: mission.completed_at || mission.created_at,
      label: 'Mission completed',
      type: 'success',
      detail: 'All objectives achieved',
    })
  }

  if (mission.status === 'failed') {
    events.push({
      time: mission.completed_at || mission.created_at,
      label: 'Mission failed',
      type: 'error',
      detail: 'Mission could not be completed',
    })
  }

  return events.sort((a, b) => new Date(a.time) - new Date(b.time))
}

export default function MissionTimeline({ mission, onClose }) {
  const events = buildTimeline(mission)

  const chartData = [
    { stage: 'Created', done: 1 },
    { stage: 'Started', done: mission.status !== 'pending' ? 1 : 0 },
    { stage: '50%', done: mission.progress >= 50 ? 1 : 0 },
    { stage: 'Done', done: mission.status === 'completed' ? 1 : 0 },
  ]

  return (
    <div className="modal-card" style={{ marginTop: 16 }}>
      <div className="modal-header">
        <div>
          <h3>{mission.name}</h3>
          <p className="topbar-subtext">Mission Timeline</p>
        </div>
        <button type="button" className="modal-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={chartData} barSize={20}>
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="done" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.done === 1 ? '#10b981' : '#1c1c26'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {events.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No timeline data"
          subtitle="Timeline builds as the mission progresses"
        />
      ) : (
        <div style={{ position: 'relative', paddingLeft: 24, marginTop: 8 }}>
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: 0,
              bottom: 0,
              width: 1,
              background: '#1c1c26',
            }}
          />
          {events.map((event, index) => {
            const color = TYPE_COLORS[event.type] || TYPE_COLORS.info
            return (
              <div key={index} style={{ position: 'relative', padding: '0 0 20px 16px' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: -20,
                    top: 4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}88`,
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: '#4b5563',
                    fontFamily: 'ui-monospace, Consolas, monospace',
                  }}
                >
                  {formatTime(event.time)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '2px 0' }}>
                  {event.label}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{event.detail}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
