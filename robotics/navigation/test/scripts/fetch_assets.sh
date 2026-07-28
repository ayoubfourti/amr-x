#!/bin/bash
# Run once after cloning the repo. Downloads all Fuel models used by the
# AMR-X hospital sim (static obstacles) into a repo-local path so paths are
# the same for every teammate.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets"
mkdir -p "$ASSETS_DIR"

if [ ! -d "$ASSETS_DIR/hospital_assets" ]; then
  git clone -b ros1 https://github.com/aws-robotics/aws-robomaker-hospital-world.git "$ASSETS_DIR/hospital_assets"
fi

cd "$ASSETS_DIR/hospital_assets"
pip3 install -r requirements.txt --break-system-packages

python3 fuel_utility.py download \
  -m IVStand -m PatientWheelChair -m TrolleyBed -m InstrumentCart1 \
  -m MetalCabinet -m BedsideTable -m BedTable -m StorageRack -m Chair \
  -m XRayMachine -m BPCart -m AnesthesiaMachine -m SurgicalTrolley \
  -m InstrumentCart2 -m MopCart3 -m Drawer -m WhiteChipChair \
  -m CGMClassic -m ParkingTrolleyMin -m BloodPressureMonitor \
  -d fuel_models --verbose

echo ""
echo "Done. Add this to your shell profile or launch script:"
echo "export GZ_SIM_RESOURCE_PATH=$ASSETS_DIR/hospital_assets/fuel_models:\$GZ_SIM_RESOURCE_PATH"
