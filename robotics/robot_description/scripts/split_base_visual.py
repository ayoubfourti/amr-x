#!/usr/bin/env python3
"""Split the SolidWorks base STL into material-ready visual shells.

Collision continues to use the untouched base_link.STL.  The generated meshes
contain the exact same visual triangles grouped as body, deck, and LiDAR pucks.
"""

from pathlib import Path
import struct


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "meshes" / "base_link.STL"
OUTPUTS = {
    "body": ROOT / "meshes" / "base_body_visual.STL",
    "deck": ROOT / "meshes" / "base_deck_visual.STL",
    "lidar": ROOT / "meshes" / "base_lidar_visual.STL",
}


def read_binary_stl(path: Path):
    data = path.read_bytes()
    triangle_count = struct.unpack_from("<I", data, 80)[0]
    expected_size = 84 + triangle_count * 50
    if len(data) != expected_size:
        raise ValueError(f"{path} is not a supported binary STL")

    records = [data[84 + index * 50 : 84 + (index + 1) * 50]
               for index in range(triangle_count)]
    vertices = []
    for index, record in enumerate(records):
        coordinates = struct.unpack_from("<9f", record, 12)
        vertices.append(tuple(
            tuple(coordinates[offset:offset + 3]) for offset in (0, 3, 6)
        ))
    return records, vertices


def connected_components(vertices):
    parent = list(range(len(vertices)))

    def find(item):
        while parent[item] != item:
            parent[item] = parent[parent[item]]
            item = parent[item]
        return item

    def union(first, second):
        first_root, second_root = find(first), find(second)
        if first_root != second_root:
            parent[second_root] = first_root

    owner = {}
    for face_index, face in enumerate(vertices):
        for vertex in face:
            welded_vertex = tuple(round(value, 5) for value in vertex)
            previous = owner.setdefault(welded_vertex, face_index)
            union(face_index, previous)

    return [find(index) for index in range(len(vertices))]


def classify(vertices, components):
    groups = {name: [] for name in OUTPUTS}
    members = {}
    for triangle_index, component in enumerate(components):
        members.setdefault(component, []).append(triangle_index)

    for triangle_indices in members.values():
        points = [
            vertex
            for triangle_index in triangle_indices
            for vertex in vertices[triangle_index]
        ]
        lower = [min(point[axis] for point in points) for axis in range(3)]
        upper = [max(point[axis] for point in points) for axis in range(3)]
        size = [upper[axis] - lower[axis] for axis in range(3)]
        center = [(upper[axis] + lower[axis]) / 2.0 for axis in range(3)]

        is_deck = size[0] > 0.79 and size[1] > 0.59 and size[2] < 0.006
        is_lidar = (
            0.07 < size[0] < 0.08
            and 0.07 < size[1] < 0.08
            and 0.035 < size[2] < 0.05
            and abs(center[0]) > 0.30
            and abs(center[1]) < 0.02
        )
        group = "deck" if is_deck else "lidar" if is_lidar else "body"
        groups[group].extend(triangle_indices)
    return groups


def write_binary_stl(path: Path, records, indices, label):
    header = f"AMR-X {label} visual; generated from base_link.STL".encode("ascii")[:80]
    payload = bytearray(header.ljust(80, b"\0"))
    payload.extend(struct.pack("<I", len(indices)))
    for index in indices:
        payload.extend(records[index])
    path.write_bytes(payload)


def main():
    records, vertices = read_binary_stl(SOURCE)
    components = connected_components(vertices)
    groups = classify(vertices, components)
    for name, path in OUTPUTS.items():
        # Newer CAD exports provide the LiDARs as separate link meshes. Keep
        # the last valid integrated-LiDAR visual for legacy robot variants
        # instead of replacing it with an empty STL.
        if not groups[name]:
            print(f"{path.relative_to(ROOT)}: skipped (no matching triangles)")
            continue
        write_binary_stl(path, records, groups[name], name)
        print(f"{path.relative_to(ROOT)}: {len(groups[name])} triangles")


if __name__ == "__main__":
    main()
