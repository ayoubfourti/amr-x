import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMissions,
  deleteMission,
  startMission,
  pauseMission,
  resumeMission,
  stopMission,
} from '../api/missions'
import { getRobots } from '../api/robots'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../hooks/useToast'
import ConfirmModal from '../components/ui/ConfirmModal'
import MissionComposer from '../components/MissionComposer'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import {
  PageShell,
  PageHeader,
  Surface,
  StatGrid,
  StatusPill,
  ProgressMeter,
  SearchField,
  IconAction,
} from '../components/ui/CommandUI'
import { useDemo } from '../hooks/useDemo'
import { formatDate } from '../utils/format'
import './Missions.css'

const FILTERS = ['all', 'pending', 'running', 'paused', 'completed', 'failed']

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

const WORKFLOW_OPTIONS = [
  { value: 'all', label: 'All workflows' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'patrol', label: 'Patrol' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'priority', label: 'Priority' },
  { value: 'progress', label: 'Progress' },
  { value: 'name', label: 'Mission name' },
]

const STATUS_TONES = {
  pending: 'neutral',
  running: 'green',
  paused: 'amber',
  completed: 'blue',
  failed: 'red',
}

function Missions() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { demo, DEMO_MISSIONS, DEMO_ROBOTS } = useDemo()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [detailOpenId, setDetailOpenId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const {
    data: missions,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['missions'], queryFn: getMissions, refetchInterval: 5000 })

  const { data: robots } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission deleted', 'warning')
    },
    onError: () => {
      showToast('Failed to delete mission', 'error')
    },
  })

  const startMut = useMutation({
    mutationFn: startMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission started', 'success')
    },
    onError: () => showToast('Failed to start mission', 'error'),
  })

  const pauseMut = useMutation({
    mutationFn: pauseMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission paused', 'warning')
    },
    onError: () => showToast('Failed to pause mission', 'error'),
  })

  const resumeMut = useMutation({
    mutationFn: resumeMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission resumed', 'success')
    },
    onError: () => showToast('Failed to resume mission', 'error'),
  })

  const stopMut = useMutation({
    mutationFn: stopMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission stopped', 'warning')
    },
    onError: () => showToast('Failed to stop mission', 'error'),
  })

  function guardDemo(action) {
    if (demo) {
      showToast('Demo mode — disable to manage real missions', 'warning')
      return
    }
    action()
  }

  function toggleDetail(id) {
    setDetailOpenId((prev) => (prev === id ? null : id))
  }

  const displayMissions = useMemo(() => (demo ? DEMO_MISSIONS : missions || []), [demo, DEMO_MISSIONS, missions])
  const missionList = displayMissions

  const stats = useMemo(() => {
    const list = displayMissions
    return {
      total: list.length,
      pending: list.filter((m) => m.status === 'pending').length,
      running: list.filter((m) => m.status === 'running').length,
      paused: list.filter((m) => m.status === 'paused').length,
      completed: list.filter((m) => m.status === 'completed').length,
      failed: list.filter((m) => m.status === 'failed').length,
    }
  }, [displayMissions])

  const filteredMissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = displayMissions.filter((m) => {
      const matchesFilter = filter === 'all' || m.status === filter
      const matchesSearch =
        !term ||
        m.name?.toLowerCase().includes(term) ||
        m.destination?.toLowerCase().includes(term) ||
        m.start_point?.toLowerCase().includes(term) ||
        String(m.id).includes(term)
      const matchesPriority = priorityFilter === 'all' || m.priority === priorityFilter
      const matchesType = typeFilter === 'all' || m.type === typeFilter
      const matchesUnit = unitFilter === 'all' || String(m.robot_id) === unitFilter
      return matchesFilter && matchesSearch && matchesPriority && matchesType && matchesUnit
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const rank = { critical: 4, high: 3, normal: 2, low: 1 }
        return (rank[b.priority] || 0) - (rank[a.priority] || 0)
      }
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }, [displayMissions, filter, priorityFilter, search, sortBy, typeFilter, unitFilter])

  const detailMission = missionList.find((m) => m.id === detailOpenId)
  const displayRobots = useMemo(
    () => (demo ? DEMO_ROBOTS : robots || []),
    [demo, DEMO_ROBOTS, robots],
  )
  const unitOptions = useMemo(
    () => [
      { value: 'all', label: 'All units' },
      ...displayRobots.map((robot) => ({ value: String(robot.id), label: robot.name })),
    ],
    [displayRobots],
  )
  const robotName = (id) => displayRobots.find((robot) => robot.id === id)?.name || `Unit ${id}`

  const latency = (robots || []).find((r) => r.status === 'online')?.wifi_latency ?? null
  const hasAdvancedFilters = priorityFilter !== 'all' || typeFilter !== 'all' || unitFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setFilter('all')
    setPriorityFilter('all')
    setTypeFilter('all')
    setUnitFilter('all')
    setSortBy('newest')
  }

  const showError = isError && !demo

  return (
    <PageShell className="missions-command-page">
      <PageHeader
        eyebrow="Operations"
        title="Mission control"
        description="Plan, dispatch, and monitor autonomous work"
        icon="mission"
        actions={
          <>
            <StatusPill tone={latency ? 'green' : 'neutral'}>
              {latency ? `Fleet link · ${latency} ms` : 'Fleet link · standby'}
            </StatusPill>
            <button type="button" className="primary-action" onClick={() => setShowForm(true)}>
              <Icon name="bolt" size={16} /> New mission
            </button>
          </>
        }
      />

      <StatGrid items={[
        { label: 'Total missions', value: stats.total, icon: 'mission', detail: 'All workflows', tone: 'cyan' },
        { label: 'Running', value: stats.running, icon: 'route', detail: 'Live now', tone: 'green' },
        { label: 'Queued', value: stats.pending, icon: 'clock', detail: 'Ready to dispatch', tone: 'blue' },
        { label: 'Completed', value: stats.completed, icon: 'shield', detail: 'This period', tone: 'cyan' },
      ]} />

      <MissionComposer
        open={showForm}
        onClose={() => setShowForm(false)}
        robots={displayRobots}
        demo={demo}
      />

      <Surface className="mission-toolbar">
        <div className="mission-toolbar-primary">
          <SearchField
            placeholder="Search mission, route, destination, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mission-filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? 'active' : ''}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span>{f === 'all' ? stats.total : stats[f]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mission-toolbar-secondary">
          <div className="mission-select">
            <span>Priority</span>
            <SelectField
              name="mission-priority-filter"
              value={priorityFilter}
              options={PRIORITY_OPTIONS}
              onChange={(event) => setPriorityFilter(event.target.value)}
              ariaLabel="Filter missions by priority"
            />
          </div>
          <div className="mission-select">
            <span>Workflow</span>
            <SelectField
              name="mission-workflow-filter"
              value={typeFilter}
              options={WORKFLOW_OPTIONS}
              onChange={(event) => setTypeFilter(event.target.value)}
              ariaLabel="Filter missions by workflow"
            />
          </div>
          <div className="mission-select">
            <span>Assigned unit</span>
            <SelectField
              name="mission-unit-filter"
              value={unitFilter}
              options={unitOptions}
              onChange={(event) => setUnitFilter(event.target.value)}
              ariaLabel="Filter missions by assigned unit"
            />
          </div>
          <div className="mission-select">
            <span>Sort</span>
            <SelectField
              name="mission-sort"
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(event) => setSortBy(event.target.value)}
              ariaLabel="Sort missions"
            />
          </div>
          <div className="mission-toolbar-meta">
            <strong>{filteredMissions.length}</strong>
            <span>of {stats.total} missions</span>
          </div>
          {(hasAdvancedFilters || search || filter !== 'all' || sortBy !== 'newest') && (
            <button type="button" className="mission-clear-filters" onClick={clearFilters}>
              <Icon name="close" size={13} /> Reset
            </button>
          )}
        </div>
      </Surface>

      {isLoading && <p>Loading missions…</p>}
      {showError && <p className="error">Failed to load missions: {error.message}</p>}

      {!isLoading && !showError && missionList.length === 0 && (
        <EmptyState
          icon="🎯"
          title="No missions yet"
          subtitle="Create your first mission to get started"
          action={
            <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
              + New Mission
            </button>
          }
        />
      )}

      {!isLoading && !showError && missionList.length > 0 && filteredMissions.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No missions match your search"
          subtitle="Try a different name, destination, or status filter"
        />
      )}

      {!isLoading && !showError && filteredMissions.length > 0 && (
        <Surface className="mission-list">
          <div className="mission-list-head">
            <span>Mission</span><span>Assigned unit</span><span>Status</span>
            <span>Progress</span><span>Priority</span><span>Actions</span>
          </div>
          {filteredMissions.map((mission) => (
            <article className={`mission-record ${mission.status === 'running' ? 'is-active' : ''}`} key={mission.id}>
              <div className="mission-identity">
                <span className="mission-type-icon"><Icon name={mission.type === 'patrol' ? 'map' : 'route'} size={18} /></span>
                <span>
                  <small>MX-{mission.id}</small>
                  <strong>{mission.name}</strong>
                  <em>{mission.start_point || 'Unspecified'} <Icon name="arrow" size={10} /> {mission.destination || 'Unspecified'}</em>
                </span>
              </div>
              <div className="mission-unit">
                <span><Icon name="robot" size={17} /></span>
                <i><strong>{robotName(mission.robot_id)}</strong><small>Unit #{mission.robot_id}</small></i>
              </div>
              <StatusPill tone={STATUS_TONES[mission.status] || 'neutral'}>{mission.status}</StatusPill>
              <ProgressMeter value={mission.progress} />
              <StatusPill tone={mission.priority === 'critical' ? 'red' : mission.priority === 'high' ? 'amber' : 'neutral'} dot={false}>
                {mission.priority}
              </StatusPill>
              <div className="mission-row-actions">
                    {mission.status === 'pending' && (
                      <IconAction
                        icon="play"
                        label={startMut.isPending ? 'Starting…' : 'Start'}
                        tone="green"
                        disabled={startMut.isPending}
                        onClick={() => guardDemo(() => startMut.mutate(mission.id))}
                      />
                    )}
                    {mission.status === 'running' && (
                      <>
                        <IconAction
                          icon="pause"
                          label={pauseMut.isPending ? 'Pausing…' : 'Pause'}
                          tone="amber"
                          disabled={pauseMut.isPending}
                          onClick={() => guardDemo(() => pauseMut.mutate(mission.id))}
                        />
                        <IconAction
                          icon="close"
                          label={stopMut.isPending ? 'Stopping…' : 'Stop'}
                          tone="red"
                          disabled={stopMut.isPending}
                          onClick={() => guardDemo(() => stopMut.mutate(mission.id))}
                        />
                      </>
                    )}
                    {mission.status === 'paused' && (
                      <>
                        <IconAction
                          icon="play"
                          label={resumeMut.isPending ? 'Resuming…' : 'Resume'}
                          tone="green"
                          disabled={resumeMut.isPending}
                          onClick={() => guardDemo(() => resumeMut.mutate(mission.id))}
                        />
                        <IconAction
                          icon="close"
                          label={stopMut.isPending ? 'Stopping…' : 'Stop'}
                          tone="red"
                          disabled={stopMut.isPending}
                          onClick={() => guardDemo(() => stopMut.mutate(mission.id))}
                        />
                      </>
                    )}
                    <IconAction icon="overview" label="Details" onClick={() => toggleDetail(mission.id)} />
                    <IconAction
                      icon="close"
                      label="Delete"
                      tone="red"
                      onClick={() => guardDemo(() => setConfirmDelete(mission))}
                    />
              </div>
            </article>
          ))}
        </Surface>
      )}

      {detailMission && (
        <div className="mission-detail-backdrop" onMouseDown={() => setDetailOpenId(null)}>
          <section className="mission-detail-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header className="mission-detail-header">
              <div className="mission-detail-heading">
                <span><Icon name={detailMission.type === 'patrol' ? 'map' : 'route'} size={21} /></span>
                <div>
                  <small>Mission MX-{detailMission.id}</small>
                  <h2>{detailMission.name}</h2>
                  <p>{detailMission.type} workflow · assigned to {robotName(detailMission.robot_id)}</p>
                </div>
              </div>
              <div className="mission-detail-header-actions">
                <StatusPill tone={STATUS_TONES[detailMission.status] || 'neutral'}>{detailMission.status}</StatusPill>
                <button type="button" className="mission-detail-close" onClick={() => setDetailOpenId(null)} aria-label="Close mission details">
                  <Icon name="close" size={17} />
                </button>
              </div>
            </header>

            <div className="mission-detail-body">
              <main>
                <section className="mission-detail-progress">
                  <div>
                    <span>Execution progress</span>
                    <strong>{detailMission.progress ?? 0}%</strong>
                  </div>
                  <ProgressMeter value={detailMission.progress} label={false} />
                  <p>{detailMission.status === 'completed' ? 'Mission objectives completed successfully.' : 'Live progress reported by the assigned unit.'}</p>
                </section>

                <section className="mission-detail-section">
                  <div className="mission-detail-section-title">
                    <Icon name="route" size={17} />
                    <div><strong>Route plan</strong><small>Movement endpoints and execution target</small></div>
                  </div>
                  <div className="mission-route-card">
                    <span><i /><small>Start point</small><strong>{detailMission.start_point || 'Not specified'}</strong></span>
                    <b><Icon name="arrow" size={17} /></b>
                    <span><i /><small>Destination</small><strong>{detailMission.destination || 'Not specified'}</strong></span>
                  </div>
                </section>

                <section className="mission-detail-section">
                  <div className="mission-detail-section-title">
                    <Icon name="command" size={17} />
                    <div><strong>Execution configuration</strong><small>Robot, payload, and scheduling requirements</small></div>
                  </div>
                  <dl className="mission-detail-grid">
                    <div><dt>Assigned unit</dt><dd>{robotName(detailMission.robot_id)}<small>Unit #{detailMission.robot_id}</small></dd></div>
                    <div><dt>Workflow</dt><dd>{detailMission.type || '—'}</dd></div>
                    <div><dt>Required module</dt><dd>{(detailMission.module_required || 'None').replaceAll('_', ' ')}</dd></div>
                    <div><dt>Priority</dt><dd><StatusPill tone={detailMission.priority === 'critical' ? 'red' : detailMission.priority === 'high' ? 'amber' : 'neutral'} dot={false}>{detailMission.priority}</StatusPill></dd></div>
                    <div><dt>Execution pattern</dt><dd>{detailMission.is_recurring ? 'Repeatable routine' : 'One-time mission'}</dd></div>
                    <div><dt>Created</dt><dd>{formatDate(detailMission.created_at)}</dd></div>
                  </dl>
                </section>
              </main>

              <aside className="mission-detail-activity">
                <span className="mission-detail-kicker">Activity</span>
                <h3>Mission timeline</h3>
                <p>Operational events generated from the current mission state.</p>
                <div className="mission-event-list">
                  <article className="is-complete">
                    <i><Icon name="shield" size={13} /></i>
                    <span><small>{formatDate(detailMission.created_at)}</small><strong>Mission created</strong><em>Configuration validated and queued.</em></span>
                  </article>
                  <article className={detailMission.status !== 'pending' ? 'is-complete' : 'is-pending'}>
                    <i><Icon name="play" size={13} /></i>
                    <span><small>{detailMission.started_at ? formatDate(detailMission.started_at) : 'Awaiting dispatch'}</small><strong>Execution started</strong><em>{detailMission.status === 'pending' ? 'Waiting for operator dispatch.' : `Assigned to ${robotName(detailMission.robot_id)}.`}</em></span>
                  </article>
                  <article className={(detailMission.progress || 0) >= 50 ? 'is-complete' : 'is-pending'}>
                    <i><Icon name="route" size={13} /></i>
                    <span><small>{(detailMission.progress || 0) >= 50 ? `${detailMission.progress}% complete` : 'Upcoming'}</small><strong>Route in progress</strong><em>Travelling toward {detailMission.destination || 'destination'}.</em></span>
                  </article>
                  <article className={detailMission.status === 'completed' ? 'is-complete' : 'is-pending'}>
                    <i><Icon name="mission" size={13} /></i>
                    <span><small>{detailMission.completed_at ? formatDate(detailMission.completed_at) : 'Upcoming'}</small><strong>Mission complete</strong><em>Finalize objectives and return telemetry.</em></span>
                  </article>
                </div>
                <div className="mission-detail-readiness">
                  <i />
                  <span><strong>{detailMission.status === 'running' ? 'Telemetry active' : 'Mission record available'}</strong><small>Fleet state refreshes automatically.</small></span>
                </div>
              </aside>
            </div>

            <footer className="mission-detail-footer">
              <span><Icon name="clock" size={14} /> Last synchronized from fleet operations</span>
              <div>
                {detailMission.status === 'pending' && <IconAction icon="play" label="Start mission" tone="green" onClick={() => guardDemo(() => startMut.mutate(detailMission.id))} />}
                {detailMission.status === 'running' && <IconAction icon="pause" label="Pause mission" tone="amber" onClick={() => guardDemo(() => pauseMut.mutate(detailMission.id))} />}
                {detailMission.status === 'paused' && <IconAction icon="play" label="Resume mission" tone="green" onClick={() => guardDemo(() => resumeMut.mutate(detailMission.id))} />}
                <button type="button" className="mission-detail-done" onClick={() => setDetailOpenId(null)}>Done</button>
              </div>
            </footer>
          </section>
          </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Mission"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete Mission"
        confirmColor="#ef4444"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(confirmDelete.id, {
            onSuccess: () => setConfirmDelete(null),
          })
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </PageShell>
  )
}

export default Missions
