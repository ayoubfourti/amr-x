import { useEffect, useRef, useState } from 'react'
import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function batteryColor(battery) {
  if (battery == null) return '#6b7280'
  if (battery < 15) return '#ef4444'
  if (battery < 40) return '#f59e0b'
  return '#10b981'
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div
      style={{
        background: '#1c1c26',
        border: 'none',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 11,
        color: '#e2e8f0',
      }}
    >
      Battery: {payload[0].value}%
    </div>
  )
}

export default function BatterySparkline({ battery, robotId }) {
  const historyRef = useRef({})
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!historyRef.current[robotId]) {
      historyRef.current[robotId] = []
    }
  }, [robotId])

  useEffect(() => {
    if (typeof battery !== 'number' || Number.isNaN(battery)) return
    const list = historyRef.current[robotId] || []
    const next = [...list, { time: Date.now(), value: battery }].slice(-20)
    historyRef.current[robotId] = next
    setHistory([...next])
  }, [battery, robotId])

  const currentColor = batteryColor(battery)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 11,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Battery Trend
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'ui-monospace, Consolas, monospace',
            color: currentColor,
          }}
        >
          {battery ?? '—'}%
        </span>
      </div>

      {history.length < 2 ? (
        <p style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
          Collecting data…
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={currentColor}
              fill={currentColor}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div style={{ height: 4, borderRadius: 2, background: '#1c1c26', marginTop: 8 }}>
        <div
          style={{
            height: '100%',
            borderRadius: 2,
            width: `${battery ?? 0}%`,
            background: currentColor,
          }}
        />
      </div>
    </div>
  )
}
