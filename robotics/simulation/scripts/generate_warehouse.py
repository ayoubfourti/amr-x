#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  Warehouse world generator
# =============================================================================
# Programmatically builds the procedural AMR-X warehouse SDF world. Generating
# the layout in code (rather than by
# hand) makes the scene easy to reconfigure for different demos and keeps every
# dimension technically consistent with the robot's operation.
#
# Layout produced:
#   - Bounded floor + perimeter walls
#   - Two blocks of storage racks separated by spec-width aisles (>= 1.5 m)
#   - A few obstacles (pallets / boxes) for navigation testing
#   - A LOADING area (green floor patch)
#   - A DELIVERY area (blue floor patch)
#   - A DOCKING area placeholder (yellow floor patch) for future auto-docking
#
# Aisle width default 1.6 m  >= project_specs.json min_aisle_width_m (1.5).
#
# Usage:
#   python3 generate_warehouse.py                 # writes ../worlds/warehouse.sdf
#   python3 generate_warehouse.py --aisle 1.8     # custom aisle width
#   python3 generate_warehouse.py --out /tmp/x.sdf
# =============================================================================

import argparse
import os

# ----------------------------------------------------------------------------
# Small SDF helpers
# ----------------------------------------------------------------------------

def box_model(name, x, y, z, sx, sy, sz, rgba, static=True):
    """A static colored box model (used for walls, racks, pallets, etc.)."""
    r, g, b, a = rgba
    static_tag = "true" if static else "false"
    return f"""
    <model name="{name}">
      <static>{static_tag}</static>
      <pose>{x:.3f} {y:.3f} {z:.3f} 0 0 0</pose>
      <link name="link">
        <collision name="collision">
          <geometry><box><size>{sx:.3f} {sy:.3f} {sz:.3f}</size></box></geometry>
        </collision>
        <visual name="visual">
          <geometry><box><size>{sx:.3f} {sy:.3f} {sz:.3f}</size></box></geometry>
          <material>
            <ambient>{r} {g} {b} {a}</ambient>
            <diffuse>{r} {g} {b} {a}</diffuse>
            <specular>0.1 0.1 0.1 1</specular>
          </material>
        </visual>
      </link>
    </model>"""


def floor_patch(name, x, y, sx, sy, rgba):
    """A thin colored floor patch to mark a functional zone."""
    r, g, b, a = rgba
    return f"""
    <model name="{name}">
      <static>true</static>
      <pose>{x:.3f} {y:.3f} 0.005 0 0 0</pose>
      <link name="link">
        <visual name="visual">
          <geometry><box><size>{sx:.3f} {sy:.3f} 0.01</size></box></geometry>
          <material>
            <ambient>{r} {g} {b} {a}</ambient>
            <diffuse>{r} {g} {b} {a}</diffuse>
          </material>
        </visual>
      </link>
    </model>"""


def rack_block(name, x0, y0, n_bays, bay_len, depth, height, rgba):
    """A run of storage racks (a single long shelf block made of bays)."""
    total_len = n_bays * bay_len
    # represent the rack block as one box (uprights+shelves abstracted for clarity)
    cx = x0 + total_len / 2.0
    return box_model(name, cx, y0, height / 2.0, total_len, depth, height, rgba)


# ----------------------------------------------------------------------------
# World builder
# ----------------------------------------------------------------------------

def build_world(aisle_width=1.6):
    # ----- overall hall size -------------------------------------------------
    hall_len = 24.0      # X
    hall_wid = 16.0      # Y
    wall_h = 3.0
    wall_t = 0.20

    # ----- rack geometry -----------------------------------------------------
    rack_depth = 1.0
    rack_height = 2.2
    bay_len = 1.2
    n_bays = 8
    rack_len = n_bays * bay_len           # 9.6 m

    wall_col = (0.80, 0.80, 0.82, 1.0)
    rack_col = (0.85, 0.55, 0.20, 1.0)    # warehouse-orange shelving
    pallet_col = (0.45, 0.30, 0.15, 1.0)
    box_col = (0.80, 0.70, 0.45, 1.0)

    parts = []

    # ----- perimeter walls ---------------------------------------------------
    hx, hy = hall_len / 2.0, hall_wid / 2.0
    parts.append(box_model("wall_north", 0,  hy, wall_h/2, hall_len, wall_t, wall_h, wall_col))
    parts.append(box_model("wall_south", 0, -hy, wall_h/2, hall_len, wall_t, wall_h, wall_col))
    parts.append(box_model("wall_east",  hx, 0, wall_h/2, wall_t, hall_wid, wall_h, wall_col))
    parts.append(box_model("wall_west", -hx, 0, wall_h/2, wall_t, hall_wid, wall_h, wall_col))

    # ----- storage racks -----------------------------------------------------
    # Two rows of racks, back-to-back pairs, separated by aisles >= spec width.
    # Rows run along X. We place pairs at increasing |Y|, leaving a central
    # main aisle and side aisles all >= aisle_width.
    rack_x_start = -rack_len / 2.0
    # central aisle (robot highway) down the middle (y=0)
    # rack pair 1 centered at +/- (aisle_width/2 + rack_depth/2)
    y1 = aisle_width / 2.0 + rack_depth / 2.0
    # rack pair 2 further out, leaving another aisle of aisle_width between pairs
    y2 = y1 + rack_depth / 2.0 + aisle_width + rack_depth / 2.0

    for sign, tag in ((1, "N"), (-1, "S")):
        parts.append(rack_block(f"rack_{tag}1", rack_x_start, sign * y1,
                                n_bays, bay_len, rack_depth, rack_height, rack_col))
        parts.append(rack_block(f"rack_{tag}2", rack_x_start, sign * y2,
                                n_bays, bay_len, rack_depth, rack_height, rack_col))

    # ----- obstacles for navigation testing ---------------------------------
    # A couple of pallets and a stacked box left in the aisles.
    parts.append(box_model("pallet_1", -3.0, 0.0, 0.075, 1.2, 0.8, 0.15, pallet_col))
    parts.append(box_model("box_on_pallet_1", -3.0, 0.0, 0.45, 0.6, 0.6, 0.6, box_col))
    parts.append(box_model("pallet_2", 4.5, y1 + y2 - y1, 0.075, 1.2, 0.8, 0.15, pallet_col))
    parts.append(box_model("box_stray_1", 1.5, -0.4, 0.2, 0.4, 0.4, 0.4, box_col))

    # ----- functional zones (floor patches + labels via color) --------------
    # Loading area: near the west wall.
    parts.append(floor_patch("zone_loading", -hx + 2.5, 0.0, 3.0, 4.0,
                             (0.15, 0.65, 0.25, 0.6)))    # green
    # Delivery area: near the east wall.
    parts.append(floor_patch("zone_delivery", hx - 2.5, 0.0, 3.0, 4.0,
                             (0.20, 0.45, 0.85, 0.6)))    # blue
    # Future docking area: a corner reserved for auto-docking.
    parts.append(floor_patch("zone_docking_future", hx - 2.0, -hy + 2.0, 2.0, 2.0,
                             (0.90, 0.80, 0.10, 0.6)))    # yellow

    # A simple docking post marker (visual) in the docking zone.
    parts.append(box_model("dock_post", hx - 2.0, -hy + 2.0, 0.25, 0.1, 0.5, 0.5,
                           (0.95, 0.80, 0.10, 1.0)))

    models_block = "\n".join(parts)

    # ----- assemble the world ------------------------------------------------
    world = f"""<?xml version="1.0" ?>
<!-- =========================================================================
     AMR-X warehouse world  (Gazebo Harmonic default world)
     AUTO-GENERATED by simulation/scripts/generate_warehouse.py
     Aisle width: {aisle_width:.2f} m  (spec minimum 1.5 m)
     Edit the generator, not this file, to change the layout.
     ========================================================================= -->
<sdf version="1.8">
  <world name="amr_warehouse">

    <physics name="1ms" type="ignored">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1.0</real_time_factor>
    </physics>

    <!-- Core Harmonic systems -->
    <plugin filename="gz-sim-physics-system"
            name="gz::sim::systems::Physics"/>
    <plugin filename="gz-sim-user-commands-system"
            name="gz::sim::systems::UserCommands"/>
    <plugin filename="gz-sim-scene-broadcaster-system"
            name="gz::sim::systems::SceneBroadcaster"/>
    <!-- Contact + IMU systems so those sensors work if added -->
    <plugin filename="gz-sim-imu-system"
            name="gz::sim::systems::Imu"/>

    <scene>
      <ambient>0.6 0.6 0.6 1</ambient>
      <background>0.8 0.85 0.9 1</background>
      <grid>false</grid>
    </scene>

    <light type="directional" name="sun">
      <cast_shadows>true</cast_shadows>
      <pose>0 0 10 0 0 0</pose>
      <diffuse>0.9 0.9 0.9 1</diffuse>
      <specular>0.2 0.2 0.2 1</specular>
      <direction>-0.5 0.3 -1</direction>
    </light>

    <!-- Ground plane -->
    <model name="floor">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry><plane><normal>0 0 1</normal><size>100 100</size></plane></geometry>
        </collision>
        <visual name="visual">
          <geometry><plane><normal>0 0 1</normal><size>{hall_len:.1f} {hall_wid:.1f}</size></plane></geometry>
          <material>
            <ambient>0.4 0.4 0.42 1</ambient>
            <diffuse>0.5 0.5 0.52 1</diffuse>
          </material>
        </visual>
      </link>
    </model>
{models_block}

  </world>
</sdf>
"""
    return world


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    default_out = os.path.normpath(os.path.join(here, "..", "worlds", "warehouse.sdf"))

    ap = argparse.ArgumentParser(description="Generate the AMR-X warehouse SDF world.")
    ap.add_argument("--aisle", type=float, default=1.6,
                    help="Aisle width in metres (>= 1.5 per spec). Default 1.6.")
    ap.add_argument("--out", default=default_out, help="Output SDF path.")
    args = ap.parse_args()

    if args.aisle < 1.5:
        print(f"WARNING: aisle width {args.aisle} m is below the 1.5 m spec minimum.")

    world = build_world(aisle_width=args.aisle)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        f.write(world)
    print(f"Wrote warehouse world to: {args.out}")
    print(f"  aisle width = {args.aisle:.2f} m")


if __name__ == "__main__":
    main()
