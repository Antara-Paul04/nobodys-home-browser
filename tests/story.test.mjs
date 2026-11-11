import assert from 'node:assert/strict';import {normaliseState,advanceTime,sleep,takeResource,guidance} from '../dist/story.mjs';
let s=normaliseState({owner:true,outside:true,ate:true});assert.equal(s.day,1);assert.equal(sleep(s,true).ok,false);
s.hour=20;assert.equal(sleep(s,true).event,'visitor');assert.equal(s.hour,2.6);assert.equal(s.day,1);s.visitorDone=true;s.hour=3;assert.equal(sleep(s,true).event,'dawn');assert.equal(s.day,2);assert.equal(s.homeFood,0);assert.equal(s.homeWater,3);
assert.equal(takeResource(s,'streetFood'),true);assert.equal(s.outsideFood,true);assert.equal(takeResource(s,'porchFood'),true);assert.equal(takeResource(s,'porchFood'),false);
s.hour=20;assert.equal(sleep(s,true).event,'dawn');assert.equal(s.day,3);assert.equal(s.homeWater,0);assert.equal(s.returnedHome,true);
let t=normaliseState({hour:23.9});advanceTime(t,Math.ceil(6*120));assert.equal(t.day,2);assert.equal(t.homeFood,0);
assert.deepEqual(guidance(normaliseState({owner:true,outside:true,day:2,homeFood:0}))[0],'An empty bowl');console.log('Story progression, sleep, resources and optional routes passed.');
// Optional owner/TV/breakfast interactions never prevent exploration or sleep.
let skipped=normaliseState({outside:true,owner:false,ate:false,tv:false,hour:20});assert.notEqual(guidance(skipped)[0],'Where is everyone?');assert.equal(sleep(skipped,false).ok,true);assert.equal(skipped.day,2);
let night=normaliseState({hour:22.49});assert.deepEqual(advanceTime(night,2),['visitor']);assert.deepEqual(advanceTime(night,2),[]);
let olderSave=normaliseState({day:2,homeFood:0});assert.equal(olderSave.darkFood,1);assert.equal(takeResource(olderSave,'darkFood'),true);assert.equal(olderSave.outsideFood,true);assert.equal(takeResource(olderSave,'darkFood'),false);
let chapter=normaliseState({day:2,hour:20,outsideFood:true,outsideWater:true,dangerLearned:true,noiseLesson:true,returnedHome:true});assert.equal(sleep(chapter,true).event,'chapter');assert.equal(chapter.chapterComplete,true);
console.log('Optional opening, visitor, older saves and chapter completion passed.');
const {movementMultiplier}=await import('../dist/story.mjs');assert.equal(movementMultiplier({food:100,water:100,energy:100}),1);assert.equal(movementMultiplier({food:0,water:100,energy:100}),.78);assert.ok(Math.abs(movementMultiplier({food:0,water:0,energy:0})-.5)<1e-9);console.log('Low needs slow the cat without blocking progress.');
