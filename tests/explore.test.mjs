import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeCollisionWorld,spawn,props,houses} from '../dist/explore-layout.mjs';
import {advancePlayer} from '../dist/explore-movement.mjs';
import * as home from '../dist/home.mjs';
const world=makeCollisionWorld();
assert.ok(world.valid(spawn.x,spawn.z,spawn.y),'spawn is clear');
for(const p of props.filter(p=>p.name==='Taxi'))assert.equal(world.valid(p.x,p.z,.025),false,'authored taxi body is solid');
assert.equal(world.valid(11,3.3,.025),false,'courtyard tap is solid');
assert.equal(world.valid(14.6,3.5,.025),false,'tree trunk is solid');
// Flood the actual walkable collision field; every destination must connect to spawn.
const step=.2,xmin=-32.8,zmin=-21.8,w=329,h=214,visited=new Uint8Array(w*h),queue=new Int32Array(w*h);
const cell=(x,z)=>[Math.round((x-xmin)/step),Math.round((z-zmin)/step)];
let [sx,sz]=cell(spawn.x,spawn.z),head=0,tail=1;queue[0]=sz*w+sx;visited[queue[0]]=1;
while(head<tail){const n=queue[head++],x=n%w,z=Math.floor(n/w);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,id=zz*w+xx;if(xx<0||xx>=w||zz<0||zz>=h||visited[id])continue;const wx=xmin+xx*step,wz=zmin+zz*step;if(!world.valid(wx,wz,.025))continue;visited[id]=1;queue[tail++]=id}}
for(const [name,x,z] of [['market',-26,-10],['west passage',-12.8,3],['window alley',-3.4,2.04],['back lane',0,9.8],['east passage',22.1,-2],['right courtyard',12,5],['left courtyard',-8,6],['far west corner',-31.7,-9.8],['far east corner',31,-9.8]]){const [xx,zz]=cell(x,z);assert.equal(visited[zz*w+xx],1,`${name} connects to the home lane`)}
// Simulate held movement and jump against the real geometry at low and high frame times.
for(const dt of [1/24,.08]){
 let p={x:-8.8,z:-8.7,y:.025,velocity:0,jumping:false};
 for(let i=0;i<120;i++)advancePlayer(p,{x:0,z:-1,running:true},dt,world);
 assert.ok(p.z> -10.65,'running stops at the taxi');
 assert.ok(world.valid(p.x,p.z,p.y,false),'running does not tunnel inside a car');
 p={x:12,z:5.7,y:.37,velocity:0,jumping:false};for(let i=0;i<60;i++)advancePlayer(p,{x:0,z:0},dt,world);assert.ok(Math.abs(p.y-.37)<.001,'bench supports the paws');
 p={...spawn,velocity:0,jumping:false};let maxY=0;for(let i=0;i<50;i++){advancePlayer(p,{x:0,z:0,jump:i===0},dt,world);maxY=Math.max(maxY,p.y)}assert.ok(maxY>.5&&maxY<.75,'kitten jump has believable height');assert.equal(p.jumping,false,'jump lands');
}
const data=fs.readFileSync(new URL('../dist/assets/kolkata-street.glb',import.meta.url));const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)));
for(const name of ['SweetShop','Grocery','TeaShop','PaanKiosk','Taxi'])assert.ok(gltf.nodes.some(n=>n.name===name),name+' uses the authored asset');
assert.ok(gltf.images.length>=8,'shops include baked colour and relief');
const code=fs.readFileSync(new URL('../dist/explore.js',import.meta.url),'utf8');assert.ok(!code.includes('nobodys-home-web-first-morning-v1'),'exploration does not write story saves');assert.match(code,/1000\/24/,'low-power cap remains');assert.match(code,/document.hidden&&playing/,'background pauses remain');
assert.ok(fs.readFileSync(new URL('../dist/story.html',import.meta.url),'utf8').includes('src="game.js"'),'story remains available');
console.log('Exploration: all nine routes connect; taxi, trees and tap block movement; benches and jumps support the kitten; original shops and isolated saves verified.');
// The storage trunk blocks a straight line under the bed, but the actual side route remains usable.
const underBed={x:-2.025,z:2.075,y:.3375,velocity:0,jumping:false};
for(let i=0;i<11;i++)advancePlayer(underBed,{x:0,z:1},1/24,world);
for(let i=0;i<44;i++)advancePlayer(underBed,{x:1,z:0},1/24,world);
assert.ok(underBed.x>-.2,'kitten can walk around the trunk and out from under the bed');
// A low step under a roof must not lift the kitten into the roof and strand it.
const tightWorld={valid(x,z,y){return x<.5||y+.225<=.31},ground(x,z){return x<.5?0:.1},ceiling(x,z,a,b){return b},landing(){return null}};
const trapped={x:0,z:0,y:0,velocity:0,jumping:false};for(let i=0;i<30;i++)advancePlayer(trapped,{x:1,z:0},1/24,tightWorld);assert.ok(trapped.x<.5,'low overhead clearance prevents an invalid step');
console.log('Extra movement checks: under-bed exit and low-ceiling step prevention passed.');
