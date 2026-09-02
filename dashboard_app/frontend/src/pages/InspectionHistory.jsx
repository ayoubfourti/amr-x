import { useEffect, useState } from 'react'
import './InspectionHistory.css'

export default function InspectionHistory() {
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAllInspections()
  }, [])

  const fetchAllInspections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inspections/')
      if (!response.ok) throw new Error('Failed to fetch inspections')
      const data = await response.json()
      setInspections(data)
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

  const getDefectIcon = (defectType) => {
    switch(defectType) {
      case 'none': return '✓'
      case 'crack': return '⚠'
      case 'overheating': return '🔥'
      case 'gas_leak': return '☠'
      default: return '•'
    }
  }

  if (loading) return <div className="history-loading">Loading inspection history...</div>
  if (error) return <div className="history-error">Error: {error}</div>
  if (inspections.length === 0) return <div className="history-empty">No inspections yet</div>

  return (
    <div className="history-container">
      <h1>Inspection History</h1>
      <p className="subtitle">Total inspections: {inspections.length}</p>

      <div className="history-table">
        <div className="table-header">
          <div className="col-status">Status</div>
          <div className="col-defect">Defect Type</div>
          <div className="col-confidence">Confidence</div>
          <div className="col-source">Sensor</div>
          <div className="col-time">Timestamp</div>
        </div>

        <div className="table-body">
          {inspections.map((inspection) => (
            <div key={inspection.id} className="table-row">
              <div className="col-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getDefectColor(inspection.defect_type) }}
                >
                  {getDefectIcon(inspection.defect_type)}
                </span>
              </div>
              <div className="col-defect">{inspection.defect_type}</div>
              <div className="col-confidence">
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${inspection.confidence * 100}%` }}
                  />
                  <span className="confidence-text">{(inspection.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="col-source">{inspection.sensor_source}</div>
              <div className="col-time">{new Date(inspection.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={fetchAllInspections} className="refresh-btn">
        Refresh History
      </button>
    </div>
  )
}
