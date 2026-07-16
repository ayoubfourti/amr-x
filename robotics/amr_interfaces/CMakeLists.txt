cmake_minimum_required(VERSION 3.8)
project(amr_interfaces)

find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)

rosidl_generate_interfaces(${PROJECT_NAME}
  # ---- messages ----
  "msg/ModuleStatus.msg"
  "msg/RobotState.msg"
  "msg/DockingStatus.msg"
  "msg/MissionStep.msg"
  "msg/MissionState.msg"
  "msg/SafetyState.msg"
  "msg/MotorStatus.msg"
  "msg/FaultCode.msg"
  "msg/InspectionResult.msg"
  # ---- services ----
  "srv/SetRobotMode.srv"
  "srv/ConfirmModuleState.srv"
  "srv/SetSpeedLimit.srv"
  "srv/ResetFault.srv"
  "srv/ValidateMission.srv"
  # ---- actions ----
  "action/DockModule.action"
  "action/UndockModule.action"
  "action/ReturnHome.action"
  "action/ExecuteMission.action"
  "action/RunInspection.action"
  DEPENDENCIES std_msgs geometry_msgs
)

ament_export_dependencies(rosidl_default_runtime)
ament_package()
