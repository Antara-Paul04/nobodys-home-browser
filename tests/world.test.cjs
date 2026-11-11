const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{const home=await import('../dist/home.mjs');const text=fs.readFileSync('dist/game.js','utf8');const collision=text.slice(text.indexOf('function validPosition('),text.indexOf('function frame('));const ctx={state:{inDark:false},jumping:false,home};vm.createContext(ctx);vm.runInContext(collision+'\nthis.valid=validPosition;',ctx);
assert.equal(ctx.valid(home.spawn.x,home.spawn.z,home.spawn.y),true,'bedroom spawn clear');
const front=home.point(1.4,.35);assert.equal(ctx.valid(front.x,front.z,front.y),false,'closed authored door is solid');
assert.equal(ctx.valid(-3.4,2.04,0),true,'side alley beside bedroom window is clear');assert.equal(ctx.valid(-3.4,-6,0),true,'side alley connects to lane');
assert.equal(ctx.valid(0,-13,0),false,'street buildings remain solid');
ctx.state.inDark=true;assert.equal(ctx.valid(24,-13.5,0),true);assert.equal(ctx.valid(25,-16.3,0),false);assert.equal(ctx.valid(29,-16,0),false);
console.log('Authored home spawn, closed door, side alley and neighbour boundaries passed.')})().catch(e=>{console.error(e);process.exit(1)});
