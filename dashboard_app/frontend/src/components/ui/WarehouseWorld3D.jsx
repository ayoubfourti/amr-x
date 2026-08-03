import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { annotationWorldPosition, MAP_LABEL_TYPES } from '../../hooks/useMapAnnotations'

function IsoBox({ x, y, w, h, z, category, label }) {
  const lift = Math.max(2, z * .72)
  const skew = Math.max(1, z * .38)
  return (
    <g className={`iso-box entity-${category}`}>
      <title>{label}</title>
      <path className="iso-side-left" d={`M${x} ${y} L${x + skew} ${y - lift} L${x + skew} ${y + h - lift} L${x} ${y + h}Z`} />
      <path className="iso-side-right" d={`M${x + w} ${y} L${x + w + skew} ${y - lift} L${x + w + skew} ${y + h - lift} L${x + w} ${y + h}Z`} />
      <path className="iso-top" d={`M${x} ${y} L${x + skew} ${y - lift} L${x + w + skew} ${y - lift} L${x + w} ${y}Z`} />
      <path className="iso-front" d={`M${x} ${y} H${x + w} V${y + h} H${x}Z`} />
      {category === 'rack' && [.2, .4, .6, .8].map((ratio) => (
        <path key={ratio} className="rack-post" d={`M${x + w * ratio} ${y - 1}V${y + h}`} />
      ))}
    </g>
  )
}

function WorldEntity({ entity, project }) {
  const [px, py] = project(entity.pose[0], entity.pose[1])
  const size = entity.geometry.size || [
    (entity.geometry.radius || .4) * 2,
    (entity.geometry.radius || .4) * 2,
    entity.geometry.length || 1,
  ]
  const [sx, sy] = project(size[0] / 2, size[1] / 2, true)
  const w = Math.max(5, sx * 2)
  const h = Math.max(3, sy * 2)

  if (entity.category === 'light') {
    return (
      <g className="sdf-light">
        <title>{entity.name} · {entity.geometry.lightType}</title>
        <circle cx={px} cy={py} r="3" />
        <circle className="sdf-light-range" cx={px} cy={py} r={Math.max(8, Math.min(38, entity.geometry.range * 1.6))} />
      </g>
    )
  }

  if (entity.category === 'zone') {
    return (
      <g className={`sdf-zone zone-${entity.name.replace(/^zone_/, '')}`}>
        <title>{entity.name}</title>
        <rect x={px - w / 2} y={py - h / 2} width={w} height={h} rx="2" />
        <text x={px} y={py + 3}>{entity.name.replace(/^zone_/, '').replaceAll('_', ' ').toUpperCase()}</text>
      </g>
    )
  }

  if (entity.geometry.type === 'cylinder' || entity.category === 'actor') {
    return (
      <g className={`sdf-cylinder entity-${entity.category}`}>
        <title>{entity.name}</title>
        <ellipse cx={px} cy={py} rx={Math.max(4, w / 2)} ry={Math.max(3, h / 2)} />
        <path d={`M${px - w / 2} ${py}v-${Math.max(8, size[2] * 10)}M${px + w / 2} ${py}v-${Math.max(8, size[2] * 10)}`} />
      </g>
    )
  }

  return (
    <IsoBox
      x={px - w / 2}
      y={py - h / 2}
      w={w}
      h={h}
      z={Math.max(3, Math.min(48, size[2] * 13))}
      category={entity.category}
      label={entity.name}
    />
  )
}

function RobotMarker({ robot, index, project, worldCenter }) {
  const fallback = [[0, 0], [4, -3], [-5, 3]][index % 3]
  const sourceX = robot.position_x != null ? robot.position_x - 12 : worldCenter[0] + fallback[0]
  const sourceY = robot.position_y != null ? robot.position_y - 8 : worldCenter[1] + fallback[1]
  const [x, y] = project(sourceX, sourceY)
  return (
    <g className={`world-robot ${robot.status || 'online'}`} transform={`translate(${x} ${y})`}>
      <ellipse className="world-robot-glow" cx="0" cy="10" rx="21" ry="9" />
      <path className="world-robot-body" d="M-16-3 0-11 17-3 15 10 0 17-15 10Z" />
      <path className="world-robot-top" d="M-11-4 0-10 12-4 0 2Z" />
      <circle cx="0" cy="-6" r="3.5" />
      <path className="world-robot-heading" d="M0-17v-14m0 0-4 6m4-6 4 6" />
      <text x="22" y="-12">{robot.name}</text>
    </g>
  )
}

const WarehouseWorld3D = forwardRef(function WarehouseWorld3D({
  robots = [],
  world,
  annotations = [],
  onAnnotationSelect,
  onAnnotationPointerDown,
}, ref) {
  const [angle, setAngle] = useState(0)
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef(null)
  const svgRef = useRef(null)
  const bounds = world?.bounds || { width: 24, height: 16 }
  const centerX = Number.isFinite(bounds.minX) && Number.isFinite(bounds.maxX)
    ? (bounds.minX + bounds.maxX) / 2
    : 0
  const centerY = Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxY)
    ? (bounds.minY + bounds.maxY) / 2
    : 0
  const scaleX = 560 / Math.max(bounds.width, 8)
  const scaleY = 285 / Math.max(bounds.height, 8)

  const project = (x, y, sizeOnly = false) => {
    if (sizeOnly) return [Math.abs(x * scaleX), Math.abs(y * scaleY)]
    return [380 + (x - centerX) * scaleX, 250 - (y - centerY) * scaleY]
  }

  const entities = useMemo(
    () => (world?.entities || [])
      .filter((entity) => entity.category !== 'floor')
      .sort((a, b) => {
        const rank = { zone: 0, wall: 1, partition: 2, rack: 3, landmark: 4, included: 4, payload: 5, obstacle: 5, actor: 6, dock: 6, light: 7 }
        return (rank[a.category] ?? 4) - (rank[b.category] ?? 4) || b.pose[1] - a.pose[1]
      }),
    [world],
  )

  const zones = entities.filter((entity) => entity.category === 'zone')
  const start = zones[0]
    ? project(zones[0].pose[0], zones[0].pose[1])
    : project(centerX - bounds.width * .35, centerY)
  const end = zones[1]
    ? project(zones[1].pose[0], zones[1].pose[1])
    : project(centerX + bounds.width * .35, centerY)
  const route = `M${start[0]} ${start[1]} C${start[0] + 120} ${start[1] - 80} ${end[0] - 120} ${end[1] + 80} ${end[0]} ${end[1]}`
  const worldRobots = robots.length ? robots : [{ id: 1, name: 'AMR-X 01', status: 'online' }]

  function clampCameraZoom(value) {
    return Math.max(.65, Math.min(2.8, value))
  }

  function zoomIn() {
    setZoom((value) => clampCameraZoom(value * 1.18))
  }

  function zoomOut() {
    setZoom((value) => clampCameraZoom(value / 1.18))
  }

  function reset() {
    setAngle(0)
    setZoom(1)
  }

  function clientToWorld(clientX, clientY) {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const scenePoint = point.matrixTransform(matrix.inverse())
    const worldX = centerX + (scenePoint.x - 380) / scaleX
    const worldY = centerY - (scenePoint.y - 250) / scaleY
    return {
      worldX: Math.max(bounds.minX ?? centerX - bounds.width / 2, Math.min(bounds.maxX ?? centerX + bounds.width / 2, worldX)),
      worldY: Math.max(bounds.minY ?? centerY - bounds.height / 2, Math.min(bounds.maxY ?? centerY + bounds.height / 2, worldY)),
    }
  }

  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, reset, clientToWorld }))

  function handleWheel(event) {
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    setZoom((value) => clampCameraZoom(value * factor))
  }

  function startOrbit(event) {
    if (event.target.closest('button') || (event.pointerType === 'mouse' && event.button !== 0)) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      angle,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // The gesture may already have ended.
    }
  }

  function moveOrbit(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const nextAngle = drag.angle + (event.clientX - drag.startX) * .12
    if (Number.isFinite(nextAngle)) setAngle(nextAngle)
  }

  function endOrbit(event) {
    const drag = dragRef.current
    if (drag && drag.pointerId !== event.pointerId) return
    dragRef.current = null
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Pointer capture may already have been released.
    }
  }

  return (
    <div
      className="warehouse-world-3d"
      onWheel={handleWheel}
      onPointerDown={startOrbit}
      onPointerMove={moveOrbit}
      onPointerUp={endOrbit}
      onPointerCancel={endOrbit}
      onLostPointerCapture={endOrbit}
      style={{ touchAction: 'none', cursor: dragRef.current ? 'grabbing' : 'grab' }}
    >
      <div className="world-scene" style={{ transform: `perspective(1000px) scale(${zoom}) rotateX(1deg) rotateZ(${angle}deg)` }}>
        <svg ref={svgRef} viewBox="0 0 760 480" role="img" aria-label={`${world?.label || 'Warehouse'} SDF digital twin`}>
          <defs>
            <linearGradient id="worldFloor" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#0a2434" />
              <stop offset="1" stopColor="#06131f" />
            </linearGradient>
            <filter id="worldGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="worldGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="#2c6a7d" strokeOpacity=".16" strokeWidth=".7" />
            </pattern>
          </defs>
          <path className="world-floor" d="M72 82H674L720 402H28Z" fill="url(#worldFloor)" />
          <path d="M72 82H674L720 402H28Z" fill="url(#worldGrid)" />
          {zones.length > 1 && <><path className="world-route-glow" d={route} /><path className="world-route" d={route} /></>}
          {entities.map((entity) => <WorldEntity entity={entity} project={project} key={entity.id} />)}
          {worldRobots.slice(0, 3).map((robot, index) => (
            <RobotMarker
              robot={robot}
              index={index}
              project={project}
              worldCenter={[centerX, centerY]}
              key={robot.id}
            />
          ))}
          {annotations.map((annotation) => {
            const position = annotationWorldPosition(annotation, bounds)
            const [x, y] = project(position.worldX, position.worldY)
            const type = MAP_LABEL_TYPES[annotation.type] || MAP_LABEL_TYPES.note
            const text = annotation.label || type.label
            const labelWidth = Math.min(160, Math.max(56, text.length * 6 + 20))
            return (
              <g
                className="world-annotation"
                transform={`translate(${x} ${y})`}
                onClick={(event) => {
                  event.stopPropagation()
                  onAnnotationSelect?.(annotation.id)
                }}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  onAnnotationPointerDown?.(event, annotation.id)
                }}
                style={{ cursor: onAnnotationPointerDown ? 'grab' : onAnnotationSelect ? 'pointer' : 'default' }}
                key={annotation.id}
              >
                <title>{`${type.label}: ${text}`}</title>
                <ellipse cx="0" cy="7" rx="9" ry="4" fill={type.color} fillOpacity=".28" />
                <path d="M0 5V-24" stroke={type.color} strokeWidth="1.6" />
                <circle cx="0" cy="5" r="3.5" fill={type.color} stroke="#e8ffff" strokeWidth=".8" />
                <rect
                  x={-labelWidth / 2}
                  y="-44"
                  width={labelWidth}
                  height="21"
                  rx="6"
                  fill="#061923"
                  fillOpacity=".95"
                  stroke={type.color}
                  strokeOpacity=".75"
                />
                <text x="0" y="-33" fill="#ebfbfe" fontSize="9" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
                  {text}
                </text>
              </g>
            )
          })}
          <g className="world-axis" transform="translate(690 435)">
            <path d="M0 0h26M0 0v-26" />
            <text x="29" y="3">X</text><text x="-3" y="-31">Y</text>
          </g>
        </svg>
      </div>
      <div className="world-camera-tools">
        <button type="button" onClick={() => setAngle((value) => value - 2)} aria-label="Rotate world left">↶</button>
        <button type="button" onClick={reset} aria-label="Reset world camera">ISO</button>
        <button type="button" onClick={() => setAngle((value) => value + 2)} aria-label="Rotate world right">↷</button>
      </div>
      <span className="world-render-label">
        <i /> SDF · {world?.entities?.length || 0} entities · {bounds.width} × {bounds.height} m
      </span>
    </div>
  )
})

export default WarehouseWorld3D
