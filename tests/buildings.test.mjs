import fs from 'node:fs';
import assert from 'node:assert/strict';
const bytes=fs.readFileSync(new URL('../dist/assets/kolkata-houses.glb',import.meta.url));
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
const source=JSON.parse(fs.readFileSync(new URL('../tools/kolkata-export-report.json',import.meta.url)));
assert.equal(gltf.nodes.length,6);
assert.equal(gltf.images.length,12,'each house keeps its colour and normal atlas');
for(const original of source){
 const node=gltf.nodes.find(n=>n.name===original.name);
 assert.ok(node,original.name);
 assert.equal(node.scale,undefined,'no baked-in nonuniform scale');
 assert.ok(Math.abs(node.translation[0]-original.location[0])<.0001,'source spacing preserved');
 const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
 for(const primitive of gltf.meshes[node.mesh].primitives){
  const a=gltf.accessors[primitive.attributes.POSITION];
  for(let i=0;i<3;i++){low[i]=Math.min(low[i],a.min[i]);high[i]=Math.max(high[i],a.max[i])}
  const material=gltf.materials[primitive.material];
  assert.ok(material.pbrMetallicRoughness.baseColorTexture,'original procedural colour was baked');
  assert.ok(material.normalTexture,'plaster relief was baked');
  assert.notEqual(primitive.attributes.TEXCOORD_0,undefined);
 }
 const axes=[0,2,1];
 for(let i=0;i<3;i++)assert.ok(Math.abs(high[i]-low[i]-original.dimensions[axes[i]])<.0001,`${node.name} axis ${i} preserves its size`);
}
console.log('Six buildings preserve source dimensions, spacing, weathered colour and normal textures.');
