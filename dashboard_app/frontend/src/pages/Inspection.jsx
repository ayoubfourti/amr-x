import { useEffect, useState } from 'react'
import Toast from '../components/Toast'
import './Inspection.css'

export default function Inspection() {
  const [inspection, setInspection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchLatestInspection()
  }, [])

  const fetchLatestInspection = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inspections/latest')
      if (!response.ok) throw new Error('No inspection found')
      const data = await response.json()
      setInspection(data)
      
      // Show alert if defect detected
      if (data.defect_type !== 'none') {
        setToast({
          message: `⚠️ DEFECT DETECTED: ${data.defect_type.toUpperCase()} (Confidence: ${(data.confidence * 100).toFixed(0)}%)`,
          type: data.defect_type === 'overheating' ? 'error' : 'warning',
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getDefectColor = (defectType) => {
    switch(defectType) {
      case 'none': return '#10b981'
      case 'crack': return '#f59e0b'
      case 'overheating': return '#ef4444'
      case 'gas_leak': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getDefectLabel = (defectType) => {
    const labels = {
      'none': '✓ No Defect',
      'crack': '⚠ Crack Detected',
      'overheating': '🔥 Overheating',
      'gas_leak': '☠ Gas Leak'
    }
    return labels[defectType] || defectType
  }

  if (loading) return <div className="inspection-loading">Loading inspection data...</div>
  if (error) return <div className="inspection-error">Error: {error}</div>
  if (!inspection) return <div className="inspection-empty">No inspections yet</div>

  return (
    <div className="inspection-container">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <h1>Inspection Results</h1>
      
      <div className="inspection-card">
        <div className="inspection-header">
          <div 
            className="defect-indicator"
            style={{ backgroundColor: getDefectColor(inspection.defect_type) }}
          >
            {getDefectLabel(inspection.defect_type)}
          </div>
          <span className="timestamp">{new Date(inspection.created_at).toLocaleString()}</span>
        </div>

        <div className="inspection-details">
          <div className="detail-row">
            <span className="label">Defect Type:</span>
            <span className="value">{inspection.defect_type}</span>
          </div>
          <div className="detail-row">
            <span className="label">Confidence:</span>
            <span className="value">{(inspection.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="detail-row">
            <span className="label">Sensor Source:</span>
            <span className="value">{inspection.sensor_source}</span>
          </div>
          <div className="detail-row">
            <span className="label">Inspection Type:</span>
            <span className="value">{inspection.inspection_type}</span>
          </div>
          <div className="detail-row full-width">
            <span className="label">Message:</span>
            <span className="value">{inspection.message}</span>
          </div>
        </div>

        <button onClick={fetchLatestInspection} className="refresh-btn">
          Refresh Results
        </button>
      </div>
    </div>
  )
}
