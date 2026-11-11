import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeCollisionWorld,spawn,assets,lanes,limits,pond,trees,proceduralBuildings,houses,clutter} from '../dist/explore-layout.mjs';
import {advancePlayer} from '../dist/explore-movement.mjs';
const world=makeCollisionWorld();
assert.ok(world.valid(spawn.x,spawn.z,spawn.y),'spawn is clear');
for(const a of assets.filter(a=>a.name==='Taxi'))assert.equal(world.valid(a.x,a.z,.025),false,'parked taxi is solid');
assert.equal(world.valid(-22.5,.9,.025),false,'tube well is solid');
assert.equal(world.valid(trees[0][1],trees[0][2],.025),false,'banyan trunk is solid');
assert.equal(world.valid(pond.x,pond.z,.025),false,'the pond is not walkable');
// This is a para of narrow lanes: nothing in it is wider than a parked taxi and a squeeze.
const lane=id=>lanes.find(l=>l.id===id),width=l=>Math.min(l.x1-l.x0,l.z1-l.z0);
assert.ok(width(lane('main'))<=3.5,'main lane stays narrow');
for(const id of ['homegali','back','g1n','g1s','g2','g2n','g3n','g3s','g4'])assert.ok(width(lane(id))<=2.15,id+' is a gali, not a road');
for(const id of ['homegap','slot'])assert.ok(width(lane(id))<=1,id+' is a gap only a cat fits through');
assert.equal(houses.length,6,'each authored house appears once, never repeated');
// Flood the actual walkable collision field; every destination must connect to spawn.
const step=.1,x0=limits.minX,z0=limits.minZ,w=Math.round((limits.maxX-x0)/step)+1,h=Math.round((limits.maxZ-z0)/step)+1,visited=new Uint8Array(w*h),queue=new Int32Array(w*h);
const cell=(x,z)=>[Math.round((x-x0)/step),Math.round((z-z0)/step)];
let [sx,sz]=cell(spawn.x,spawn.z),head=0,tail=1;queue[0]=sz*w+sx;visited[queue[0]]=1;
while(head<tail){const n=queue[head++],x=n%w,z=Math.floor(n/w);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,id=zz*w+xx;if(xx<0||xx>=w||zz<0||zz>=h||visited[id])continue;if(!world.valid(x0+xx*step,z0+zz*step,.025))continue;visited[id]=1;queue[tail++]=id}}
const places=[['main lane, west end',-30,-11],['main lane, east end',24,-11.2],['chowk',-22,-9],['home gali, west',-18,-5.6],['home gali, east',12,-5.6],['window alley',-3.4,2.04],['back lane',0,9.2],['back lane, west end',-25,9.2],
 ['tube-well gali',-20.8,3],['pond bank',-24,2.6],['drain alley',-12,1.85],['short cut',-7.1,-8],['narrow gali',9.05,-8],['courtyard gali',13.3,2],['courtyard',18,0],['behind the houses',0,-21.6],['godown gali',20,-17],
 ['slot between walls',8,2.15],['gap beside home',3.03,1],['recess behind the yard',0,7.6],['big road',30,0],['footpath',26.5,-1]];
for(const [name,x,z] of places){const [xx,zz]=cell(x,z);assert.equal(visited[zz*w+xx],1,`${name} connects to the home gali`)}
// Simulate held movement and jump against the real geometry at low and high frame times.
const taxi=assets.find(a=>a.name==='Taxi');
for(const dt of [1/24,.08]){
 let p={x:taxi.x,z:taxi.z-1.6,y:.025,velocity:0,jumping:false};
 for(let i=0;i<120;i++)advancePlayer(p,{x:0,z:1,running:true},dt,world);
 assert.ok(p.z<taxi.z,'running stops at the taxi');
 assert.ok(world.valid(p.x,p.z,p.y,false),'running does not tunnel inside a car');
 p={x:18.6,z:2.45,y:.335,velocity:0,jumping:false};for(let i=0;i<60;i++)advancePlayer(p,{x:0,z:0},dt,world);assert.ok(Math.abs(p.y-.335)<.001,'bench supports the paws');
 p={...spawn,velocity:0,jumping:false};let maxY=0;for(let i=0;i<50;i++){advancePlayer(p,{x:0,z:0,jump:i===0},dt,world);maxY=Math.max(maxY,p.y)}assert.ok(maxY>.5&&maxY<.75,'kitten jump has believable height');assert.equal(p.jumping,false,'jump lands');
}
const names=file=>{const data=fs.readFileSync(new URL('../dist/assets/'+file,import.meta.url));return JSON.parse(data.subarray(20,20+data.readUInt32LE(12))).nodes.map(n=>n.name)};
for(const name of ['SweetShop','Grocery','TeaShop','PaanKiosk'])assert.ok(names('kolkata-street.glb').includes(name),name+' uses the authored asset');
for(const a of assets)assert.ok(names('kolkata-props.glb').includes(a.name),a.name+' is in the exported street props');
assert.ok(clutter.parts.length>1500&&clutter.decals.length>600&&clutter.wires.length>80,'lanes are dressed: clutter, grime and overhead wires');
const code=fs.readFileSync(new URL('../dist/explore.js',import.meta.url),'utf8');assert.ok(!code.includes('nobodys-home-web-first-morning-v1'),'exploration does not write story saves');assert.match(code,/1000\/24/,'low-power cap remains');assert.match(code,/document.hidden&&playing/,'background pauses remain');
assert.ok(fs.readFileSync(new URL('../dist/story.html',import.meta.url),'utf8').includes('src="game.js"'),'story remains available');
console.log(`Exploration: all ${places.length} places connect through narrow lanes and cat gaps; taxi, tube well, banyan and pond block movement; benches and jumps support the kitten; authored shops, exported props and isolated saves verified.`);
// The storage trunk blocks a straight line under the bed, but the actual side route remains usable.
const underBed={x:-2.025,z:2.075,y:.3375,velocity:0,jumping:false};
for(let i=0;i<11;i++)advancePlayer(underBed,{x:0,z:1},1/24,world);
for(let i=0;i<44;i++)advancePlayer(underBed,{x:1,z:0},1/24,world);
assert.ok(underBed.x>-.2,'kitten can walk around the trunk and out from under the bed');
// A low step under a roof must not lift the kitten into the roof and strand it.
const tightWorld={valid(x,z,y){return x<.5||y+.225<=.31},ground(x,z){return x<.5?0:.1},ceiling(x,z,a,b){return b},landing(){return null}};
const trapped={x:0,z:0,y:0,velocity:0,jumping:false};for(let i=0;i<30;i++)advancePlayer(trapped,{x:1,z:0},1/24,tightWorld);assert.ok(trapped.x<.5,'low overhead clearance prevents an invalid step');
console.log('Extra movement checks: under-bed exit and low-ceiling step prevention passed.');
