#!/usr/bin/env python3
"""
station_mission.py — drive the robot through a sequence of named stations.

Reads station names from a stations YAML file and shows three dropdowns
(1st / 2nd / 3rd stop). On "Go", sends each station in order via
/mission/go_to_station and waits for "arrived at <name>" on /mission/status
before sending the next.

Pick which environment's stations to load with --stations:
    python3 station_mission.py --stations warehouse
    python3 station_mission.py --stations hospital
    python3 station_mission.py --stations /full/path/to/some.yaml
    python3 station_mission.py                      # defaults to warehouse

Add --cli for a text prompt instead of the window.
"""

import os
import sys
import threading
import queue

import rclpy
from rclpy.node import Node
from std_msgs.msg import String

import yaml

_HERE = os.path.dirname(os.path.abspath(__file__))
# default file if --stations is not given
STATIONS_YAML = os.path.normpath(
    os.path.join(_HERE, "..", "config", "stations_warehouse.yaml"))


def _resolve_stations_path(argv):
    """--stations accepts a full path/filename, or a bare name like
    'hospital' which maps to config/stations_hospital.yaml."""
    if "--stations" in argv:
        i = argv.index("--stations")
        if i + 1 < len(argv):
            val = argv[i + 1]
            if os.path.sep in val or val.endswith(".yaml"):
                return os.path.abspath(os.path.expanduser(val))
            return os.path.normpath(
                os.path.join(_HERE, "..", "config", f"stations_{val}.yaml"))
    return STATIONS_YAML


def load_station_names(path):
    try:
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        stations = data.get("stations", {}) or {}
        return sorted(stations.keys())
    except FileNotFoundError:
        return []


class MissionClient(Node):
    def __init__(self):
        super().__init__("station_mission_client")
        self.go_pub = self.create_publisher(String, "/mission/go_to_station", 10)
        self.status_sub = self.create_subscription(
            String, "/mission/status", self._on_status, 10
        )
        self._status_q = queue.Queue()
        self._last_status = ""

    def _on_status(self, msg: String):
        self._last_status = msg.data
        self._status_q.put(msg.data)

    def send_station(self, name: str):
        msg = String()
        msg.data = name
        self.go_pub.publish(msg)

    def drain_status(self):
        while not self._status_q.empty():
            try:
                self._status_q.get_nowait()
            except queue.Empty:
                break

    def wait_for_arrival(self, name: str, timeout_s: float = 900.0):
        import time
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            try:
                line = self._status_q.get(timeout=1.0)
            except queue.Empty:
                continue
            low = line.lower()
            if low.startswith("arrived at") and name.lower() in low:
                return True, line
            if low.startswith("refused"):
                return False, line
            if low.startswith("failed to reach"):
                return False, line
            if low.startswith("unknown station"):
                return False, line
            if "canceled" in low:
                return False, line
        return False, f"timed out waiting to arrive at {name}"


def run_mission(client: MissionClient, sequence, report):
    for i, name in enumerate(sequence, start=1):
        if not name:
            continue
        report(f"[{i}/{len(sequence)}] Sending robot to {name} ...")
        client.drain_status()
        client.send_station(name)
        ok, msg = client.wait_for_arrival(name)
        if ok:
            report(f"[{i}/{len(sequence)}] OK {msg}")
        else:
            report(f"[{i}/{len(sequence)}] FAIL {msg} — stopping mission.")
            return False
    report("Mission complete — all stations reached.")
    return True


def run_gui(client: MissionClient, station_names):
    import tkinter as tk
    from tkinter import ttk

    root = tk.Tk()
    root.title("AMR-X — Station Mission")
    root.geometry("420x340")

    frm = ttk.Frame(root, padding=16)
    frm.pack(fill="both", expand=True)

    ttk.Label(frm, text="Choose the order of stations to visit:",
              font=("", 11, "bold")).grid(row=0, column=0, columnspan=2,
                                           sticky="w", pady=(0, 10))

    options = ["(none)"] + station_names
    vars_ = []
    for idx, label in enumerate(["1st stop", "2nd stop", "3rd stop"]):
        ttk.Label(frm, text=label).grid(row=idx + 1, column=0, sticky="w", pady=4)
        v = tk.StringVar(value=options[0])
        cb = ttk.Combobox(frm, textvariable=v, values=options, state="readonly", width=24)
        cb.grid(row=idx + 1, column=1, sticky="ew", pady=4)
        vars_.append(v)

    frm.columnconfigure(1, weight=1)

    status_var = tk.StringVar(value="Ready.")
    ttk.Label(frm, textvariable=status_var, wraplength=380,
              foreground="#333").grid(row=5, column=0, columnspan=2,
                                      sticky="w", pady=(12, 0))

    def report(text):
        root.after(0, lambda: status_var.set(text))
        print(text)

    def on_go():
        seq = [v.get() for v in vars_ if v.get() and v.get() != "(none)"]
        if not seq:
            status_var.set("Pick at least one station.")
            return
        go_btn.config(state="disabled")
        report(f"Starting mission: {' -> '.join(seq)}")

        def worker():
            run_mission(client, seq, report)
            root.after(0, lambda: go_btn.config(state="normal"))

        threading.Thread(target=worker, daemon=True).start()

    go_btn = ttk.Button(frm, text="Go", command=on_go)
    go_btn.grid(row=6, column=0, columnspan=2, pady=16, sticky="ew")

    spin_thread = threading.Thread(target=lambda: rclpy.spin(client), daemon=True)
    spin_thread.start()

    root.mainloop()


def run_cli(client: MissionClient, station_names):
    spin_thread = threading.Thread(target=lambda: rclpy.spin(client), daemon=True)
    spin_thread.start()

    print("\nAvailable stations:")
    for i, n in enumerate(station_names, 1):
        print(f"  {i:2}. {n}")
    print("\nEnter stations to visit in order, separated by spaces.")
    print("Use names or numbers, e.g.:  receiving packing shipping   or   4 3 5\n")

    raw = input("Sequence: ").strip().split()
    seq = []
    for token in raw:
        if token.isdigit():
            idx = int(token) - 1
            if 0 <= idx < len(station_names):
                seq.append(station_names[idx])
        elif token in station_names:
            seq.append(token)
        else:
            print(f"  (skipping unknown: {token})")

    if not seq:
        print("Nothing valid to visit. Exiting.")
        return

    print(f"\nMission: {' -> '.join(seq)}\n")
    run_mission(client, seq, print)


def main():
    cli = "--cli" in sys.argv

    stations_path = _resolve_stations_path(sys.argv)
    station_names = load_station_names(stations_path)
    if not station_names:
        print(f"ERROR: no stations found in {stations_path}")
        sys.exit(1)

    print(f"Loaded {len(station_names)} stations from {stations_path}")

    rclpy.init()
    client = MissionClient()

    try:
        if cli:
            run_cli(client, station_names)
        else:
            try:
                run_gui(client, station_names)
            except Exception as e:
                print(f"(GUI unavailable: {e}) — falling back to terminal mode.\n")
                run_cli(client, station_names)
    finally:
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()