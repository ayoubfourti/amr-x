# Navigation

The `navigation` package is the AMR-X navigation stack: mapping a new
environment, then autonomously driving a saved map with Nav2. It consumes the
simulated `/scan`, `/scan_2`, and `/odom` produced by the digital twin and
produces velocity commands to the robot.

This page is the practical guide - what the pieces are, how to run them, and how
to fix the common failures. For the deeper ROS 2 workspace/build reference, see
`ROS2_FIELD_GUIDE.md` at the workspace root.

---

## Operating modes

Pick **one** map provider. SLAM (for mapping) and AMCL (for saved-map
localisation) both try to own the `map -> odom` transform, so they must never
run at the same time.

| Mode | Map provider | Launch | Initial pose |
|---|---|---|---|
| Autonomous mapping | SLAM Toolbox | `mapping.launch.py` | not needed |
| SLAM only (manual) | SLAM Toolbox | `slam.launch.py` | not needed |
| Saved-map navigation | map_server + AMCL | `nav2.launch.py` | set once in RViz |

`mapping.launch.py` is the one-command mapping path: it starts the scan
pipeline, SLAM, Nav2's navigation servers, and optionally the explorer.
`slam.launch.py` starts SLAM Toolbox alone if you want to assemble the rest by
hand. `nav2.launch.py` is the full saved-map stack (scan pipeline + map_server +
AMCL + planner/controller + optional keepout + mission server).

---

## Package contents

- `config/nav2_params.yaml` - Nav2 parameters for **navigation mode** (saved
  map): planner, controller, costmaps, AMCL, behaviour tree, collision monitor,
  keepout filter. Global costmap uses a `static_layer` sized to the saved map.
- `config/nav2_mapping_params.yaml` - Nav2 parameters for **mapping mode**.
  Identical to the above **except the global costmap** (rolling window, no
  `static_layer`, no keepout). See "Two parameter files".
- `config/slam_params.yaml` - SLAM Toolbox (online async) configuration.
- `config/keepout_params.yaml` - costmap filter servers for keepout zones.
- `config/stations.yaml` - named task poses (created by the mission server).
- `launch/slam.launch.py` - SLAM Toolbox only.
- `launch/mapping.launch.py` - autonomous mapping (scan pipeline + SLAM + Nav2
  nav servers + optional explorer).
- `launch/nav2.launch.py` - saved-map navigation (full stack + optional keepout
  + mission server).
- `scripts/scan_filter_node.py` - blanks the angular sectors where a LiDAR sees
  the robot's own chassis, republishing a cleaned scan.
- `scripts/scan_merger_node.py` - merges the two filtered scans into one
  360-degree scan in `base_link`.
- `scripts/mission_server_node.py` - long-running node (launched with Nav2) that
  accepts goals over topics/services. See "Commanding the robot".
- `scripts/go_to_goal.py` - standalone command-line client for a single
  coordinate goal (hand-testing).
- `maps/` - saved maps (`.pgm` + `.yaml`) and keepout masks.
- `navigation_msgs/` (separate package) - the `SaveStation` service definition.

---

## Dependencies

Standard ROS 2 Jazzy + Nav2 + SLAM Toolbox packages, plus the following that are
**not** bundled in this repo:

- **`m-explore-ros2`** (autonomous exploration, provides `explore_lite`). It is
  not committed here; clone and build it once into the workspace:

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

---

## Build and source

Every terminal needs base ROS and the workspace sourced. The `.bashrc` already
does this; do it by hand only in a shell that skips it.

```bash
cd ~/amr-x/robotics
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install --packages-select navigation
source install/setup.bash
```

If you also changed the custom service, build `navigation_msgs` **first** (it is
a dependency), then `navigation`:

```bash
colcon build --packages-select navigation_msgs
source install/setup.bash
colcon build --symlink-install --packages-select navigation
source install/setup.bash
```

---

## The scan pipeline

The simulation publishes `/scan` (LiDAR 1), `/scan_2` (LiDAR 2), `/odom`, and the
`odom -> base_footprint` TF. The robot's base frame is `base_footprint` and its
body frame is `base_link` (the merged scan is produced in `base_link`).

The robot has two LiDARs on **diagonally opposite corners**. Together they cover
360 degrees, but each one also sees part of the robot's own chassis. The scan
pipeline removes those self-hits and merges the two scans into one:

```
/scan    --> scan_filter_node --> /scan_clean   ---\
                                                    >-- scan_merger_node --> /scan_merged
/scan_2  --> scan_filter_node --> /scan_2_clean ---/
```

SLAM, the Nav2 costmaps, and the collision monitor all read `/scan_merged`. All
launch files start this pipeline for you - you do not normally run the
filters/merger by hand.

### Self-hit filtering (angle based, not range based)

The filter does **not** drop everything closer than some distance. That old
approach blinded the robot to real walls in narrow corridors, so the collision
monitor could not see an obstacle in time to stop. Instead it blanks the
**angular wedges** where each LiDAR sees the chassis and keeps full range
everywhere else.

| LiDAR | topic | self-hit wedges |
|---|---|---|
| LiDAR 1 | `/scan` | `-180 .. -92 deg` **and** `+170 .. +180 deg` |
| LiDAR 2 | `/scan_2` | `-8 .. +88 deg` |

LiDAR 1 needs **two** wedges because its chassis view straddles the +/-180 seam:
the same continuous piece of body appears at both ends of the scan array.
Blanking only the first wedge leaves the wrapped tail leaking through, which
shows up as black pixels drawn around the robot and a planner that thinks it is
boxed in.

The wedges are launch arguments, tunable without editing code:

```
blank_min_deg_LIDAR1  / blank_max_deg_LIDAR1     # LiDAR 1, first wedge
blank2_min_deg_LIDAR1 / blank2_max_deg_LIDAR1    # LiDAR 1, wrapped wedge
blank_min_deg_LIDAR2  / blank_max_deg_LIDAR2     # LiDAR 2
```

`scan_filter_node.py` is generic - the same script runs for both LiDARs. Its
second wedge defaults to *disabled* (`min > max`, which can never match), so a
LiDAR only gets one wedge unless the launch passes the second pair. Only LiDAR 1
does, because only its chassis view crosses the seam.

---

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
saved map nothing resizes, so the static layer is correct - and it is what lets
the planner see walls it has not yet driven past.

**Everything else in the two files must stay in sync.** If you tune the
controller speeds or the collision monitor in one, mirror it in the other, or
the two modes behave differently for no obvious reason.

---

## Building a map (SLAM)

Two phases: build a map with SLAM, then navigate it with Nav2. Never run SLAM
and AMCL at the same time.

### Autonomous mapping

```bash
# Terminal 1 - simulation  (add environment:=hospital for the hospital world)
ros2 launch bringup simulation.launch.py

# Terminal 2 - scan pipeline + SLAM + Nav2 nav servers + explorer
ros2 launch navigation mapping.launch.py explore:=true
```

To map by driving manually instead of with the explorer:

```bash
ros2 launch navigation mapping.launch.py
ros2 run teleop_twist_keyboard teleop_twist_keyboard   # separate terminal
```

You can also start the explorer separately and stop it whenever you want to take
over:

```bash
ros2 launch navigation mapping.launch.py            # no explorer
ros2 launch explore_lite explore.launch.py          # separate terminal
# Ctrl+C that terminal, then drive with teleop
```

Only one thing should drive at a time - stop the explorer before using teleop,
or they fight over `/cmd_vel`. Drive slowly and cover the environment with
overlapping observations; teleop does not avoid collisions.

### Verify the pipeline

```bash
ros2 topic hz /scan_merged                            # should tick
ros2 node info /slam_toolbox | grep -A6 Subscribers   # must show /scan_merged
ros2 topic info /map --verbose                        # Publisher count MUST be 1
```

Check the merged scan has no self-hits - the shortest reading should be a real
distance, not the ~0.2-0.4 m of the robot's own body:

```bash
ros2 topic echo /scan_merged --once --field ranges | tr ',' '\n' | grep -v inf | sort -n | head -5
```

### Save the map

SLAM must still be running - the map lives only in SLAM's memory until saved.

```bash
ros2 run nav2_map_server map_saver_cli -f ~/amr-x/robotics/navigation/maps/<map_name>
```

This writes `<map_name>.pgm` and `<map_name>.yaml`. Open the `.pgm` and confirm
crisp, single-line walls before trusting it. Only stop SLAM after the save
succeeds. If two saves in a row differ, check `ros2 topic info /map --verbose` -
a second publisher (Nav2's map_server) means you are saving whichever map won
the race.

---

## Navigating a saved map

`nav2.launch.py` starts the scan pipeline **and** the full Nav2 + localisation
stack. Do not run SLAM at the same time.

```bash
# Terminal 1 - simulation
ros2 launch bringup simulation.launch.py environment:=hospital

# Terminal 2 - scan pipeline + Nav2 + AMCL + map_server (+ keepout + mission server)
ros2 launch navigation nav2.launch.py \
  map:=$(ros2 pkg prefix navigation)/share/navigation/maps/Hospital_map.yaml \
  keepout_filter:=hospital
```

`$(ros2 pkg prefix navigation)/share/navigation/maps/...` resolves through the
installed package, so it works on any machine. An absolute path also works; a
relative path does not.

In RViz:

1. Click **2D Pose Estimate** and click-drag at the robot's real location, in
   the direction it is facing. Until you do this AMCL is not localised, there is
   no `map` frame, and the costmaps time out.
2. Confirm the live scan snaps onto the mapped walls and the particle cloud
   tightens. That - not the pose numbers - is proof of good localisation.
3. Click **Nav2 Goal** for a destination, or command the robot programmatically
   (below).

Useful arguments:

```
map:=<path>.yaml                # map to navigate (absolute, or via pkg prefix)
keepout_filter:=hospital        # load maps/hospital_keepout.yaml ("none" = off)
rviz:=false                     # no RViz
scan_pipeline:=false            # don't start filters/merger (if run elsewhere)
params_file:=<path>.yaml        # different Nav2 parameters
blank*_deg_LIDAR1/2:=<deg>      # tune the self-hit wedges
```

---

## Commanding the robot

Once `nav2.launch.py` is running, the **mission server** (`/mission_server`) is
up and listening. It is the programmatic way to drive the robot - the same
interface a dashboard would use, built entirely on standard message types
(except the one custom `SaveStation` service).

| direction | name | type | purpose |
|---|---|---|---|
| send | `/mission/go_to_station` | `std_msgs/String` | drive to a named station |
| send | `/mission/go_to_pose` | `geometry_msgs/PoseStamped` | drive to a raw map coordinate |
| listen | `/mission/status` | `std_msgs/String` | progress, arrival, parking error, refusals |
| call | `/mission/cancel` | `std_srvs/Trigger` | cancel the goal in progress |
| call | `/mission/save_station` | `navigation_msgs/SaveStation` | record the current pose as a station |

Watch the robot (leave open in its own terminal):

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

Every goal is checked against the global costmap **before** being sent. A goal
on a wall, an obstacle, or inside a keepout zone is refused instantly (the status
says why) rather than letting Nav2 spin through recovery behaviours for several
seconds first.

For quick hand-testing, `go_to_goal.py` does a single coordinate goal from the
command line, with a progress bar:

```bash
python3 navigation/scripts/go_to_goal.py 2.0 8.0        # x y
python3 navigation/scripts/go_to_goal.py 2.0 8.0 90     # x y yaw(deg)
```

---

## Stations

A **station** is a named pose the robot has physically stood at, e.g. `pharmacy`
-> (x, y, yaw). Missions are then expressed as names instead of coordinates,
which is what a task ("go to the pharmacy, the arm takes over") actually needs.

Because a station is captured from the robot's *live* pose, it is guaranteed
reachable and clear of obstacles - you cannot define one inside a wall, because
the robot could not have stood inside a wall.

**To save one:** drive the robot to the spot, confirm it is well localised (scan
on the walls), then:

```bash
ros2 service call /mission/save_station navigation_msgs/srv/SaveStation "{name: 'pharmacy'}"
```

The service replies with the stored pose. Stations live in `config/stations.yaml`
as plain, hand-editable YAML, re-read on every request:

```yaml
stations:
  pharmacy:
    x: 2.34
    y: 8.91
    yaw: 1.57
```

**Where stations.yaml lives (important).** The `stations_file` launch argument
must point at the **source** tree
(`~/amr-x/robotics/navigation/config/stations.yaml`), NOT into `install/`, which
`colcon build` regenerates - stations saved there are wiped on the next build.
Check which file the running node uses:

```bash
ros2 param get /mission_server stations_file
```

---

## Keepout zones

A 2D LiDAR scans one horizontal plane, so it detects obstacles but **cannot
detect the absence of floor**. Downward stairs read as free space: the robot
drives to the edge, gets stuck, and because the wheels keep turning odometry
keeps reporting motion, which corrupts the map. The hospital world has two such
stairwells.

Keepout zones are the Nav2 mechanism for hazards the sensors cannot perceive.
They constrain planning only; the map itself stays truthful, so AMCL still
localises against real geometry.

A zone set is two files in `maps/`, named `<name>_keepout.yaml` + `.pgm`,
selected with `keepout_filter:=<name>`. `keepout_filter:=none` (the default)
disables them - correct for a map that has no mask, since a mask is aligned to
one specific map's origin.

### Creating a mask for a new map

1. Make an image the **same pixel dimensions** as the map, all white (254), with
   the forbidden areas painted **black (0)**. It is a blank canvas, not a copy
   of the map - it carries one piece of information only.
2. Write `<name>_keepout.yaml` with `resolution` and `origin` **identical** to
   the map's yaml. That is the only thing aligning them; if they differ, the
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

---

## Odometry and robot geometry

Localisation quality depends on two numbers in
`robot_description/urdf/amr_2lidar.urdf.xacro`:

| property | value | how it was obtained |
|---|---|---|
| `wheel_radius` | 0.080 | measured from `DL_Link.STL` (0.16 m diameter) |
| `wheel_separation` | 0.541 | measured from the wheel meshes, **not** joint origins |

**Do not read `wheel_separation` off the joint origins.** The SolidWorks export
places each wheel mesh offset by -0.0189 m *inside* its joint, so the origins
(+/-0.289353) imply 0.5787 - but the true track is
2 x (0.289353 - 0.0189) = 0.541. Using 0.5787 makes the robot physically rotate
faster than odometry reports, so the scan drifts off the map during every turn.

Verify odometry against **ground truth**, never against the commanded velocity:
the controller and odometry use the same parameter, so an error cancels and is
invisible in that comparison.

```bash
ros2 run tf2_ros tf2_echo odom base_footprint > /tmp/odom.txt
ros2 run tf2_ros tf2_echo map  base_footprint > /tmp/true.txt
# spin in place several turns, then compare total yaw over the same window
```

---

## Implemented configuration

| Function | Current implementation |
|---|---|
| Mapping | SLAM Toolbox, online asynchronous mode |
| Saved-map localisation | Nav2 map_server + AMCL |
| Behaviour-tree navigation | `NavigateToPose` and `NavigateThroughPoses` |
| Local controller | Nav2 **MPPI** controller |
| Global planner | NavFn planner |
| Local obstacle data | Voxel layer consuming `/scan_merged` |
| Global obstacle data | Static + obstacle + inflation layers, plus keepout filter |
| Scan input | Dual-LiDAR self-hit filter + merger -> `/scan_merged` |
| Recovery behaviours | Spin, back up, drive on heading, assisted teleop, wait |
| Command conditioning | Velocity smoother + collision monitor |
| Mission interface | `mission_server_node` (topics/services), named stations |
| Frames | `map`, `odom`, `base_link`, `base_footprint`, LiDAR frames |

Primary configuration: `config/nav2_params.yaml` (navigation) and
`config/nav2_mapping_params.yaml` (mapping). SLAM parameters: `slam_params.yaml`.

---

## Spawning obstacles and actors (hospital simulation)

The hospital world can be populated with 19 static "unmapped" obstacles
(furniture the SLAM map does not know about, to stress-test local obstacle
avoidance) and 16 dynamic pedestrian actors (local wander loops). These are
spawned into an already-running simulation with two scripts, not baked into the
world file.

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

`scripts/` and `actors/` are committed (plain text, small). `assets/` is fetched
by each teammate and should be in `.gitignore` - the Fuel model meshes/textures
live there and are pulled from an external repo, not stored in this one.

### First time only (after cloning)

```bash
cd ~/amr-x/robotics/navigation/test/scripts
chmod +x fetch_assets.sh spawn_obstacles.sh spawn_actors.sh
./fetch_assets.sh
```

This clones the AWS RoboMaker hospital asset pack and downloads the 20 Fuel
models the obstacles use, into `../assets/hospital_assets/fuel_models`. Only
needs to run once per machine - it does not need to repeat for every sim launch,
and does not need to run again after a normal `git pull` unless the model list
itself changes.

### Every time you want obstacles/actors in a running sim

With the `hospital` world already launched (`ros2 launch bringup
simulation.launch.py environment:=hospital`), open a new terminal:

```bash
cd ~/amr-x/robotics/navigation/test/scripts
./spawn_obstacles.sh
./spawn_actors.sh
```

Each `.sh` calls `ros2 run ros_gz_sim create` once per entity (one obstacle or
actor per call - there is no single command that spawns all of them at once).
Both scripts locate their own directory automatically
(`$(dirname "${BASH_SOURCE[0]}")`), so they work regardless of where the repo is
cloned or which machine runs them - no hardcoded paths or usernames to edit.

Spawning is **not persistent**: closing or restarting the Gazebo world clears
everything spawned this way, and both scripts must be rerun. This is a deliberate
tradeoff versus baking the obstacles into the world file - faster to iterate on,
but must be re-run per session.

---

## Troubleshooting

**You changed something and behaviour did not change.** Check the *installed*
copy, not your source - nodes run from `install/`:

```bash
diff ~/amr-x/robotics/navigation/launch/nav2.launch.py \
     $(ros2 pkg prefix navigation)/share/navigation/launch/nav2.launch.py
```

If they differ, rebuild:

```bash
cd ~/amr-x/robotics
rm -rf build/navigation install/navigation
colcon build --symlink-install --packages-select navigation
source install/setup.bash
```

**Old nodes still running.** A running node keeps its old code and parameters
until killed. Before re-testing a change:

```bash
pkill -9 -f scan_filter; pkill -9 -f scan_merger
pkill -9 -f slam_toolbox; pkill -9 -f component_container; pkill -9 -f rviz2
sleep 3
ros2 node list
```

A `WARNING: ... nodes share an exact name` means a duplicate survived and
results cannot be trusted.

**Launch arguments seem ignored.** Check what the nodes actually received:

```bash
rm -f /tmp/launch_params_*        # clear old runs first
# ...launch...
cat /tmp/launch_params_*
```

If your values are not there, the launch never got them. A common cause is a
backslash followed by a space when splitting a command over lines - put the
whole command on one line.

**Robot does not move / no map in RViz / `Invalid frame ID "map"`.** The `map`
frame only exists once localisation publishes `map -> odom`.

- `ros2 topic echo /map --once --field info` should print width/height.
- `ros2 lifecycle get /map_server` should be `active`.
- Set the **2D Pose Estimate** in RViz.

**Scan drifts off the walls whenever the robot moves.** Localisation, not the
scan. If it happens at any speed and does not recover, check `wheel_separation`
(see Odometry). If it only happens during motion and snaps back at rest, lower
AMCL's `update_min_d` / `update_min_a` (both 0.05 here).

**Map drifts or rebuilds itself rotated during mapping.** Usually turning too
fast for the scan matcher. `wz_max` in the controller parameters caps rotation
speed; 0.5 rad/s maps reliably. Also confirm the merged scan has no self-hits.

**Planner routes through walls it has not driven past.** The global costmap has
no `static_layer` - you are running navigation with the mapping parameter file.

**Robot stops in narrow corridors.** `inflation_radius` too large - the halos
from both walls meet in the middle. Lower it (a bit above the footprint
half-width) and raise `cost_scaling_factor`.

**A map or mask will not load.** The `.yaml` `image:` line must match the actual
`.pgm` filename in the same folder. It is resolved relative to the yaml's
directory, so use a bare filename; rename a map -> rename **both** files and
update that line.

**Two publishers on `/map`.** SLAM and Nav2's map_server are both running. One
localiser at a time.

**`KeepoutFilter: Filter mask was not received`.** The filter servers are not
running - either `keepout_filter:=` was not passed, or `filter_mask_server`
failed to load its mask (check the launch terminal for a `map_io` error).

**`unknown station 'X'`.** The mission server is reading a different
`stations.yaml` than the one your save wrote to. Check
`ros2 param get /mission_server stations_file`.

**"Unknown package" for something you just built** (especially a `_msgs`
package). Either you did not re-source, or it built as ROS 1 catkin instead of
ament. Check `colcon list | grep <pkg>` - it must say `ros.ament_cmake`, not
`ros.catkin`. If catkin, the `package.xml` is missing its
`<export><build_type>ament_cmake</build_type></export>`.

**A change is ignored no matter what you do - check which copy you are running.**
More than one workspace on the path means you cannot know which copy of a package
a command resolves to. A 5-second check that catches a whole class of problems:

```bash
echo $AMENT_PREFIX_PATH | tr ':' '\n'    # should be ONLY this workspace + /opt/ros/jazzy
ros2 pkg prefix navigation                # which copy is being used
```

---

## Current validation gaps

- No dedicated camera, object-detection, docking-vision, or perception package
  yet; the only obstacle input is the simulated 2D LiDAR consumed by the Nav2
  costmaps.
- The costmap footprint and sensor placement must stay synchronised with the
  final mechanical geometry. Attaching a module changes mass, centre of gravity,
  and footprint, and will degrade odometry and controller tuning calibrated for
  the bare robot - this is not yet handled.
- Tuning still needs repeatable, recorded evidence for narrow aisles, blocked
  routes, localisation loss/recovery, and precise parking (station repeatability
  has not been measured).
- The `docking_server` configuration present in the params is not evidence of a
  completed physical docking system.
- Real sensor noise, wheel slip, timing, and embedded odometry have not replaced
  simulated data. Only rotation odometry has been verified against ground truth;
  translation has not been cleanly measured.