import assert from 'node:assert/strict';import * as h from '../dist/home.mjs';
const bed=h.point(6.7,8.45,1.14),outside=h.point(8.05,8.45,0);
for(const [start,end] of [[bed,outside],[outside,bed]]){const route=h.windowPath(start);assert.ok(route,'window can be traversed in both directions');assert.deepEqual(route.at(-1),end);let p=start;for(const q of route){for(let i=1;i<=60;i++){const t=i/60;assert.equal(h.blocks(p.x+(q.x-p.x)*t,p.z+(q.z-p.z)*t,p.y+(q.y-p.y)*t,false),false,'kitten body clears original opening and shutters')}p=q}}
assert.equal(h.windowPath(h.spawn),null,'cannot teleport from across the bedroom');
assert.equal(h.blocks(-2.65,h.window.z,.34,false),true,'wall below window stays solid');
assert.equal(h.blocks(-2.65,h.window.z,1.25,false),false,'opening clears kitten at sill height');
console.log('Authored bedroom window, sill clearance and two-way climb passed.');
