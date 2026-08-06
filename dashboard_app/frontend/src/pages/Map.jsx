import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRobots } from '../api/robots'
import { useDemo } from '../hooks/useDemo'
import WarehouseMapSVG from '../components/ui/WarehouseMapSVG'
import WarehouseWorld3D from '../components/ui/WarehouseWorld3D'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import { PageHeader, PageShell, StatusPill } from '../components/ui/CommandUI'
import {
  annotationWorldPosition,
  MAP_LABEL_TYPES,
  percentToWorld,
  useMapAnnotations,
} from '../hooks/useMapAnnotations'
import sdfManifest from '../generated/sdf-worlds.json'
import './Map.css'

const STATUS_COLORS = {
  online: '#5ee0b5',
  offline: '#758d98',
  error: '#ff746c',
}

function worldDisplayName(world) {
  const variant = world.id
    .replace(world.name.replaceAll('_', '-'), '')
    .replace(/^-|-$/g, '')
  return variant ? `${world.label} · ${variant}` : world.label
}

function clampPercent(value) {
  return Math.max(2, Math.min(98, value))
}

export default function Map() {
  const mapRef = useRef(null)
  const canvasRef = useRef(null)
  const { demo, DEMO_ROBOTS } = useDemo()
  const { data: apiRobots = [], isLoading, isError } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 2000,
  })

  const robots = demo || isError ? DEMO_ROBOTS : apiRobots
  const worlds = sdfManifest.worlds
  const [worldId, setWorldId] = useState(() => localStorage.getItem('amrx-map-world') || worlds[0]?.id)
  const [viewMode, setViewMode] = useState('2d')
  const [editMode, setEditMode] = useState(false)
  const [addingLabel, setAddingLabel] = useState(false)
  const [selectedLabelId, setSelectedLabelId] = useState(null)
  const [draggingLabelId, setDraggingLabelId] = useState(null)
  const [resetArmed, setResetArmed] = useState(false)

  const selectedWorld = worlds.find((world) => world.id === worldId) || worlds[0]
  const { annotations, updateAnnotations, resetAnnotations } = useMapAnnotations(selectedWorld.id)
  const selectedLabel = annotations.find((annotation) => annotation.id === selectedLabelId) || null
  const onlineCount = robots.filter((robot) => robot.status === 'online').length

  useEffect(() => {
    localStorage.setItem('amrx-map-world', selectedWorld.id)
    setSelectedLabelId(null)
    setAddingLabel(false)
    setResetArmed(false)
    mapRef.current?.reset()
  }, [selectedWorld.id])

  const updateWorldAnnotations = (updater) => {
    updateAnnotations(updater)
  }

  const updateAnnotation = (id, changes) => {
    updateWorldAnnotations((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  const addAnnotation = (event) => {
    if (!addingLabel || draggingLabelId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clampPercent(((event.clientX - rect.left) / rect.width) * 100)
    const y = clampPercent(((event.clientY - rect.top) / rect.height) * 100)
    const mapPosition = mapRef.current?.clientToWorld(event.clientX, event.clientY)
      || percentToWorld(x, y, selectedWorld.bounds)
    const annotation = {
      id: `${selectedWorld.id}-${Date.now()}`,
      label: 'New map label',
      type: 'waypoint',
      x,
      y,
      ...(mapPosition || percentToWorld(x, y, selectedWorld.bounds)),
    }
    updateWorldAnnotations((items) => [...items, annotation])
    setSelectedLabelId(annotation.id)
    setAddingLabel(false)
    setEditMode(true)
  }

  const moveAnnotation = (event) => {
    if (!draggingLabelId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clampPercent(((event.clientX - rect.left) / rect.width) * 100)
    const y = clampPercent(((event.clientY - rect.top) / rect.height) * 100)
    const mapPosition = mapRef.current?.clientToWorld(event.clientX, event.clientY)
      || percentToWorld(x, y, selectedWorld.bounds)
    if (mapPosition) updateAnnotation(draggingLabelId, { x, y, ...mapPosition })
  }

  const startMovingAnnotation = (event, id) => {
    if (!editMode) return
    event.stopPropagation()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is best-effort on SVG groups.
    }
    setSelectedLabelId(id)
    setDraggingLabelId(id)
  }

  const selectWorld = (nextWorldId) => {
    setWorldId(nextWorldId)
  }

  return (
    <PageShell className="digital-map-page">
      <PageHeader
        eyebrow="Digital twin workspace"
        title="Live map"
        description="Explore every SDF world, monitor the fleet, and maintain operational labels"
        icon="map"
        actions={
          <StatusPill tone={onlineCount ? 'green' : 'amber'}>
            {onlineCount}/{robots.length} robots online
          </StatusPill>
        }
      />

      <section className="map-workspace-toolbar">
        <div className="map-world-select">
          <span>Active digital twin</span>
          <SelectField
            name="map-world"
            value={selectedWorld.id}
            options={worlds.map((world) => ({
              value: world.id,
              label: `${worldDisplayName(world)} — ${world.entities.length} entities`,
            }))}
            onChange={(event) => selectWorld(event.target.value)}
            ariaLabel="Active digital twin"
          />
        </div>

        <div className="map-view-toggle" role="group" aria-label="Map view">
          <button type="button" className={viewMode === '2d' ? 'active' : ''} onClick={() => setViewMode('2d')}>
            <Icon name="map" size={16} /> 2D floor plan
          </button>
          <button type="button" className={viewMode === '3d' ? 'active' : ''} onClick={() => setViewMode('3d')}>
            <Icon name="overview" size={16} /> 3D world
          </button>
        </div>

        <div className="map-edit-actions">
          <button
            type="button"
            className={editMode ? 'active' : ''}
            onClick={() => {
              setEditMode((value) => !value)
              setAddingLabel(false)
            }}
          >
            <Icon name="settings" size={16} />
            {editMode ? 'Finish editing' : 'Edit labels'}
          </button>
          <button
            type="button"
            className={`map-add-label ${addingLabel ? 'active' : ''}`}
            onClick={() => {
              setEditMode(true)
              setAddingLabel((value) => !value)
            }}
          >
            <span>＋</span>
            {addingLabel ? 'Click the map…' : 'Add label'}
          </button>
        </div>
      </section>

      <main className="map-workspace">
        <section className={`map-canvas-panel ${addingLabel ? 'is-placing-label' : ''}`}>
          <header className="map-canvas-header">
            <div>
              <span><i /> {viewMode === '2d' ? 'SDF floor plan' : 'Interactive world model'}</span>
              <strong>{selectedWorld.label}</strong>
              <small>{selectedWorld.source}</small>
            </div>
            <div className="map-canvas-stats">
              <span><small>Dimensions</small><strong>{selectedWorld.bounds.width} × {selectedWorld.bounds.height} m</strong></span>
              <span><small>Entities</small><strong>{selectedWorld.entities.length}</strong></span>
              <span><small>Labels</small><strong>{annotations.length}</strong></span>
            </div>
          </header>

          <div
            className="map-canvas"
            ref={canvasRef}
            onClick={addAnnotation}
            onPointerMove={moveAnnotation}
            onPointerUp={() => setDraggingLabelId(null)}
            onPointerCancel={() => setDraggingLabelId(null)}
          >
            {isLoading && !demo ? (
              <div className="map-workspace-loading"><i /><span>Loading fleet telemetry…</span></div>
            ) : viewMode === '2d' ? (
              <WarehouseMapSVG
                ref={mapRef}
                robots={robots}
                world={selectedWorld}
                height="100%"
                compact={false}
                colors={STATUS_COLORS}
                annotations={annotations}
                onAnnotationSelect={editMode ? setSelectedLabelId : undefined}
                onAnnotationPointerDown={editMode ? startMovingAnnotation : undefined}
              />
            ) : (
              <WarehouseWorld3D
                ref={mapRef}
                robots={robots}
                world={selectedWorld}
                annotations={annotations}
                onAnnotationSelect={editMode ? setSelectedLabelId : undefined}
                onAnnotationPointerDown={editMode ? startMovingAnnotation : undefined}
              />
            )}

            {addingLabel && (
              <div className="map-placement-hint">
                <Icon name="map" size={18} />
                Click anywhere to place a label
                <button type="button" onClick={(event) => {
                  event.stopPropagation()
                  setAddingLabel(false)
                }}>Cancel</button>
              </div>
            )}

            <div className="map-zoom-tools">
              <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label={`Zoom in ${viewMode} view`}>+</button>
              <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label={`Zoom out ${viewMode} view`}>−</button>
              <button type="button" onClick={() => mapRef.current?.reset()} aria-label={`Reset ${viewMode} view`}>⌂</button>
            </div>
          </div>
        </section>

        <aside className="map-inspector">
          <section className="map-inspector-section">
            <header><span>World library</span><strong>{worlds.length} worlds</strong></header>
            <div className="map-world-library">
              {worlds.map((world) => (
                <button
                  type="button"
                  className={world.id === selectedWorld.id ? 'active' : ''}
                  onClick={() => selectWorld(world.id)}
                  key={world.id}
                >
                  <span><Icon name={world.id.includes('hospital') ? 'shield' : 'map'} size={15} /></span>
                  <i><strong>{worldDisplayName(world)}</strong><small>{world.entities.length} entities · {world.bounds.width} × {world.bounds.height} m</small></i>
                  <Icon name="chevron" size={14} />
                </button>
              ))}
            </div>
          </section>

          <section className="map-inspector-section label-inspector">
            <header>
              <span>Map labels</span>
              <div className="label-header-actions">
                <strong>{annotations.length}</strong>
                {annotations.length > 0 && (
                  <button
                    type="button"
                    className={resetArmed ? 'is-armed' : ''}
                    onClick={() => {
                      if (!resetArmed) {
                        setResetArmed(true)
                        return
                      }
                      resetAnnotations()
                      setSelectedLabelId(null)
                      setResetArmed(false)
                    }}
                  >
                    {resetArmed ? 'Confirm reset' : 'Reset all'}
                  </button>
                )}
              </div>
            </header>
            {selectedLabel ? (
              <div className="label-editor">
                <label>
                  <span>Label name</span>
                  <input
                    value={selectedLabel.label}
                    onChange={(event) => updateAnnotation(selectedLabel.id, { label: event.target.value })}
                    maxLength={48}
                  />
                </label>
                <div className="label-editor-field">
                  <span>Label type</span>
                  <SelectField
                    name="map-label-type"
                    value={selectedLabel.type}
                    options={Object.entries(MAP_LABEL_TYPES).map(([value, type]) => ({
                      value,
                      label: type.label,
                    }))}
                    onChange={(event) => updateAnnotation(selectedLabel.id, { type: event.target.value })}
                    ariaLabel="Map label type"
                  />
                </div>
                <div className="label-coordinate-row">
                  <label>
                    <span>World X (m)</span>
                    <input
                      type="number"
                      step=".1"
                      value={annotationWorldPosition(selectedLabel, selectedWorld.bounds).worldX.toFixed(1)}
                      onChange={(event) => updateAnnotation(selectedLabel.id, { worldX: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>World Y (m)</span>
                    <input
                      type="number"
                      step=".1"
                      value={annotationWorldPosition(selectedLabel, selectedWorld.bounds).worldY.toFixed(1)}
                      onChange={(event) => updateAnnotation(selectedLabel.id, { worldY: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <p><Icon name="command" size={14} /> This label uses metric world coordinates and stays attached in both 2D and 3D views.</p>
                <button
                  type="button"
                  className="label-delete"
                  onClick={() => {
                    updateWorldAnnotations((items) => items.filter((item) => item.id !== selectedLabel.id))
                    setSelectedLabelId(null)
                  }}
                >
                  <Icon name="close" size={14} /> Remove label
                </button>
              </div>
            ) : annotations.length ? (
              <div className="map-label-list">
                {annotations.map((annotation) => (
                  <button type="button" onClick={() => setSelectedLabelId(annotation.id)} key={annotation.id}>
                    <i style={{ background: MAP_LABEL_TYPES[annotation.type]?.color }} />
                    <span><strong>{annotation.label}</strong><small>{MAP_LABEL_TYPES[annotation.type]?.label || 'Note'}</small></span>
                    <Icon name="chevron" size={13} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="map-label-empty">
                <Icon name="map" size={23} />
                <strong>No labels in this world</strong>
                <small>Add operational waypoints, safety areas, and notes.</small>
                <button type="button" onClick={() => {
                  setEditMode(true)
                  setAddingLabel(true)
                }}>Add first label</button>
              </div>
            )}
          </section>

          <section className="map-inspector-section fleet-inspector">
            <header><span>Fleet overlay</span><strong>{onlineCount} online</strong></header>
            <div>
              {robots.slice(0, 5).map((robot) => (
                <button type="button" onClick={() => viewMode === '2d' && mapRef.current?.focusRobot(robot)} key={robot.id}>
                  <i style={{ background: STATUS_COLORS[robot.status] || STATUS_COLORS.offline }} />
                  <span><strong>{robot.name}</strong><small>{robot.battery ?? 0}% battery · {robot.mode || 'Standby'}</small></span>
                  <b>{robot.status}</b>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </PageShell>
  )
}
