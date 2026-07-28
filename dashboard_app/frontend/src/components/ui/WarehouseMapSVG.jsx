import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

const METERS_W = 40
const METERS_H = 30
const SCALE = 20
const VB_W = METERS_W * SCALE
const VB_H = METERS_H * SCALE
// Set IS_DEMO = true to simulate robot movement
// for UI testing when no real robot position data
// exists. Set to false when backend sends real
// position_x / position_y values via the API.
const IS_DEMO = false

const ZONES = [
  { x: 2, y: 2, w: 4, h: 3, color: '#10b981', label: 'Charging Zone' },
  { x: 30, y: 18, w: 8, h: 10, color: '#ef4444', label: 'Restricted' },
  { x: 10, y: 5, w: 3, h: 3, color: '#38bdf8', label: 'Delivery A' },
  { x: 20, y: 20, w: 3, h: 3, color: '#38bdf8', label: 'Delivery B' },
  { x: 15, y: 14, w: 3, h: 3, color: '#f59e0b', label: 'Inspection' },
]

// Maps each ZONES entry's legacy `color` to the new blueprint palette
const ZONE_COLOR_MAP = {
  '#10b981': '#00d4aa', // Charging
  '#ef4444': '#ef4444', // Restricted
  '#38bdf8': '#3b82f6', // Delivery
  '#f59e0b': '#f59e0b', // Inspection
}

const OBSTACLES = [
  { x: 8, y: 10, w: 12, h: 1.5 },
  { x: 8, y: 14, w: 12, h: 1.5 },
  { x: 8, y: 18, w: 12, h: 1.5 },
]

const SHELF_LABELS = ['A', 'B', 'C']

function toSvgX(m) {
  return m * SCALE
}
function toSvgY(m) {
  return m * SCALE
}

const WarehouseMapSVG = forwardRef(function WarehouseMapSVG(
  { robots, height = 420, compact = false, colors },
  ref,
) {
  const svgRef = useRef(null)
  const dragState = useRef(null)
  const historyRef = useRef(new Map())
  const robotListRef = useRef([])

  const statusColors = {
    online: colors?.online || '#10b981',
    offline: colors?.offline || '#6b7280',
    error: colors?.error || '#ef4444',
  }

  const robotList = robots || []
  robotListRef.current = robotList

  const anyRealPosition = robotList.some((r) => r.position_x != null && r.position_y != null)
  const robotIdsKey = useMemo(() => (robots || []).map((r) => r.id).join(','), [robots])

  const [demoPositions, setDemoPositions] = useState({})

  useEffect(() => {
    if (!IS_DEMO || anyRealPosition || robotListRef.current.length === 0) return

    setDemoPositions((prev) => {
      const next = { ...prev }
      let changed = false
      robotListRef.current.forEach((r, idx) => {
        if (!next[r.id]) {
          next[r.id] = {
            x: 5 + (idx % 5) * 4,
            y: 5 + Math.floor(idx / 5) * 4,
            heading: 0,
          }
          changed = true
        }
      })
      return changed ? next : prev
    })

    const interval = setInterval(() => {
      setDemoPositions((prev) => {
        const next = {}
        for (const [id, pos] of Object.entries(prev)) {
          const nx = Math.min(METERS_W - 1, Math.max(1, pos.x + (Math.random() - 0.5) * 0.2))
          const ny = Math.min(METERS_H - 1, Math.max(1, pos.y + (Math.random() - 0.5) * 0.2))
          const heading = (Math.atan2(ny - pos.y, nx - pos.x) * 180) / Math.PI
          next[id] = { x: nx, y: ny, heading: Number.isNaN(heading) ? pos.heading : heading }
        }
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [anyRealPosition, robotIdsKey])

  const robotsWithPosition = useMemo(() => {
    return (robots || []).map((r) => {
      const hasReal = r.position_x != null && r.position_y != null
      if (hasReal) {
        return { ...r, mx: r.position_x, my: r.position_y, heading: r.orientation ?? 0, unpositioned: false }
      }
      if (IS_DEMO && demoPositions[r.id]) {
        const d = demoPositions[r.id]
        return { ...r, mx: d.x, my: d.y, heading: d.heading, unpositioned: false }
      }
      return { ...r, mx: 5, my: 5, heading: 0, unpositioned: true }
    })
  }, [robots, demoPositions])

  useEffect(() => {
    robotsWithPosition.forEach((r) => {
      if (r.unpositioned) return
      const hist = historyRef.current.get(r.id) || []
      const last = hist[hist.length - 1]
      if (!last || last.x !== r.mx || last.y !== r.my) {
        const next = [...hist, { x: r.mx, y: r.my }].slice(-30)
        historyRef.current.set(r.id, next)
      }
    })
  }, [robotsWithPosition])

  const [view, setView] = useState({ cx: VB_W / 2, cy: VB_H / 2, zoom: 1 })

  function clampZoom(z) {
    return Math.min(3.0, Math.max(0.4, z))
  }

  function handleWheel(e) {
    e.preventDefault()
    setView((v) => ({ ...v, zoom: clampZoom(v.zoom * (e.deltaY < 0 ? 1.1 : 0.9)) }))
  }

  function startDrag(clientX, clientY) {
    dragState.current = { startX: clientX, startY: clientY, cx: view.cx, cy: view.cy }
  }

  function moveDrag(clientX, clientY) {
    if (!dragState.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const w = VB_W / view.zoom
    const h = VB_H / view.zoom
    const dx = ((clientX - dragState.current.startX) * w) / rect.width
    const dy = ((clientY - dragState.current.startY) * h) / rect.height
    setView((v) => ({ ...v, cx: dragState.current.cx - dx, cy: dragState.current.cy - dy }))
  }

  function endDrag() {
    dragState.current = null
  }

  function handleMouseDown(e) {
    startDrag(e.clientX, e.clientY)
  }
  function handleMouseMove(e) {
    if (dragState.current) moveDrag(e.clientX, e.clientY)
  }

  function zoomIn() {
    setView((v) => ({ ...v, zoom: clampZoom(v.zoom * 1.2) }))
  }
  function zoomOut() {
    setView((v) => ({ ...v, zoom: clampZoom(v.zoom * 0.8) }))
  }
  function reset() {
    setView({ cx: VB_W / 2, cy: VB_H / 2, zoom: 1 })
  }
  function focusRobot(robot) {
    const found = robotsWithPosition.find((r) => r.id === robot.id) || robot
    setView({ cx: toSvgX(found.mx ?? 5), cy: toSvgY(found.my ?? 5), zoom: 1.8 })
  }

  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, reset, focusRobot }))

  const vbW = VB_W / view.zoom
  const vbH = VB_H / view.zoom
  const viewBox = `${view.cx - vbW / 2} ${view.cy - vbH / 2} ${vbW} ${vbH}`

  const vLines = []
  for (let m = 0; m <= METERS_W; m++) vLines.push(m)
  const hLines = []
  for (let m = 0; m <= METERS_H; m++) hLines.push(m)

  return (
    <div
      style={{ width: '100%', height, cursor: 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onWheel={handleWheel}
    >
      <svg ref={svgRef} viewBox={viewBox} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#0d1f3c" stopOpacity="1" />
            <stop offset="100%" stopColor="#070e1a" stopOpacity="1" />
          </radialGradient>
          <filter id="trailGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#mapBg)" />

        {vLines.map((m) => (
          <line
            key={`v${m}`}
            x1={toSvgX(m)}
            y1={0}
            x2={toSvgX(m)}
            y2={VB_H}
            stroke={m % 5 === 0 ? '#0f4d38' : '#0d3d2e'}
            strokeOpacity={m % 5 === 0 ? 1 : 0.8}
            strokeWidth={m % 5 === 0 ? 0.8 : 0.6}
          />
        ))}
        {hLines.map((m) => (
          <line
            key={`h${m}`}
            x1={0}
            y1={toSvgY(m)}
            x2={VB_W}
            y2={toSvgY(m)}
            stroke={m % 5 === 0 ? '#0f4d38' : '#0d3d2e'}
            strokeOpacity={m % 5 === 0 ? 1 : 0.8}
            strokeWidth={m % 5 === 0 ? 0.8 : 0.6}
          />
        ))}

        <rect
          x={SCALE * 0.5}
          y={SCALE * 0.5}
          width={VB_W - SCALE}
          height={VB_H - SCALE}
          fill="none"
          stroke="#1e6b4a"
          strokeWidth="3"
          strokeOpacity="0.6"
          rx="2"
        />

        {!compact &&
          vLines
            .filter((m) => m % 5 === 0)
            .map((m) => (
              <text key={`vl${m}`} x={toSvgX(m) + 2} y={10} fontSize={8} fill="#1a6b4a">
                {m}
              </text>
            ))}
        {!compact &&
          hLines
            .filter((m) => m % 5 === 0)
            .map((m) => (
              <text key={`hl${m}`} x={2} y={toSvgY(m) + 10} fontSize={8} fill="#1a6b4a">
                {m}
              </text>
            ))}

        {ZONES.map((z) => {
          const zoneColor = ZONE_COLOR_MAP[z.color] || z.color
          const cx = toSvgX(z.x) + (z.w * SCALE) / 2
          const cy = toSvgY(z.y) + (z.h * SCALE) / 2
          const labelText = z.label.toUpperCase()
          const labelW = labelText.length * 5 + 8
          return (
            <g key={z.label}>
              <rect
                x={toSvgX(z.x)}
                y={toSvgY(z.y)}
                width={z.w * SCALE}
                height={z.h * SCALE}
                fill={zoneColor}
                fillOpacity="0.08"
                stroke={zoneColor}
                strokeOpacity="0.4"
                strokeDasharray="4 3"
              />
              {!compact && (
                <>
                  <rect
                    x={cx - labelW / 2}
                    y={cy - 6}
                    width={labelW}
                    height={12}
                    fill={zoneColor}
                    fillOpacity="0.2"
                    rx="3"
                  />
                  <text
                    x={cx}
                    y={cy}
                    fontSize={7}
                    fontWeight="600"
                    letterSpacing="0.5"
                    fill={zoneColor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {labelText}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {OBSTACLES.map((o, i) => {
          const x = toSvgX(o.x)
          const y = toSvgY(o.y)
          const w = o.w * SCALE
          const h = o.h * SCALE
          const dividers = []
          for (let dx = SCALE * 2; dx < w; dx += SCALE * 2) {
            dividers.push(dx)
          }
          return (
            <g key={`obs${i}`}>
              <rect x={x} y={y} width={w} height={h} fill="#0d2a1f" stroke="#1a5c3a" strokeWidth="0.5" rx="1" />
              {dividers.map((dx) => (
                <line
                  key={dx}
                  x1={x + dx}
                  y1={y}
                  x2={x + dx}
                  y2={y + h}
                  stroke="#1a5c3a"
                  strokeOpacity="0.5"
                  strokeWidth="0.3"
                />
              ))}
              {!compact && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  fontSize={6}
                  fill="#1a5c3a"
                  opacity="0.7"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  SHELF {SHELF_LABELS[i] || i + 1}
                </text>
              )}
            </g>
          )
        })}

        {robotsWithPosition.map((r) => {
          const cx = toSvgX(r.mx)
          const cy = toSvgY(r.my)
          const color = statusColors[r.status] || '#6b7280'
          const hist = historyRef.current.get(r.id) || []
          const points = hist.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ')

          return (
            <g key={r.id}>
              {points && (
                <polyline
                  points={points}
                  fill="none"
                  stroke="#00d4aa"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                  strokeDasharray="6 3"
                  filter="url(#trailGlow)"
                />
              )}

              {r.unpositioned ? (
                <g>
                  <circle cx={cx} cy={cy} r={10} fill="none" stroke="#6b7280" strokeDasharray="3 2" />
                  <text x={cx} y={cy + 4} fontSize={11} fill="#9ca3af" textAnchor="middle">
                    ?
                  </text>
                  {!compact && (
                    <text x={cx} y={cy + 22} fontSize={10} fill="#9ca3af" textAnchor="middle">
                      {r.name}
                    </text>
                  )}
                </g>
              ) : (
                <g>
                  <circle
                    className="robot-pulse-ring"
                    cx={cx}
                    cy={cy}
                    r={18}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                  <circle cx={cx} cy={cy} r={12} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1" strokeOpacity="0.6" />

                  <g transform={`translate(${cx},${cy}) rotate(${r.heading})`}>
                    <rect x="-7" y="-8" width="14" height="16" fill="#0a1628" stroke={color} strokeWidth="1.5" rx="2" />
                    <rect x="-4" y="-12" width="8" height="5" fill={color} fillOpacity="0.8" rx="1" />
                    <polygon points="0,-15 -3,-11 3,-11" fill={color} />
                    <circle cx="-2.5" cy="-5" r="1.5" fill={color} fillOpacity="0.9" />
                    <circle cx="2.5" cy="-5" r="1.5" fill={color} fillOpacity="0.9" />
                    <line x1="-5" y1="0" x2="5" y2="0" stroke={color} strokeWidth="0.8" strokeOpacity="0.5" />
                  </g>

                  {!compact && (
                    <>
                      <text
                        x={cx}
                        y={cy + 25}
                        textAnchor="middle"
                        fill={color}
                        fontSize="8"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {r.name}
                      </text>
                      <text x={cx} y={cy + 33} textAnchor="middle" fill={color} fontSize="7" fillOpacity="0.7">
                        {r.battery ?? '?'}%
                      </text>
                    </>
                  )}
                </g>
              )}
            </g>
          )
        })}

        {robotList.length === 0 && (
          <text x={VB_W / 2} y={VB_H / 2} fontSize={14} fill="#6b7280" textAnchor="middle">
            🤖 No robots registered — add a robot to see it on the map
          </text>
        )}
      </svg>
    </div>
  )
})

export default WarehouseMapSVG
