# Mapping, Localization, and Nav2

The `navigation` package contains launch files for live mapping, navigation on
a live SLAM map, and navigation on a saved map. It uses the simulated `/scan`
and `/odom` data produced by the digital twin.

## Choose one operating mode

| Mode | Map provider | Launch files | Initial pose required |
|---|---|---|---|
| Mapping only | SLAM Toolbox | `slam.launch.py` | No |
| Mapping while navigating | SLAM Toolbox | `slam.launch.py` + `nav2.launch.py` | No |
| Saved-map navigation | Map server + AMCL | `localization.launch.py` | Yes, through RViz |

Do not run SLAM and AMCL localization at the same time. Both attempt to own the
`map` to `odom` transform.

## Build the navigation package

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install --packages-select navigation
source install/setup.bash
```

## Create a map

Start each command in a separate sourced terminal.

```bash
# Terminal 1: digital twin
ros2 launch bringup simulation.launch.py
```

```bash
# Terminal 2: SLAM Toolbox and mapping RViz
ros2 launch navigation slam.launch.py
```

```bash
# Terminal 3: manual exploration
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

Drive slowly and cover the environment with overlapping LiDAR observations.
Teleoperation during mapping does not automatically avoid collisions.

Save the map while SLAM is running:

```bash
ros2 run nav2_map_server map_saver_cli -f \
  /path/to/amr-x/robotics/navigation/maps/amr_warehouse_map
```

This produces a map image and YAML metadata. Rebuild `navigation` if other
machines need to consume newly committed map files through the installed
package.

## Navigate while mapping

Start the digital twin and SLAM as above, then start Nav2's navigation servers:

```bash
ros2 launch navigation nav2.launch.py
```

This launch intentionally excludes `map_server` and AMCL. SLAM Toolbox supplies
the live map and transform. In RViz, select **Nav2 Goal** and choose a reachable
pose.

## Navigate on the saved map

```bash
# Terminal 1
ros2 launch bringup simulation.launch.py
```

```bash
# Terminal 2: map server, AMCL, Nav2 servers, and RViz
ros2 launch navigation localization.launch.py
```

In RViz:

1. Select **2D Pose Estimate** and drag at the robot's actual simulated pose.
2. Confirm that the AMCL particle cloud converges.
3. Select **Nav2 Goal** and choose a reachable target.

Use another map or parameter file when required:

```bash
ros2 launch navigation localization.launch.py \
  map:=/absolute/path/map.yaml \
  params_file:=/absolute/path/nav2_params.yaml
```

## Implemented navigation configuration

| Function | Current implementation |
|---|---|
| Mapping | SLAM Toolbox in asynchronous mapping mode |
| Saved-map localization | Nav2 map server and AMCL |
| Behavior-tree navigation | `NavigateToPose` and `NavigateThroughPoses` navigators |
| Local controller | Nav2 MPPI controller |
| Global planner | NavFn planner |
| Local obstacle data | Voxel layer consuming `/scan` |
| Global obstacle data | Static, obstacle, and inflation layers |
| Recovery behaviors | Spin, back up, drive on heading, assisted teleoperation, and wait |
| Command conditioning | Velocity smoother and collision-monitor configuration |
| Frames | `map`, `odom`, `base_link`, `base_footprint`, and scan frame |

The primary configuration is `robotics/navigation/config/nav2_params.yaml`.
SLAM-specific parameters are in `slam_params.yaml`.

## Verify the navigation graph

```bash
ros2 lifecycle nodes
ros2 action list
ros2 topic hz /scan
ros2 topic echo /map --field info.width --once
ros2 topic echo /amcl_pose --once
ros2 run tf2_ros tf2_echo map base_link
```

For a saved-map run, expect an unbroken transform chain from `map` through
`odom` to the robot base. For live SLAM, expect SLAM Toolbox to publish the
`map` transform.

## Troubleshooting

| Symptom | Check |
|---|---|
| Package or launch file not found | Build from `robotics/` and source `install/setup.bash` in that terminal |
| RViz has no map | Confirm `/map` exists and re-add the display from the topic so RViz selects suitable QoS |
| `map` frame does not exist | Start SLAM for mapping mode, or `localization.launch.py` for saved-map mode |
| Robot does not move to a goal | Inspect Nav2 lifecycle state, `/scan`, `/odom`, transforms, and `/cmd_vel` |
| Two competing transforms | Stop either SLAM or AMCL; do not run both map providers |
| Planner rejects valid-looking space | Check footprint, inflation, map scale, initial pose, and costmaps |

## Current validation gaps

- No dedicated camera, object-detection, docking-vision, or perception package
  is implemented in the current workspace; the active obstacle input is the
  simulated 2D LiDAR scan consumed by Nav2 costmaps.
- The footprint and sensor placement must remain synchronized with final
  mechanical geometry.
- Tuning needs repeatable evidence for narrow aisles, blocked routes,
  localization loss, recovery, and docking approaches.
- The docking plugin configuration is not evidence of a completed physical
  docking system.
- Real sensor noise, wheel slip, timing, and embedded odometry have not yet
  replaced simulated data.
