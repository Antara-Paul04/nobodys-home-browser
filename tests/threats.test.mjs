import assert from 'node:assert/strict';import {makeThreat,stepThreat,lineClear,PACE} from '../dist/threats.mjs';import {WALK_SPEED,RUN_SPEED} from '../dist/kitten-gait.mjs';
const actor=makeThreat('infected',{x:0,z:-10});let player={x:1,z:-10,y:0,hidden:false,outside:true};
assert.equal(stepThreat(actor,.1,player,null).caught,undefined);assert.equal(actor.mode,'alert','a visible cat gets a warning before pursuit');
stepThreat(actor,PACE.infected.warn+.1,player,null);assert.equal(actor.mode,'chase');player.hidden=true;stepThreat(actor,PACE.lose+.1,player,null);assert.equal(actor.mode,'return','hiding breaks pursuit');
const noiseAgent=makeThreat('infected',{x:0,z:-10});const distant={x:8,z:-9,y:0,hidden:false,outside:true};const noise={id:1,x:.2,z:-10,radius:5};let result=stepThreat(noiseAgent,.1,distant,noise);assert.equal(noiseAgent.mode,'investigate');assert.equal(result.caught,undefined,'reaching a sound does not catch the cat elsewhere');
const highAgent=makeThreat('dog',{x:0,z:-10});stepThreat(highAgent,1,{x:.2,z:-10,y:1,hidden:false,outside:true},null);assert.notEqual(highAgent.mode,'chase','cats above reach are safe');
assert.equal(lineClear({x:0,z:-8},{x:0,z:-10}),true);assert.equal(lineClear({x:3,z:-5.5},{x:4.5,z:-5.5}),false,'obstacle blocks sight');
// Who outruns whom must survive any change of pace: the kitten can walk away from the infected, has to run from the dog, and a run always wins.
assert.ok(PACE.infected.chase<WALK_SPEED,'a walking kitten stays ahead of the infected');assert.ok(PACE.dog.chase>WALK_SPEED&&PACE.dog.chase<RUN_SPEED,'the dog beats a walk and loses to a run');
// The warning is long enough for a kitten spotted two units away to run out of the dog's sight before the chase starts, as it always could.
assert.ok(2+RUN_SPEED*PACE.dog.warn>3.3,'a running kitten can use the warning to get clear');
// Chase in the open: a running kitten pulls away from the dog, a walking one is caught.
function chase(speed){const dogAgent=makeThreat('dog',{x:0,z:-10}),cat={x:1.5,z:-10,y:0,hidden:false,outside:true};stepThreat(dogAgent,.05,cat,null);stepThreat(dogAgent,PACE.dog.warn+.05,cat,null);for(let i=0;i<24*20;i++){if(cat.x<17)cat.x+=speed/24;const r=stepThreat(dogAgent,1/24,cat,null);if(r.caught)return 'caught';if(r.escaped)return 'escaped'}return 'neither'}
assert.equal(chase(WALK_SPEED),'caught');assert.equal(chase(RUN_SPEED),'escaped');
console.log('Threat warning, hiding, noise investigation, climbing and line of sight passed.');
