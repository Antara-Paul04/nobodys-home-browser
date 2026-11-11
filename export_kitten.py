import bpy,os
keep={'Idle','Walk','Run','Jump','Eat','Sleep','LieDown','WakeUp','LookAround','TailWag'}
for a in list(bpy.data.actions):
 if a.name not in keep: bpy.data.actions.remove(a)
bpy.ops.object.select_all(action='DESELECT')
for name in ('Kitten','KittenRig'):
 ob=bpy.data.objects[name]; ob.hide_set(False); ob.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['KittenRig']
bpy.ops.export_scene.gltf(filepath=os.path.abspath('dist/assets/kitten.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=True,export_force_sampling=True,export_apply=False)
