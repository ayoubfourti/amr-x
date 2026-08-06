import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import './SelectField.css'

const MENU_GAP = 6
const OPTION_HEIGHT = 40
const MENU_PADDING = 8

function optionIndex(options, value) {
  const selectedIndex = options.findIndex((option) => String(option.value) === String(value))
  if (selectedIndex >= 0 && !options[selectedIndex].disabled) return selectedIndex
  const firstEnabled = options.findIndex((option) => !option.disabled)
  return Math.max(0, firstEnabled)
}

function nextEnabledIndex(options, start, direction) {
  if (!options.length) return -1
  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (start + direction * offset + options.length) % options.length
    if (!options[index].disabled) return index
  }
  return start
}

export default function SelectField({
  name,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  ariaLabel,
}) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const instanceId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => optionIndex(options, value))
  const [menuStyle, setMenuStyle] = useState(null)
  const selected = options.find((option) => String(option.value) === String(value))
  const listboxId = `${name || 'select'}-${instanceId}-options`

  function close({ restoreFocus = false } = {}) {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  function selectOption(option) {
    if (!option || option.disabled) return
    onChange({ target: { name, value: String(option.value) } })
    close({ restoreFocus: true })
  }

  function openMenu() {
    if (disabled) return
    setActiveIndex(optionIndex(options, value))
    setOpen(true)
  }

  function handleKeyDown(event) {
    if (disabled) return
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openMenu()
      return
    }
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      close({ restoreFocus: true })
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => nextEnabledIndex(options, current, event.key === 'ArrowDown' ? 1 : -1))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectOption(options[activeIndex])
    } else if (event.key === 'Tab') {
      close()
    }
  }

  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const estimatedHeight = Math.min(options.length * OPTION_HEIGHT + MENU_PADDING, 248)
    const roomBelow = window.innerHeight - rect.bottom
    const openAbove = roomBelow < estimatedHeight + MENU_GAP && rect.top > roomBelow
    setMenuStyle({
      left: rect.left,
      top: openAbove
        ? Math.max(MENU_GAP, rect.top - estimatedHeight - MENU_GAP)
        : rect.bottom + MENU_GAP,
      width: rect.width,
      maxHeight: openAbove
        ? Math.max(120, Math.min(248, rect.top - MENU_GAP * 2))
        : Math.max(120, Math.min(248, roomBelow - MENU_GAP * 2)),
    })
  }, [open, options.length])

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) close()
    }
    const handleViewportChange = (event) => {
      if (event?.target === menuRef.current) return
      close()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`amrx-select-trigger ${open ? 'is-open' : ''}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <span className={!selected ? 'is-placeholder' : ''}>{selected?.label || placeholder}</span>
        <Icon name="chevron" size={15} />
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          className="amrx-select-menu"
          style={menuStyle}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value)
            return (
              <button
                type="button"
                id={`${listboxId}-${index}`}
                className={`${isSelected ? 'is-selected' : ''} ${activeIndex === index ? 'is-active' : ''}`}
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                onClick={() => selectOption(option)}
                key={String(option.value)}
              >
                <span>{option.label}</span>
                {isSelected && <Icon name="check" size={15} />}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
