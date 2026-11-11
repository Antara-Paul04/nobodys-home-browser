// Measure the real skinned kitten through its animations without creating a renderer.
import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/three/examples/jsm/loaders/GLTFLoader.js';import * as home from '../dist/home.mjs';
const bytes=fs.readFileSync(new URL('../dist/assets/kitten.glb',import.meta.url)),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length));
// Textures are irrelevant to dimensions; omit them from this in-memory test copy.
delete json.images;delete json.textures;delete json.materials;for(const mesh of json.meshes)for(const p of mesh.primitives)delete p.material;
const text=Buffer.from(JSON.stringify(json)),chunk=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(chunk);
const binary=bytes.subarray(20+length),glb=Buffer.alloc(20+chunk.length+binary.length);
glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(chunk.length,12);glb.writeUInt32LE(0x4e4f534a,16);chunk.copy(glb,20);binary.copy(glb,20+chunk.length);
const model=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
model.scene.scale.setScalar(home.SCALE);const mixer=new THREE.AnimationMixer(model.scene);
for(const name of ['Idle','Walk','Run','Eat']){
 mixer.stopAllAction();mixer.clipAction(model.animations.find(c=>c.name===name)).play();
 for(const t of [0,.25,.5,.75]){mixer.setTime(t);model.scene.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(model.scene,true).getSize(new THREE.Vector3());
  assert.ok(size.y<.315*.8,`${name}: kitten must be shorter than a chair seat`);
  assert.ok(size.x/2<=home.RADIUS+.005,`${name}: collision radius covers the kitten`);
  assert.ok(size.y<=home.HEIGHT+.01,`${name}: collision height matches the kitten`);
 }
}
console.log('Real kitten stays smaller than chair seats and matches its collision body in idle, walk, run and eating.');
