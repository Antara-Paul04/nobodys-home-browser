import assert from 'node:assert/strict';import {makeThreat,stepThreat,lineClear} from '../dist/threats.mjs';
const actor=makeThreat('infected',{x:0,z:-10});let player={x:1,z:-10,y:0,hidden:false,outside:true};
assert.equal(stepThreat(actor,.1,player,null).caught,undefined);assert.equal(actor.mode,'alert','a visible cat gets a warning before pursuit');
stepThreat(actor,1.4,player,null);assert.equal(actor.mode,'chase');player.hidden=true;stepThreat(actor,3.1,player,null);assert.equal(actor.mode,'return','hiding breaks pursuit');
const noiseAgent=makeThreat('infected',{x:0,z:-10});const distant={x:8,z:-9,y:0,hidden:false,outside:true};const noise={id:1,x:.2,z:-10,radius:5};let result=stepThreat(noiseAgent,.1,distant,noise);assert.equal(noiseAgent.mode,'investigate');assert.equal(result.caught,undefined,'reaching a sound does not catch the cat elsewhere');
const highAgent=makeThreat('dog',{x:0,z:-10});stepThreat(highAgent,1,{x:.2,z:-10,y:1,hidden:false,outside:true},null);assert.notEqual(highAgent.mode,'chase','cats above reach are safe');
assert.equal(lineClear({x:0,z:-8},{x:0,z:-10}),true);assert.equal(lineClear({x:3,z:-5.5},{x:4.5,z:-5.5}),false,'obstacle blocks sight');
console.log('Threat warning, hiding, noise investigation, climbing and line of sight passed.');
