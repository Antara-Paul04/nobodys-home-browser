"""Export Claude's authored shops and Ambassador without modifying the Blender source.
Run Blender in background with -t 1. Colour and relief bake on a single CPU thread.
"""
import bpy,json,time
from pathlib import Path
from mathutils import Vector,Matrix
project=Path(__file__).resolve().parent.parent
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=1
scene.render.threads_mode='FIXED';scene.render.threads=1
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=6
specs=[('SweetShop',['Shop - sweet shop (mishtir dokan)']),('Grocery',['Shop - grocery (mudikhana)']),('TeaShop',['Shop - tea stall']),('PaanKiosk',['Shop - paan kiosk']),('Taxi',['Taxi - body','Taxi - wheels','Taxi - interior'])]
selected=[];report={}
def components(mesh):
 parent=list(range(len(mesh.vertices)))
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for e in mesh.edges:
  a,b=map(root,e.vertices);parent[a]=b
 groups={}
 for p in mesh.polygons:groups.setdefault(root(p.vertices[0]),set()).update(p.vertices)
 return groups.values()
for name,names in specs:
 roots=[bpy.data.objects[n] for n in names]
 objects=roots+list({c for r in roots for c in r.children if c.type in {'MESH','FONT'}})
 pts=[o.matrix_world@Vector(p) for o in roots for p in o.bound_box]
 origin=Vector(((min(v.x for v in pts)+max(v.x for v in pts))/2,(min(v.y for v in pts)+max(v.y for v in pts))/2,min(v.z for v in pts)))
 for o in objects:
  if o.type=='FONT':
   bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
  if not any(m and m.use_nodes and any(n.type=='BSDF_PRINCIPLED' and n.inputs['Base Color'].is_linked for n in m.node_tree.nodes) for m in o.data.materials):continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  for slot in o.material_slots:
   if slot.material:slot.material=slot.material.copy()
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.1519,island_margin=.009);bpy.ops.object.mode_set(mode='OBJECT')
  color=bpy.data.images.new(name+' source colour',width=1024,height=1024);color.colorspace_settings.name='sRGB'
  # Baking emission records the original colour even for metallic surfaces.
  links=[]
  for m in o.data.materials:
   tree=m.node_tree;shader=next(n for n in tree.nodes if n.type=='BSDF_PRINCIPLED');out=next(n for n in tree.nodes if n.type=='OUTPUT_MATERIAL');em=tree.nodes.new('ShaderNodeEmission')
   if shader.inputs['Base Color'].is_linked:tree.links.new(shader.inputs['Base Color'].links[0].from_socket,em.inputs['Color'])
   else:em.inputs['Color'].default_value=shader.inputs['Base Color'].default_value
   tree.links.new(em.outputs[0],out.inputs['Surface']);links.append((tree,shader,out,em))
   n=tree.nodes.new('ShaderNodeTexImage');n.image=color;tree.nodes.active=n
  bpy.ops.object.bake(type='EMIT');color.pack()
  for tree,shader,out,em in links:tree.links.new(shader.outputs[0],out.inputs['Surface']);tree.nodes.remove(em)
  normal=bpy.data.images.new(name+' relief',width=512,height=512);normal.colorspace_settings.name='Non-Color'
  for m in o.data.materials:n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=normal;m.node_tree.nodes.active=n
  bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT');normal.pack()
  for m in o.data.materials:
   tree=m.node_tree;bsdf=next(n for n in tree.nodes if n.type=='BSDF_PRINCIPLED')
   tex=next(n for n in tree.nodes if n.type=='TEX_IMAGE' and n.image==color);tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
   tex=next(n for n in tree.nodes if n.type=='TEX_IMAGE' and n.image==normal);nm=tree.nodes.new('ShaderNodeNormalMap');tree.links.new(tex.outputs['Color'],nm.inputs['Color']);tree.links.new(nm.outputs['Normal'],bsdf.inputs['Normal'])
  print('BAKED',name,flush=True);time.sleep(.5)
 # Bake all existing object transforms into vertices relative to one asset origin.
 matrices={o:o.matrix_world.copy() for o in objects}
 root=bpy.data.objects.new(name,None);scene.collection.objects.link(root);selected.append(root)
 solids=[]
 for o in objects:
  matrix=Matrix.Translation(-origin)@matrices[o]
  o.data.transform(matrix);o.parent=root;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4)
  o.hide_set(False);o.hide_render=False;selected.append(o)
  if o not in roots:continue
  for verts in components(o.data):
   p=[o.data.vertices[i].co for i in verts];lo=[min(v[i] for v in p) for i in range(3)];hi=[max(v[i] for v in p) for i in range(3)]
   if hi[0]-lo[0]<.006 and hi[1]-lo[1]<.006:continue
   solids.append({'minX':round(lo[0],5),'maxX':round(hi[0],5),'minZ':round(-hi[1],5),'maxZ':round(-lo[1],5),'bottom':round(lo[2],5),'top':round(hi[2],5)})
 report[name]={'sourceNames':names,'dimensions':[round(max(v[i] for v in pts)-min(v[i] for v in pts),5) for i in range(3)],'solids':solids}
 print('READY',name,len(solids),'solids',flush=True)
bpy.ops.object.select_all(action='DESELECT')
for o in selected:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(project/'dist/assets/kolkata-street.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
(project/'dist/street-data.mjs').write_text('export default '+json.dumps(report,separators=(',',':'))+';\n')
print('EXPORTED street assets',flush=True)
