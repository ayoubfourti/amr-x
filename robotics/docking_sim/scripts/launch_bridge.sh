#!/bin/bash
# launch_bridge.sh
# Terminal 2 — ROS-Gazebo bridge
# ================================
WS_DIR="$HOME/amr-x"
source "$WS_DIR/install/setup.bash"

echo "Starting ROS-Gazebo bridge..."

ros2 run ros_gz_bridge parameter_bridge \
  /clock@rosgraph_msgs/msg/Clock[ignition.msgs.Clock \
  /cmd_vel@geometry_msgs/msg/Twist]ignition.msgs.Twist \
  /odom@nav_msgs/msg/Odometry[ignition.msgs.Odometry \
  /tf@tf2_msgs/msg/TFMessage[ignition.msgs.Pose_V \
  /scan@sensor_msgs/msg/LaserScan[ignition.msgs.LaserScan \
  /imu@sensor_msgs/msg/Imu[ignition.msgs.IMU
