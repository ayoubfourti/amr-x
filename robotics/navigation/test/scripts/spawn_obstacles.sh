#!/bin/bash
# Spawns all static unmapped obstacles into the running "hospital" world.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets/hospital_assets/fuel_models"
export GZ_SIM_RESOURCE_PATH="$ASSETS_DIR:$GZ_SIM_RESOURCE_PATH"

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/TrolleyBed/model.sdf" \
  -name unmapped_block_1_TrolleyBed -x 4.83 -y -21.23 -z 0 -Y 2.9

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/PatientWheelChair/model.sdf" \
  -name unmapped_block_2_PatientWheelChair -x 3.93 -y -27.58 -z 0 -Y -2.95

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/InstrumentCart1/model.sdf" \
  -name unmapped_block_3_InstrumentCart1 -x 11.23 -y -29.63 -z 0 -Y -2.53

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/IVStand/model.sdf" \
  -name unmapped_block_4_IVStand -x -10.62 -y 1.12 -z 0 -Y -0.12

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/BedTable/model.sdf" \
  -name unmapped_block_5_BedTable -x -9.12 -y -1.78 -z 0 -Y -0.53

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/StorageRack/model.sdf" \
  -name unmapped_clutter_1_StorageRack -x 11.53 -y -20.08 -z 0 -Y -0.11

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/MetalCabinet/model.sdf" \
  -name unmapped_clutter_2_MetalCabinet -x 1.33 -y -0.68 -z 0 -Y -1.79

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/SurgicalTrolley/model.sdf" \
  -name unmapped_clutter_3_SurgicalTrolley -x -3.12 -y -22.13 -z 0 -Y 2.28

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/BPCart/model.sdf" \
  -name unmapped_clutter_4_BPCart -x -3.92 -y -9.48 -z 0 -Y 1.39

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/Chair/model.sdf" \
  -name unmapped_clutter_5_Chair -x -0.52 -y -26.68 -z 0 -Y -0.65

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/MopCart3/model.sdf" \
  -name unmapped_clutter_6_MopCart3 -x 7.68 -y -32.78 -z 0 -Y -2.57

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/Chair/model.sdf" \
  -name unmapped_clutter_7_Chair -x 3.18 -y -4.43 -z 0 -Y -2.49

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/WhiteChipChair/model.sdf" \
  -name unmapped_clutter_8_WhiteChipChair -x 11.63 -y -11.38 -z 0 -Y -1.45

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/Drawer/model.sdf" \
  -name unmapped_clutter_9_Drawer -x 8.93 -y -4.53 -z 0 -Y -0.48

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/InstrumentCart2/model.sdf" \
  -name unmapped_clutter_10_InstrumentCart2 -x 7.73 -y -1.13 -z 0 -Y -0.24

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/BedsideTable/model.sdf" \
  -name unmapped_clutter_11_BedsideTable -x -6.57 -y 16.12 -z 0 -Y -2.21

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/ParkingTrolleyMin/model.sdf" \
  -name unmapped_clutter_12_ParkingTrolleyMin -x 0.78 -y -28.43 -z 0 -Y 1.42

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/CGMClassic/model.sdf" \
  -name unmapped_clutter_13_CGMClassic -x -10.17 -y -3.78 -z 0 -Y 0.81

ros2 run ros_gz_sim create -world hospital \
  -file "$ASSETS_DIR/AnesthesiaMachine/model.sdf" \
  -name unmapped_clutter_14_AnesthesiaMachine -x -8.47 -y 16.37 -z 0 -Y 1.27
