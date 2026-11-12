import * as home from '../dist/home.mjs';
import {readGraphicsMode,saveGraphicsMode,renderPixelRatio} from '../dist/graphics.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import * as three from '../dist/vendor/three/build/three.module.js';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('..',import.meta.url));
const story=await import(dir+'/dist/story.mjs'),physics=await import(dir+'/dist/physics.mjs'),camera=await import(dir+'/dist/camera.mjs'),threats=await import(dir+'/dist/threats.mjs');
let clock=10000,handlers={},nodes=new Map(),saved={};function node(id){if(!nodes.has(id)){const cls={add(){},remove(){},toggle(){}};nodes.set(id,{id,hidden:false,disabled:false,textContent:'',innerHTML:'',style:{},classList:cls,parentElement:{classList:cls},appendChild(){},addEventListener(){},setPointerCapture(){}})}return nodes.get(id)}
let canvas=node('canvas');const T={...three,WebGLRenderer:class{constructor(){this.domElement=canvas;this.shadowMap={}}setPixelRatio(){}setSize(){}render(){}}};
class Loader{load(path,ok){if(!path.includes('kitten.glb'))return;let scene=new T.Group();scene.add(new T.Mesh(new T.BoxGeometry(.4,.6,.5),new T.MeshBasicMaterial()));ok({scene,animations:[]})}}
const document={getElementById:node,addEventListener(){},hidden:false};const storage={getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]};
let code=fs.readFileSync(dir+'/dist/game.js','utf8').replace(/^import .*?;\s*$/gm,'');
code+='\nreturn {state,catRoot,items,interact,nearby,itemLabel,toggleHiding,startVisitor,updateThreats,emitNoise,validPosition,questUI,save,get dog(){return dog},get infected(){return infected},get visitorActive(){return visitorActive}, get noiseTarget(){return noiseTarget},start(){playing=true},setY(v){y=v}, forceFrame(t){frame(t)},get visible(){return catRoot.visible}}';
const create=new Function('readGraphicsMode','saveGraphicsMode','renderPixelRatio','makeFollowCamera','bindMouseLook','home','THREE','GLTFLoader','normaliseState','advanceTime','period','takeResource','sleep','guidance','movementMultiplier','constrainCamera','stepVertical','makeThreat','stepThreat','prepareGait','WALK_SPEED','RUN_SPEED','document','localStorage','addEventListener','innerWidth','innerHeight','devicePixelRatio','requestAnimationFrame','setTimeout','clearTimeout','performance',code);
const {makeFollowCamera}=await import('../dist/follow-camera.mjs');const gaits=await import('../dist/kitten-gait.mjs');
const api=create(readGraphicsMode,saveGraphicsMode,renderPixelRatio,makeFollowCamera,()=>({lock(){},unlock(){}}),home,T,Loader,story.normaliseState,story.advanceTime,story.period,story.takeResource,story.sleep,story.guidance,story.movementMultiplier,camera.constrainCamera,physics.stepVertical,threats.makeThreat,threats.stepThreat,gaits.prepareGait,gaits.WALK_SPEED,gaits.RUN_SPEED,document,storage,(type,fn)=>{handlers[type]=fn},800,600,1,()=>{},()=>0,()=>{},{now:()=>clock});
let n=0,failed=0;function check(label,fn){try{fn();console.log('PASS '+label);n++}catch(e){failed++;console.log('FAIL '+label+' — '+e.message)}}
const move=(x,z,y=home.inside(x,z)?home.spawn.y:0)=>{api.catRoot.position.set(x,y,z);api.setY(y)};api.start();
check('opening owner clue and guidance',()=>{move(home.bed.x,home.bed.z);assert.equal(api.nearby().type,'bed');api.interact();assert.equal(api.state.owner,true)});
check('food and water reduce bowl supplies',()=>{move(home.food.x,home.food.z);api.interact();assert.equal(api.state.homeFood,1);move(home.water.x,home.water.z);api.interact();assert.equal(api.state.homeWater,2)});
check('optional TV broadcasts caption',()=>{move(home.radio.x+.3,home.radio.z-.4);api.interact();assert.equal(api.state.tv,true);assert.equal(node('caption').hidden,false)});
check('door stays locked',()=>{move(home.door.x,home.door.z);api.interact();assert.match(node('thought').textContent,/won’t budge/)});
check('home sleep triggers the first night visitor',()=>{api.state.hour=20;move(home.bed.x,home.bed.z);api.interact();assert.equal(api.visitorActive,true);assert.equal(api.state.hour,2.6)});
check('bed hiding avoids the visitor',()=>{api.toggleHiding();assert.equal(api.state.hidden,true);assert.equal(api.visible,false);api.updateThreats(1);assert.equal(api.visitorActive,true);api.toggleHiding();assert.equal(api.visible,true)});
check('quiet lets window visitor leave',()=>{api.updateThreats(30);assert.equal(api.visitorActive,false);assert.equal(api.state.visitorDone,true)});
check('sleep leads to next morning and empty home food',()=>{api.state.hour=3;move(home.bed.x,home.bed.z);api.interact();assert.equal(api.state.day,2);assert.equal(api.state.homeFood,0)});
check('empty bowl remains empty',()=>{move(home.food.x,home.food.z);api.interact();assert.equal(api.state.homeFood,0);assert.match(node('thought').textContent,/Empty/)});
check('outside food and water deplete and record discovery',()=>{move(8.7,-8.55);api.interact();assert.equal(api.state.outsideFood,true);move(3.0,-5.4);api.interact();assert.equal(api.state.outsideWater,true)});
check('neighbour house can be entered',()=>{move(-2.6,-11.3);api.interact();assert.equal(api.state.inDark,true);assert.equal(api.state.visitedDark,true)});
check('tins wake the dark-house figure and record noise lesson',()=>{move(22.1,-14.6);api.interact();assert.equal(api.state.darkAwake,true);assert.equal(api.state.noiseLesson,true)});
check('neighbour house exit returns to lane',()=>{move(24,-13);api.interact();assert.equal(api.state.inDark,false);assert.equal(api.catRoot.position.x,-2.6)});
check('radio can be heard without TV',()=>{api.state.tv=false;move(10.3,-11.95);api.interact();assert.equal(api.state.radioHeard,true)});
check('jumping over building fronts remains blocked',()=>{move(0,-11.9);assert.equal(api.validPosition(0,-12.35,2),false)});
check('first-night visitor can catch the cat standing outside beside it',()=>{api.state.inDark=false;api.state.day=1;api.state.visitorDone=false;api.startVisitor();move(home.visitor.x,home.visitor.z);for(let i=0;i<10;i++)api.updateThreats(.5);assert.ok(Math.hypot(api.catRoot.position.x-home.visitor.x,api.catRoot.position.z-home.visitor.z)>1,'cat remains beside visitor without being caught')});

check('visitor stays outside and cannot catch a cat indoors',()=>{api.state.day=1;api.state.visitorDone=false;api.startVisitor();move(home.spawn.x,home.spawn.z);for(let i=0;i<10;i++)api.updateThreats(.5);assert.equal(api.catRoot.position.z,home.spawn.z);assert.equal(home.inside(api.infected.position.x,api.infected.position.z),false)});
check('chapter completion follows survival discoveries without the television',()=>{api.updateThreats(30);api.state.hidden=false;api.state.inDark=false;api.state.day=2;api.state.hour=20;api.state.owner=true;api.state.tv=false;api.state.visitorDone=true;api.state.outsideFood=true;api.state.outsideWater=true;api.state.dangerLearned=true;api.state.noiseLesson=true;api.state.chapterComplete=false;move(home.bed.x,home.bed.z);api.interact();assert.equal(api.state.chapterComplete,true);assert.equal(api.state.day,3);assert.match(node('thought').textContent,/not come back/)});
// Story mode moves at the same kitten pace as free roam, eases in, and stops without drifting.
check('story kitten walks and runs at free-roam pace',()=>{
 const key=(type,code)=>handlers[type]({code,preventDefault(){}}),at=()=>({x:api.catRoot.position.x,z:api.catRoot.position.z});
 const play=seconds=>{for(let i=0;i<Math.round(seconds*24);i++){clock+=42;api.forceFrame(clock)}};
 const covered=(seconds)=>{const a=at();play(seconds);const b=at();return Math.hypot(b.x-a.x,b.z-a.z)/(seconds*24*.042/seconds)/seconds};
 Object.assign(api.state,{hidden:false,inDark:false,food:100,water:100,energy:100});clock+=60000;move(-9,-9.6);play(.5);
 key('keydown','KeyW');const first=covered(.1);play(1);const walk=covered(1);
 key('keydown','ShiftLeft');play(1);move(-9,-9.6);const run=covered(1);
 key('keyup','ShiftLeft');key('keyup','KeyW');play(1);const rest=covered(1);
 assert.ok(first<gaits.WALK_SPEED*.6,'eases into the walk');assert.ok(Math.abs(walk-gaits.WALK_SPEED)<.02,'walks at '+walk.toFixed(2));
 assert.ok(Math.abs(run-gaits.RUN_SPEED)<.04,'runs at '+run.toFixed(2));assert.equal(rest,0,'comes to rest');
 api.state.food=0;api.state.water=0;move(-9,-9.6);key('keydown','KeyW');play(1);const hungry=covered(1);key('keyup','KeyW');play(1);
 assert.ok(Math.abs(hungry-gaits.WALK_SPEED*.64)<.02,'hunger and thirst still slow the kitten');
});
console.log('Integration checks completed: '+n+' passed, '+failed+' failed.');
if(failed)process.exitCode=1;
