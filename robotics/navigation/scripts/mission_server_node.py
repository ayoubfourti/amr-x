#!/usr/bin/env python3
"""
mission_server_node.py - long-running node that drives AMR-X to goals and
manages named station poses.

Launched alongside Nav2. Stays up and listens, so a dashboard (or anything
else) can command the robot without starting a script per goal.

Interface
---------
Subscribe  /mission/go_to_station   std_msgs/String
             station name, e.g. "pharmacy"
             append ":precise" to park tightly, e.g. "pharmacy:precise"
Subscribe  /mission/go_to_pose      geometry_msgs/PoseStamped
             raw coordinate goal in the map frame
Publish    /mission/status          std_msgs/String
             human-readable progress / result
Service    /mission/cancel          std_srvs/Trigger
             cancel the goal in progress
Service    /mission/save_station    navigation_msgs/SaveStation
             record the CURRENT pose under a name

A station is captured from the robot's live pose, so it is guaranteed to be
reachable and clear of obstacles - you cannot define one inside a wall,
because the robot could not have stood inside a wall.

Examples
--------
    ros2 topic pub --once /mission/go_to_station std_msgs/String "{data: 'pharmacy'}"
    ros2 service call /mission/save_station navigation_msgs/srv/SaveStation "{name: 'pharmacy'}"
    ros2 service call /mission/cancel std_srvs/srv/Trigger
    ros2 topic echo /mission/status

Parameters
----------
    stations_file   (str)   path to stations.yaml (read AND written)
    cost_threshold  (int)   refuse goals on cells at or above this cost [200]

IMPORTANT - stations_file must point somewhere PERSISTENT. Do not point it
into install/, because operator-created stations would be lost on the next
colcon build. Point it at the source config directory (or a data directory
outside the workspace).

NOTE: a goal is checked against the global costmap before being sent. A goal
on a wall, an obstacle, or inside a keepout zone is refused immediately rather
than letting Nav2 spend several seconds in its recovery behaviours.
"""
import math
import os
import tempfile

import yaml
import rclpy
from rclpy.action import ActionClient
from rclpy.node import Node
from rclpy.qos import QoSProfile, QoSDurabilityPolicy, QoSReliabilityPolicy

from nav2_msgs.action import NavigateToPose
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav_msgs.msg import OccupancyGrid
from std_msgs.msg import String
from std_srvs.srv import Trigger
from navigation_msgs.srv import SaveStation


def yaw_from_quat(z, w):
    return 2.0 * math.atan2(z, w)


def quat_from_yaw(yaw):
    return math.sin(yaw / 2.0), math.cos(yaw / 2.0)


class MissionServer(Node):

    def __init__(self):
        super().__init__('mission_server')

        self.declare_parameter('stations_file', '')
        self.declare_parameter('cost_threshold', 200)

        self.stations_file = self.get_parameter('stations_file').value
        self.cost_threshold = int(self.get_parameter('cost_threshold').value)

        # --- state ---
        self.costmap = None
        self.amcl_pose = None
        self.goal_handle = None
        self.current_target = None

        # --- interfaces ---
        self.status_pub = self.create_publisher(String, '/mission/status', 10)

        self.create_subscription(
            String, '/mission/go_to_station', self._on_station_request, 10)
        self.create_subscription(
            PoseStamped, '/mission/go_to_pose', self._on_pose_request, 10)
        self.create_subscription(
            PoseWithCovarianceStamped, '/amcl_pose', self._on_amcl_pose, 10)

        # the costmap is latched (transient local) - match that QoS or we
        # will never receive it
        costmap_qos = QoSProfile(
            depth=1,
            durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,
            reliability=QoSReliabilityPolicy.RELIABLE)
        self.create_subscription(
            OccupancyGrid, '/global_costmap/costmap',
            self._on_costmap, costmap_qos)

        self.create_service(Trigger, '/mission/cancel', self._on_cancel)
        self.create_service(
            SaveStation, '/mission/save_station', self._on_save_station)

        self.nav_client = ActionClient(self, NavigateToPose, 'navigate_to_pose')

        self.get_logger().info(
            f"mission_server ready. stations: {self.stations_file or '(unset)'}")
        self._status("ready")

    # ------------------------------------------------------------------
    # plumbing
    # ------------------------------------------------------------------
    def _status(self, text):
        msg = String()
        msg.data = text
        self.status_pub.publish(msg)
        self.get_logger().info(text)

    def _on_costmap(self, msg):
        self.costmap = msg

    def _on_amcl_pose(self, msg):
        self.amcl_pose = msg.pose.pose

    def _load_stations(self):
        path = self.stations_file
        if not path or not os.path.exists(path):
            return {}
        try:
            with open(path) as f:
                data = yaml.safe_load(f) or {}
            return data.get('stations', {})
        except Exception as e:
            self.get_logger().error(f"could not read {path}: {e}")
            return {}

    def _write_stations(self, stations):
        """Write atomically, so a crash mid-write cannot corrupt the file."""
        path = self.stations_file
        os.makedirs(os.path.dirname(path), exist_ok=True)
        d = os.path.dirname(path)
        fd, tmp = tempfile.mkstemp(dir=d, suffix='.tmp')
        try:
            with os.fdopen(fd, 'w') as f:
                yaml.safe_dump({'stations': stations}, f,
                               default_flow_style=False, sort_keys=True)
            os.replace(tmp, path)
        except Exception:
            if os.path.exists(tmp):
                os.remove(tmp)
            raise

    # ------------------------------------------------------------------
    # goal validity
    # ------------------------------------------------------------------
    def _cell_cost(self, x, y):
        cm = self.costmap
        if cm is None:
            return None
        res = cm.info.resolution
        mx = int((x - cm.info.origin.position.x) / res)
        my = int((y - cm.info.origin.position.y) / res)
        if mx < 0 or my < 0 or mx >= cm.info.width or my >= cm.info.height:
            return -1
        return cm.data[my * cm.info.width + mx]

    def _goal_is_clear(self, x, y):
        cost = self._cell_cost(x, y)
        if cost is None:
            return True, ""          # no costmap yet - let Nav2 decide
        if cost < 0:
            return False, "outside the map"
        if cost >= self.cost_threshold:
            return False, f"cell cost {cost} (wall, obstacle, or keepout zone)"
        return True, ""

    # ------------------------------------------------------------------
    # save station
    # ------------------------------------------------------------------
    def _on_save_station(self, request, response):
        name = request.name.strip()

        if not name:
            response.success = False
            response.message = "station name must not be empty"
            return response

        if not self.stations_file:
            response.success = False
            response.message = ("stations_file parameter is not set - "
                                "nowhere to save to")
            return response

        if self.amcl_pose is None:
            response.success = False
            response.message = ("no pose available on /amcl_pose - "
                                "is the robot localised?")
            return response

        p = self.amcl_pose
        yaw = yaw_from_quat(p.orientation.z, p.orientation.w)

        stations = self._load_stations()
        existed = name in stations
        stations[name] = {
            'x': round(float(p.position.x), 4),
            'y': round(float(p.position.y), 4),
            'yaw': round(float(yaw), 4),
        }

        try:
            self._write_stations(stations)
        except Exception as e:
            response.success = False
            response.message = f"could not write {self.stations_file}: {e}"
            self._status(response.message)
            return response

        verb = "updated" if existed else "saved"
        response.success = True
        response.x = stations[name]['x']
        response.y = stations[name]['y']
        response.yaw = stations[name]['yaw']
        response.message = (f"{verb} station '{name}' at "
                            f"({response.x:.2f}, {response.y:.2f}, "
                            f"{math.degrees(yaw):.0f} deg)")
        self._status(response.message)
        return response

    # ------------------------------------------------------------------
    # request handlers
    # ------------------------------------------------------------------
    def _on_station_request(self, msg):
        raw = msg.data.strip()
        precise = raw.endswith(':precise')
        name = raw.split(':')[0]

        stations = self._load_stations()
        if name not in stations:
            known = ', '.join(sorted(stations)) or '(none)'
            self._status(f"unknown station '{name}'. known: {known}")
            return

        s = stations[name]
        self._send(name, float(s['x']), float(s['y']), float(s['yaw']), precise)

    def _on_pose_request(self, msg):
        x = msg.pose.position.x
        y = msg.pose.position.y
        yaw = yaw_from_quat(msg.pose.orientation.z, msg.pose.orientation.w)
        self._send(None, x, y, yaw, precise=False)

    def _on_cancel(self, request, response):
        if self.goal_handle is None:
            response.success = False
            response.message = "no goal in progress"
            return response
        self.goal_handle.cancel_goal_async()
        self._status("cancel requested")
        response.success = True
        response.message = "cancelling"
        return response

    # ------------------------------------------------------------------
    # sending
    # ------------------------------------------------------------------
    def _send(self, name, x, y, yaw, precise):
        label = f"'{name}'" if name else f"({x:.2f}, {y:.2f})"

        ok, reason = self._goal_is_clear(x, y)
        if not ok:
            self._status(f"refused {label}: {reason}")
            return

        if not self.nav_client.wait_for_server(timeout_sec=5.0):
            self._status("navigate_to_pose action server not available")
            return

        goal = NavigateToPose.Goal()
        goal.pose.header.frame_id = 'map'
        goal.pose.header.stamp = self.get_clock().now().to_msg()
        goal.pose.pose.position.x = x
        goal.pose.pose.position.y = y
        qz, qw = quat_from_yaw(yaw)
        goal.pose.pose.orientation.z = qz
        goal.pose.pose.orientation.w = qw

        self.current_target = (name, x, y, yaw)
        mode = "precise parking" if precise else "transit"
        self._status(f"navigating to {label} [{mode}]")

        future = self.nav_client.send_goal_async(goal)
        future.add_done_callback(self._on_goal_response)

    def _on_goal_response(self, future):
        handle = future.result()
        if not handle.accepted:
            self._status("goal rejected by Nav2")
            self.goal_handle = None
            return
        self.goal_handle = handle
        handle.get_result_async().add_done_callback(self._on_result)

    def _on_result(self, future):
        status = future.result().status
        name, gx, gy, gyaw = self.current_target or (None, 0, 0, 0)
        label = f"'{name}'" if name else "goal"

        if status == 4:                      # STATUS_SUCCEEDED
            err = self._parking_error(gx, gy, gyaw)
            if err:
                self._status(f"arrived at {label} - parking error "
                             f"{err[0]*100:.1f} cm, {err[1]:+.1f} deg")
            else:
                self._status(f"arrived at {label}")
        elif status == 5:                    # STATUS_CANCELED
            self._status(f"{label} canceled")
        else:
            self._status(f"failed to reach {label} (status {status})")

        self.goal_handle = None
        self.current_target = None

    def _parking_error(self, gx, gy, gyaw):
        if self.amcl_pose is None:
            return None
        p = self.amcl_pose
        dist = math.hypot(p.position.x - gx, p.position.y - gy)
        yaw = yaw_from_quat(p.orientation.z, p.orientation.w)
        dyaw = math.degrees(
            math.atan2(math.sin(yaw - gyaw), math.cos(yaw - gyaw)))
        return dist, dyaw


def main():
    rclpy.init()
    node = MissionServer()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()