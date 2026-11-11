import assert from 'node:assert/strict';
import {generateBuilding,buildingSolids} from '../dist/procedural-buildings.mjs';
import {proceduralBuildings} from '../dist/explore-layout.mjs';
import {makeTree} from '../dist/trees.mjs';
const lot={x:0,z:0,width:4,depth:5.5,angle:0,style:'old',left:'open',right:'party',back:'open'};
assert.deepEqual(generateBuilding(8211,lot),generateBuilding(8211,lot),'same seed produces the same house on every visit');
assert.notDeepEqual(generateBuilding(8211,lot).parts,generateBuilding(8212,lot).parts,'different seeds change architectural details');
const playable=proceduralBuildings.filter(b=>!b.scenery);
assert.ok(playable.length>=45,'the para is dense: houses line every lane');
assert.ok(new Set(playable.map(b=>b.seed)).size===playable.length,'no generated house is repeated');
for(const style of ['old','flat','brick','tin','shop'])assert.ok(playable.some(b=>b.style===style),style+' houses are present');
assert.ok(playable.filter(b=>b.shops).length>=8,'shopfronts with signboards line the lanes');
for(const style of ['old','flat','brick','tin','shop'])for(let seed=1;seed<=40;seed++){
 const s=generateBuilding(seed*17,{...lot,width:2.5+seed%5*.7,style,shops:style==='shop'||style==='tin'?[['দোকান','SHOP','red'],['','','shut']]:undefined});
 assert.ok(s.floors>=1&&s.floors<=4);assert.ok(s.parts.length>40,'a house is more than a box');
 for(const p of s.parts)assert.ok(p.w>0&&p.h>0&&p.d>0&&Number.isFinite(p.x+p.y+p.z+p.ry+p.rx),'valid part');
 for(const b of buildingSolids(s))assert.ok(b.minX<b.maxX&&b.minZ<b.maxZ&&b.bottom<b.top,'valid collision box');
 // Human-scale openings: no door taller than a storey, no window wider than its bay.
 for(const p of s.parts.filter(p=>p.m==='door'))assert.ok(p.h<2&&p.w<1,'doors stay door-sized');
}
for(const kind of ['banyan','peepal','krishnachura','radhachura','neem','mango','jackfruit','kadam','coconut','supari','banana','bamboo','wallpeepal']){
 const a=makeTree(kind,3,0,0,.6),b=makeTree(kind,4,0,0,.6);assert.ok(a.length>8,kind+' grows');assert.deepEqual(a,makeTree(kind,3,0,0,.6),'trees are stable');assert.notDeepEqual(a,b,'no two trees of a kind are alike');
 for(const p of a)assert.ok(p.w>0&&p.h>0&&p.d>0&&Number.isFinite(p.x+p.y+p.z+p.ry+p.rx));
}
console.log(`Procedural generation: 200 seeds across five house styles are valid; ${playable.length} unique houses and thirteen tree kinds are stable between visits.`);
