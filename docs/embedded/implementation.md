# Embedded and Electrical Implementation Status

## Current status

The repository currently contains electrical design folders, requirements,
candidate-component research, and a simulated drive configuration. It does not
contain embedded firmware, a micro-ROS application, a CAN driver, a serial
protocol implementation, a production wiring design, or a real-hardware
`ros2_control` interface.

Accordingly, there is no embedded build, flash, or hardware run command yet.

## What exists today

| Area | Repository evidence | Status |
|---|---|---|
| Electrical architecture | `electrical/` subsystem README files | Design outline |
| Candidate components | `data/components/component_candidates.csv` and preliminary reports | Research; not proof of final selection |
| Shared module connector direction | `modules/common_interface/electrical/` | Interface guidance |
| Simulated drive | Gazebo DiffDrive plugin through robot Xacro | Working in simulation only |
| Alternative base controller parameters | `robotics/control/config/diff_drive_controller.yaml` | Configuration only |
| Sensor topics | Simulated `/scan`, `/imu`, `/odom`, and `/joint_states` | Working in the digital twin |
| Hardware driver | No source package present | Not implemented |
| Firmware | No firmware project present | Not implemented |
| Hardware safety chain | Requirements and design notes only | Not implemented or verified |

Preliminary reports mention possible microcontrollers, compute units, motor
drivers, and communication approaches. Treat these as candidates until the
controlled interface and component records explicitly approve a selection.

## Simulation versus physical implementation

| Capability | Simulation path | Physical path required |
|---|---|---|
| Velocity command | `/cmd_vel` to Gazebo DiffDrive plugin | Command-authority layer to real drive controller |
| Wheel feedback | Simulated joint/odometry output | Encoder capture, timestamping, calibration, and fault detection |
| IMU and LiDAR | Gazebo sensor plugins | Device drivers, synchronization, transforms, diagnostics, and power design |
| Odometry | Simulator output | Wheel/IMU fusion using measured hardware data |
| Emergency stop | Not a production safety chain | Independent hardware circuit with verified safe state |
| Module connection | Simulated/software concepts | Presence, lock, power, communication, isolation, and interlocks |

## Required embedded architecture

```text
ROS 2 / Nav2 / Mission Manager
            │ bounded commands and state
            ▼
Real-hardware ros2_control interface or device gateway
            │ versioned protocol
            ▼
Embedded controller
    ├── motor command and feedback
    ├── encoder acquisition
    ├── battery and power monitoring
    ├── module presence and lock sensing
    ├── watchdog and communication-loss handling
    └── diagnostic and fault state

Independent safety chain
    └── emergency stop, drive inhibit, braking, and protected power isolation
```

The independent safety chain must remain effective if ROS 2, the dashboard,
the HMI, networking, or the embedded application fails.

## Firmware deliverables needed before a run guide exists

- Selected controller and supported toolchain.
- Versioned repository directory for firmware source and configuration.
- Pin, timer, bus, and peripheral allocation.
- Motor command, encoder, sensor, power, and fault drivers.
- Defined communication protocol with units, ranges, timestamps, sequence
  handling, timeouts, and compatibility version.
- Watchdog, startup, degraded, stop, and fault state machine.
- Bootloader/update and configuration strategy.
- Bench tests and hardware-in-the-loop validation.
- A real ROS 2 hardware interface or device gateway with diagnostics.

## Proposed bring-up sequence

This is a validation order, not a runnable procedure yet:

1. Verify protected power rails and emergency-stop behavior without autonomy.
2. Bring up the controller with outputs inhibited and validate diagnostics.
3. Validate one encoder and one motor channel on a restrained bench.
4. Validate closed-loop wheel speed and communication-loss behavior.
5. Integrate the ROS 2 hardware interface with wheels lifted or restrained.
6. Validate low-speed base motion in a controlled area.
7. Add sensors, localization, and navigation only after base stop behavior is
   repeatable.
8. Add module power and actuation only after presence, lock, isolation, and
   fault handling are verified.

## Real-hardware ROS 2 entry point

The existing `diff_drive_controller.yaml` can inform a future controller
configuration, but it is not sufficient on its own. A hardware plugin must
export wheel command and state interfaces, enforce communication timeouts, and
report hardware faults. The final wheel geometry and limits must come from
controlled mechanical and safety data rather than being copied blindly from a
simulation parameter file.

## Commands available today

Only the simulated path can currently be run:

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 launch bringup simulation.launch.py
```

There is no honest firmware compilation or flashing command to provide until
the missing implementation is committed.
