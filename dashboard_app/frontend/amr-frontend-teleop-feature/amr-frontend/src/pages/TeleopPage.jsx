import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * TeleopPage.jsx — WareBOT style, simplified
 *
 * Sidebar + main content like the original WareBOT screenshot, but with
 * fewer cards and less visual noise: one control card, one status card,
 * camera folded into the status card instead of its own block.
 *
 * Props to wire to your robot service:
 *  - onSendCommand(linear, angular)  -> publish to /cmd_vel
 *  - onEmergencyStop()               -> call /emergency_stop service
 */

const KEY_MAP = {
  z: "forward",
  ArrowUp: "forward",
  s: "backward",
  ArrowDown: "backward",
  q: "left",
  ArrowLeft: "left",
  d: "right",
  ArrowRight: "right",
};

const NAV_ITEMS = ["Dashboard", "Missions", "Map", "Teleoperation", "Alerts", "Users", "Settings"];

export default function TeleopPage({
  unitName = "UNIT WR-09",
  unitOnline = true,
  unitBattery = 78,
  latencyMs = 12,
  currentUser = "test (Admin)",
  activeNav = "Teleoperation",
  onSendCommand = (linear, angular) => console.log("cmd_vel:", linear, angular),
  onEmergencyStop = () => console.log("EMERGENCY STOP"),
}) {
  const [mode, setMode] = useState("keyboard");
  const [maxSpeed, setMaxSpeed] = useState(0.6);
  const [direction, setDirection] = useState("stopped");
  const [angular, setAngular] = useState(0);
  const [knob, setKnob] = useState({ x: 0, y: 0, dragging: false });
  const activeKeys = useRef(new Set());
  const padRef = useRef(null);

  const move = useCallback(
    (dir) => {
      let linear = 0;
      let ang = 0;
      if (dir === "forward") linear = maxSpeed;
      if (dir === "backward") linear = -maxSpeed;
      if (dir === "left") ang = 1.0;
      if (dir === "right") ang = -1.0;
      setDirection(dir);
      setAngular(ang);
      onSendCommand(linear, ang);
    },
    [maxSpeed, onSendCommand]
  );

  const stop = useCallback(() => {
    setDirection("stopped");
    setAngular(0);
    onSendCommand(0, 0);
  }, [onSendCommand]);

  useEffect(() => {
    if (mode !== "keyboard") return;
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        onEmergencyStop();
        stop();
        return;
      }
      const dir = KEY_MAP[e.key];
      if (dir && !activeKeys.current.has(dir)) {
        activeKeys.current.add(dir);
        move(dir);
      }
    };
    const handleKeyUp = (e) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        activeKeys.current.delete(dir);
        if (activeKeys.current.size === 0) stop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [mode, move, stop, onEmergencyStop]);

  const updateJoystick = useCallback(
    (clientX, clientY) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = rect.width / 2;

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }
      setKnob({ x: dx, y: dy, dragging: true });

      const linear = (-dy / radius) * maxSpeed;
      const ang = (-dx / radius) * 1.0;
      setDirection(linear > 0.05 ? "forward" : linear < -0.05 ? "backward" : "stopped");
      setAngular(ang);
      onSendCommand(linear, ang);
    },
    [maxSpeed, onSendCommand]
  );

  const releaseJoystick = useCallback(() => {
    setKnob({ x: 0, y: 0, dragging: false });
    stop();
  }, [stop]);

  const directionLabel = {
    forward: "FORWARD",
    backward: "BACKWARD",
    left: "LEFT",
    right: "RIGHT",
    stopped: "STOPPED",
  }[direction];

  return (
    <div style={st.app}>
   

      {/* MAIN */}
      <main style={st.main}>
        <div style={st.header}>
          <h1 style={st.pageTitle}>Teleoperation</h1>
          <div style={st.headerRight}>
            <span style={st.connectedBadge}>Connected · {latencyMs}ms</span>
            <div style={st.avatar}>T</div>
          </div>
        </div>

        <div style={st.layout}>
          {/* Control card */}
          <div style={st.card}>
            <div style={st.cardHeader}>Manual Control</div>

            <div style={st.modeToggle}>
              {["keyboard", "buttons", "joystick"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{ ...st.modeBtn, ...(mode === m ? st.modeBtnActive : {}) }}
                >
                  {m === "keyboard" ? "Keyboard" : m === "buttons" ? "Buttons" : "Joystick"}
                </button>
              ))}
            </div>

            {mode === "keyboard" && (
              <div style={st.keyHints}>
                <span><Key>Z</Key> Forward</span>
                <span><Key>S</Key> Backward</span>
                <span><Key>Q</Key> Left</span>
                <span><Key>D</Key> Right</span>
                <span><Key wide>Space</Key> Stop</span>
              </div>
            )}

            {mode === "buttons" && (
              <div style={st.dpad}>
                <div />
                <button style={st.dpadBtn} onMouseDown={() => move("forward")} onMouseUp={stop} onMouseLeave={stop}>▲</button>
                <div />
                <button style={st.dpadBtn} onMouseDown={() => move("left")} onMouseUp={stop} onMouseLeave={stop}>◄</button>
                <div style={st.dpadCenter} />
                <button style={st.dpadBtn} onMouseDown={() => move("right")} onMouseUp={stop} onMouseLeave={stop}>►</button>
                <div />
                <button style={st.dpadBtn} onMouseDown={() => move("backward")} onMouseUp={stop} onMouseLeave={stop}>▼</button>
                <div />
              </div>
            )}

            {mode === "joystick" && (
              <div style={st.joystickWrap}>
                <div
                  ref={padRef}
                  style={st.joystickPad}
                  onMouseDown={(e) => updateJoystick(e.clientX, e.clientY)}
                  onMouseMove={(e) => knob.dragging && updateJoystick(e.clientX, e.clientY)}
                  onMouseUp={releaseJoystick}
                  onMouseLeave={releaseJoystick}
                >
                  <div
                    style={{
                      ...st.joystickKnob,
                      transform: `translate(${knob.x}px, ${knob.y}px)`,
                    }}
                  />
                </div>
              </div>
            )}

            <div style={st.speedControl}>
              <div style={st.speedRow}>
                <span>Max speed</span>
                <span style={st.speedVal}>{maxSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range" min="0" max="1.5" step="0.1"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(parseFloat(e.target.value))}
                style={st.slider}
              />
            </div>

            <button
              style={st.emergencyBtn}
              onClick={() => { onEmergencyStop(); stop(); }}
            >
              EMERGENCY STOP
            </button>
          </div>

          {/* Status card */}
          <div style={st.card}>
            <div style={st.cardHeader}>Live Status</div>
            <InfoRow label="State" value={directionLabel} accent="#10b981" />
            <InfoRow label="Linear speed" value={`${maxSpeed.toFixed(1)} m/s`} accent="#38bdf8" />
            <InfoRow label="Angular speed" value={`${angular.toFixed(1)} rad/s`} />
            <InfoRow label="Mode" value={mode.toUpperCase()} accent="#f59e0b" />

            <div style={st.cameraBox}>
              <div style={st.cameraLabel}>Front camera</div>
              <div style={st.cameraFrame}>📷</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value, accent = "#e5e7eb" }) {
  return (
    <div style={st.infoRow}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontFamily: "monospace", color: accent, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function Key({ children, wide }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", minWidth: wide ? 48 : "auto",
      textAlign: "center", background: "#1c1c26", border: "1px solid #2a2a38",
      borderRadius: 4, fontFamily: "monospace", fontSize: 11, color: "#e5e7eb", marginRight: 6,
    }}>
      {children}
    </span>
  );
}

const st = {
  app: { display: "flex", minHeight: "100vh", background: "#0b0b10", color: "#e5e7eb", fontFamily: "'Segoe UI', Inter, sans-serif" },

  sidebar: { width: 220, background: "#0b0b10", borderRight: "1px solid #1c1c26", display: "flex", flexDirection: "column", padding: "20px 16px" },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  brandLogo: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 },
  brandName: { fontSize: 14, fontWeight: 700, color: "#f1f5f9" },
  brandVersion: { fontSize: 11, color: "#6b7280" },

  unitBox: { background: "#141420", border: "1px solid #1c1c26", borderRadius: 10, padding: 12, marginBottom: 20 },
  unitRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  unitName: { fontSize: 12, fontWeight: 600 },
  unitStatus: { fontSize: 10, fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block" },
  unitBar: { height: 3, background: "#1c1c26", borderRadius: 2, overflow: "hidden" },
  unitBarFill: { height: "100%", background: "#f59e0b" },

  nav: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  navItem: { padding: "9px 12px", borderRadius: 8, color: "#9ca3af", fontSize: 13, cursor: "default" },
  navItemActive: { background: "#1c1c26", color: "#f1f5f9", fontWeight: 600 },

  sidebarFooter: { borderTop: "1px solid #1c1c26", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 },
  currentUser: { fontSize: 12, color: "#9ca3af" },
  logoutBtn: { padding: "8px 12px", borderRadius: 8, border: "1px solid #1c1c26", background: "#141420", color: "#e5e7eb", fontSize: 12, cursor: "pointer" },

  main: { flex: 1, padding: "24px 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: 14 },
  connectedBadge: { padding: "6px 12px", borderRadius: 20, border: "1px solid #1c1c26", background: "#141420", fontSize: 12, color: "#9ca3af" },
  avatar: { width: 30, height: 30, borderRadius: "50%", background: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },

  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 800 },

  card: { background: "#111117", border: "1px solid #1c1c26", borderRadius: 14, padding: 20 },
  cardHeader: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "#6b7280", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1c1c26" },

  modeToggle: { display: "flex", gap: 6, background: "#0b0b10", borderRadius: 10, padding: 4, marginBottom: 16, border: "1px solid #1c1c26" },
  modeBtn: { flex: 1, padding: 8, border: "none", borderRadius: 7, background: "transparent", color: "#6b7280", fontSize: 12, cursor: "pointer" },
  modeBtnActive: { background: "#38bdf8", color: "#0b0b10", fontWeight: 700 },

  keyHints: { display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#9ca3af", marginBottom: 16 },

  dpad: { display: "grid", gridTemplateColumns: "52px 52px 52px", gridTemplateRows: "52px 52px 52px", gap: 5, justifyContent: "center", margin: "0 0 16px" },
  dpadBtn: { border: "1px solid #1c1c26", borderRadius: 8, background: "#141420", color: "#e5e7eb", fontSize: 16, cursor: "pointer" },
  dpadCenter: { borderRadius: 8, background: "#0b0b10" },

  joystickWrap: { display: "flex", justifyContent: "center", margin: "4px 0 16px" },
  joystickPad: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    background: "#0b0b10",
    border: "1px solid #1c1c26",
    position: "relative",
    cursor: "grab",
  },
  joystickKnob: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 46,
    height: 46,
    marginTop: -23,
    marginLeft: -23,
    borderRadius: "50%",
    background: "#38bdf8",
    border: "1px solid #0b0b10",
    boxShadow: "0 2px 8px rgba(56,189,248,0.35)",
    cursor: "grab",
  },

  speedControl: { marginBottom: 16 },
  speedRow: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 },
  speedVal: { fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 },
  slider: { width: "100%" },

  emergencyBtn: { width: "100%", padding: 12, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 },

  infoRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1c1c26", fontSize: 13 },

  cameraBox: { marginTop: 16 },
  cameraLabel: { fontSize: 11, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  cameraFrame: { height: 110, borderRadius: 8, background: "#0b0b10", border: "1px solid #1c1c26", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, opacity: 0.4 },
};