"""Export Claude's street props (vehicles, carts, street furniture) from kolkata-buildings.blend
as flat-coloured GLB assets plus source-derived collision boxes. Does not save the .blend.

  Blender -b <kolkata-buildings.blend> --python tools/export_kolkata_props.py

Procedural (node-based) materials are flattened to their viewport colour: these props are small
and read fine without baked atlases, which keeps the download light.
"""
import bpy, json
from pathlib import Path
from mathutils import Vector, Matrix

project = Path(__file__).resolve().parent.parent
scene = bpy.context.scene

# name -> (source objects, optional x-range filter to cut one item out of a combined mesh)
SPECS = [
    ("Taxi", ["Taxi - body", "Taxi - wheels", "Taxi - interior"], None),
    ("Rickshaw", ["Hand-pulled rickshaw"], None),
    ("Auto", ["Auto rickshaw (green-yellow)"], None),
    ("CycleVan", ["Cycle van (van rickshaw)"], None),
    ("Minibus", ["Minibus (maroon-yellow)"], None),
    ("Bus", ["Private bus (blue-yellow)"], None),
    ("Tram", ["Tram - front coach", "Tram - rear coach"], None),
    ("HandPump", ["Hand pump (tube well)"], None),
    ("Bins", ["KMC bins"], None),
    ("Phuchka", ["Phuchka stall"], None),
    ("FruitCart", ["Fruit cart (thela)"], None),
    ("BusShelter", ["Bus shelter (blue-white)"], None),
    ("TridentLamp", ["Trident lamps"], (0.0, 1e9)),
    ("LampPost", ["Lamp posts (blue-white)"], (0.0, 12.0)),
    ("RedBlock", ["Writers-style red block"], None),
    ("ShrineTree", ["Shrine tree"], None),
]

flat_cache = {}
def flat(mat):
    """A plain Principled copy of a material, using its viewport colour when the colour is procedural."""
    if mat is None: return None
    if mat.name in flat_cache: return flat_cache[mat.name]
    src = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if mat.use_nodes else None
    m = bpy.data.materials.new("P " + mat.name); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    colour = tuple(mat.diffuse_color)
    if src and not src.inputs["Base Color"].is_linked: colour = tuple(src.inputs["Base Color"].default_value)
    b.inputs["Base Color"].default_value = colour
    if src:
        for key in ("Roughness", "Metallic", "Alpha", "Emission Strength"):
            if not src.inputs[key].is_linked: b.inputs[key].default_value = src.inputs[key].default_value
        if not src.inputs["Emission Color"].is_linked: b.inputs["Emission Color"].default_value = src.inputs["Emission Color"].default_value
        if src.inputs["Alpha"].default_value < 0.999:
            try: m.surface_render_method = "BLENDED"
            except Exception: pass
    flat_cache[mat.name] = m
    return m

def components(mesh):
    parent = list(range(len(mesh.vertices)))
    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for e in mesh.edges:
        a, b = map(root, e.vertices); parent[a] = b
    groups = {}
    for p in mesh.polygons: groups.setdefault(root(p.vertices[0]), set()).update(p.vertices)
    return groups.values()

selected, report = [], {}
for name, names, xrange in SPECS:
    roots = [bpy.data.objects[n] for n in names]
    objects = []
    for r in roots:
        for o in [r] + [c for c in r.children if c.type in {"MESH", "FONT"}]:
            dup = o.copy(); dup.data = o.data.copy(); scene.collection.objects.link(dup)
            dup.parent = None; dup.matrix_world = o.matrix_world.copy()
            if dup.type == "FONT":
                bpy.ops.object.select_all(action="DESELECT"); dup.select_set(True); bpy.context.view_layer.objects.active = dup
                bpy.ops.object.convert(target="MESH")
            objects.append((dup, o is r))
    bpy.context.view_layer.update()
    # world-space vertices; optionally cut one item out of a combined mesh
    for dup, _ in objects:
        dup.data.transform(dup.matrix_world); dup.matrix_world = Matrix.Identity(4)
        if xrange:
            import bmesh
            bm = bmesh.new(); bm.from_mesh(dup.data)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if not (xrange[0] <= v.co.x <= xrange[1])], context="VERTS")
            bm.to_mesh(dup.data); bm.free()
        for i, slot in enumerate(dup.material_slots): slot.material = flat(slot.material)
    pts = [v.co for dup, is_root in objects if is_root for v in dup.data.vertices]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    origin = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0.0))
    root = bpy.data.objects.new(name, None); scene.collection.objects.link(root); selected.append(root)
    solids = []
    for dup, is_root in objects:
        dup.data.transform(Matrix.Translation(-origin)); dup.parent = root; selected.append(dup)
        if not is_root: continue
        for verts in components(dup.data):
            p = [dup.data.vertices[i].co for i in verts]
            a = [min(v[i] for v in p) for i in range(3)]; b = [max(v[i] for v in p) for i in range(3)]
            if b[0] - a[0] < 0.03 and b[1] - a[1] < 0.03: continue          # wires, spokes, thin rods
            if (b[0] - a[0]) * (b[1] - a[1]) * (b[2] - a[2]) < 1e-5: continue
            solids.append({"minX": round(a[0], 4), "maxX": round(b[0], 4), "minZ": round(-b[1], 4), "maxZ": round(-a[1], 4), "bottom": round(a[2], 4), "top": round(b[2], 4)})
    report[name] = {"sourceNames": names, "dimensions": [round(hi[i] - lo[i], 4) for i in range(3)],
                    "bounds": {"minX": round(lo.x - origin.x, 4), "maxX": round(hi.x - origin.x, 4), "minZ": round(-(hi.y - origin.y), 4), "maxZ": round(-(lo.y - origin.y), 4), "top": round(hi.z, 4)},
                    "parts": len(solids)}
    print("READY", name, len(solids), "solids", [round(hi[i] - lo[i], 2) for i in range(3)], flush=True)

bpy.ops.object.select_all(action="DESELECT")
for o in selected: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(project / "dist/assets/kolkata-props.glb"), export_format="GLB", use_selection=True,
                          export_animations=False, export_cameras=False, export_lights=False, export_apply=False, export_yup=True)
(project / "dist/props-data.mjs").write_text("export default " + json.dumps(report, separators=(",", ":")) + ";\n")
print("EXPORTED kolkata props", flush=True)
