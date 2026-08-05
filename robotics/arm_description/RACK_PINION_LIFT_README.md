# Dual-Arm Lift (Rack & Pinion) — Status & Notes

_Last updated: 2026-08-05_

This document records the state of the vertical lift mechanism (rack + pinion),
what was changed to get it working in simulation, how to run and verify it, and
one still-open issue with the wrist joints in RViz/MoveIt.

---

## 1. Summary of the problem we solved

The lift is a **rack-and-pinion**: a rotary `pinion_joint` (revolute) that drives
a linear `rack_joint` (prismatic). The prismatic `rack` carries `robot_base`
(~181 kg) plus both arms — **~474 kg total** hanging on the lift.

Two original symptoms:

- **`rack_joint` would not move** under any command (position or effort),
  frozen bit-for-bit at 0.
- **`pinion_joint` spun freely on its own** at simulation start.

### Root causes found

1. **The rack and pinion were never mechanically coupled.** In the original URDF
   they were two independent sibling joints off `base_link` — nothing tied pinion
   rotation to rack translation. Turning the pinion did nothing to the rack; the
   pinion, being light and unactuated, free-spun from any tiny disturbance.

2. **Force/limit budget.** The rack carries ~474 kg → ~4646 N just to hold it
   against gravity along its vertical axis. The original effort limit (5000 N) and
   test forces (3000 N) were at or below the holding load, so the joint sat pinned
   at its upper limit (exactly 0) — hence "frozen at zero."

---

## 2. What we changed

### 2.1 Coupled the rack to the pinion with a mimic constraint
A real rack-and-pinion is a **kinematic coupling**:
`rack_position = multiplier x pinion_angle`. This is expressed as a **mimic joint**.

- **Gear ratio (multiplier):** derived from the pinion mesh (`pinion.STL`).
  - Measured: 16 teeth, module = 7 mm, **pitch radius = 56 mm = 0.056 m**.
  - Multiplier = pitch radius = **0.056 m/rad** (sign flipped to **-0.056** to get
    the correct travel direction — see below).

- **`dual_arm.urdf.xacro` — `rack_joint` (prismatic):** added
  `<mimic joint="pinion_joint" multiplier="-0.056" offset="0.0"/>`
  and removed its independent command interface. The rack is now a mimic — it has
  **state interfaces only** and is driven entirely by the pinion.

- **`<ros2_control>` block — `rack_joint`:** now declares
  `<param name="mimic">pinion_joint</param>` +
  `<param name="multiplier">-0.056</param>` with state interfaces only
  (NO command interface — mimic joints may not have one).

- **`<ros2_control>` block — `pinion_joint`:** the driven joint, keeps a
  **position** command interface with PID params.

### 2.2 Switched the physics engine to Bullet-Featherstone
Mimic constraints are **not supported by DART** (Gazebo's default engine); it
printed `physics engine does not support mimic constraints` and silently dropped
the coupling. Bullet-Featherstone supports mimic (rotary→prismatic) constraints.

- **`dual_arm_gazebo.launch.py`:** Gazebo is now started with
  `gz_args: '-r empty.sdf --physics-engine gz-physics-bullet-featherstone-plugin'`.

### 2.3 Added a controller for the pinion
- **`dual_arm_controllers.yaml`:** added `pinion_position_controller`
  (`position_controllers/JointGroupPositionController`) acting on `pinion_joint`
  only (the rack follows via mimic). `rack_effort_controller` and the old custom
  rack PID node are no longer used.
- **`dual_arm_gazebo.launch.py`:** added a spawner for
  `pinion_position_controller` so it comes up automatically on every launch
  (previously it had to be spawned by hand, which caused repeated
  "frozen / unclaimed interface" confusion).

### 2.4 Limits & gains (current values)
- **`pinion_joint` limit:** `lower="0.0" upper="7.2" effort="1000" velocity="20.0"`
  (positive travel, because the multiplier is negative — command **positive**
  pinion angles to lift).
- **`pinion_joint` PID:** `p=1500, i=200, d=10` (tuned to lift the ~474 kg load
  without integral windup; large `i` values (e.g. 1500) caused windup/freeze).
- **`rack_joint` limit:** `lower="-0.40" upper="0" effort="15000" velocity="1.0"`.

### Direction note (important)
Multiplier sign and commanded pinion direction **must** land the rack inside its
own `[-0.40, 0]` travel:
- multiplier = **-0.056**, pinion limit **0.0 .. 7.2**, command **+3.57** →
  rack = -0.056 x 3.57 = **-0.20 m** (valid).
- If they disagree (e.g. negative command with negative multiplier) the mimic
  drives the rack to a positive value outside `[-0.40, 0]`; the two limits
  conflict and the whole thing **locks/freezes**. This is not a tuning problem.

---

## 3. Current status

- Rack-and-pinion coupling **works**: commanding the pinion moves the rack at the
  0.056 ratio, correct direction, within limits. Verified numerically (pinion
  angle x 0.056 == rack position to ~5 sig figs).
- Pinion no longer free-spins (held by its position controller).
- **Known limitation: the lift is SLOW.** It moves correctly but sluggishly.
  Left as-is for now. See "Speed tuning" below for the levers to try next.

### Speed tuning (open — not yet resolved)
The lift is slow because the internal position PID has no gravity feedforward, so
all the holding/lifting torque must come from the integrator. Levers, cheapest
first:
1. **Raise `rack_joint` velocity limit** — currently `velocity="1.0"` (m/s). This
   is a low hard cap that throttles the coupling regardless of gains. Try `5.0`.
2. **Raise pinion `i`** in steps: 200 -> 400 -> 600 -> 800 (rebuild between each,
   watch for overshoot past target = went too far, back off one step).
3. **Confirm pinion `velocity="20.0"`** isn't the bottleneck.
4. **(Physical lever, changes realism)** increase the mimic multiplier magnitude
   (e.g. 0.08–0.10) so the rack moves more per pinion turn — faster for the same
   pinion speed, but no longer matches the real gear's 0.056 pitch radius. If used,
   re-derive the pinion limit as 0.40 / |multiplier|.

---

## 4. How to build

Edit **source** files (not the `install/` copies), then:

```bash
cd ~/amr-x/robotics
colcon build --packages-up-to dual_arm_control dual_arm_moveit_config
source install/setup.bash
```

Every new terminal must `source ~/amr-x/robotics/install/setup.bash` before ROS
commands see the packages.

---

## 5. How to run & verify the lift

### Terminal 1 — launch Gazebo (keep running)
```bash
cd ~/amr-x/robotics
source install/setup.bash
ros2 launch dual_arm_control dual_arm_gazebo.launch.py
```
Check in the log that the mimic error does NOT appear (its absence = Bullet-
Featherstone loaded and the coupling took).

### Terminal 2 — confirm controllers are up
```bash
source ~/amr-x/robotics/install/setup.bash
ros2 control list_controllers
```
Expect all active: `joint_state_broadcaster`, `left_arm_controller`,
`right_arm_controller`, `pinion_position_controller`.

Confirm the pinion command interface is owned:
```bash
ros2 control list_hardware_interfaces | grep pinion
# pinion_joint/position ... [claimed]
```

### Terminal 2 — command the lift (publish continuously)
```bash
ros2 topic pub -r 20 /pinion_position_controller/commands \
  std_msgs/msg/Float64MultiArray "{data: [3.57]}"
```
- `+3.57` rad pinion  ->  rack ~= **-0.20 m** (half travel).
- Full travel: `+7.14` rad  ->  rack ~= **-0.40 m**.
- `0.0`  ->  rack at top (0).

### Terminal 3 — watch it move (numbers, since motion is slow to see)
```bash
watch -n 1 'ros2 topic echo /joint_states --once 2>/dev/null | grep -A2 "^position"'
```
`pinion_joint` should climb toward the target and `rack_joint` should track at
`-0.056 x pinion` and stay within `[-0.40, 0]`. Notes:
- `--once` can miss a sample and print "A message was lost!!!" — harmless (QoS).
- Read joints **by name**; `/joint_states` order is not the URDF order.
- The `effort` column is all `.nan` because no effort **state** interface is
  declared — harmless. Add `<state_interface name="effort"/>` if you want it.

---

## 6. OPEN ISSUE — wrist joints don't move in RViz/MoveIt

**Symptom:** `ros2 launch dual_arm_moveit_config moveit_rviz.launch.py` opens RViz;
the joint sliders named `wrist_joint` and `wristR_joint` move in the GUI but the
robot's wrists do not move, while other joints' sliders DO move the robot.

**Not the cause:** joint naming is consistent — both `wrist_joint` and
`wristR_joint` exist in the URDF and are present in the `<ros2_control>` block, so
it is NOT a name typo/reference error in the URDF for these two joints.

This is a **new, separate issue** from the lift and has NOT been diagnosed yet.
Likely suspects, roughly in order:

1. **MoveIt SRDF group / joint membership.** The wrists may be missing from the
   planning group (or in a group whose controller isn't the one being driven), so
   the RViz slider updates the *MoveIt planning scene* but "Plan & Execute" never
   sends those joints to a real controller. Check
   `dual_arm_moveit_config/config/*.srdf` — confirm `wrist_joint` / `wristR_joint`
   are in the arm groups.
2. **Controller not executing (display-only).** Moving a slider in the MotionPlanning
   panel only changes the *goal state* preview. If you're not clicking
   **Plan & Execute** (or the MoveIt controller isn't wired to
   `left_arm_controller` / `right_arm_controller`), nothing physically moves.
   Check `moveit_controllers.yaml` lists the JointTrajectoryControllers and that
   the wrist joints are in their `joints:` lists.
3. **Joint limits in SRDF/joint_limits.yaml** with the wrist effectively
   zero-range, so it can't be commanded off its current value.
4. **Which RViz:** MoveIt's *MotionPlanning* display (plans then executes) vs the
   *joint_state_publisher_gui* (just republishes joint states for visualization,
   never drives Gazebo). If it's the latter, nothing in Gazebo will ever move — it
   only animates the RViz model.

### First diagnostic steps (next session)
```bash
# Are the arm trajectory controllers active and do they own the wrist interfaces?
ros2 control list_controllers
ros2 control list_hardware_interfaces | grep -i wrist   # expect [claimed]

# Is a trajectory actually being sent when you Execute?
ros2 topic echo /left_arm_controller/joint_trajectory      # (or controller_state)

# Inspect MoveIt config
grep -ri "wrist" ~/amr-x/robotics/dual_arm_moveit_config/config/*.srdf
grep -ri "wrist" ~/amr-x/robotics/dual_arm_moveit_config/config/moveit_controllers.yaml
```
Key question to answer first: **are you clicking "Plan & Execute", and are the wrist
interfaces `[claimed]` by an active arm controller?** That single check separates
"MoveIt display-only" from "controller/SRDF wiring problem."

---

## 7. Files touched
- `dual_arm_description/urdf/dual_arm.urdf.xacro`
  (rack mimic tag, ros2_control rack/pinion blocks, pinion limit + PID)
- `dual_arm_control/config/dual_arm_controllers.yaml`
  (added `pinion_position_controller`; removed rack effort controller)
- `dual_arm_control/launch/dual_arm_gazebo.launch.py`
  (bullet-featherstone engine flag; pinion controller spawner)
