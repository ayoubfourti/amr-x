import { useContext } from 'react'
import { RosContext } from '../context/internalContexts'

export function useRosConnection() {
  const context = useContext(RosContext)
  if (!context) throw new Error('useRosConnection must be used within a RosProvider')
  return context
}
