"""Export Claude's six lane houses; the source .blend is never modified.
Run Blender in background with the .blend open and --python this script.
"""
import bpy
from pathlib import Path

project = Path(__file__).resolve().parent.parent
houses = bpy.data.collections['North Kolkata lane']
bpy.ops.object.select_all(action='DESELECT')
for obj in houses.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        obj.location = (0, 0, 0)
# glTF does not support Blender's procedural plaster nodes. Preserve the
# authored base colours; these materials can be baked to textures later.
for material in bpy.data.materials:
    if not material.use_nodes:
        continue
    shader = next((node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'), None)
    if shader:
        base = shader.inputs['Base Color']
        for link in list(base.links):
            material.node_tree.links.remove(link)
        base.default_value = material.diffuse_color
bpy.ops.export_scene.gltf(filepath=str(project / 'dist/assets/kolkata-houses.glb'),
    export_format='GLB', use_selection=True, export_animations=False,
    export_cameras=False, export_lights=False)
