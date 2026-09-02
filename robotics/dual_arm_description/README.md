# dual_arm_description

URDF/xacro description of the dual-arm module (two 7-joint arms mounted on a
shared rack/base mechanism), originally exported from SolidWorks and adapted
for portability and correct simulation behavior.

## Contents

- `urdf/dual_arm.urdf.xacro` — full robot description: base (`pinion`, `rack`,
  `robot_base`), left arm (`shoulder1_joint` → `wrist_joint`, 7 joints), right
  arm (`shoulderR_joint` → `wristR_joint`, 7 joints), plus the embedded
  `ros2_control` hardware interface block.
- `launch/dual_arm_display.launch.py` — RViz-only visualization (no physics):
  `robot_state_publisher` + `joint_state_publisher_gui` + RViz.
- `rviz/dual_arm_display.rviz` — saved RViz layout (RobotModel + TF, Fixed
  Frame `world`).
- `config/dual_arm_params.yaml` — joint limits for both arms and the base
  mechanism, collected centrally from the URDF for reference.

## Origin and known issues fixed

This package started as a direct SolidWorks-to-URDF export
(`dual_arm.urdf`). The following issues were found and fixed after pulling
the branch:

1. **Hardcoded absolute file paths.** Every mesh reference and the Gazebo
   controller-plugin parameter path used a machine-specific absolute path
   (`/home/ubuntu/robot_ws/...`), which only resolved on the original
   author's machine. Fixed by converting to `.urdf.xacro` and using
   `$(find dual_arm_description)/...` / `$(find dual_arm_control)/...`
   instead, resolved dynamically at launch. No link or joint names were
   changed during this conversion, to avoid breaking
   `dual_arm_controllers.yaml` or `dual_arm_trajectory_node.py`, both of
   which reference these names directly.


2. **Insufficient joint effort limits for the exported masses.** The arm
   collapsed under gravity and oscillated after reaching commanded
   positions. Root cause: some links (e.g. `shoulder_1` at ~54 kg,
   `robot_base` at ~180 kg) require close to or more than their declared
   100 N·m effort limit just to hold position against gravity, leaving no
   margin for control correction. Raising effort limits on the shoulder
   joints (tripled on the heaviest, roughly doubled on lighter ones)
   resolved the falling/oscillation immediately — confirming this was a
   torque-capacity issue, not a PID tuning issue.

   **This is flagged to the mechanical team as an open question:** are
   these masses intentional (a genuinely heavy-duty arm), or a SolidWorks
   default-material-density artifact that should be corrected at the CAD
   source? The current effort-limit increase is a working diagnostic fix,
   not a final, hardware-justified value.

## Usage

Visualization only, no Gazebo:
```bash
ros2 launch dual_arm_description dual_arm_display.launch.py
```

Full Gazebo simulation with controllers (see `dual_arm_control`):
```bash
ros2 launch dual_arm_control dual_arm_gazebo.launch.py
```

Run the test trajectory sequence (moves both arms through home → two test
poses → home):
```bash
ros2 run dual_arm_control dual_arm_trajectory_node.py
```

## Status

Builds cleanly, visualizes correctly in RViz, and runs in Gazebo without
collapsing or oscillating. Trajectory execution confirmed end-to-end for
both arms. No MoveIt configuration yet — planned as the next step.