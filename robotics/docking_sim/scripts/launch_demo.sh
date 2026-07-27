#!/bin/bash
# launch_demo.sh
# Terminal 1 — Opens Gazebo and spawns robot + arm
# ================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WS_DIR="$HOME/amr-x"

echo "================================================"
echo "  AMR-X Docking Demo — Gazebo Launch"
echo "================================================"

source "$WS_DIR/install/setup.bash"
export IGN_GAZEBO_RESOURCE_PATH=$IGN_GAZEBO_RESOURCE_PATH:$WS_DIR/robotics/simulation/models

echo "[1/4] Generating bare robot URDF..."
xacro "$WS_DIR/robotics/robot_description/urdf/amr.urdf.xacro" \
  use_gazebo:=true > /tmp/amr_bare.urdf

echo "[2/4] Generating armed robot URDF (no plugins, fixed arm joints)..."
xacro "$WS_DIR/robotics/robot_description/urdf/amr_with_arm.xacro" \
  use_gazebo:=true attach_arm:=true > /tmp/amr_armed_full.urdf

python3 - << 'PYEOF'
import re
with open("/tmp/amr_armed_full.urdf", "r") as f:
    content = f.read()

# Remove Gazebo plugins (prevent crash on dynamic spawn)
content = re.sub(r'<gazebo>\s*<plugin.*?</plugin>\s*</gazebo>', '', content, flags=re.DOTALL)
content = re.sub(r'<ros2_control.*?</ros2_control>', '', content, flags=re.DOTALL)

# Fix all arm joints so arm stays upright (no gravity collapse)
for joint in [
    "arm_link1_to_arm_link2",
    "arm_link2_to_arm_link3",
    "arm_link3_to_arm_link4",
    "arm_link4_to_arm_link5",
    "arm_link5_to_arm_link6",
    "arm_link6_to_arm_link6_flange",
    "arm_gripper_controller",
    "arm_gripper_base_to_arm_gripper_left2",
    "arm_gripper_left3_to_arm_gripper_left1",
    "arm_gripper_base_to_arm_gripper_right3",
    "arm_gripper_base_to_arm_gripper_right2",
    "arm_gripper_right3_to_arm_gripper_right1",
]:
    content = content.replace(
        f'<joint name="{joint}" type="revolute">',
        f'<joint name="{joint}" type="fixed">'
    )

with open("/tmp/amr_armed_visual.urdf", "w") as f:
    f.write(content)
print(f"  Armed URDF ready (revolute joints left: {content.count('type=\"revolute\"')})")
PYEOF

echo "[3/4] Opening Gazebo Fortress..."
ign gazebo "$WS_DIR/robotics/simulation/worlds/warehouse_fortress.sdf" -r &
IGN_PID=$!

echo "  Waiting for Gazebo to load (5s)..."
sleep 5

echo "[4/4] Spawning bare robot at x=2, y=-5.4..."
ros2 run ros_gz_sim create \
  -world amr_warehouse \
  -file /tmp/amr_bare.urdf \
  -name amr \
  -x 2 -y -5.4 -z 0.0

echo ""
echo "================================================"
echo "  Gazebo ready!"
echo "  - Robot spawned at x=2, y=-5.4"
echo "  - Arm station at x=10, y=-5.4 (dock station)"
echo "  Now launch Terminal 2, 3, 4"
echo "================================================"

wait $IGN_PID
