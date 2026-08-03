import { useState } from 'react'
import Icon from './Icon'
import { useRosImage } from '../../hooks/useRosImage'
import cameraFallback from '../../assets/teleop-camera-front-v2.webp'
import rearCameraPreview from '../../assets/teleop-camera-rear-v2.webp'
import deckCameraPreview from '../../assets/teleop-camera-deck-v2.webp'
import './LiveCameraFeed.css'

const VIEWS = {
  front: {
    label: 'Front',
    channel: '01',
    topic: '/camera/color/image_raw/compressed',
    preview: cameraFallback,
  },
  rear: {
    label: 'Rear',
    channel: '02',
    topic: '/camera/rear/image_raw/compressed',
    preview: rearCameraPreview,
  },
  deck: {
    label: 'Deck',
    channel: '03',
    topic: '/camera/deck/image_raw/compressed',
    preview: deckCameraPreview,
  },
}

export default function LiveCameraFeed({
  ros,
  connected,
  robotName = 'AMR-X 01',
  demo = false,
  compact = false,
  immersive = false,
  onOpenControl,
}) {
  const [view, setView] = useState('front')
  const active = VIEWS[view]
  const { frame, receivedAt } = useRosImage(ros, active.topic, connected)
  const isLive = connected && Boolean(frame)
  const source = frame || active.preview

  return (
    <div className={`live-camera-feed ${compact ? 'is-compact' : ''} ${immersive ? 'is-immersive' : ''}`}>
      <header>
        <div>
          <span className="camera-eyebrow"><Icon name="camera" size={15} /> Perception</span>
          <strong>Live camera</strong>
          <small>{robotName} · {active.topic}</small>
        </div>
        <div className="camera-view-tabs">
          {Object.entries(VIEWS).map(([key, item]) => (
            <button
              type="button"
              className={view === key ? 'active' : ''}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              title={`Switch to ${item.label.toLowerCase()} camera`}
              key={key}
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
        className={`camera-viewport ${onOpenControl ? 'is-control-launcher' : ''}`}
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
        <img key={view} src={source} alt={`${active.label} camera view for ${robotName}`} />
        <div className="camera-vignette" />
        <div className="camera-scanline" />
        <span className="camera-corner top-left" />
        <span className="camera-corner top-right" />
        <span className="camera-corner bottom-left" />
        <span className="camera-corner bottom-right" />
        <span className={`camera-state ${isLive ? 'live' : 'demo'}`}>
          <i /> {isLive ? 'LIVE' : demo ? 'DEMO FEED' : 'PREVIEW FEED'}
        </span>
        <span className="camera-meta">CAM-{view.toUpperCase()} · {isLive ? '30 FPS' : 'REFERENCE IMAGE'}</span>
        {onOpenControl && (
          <span className="camera-control-launch">
            <Icon name="teleop" size={15} />
            Open teleoperation
          </span>
        )}
      </div>
      <footer>
        <span><i /> {receivedAt ? 'Frame received now' : 'Representative warehouse view'}</span>
        <span>{isLive ? '1280 × 720' : '1672 × 941'}</span>
      </footer>
    </div>
  )
}
