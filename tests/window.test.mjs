import assert from 'node:assert/strict';import {frontWallBlocks,groundHeight,stepVertical,clearOfFrontWall,WINDOW} from '../dist/physics.mjs';
// The wall has thickness: the cat cannot stand half inside it from either side.
assert.equal(frontWallBlocks(0,-3.9,0),true,'inside face of front wall is solid');assert.equal(frontWallBlocks(0,-4.2,0),true,'outside face is solid');assert.equal(frontWallBlocks(0,-3.75,0),false,'room floor near the wall is open');assert.equal(frontWallBlocks(0,-4.35,0),false,'courtyard near the wall is open');
assert.equal(frontWallBlocks(-3.2,-4.0,.3),true,'window is too high to walk through');assert.equal(frontWallBlocks(-3.2,-4.0,.69),false,'paws at sill height pass the window');assert.equal(frontWallBlocks(-2.5,-4.0,.9),true,'beside the window stays solid when airborne');
assert.equal(groundHeight(-3.2,-4.05),WINDOW.sill,'cat can stand on the sill');assert.equal(groundHeight(-3.2,-3.6),0);assert.equal(groundHeight(-3.2,-4.5),0);
// Simulate a walking jump in both directions; it must end on the floor or sill, never inside the wall.
for(const [start,dir] of [[-3.7,-1],[-4.4,1]])for(const speed of [1.55,2.8])for(const delay of [0,.1,.2,.35]){
 let z=start,y=0,v=0,air=false,t=0;const dt=1/24;
 for(let i=0;i<24*8;i++){t+=dt;if(!air&&t>=delay&&t<delay+dt*1.5){air=true;v=4.5}
  const nz=z+dir*speed*dt;if(!frontWallBlocks(-3.2,nz,y))z=nz;
  const g=groundHeight(-3.2,z);if(!air&&y>g+.02){air=true;v=0}if(air){const n=stepVertical(y,v,g,dt);y=n.y;v=n.velocity;if(n.landed)air=false}
  if(!air&&frontWallBlocks(-3.2,z,y))assert.fail(`cat grounded inside the wall: start ${start} speed ${speed} delay ${delay} z ${z} y ${y}`)}
 assert.ok(dir<0?z< -4.29:z> -3.81,`route completes: start ${start} speed ${speed} delay ${delay} ended z ${z.toFixed(2)}`)}
assert.ok(clearOfFrontWall(-3.99)> -3.81&&clearOfFrontWall(-4.1)< -4.29&&clearOfFrontWall(-2)=== -2,'older saves inside the wall are moved clear');
console.log('Solid front wall, window sill landing and two-way window route passed.');
