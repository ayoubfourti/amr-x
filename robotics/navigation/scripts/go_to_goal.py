#!/usr/bin/env python3
"""
go_to_goal.py - send the robot to an (x, y[, yaw]) coordinate in the map frame.

Usage:
    python3 go_to_goal.py X Y [YAW_DEGREES]

Examples:
    python3 go_to_goal.py 2.0 8.0            # go to (2,8), any final heading
    python3 go_to_goal.py 2.0 8.0 90         # go to (2,8), face 90 degrees

Requires nav2 running and the robot already localised (scan sitting on the
walls in RViz).

Before sending, the goal is checked against the global costmap. A goal on a
wall, on an obstacle, or inside a keepout zone is rejected immediately - this
skips Nav2's recovery behaviours (spin / backup / wait), which would otherwise
run for several seconds before reporting failure. Those recoveries are still
useful for genuinely ambiguous goals, so they are left enabled in Nav2 itself.

NOTE - two things this script deliberately does NOT do:
  * It does not call waitUntilNav2Active() with the default localizer. With
    localizer='amcl' the helper PUBLISHES a default initial pose (0,0,0) to
    /initialpose, which resets your localisation every run. Passing
    'robot_localization' skips that and only waits for bt_navigator.
  * It does not call lifecycleShutdown(). That tears down the whole Nav2
    stack, so the next goal (script or RViz) would have no action server.
"""
import sys
import math
import rclpy
from nav2_simple_commander.robot_navigator import BasicNavigator, TaskResult
from nav2_simple_commander.costmap_2d import PyCostmap2D
from geometry_msgs.msg import PoseStamped

# costmap cost values: 0 = free, 254 = lethal (obstacle / keepout).
# 253 = inscribed (robot centre here means a collision). Anything at or above
# this threshold is refused.
COST_THRESHOLD = 200


def goal_is_reachable(nav, x, y):
    """Return (ok, reason). Checks the goal cell in the global costmap."""
    try:
        costmap = PyCostmap2D(nav.getGlobalCostmap())
    except Exception as e:
        # if the costmap isn't available, don't block the goal - let Nav2 decide
        print(f"  (could not read global costmap: {e} - sending anyway)")
        return True, ""

    mx, my = costmap.worldToMap(x, y)

    # worldToMap does not range check: a goal outside the map gives indices
    # outside the grid
    if mx < 0 or my < 0 or mx >= costmap.getSizeInCellsX() or my >= costmap.getSizeInCellsY():
        return False, "goal is outside the map"

    cost = costmap.getCostXY(mx, my)
    if cost >= COST_THRESHOLD:
        return False, f"goal cell cost is {cost} (wall, obstacle, or keepout zone)"
    return True, ""


def main():
    if len(sys.argv) < 3:
        print("usage: python3 go_to_goal.py X Y [YAW_DEGREES]")
        return

    x = float(sys.argv[1])
    y = float(sys.argv[2])
    yaw_deg = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    yaw = math.radians(yaw_deg)

    rclpy.init()
    nav = BasicNavigator()

    # wait for bt_navigator only - do NOT let the helper republish an
    # initial pose, which would reset AMCL to (0,0,0)
    nav.waitUntilNav2Active(localizer='robot_localization')

    ok, reason = goal_is_reachable(nav, x, y)
    if not ok:
        print(f"Refusing goal ({x:.2f}, {y:.2f}): {reason}.")
        rclpy.shutdown()
        return

    goal = PoseStamped()
    goal.header.frame_id = 'map'
    goal.header.stamp = nav.get_clock().now().to_msg()
    goal.pose.position.x = x
    goal.pose.position.y = y
    goal.pose.orientation.z = math.sin(yaw / 2.0)
    goal.pose.orientation.w = math.cos(yaw / 2.0)

    print(f"Going to ({x:.2f}, {y:.2f}) facing {yaw_deg:.0f} deg...")
    nav.goToPose(goal)

    while not nav.isTaskComplete():
        fb = nav.getFeedback()
        if fb:
            print(f"  distance remaining: {fb.distance_remaining:.2f} m", end='\r')

    result = nav.getResult()
    print()
    if result == TaskResult.SUCCEEDED:
        print("Arrived.")
    elif result == TaskResult.CANCELED:
        print("Goal was canceled.")
    else:
        print("Failed to reach the goal (no valid path, or blocked on the way).")

    rclpy.shutdown()


if __name__ == '__main__':
    main()