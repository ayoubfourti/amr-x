import { useState } from 'react'
import { SidebarContext } from './internalContexts'
const STORAGE_KEY = 'warebot-sidebar'

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'closed' ? 'closed' : 'open'
  } catch {
    return 'open'
  }
}

export function SidebarProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference)

  function setPreference(next) {
    const normalized = next === 'closed' ? 'closed' : 'open'
    try {
      localStorage.setItem(STORAGE_KEY, normalized)
    } catch {
      // Keep the in-memory preference when browser storage is unavailable.
    }
    setPreferenceState(normalized)
  }

  function togglePreference() {
    setPreferenceState((current) => {
      const next = current === 'closed' ? 'open' : 'closed'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Keep the in-memory preference when browser storage is unavailable.
      }
      return next
    })
  }

  return (
    <SidebarContext.Provider
      value={{
        preference,
        collapsed: preference === 'closed',
        setPreference,
        togglePreference,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
