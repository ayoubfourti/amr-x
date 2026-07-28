#!/bin/bash
set -e

WS_DIR="$HOME/amr-x"
source "$WS_DIR/install/setup.bash"
export IGN_GAZEBO_RESOURCE_PATH=$IGN_GAZEBO_RESOURCE_PATH:$WS_DIR/robotics/simulation/models

echo "================================================"
echo "  AMR-X Docking Demo — Gazebo Launch"
echo "================================================"

echo "[1/4] Generating bare robot URDF..."
xacro "$WS_DIR/robotics/robot_description/urdf/amr.urdf.xacro" \
  use_gazebo:=true > /tmp/amr_bare.urdf

echo "[2/4] Generating armed robot URDF..."
xacro "$WS_DIR/robotics/robot_description/urdf/amr_with_arm.xacro" \
  use_gazebo:=true attach_arm:=true > /tmp/amr_armed_full.urdf

echo "[3/4] Fixing arm joints..."
python3 "$WS_DIR/robotics/docking_sim/scripts/fix_armed_urdf.py"

echo "[4/4] Opening Gazebo..."
ign gazebo "$WS_DIR/robotics/simulation/worlds/warehouse_fortress.sdf" -r &
IGN_PID=$!
sleep 5

echo "Spawning robot..."
ros2 run ros_gz_sim create \
  -world amr_warehouse \
  -file /tmp/amr_bare.urdf \
  -name robot \
  -x 2 -y -5.4 -z 0.0

echo "================================================"
echo "  Gazebo ready! Now launch Terminals 2, 3, 4"
echo "================================================"

wait $IGN_PID
