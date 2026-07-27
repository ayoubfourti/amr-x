export default function DockingPanel({ docking, progress, result, onDock, onUndock }) {
  return (
    <div style={{ background: "#111", padding: 16, borderRadius: 8, color: "#eee" }}>
      <h3>Module Docking</h3>
      <p>Status: {docking.state}</p>
      <p>Mechanical lock: {String(docking.mechanicalLock)}</p>
      <p>Module detected: {String(docking.moduleDetected)}</p>

      {progress && (
        <p>
          {progress.stage} — {Math.round(progress.progress * 100)}%
        </p>
      )}
      {result && (
        <p style={{ color: result.success ? "#4ade80" : "#f87171" }}>
          {result.message}
        </p>
      )}

      <button onClick={onDock} disabled={docking.state !== "undocked"}>
        Dock
      </button>
      <button onClick={onUndock} disabled={docking.state !== "docked"}>
        Undock
      </button>
    </div>
  );
}