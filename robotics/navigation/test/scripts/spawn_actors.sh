#!/bin/bash
# Spawns all dynamic pedestrian actors into the running "hospital" world.
# Expects actor_*.sdf files committed alongside this script in ../actors/
#
# Each wanderer's SDF trajectory is local/relative (starts and loops at
# 0,0), so the -x/-y below are what actually place it in the world. These
# coordinates are the confirmed-accurate per-actor placements (superseding
# the earlier no-offset version of this script).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTORS_DIR="$SCRIPT_DIR/../actors"

ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_1.sdf"  -name actor_wanderer_1  -x -5.07 -y 14.16  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_2.sdf"  -name actor_wanderer_2  -x 0.08  -y 16.11  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_3.sdf"  -name actor_wanderer_3  -x -7.32 -y 10.41  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_4.sdf"  -name actor_wanderer_4  -x 6.73  -y 10.66  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_5.sdf"  -name actor_wanderer_5  -x -6.18 -y -22.98 -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_6.sdf"  -name actor_wanderer_6  -x 7.93  -y -3.79  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_7.sdf"  -name actor_wanderer_7  -x -5.68 -y -24.88 -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_8.sdf"  -name actor_wanderer_8  -x 9.52  -y -24.78 -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_9.sdf"  -name actor_wanderer_9  -x 0.03  -y 11.92  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_10.sdf" -name actor_wanderer_10 -x 4.52  -y 13.56  -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_11.sdf" -name actor_wanderer_11 -x -4.67 -y 1.57   -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_12.sdf" -name actor_wanderer_12 -x 4.93  -y 1.11   -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_13.sdf" -name actor_wanderer_13 -x -8.98 -y -16.32 -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_14.sdf" -name actor_wanderer_14 -x 7.08  -y -14.89 -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_15.sdf" -name actor_wanderer_15 -x 0.12  -y -24.43 -z 0
ros2 run ros_gz_sim create -world hospital -file "$ACTORS_DIR/actor_wanderer_16.sdf" -name actor_wanderer_16 -x -1.82 -y -27.62 -z 0