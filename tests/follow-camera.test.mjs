import assert from 'node:assert/strict';
import {makeFollowCamera,segmentBox} from '../dist/follow-camera.mjs';
import {makeCollisionWorld,spawn} from '../dist/explore-layout.mjs';
import * as home from '../dist/home.mjs';
const w=makeCollisionWorld();let checked=0,confined=0;
const poses=[spawn,{x:-3.4,z:2.04,y:.025},{...home.spawn},{x:-2.25,z:2.0375,y:.855},{x:-2.025,z:2.075,y:.3375},{x:-22,z:-11.4,y:.09},{x:-7.1,z:-10.4,y:.025},{x:12,z:5.7,y:.37},{x:4.35,z:5,y:.025}];
for(const p of poses)for(let i=0;i<32;i++){
 const target={x:p.x,y:p.y+home.HEIGHT*.7,z:p.z},yaw=i*Math.PI/16,rig=makeFollowCamera(),solids=w.nearby(p.x,p.z,4);
 const out=rig.solve({target,yaw,pitch:.3,distance:2.8,solids});
 assert.equal(out.yaw,yaw,'obstacle avoidance never changes movement direction');
 assert.ok(out.distance>=.48,'camera never collapses into the kitten');
 assert.ok(Number.isFinite(out.position.y));
 if(out.confined){confined++;assert.equal(out.distance,.85,'very confined views use readable distance and occluder fading')}
 else for(const s of solids){if(s.maxX-s.minX<.2&&s.maxZ-s.minZ<.2)continue;assert.equal(segmentBox(target,out.position,s,.025),null,'camera volume stays on the visible side of obstacles')}
 checked++;
}
const rig=makeFollowCamera(),target={x:0,y:.2,z:0},wall={minX:-3,maxX:3,minZ:.4,maxZ:.6,bottom:0,top:3};
const cramped=rig.solve({target,yaw:0,pitch:.3,distance:3,solids:[wall]});
assert.ok(cramped.elevation>1,'camera rises beside a wall instead of rotating the controls');
const open=rig.solve({target,yaw:0,pitch:.3,distance:3,solids:[],dt:1/24});assert.ok(open.elevation>.3,'return from an obstruction is smoothed');
console.log(`Camera: ${checked} real-world angles checked; ${confined} confined views explicitly use occluder fading; no forced yaw changes.`);
