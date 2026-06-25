# Warehouse Models

Custom reusable SDF models for the warehouse can be added here, each in its own
folder with a `model.config` and `model.sdf`. They become available to Gazebo
through the `gazebo_model_path` export declared in `package.xml`.

The default warehouse (`worlds/warehouse.sdf`) is generated procedurally by
`scripts/generate_warehouse.py` and embeds its geometry directly, so no external
models are required to run the demo. Add models here only when you want richer,
reusable assets (e.g. a detailed pallet-rack mesh or a charging dock).
