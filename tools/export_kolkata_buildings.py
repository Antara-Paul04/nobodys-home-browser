"""Bake Claude's procedural colours to glTF textures, preserving source geometry.
Blender -b SOURCE.blend -t 1 --python tools/export_kolkata_buildings.py
The source .blend is never saved. Baking uses one CPU thread, no GPU.
"""
import bpy, json, time
from pathlib import Path

project = Path(__file__).resolve().parent.parent
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 1
scene.render.threads_mode = 'FIXED'
scene.render.threads = 1
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 8
houses = sorted([o for o in bpy.data.collections['North Kolkata lane'].objects if o.type == 'MESH'], key=lambda o:o.name)
report = []
for index, obj in enumerate(houses):
    start = time.time()
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    # Preserve object coordinates: the original materials use them for damp and rain streaks.
    for slot in obj.material_slots:
        if slot.material:
            slot.material = slot.material.copy()
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.1519, island_margin=0.008)
    bpy.ops.object.mode_set(mode='OBJECT')
    image = bpy.data.images.new(f'House {index+1} original plaster',width=1024,height=1024)
    image.colorspace_settings.name = 'sRGB'
    for mat in obj.data.materials:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = image
        mat.node_tree.nodes.active = node
    bpy.ops.object.bake(type='DIFFUSE')
    image.pack()
    normal = bpy.data.images.new(f'House {index+1} plaster relief',width=512,height=512)
    normal.colorspace_settings.name = 'Non-Color'
    for mat in obj.data.materials:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = normal
        mat.node_tree.nodes.active = node
    bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT')
    normal.pack()
    for mat in obj.data.materials:
        shader = next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        texture = next(n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image==image)
        mat.node_tree.links.new(texture.outputs['Color'],shader.inputs['Base Color'])
        normal_texture = next(n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image==normal)
        normal_map = mat.node_tree.nodes.new('ShaderNodeNormalMap')
        mat.node_tree.links.new(normal_texture.outputs['Color'],normal_map.inputs['Color'])
        mat.node_tree.links.new(normal_map.outputs['Normal'],shader.inputs['Normal'])
    report.append({'name':obj.name,'location':list(obj.location),'dimensions':list(obj.dimensions),'seconds':round(time.time()-start,2)})
    print('BAKED',report[-1],flush=True)
    time.sleep(2)
bpy.ops.object.select_all(action='DESELECT')
for obj in houses:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(project/'dist/assets/kolkata-houses.glb'),export_format='GLB',
    use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
(project/'tools/kolkata-export-report.json').write_text(json.dumps(report,indent=2)+'\n')
