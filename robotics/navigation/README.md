# navigation

Nav2 + SLAM configuration and launch files for AMR-X autonomous navigation and
mapping.

## Contents

- `config/nav2_params.yaml` - Nav2 parameters for **navigation mode** (saved
  map): planner, controller, costmaps, AMCL, behavior tree, collision monitor,
  keepout filter. Global costmap uses a `static_layer` sized to the saved map.
- `config/nav2_mapping_params.yaml` - Nav2 parameters for **mapping mode**
  (SLAM). Identical to the above **except the global costmap**, which is a
  rolling window with no `static_layer` and no keepout filter (see
  "Two parameter files" below).
- `config/slam_params.yaml` - SLAM Toolbox (online async) configuration.
- `config/keepout_params.yaml` - costmap filter servers for keepout zones.
- `launch/slam.launch.py` - starts SLAM Toolbox only (mapping).
- `launch/mapping.launch.py` - one command mapping: scan pipeline + SLAM +
  Nav2 navigation servers (no amcl/map_server) + optional explorer.
- `launch/nav2.launch.py` - navigates a **previously saved** map: scan pipeline
  + full Nav2 stack (map_server, amcl, planner, controller, ...) + optional
  keepout filters.
- `scripts/scan_filter_node.py` - blanks the angular sectors where a LiDAR sees
  the robot's own chassis, republishing a cleaned scan.
- `scripts/scan_merger_node.py` - merges the two filtered LiDAR scans into a
  single 360-degree scan in `base_link`.
- `scripts/mission_server_node.py` - long-running node launched with Nav2.
  Accepts navigation goals over topics/services so the robot can be commanded
  programmatically (e.g. from a dashboard) instead of only by clicking in RViz.
  See "Commanding the robot" below.
- `scripts/go_to_goal.py` - small standalone client: sends the robot to one
  x/y[/yaw] coordinate, prints progress, exits. For hand-testing / debugging.
- `config/stations.yaml` - named task poses (e.g. `pharmacy`) created by the
  mission server. See "Stations" below.
- `navigation_msgs/` (separate package) - defines the `SaveStation` service
  used to record a station.
- `maps/` - saved maps (`.pgm` + `.yaml`) and keepout masks.

## Dependencies

Standard ROS 2 Jazzy + Nav2 + SLAM Toolbox packages, plus the following that are
NOT bundled in this repo:

- **`m-explore-ros2`** (autonomous exploration). It is not committed here; clone
  and build it once into the workspace:

  ```bash
  cd ~/amr-x/robotics
  git clone https://github.com/robo-friends/m-explore-ros2.git
  colcon build --symlink-install
  source install/setup.bash
  ```

- **`teleop_twist_keyboard`** (manual driving), if not already installed:

  ```bash
  sudo apt install ros-jazzy-teleop-twist-keyboard
  ```

## Robot / topic assumptions

The simulation publishes `/scan` (LiDAR 1), `/scan_2` (LiDAR 2), `/odom`, and
the `odom -> base_footprint` TF. The robot's base frame is `base_footprint` and
its body frame is `base_link`.

The two LiDARs are mounted on **diagonally opposite corners**, so together they
cover a full 360 degrees - but each one also sees part of the robot's own
chassis. The scan pipeline removes those self-hits and merges both scans:

```
/scan    --> scan_filter_node --> /scan_clean   ---\
                                                    >-- scan_merger_node --> /scan_merged
/scan_2  --> scan_filter_node --> /scan_2_clean ---/
```

- **SLAM** reads `/scan_merged` (`scan_topic` in `slam_params.yaml`).
- **Nav2 costmaps** and the collision monitor read `/scan_merged`.

All three launch files start the scan pipeline for you - you do not normally
start the filters/merger by hand.

### Self-hit filtering (angle based, not range based)

The filter does **not** drop everything closer than some distance. That was the
old behaviour and it blinded the robot to real walls in narrow corridors, which
meant the collision monitor could not see an obstacle in time to stop.

Instead it blanks the **angular wedges** where each LiDAR sees the chassis, and
keeps full range in every other direction. Measured wedges:

| LiDAR | topic | self-hit wedges |
|---|---|---|
| LiDAR 1 | `/scan` | `-180 .. -92 deg` **and** `+170 .. +180 deg` |
| LiDAR 2 | `/scan_2` | `-8 .. +88 deg` |

LiDAR 1 needs **two** wedges because its chassis view straddles the +/-180
seam - the same continuous piece of body appears at both ends of the scan
array. Blanking only the first wedge leaves the wrapped tail leaking through,
which shows up as black pixels drawn around the robot and a planner that thinks
it is boxed in.

These are launch arguments, so they can be tuned without editing code:

```
blank_min_deg_LIDAR1  / blank_max_deg_LIDAR1     # LiDAR 1, first wedge
blank2_min_deg_LIDAR1 / blank2_max_deg_LIDAR1    # LiDAR 1, wrapped wedge
blank_min_deg_LIDAR2  / blank_max_deg_LIDAR2     # LiDAR 2
```

`scan_filter_node.py` is generic - the same script runs for both LiDARs. Its
second wedge defaults to *disabled* (`min > max`, which can never match), so a
LiDAR only gets one unless the launch file passes the second pair. Only LiDAR 1
does, because only its chassis view crosses the seam.

## Two parameter files

The global costmap needs **opposite settings** in the two modes, so there are
two parameter files. Do not merge them.

| | mapping (`nav2_mapping_params.yaml`) | navigation (`nav2_params.yaml`) |
|---|---|---|
| `rolling_window` (global) | `true` | `false` |
| `static_layer` (global) | absent | present |
| keepout `filters:` | absent | present |

During SLAM the map is continually growing, and a `static_layer` would resize
the global costmap underneath the planner mid-run and break planning. With a
saved map nothing resizes, so the static layer is correct and is what lets the
planner see walls it has not driven past yet.

**Everything else in the two files must stay in sync.** If you tune the
controller speeds or the collision monitor in one, mirror it in the other or the
two modes will behave differently for no obvious reason.

## Building a map (SLAM)

Two phases: build a map with SLAM, then navigate it with Nav2. Never run SLAM
and Nav2's localisation (amcl/map_server) at the same time - they both publish
`/map` and conflict.

Every terminal must be sourced first:

```bash
cd ~/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
```

### Autonomous mapping

```bash
# Terminal 1 - simulation  (add environment:=hospital for the hospital world)
ros2 launch bringup simulation.launch.py

# Terminal 2 - scan pipeline + SLAM + Nav2 nav servers + explorer
ros2 launch navigation mapping.launch.py explore:=true
```

To map by driving manually instead, launch without the explorer:

```bash
ros2 launch navigation mapping.launch.py
ros2 run teleop_twist_keyboard teleop_twist_keyboard   # separate terminal
```

You can also switch mid-run. Start the explorer as its own command and stop it
whenever you want to take over:

```bash
ros2 launch navigation mapping.launch.py                # no explorer
ros2 launch explore_lite explore.launch.py              # separate terminal
# Ctrl+C that terminal, then drive with teleop
```

Only one thing should drive at a time - stop the explorer before using teleop,
or they fight over `/cmd_vel`.

### Verify the pipeline

```bash
ros2 topic hz /scan_merged                            # should tick
ros2 node info /slam_toolbox | grep -A6 Subscribers   # must show /scan_merged
ros2 topic info /map --verbose                        # Publisher count MUST be 1
```

Also check the merged scan contains no self-hits. The shortest reading should be
a real distance, not the ~0.2-0.4 m of the robot's own body:

```bash
ros2 topic echo /scan_merged --once --field ranges | tr ',' '\n' | grep -v inf | sort -n | head -5
```

## Saving the map

SLAM must still be running - the map lives only in SLAM's memory until saved.

```bash
ros2 run nav2_map_server map_saver_cli -f ~/amr-x/robotics/navigation/maps/<map_name>
```

This writes `<map_name>.pgm` and `<map_name>.yaml`. Open the `.pgm` and confirm
crisp single-line walls before trusting it. Only stop SLAM after the save
succeeds.

If two saves in a row give different results, check `ros2 topic info /map
--verbose` - a second publisher (Nav2's map_server) means you are saving
whichever map won the race.

## Navigating a saved map (Nav2)

`nav2.launch.py` starts the scan pipeline AND the full Nav2 + localisation
stack. Do NOT run SLAM at the same time.

```bash
# Terminal 1 - simulation
ros2 launch bringup simulation.launch.py environment:=hospital

# Terminal 2 - scan pipeline + Nav2 + AMCL + map_server (+ keepout)
ros2 launch navigation nav2.launch.py \
  map:=$(ros2 pkg prefix navigation)/share/navigation/maps/Hospital_map.yaml \
  keepout_filter:=hospital
(for The Warehouse map ) ros2 launch navigation nav2.launch.py \
map:=$(ros2 pkg prefix navigation)/share/navigation/maps/warehouse_harmonic.yaml
```

Using `$(ros2 pkg prefix navigation)/share/navigation/maps/...` resolves through
the installed package, so it works on any machine. An absolute path also works;
a relative path does not.

In RViz:

1. Click **2D Pose Estimate** and click-drag on the robot's real location.
   Until you do this AMCL is not localised, there is no `map` frame, and the
   costmaps time out and abort.
2. Click **Nav2 Goal** and click-drag a destination.

Useful arguments:

```
map:=<path>.yaml                # map to navigate (absolute, or via pkg prefix)
keepout_filter:=hospital        # load maps/hospital_keepout.yaml ("none" = off)
rviz:=false                     # no RViz
scan_pipeline:=false            # don't start filters/merger (if run elsewhere)
params_file:=<path>.yaml        # different Nav2 parameters
blank*_deg_LIDAR1/2:=<deg>      # tune the self-hit wedges (see table above)
```

## Keepout zones

A 2D LiDAR scans one horizontal plane, so it detects obstacles but **cannot
detect the absence of floor**. Downward stairs read as free space: the robot
drives to the edge, gets stuck, and because the wheels keep turning odometry
keeps reporting motion - which corrupts the map. The hospital world has two
such stairwells.

Keepout zones are the Nav2 mechanism for hazards the sensors cannot perceive.
They constrain planning only; the map itself stays truthful, so AMCL still
localises against real geometry.

A zone set is two files in `maps/`, named `<name>_keepout.yaml` + `.pgm`, and
selected with `keepout_filter:=<name>`. Passing `keepout_filter:=none` (the
default) disables them entirely - correct for maps that have no mask, since a
mask is aligned to one specific map's origin.

### Creating a mask for a new map

1. Make an image the **same pixel dimensions** as the map, all white (254),
   with the forbidden areas painted **black (0)**. It is a blank canvas, not a
   copy of the map - it carries one piece of information only.
2. Write `<name>_keepout.yaml` with `resolution` and `origin` **identical** to
   the map's yaml. That is the only thing aligning them; if they differ the
   zones land in the wrong place.
3. Set its `image:` line to `<name>_keepout.pgm`.
4. Rebuild so both files install, then launch with `keepout_filter:=<name>`.

### Verify

```bash
ros2 lifecycle get /filter_mask_server            # must be "active"
ros2 topic echo /keepout_filter_mask --once --field info
ros2 topic echo /costmap_filter_info --once
```

Then check visually: the zones appear as blocked on the global costmap, and a
goal inside a zone fails to plan rather than routing there.

## Commanding the robot

Once `nav2.launch.py` is running, the **mission server** node
(`/mission_server`) is up and listening. Nothing extra to start. It is the
programmatic way to drive the robot - the same interface a dashboard would use.

Interface (all standard message types, so a dashboard can drive it over
rosbridge with no custom packages except `SaveStation`):

| direction | name | type | purpose |
|---|---|---|---|
| send | `/mission/go_to_station` | `std_msgs/String` | drive to a named station |
| send | `/mission/go_to_pose` | `geometry_msgs/PoseStamped` | drive to a raw map coordinate |
| listen | `/mission/status` | `std_msgs/String` | progress, arrival, parking error, refusals |
| call | `/mission/cancel` | `std_srvs/Trigger` | cancel the goal in progress |
| call | `/mission/save_station` | `navigation_msgs/SaveStation` | record the current pose as a station |

Watch what the robot is doing (leave this open in its own terminal):

```bash
ros2 topic echo /mission/status
```

Drive to a coordinate in the map frame:

```bash
ros2 topic pub --once /mission/go_to_pose geometry_msgs/PoseStamped \
  "{header: {frame_id: 'map'}, pose: {position: {x: 2.0, y: 8.0, z: 0.0}, orientation: {z: 0.0, w: 1.0}}}"
```

Drive to a named station:

```bash
ros2 topic pub --once /mission/go_to_station std_msgs/String "{data: 'pharmacy'}"
```

Cancel mid-drive:

```bash
ros2 service call /mission/cancel std_srvs/srv/Trigger
```

Every goal is checked against the global costmap *before* being sent. A goal on
a wall, an obstacle, or inside a keepout zone is refused instantly (status says
so) rather than letting Nav2 spin through its recovery behaviours for several
seconds first.

`go_to_goal.py` does the same coordinate goal from the command line, with a
progress bar, for quick hand-testing:

```bash
python3 navigation/scripts/go_to_goal.py 2.0 8.0        # x y
python3 navigation/scripts/go_to_goal.py 2.0 8.0 90     # x y yaw(deg)
```

## Stations

A **station** is a named pose the robot has physically stood at, e.g. `pharmacy`
-> (x, y, yaw). Missions are then expressed as names instead of coordinates,
which is what a task ("go to the pharmacy, the arm takes over") actually needs.

Because a station is captured from the robot's *live* pose, it is guaranteed
reachable and clear of obstacles - you cannot define one inside a wall, because
the robot could not have stood inside a wall.

**To save one:** drive the robot to the spot (teleop or a Nav2/mission goal),
confirm the scan sits on the walls (i.e. it is well localised), then:

```bash
ros2 service call /mission/save_station navigation_msgs/srv/SaveStation "{name: 'pharmacy'}"
```

The service replies with the stored pose. Stations live in
`config/stations.yaml` as plain, hand-editable YAML:

```yaml
stations:
  pharmacy:
    x: 2.34
    y: 8.91
    yaw: 1.57
```

The mission server re-reads the file on every request, so hand-edits take effect
without a restart.

**IMPORTANT - where stations.yaml lives.** The `stations_file` launch argument
must point at the **source** tree
(`~/amr-x/robotics/navigation/config/stations.yaml`), NOT into `install/`.
`install/` is regenerated by every `colcon build`, so stations saved there are
wiped on the next build. Check which file the running node uses:

```bash
ros2 param get /mission_server stations_file
```

## Odometry / robot geometry (why the URDF numbers matter)

Localisation quality depends on two numbers in
`robot_description/urdf/amr_2lidar.urdf.xacro`:

| property | value | how it was obtained |
|---|---|---|
| `wheel_radius` | 0.080 | measured from `DL_Link.STL` (0.16 m diameter) |
| `wheel_separation` | 0.541 | measured from the wheel meshes, NOT joint origins |

**Do not read `wheel_separation` off the joint origins.** The SolidWorks export
places each wheel mesh offset by -0.0189 m *inside* its joint, so the joint
origins (+/-0.289353) imply 0.5787, but the true track width is
2 x (0.289353 - 0.0189) = 0.541. Using 0.5787 makes the robot physically rotate
faster than odometry reports, so the scan drifts off the map during every turn.

Verify odometry against ground truth, never against the commanded velocity (the
controller and odometry use the same parameter, so an error cancels and is
invisible):

```bash
ros2 run tf2_ros tf2_echo odom base_footprint > /tmp/odom.txt
ros2 run tf2_ros tf2_echo map  base_footprint > /tmp/true.txt
# spin in place several turns, then compare total yaw over the same window
```

If the scan drifts off the walls **while moving but recovers when stopped**,
that is AMCL update spacing, not geometry - `update_min_d` / `update_min_a` in
`nav2_params.yaml` (both set to 0.05 here) control how often AMCL corrects.

## Spawning obstacles and actors (hospital simulation)

The hospital world can be populated with 19 static "unmapped" obstacles
(furniture the SLAM map does not know about, to stress-test local obstacle
avoidance) and 16 dynamic pedestrian actors (local wander loops).
These are spawned into an already-running simulation with two scripts, not
baked into the world file.

### Expected layout

```
navigation/test/
├── scripts/
│   ├── fetch_assets.sh
│   ├── spawn_obstacles.sh
│   └── spawn_actors.sh
├── actors/
│   └── actor_wanderer_1.sdf ... actor_wanderer_16.sdf
└── assets/                # created by fetch_assets.sh - gitignored, NOT committed
    └── hospital_assets/
        └── fuel_models/
```

`scripts/` and `actors/` are committed (plain text, small). `assets/` is
fetched by each teammate and should be in `.gitignore` - the Fuel model
meshes/textures live there and are pulled from an external repo, not stored
in this one.

### First time only (after cloning)

```bash
cd ~/amr-x/robotics/navigation/test/scripts
chmod +x fetch_assets.sh spawn_obstacles.sh spawn_actors.sh
./fetch_assets.sh
```

This clones the AWS RoboMaker hospital asset pack and downloads the 20 Fuel
models the obstacles use, into `../assets/hospital_assets/fuel_models`. Only
needs to run once per machine - it does not need to be repeated for every
sim launch, and does not need to run again after a normal `git pull` unless
the model list itself changes.

### Every time you want obstacles/actors in a running sim

With the `hospital` world already launched (`ros2 launch bringup
simulation.launch.py environment:=hospital`), open a new terminal:

```bash
cd ~/amr-x/robotics/navigation/test/scripts
./spawn_obstacles.sh
./spawn_actors.sh
```

Each `.sh` calls `ros2 run ros_gz_sim create` once per entity (one obstacle
or actor per call - there is no single command that spawns all of them at
once). Both scripts locate their own directory automatically
(`$(dirname "${BASH_SOURCE[0]}")`), so they work regardless of where the repo
is cloned or which machine runs them - no hardcoded paths or usernames to
edit.

Spawning is **not persistent**: closing or restarting the Gazebo world clears
everything spawned this way, and both scripts need to be rerun. This is a
deliberate tradeoff versus baking the obstacles into the world file - faster
to iterate on, but must be re-run per session.

## Troubleshooting

**You changed something and the behaviour did not change.** Check the
*installed* copy, not your source - nodes run from `install/`, and a package
built without `--symlink-install` keeps stale real copies:

```bash
diff ~/amr-x/robotics/navigation/launch/nav2.launch.py \
     $(ros2 pkg prefix navigation)/share/navigation/launch/nav2.launch.py
```

If they differ:

```bash
cd ~/amr-x/robotics
rm -rf build/navigation install/navigation
colcon build --symlink-install --packages-select navigation
source install/setup.bash
```

**Old nodes are still running.** A running node keeps its old code and
parameters until it is killed. Before re-testing a change:

```bash
pkill -9 -f scan_filter; pkill -9 -f scan_merger
pkill -9 -f slam_toolbox; pkill -9 -f component_container; pkill -9 -f rviz2
sleep 3
ros2 node list          # confirm they are gone
```

A `WARNING: ... nodes in the graph that share an exact name` means a duplicate
survived and results cannot be trusted.

**Command line arguments seem to be ignored.** Check what the nodes actually
received - launch writes each node's parameters to a temp file:

```bash
rm -f /tmp/launch_params_*        # clear old runs first
# ...launch...
cat /tmp/launch_params_*
```

If your values are not there, the launch never got them. A common cause is a
backslash followed by a space when splitting the command over lines - put the
whole command on one line to rule it out.

**Robot does not move / no map in RViz / `Invalid frame ID "map"`.** The `map`
frame only exists once localisation publishes `map -> odom`.

- `ros2 topic echo /map --once --field info` should print width/height. If it
  prints nothing the map did not load.
- `ros2 lifecycle get /map_server` should be `active`.
- Set the **2D Pose Estimate** in RViz.

**A map or mask will not load.** Open the `.yaml` and check the `image:` line
matches the actual `.pgm` filename in the same folder. `image:` is resolved
relative to the yaml's own directory, so it must be a bare filename, and if you
rename a map you must rename **both** files and update that line.

**Two publishers on `/map`.** SLAM and Nav2's map_server are both running. Use
one localiser at a time: SLAM for mapping, AMCL/map_server for navigation.

**`KeepoutFilter: Filter mask was not received`.** The `filters:` block in
`nav2_params.yaml` is active but the filter servers are not running - either
`keepout_filter:=` was not passed, or `filter_mask_server` failed to load its
mask (check the launch terminal for a `map_io` error).

**Planner routes through walls it has not driven past.** The global costmap has
no `static_layer` - you are running navigation with the mapping parameter file.

**Map drifts or rebuilds itself rotated during mapping.** Usually turning too
fast for the scan matcher. `wz_max` in the controller parameters caps rotation
speed; 0.5 rad/s maps reliably. Also confirm the merged scan has no self-hits.

**Scan drifts off the walls whenever the robot moves.** Localisation is wrong,
not the scan. If it happens at any speed and does not recover, check
`wheel_separation` (see "Odometry" above). If it only happens during motion and
snaps back at rest, lower AMCL's `update_min_d` / `update_min_a`.

**`unknown station 'X'` when commanding a station.** The mission server is
reading a different `stations.yaml` than the one your save wrote to. Check
`ros2 param get /mission_server stations_file` and make sure that path is the
one that actually contains the station. This is almost always the install-vs-
source path issue - the launch default must point at the source tree.

**"Unknown package" for a package you just built** (especially an interface /
`_msgs` package). Two usual causes: (1) you did not re-source after building, or
(2) the package built as ROS 1 catkin instead of ament and is invisible. Check
the build type - it must say `ros.ament_cmake`, not `ros.catkin`:

```bash
colcon list | grep <package>
```

If it says `ros.catkin`, the `package.xml` is missing its build-type export. Add
this before `</package>` and rebuild:

```xml
<export>
  <build_type>ament_cmake</build_type>
</export>
```

**A change is ignored no matter what you do - check which copy you are running.**
More than one workspace on the path means you cannot know which copy of a
package a command resolves to. A 5-second check that catches a whole class of
problems:

```bash
echo $AMENT_PREFIX_PATH | tr ':' '\n'    # should be ONLY this workspace + /opt/ros/jazzy
ros2 pkg prefix navigation                # which copy is being used
```

See `ROS2_FIELD_GUIDE.md` (workspace root) for the full workspace-anatomy and
debugging reference.
