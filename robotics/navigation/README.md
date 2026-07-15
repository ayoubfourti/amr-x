# navigation

Nav2 configuration for AMR-X autonomous navigation.

## Contents

- `config/nav2_params.yaml` - tuned Nav2 parameter set (planner, controller,
  costmaps, AMCL, behavior tree). Carried forward from the original planning
  structure; this is real, usable configuration.

## Status

Configuration is ready. Launch files (SLAM mapping + Nav2 bringup) will be added
here once the simulation is validated and a map of the warehouse is produced.

## Planned usage

```bash
# 1. Build a map of the warehouse (after launching the simulation)
ros2 launch slam_toolbox online_async_launch.py use_sim_time:=true

# 2. Bring up Nav2 with this config (for SLAM Mapping)
ros2 launch navigation nav2.launch.py use_sim_time:=true \
     params_file:=$(ros2 pkg prefix navigation)/share/navigation/config/nav2_params.yaml

# 3. Launch AMCL localization on the saved map 
ros2 launch navigation localization.launch.py 
```

The robot publishes `/scan`, `/odom`, and the `odom -> base_footprint` TF from the
simulation, which is exactly what SLAM Toolbox and Nav2 consume.
