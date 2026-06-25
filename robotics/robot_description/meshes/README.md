# Meshes

Optional visual/collision mesh files (.stl / .dae) go here. The current model
uses primitive geometry (boxes, cylinders, spheres) so no meshes are required to
run. When the mechanical team exports STLs (see `mechanical/exports/stl/`), drop
them here and reference them from the URDF with:

```xml
<geometry><mesh filename="package://robot_description/meshes/your_part.stl"/></geometry>
```
