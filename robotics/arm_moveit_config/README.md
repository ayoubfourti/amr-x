# arm_moveit_config

MoveIt 2 configuration for the arm module (6-DOF arm + adaptive gripper),
generated with the MoveIt Setup Assistant from `arm_description`.

## Contents

- `config/arm_module.srdf` - planning groups (`arm`, `gripper`), end effector
  (`gripper_ee`), virtual joint (`world` -> `base_link`), self-collision matrix.
- `config/kinematics.yaml` - IK solver (KDL) per planning group.
- `config/joint_limits.yaml` - per-joint velocity/acceleration/effort limits,
  with conservative default velocity/acceleration scaling (0.1).
- `config/moveit_controllers.yaml` - maps MoveIt to the real controllers in
  `arm_control/config/arm_controllers.yaml` (`arm_controller` as
  FollowJointTrajectory, `gripper_action_controller` as GripperCommand).
- `config/ompl_planning.yaml` - OMPL planner configs.
- `config/pilz_cartesian_limits.yaml` - required by `MoveItConfigsBuilder`,
  not actively used (no Pilz planning yet).
- `config/moveit.rviz` - saved RViz layout (MotionPlanning display configured).
- `launch/move_group.launch.py` - starts the MoveIt planning server.
- `launch/moveit_rviz.launch.py` - starts RViz with the MotionPlanning plugin.

## Planning groups

There are only **two** planning groups: `arm` (the 6 arm joints) and
`gripper` (the gripper's driving joint). There is no combined
`arm_with_gripper` group. Arm motion and gripper actuation must be planned
and executed independently - plan/execute a pose with `arm`, then separately
plan/execute open or close with `gripper` (or send a goal directly to
`/gripper_action_controller/gripper_cmd`).

## Status

Working end-to-end in simulation: planning and execution both confirmed
against Gazebo (`arm_control`'s controllers actually move the arm on Execute).

## Usage

Requires `arm_description` and `arm_control` built and sourced. Three
terminals, in order:

```bash
# 1. Gazebo simulation + spawn robot + activate controllers
ros2 launch arm_control arm_gazebo.launch.py

# 2. MoveIt planning server
ros2 launch arm_moveit_config move_group.launch.py

# 3. RViz with MotionPlanning
ros2 launch arm_moveit_config moveit_rviz.launch.py
```

In RViz: MotionPlanning should load with Planning Group set to `arm`. Set
**Goal State** to `<random valid>` or drag the interactive marker at the
gripper to a new pose, then **Plan** and **Execute**. For the gripper, switch
Planning Group to `gripper` the same way, or send goals directly to
`/gripper_action_controller/gripper_cmd`.

## Notes for whoever touches `arm_gazebo.launch.py`

MoveIt execution depends on two things being true in the Gazebo bringup:
- `add_world:=true` passed to the xacro (MoveIt's virtual joint expects a
  `world` frame to exist in TF)
- `/clock` bridged from Gazebo via `ros_gz_bridge` (otherwise `move_group`
  can't track simulated joint state timestamps and Execute aborts)

Both are already handled in `arm_control/launch/arm_gazebo.launch.py` - flag
here so nobody removes them without knowing why they're there.