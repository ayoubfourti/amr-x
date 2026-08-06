import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getModules, toggleModule, createModule } from '../api/modules'
import { getRobots } from '../api/robots'
import Badge from '../components/ui/Badge'
import PageTopbar from '../components/ui/PageTopbar'
import { StatGrid, StatusPill } from '../components/ui/CommandUI'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../hooks/useToast'
import { useDockingStatus } from '../hooks/useDockingStatus'
import { useModuleDocking } from '../hooks/useModuleDocking'
import { useRosConnection } from '../hooks/useRosConnection'
import { formatDate } from '../utils/format'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import dualArmImage from '../../../../docs/assets/images/dual-arm-module-concept-render.png'
import singleArmImage from '../../../../docs/assets/images/rviz-arm-urdf-model.png'
import shelfAccessImage from '../../../../docs/assets/images/reference-shelf-climbing-robot-detail.png'
import inspectionImage from '../../../../docs/assets/images/reference-mobile-manipulator-warehouse.png'
import sensorImage from '../../../../docs/assets/images/rviz-amr-x-base-model.png'
import compartmentImage from '../../../../docs/assets/images/secure-compartment-module-cad.png'
import './Modules.css'

const FILTERS = ['all', 'active', 'inactive', 'error']
const MODULE_STATUS_OPTIONS = [
  { value: 'connected', label: 'Connected' },
  { value: 'disconnected', label: 'Disconnected' },
  { value: 'error', label: 'Error' },
  { value: 'standby', label: 'Standby' },
]

const MODULE_LIBRARY = [
  {
    id: 'MOD-DUAL-ARM',
    name: 'Dual-arm manipulator',
    type: 'dual_arm',
    image: dualArmImage,
    icon: 'route',
    stage: 'Confirmed V1',
    tone: 'green',
    source: 'AMR-X concept',
    description: 'Coordinated manipulation payload for handling, pick-and-place, and workcell interaction.',
    capability: 'MoveIt 2 · Manipulation',
  },
  {
    id: 'MOD-ARM',
    name: 'Robotic arm',
    type: 'robotic_arm',
    image: singleArmImage,
    icon: 'route',
    stage: 'Engineering',
    tone: 'blue',
    source: 'ROS engineering capture',
    description: 'Single-arm payload for compact manipulation tasks and early motion-planning validation.',
    capability: 'Arm control · ROS 2',
  },
  {
    id: 'MOD-SHELF',
    name: 'Shelf-access module',
    type: 'shelf_access',
    image: shelfAccessImage,
    icon: 'module',
    stage: 'Future concept',
    tone: 'amber',
    source: 'External reference',
    description: 'Vertical and rack-interface payload direction for retrieval in structured storage systems.',
    capability: 'Lift · Rack interface',
  },
  {
    id: 'MOD-INSPECTION',
    name: 'Inspection module',
    type: 'inspection',
    image: inspectionImage,
    icon: 'camera',
    stage: 'Future concept',
    tone: 'amber',
    source: 'External reference',
    description: 'Mobile inspection payload for facility rounds, evidence capture, and remote assessment.',
    capability: 'Vision · Remote inspection',
  },
  {
    id: 'MOD-SENSOR',
    name: 'Sensor payload',
    type: 'sensor_payload',
    image: sensorImage,
    icon: 'wifi',
    stage: 'Engineering',
    tone: 'blue',
    source: 'ROS engineering capture',
    description: 'Configurable perception payload for depth, thermal, environmental, and localization sensors.',
    capability: 'Perception · Data capture',
  },
  {
    id: 'MOD-COMPARTMENT',
    name: 'Secure compartment',
    type: 'secure_compartment',
    image: compartmentImage,
    icon: 'shield',
    stage: 'Concept',
    tone: 'cyan',
    source: 'AMR-X concept',
    description: 'Enclosed delivery payload for controlled transport and auditable handover workflows.',
    capability: 'Secure delivery · Access',
  },
]

function tempColor(temperature) {
  if (temperature == null) return '#6b7280'
  if (temperature < 50) return '#16a34a'
  if (temperature <= 70) return '#d97706'
  return '#dc2626'
}

const emptyForm = { robot_id: '', name: '', type: '', status: 'disconnected' }

function ModuleModal({ form, onChange, onSubmit, onClose, isSaving, errorMessage }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>New Module</h3>
            <p className="topbar-subtext">Attach a new module to a robot</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label className="auth-field">
            <span className="auth-label">Robot ID</span>
            <input name="robot_id" type="number" value={form.robot_id} onChange={onChange} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Name</span>
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Type</span>
            <input name="type" value={form.type} onChange={onChange} required />
          </label>
          <div className="auth-field">
            <span className="auth-label">Status</span>
            <SelectField
              name="status"
              value={form.status}
              options={MODULE_STATUS_OPTIONS}
              onChange={onChange}
              ariaLabel="Module status"
            />
          </div>

          {errorMessage && <p className="error">{errorMessage}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Creating…' : '+ Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Modules() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { ros } = useRosConnection()
  const docking = useDockingStatus(ros)
  const { dock: onDock, undock: onUndock, progress, result } = useModuleDocking(ros)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const {
    data: modules,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['modules'], queryFn: getModules, refetchInterval: 5000 })

  const { data: robots } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleModule(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      showToast('Module updated', 'success')
    },
    onError: () => {
      showToast('Failed to update module', 'error')
    },
  })

  const createMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      setShowForm(false)
      setForm(emptyForm)
      showToast('Module added', 'success')
    },
    onError: () => {
      showToast('Failed to add module', 'error')
    },
  })

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    createMutation.mutate({ ...form, robot_id: Number(form.robot_id) })
  }

  function openTemplate(template) {
    setForm({
      robot_id: '',
      name: template.name,
      type: template.type,
      status: 'disconnected',
    })
    setShowForm(true)
  }

  const moduleList = modules || []

  const stats = useMemo(() => {
    const list = modules || []
    return {
      active: list.filter((m) => m.is_active).length,
      inactive: list.filter((m) => !m.is_active && m.status !== 'error').length,
      error: list.filter((m) => m.status === 'error').length,
    }
  }, [modules])

  const filteredModules = moduleList.filter((m) => {
    if (filter === 'active') return m.is_active
    if (filter === 'inactive') return !m.is_active && m.status !== 'error'
    if (filter === 'error') return m.status === 'error'
    return true
  })

  const latency = (robots || []).find((r) => r.status === 'online')?.wifi_latency ?? null

  return (
    <div className="users-page">
      <PageTopbar
        title="Modules"
        latency={latency}
        subtitle={`${moduleList.length} registered · Payload inventory`}
        action={
          <button type="button" className="primary-action" onClick={() => setShowForm(true)}>
            <Icon name="module" size={16} /> New module
          </button>
        }
      />

      {showForm && (
        <ModuleModal
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isSaving={createMutation.isPending}
          errorMessage={createMutation.isError ? createMutation.error.message : ''}
        />
      )}

      <StatGrid items={[
        { label: 'Active', value: stats.active, icon: 'module', detail: 'Attached now', tone: 'green' },
        { label: 'Inactive', value: stats.inactive, icon: 'pause', detail: 'Available', tone: 'blue' },
        { label: 'Error', value: stats.error, icon: 'alert', detail: 'Needs service', tone: 'red' },
      ]} />

      <section className="command-surface module-interface-status">
        <span className="module-interface-icon"><Icon name="command" size={19} /></span>
        <span className="module-interface-copy">
          <small>Common interface</small>
          <strong>Module docking station</strong>
          <p>Mechanical lock, presence detection, power, and data handoff.</p>
        </span>
        <div className="module-interface-facts">
          <span><small>State</small><strong>{docking?.state || 'unavailable'}</strong></span>
          <span><small>Lock</small><strong>{docking?.mechanicalLock ? 'Engaged' : 'Released'}</strong></span>
          <span><small>Presence</small><strong>{docking?.moduleDetected ? 'Detected' : 'Clear'}</strong></span>
        </div>
        <StatusPill tone={docking?.state === 'docked' ? 'green' : 'neutral'}>
          {docking?.state === 'docked' ? 'Docked' : 'Ready'}
        </StatusPill>
        <div className="module-interface-actions">
          <button type="button" onClick={onDock} disabled={!onDock || docking?.state !== 'undocked'}>
            <Icon name="module" size={14} /> Dock
          </button>
          <button type="button" onClick={onUndock} disabled={!onUndock || docking?.state !== 'docked'}>
            Undock
          </button>
        </div>
        {progress && (
          <div className="module-docking-progress">
            <span style={{ width: `${Math.max(0, Math.min(100, progress.progress * 100))}%` }} />
          </div>
        )}
        {result && <p className={`module-docking-result ${result.success ? 'is-success' : 'is-error'}`}>{result.message}</p>}
      </section>

      {moduleList.length > 0 && (
        <section className="registered-modules-section">
          <header className="module-section-heading">
            <div><small>Connected hardware</small><h2>Registered modules</h2></div>
            <div className="module-filter-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={filter === f ? 'active' : ''}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </header>
        </section>
      )}

      {isLoading && <p>Loading modules…</p>}
      {isError && <p className="error">Failed to load modules: {error.message}</p>}

      {!isLoading && !isError && moduleList.length > 0 && filteredModules.length === 0 && (
        <EmptyState
          icon={<Icon name="search" size={40} />}
          title="No modules match your search"
          subtitle="Try a different filter"
        />
      )}

      {!isLoading && !isError && filteredModules.length > 0 && (
        <div className="card-grid">
          {filteredModules.map((mod) => (
            <div className="stat-card" key={mod.id}>
              <div className="user-cell">
                <strong>{mod.name}</strong>
                <input
                  type="checkbox"
                  checked={mod.is_active}
                  onChange={() => toggleMutation.mutate({ id: mod.id, isActive: !mod.is_active })}
                  disabled={toggleMutation.isPending}
                />
              </div>
              <div className="mt-4">
                <Badge
                  text={mod.temperature == null ? '—' : `${mod.temperature}°C`}
                  color={tempColor(mod.temperature)}
                />
              </div>
              <span>Robot #{mod.robot_id}</span>
              <span className="topbar-subtext">{formatDate(mod.last_update)}</span>
            </div>
          ))}
        </div>
      )}

      <section className="module-library-section">
        <header className="module-section-heading">
          <div>
            <small>Platform roadmap</small>
            <h2>Module library</h2>
            <p>Engineering concepts and reference placeholders for the shared AMR-X module interface.</p>
          </div>
          <span className="module-library-count">{MODULE_LIBRARY.length} directions</span>
        </header>

        <div className="module-library-grid">
          {MODULE_LIBRARY.map((template) => (
            <article className="command-surface module-concept-card" key={template.id}>
              <div className="module-concept-media">
                <img src={template.image} alt={`${template.name} placeholder`} />
                <span className="module-source-label">{template.source}</span>
                <span className="module-concept-icon"><Icon name={template.icon} size={17} /></span>
              </div>
              <div className="module-concept-body">
                <div className="module-concept-meta">
                  <span>{template.id}</span>
                  <StatusPill tone={template.tone}>{template.stage}</StatusPill>
                </div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <footer>
                  <span>{template.capability}</span>
                  <button type="button" onClick={() => openTemplate(template)}>
                    Use template <Icon name="arrow" size={13} />
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </div>
        <p className="module-library-note">
          <Icon name="shield" size={14} />
          Concept and external-reference imagery communicates direction only; it does not confirm production geometry, payload, or readiness.
        </p>
      </section>
    </div>
  )
}

export default Modules
