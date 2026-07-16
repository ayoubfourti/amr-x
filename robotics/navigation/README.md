# navigation

Nav2 + SLAM configuration and launch files for AMR-X autonomous navigation and
mapping.

## Contents

- `config/nav2_params.yaml` - tuned Nav2 parameter set (planner, controller,
  costmaps, AMCL, behavior tree, collision monitor). Carried forward from the
  original planning structure and adapted for AMR-X.
- `config/slam_params.yaml` - SLAM Toolbox (online async) configuration for
  building a map of the warehouse.
- `launch/slam.launch.py` - starts SLAM Toolbox (mapping).
- `launch/nav2.launch.py` - navigates a **previously saved** map: starts the
  scan pipeline + full Nav2 stack (map_server, amcl, planner, controller, ...).
- `launch/mapping.launch.py` - one-command autonomous mapping: scan pipeline +
  SLAM + Nav2 navigation servers (no amcl/map_server) + optional explorer.
- `scripts/scan_filter_node.py` - drops LiDAR returns closer than a threshold
  (the robot's own body), republishing a cleaned scan.
- `scripts/scan_merger_node.py` - merges the two filtered LiDAR scans into a
  single 360-degree scan.
- `maps/` - saved warehouse maps (`.pgm` + `.yaml`).

## Robot / topic assumptions

The simulation publishes `/scan` (front LiDAR), `/scan_2` (second LiDAR),
`/odom`, and the `odom -> base_footprint` TF. The robot's base frame is
`base_footprint` and its body frame is `base_link`.

The scan pipeline processes these into the topics SLAM and Nav2 consume:

```
/scan    --> scan_filter_node --> /scan_clean    ┐
/scan_2  --> scan_filter_node --> /scan_2_clean   ├─> scan_merger_node --> /scan_merged
                                                  ┘
```

- **SLAM** reads `/scan_merged` (`scan_topic` in `slam_params.yaml`).
- **Nav2 costmaps** and the collision monitor read `/scan_merged`
  (`nav2_params.yaml`).

The self-hit filter threshold is **0.9 m** (returns closer than this are treated
as the robot's own chassis).

Both `slam.launch.py`/`mapping.launch.py` and `nav2.launch.py` start the scan
pipeline for you - you do not normally start the filters/merger by hand.

## Building a map (SLAM)

Two phases: build a map with SLAM, then later navigate it with Nav2. Do not run
both SLAM and Nav2's localization (amcl/map_server) at the same time - they both
publish `/map` and conflict.

Every terminal must be sourced first:

```bash
cd ~/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
```

### Option A - autonomous mapping (recommended)

```bash
# Terminal 1 - simulation
ros2 launch bringup simulation.launch.py

# Terminal 2 - scan pipeline + SLAM + Nav2 nav servers (+ explorer)
ros2 launch navigation mapping.launch.py explore:=true
```

The robot explores and maps on its own. To map by driving manually instead,
launch without the explorer and use teleop:

```bash
# Terminal 2 - same stack, no explorer
ros2 launch navigation mapping.launch.py

# Terminal 3 - drive manually
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

You can also start with explore, then switch to teleop:

```bash
# Terminal 2 - same stack, no explorer
ros2 launch navigation mapping.launch.py

# Terminal 3 - autonomous exploration
ros2 launch explore_lite explore.launch.py
# (Ctrl+C to stop explore)

# Terminal 3 - then drive manually
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

### Option B - SLAM + manual pipeline

If not using `mapping.launch.py`, start the scan pipeline and SLAM by hand
(each in its own sourced terminal):

```bash
ros2 launch bringup simulation.launch.py

ros2 run navigation scan_filter_node.py --ros-args \
  -p use_sim_time:=true -p min_range:=0.9 \
  -p input_topic:=/scan -p output_topic:=/scan_clean -r __node:=scan_filter_1

ros2 run navigation scan_filter_node.py --ros-args \
  -p use_sim_time:=true -p min_range:=0.9 \
  -p input_topic:=/scan_2 -p output_topic:=/scan_2_clean -r __node:=scan_filter_2

ros2 run navigation scan_merger_node.py --ros-args -p use_sim_time:=true

ros2 launch navigation slam.launch.py
```

### Verify the pipeline

```bash
ros2 topic hz /scan_merged                       # should tick ~10 Hz
ros2 node info /slam_toolbox | grep -A6 Subscribers   # must show /scan_merged
ros2 topic info /map --verbose                   # Publisher count must be 1 (slam_toolbox)
```

## Saving the map

SLAM must still be running - the map lives only in SLAM's memory until saved.

```bash
ros2 run nav2_map_server map_saver_cli -f ~/amr-x/robotics/navigation/maps/<map_name>
```

This writes `<map_name>.pgm` (the occupancy grid) and `<map_name>.yaml`
(metadata). Open the `.pgm` to confirm crisp, single-line walls before trusting
it. Only after the save succeeds should SLAM be stopped.

## Navigating a saved map (Nav2)

`nav2.launch.py` starts the scan pipeline AND the full Nav2 + localization stack.
Do NOT run SLAM at the same time.

```bash
# Terminal 1 - simulation
ros2 launch bringup simulation.launch.py

# Terminal 2 - scan pipeline + Nav2 + AMCL + map_server
ros2 launch navigation nav2.launch.py \
  map:=$HOME/amr-x/robotics/navigation/maps/<map_name>.yaml
```

With no `map:=` argument it uses the default map (`amr_warehouse_map.yaml`).

In RViz:
1. Click **2D Pose Estimate** and click-drag on the robot's real location so
   AMCL localises (the particle cloud tightens and the laser snaps to the walls).
2. Click **Nav2 Goal** and click-drag a destination. The robot plans and drives
   there autonomously.

Useful arguments:

```
map:=/abs/path/to/map.yaml     # navigate a different map (use an ABSOLUTE path)
rviz:=false                    # no RViz
self_hit_range:=0.9            # scan filter threshold
scan_pipeline:=false           # don't start filters/merger (if run elsewhere)
```

## Troubleshooting

**Robot doesn't move / RViz shows no map / errors like**
`Invalid frame ID "map" ... frame does not exist`:
The `map` frame only exists once localisation is publishing `map -> odom`.
- Confirm the map actually loaded: `ros2 topic echo /map --once --field info`
  should print width/height/resolution. If it prints nothing, the map did not
  load - check the paths below.
- Confirm map_server is active: `ros2 lifecycle get /map_server` -> `active`.
- Set the **2D Pose Estimate** in RViz so AMCL localises. Until you do, there is
  no `map` frame and the costmaps time out.

**Map file won't load:** open `maps/<map_name>.yaml` and check the `image:`
field matches the actual `.pgm` filename in the same folder. If you rename a map,
rename BOTH files and update the `image:` line. Both `.yaml` and `.pgm` must
exist. Always pass an **absolute path** to `map:=` (relative paths fail).

**Two publishers on `/map`:** you are running SLAM and Nav2's map_server at the
same time. Run only one localiser - SLAM for mapping, AMCL/map_server for
navigation - never both.