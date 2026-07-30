import Icon from './Icon'
import './CommandUI.css'

export function PageShell({ children, className = '' }) {
  return <div className={`command-page ${className}`}>{children}</div>
}

export function PageHeader({ eyebrow, title, description, actions, icon = 'overview' }) {
  return (
    <header className="command-page-header">
      <div className="command-page-title">
        <span className="command-page-icon"><Icon name={icon} size={20} /></span>
        <div>
          {eyebrow && <small>{eyebrow}</small>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="command-page-actions">{actions}</div>}
    </header>
  )
}

export function Surface({ children, className = '', as: Component = 'section', ...props }) {
  return <Component className={`command-surface ${className}`} {...props}>{children}</Component>
}

export function StatGrid({ items }) {
  return (
    <section className="command-stat-grid" style={{ '--stat-columns': Math.min(items.length, 4) }}>
      {items.map((item) => (
        <Surface className={`command-stat tone-${item.tone || 'cyan'}`} as="article" key={item.label}>
          <span className="command-stat-icon"><Icon name={item.icon || 'overview'} size={19} /></span>
          <span><small>{item.label}</small><strong>{item.value}</strong></span>
          {item.detail && <em>{item.detail}</em>}
        </Surface>
      ))}
    </section>
  )
}

export function StatusPill({ children, tone = 'neutral', dot = true }) {
  return <span className={`command-pill tone-${tone}`}>{dot && <i />}{children}</span>
}

export function ProgressMeter({ value = 0, label = true }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <span className="command-progress">
      <span><i style={{ width: `${safeValue}%` }} /></span>
      {label && <strong>{safeValue}%</strong>}
    </span>
  )
}

export function SearchField({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="command-search-field">
      <Icon name="search" size={17} />
      <input value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  )
}

export function IconAction({ icon, label, tone = 'neutral', ...props }) {
  return (
    <button type="button" className={`command-icon-action tone-${tone}`} title={label} aria-label={label} {...props}>
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  )
}
