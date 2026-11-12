// The kitten must not skate: its planted paws have to move about as fast as its body travels.
import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/three/examples/jsm/loaders/GLTFLoader.js';import * as home from '../dist/home.mjs';
import {prepareGait,plantedSpeed} from '../dist/kitten-gait.mjs';import {WALK_SPEED,RUN_SPEED,advancePlayer} from '../dist/explore-movement.mjs';
const bytes=fs.readFileSync(new URL('../dist/assets/kitten.glb',import.meta.url)),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length));
delete json.images;delete json.textures;delete json.materials;for(const mesh of json.meshes)for(const p of mesh.primitives)delete p.material;
const text=Buffer.from(JSON.stringify(json)),chunk=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(chunk);
const binary=bytes.subarray(20+length),glb=Buffer.alloc(20+chunk.length+binary.length);
glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(chunk.length,12);glb.writeUInt32LE(0x4e4f534a,16);chunk.copy(glb,20);binary.copy(glb,20+chunk.length);
const model=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
const before={Walk:plantedSpeed(model.scene,model.animations.find(c=>c.name==='Walk'))*home.SCALE,Run:plantedSpeed(model.scene,model.animations.find(c=>c.name==='Run'))*home.SCALE};
model.scene.scale.setScalar(home.SCALE);const gait=prepareGait(model.scene,model.animations,home.SCALE);
assert.ok(gait.natural.Walk>before.Walk*1.8&&gait.natural.Run>before.Run*1.5,'stride is lengthened');
for(const [name,speed] of [['Walk',WALK_SPEED],['Run',RUN_SPEED]]){
 const rate=gait.rate(name,speed),cycles=rate/model.animations.find(c=>c.name===name).duration;
 assert.ok(Math.abs(gait.natural[name]*rate-speed)/speed<.05,`${name}: planted paws move at body speed`);
 assert.ok(cycles<5.2,`${name}: at most about five steps a second, readable at 24 frames a second`);
}
// No in-between speed slides either (a hungry kitten, or one brushing along a wall while running): above what walking legs can match, it runs.
for(let speed=.15;speed<=RUN_SPEED;speed+=.05){const name=speed>.63?'Run':'Walk';assert.ok(Math.abs(gait.natural[name]*gait.rate(name,speed)-speed)/speed<.05,`paws keep pace at ${speed.toFixed(2)}`)}
assert.ok(gait.rate('Walk',.05)>=.7,'legs never freeze mid-step while easing to a stop');
// The lengthened gait still fits the kitten's collision body.
const mixer=new THREE.AnimationMixer(model.scene);
for(const name of ['Walk','Run']){mixer.stopAllAction();mixer.clipAction(model.animations.find(c=>c.name===name)).play();
 for(const t of [0,.2,.4,.6,.8]){mixer.setTime(t);model.scene.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(model.scene,true).getSize(new THREE.Vector3());
  assert.ok(size.y<=home.HEIGHT+.012,`${name}: still fits its collision height`);assert.ok(size.x/2<=home.RADIUS+.008,`${name}: still fits its collision radius`)}}
// Pace: a walk covers WALK_SPEED, easing scales it, and running is clearly faster.
const flat={valid:()=>true,ground:()=>.025,ceiling:(x,z,a,b)=>b,landing:()=>.025};
const go=input=>{const p={x:0,z:0,y:.025,velocity:0,jumping:false};for(let i=0;i<24;i++)advancePlayer(p,input,1/24,flat);return p.x};
assert.ok(Math.abs(go({x:1,z:0})-WALK_SPEED)<.01);assert.ok(Math.abs(go({x:1,z:0,running:true})-RUN_SPEED)<.01);assert.ok(Math.abs(go({x:1,z:0,pace:.5})-WALK_SPEED/2)<.01);
console.log(`Gait: stride lengthened ${(gait.natural.Walk/before.Walk).toFixed(1)}× (walk) and ${(gait.natural.Run/before.Run).toFixed(1)}× (run); paws keep pace with the body at ${WALK_SPEED} and ${RUN_SPEED} units a second.`);
