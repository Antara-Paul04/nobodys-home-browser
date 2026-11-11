"""Read-only export of original house components for outdoor traversal."""
import bpy,json
from pathlib import Path
from mathutils import Vector
out={}
for o in sorted(bpy.data.collections['North Kolkata lane'].objects,key=lambda o:o.name):
 if o.type!='MESH':continue
 pts=[o.matrix_world@Vector(p) for p in o.bound_box];origin=Vector(((min(p.x for p in pts)+max(p.x for p in pts))/2,min(p.y for p in pts),min(p.z for p in pts)))
 parent=list(range(len(o.data.vertices)))
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for e in o.data.edges:
  a,b=map(root,e.vertices);parent[a]=b
 groups={}
 for p in o.data.polygons:groups.setdefault(root(p.vertices[0]),set()).update(p.vertices)
 solids=[]
 for vs in groups.values():
  ps=[o.matrix_world@o.data.vertices[v].co-origin for v in vs];lo=[min(v[i] for v in ps) for i in range(3)];hi=[max(v[i] for v in ps) for i in range(3)]
  solids.append({'minX':round(lo[0],5),'maxX':round(hi[0],5),'minZ':round(-hi[1],5),'maxZ':round(-lo[1],5),'bottom':round(lo[2],5),'top':round(hi[2],5)})
 out[o.name]={'solids':solids}
(Path(__file__).resolve().parent.parent/'dist/house-collisions.mjs').write_text('export default '+json.dumps(out,separators=(',',':'))+';\n')
print('Exported original house collision geometry')
