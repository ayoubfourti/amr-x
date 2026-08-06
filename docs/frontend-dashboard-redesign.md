# AMR-X dashboard UX and architecture

## Purpose

This implementation establishes a mission-first visual and information
architecture for the AMR-X operations dashboard. It keeps the React/Vite
runtime, API calls, ROS hooks, routes, permissions, theme state, and demo data
while providing a consistent command-center interface.

Vite remains the correct runtime for the robot console: this is an authenticated,
client-side, WebSocket-heavy application and does not benefit from server-side
rendering. The public AMR-X website already uses Next.js and remains the right
place for SEO or server-rendered public content.

## Information architecture

The previous flat menu has been regrouped:

- **Operations:** Overview, Missions, Live map
- **Control:** Teleoperation, Fleet, Modules
- **System:** Alerts, Team, Settings

Mission management is deliberately the second primary navigation item and has a
live state indicator. The overview reading order is:

1. Fleet and mission KPIs
2. Live world/map and active mission
3. Selected robot health
4. Fleet list and recent activity

This hierarchy applies at every breakpoint. On phones the KPI row is horizontally
scrollable, followed by the map, mission execution, robot inspection, fleet, and
activity feed.

## Visual system

- Default mode is dark; the existing theme control also exposes light mode.
- The essential application canvas uses blue-black surfaces and watery cyan
  glass depth. Blue is structural rather than a selected-state color. Active
  navigation and selected records use a restrained teal edge/text signal.
- The design uses cyan/teal operational signals, restrained
  amber warnings, thin illuminated borders, translucency, backdrop blur, and
  subtle water-like radial light.
- New icons are a consistent SVG line set. Text/emoji symbols are no longer used
  in the redesigned shell.
- Inter is bundled locally from the repository, avoiding a runtime font request.
- Cards include hover elevation and illuminated border feedback.
- Controls maintain tablet-friendly hit areas and reduced-motion support.

## Secure entry experience

The `/login` route now extends the command-center visual system to the first
operator touchpoint instead of presenting a separate generic authentication
card. On desktop it pairs the access form with an illustrative live-fleet
preview, mission route, connection state, and AMR-X product identity. On
tablet and phone it collapses to a focused single-column form with the same
branding.

The form preserves the existing `/api/auth/login` contract and session flow.
It adds explicit labels, email and password autocomplete hints, invalid-field
relationships, an announced error region, visible keyboard focus, and an
accessible password-visibility control. Motion is decorative and disabled when
the operating system requests reduced motion. The operational preview is
illustrative only; unlike authenticated dashboard data, it is hidden from
assistive technology and cannot be mistaken for live telemetry.

## Map and 3D world

The Overview and dedicated Live Map workspace have two synchronized modes:

- **2D map:** the interactive `WarehouseMapSVG` with selected-world SDF
  entities, robot positions, zoom, pan, reset, and mission overlays.
- **3D world:** a lightweight interactive isometric digital twin generated
  from the same selected-world manifest. It includes categorized entities,
  zones, live fleet markers, unit status, and camera rotation.

Both modes use the same robot and mission context. Changing view never changes
the selected robot or active mission.

### SDF extraction pipeline

Both world views are generated from project simulation sources rather than a
hardcoded dashboard scene. Run:

```bash
cd dashboard_app/frontend
npm run worlds:extract
```

The extractor recursively reads every world-containing `.sdf` or `.world` in:

- `robotics/simulation/worlds/`
- `robotics/navigation/maps/`

It writes the deterministic manifest
`dashboard_app/frontend/src/generated/sdf-worlds.json`. `npm run dev` and
`npm run build` execute the extractor automatically.

The complete pipeline, manifest schema, supported geometry, validation command,
bounds calculation, renderer behavior, and Live Map label editor are documented
in [Digital Twin Maps](interfaces/digital-twin-maps.md).

Extracted features include:

- world name, source path, format, and non-origin-centered metric bounds;
- model and included-model poses;
- box, plane and cylinder geometry;
- walls, racks/shelves, zones, docks, pallets/payloads and obstacles;
- hospital partitions, actors, landmarks and external model includes;
- point/directional light positions and ranges;
- exact-versus-approximate geometry metadata and deterministic validation.

The overview world selector exposes all extracted worlds. Each rendered object
retains its SDF entity name as an SVG tooltip, while the footer reports the
source entity count and world dimensions.

### Production 3D integration path

The prototype is intentionally dependency-free and fast on phones. A full
simulation geometry viewer should be introduced as a lazy-loaded route/chunk,
not added to the initial dashboard bundle:

1. Convert the robot STL/DAE meshes and required SDF world assets to optimized
   glTF/GLB at build time.
2. Load them with Three.js or React Three Fiber only after the operator selects
   **3D world**.
3. Bind robot transforms to ROS TF/pose topics and mission paths to the Nav2
   plan topic.
4. Use level-of-detail meshes and instanced racks for tablet performance.
5. Preserve the current isometric view as the low-power and connection fallback.

Relevant repository inputs:

- `robotics/simulation/worlds/warehouse.sdf`
- `robotics/navigation/maps/my_warehouse.sdf`
- `robotics/robot_description/meshes/`
- `modules/dual_arm_model+urdf/dual_arm/meshes/`

## Responsive behavior

- **Large desktop (1250px+):** map, mission, and selected robot are visible in one
  command row.
- **Small desktop/tablet landscape:** two-column layout, with robot and fleet
  panels moved below the map.
- **Tablet/phone (1023px and below):** navigation becomes an overlay drawer.
- **Phone (760px and below):** single-column content; map and mission remain first.
- No horizontal page overflow is permitted; only the intentional phone KPI strip
  scrolls horizontally.

## Live camera and teleoperation HUD

Teleoperation is camera-first. The camera occupies the operational canvas rather
than being placed in a secondary status card. Translucent blue HUD panels keep
the following controls visible over the feed:

- robot selection, online state, and safety-field state;
- direction-pad and virtual-joystick driving;
- adjustable linear speed limit and keyboard shortcuts;
- battery, command latency, linear velocity, and angular velocity;
- compact local map with locate and independent expand controls;
- persistent emergency stop.

**Full camera** expands the canvas to the viewport without removing the driving
controls, map, telemetry, camera selector, or emergency stop. `Escape` exits
expanded camera/map views, `Space` triggers the emergency stop, and releasing a
drive key/pointer or losing window focus publishes a zero-velocity command.
On narrow screens the HUD reflows beneath the feed; emergency stop remains
fixed and immediately reachable.

Camera feeds use `sensor_msgs/CompressedImage` over rosbridge:

| View | Default ROS topic |
| --- | --- |
| Front | `/camera/color/image_raw/compressed` |
| Rear | `/camera/rear/image_raw/compressed` |
| Deck | `/camera/deck/image_raw/compressed` |

When a stream is unavailable, the frontend displays the corresponding
representative warehouse image. Demo mode labels it **Demo feed**; normal
operation labels it **Preview feed**, so it is never presented as live
telemetry. The three optimized WebP previews total less than 600 KB.

## Shared selection controls

Every dashboard dropdown uses `SelectField.jsx` rather than a browser-native
`select`. The control provides:

- consistent dark/light command-center styling;
- a selected checkmark and hover/keyboard active state;
- `combobox`/`listbox` semantics with unique option identifiers;
- Arrow, Enter, Space, Escape, and Tab keyboard handling;
- portal rendering so menus are not clipped by cards, modals, or HUD panels;
- automatic above/below positioning based on viewport space.

The component is used by Mission Control filters and sorting, mission
composition, world selection, map-label editing, teleoperation robot selection,
fleet and team filters, settings, and administrative forms.

## Runtime and loading architecture

- Route components are lazy-loaded, keeping the initial application chunk
  separate from page-specific CSS and logic.
- roslib is isolated in its own asynchronous chunk.
- `RosProvider` owns one rosbridge connection shared by Overview,
  Teleoperation, camera feeds, and module docking controls.
- `CORS_ORIGINS`, `ROSBRIDGE_HOST`, `ROSBRIDGE_PORT`, and
  `ROSBRIDGE_ROBOT_NAME` configure backend deployment without source edits;
  `ROSBRIDGE_SYNC_ENABLED` explicitly opts the API into lifecycle-managed
  `/robot_state` database synchronization.
- `npm run check:dashboard` validates backend compilation/tests, the committed
  SDF manifest, frontend lint, and the production build.

## Files introduced or substantially changed

- `dashboard_app/frontend/src/pages/Dashboard.jsx`
- `dashboard_app/frontend/src/pages/Dashboard.css`
- `dashboard_app/frontend/src/pages/Login.jsx`
- `dashboard_app/frontend/src/pages/Login.css`
- `dashboard_app/frontend/src/components/Sidebar.jsx`
- `dashboard_app/frontend/src/components/ui/Icon.jsx`
- `dashboard_app/frontend/src/components/ui/WarehouseWorld3D.jsx`
- `dashboard_app/frontend/src/components/ui/CommandUI.jsx`
- `dashboard_app/frontend/src/components/ui/CommandUI.css`
- `dashboard_app/frontend/src/components/ui/PageTopbar.jsx`
- `dashboard_app/frontend/src/components/ui/LiveCameraFeed.jsx`
- `dashboard_app/frontend/src/components/ui/SelectField.jsx`
- `dashboard_app/frontend/src/context/RosProvider.jsx`
- `dashboard_app/frontend/src/hooks/useRosImage.js`
- `dashboard_app/frontend/src/pages/Teleoperation.jsx`
- `dashboard_app/frontend/src/pages/Teleoperation.css`
- `dashboard_app/frontend/src/App.css`
- `dashboard_app/frontend/src/index.css`
- `dashboard_app/frontend/vite.config.js`

The reusable command UI module supplies `PageShell`, `PageHeader`, `Surface`,
`StatGrid`, `StatusPill`, `ProgressMeter`, `SearchField`, and `IconAction`.
Missions uses these primitives directly; the shared top bar and legacy-route
surface bridge apply the same system to Fleet, Alerts, Modules, Team, Settings,
and Profile while those routes are progressively moved to the primitives.

## Preview behavior

When the backend is unavailable, the overview displays a clearly labeled
simulation preview using existing demo data. It never presents simulated data
without the preview banner. When the API is available, the normal fleet,
mission, and alert query results are used.
