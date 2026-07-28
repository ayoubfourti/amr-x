import re

with open("/tmp/amr_armed_full.urdf", "r") as f:
    content = f.read()

content = re.sub(r'<gazebo>\s*<plugin.*?</plugin>\s*</gazebo>', '', content, flags=re.DOTALL)
content = re.sub(r'<ros2_control.*?</ros2_control>', '', content, flags=re.DOTALL)

joints = [
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
]

for joint in joints:
    content = content.replace(
        f'<joint name="{joint}" type="revolute">',
        f'<joint name="{joint}" type="fixed">'
    )

with open("/tmp/amr_armed_visual.urdf", "w") as f:
    f.write(content)

remaining = len(re.findall('type="revolute"', content))
print(f"  Armed URDF ready (revolute joints left: {remaining})")
