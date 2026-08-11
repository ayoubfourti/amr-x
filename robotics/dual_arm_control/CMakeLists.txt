cmake_minimum_required(VERSION 3.8)
project(dual_arm_control)

find_package(ament_cmake REQUIRED)
find_package(rclpy REQUIRED)
find_package(control_msgs REQUIRED)
find_package(trajectory_msgs REQUIRED)
find_package(builtin_interfaces REQUIRED)

install(DIRECTORY config launch
  DESTINATION share/${PROJECT_NAME}
)

install(PROGRAMS
  scripts/dual_arm_trajectory_node.py
  scripts/pick_place_demo.py
  DESTINATION lib/${PROJECT_NAME}
)

ament_package()
