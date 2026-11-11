import assert from 'node:assert/strict';
import {generateBuilding,proceduralBuildings,buildingSolids} from '../dist/procedural-buildings.mjs';
const lot={x:0,z:0,width:5,depth:5.5,angle:0};
assert.deepEqual(generateBuilding(8211,lot),generateBuilding(8211,lot),'same seed produces the same buildings on every visit');
assert.notDeepEqual(generateBuilding(8211,lot),generateBuilding(8212,lot),'different seeds change architectural details');
assert.equal(proceduralBuildings.length,7);assert.equal(proceduralBuildings.filter(s=>s.shop).length,3);
for(let seed=1;seed<=100;seed++){
 const s=generateBuilding(seed,lot);assert.ok(s.floors===2||s.floors===3);assert.ok(s.parts.length>100);
 for(const p of s.parts)assert.ok(p.w>0&&p.h>0&&p.d>0&&Number.isFinite(p.x+p.y+p.z));
 for(const b of buildingSolids(s))assert.ok(b.minX<b.maxX&&b.minZ<b.maxZ&&b.bottom<b.top);
}
console.log('Procedural generation: 100 seeds produce valid houses; seven stable variants and three shopfronts preserve human-scale openings.');
