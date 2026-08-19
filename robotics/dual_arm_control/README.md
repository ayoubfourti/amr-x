# dual_arm_control

`ros2_control` configuration and Gazebo bringup for the dual-arm module,
including its rack-and-pinion vertical lift and rotating base.

## The problem that was fixed

The lift (`pinion_joint` driving `rack_joint`) did not work initially:
`rack_joint` was frozen at zero under any command, and `pinion_joint` spun
freely with no resistance. Root cause: the two joints were never mechanically
coupled in the URDF, and once a `mimic` constraint was added to properly
couple them, Gazebo's default physics engine (DART) silently ignored it -
mimic constraints require the **Bullet-Featherstone** physics engine, which
this package's Gazebo launch now explicitly requests.

`rack_joint` is a mimic joint (`rack = -0.056 x pinion_angle`) and has no
command interface of its own - it is never commanded directly, only
`pinion_joint` is.

## Controllers

| Controller | Type | Joints | Notes |
|---|---|---|---|
| `joint_state_broadcaster` | `JointStateBroadcaster` | all | publishes `/joint_states` |
| `pinion_position_controller` | `JointGroupPositionController` | `pinion_joint` | drives the lift; `rack_joint` follows automatically via mimic |
| `base_controller` | `JointTrajectoryController` | `robot_base_joint` | rotates the base the arms are mounted on |
| `left_arm_controller` | `JointTrajectoryController` | 7 left-arm joints | |
| `right_arm_controller` | `JointTrajectoryController` | 7 right-arm joints | |

## Usage

```bash
ros2 launch dual_arm_control dual_arm_gazebo.launch.py
```

Move the lift (publish continuously - `JointGroupPositionController` expects
a repeated target, not a one-shot command):
```bash
ros2 topic pub -r 20 /pinion_position_controller/commands \
  std_msgs/msg/Float64MultiArray "{data: [3.57]}"
```
`pinion_joint` range is `0.0` to `7.2` rad; `rack_joint` follows at
`-0.056 x pinion_angle`, staying within its own `[-0.40, 0]` m range.

Rotate the base:
```bash
ros2 action send_goal /base_controller/follow_joint_trajectory \
  control_msgs/action/FollowJointTrajectory \
  "{trajectory: {joint_names: [robot_base_joint], points: [{positions: [0.5], time_from_start: {sec: 3}}]}}"
```

Move an arm:
```bash
ros2 action send_goal /left_arm_controller/follow_joint_trajectory \
  control_msgs/action/FollowJointTrajectory \
  "{trajectory: {joint_names: [shoulder1_joint, shoulder2_joint, shoulder3_joint, shoulder4_joint, shoulder5_joint, shoulder6_joint, wrist_joint], points: [{positions: [0,0,0,0,0,0,0], time_from_start: {sec: 3}}]}}"
```

Or run the scripted test sequence:
```bash
ros2 run dual_arm_control dual_arm_trajectory_node.py
```

## Verify

```bash
ros2 control list_controllers
ros2 control list_hardware_interfaces | grep -E "pinion|rack|robot_base"
ros2 topic echo /joint_states
```

## Known limitations

- The lift moves correctly but slowly (no gravity feedforward in the pinion
  PID). Not yet tuned for speed.