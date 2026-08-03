import { useContext } from 'react'
import { SidebarContext } from '../context/internalContexts'

export function useSidebarPreference() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebarPreference must be used within a SidebarProvider')
  return context
}
