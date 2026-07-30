import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMission } from '../api/missions'
import { useToast } from '../hooks/useToast'
import Icon from './ui/Icon'
import SelectField from './ui/SelectField'
import './MissionComposer.css'

const TEMPLATES = [
  {
    id: 'delivery',
    label: 'Material delivery',
    description: 'Move payload between two operating zones',
    icon: 'route',
    values: {
      name: 'Material delivery',
      type: 'delivery',
      priority: 'normal',
      module_required: 'delivery_box',
      is_recurring: false,
    },
  },
  {
    id: 'inspection',
    label: 'Safety inspection',
    description: 'Capture and verify conditions at a location',
    icon: 'shield',
    values: {
      name: 'Safety inspection',
      type: 'inspection',
      priority: 'high',
      module_required: 'camera',
      is_recurring: false,
    },
  },
  {
    id: 'patrol',
    label: 'Routine patrol',
    description: 'Create a repeatable monitoring route',
    icon: 'map',
    values: {
      name: 'Routine patrol',
      type: 'patrol',
      priority: 'normal',
      module_required: 'camera',
      is_recurring: true,
    },
  },
  {
    id: 'pickup',
    label: 'Pickup request',
    description: 'Collect an item and return it to a destination',
    icon: 'module',
    values: {
      name: 'Pickup request',
      type: 'pickup',
      priority: 'normal',
      module_required: 'arm',
      is_recurring: false,
    },
  },
]

const EMPTY_FORM = {
  robot_id: '',
  name: '',
  type: 'delivery',
  start_point: '',
  destination: '',
  priority: 'normal',
  module_required: 'none',
  is_recurring: false,
}

export default function MissionComposer({ open, onClose, robots = [], demo = false }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [templateId, setTemplateId] = useState('delivery')
  const onlineRobots = useMemo(
    () => robots.filter((robot) => robot.status === 'online'),
    [robots],
  )
  const initialRobotId = onlineRobots[0]?.id ?? ''
  const selectedRobot = robots.find((robot) => String(robot.id) === String(form.robot_id))
  const selectedTemplate = TEMPLATES.find((template) => template.id === templateId)

  const mutation = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission created and added to the queue', 'success')
      onClose()
    },
    onError: () => showToast('Failed to create mission', 'error'),
  })

  useEffect(() => {
    if (!open) return
    setTemplateId('delivery')
    setForm({ ...EMPTY_FORM, ...TEMPLATES[0].values, robot_id: initialRobotId })
  }, [open, initialRobotId])

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('mission-composer-open')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('mission-composer-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onClose])

  if (!open) return null

  function selectTemplate(template) {
    setTemplateId(template.id)
    setForm((current) => ({
      ...current,
      ...template.values,
    }))
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (demo) {
      showToast('Demo mode — disable it to create a real mission', 'warning')
      return
    }
    mutation.mutate({
      ...form,
      robot_id: Number(form.robot_id),
      is_recurring: Boolean(form.is_recurring),
    })
  }

  const errorMessage = mutation.error?.response?.data?.detail || mutation.error?.message

  return createPortal(
    <div className="mission-composer-backdrop" onMouseDown={onClose}>
      <section
        className="mission-composer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-composer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mission-composer-header">
          <div className="mission-composer-heading">
            <span className="mission-composer-mark"><Icon name="mission" size={22} /></span>
            <div>
              <small>Mission composer</small>
              <h2 id="mission-composer-title">Create a new mission</h2>
              <p>Configure the task, route, robot, and execution pattern.</p>
            </div>
          </div>
          <button type="button" className="mission-composer-close" onClick={onClose} aria-label="Close mission composer">
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="mission-composer-form" onSubmit={submit}>
          <div className="mission-composer-content">
            <main>
              <section className="composer-section">
                <div className="composer-section-title">
                  <span>01</span>
                  <div><strong>Start with a template</strong><small>Choose a workflow or customize every field.</small></div>
                </div>
                <div className="mission-template-grid">
                  {TEMPLATES.map((template) => (
                    <button
                      type="button"
                      className={template.id === templateId ? 'active' : ''}
                      onClick={() => selectTemplate(template)}
                      key={template.id}
                    >
                      <span><Icon name={template.icon} size={18} /></span>
                      <strong>{template.label}</strong>
                      <small>{template.description}</small>
                      <i>{template.id === templateId ? 'Selected' : 'Use template'}</i>
                    </button>
                  ))}
                </div>
              </section>

              <section className="composer-section">
                <div className="composer-section-title">
                  <span>02</span>
                  <div><strong>Mission details</strong><small>Define ownership and operating intent.</small></div>
                </div>
                <div className="composer-fields">
                  <label className="composer-field composer-field-wide">
                    <span>Mission name</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateField}
                      placeholder="e.g. Morning dock replenishment"
                      required
                    />
                  </label>
                  <label className="composer-field">
                    <span>Assigned robot</span>
                    <SelectField
                      name="robot_id"
                      value={form.robot_id}
                      onChange={updateField}
                      required
                      ariaLabel="Assigned robot"
                      placeholder="Select an online robot"
                      options={[
                        { value: '', label: 'Select an online robot', disabled: true },
                        ...onlineRobots.map((robot) => ({
                          value: robot.id,
                          label: `${robot.name} · ${robot.battery ?? '—'}% battery`,
                        })),
                      ]}
                    />
                    {!onlineRobots.length && <small className="composer-field-warning">No online robots available</small>}
                  </label>
                  <label className="composer-field">
                    <span>Mission category</span>
                    <SelectField
                      name="type"
                      value={form.type}
                      onChange={updateField}
                      ariaLabel="Mission category"
                      options={[
                        { value: 'delivery', label: 'Delivery' },
                        { value: 'pickup', label: 'Pickup' },
                        { value: 'inspection', label: 'Inspection' },
                        { value: 'patrol', label: 'Patrol' },
                      ]}
                    />
                  </label>
                  <label className="composer-field">
                    <span>Priority</span>
                    <SelectField
                      name="priority"
                      value={form.priority}
                      onChange={updateField}
                      ariaLabel="Mission priority"
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'high', label: 'High' },
                        { value: 'critical', label: 'Critical' },
                      ]}
                    />
                  </label>
                  <label className="composer-field">
                    <span>Required module</span>
                    <SelectField
                      name="module_required"
                      value={form.module_required}
                      onChange={updateField}
                      ariaLabel="Required module"
                      options={[
                        { value: 'none', label: 'No module required' },
                        { value: 'delivery_box', label: 'Delivery box' },
                        { value: 'arm', label: 'Robotic arm' },
                        { value: 'camera', label: 'Inspection camera' },
                        { value: 'thermal', label: 'Thermal sensor' },
                      ]}
                    />
                  </label>
                </div>
              </section>

              <section className="composer-section">
                <div className="composer-section-title">
                  <span>03</span>
                  <div><strong>Route and execution</strong><small>Set the movement endpoints and mission pattern.</small></div>
                </div>
                <div className="composer-fields">
                  <label className="composer-field">
                    <span>Start point</span>
                    <input
                      name="start_point"
                      value={form.start_point}
                      onChange={updateField}
                      placeholder="Dock 02"
                    />
                  </label>
                  <label className="composer-field">
                    <span>Destination</span>
                    <input
                      name="destination"
                      value={form.destination}
                      onChange={updateField}
                      placeholder="Zone B · Shelf 03"
                      required
                    />
                  </label>
                </div>
                <div className="execution-options" role="group" aria-label="Mission execution pattern">
                  <button
                    type="button"
                    className={!form.is_recurring ? 'active' : ''}
                    onClick={() => setForm((current) => ({ ...current, is_recurring: false }))}
                  >
                    <Icon name="bolt" size={17} />
                    <span><strong>One-time mission</strong><small>Run once and complete</small></span>
                  </button>
                  <button
                    type="button"
                    className={form.is_recurring ? 'active' : ''}
                    onClick={() => setForm((current) => ({ ...current, is_recurring: true }))}
                  >
                    <Icon name="clock" size={17} />
                    <span><strong>Repeatable mission</strong><small>Save as a reusable routine</small></span>
                  </button>
                </div>
              </section>
            </main>

            <aside className="mission-composer-summary">
              <span className="summary-kicker">Mission preview</span>
              <div className="summary-template-icon"><Icon name={selectedTemplate?.icon || 'mission'} size={25} /></div>
              <h3>{form.name || 'Untitled mission'}</h3>
              <p>{selectedTemplate?.description}</p>

              <div className="summary-route">
                <span><i /><small>Start</small><strong>{form.start_point || 'Not set'}</strong></span>
                <b />
                <span><i /><small>Destination</small><strong>{form.destination || 'Not set'}</strong></span>
              </div>

              <dl>
                <div><dt>Robot</dt><dd>{selectedRobot?.name || 'Not assigned'}</dd></div>
                <div><dt>Category</dt><dd>{form.type}</dd></div>
                <div><dt>Priority</dt><dd className={`priority-${form.priority}`}>{form.priority}</dd></div>
                <div><dt>Module</dt><dd>{form.module_required.replaceAll('_', ' ')}</dd></div>
                <div><dt>Pattern</dt><dd>{form.is_recurring ? 'Repeatable' : 'One time'}</dd></div>
              </dl>

              <div className="summary-readiness">
                <i />
                <span><strong>Ready for validation</strong><small>The mission enters the dispatch queue after creation.</small></span>
              </div>
            </aside>
          </div>

          {errorMessage && <p className="mission-composer-error">{errorMessage}</p>}

          <footer className="mission-composer-footer">
            <span><Icon name="shield" size={15} /> Safety rules are validated before dispatch.</span>
            <div>
              <button type="button" className="composer-cancel" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="composer-submit"
                disabled={mutation.isPending || !onlineRobots.length}
              >
                <Icon name="bolt" size={16} />
                {mutation.isPending ? 'Creating mission…' : 'Create mission'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  )
}
