#!/usr/bin/env python3
"""
warehouse_waypoints.py
Send the robot through an ordered list of waypoints on the warehouse map.

USAGE
-----
1. Launch Nav2 in localization mode with your map + world:
     ros2 launch nav2_bringup tb3_simulation_launch.py \
          world:=$HOME/maps/my_warehouse.sdf \
          map:=$HOME/maps/my_warehouse_map.yaml
2. In RViz, set the initial pose ("2D Pose Estimate") so the robot localizes.
3. In a new terminal:  python3 warehouse_waypoints.py

Get good coordinates by using RViz's "Publish Point" tool while running
`ros2 topic echo /clicked_point` — click a spot, read its x/y, paste below.
"""
import math
import rclpy
from geometry_msgs.msg import PoseStamped
from nav2_simple_commander.robot_navigator import BasicNavigator, TaskResult


def make_pose(nav, x, y, yaw_deg=0.0):
    """Build a map-frame PoseStamped from x, y (metres) and heading (degrees)."""
    p = PoseStamped()
    p.header.frame_id = 'map'
    p.header.stamp = nav.get_clock().now().to_msg()
    p.pose.position.x = float(x)
    p.pose.position.y = float(y)
    yaw = math.radians(yaw_deg)
    p.pose.orientation.z = math.sin(yaw / 2.0)
    p.pose.orientation.w = math.cos(yaw / 2.0)
    return p


def main():
    rclpy.init()
    nav = BasicNavigator()

    # Tell AMCL where the robot starts (match your real start pose on the map).
    nav.setInitialPose(make_pose(nav, 0.0, 0.0, 0.0))

    # Wait until the whole Nav2 stack is up and active.
    nav.waitUntilNav2Active()

    # ===================== EDIT THIS ROUTE =============================
    # x, y in metres (map frame); third value is heading in degrees.
    # Replace with points that exist in free space on YOUR map.
    waypoints = [
        make_pose(nav, -4.0, -3.0,   0.0),   # station A
        make_pose(nav, -4.0,  3.0,  90.0),   # station B
        make_pose(nav,  4.0,  3.0,   0.0),   # station C
        make_pose(nav,  4.0, -3.0, -90.0),   # station D
        make_pose(nav,  0.0,  0.0, 180.0),   # return to start
    ]
    # ===================================================================

    print(f'Following {len(waypoints)} waypoints...')
    nav.followWaypoints(waypoints)

    while not nav.isTaskComplete():
        feedback = nav.getFeedback()
        if feedback:
            print(f'  -> heading to waypoint '
                  f'{feedback.current_waypoint + 1}/{len(waypoints)}')

    result = nav.getResult()
    if result == TaskResult.SUCCEEDED:
        print('Route complete — all waypoints reached.')
    elif result == TaskResult.CANCELED:
        print('Route canceled.')
    else:
        print('Route failed — check that every waypoint is in free space.')

    nav.lifecycleShutdown()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
