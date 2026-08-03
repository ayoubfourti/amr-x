import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const MAP_ANNOTATION_STORAGE_KEY = 'amrx-map-annotations-v1'
const MAP_ANNOTATION_EVENT = 'amrx-map-annotations-change'

export const MAP_LABEL_TYPES = {
  waypoint: { label: 'Waypoint', color: '#62dced' },
  safety: { label: 'Safety', color: '#ffb553' },
  delivery: { label: 'Delivery', color: '#5ee0b5' },
  charging: { label: 'Charging', color: '#8f8cff' },
  note: { label: 'Note', color: '#a7bdc6' },
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(MAP_ANNOTATION_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(MAP_ANNOTATION_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(MAP_ANNOTATION_EVENT, { detail: store }))
}

function normalizedBounds(bounds = {}) {
  const width = Number(bounds.width) || 1
  const height = Number(bounds.height) || 1
  return {
    width,
    height,
    minX: Number.isFinite(bounds.minX) ? bounds.minX : -width / 2,
    maxY: Number.isFinite(bounds.maxY) ? bounds.maxY : height / 2,
  }
}

export function percentToWorld(x, y, bounds) {
  const value = normalizedBounds(bounds)
  return {
    worldX: value.minX + (Number(x) / 100) * value.width,
    worldY: value.maxY - (Number(y) / 100) * value.height,
  }
}

export function annotationWorldPosition(annotation, bounds) {
  if (Number.isFinite(annotation.worldX) && Number.isFinite(annotation.worldY)) {
    return { worldX: annotation.worldX, worldY: annotation.worldY }
  }
  return percentToWorld(annotation.x ?? 50, annotation.y ?? 50, bounds)
}

export function useMapAnnotations(worldId) {
  const [store, setStore] = useState(readStore)
  const storeRef = useRef(store)

  useEffect(() => {
    const receiveStore = (next) => {
      storeRef.current = next
      setStore(next)
    }
    const receiveLocalChange = (event) => receiveStore(event.detail || readStore())
    const receiveStorageChange = (event) => {
      if (event.key === MAP_ANNOTATION_STORAGE_KEY) receiveStore(readStore())
    }
    window.addEventListener(MAP_ANNOTATION_EVENT, receiveLocalChange)
    window.addEventListener('storage', receiveStorageChange)
    return () => {
      window.removeEventListener(MAP_ANNOTATION_EVENT, receiveLocalChange)
      window.removeEventListener('storage', receiveStorageChange)
    }
  }, [])

  const annotations = useMemo(() => store[worldId] || [], [store, worldId])

  const updateAnnotations = useCallback((updater) => {
    const current = storeRef.current
    const next = {
      ...current,
      [worldId]: updater(current[worldId] || []),
    }
    storeRef.current = next
    setStore(next)
    writeStore(next)
  }, [worldId])

  const resetAnnotations = useCallback(() => {
    const next = { ...storeRef.current }
    delete next[worldId]
    storeRef.current = next
    setStore(next)
    writeStore(next)
  }, [worldId])

  return { annotations, updateAnnotations, resetAnnotations }
}
