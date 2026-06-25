# Electrical Component Selection Report

This report documents the selected electrical, computing, sensing, safety, power, and motion components for the AMR Prototype V1.
Below is an overview of the components selected based on the latest approved requirements. Details of each one are available in the full report.

## Summary: Component Selection Overview

| # | Component | Qty | Selected Model | Cost (TND) | Lead |
|---|-----------|-----|----------------|------------|------|
| **COMPUTING UNIT** ||||| |
| 1 | Main Computer | 1 | NVIDIA Jetson Orin Nano | 1500--2000 | 2--4w |
| 2 | Microcontroller | 1 | STM32 Nucleo-F446RE | 90--130 | 1w |
| **SENSORS** ||||| |
| 3 | LiDAR Scanner | 1 | RPLIDAR A2M12 | 1200--1600 | 1w |
| 4 | Depth Camera | 1 | Intel RealSense D435i | 2000--3000 | 2w |
| 5 | IMU (9-axis) | 1 | BNO055 | 100--120 | 1--2w |
| 6 | RGB Camera | 1 | Logitech C920 HD Pro | 500 | <1w |
| 7 | Proximity Sensors | 4 | Industrial Ultrasonic M18 | 20--50 each | 1w |
| 8 | Wheel Encoders | 2 | Omron E6B2-CWZ6C (optional) | 500--700 each | 1--2w |
| **SAFETY SYSTEM** ||||| |
| 9 | Emergency Stop | 1 | Schneider XB2-BS542 | 10--20 | <1w |
| 10 | Safety Relay | 1 | Pilz PNOZ X2.8P | 600--900 | 2--3w |
| 11 | Warning Beacon | 1 | AD22-22MSD LED+Alarm | 10 | <1w |
| **POWER SYSTEM** ||||| |
| 12 | Battery Pack | 1 | LiFePO4 24 V 20 Ah (UPGRADED) | 1800--2200 | 2--4w |
| 13 | Main Fuse (80 A) | 1 | ANL 80 A + holder | 50 | <1w |
| 14 | Motor Fuse (30 A) | 1 | ANL 30 A | 20 | <1w |
| 15 | Compute Regulator | 1 | XL4005 buck conv. (24 → 12 V) | 80--120 | <1w |
| 16 | Sensor Regulator | 1 | HLK-5M05 buck conv. (24 → 5 V) | 100--150 | <1w |
| 17 | Wiring/Connectors | --- | 4/6/8/10 AWG + XT90 | 200--250 | <1w |
| 18 | Capacitors/EMI | --- | 100 μF × 3 + ferrite clamps | 50 | <1w |
| **MOTION SYSTEM (UPDATED)** ||||| |
| 19 | Drive Motor (EC45) | 2 | Maxon EC 45 Flat 70 W @ 24 V | 700--900 each | 2--4w |
| 20 | Planetary Gearbox | 2 | Maxon GP 42C 33:1 | 900--1200 each | 2--4w |
| 21 | Flexible Couplings | 2 | Oldham or jaw type | 160--200 each | 1--2w |
| 22 | Motor Driver | 1 | Pololu VNH5019 dual | 220--300 | 1--3w |
| 23 | Drive Wheels | 2 | 180 mm solid rubber | 60--120 each | 1--2w |
| 24 | Caster Wheels | 2 | ROUE PIVOTANTE FREIN LISS 80 AVO | 26 each | 1--2w |

### Total Estimated Cost

**11200--18000 TND**

## Full Report

Build from the repository root:

```bash
bash tools/build_reports.sh
```

Generated PDF:

```text
build/Preliminary_component_selection/Preliminary_component_selection.pdf
```
