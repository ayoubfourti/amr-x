#!/usr/bin/env python3
"""
station.py - named task positions for AMR-X.

A station is a pose the robot has physically stood at, recorded by name.
Because it is captured from a real robot pose, it is guaranteed to be
reachable and clear of obstacles - which is why missions should be expressed
as station names rather than typed coordinates.

Commands
--------
    python3 station.py save <name>      # record the CURRENT pose as <name>
    python3 station.py list             # show all saved stations
    python3 station.py go <name>        # drive to <name>
    python3 station.py go <name> --precise
                                        # drive to <name> and park tightly
                                        # (uses the precise_goal_checker)

Typical use: drive the robot to a task position with teleop or a Nav2 goal,
check the scan still sits on the walls, then:

    python3 station.py save pharmacy

Stations are stored in config/stations.yaml as x, y and yaw (radians) in the
MAP frame. The file is plain YAML and can be hand-edited.

Requires nav2 running and the robot localised.
"""
import os
import sys
import math
import yaml

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav2_simple_commander.robot_navigator import BasicNavigator, TaskResult
from nav2_simple_commander.costmap_2d import PyCostmap2D

DEFAULT_FILE = os.path.expanduser(
    "~/amr-x/robotics/navigation/config/stations.yaml")

# 0 = free, 254 = lethal (wall / obstacle / keepout). Refuse at or above this.
COST_THRESHOLD = 200


# ----------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------
def yaw_from_quat(z, w):
    """Yaw (radians) from a z/w quaternion (rotation about z only)."""
    return 2.0 * math.atan2(z, w)


def quat_from_yaw(yaw):
    return math.sin(yaw / 2.0), math.cos(yaw / 2.0)


def load_stations(path):
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        data = yaml.safe_load(f) or {}
    return data.get('stations', {})


def save_stations(path, stations):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        yaml.safe_dump({'stations': stations}, f, default_flow_style=False,
                       sort_keys=True)


# ----------------------------------------------------------------------
# save
# ----------------------------------------------------------------------
class PoseGrabber(Node):
    """Reads a single /amcl_pose message."""

    def __init__(self):
        super().__init__('station_pose_grabber')
        self.pose = None
        self.create_subscription(
            PoseWithCovarianceStamped, '/amcl_pose', self._cb, 10)

    def _cb(self, msg):
        self.pose = msg.pose.pose


def cmd_save(name, path):
    rclpy.init()
    node = PoseGrabber()
    print("Waiting for /amcl_pose ... (is nav2 running and the robot localised?)")

    # spin until a pose arrives, or give up
    for _ in range(100):
        rclpy.spin_once(node, timeout_sec=0.1)
        if node.pose is not None:
            break

    if node.pose is None:
        print("No pose received. Is AMCL running and initialised?")
        node.destroy_node()
        rclpy.shutdown()
        return

    p = node.pose
    yaw = yaw_from_quat(p.orientation.z, p.orientation.w)

    stations = load_stations(path)
    if name in stations:
        print(f"Overwriting existing station '{name}'.")
    stations[name] = {
        'x': round(float(p.position.x), 4),
        'y': round(float(p.position.y), 4),
        'yaw': round(float(yaw), 4),
    }
    save_stations(path, stations)

    print(f"Saved station '{name}': x={stations[name]['x']}, "
          f"y={stations[name]['y']}, yaw={math.degrees(yaw):.1f} deg")
    print(f"  -> {path}")

    node.destroy_node()
    rclpy.shutdown()


# ----------------------------------------------------------------------
# list
# ----------------------------------------------------------------------
def cmd_list(path):
    stations = load_stations(path)
    if not stations:
        print(f"No stations saved yet ({path})")
        return
    print(f"Stations in {path}:")
    for name in sorted(stations):
        s = stations[name]
        print(f"  {name:<16} x={s['x']:>8.3f}  y={s['y']:>8.3f}  "
              f"yaw={math.degrees(s['yaw']):>7.1f} deg")


# ----------------------------------------------------------------------
# go
# ----------------------------------------------------------------------
def goal_is_clear(nav, x, y):
    """Check the goal cell in the global costmap. Returns (ok, reason)."""
    try:
        costmap = PyCostmap2D(nav.getGlobalCostmap())
    except Exception as e:
        print(f"  (could not read global costmap: {e} - sending anyway)")
        return True, ""

    mx, my = costmap.worldToMap(x, y)
    if (mx < 0 or my < 0 or mx >= costmap.getSizeInCellsX()
            or my >= costmap.getSizeInCellsY()):
        return False, "outside the map"

    cost = costmap.getCostXY(mx, my)
    if cost >= COST_THRESHOLD:
        return False, f"cell cost {cost} (wall, obstacle, or keepout zone)"
    return True, ""


def cmd_go(name, path, precise):
    stations = load_stations(path)
    if name not in stations:
        print(f"No station called '{name}'. Known: {', '.join(sorted(stations)) or '(none)'}")
        return

    s = stations[name]
    x, y, yaw = s['x'], s['y'], s['yaw']

    rclpy.init()
    nav = BasicNavigator()
    # localizer='robot_localization' so the helper does NOT republish a
    # default (0,0,0) initial pose and reset AMCL
    nav.waitUntilNav2Active(localizer='robot_localization')

    ok, reason = goal_is_clear(nav, x, y)
    if not ok:
        print(f"Refusing to drive to '{name}': {reason}.")
        print("  The map may have changed since this station was saved.")
        rclpy.shutdown()
        return

    goal = PoseStamped()
    goal.header.frame_id = 'map'
    goal.header.stamp = nav.get_clock().now().to_msg()
    goal.pose.position.x = x
    goal.pose.position.y = y
    qz, qw = quat_from_yaw(yaw)
    goal.pose.orientation.z = qz
    goal.pose.orientation.w = qw

    checker = 'precise_goal_checker' if precise else 'general_goal_checker'
    mode = "precise parking" if precise else "transit"
    print(f"Going to '{name}' ({x:.2f}, {y:.2f}, {math.degrees(yaw):.0f} deg) "
          f"- {mode}...")

    nav.goToPose(goal, behavior_tree='')  # default BT
    # NOTE: selecting the goal checker per-goal requires publishing to
    # /goal_checker_selector; see the note at the bottom of this file.
    if precise:
        _select_goal_checker(nav, checker)

    while not nav.isTaskComplete():
        fb = nav.getFeedback()
        if fb:
            print(f"  distance remaining: {fb.distance_remaining:.2f} m", end='\r')

    result = nav.getResult()
    print()
    if result == TaskResult.SUCCEEDED:
        print(f"Arrived at '{name}'.")
        _report_error(nav, x, y, yaw)
    elif result == TaskResult.CANCELED:
        print("Goal was canceled.")
    else:
        print("Failed to reach the station (no valid path, or blocked).")

    rclpy.shutdown()


def _select_goal_checker(nav, checker_name):
    """Ask the controller to use a particular goal checker."""
    from std_msgs.msg import String
    pub = nav.create_publisher(String, '/goal_checker_selector', 10)
    msg = String()
    msg.data = checker_name
    for _ in range(3):
        pub.publish(msg)
        rclpy.spin_once(nav, timeout_sec=0.1)


def _report_error(nav, gx, gy, gyaw):
    """Print how far the final pose ended up from the station pose."""
    grabber = PoseGrabber()
    for _ in range(50):
        rclpy.spin_once(grabber, timeout_sec=0.1)
        if grabber.pose is not None:
            break
    if grabber.pose is None:
        grabber.destroy_node()
        return
    p = grabber.pose
    dx = p.position.x - gx
    dy = p.position.y - gy
    dist = math.hypot(dx, dy)
    yaw = yaw_from_quat(p.orientation.z, p.orientation.w)
    dyaw = math.degrees(math.atan2(math.sin(yaw - gyaw), math.cos(yaw - gyaw)))
    print(f"  parking error: {dist*100:.1f} cm, {dyaw:+.1f} deg")
    grabber.destroy_node()


# ----------------------------------------------------------------------
def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    precise = '--precise' in sys.argv

    path = DEFAULT_FILE
    for a in sys.argv:
        if a.startswith('--file='):
            path = os.path.expanduser(a.split('=', 1)[1])

    if not args:
        print(__doc__)
        return

    cmd = args[0]
    if cmd == 'list':
        cmd_list(path)
    elif cmd == 'save' and len(args) > 1:
        cmd_save(args[1], path)
    elif cmd == 'go' and len(args) > 1:
        cmd_go(args[1], path, precise)
    else:
        print(__doc__)


if __name__ == '__main__':
    main()
