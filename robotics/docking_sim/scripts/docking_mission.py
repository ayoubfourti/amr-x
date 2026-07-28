#!/usr/bin/env python3
"""
docking_mission.py — AMR-X Docking + Undocking
No model removal — uses set_pose to hide/show models
"""

import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
from std_msgs.msg import Bool, String
import subprocess
import time
import threading

ROBOT_START_WORLD_X = 2.0
ROBOT_START_WORLD_Y = -5.4
TRAVEL_DISTANCE     = 7.5
DRIVE_SPEED         = 0.3
WORLD               = "amr_warehouse"
ARMED_URDF          = "/tmp/amr_armed_visual.urdf"
ARM_STATION_X       = 10.0
ARM_STATION_Y       = -5.4
HIDDEN_Z            = -100.0  # sink model underground to hide it


class DockingMission(Node):

    def __init__(self):
        super().__init__("docking_mission")
        self.odom_x  = 0.0
        self.start_x = None

        self.vel_pub    = self.create_publisher(Twist, "/cmd_vel",         10)
        self.attach_pub = self.create_publisher(Bool,  "/sim/dock/attach", 10)
        self.detach_pub = self.create_publisher(Bool,  "/sim/dock/detach", 10)

        self.create_subscription(Odometry, "/odom", self._odom_cb, 10)

    def _odom_cb(self, msg):
        self.odom_x = msg.pose.pose.position.x
        if self.start_x is None:
            self.start_x = self.odom_x

    def traveled(self, from_x):
        return abs(self.odom_x - from_x)

    def world_x(self):
        return round(self.odom_x + ROBOT_START_WORLD_X, 2)

    def drive(self, speed):
        t = Twist(); t.linear.x = speed
        self.vel_pub.publish(t)

    def stop(self):
        self.vel_pub.publish(Twist())

    def set_pose(self, model, x, y, z):
        subprocess.run(
            f'ign service -s /world/{WORLD}/set_pose '
            f'--reqtype ignition.msgs.Pose '
            f'--reptype ignition.msgs.Boolean '
            f'--timeout 2000 '
            f'--req \'name: "{model}" position: {{x: {x}, y: {y}, z: {z}}}\'',
            shell=True, capture_output=True,
        )

    def spawn(self, urdf, name, x, y, z=0.0):
        subprocess.run(
            f'ros2 run ros_gz_sim create '
            f'-world {WORLD} '
            f'-file {urdf} '
            f'-name {name} '
            f'-x {x} -y {y} -z {z}',
            shell=True,
        )


def main():
    rclpy.init()
    node = DockingMission()
    spin = threading.Thread(target=rclpy.spin, args=(node,), daemon=True)
    spin.start()
    time.sleep(2.0)

    # ── DOCKING ──────────────────────────────────────────────────────────
    print("\n" + "="*50)
    print("  AMR-X DOCKING MISSION")
    print("="*50)

    print("\n[STEP 1] Driving to arm station...")
    start_x = node.odom_x
    while node.traveled(start_x) < TRAVEL_DISTANCE:
        node.drive(DRIVE_SPEED)
        time.sleep(0.1)
        print(f"  traveled={node.traveled(start_x):.2f}m", end="\r")

    node.stop()
    time.sleep(0.5)
    dock_world_x = node.world_x()
    print(f"\n  ✓ Stopped at world x={dock_world_x}")

    print("\n[STEP 2] Attaching arm...")
    msg = Bool(); msg.data = True
    node.attach_pub.publish(msg)
    time.sleep(0.5)
    print("  ✓ ATTACHED")

    print("\n[STEP 3] Hiding arm station underground...")
    node.set_pose("arm_station", ARM_STATION_X, ARM_STATION_Y, HIDDEN_Z)
    time.sleep(0.5)
    print("  ✓ Arm station hidden")

    print("\n[STEP 4] Spawning robot with arm on top...")
    node.spawn(ARMED_URDF, "robot_armed", dock_world_x, ARM_STATION_Y)
    time.sleep(1.0)
    print("  ✓ Robot + arm spawned")

    print("\n" + "="*50)
    print("  ✓ DOCKING COMPLETE!")
    print("  Press ENTER to undock...")
    print("="*50)
    input()

    # ── UNDOCKING ─────────────────────────────────────────────────────────
    print("\n" + "="*50)
    print("  AMR-X UNDOCKING")
    print("="*50)

    print("\n[STEP 5] Detaching arm...")
    msg = Bool(); msg.data = True
    node.detach_pub.publish(msg)
    time.sleep(0.5)
    print("  ✓ DETACHED")

    print("\n[STEP 6] Hiding armed robot underground...")
    node.set_pose("robot_armed", dock_world_x, ARM_STATION_Y, HIDDEN_Z)
    time.sleep(0.5)
    print("  ✓ Armed robot hidden")

    print("\n[STEP 7] Returning arm to dock station...")
    node.set_pose("arm_station", ARM_STATION_X, ARM_STATION_Y, 0.0)
    time.sleep(0.5)
    print("  ✓ Arm back at dock station")

    print("\n" + "="*50)
    print("  ✓ UNDOCKING COMPLETE!")
    print("="*50 + "\n")

    rclpy.shutdown()
    spin.join()


if __name__ == "__main__":
    main()
