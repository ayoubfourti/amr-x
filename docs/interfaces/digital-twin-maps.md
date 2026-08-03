# Digital Twin Maps

The React operator application contains a shared digital-twin pipeline for the
Overview and Live Map pages. It discovers simulation worlds from the robotics
workspace, extracts a browser-safe manifest, and renders the same world data as
either an interactive 2D floor plan or a lightweight 3D/isometric scene.

This page explains the complete data flow, supported SDF features, extension
points, validation commands, and the operator label editor.

## Architecture

```text
robotics/simulation/worlds/**/*.{sdf,world}
robotics/navigation/maps/**/*.{sdf,world}
                     │
                     │ npm run worlds:extract
                     ▼
dashboard_app/frontend/src/generated/sdf-worlds.json
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
WarehouseMapSVG          WarehouseWorld3D
2D floor plan            3D/isometric world
          └──────────┬──────────┘
                     ▼
      Overview world panel and Live Map workspace
```

The browser never parses SDF itself. The extraction step keeps the frontend
small, deterministic, and independent of Gazebo at runtime.

## Source discovery

The generator is:

```text
dashboard_app/frontend/scripts/extract-sdf-worlds.mjs
```

It recursively scans these roots:

```text
robotics/simulation/worlds/
robotics/navigation/maps/
```

Supported world filename extensions are:

- `.sdf`
- `.world`

Both extensions must contain SDF XML with a `<world>` element. A `model.sdf`
file describes a reusable model, not a complete world, and is therefore not
added to the world selector.

!!! note "What “all worlds” means"
    Every valid `.sdf` or `.world` file below the configured world roots is
    discovered recursively. Files without a `<world>` element are skipped.
    Local model directories are indexed separately to improve `<include>`
    geometry, but model files are not displayed as standalone worlds.

## Run and validate the generator

From the frontend directory:

```bash
cd dashboard_app/frontend

# Regenerate the committed manifest.
npm run worlds:extract

# Include a per-world extraction summary.
npm run worlds:extract -- --verbose

# Verify that the committed manifest matches every source world.
npm run worlds:check
```

`npm run dev` and `npm run build` execute `worlds:extract` automatically through
the existing `predev` and `prebuild` scripts.

`worlds:check` does not modify files. It creates the expected manifest in memory
and exits with a failure when
`dashboard_app/frontend/src/generated/sdf-worlds.json` is missing or stale.
This command is suitable for CI.

## Extraction stages

| Stage | Behavior |
|---|---|
| Discover | Recursively find `.sdf` and `.world` files in configured world roots |
| Identify | Require an SDF `<world>` element and read its name |
| Parse | Read balanced model, include, actor, and light blocks |
| Classify | Assign stable display categories from entity names and URIs |
| Resolve geometry | Prefer box, cylinder, or plane primitives; consult local included models; otherwise use a category-aware approximation |
| Normalize poses | Produce six values: x, y, z, roll, pitch, and yaw |
| Calculate bounds | Account for entity footprint, yaw, non-zero world centers, and usable floor geometry |
| Validate | Reject invalid bounds, duplicate entity IDs, invalid poses, or empty worlds |
| Serialize | Write deterministic JSON in sorted source order |

### Why balanced block parsing is used

SDF permits nested models. A regular expression that stops at the first
`</model>` can truncate the outer model. The generator includes a small balanced
tag scanner that counts matching opening and closing tags for the SDF elements
it consumes.

It is intentionally not a general-purpose XML parser. If the extraction scope
expands to advanced SDF semantics, replace this scanner with a maintained XML
parser and keep the manifest schema stable.

## Supported SDF data

The current manifest represents:

- `<model>` entities;
- `<include>` references;
- `<actor>` entities;
- `<light>` entities;
- `<pose>` values;
- box geometry;
- cylinder geometry;
- plane geometry;
- local included-model primitives when a matching `model.sdf` exists;
- calculated metric bounds and category counts.

### Entity categories

Names and include URIs are classified into display-oriented categories:

| Category | Typical matching terms |
|---|---|
| `floor` | floor, ground |
| `wall` | wall |
| `rack` | rack, shelf, cabinet, storage, bookcase |
| `zone` | zone, area, region |
| `dock` | dock, charger, charging |
| `payload` | pallet, box, cart, trolley, crate |
| `partition` | curtain, door, portal, partition, gate |
| `actor` | patient, person, visitor, nurse, actor, human, chair |
| `landmark` | elevator, station, sink, bed, sign |
| `light` | SDF light, light, lamp |
| `included` | an unmatched `<include>` |
| `obstacle` | an unmatched inline model |

Classification affects color, fallback dimensions, draw order, and labels. It
does not change the simulation source.

## Geometry accuracy and approximations

The dashboard is an operational visualization, not a Gazebo geometry engine.

Exact primitive geometry is used when the source provides a box, cylinder, or
plane. For an included model, the generator searches:

```text
robotics/simulation/models/
robotics/simulation/fuel_models/
```

If a local model contains an exact primitive, that footprint is reused. Mesh-only
models, missing Fuel assets, and unsupported geometry receive a documented
category-aware footprint.

Every geometry object contains:

```json
{
  "type": "box",
  "size": [2.4, 0.8, 2.0],
  "approximate": true
}
```

Consumers can distinguish exact and approximate entities without guessing.

!!! warning "Not a collision or safety map"
    Approximate dashboard geometry must not be used for collision avoidance,
    safety fields, path validation, or robot control. Nav2 costmaps and the
    simulation remain authoritative for those functions.

## Manifest schema

The generated root has explicit provenance:

```json
{
  "schemaVersion": 2,
  "generator": "dashboard_app/frontend/scripts/extract-sdf-worlds.mjs",
  "sourceRoots": [
    "robotics/simulation/worlds",
    "robotics/navigation/maps"
  ],
  "supportedExtensions": [".sdf", ".world"],
  "worlds": []
}
```

Each world contains:

```json
{
  "id": "warehouse",
  "name": "amr_warehouse",
  "label": "AMR Warehouse",
  "source": "robotics/simulation/worlds/warehouse.sdf",
  "format": "sdf",
  "bounds": {
    "minX": -12.1,
    "maxX": 12.1,
    "minY": -8.1,
    "maxY": 8.1,
    "width": 24.2,
    "height": 16.2
  },
  "counts": {
    "floor": 1,
    "wall": 4,
    "rack": 4
  },
  "entities": []
}
```

Each entity contains a stable ID, original SDF name, category, six-value pose,
geometry, and source type. Included entities also retain their URI and geometry
source.

## Bounds and coordinate handling

Worlds are not required to be centered at `(0, 0)`.

For box geometry, the extractor rotates the width and height by the entity yaw
to calculate an axis-aligned footprint. Cylinders use their radius. Bounds
include minimum and maximum X/Y coordinates as well as width and height.

The two renderers use the same center:

```text
centerX = (minX + maxX) / 2
centerY = (minY + maxY) / 2
```

The 2D renderer maps metric coordinates into its SVG viewport. The 3D renderer
uses the same center before applying its isometric projection. This prevents
off-center hospital or warehouse worlds from being clipped or shifted between
views.

## 2D and 3D rendering

### 2D floor plan

`WarehouseMapSVG.jsx` renders:

- metric grid and calculated world boundary;
- walls, racks, partitions, zones, actors, lights, and obstacles;
- geometry rotation from SDF yaw;
- robot positions and recent trails;
- zoom, pan, reset, and focus-robot controls.

When a `world` prop is provided, the component draws the selected SDF manifest.
Without a world prop, it retains the legacy static warehouse fallback for older
consumers.

### 3D/isometric world

`WarehouseWorld3D.jsx` renders:

- a lightweight isometric floor;
- extruded boxes for SDF entities;
- cylinders, zones, and light ranges;
- category colors and draw ordering;
- robot markers;
- camera rotation controls.

This renderer intentionally avoids a heavy WebGL dependency and remains usable
on lower-power operator tablets.

## Live Map operator workflow

Open **Operations → Live map**.

The workspace provides:

- a selector containing every extracted world;
- a world library with source dimensions and entity counts;
- synchronized **2D floor plan** and **3D world** buttons;
- live fleet markers and robot focus;
- per-world operational labels.

Changing the active world changes both renderers. It does not modify the SDF
source file.

## Labels and editing

Operators can add annotations without changing simulation assets:

1. Select a world.
2. Choose **Add label**.
3. Click the 2D or 3D canvas.
4. Rename the label and select its type.
5. Enable **Edit labels**, then drag the label directly in either world view or
   edit its metric X/Y coordinates in the scrollable inspector.
6. Remove it from the label editor when it is no longer needed.
7. Use **Reset all** and then **Confirm reset** to remove every label from the
   currently selected world without affecting other worlds.

Supported label types are waypoint, safety, delivery, charging, and note.

Labels are world-coordinate entities rather than fixed HTML overlays. They are
projected by `WarehouseMapSVG` and `WarehouseWorld3D`, so they remain attached
to the same location during 2D pan/zoom and 3D orbit/zoom. The Overview uses the
same annotation store and displays labels for its selected world.

Labels are stored by world ID in browser local storage:

```text
amrx-map-annotations-v1
```

They persist after refresh in that browser profile. A same-window custom event
updates mounted dashboard consumers immediately, while the browser `storage`
event updates other open tabs using the same origin. They are not written into
SDF, synchronized between different operator browsers, or sent to the backend.

Older stored annotations that only contain screen percentages are converted to
metric world coordinates when read, preserving labels created before the
world-coordinate upgrade.

!!! info "Future shared annotations"
    Multi-operator labels should move to a backend API with a world ID, metric
    coordinates, author, revision, and audit history. The current local system
    is suitable for interface prototyping and single-console use.

## Add a new world

1. Add a valid SDF world file below one of the configured world roots:

   ```text
   robotics/simulation/worlds/my_new_site.sdf
   ```

2. Ensure it contains a named `<world>`:

   ```xml
   <?xml version="1.0"?>
   <sdf version="1.9">
     <world name="my_new_site">
       <!-- models, includes, actors, and lights -->
     </world>
   </sdf>
   ```

3. Generate and inspect:

   ```bash
   cd dashboard_app/frontend
   npm run worlds:extract -- --verbose
   npm run worlds:check
   npm run build
   ```

4. Open Live Map and verify both 2D and 3D views.

No React selector code needs to be edited. The UI reads the generated world
array.

## Troubleshooting

### A file does not appear

- Confirm it is below a configured source root.
- Confirm its extension is `.sdf` or `.world`.
- Confirm the XML contains `<world>`, not only `<model>`.
- Run the extractor with `--verbose`.

### An included object has the wrong size

The model is probably mesh-only, remote, or unavailable locally. Inspect
`geometry.approximate` and `geometrySource` in the manifest. Add a primitive
collision geometry to the local model or extend `fallbackFor()` for that
category.

### The world is shifted or clipped

Inspect `bounds.minX`, `maxX`, `minY`, and `maxY`. Confirm entity poses and yaw
values are valid. The extractor rejects non-finite poses but cannot infer
semantic frame transforms that are absent from the source.

### The frontend manifest is stale

```bash
npm run worlds:check
npm run worlds:extract
```

Commit the updated generated JSON with the source world and generator changes.

## Relevant files

| File | Responsibility |
|---|---|
| `scripts/extract-sdf-worlds.mjs` | Discovery, parsing, classification, bounds, validation, serialization |
| `src/generated/sdf-worlds.json` | Deterministic browser manifest |
| `src/components/ui/WarehouseMapSVG.jsx` | 2D world and fleet renderer |
| `src/components/ui/WarehouseWorld3D.jsx` | 3D/isometric renderer |
| `src/hooks/useMapAnnotations.js` | Per-world persistence, real-time events, coordinate migration, and reset |
| `src/pages/Map.jsx` | Live Map world library and label editor |
| `src/pages/Map.css` | Live Map workspace presentation |
| `src/pages/Dashboard.jsx` | Overview world panel |
