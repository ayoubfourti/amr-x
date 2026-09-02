import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { useAvailableCameras } from '../../hooks/useAvailableCameras'
import { useRosImage } from '../../hooks/useRosImage'
import cameraFallback from '../../assets/teleop-camera-front-v2.webp'
import rearCameraPreview from '../../assets/teleop-camera-rear-v2.webp'
import deckCameraPreview from '../../assets/teleop-camera-deck-v2.webp'
import './LiveCameraFeed.css'

const PREVIEW_VIEWS = [
  {
    key: 'front',
    label: 'Front',
    channel: '01',
    topic: '/camera/image_raw/compressed',
    preview: cameraFallback,
  },
  {
    key: 'rear',
    label: 'Rear',
    channel: '02',
    topic: '/camera/rear/image_raw/compressed',
    preview: rearCameraPreview,
  },
  {
    key: 'deck',
    label: 'Deck',
    channel: '03',
    topic: '/camera/deck/image_raw/compressed',
    preview: deckCameraPreview,
  },
]

function cameraMetadata(topic, index) {
  const normalized = topic.toLowerCase()
  const known = normalized.includes('rear')
    ? PREVIEW_VIEWS[1]
    : normalized.includes('deck') || normalized.includes('top')
      ? PREVIEW_VIEWS[2]
      : PREVIEW_VIEWS[0]
  const cameraName = topic
    .replace(/^\//, '')
    .replace(/\/compressed$/, '')
    .replace(/\/image_raw$/, '')
    .split('/')
    .filter((part) => part !== 'camera')
    .join(' ')

  return {
    ...known,
    key: topic,
    topic,
    label: cameraName
      ? cameraName.replace(/(^|[_-])\w/g, (match) => match.replace(/[_-]/, '').toUpperCase())
      : known.label,
    channel: String(index + 1).padStart(2, '0'),
  }
}

export default function LiveCameraFeed({
  ros,
  connected,
  robotName = 'AMR-X 01',
  robotOnline = false,
  demo = false,
  compact = false,
  immersive = false,
  onOpenControl,
}) {
  const cameraTopics = useAvailableCameras(ros, connected)
  const views = useMemo(
    () => cameraTopics.length
      ? cameraTopics.map(cameraMetadata)
      : PREVIEW_VIEWS,
    [cameraTopics],
  )
  const [view, setView] = useState(PREVIEW_VIEWS[0].key)
  const active = views.find((item) => item.key === view) || views[0]
  const { frame, receivedAt } = useRosImage(ros, active.topic, connected)
  const isLive = connected && robotOnline && Boolean(frame)
  const source = frame || active.preview
  const fallbackReason = !robotOnline
    ? 'ROBOT OFFLINE'
    : !connected
      ? 'ROS OFFLINE'
      : 'NO CAMERA'

  useEffect(() => {
    if (!views.some((item) => item.key === view)) setView(views[0].key)
  }, [view, views])

  return (
    <div className={`live-camera-feed ${isLive ? 'is-live' : 'is-preview'} ${compact ? 'is-compact' : ''} ${immersive ? 'is-immersive' : ''}`}>
      <header>
        <div>
          <span className="camera-eyebrow"><Icon name="camera" size={15} /> Perception</span>
          <strong>Live camera</strong>
          <small>{robotName} · {active.topic}</small>
        </div>
        <div className="camera-view-tabs">
          {views.map((item) => (
            <button
              type="button"
              className={active.key === item.key ? 'active' : ''}
              onClick={() => setView(item.key)}
              aria-pressed={active.key === item.key}
              title={`Switch to ${item.label.toLowerCase()} camera`}
              key={item.key}
            >
              <i />
              <span>{item.label}</span>
              <small>CAM {item.channel}</small>
            </button>
          ))}
        </div>
      </header>
      <div
        data-camera-view={view}
        className={`camera-viewport ${isLive ? 'is-live' : 'is-preview'} ${onOpenControl ? 'is-control-launcher' : ''}`}
        onClick={onOpenControl}
        onKeyDown={(event) => {
          if (!onOpenControl || (event.key !== 'Enter' && event.key !== ' ')) return
          event.preventDefault()
          onOpenControl()
        }}
        role={onOpenControl ? 'button' : undefined}
        tabIndex={onOpenControl ? 0 : undefined}
        aria-label={onOpenControl ? `Open teleoperation controls for ${robotName}` : undefined}
      >
        <img key={active.key} src={source} alt={`${active.label} camera view for ${robotName}`} />
        {!isLive && <div className="camera-vignette" />}
        {!isLive && <div className="camera-scanline" />}
        {!isLive && <span className="camera-corner top-left" />}
        {!isLive && <span className="camera-corner top-right" />}
        {!isLive && <span className="camera-corner bottom-left" />}
        {!isLive && <span className="camera-corner bottom-right" />}
        <span className={`camera-state ${isLive ? 'live' : 'demo'}`}>
          <i /> {isLive ? 'LIVE' : demo ? 'DEMO FEED' : fallbackReason}
        </span>
        <span className="camera-meta">CAM-{active.label.toUpperCase()} · {isLive ? 'LIVE ROS STREAM' : 'REFERENCE IMAGE'}</span>
        {onOpenControl && (
          <span className="camera-control-launch">
            <Icon name="teleop" size={15} />
            Open teleoperation
          </span>
        )}
      </div>
      <footer>
        <span><i /> {receivedAt ? 'Frame received now' : 'Representative warehouse view'}</span>
        <span>{isLive ? 'ROS COMPRESSED STREAM' : 'REFERENCE IMAGE'}</span>
      </footer>
    </div>
  )
}
