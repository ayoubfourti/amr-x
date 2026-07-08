# arm_moveit_config

MoveIt 2 configuration for the dual-arm module.

Note: the contents of this package are normally *generated* by the MoveIt Setup
Assistant from `arm_description`, not hand-written:

    ros2 launch moveit_setup_assistant setup_assistant.launch.py

Load the arm URDF, define planning groups (left, right, both_arms), build the
self-collision matrix, and export here. Commit the generated files.
