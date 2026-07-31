# Dual-arm simulation

The dual-arm module has three focused ROS 2 packages:

| Package | Responsibility |
| --- | --- |
| `dual_arm_description` | Xacro model, mesh resources, RViz configuration, and reference joint parameters |
| `dual_arm_control` | Gazebo launch, `ros2_control` configuration, and synchronized trajectory client |
| `dual_arm_moveit_config` | SRDF, planning pipelines, controller mapping, joint limits, and MoveIt launch files |

The model uses package-relative mesh and controller resources, so it can run
from any correctly sourced workspace. It does not depend on a developer's home
directory.

## Build

Install ROS dependencies and build from the workspace:

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
rosdep install --from-paths . --ignore-src -r -y
colcon build --symlink-install \
  --packages-up-to dual_arm_control dual_arm_moveit_config
source install/setup.bash
```

Source `/opt/ros/jazzy/setup.bash` and `robotics/install/setup.bash` in every
new terminal.

## Inspect the model in RViz

Launch the description without Gazebo:

```bash
ros2 launch dual_arm_description dual_arm_display.launch.py
```

The joint-state publisher GUI is enabled by default. Disable it when another
node owns the joint states:

```bash
ros2 launch dual_arm_description dual_arm_display.launch.py jsp_gui:=false
```

## Run Gazebo and the controllers

Start the simulated module:

```bash
ros2 launch dual_arm_control dual_arm_gazebo.launch.py
```

The launch starts Gazebo, bridges simulation time, publishes the processed
Xacro model, spawns the module, and loads:

- `joint_state_broadcaster`;
- `left_arm_controller`;
- `right_arm_controller`.

Verify the controller state before sending motion:

```bash
ros2 control list_controllers
ros2 topic echo /joint_states --once
```

All three controllers should report `active`.

## Run the synchronized trajectory

In a second sourced terminal:

```bash
ros2 run dual_arm_control dual_arm_trajectory_node.py
```

The client waits for both action servers, then commands both arms through
`HOME → Position A → Position B → HOME`. A step succeeds only when both action
goals are accepted, both actions finish with `STATUS_SUCCEEDED`, and both
controllers return a successful `FollowJointTrajectory` result. If either arm
rejects, times out, aborts, or reports a controller error, the sequence stops
and exits non-zero instead of reporting a false success.

The action endpoints are:

```text
/left_arm_controller/follow_joint_trajectory
/right_arm_controller/follow_joint_trajectory
```

## Start MoveIt

Keep the Gazebo launch running. Start the planning server and RViz in separate
sourced terminals:

```bash
ros2 launch dual_arm_moveit_config move_group.launch.py
ros2 launch dual_arm_moveit_config moveit_rviz.launch.py
```

The MoveIt configuration exposes left-arm, right-arm, and combined dual-arm
planning groups. The configured trajectory controllers use the same joint
names and action endpoints as the Gazebo controllers.

## Troubleshooting

### Meshes do not appear

Confirm that `dual_arm_description` resolves from the sourced install:

```bash
ros2 pkg prefix dual_arm_description
```

Rebuild with `--symlink-install` if the package cannot be found. The model uses
`package://dual_arm_description/meshes/...` URIs; no absolute path should be
required.

### Controllers are unavailable

Inspect the controller manager and Gazebo plugin output:

```bash
ros2 node list
ros2 control list_controllers
ros2 action list | grep follow_joint_trajectory
```

Do not run the trajectory client until both arm controllers are active.

### Simulation time does not advance

Verify the Gazebo-to-ROS clock bridge:

```bash
ros2 topic hz /clock
```

The launch configures its ROS nodes with `use_sim_time`.
