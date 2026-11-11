import assert from 'node:assert/strict';
import {readGraphicsMode,saveGraphicsMode,renderPixelRatio} from '../dist/graphics.mjs';

// Retina windows get extra detail, without an unbounded full-screen GPU load.
assert.equal(renderPixelRatio(1280,720,2,'balanced'),1.5);
assert.equal(renderPixelRatio(1280,720,2,'sharper'),2);
assert.equal(renderPixelRatio(800,600,1,'sharper'),1);
for(const [mode,budget] of [['cooler',850000],['balanced',2400000],['sharper',5000000]]){
  for(const [w,h] of [[320,568],[1280,720],[1920,1080],[3840,2160]]){
    for(const dpr of [.8,1,1.25,2,3]){
      const scale=renderPixelRatio(w,h,dpr,mode);
      assert.ok(scale>0&&scale<=dpr,'never render beyond the screen resolution');
      assert.ok(Math.floor(w*scale)*Math.floor(h*scale)<=budget,'pixel budget holds even on a 4K display');
    }
  }
}
assert.ok(renderPixelRatio(1440,900,2,'balanced')>renderPixelRatio(1440,900,2,'cooler'));
assert.equal(renderPixelRatio(800,600,2,'invalid'),1.5);
assert.ok(Number.isFinite(renderPixelRatio(0,NaN,undefined,'balanced')));
const saves=new Map([['nobodys-home-web-first-morning-v1','story-progress'],['nobodys-home-kolkata-explore-v1','lane-position']]);
const storage={getItem:k=>saves.get(k),setItem:(k,v)=>saves.set(k,v)};
assert.equal(readGraphicsMode(storage),'balanced');
saveGraphicsMode(storage,'cooler');assert.equal(readGraphicsMode(storage),'cooler');
saveGraphicsMode(storage,'sharper');assert.equal(readGraphicsMode(storage),'sharper');
saveGraphicsMode(storage,'__proto__');assert.equal(readGraphicsMode(storage),'balanced');
assert.equal(saves.get('nobodys-home-web-first-morning-v1'),'story-progress');
assert.equal(saves.get('nobodys-home-kolkata-explore-v1'),'lane-position');
const blocked={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};
assert.equal(readGraphicsMode(blocked),'balanced');
assert.equal(saveGraphicsMode(blocked,'cooler'),'cooler');
console.log('Graphics: Retina detail, all three pixel budgets, display limits and isolated saved preferences passed.');
