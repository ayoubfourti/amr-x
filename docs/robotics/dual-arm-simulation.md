
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

An additional IK solver package, `bio_ik`, must be built from source before
launching MoveIt.

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
- `right_arm_controller`;
- `base_controller`;
- `pinion_position_controller`.

Verify the controller state before sending motion:

```bash
ros2 control list_controllers
ros2 topic echo /joint_states --once
```

All five controllers should report `active`.

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

### Build bio_ik

The MoveIt configuration uses `bio_ik` as the IK solver. KDL, the default
MoveIt solver, cannot reliably solve inverse kinematics for 7-DOF arms or
14-DOF dual-arm groups. `bio_ik` is not available as a binary for ROS 2 Jazzy
and must be built from source once per machine:

```bash
cd /path/to/robot_ws/src
git clone -b ros2 https://github.com/PickNikRobotics/bio_ik.git
cd ..
colcon build --packages-select bio_ik --cmake-args -DCMAKE_BUILD_TYPE=Release
source install/setup.bash
```

### Launch the planning stack

## Launch the planning stack

The full MoveIt stack requires three terminals running simultaneously.
Each terminal must be sourced independently before running its command.

**Terminal 1 — must already be running (Gazebo + controllers)**

If Gazebo is not running yet, start it first and wait until all five
controllers report `active` before proceeding:

```bash
ros2 launch dual_arm_control dual_arm_gazebo.launch.py
```

**Terminal 2 — MoveIt planning server**

```bash
source /opt/ros/jazzy/setup.bash && source /path/to/robotics/install/setup.bash
ros2 launch dual_arm_moveit_config move_group.launch.py
```

Wait until the terminal prints `You can start planning now!` before
opening Terminal 3.

**Terminal 3 — RViz**

```bash
source /opt/ros/jazzy/setup.bash && source /path/to/robotics/install/setup.bash
ros2 launch dual_arm_moveit_config moveit_rviz.launch.py
```

The move_group node exposes the following planning groups:

| Group | Contents |
| --- | --- |
| `left_arm` | 7-DOF left arm |
| `right_arm` | 7-DOF right arm |
| `both_arms` | `left_arm` and `right_arm` combined |
| `base` | rotating platform joint |
| `lift` | rack-and-pinion lift joint |
| `whole_robot` | all of the above |

Both OMPL and the Pilz Industrial Motion Planner are loaded. Pilz exposes
`PTP`, `LIN`, and `CIRC` motion types for deterministic cartesian paths.

The configured trajectory controllers use the same joint names and action
endpoints as the Gazebo controllers.

### Run the pick-place demo

A MoveItPy demo script exercises both arms sequentially through a pick-place
sequence with simulation time support:

```bash
ros2 run dual_arm_control dual_arm_moveit_demo.py
```

Keep the Gazebo launch and the move_group launch running before starting the
demo.

## Known limitations

### Arm reaching accuracy

Both arms may fail to fully reach a target pose at certain configurations.
The robot model is mechanically heavy and the actuator effort limits may be
insufficient to overcome gravity at the full range of motion. Effort limits
were partially tuned to reduce instability, but the issue may persist at
extreme poses.

To investigate: increase `<limit effort="..."/>` values in the URDF, or
enable gravity compensation and tune the JointTrajectoryController PID gains.

### End effectors not defined

The SRDF does not define end effectors for either arm. MoveIt cannot display
interactive cartesian goal markers in RViz, and gripper integration is not
yet implemented.

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

Do not run the trajectory client until all five controllers are active.

### move_group does not start

Confirm that `bio_ik` was built and the workspace was sourced after the build:

```bash
ros2 pkg list | grep bio_ik
```

If the package is not found, follow the build steps in Start MoveIt

### Simulation time does not advance

Verify the Gazebo-to-ROS clock bridge:

```bash
ros2 topic hz /clock
```

The launch configures its ROS nodes with `use_sim_time`.
