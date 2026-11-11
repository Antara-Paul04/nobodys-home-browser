"""Preserve Claude's furnished home; bake procedural materials on one CPU thread.
Exports source geometry plus component collision bounds. Never saves the .blend.
"""
import bpy, json, math, time
from pathlib import Path
from mathutils import Matrix, Vector
project=Path(__file__).resolve().parent.parent
coll=bpy.data.collections['Hero house (story start)']
objects=[o for o in coll.objects if o.type=='MESH']
hx=bpy.data.objects['Hero house - floor'].location.x
source=[{'name':o.name,'vertices':len(o.data.vertices),'dimensions':list(o.dimensions)} for o in objects]

def components(mesh):
    parent=list(range(len(mesh.vertices)))
    def root(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]];i=parent[i]
        return i
    for e in mesh.edges:
        a,b=map(root,e.vertices);parent[a]=b
    groups={}
    for p in mesh.polygons:groups.setdefault(root(p.vertices[0]),[]).append(p.index)
    return list(groups.values())

def split(obj, selections):
    used=set()
    for name,faces in selections:
        used.update(faces);new=obj.copy();new.data=obj.data.copy();new.name=name;coll.objects.link(new)
        import bmesh
        bm=bmesh.new();bm.from_mesh(new.data);bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index not in faces],context='FACES')
        bm.to_mesh(new.data);bm.free()
        objects.append(new)
    import bmesh
    bm=bmesh.new();bm.from_mesh(obj.data);bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index in used],context='FACES');bm.to_mesh(obj.data);bm.free()

shell=bpy.data.objects['Hero house - ground floor shell']
leaves=[]
for faces in components(shell.data):
    vs={v for f in faces for v in shell.data.polygons[f].vertices}
    lo=[min(shell.data.vertices[v].co[i] for v in vs) for i in range(3)]
    hi=[max(shell.data.vertices[v].co[i] for v in vs) for i in range(3)]
    if abs(lo[1]-.35)<.001 and abs(hi[1]-.95)<.001 and hi[2]>2.8:
        if abs(lo[0]-.8)<.001:leaves.append(('Home front door left',faces))
        if abs(lo[0]-1.95)<.001:leaves.append(('Home front door right',faces))
assert len(leaves)==2
split(shell,leaves)
shutters=bpy.data.objects['Gap window shutters'];parts=[[],[]]
for p in shutters.data.polygons:
    mid=sum(shutters.data.vertices[v].co.y for v in p.vertices)/len(p.vertices)
    parts[0 if mid<8.45 else 1].append(p.index)
split(shutters,[('Home window left',parts[0]),('Home window right',parts[1])])
objects.remove(shutters);bpy.data.objects.remove(shutters,do_unlink=True)
poses={'Home front door left':(.825,.35,-math.pi/2),'Home front door right':(1.975,.35,math.pi/2),
       'Home window left':(7.02,8.0,-math.pi/2),'Home window right':(7.02,8.9,math.pi/2)}
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=1
scene.render.threads_mode='FIXED';scene.render.threads=1
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=4
for o in objects:
    if not any(m and m.use_nodes and any(n.type=='BSDF_PRINCIPLED' and n.inputs['Base Color'].is_linked for n in m.node_tree.nodes) for m in o.data.materials):continue
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    for slot in o.material_slots:
        if slot.material:slot.material=slot.material.copy()
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.1519,island_margin=.008);bpy.ops.object.mode_set(mode='OBJECT')
    res=2048 if o==shell else 1024 if 'upper floor' in o.name or o.name=='Back yard' else 256
    color=bpy.data.images.new(o.name+' colour',width=res,height=res);color.colorspace_settings.name='sRGB'
    for m in o.data.materials:
        n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=color;m.node_tree.nodes.active=n
    bpy.ops.object.bake(type='DIFFUSE');color.pack()
    normal=bpy.data.images.new(o.name+' relief',width=res//2,height=res//2);normal.colorspace_settings.name='Non-Color'
    for m in o.data.materials:
        n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=normal;m.node_tree.nodes.active=n
    bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT');normal.pack()
    for m in o.data.materials:
        bsdf=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        tex=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image==color)
        m.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        tex=next(n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image==normal)
        n=m.node_tree.nodes.new('ShaderNodeNormalMap');m.node_tree.links.new(tex.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],bsdf.inputs['Normal'])
    print('BAKED',o.name,flush=True);time.sleep(.2)
# Same rigid hinge rotations are applied to source mesh and collision pieces.
# These are poses of the existing doors/shutters, not replacement geometry.
for o in objects:
    if o.name in poses:
        x,y,angle=poses[o.name];matrix=Matrix.Translation((x,y,0))@Matrix.Rotation(angle,4,'Z')@Matrix.Translation((-x,-y,0))
        o.data.transform(matrix)
solids=[]
for o in objects:
    if o.name=='Mosquito net':continue
    for faces in components(o.data):
        vs={v for f in faces for v in o.data.polygons[f].vertices}
        points=[o.data.vertices[v].co for v in vs]
        lo=[min(v[i] for v in points) for i in range(3)];hi=[max(v[i] for v in points) for i in range(3)]
        # Convert Blender to the game's rotated, uniformly scaled home coordinates.
        solids.append({'name':o.name,'minX':round((3.7-hi[0])*.75,5),'maxX':round((3.7-lo[0])*.75,5),
            'minZ':round(lo[1]*.75-4.3,5),'maxZ':round(hi[1]*.75-4.3,5),
            'bottom':round(lo[2]*.75,5),'top':round(hi[2]*.75,5)})
metadata={'sourceObjects':source,'sourceOrigin':hx,'solids':solids,'meshCount':len(objects),
 'lights':[{'position':list(o.location),'color':list(o.data.color),'energy':o.data.energy} for o in coll.all_objects if o.type=='LIGHT']}
(project/'dist/home-data.mjs').write_text('export default '+json.dumps(metadata,separators=(',',':'))+';\n')
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True);o.hide_set(False);o.hide_render=False
bpy.ops.export_scene.gltf(filepath=str(project/'dist/assets/hero-home.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
print('EXPORTED',len(objects),'objects',len(solids),'collision components',flush=True)
