import fs from 'node:fs';import assert from 'node:assert/strict';import * as h from '../dist/home.mjs';import data from '../dist/home-data.mjs';
const b=fs.readFileSync(new URL('../dist/assets/hero-home.glb',import.meta.url)),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
assert.equal(g.nodes.length,data.meshCount);
for(const original of data.sourceObjects){if(original.name==='Gap window shutters')continue;assert.ok(g.nodes.some(n=>n.name===original.name),original.name+' retained')}
for(const name of ['Home front door left','Home front door right','Home window left','Home window right'])assert.ok(g.nodes.some(n=>n.name===name));
assert.ok(g.materials.some(m=>m.alphaMode==='BLEND'),'mosquito net transparency retained');
assert.ok(g.materials.some(m=>m.pbrMetallicRoughness?.baseColorTexture),'baked source materials retained');
for(const name of ['Hero house - upper floor + ceiling','Back yard','Sofa (wooden)','Bed (four-poster)','Kitchen platform + stove','Radio'])assert.ok(g.nodes.some(n=>n.name===name));
const old={homeLayout:1,x:0,z:2,food:31,day:3};h.migrate(old);assert.equal(old.x,h.spawn.x);assert.equal(old.food,31);assert.equal(old.day,3);
for(const p of [h.food,h.water,h.spawn])assert.equal(h.blocks(p.x,p.z,p.y,false),false,'gameplay spots are clear');
console.log('Complete furnished home, original objects, baked materials, clear interaction spots and save migration passed.');
