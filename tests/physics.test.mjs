import assert from 'node:assert/strict';import {blocksFurniture,supportHeight,stepVertical} from '../dist/physics.mjs';
assert.equal(blocksFurniture(0,.2,0),true,'sofa blocks at ground level');assert.equal(blocksFurniture(0,.2,.80),false,'cat can clear sofa at jump height');assert.equal(supportHeight(0,.2),.73);assert.equal(supportHeight(-1.9,.3),0);
let y=0,v=4.5,landed=false,visitedAbove=false;for(let i=0;i<60;i++){let ground=visitedAbove?.73:0;let n=stepVertical(y,v,ground,1/60);y=n.y;v=n.velocity;if(y>.78)visitedAbove=true;if(n.landed){landed=true;break}}assert.equal(visitedAbove,true,'jump clears sofa');assert.equal(landed,true);assert.equal(y,.73,'lands on sofa top');
assert.equal(blocksFurniture(0,.68,.8),true,'sofa back remains solid above cushion');
let fall=stepVertical(.75,0,0,.1);assert.ok(fall.y<.75&&!fall.landed,'falls after leaving the edge');
console.log('Furniture collision, jump landing and walking off edges passed.');
