import fs from 'node:fs';import assert from 'node:assert/strict';import * as three from '../dist/vendor/three/build/three.module.js';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('..',import.meta.url));
const story=await import(dir+'/dist/story.mjs'),physics=await import(dir+'/dist/physics.mjs'),camera=await import(dir+'/dist/camera.mjs'),threats=await import(dir+'/dist/threats.mjs');
let handlers={},nodes=new Map(),saved={};function node(id){if(!nodes.has(id)){const cls={add(){},remove(){},toggle(){}};nodes.set(id,{id,hidden:false,disabled:false,textContent:'',innerHTML:'',style:{},classList:cls,parentElement:{classList:cls},appendChild(){},addEventListener(){},setPointerCapture(){}})}return nodes.get(id)}
let canvas=node('canvas');const T={...three,WebGLRenderer:class{constructor(){this.domElement=canvas}setPixelRatio(){}setSize(){}render(){}}};
class Loader{load(path,ok){let scene=new T.Group();scene.add(new T.Mesh(new T.BoxGeometry(.4,.6,.5),new T.MeshBasicMaterial()));ok({scene,animations:[]})}}
const document={getElementById:node,addEventListener(){},hidden:false};const storage={getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]};
let code=fs.readFileSync(dir+'/dist/game.js','utf8').replace(/^import .*?;\s*$/gm,'');
code+='\nreturn {state,catRoot,items,interact,nearby,itemLabel,toggleHiding,startVisitor,updateThreats,emitNoise,validPosition,questUI,save,get dog(){return dog},get infected(){return infected},get visitorActive(){return visitorActive}, get noiseTarget(){return noiseTarget},start(){playing=true},setY(v){y=v}, forceFrame(t){frame(t)},get visible(){return catRoot.visible}}';
const create=new Function('THREE','GLTFLoader','normaliseState','advanceTime','period','takeResource','sleep','guidance','movementMultiplier','constrainCamera','insideFurniture','blocksFurniture','groundHeight','stepVertical','frontWallBlocks','clearOfFrontWall','WINDOW','makeThreat','stepThreat','document','localStorage','addEventListener','innerWidth','innerHeight','devicePixelRatio','requestAnimationFrame','setTimeout','clearTimeout','performance',code);
const api=create(T,Loader,story.normaliseState,story.advanceTime,story.period,story.takeResource,story.sleep,story.guidance,story.movementMultiplier,camera.constrainCamera,physics.insideFurniture,physics.blocksFurniture,physics.groundHeight,physics.stepVertical,physics.frontWallBlocks,physics.clearOfFrontWall,physics.WINDOW,threats.makeThreat,threats.stepThreat,document,storage,()=>{},800,600,1,()=>{},()=>0,()=>{},{now:()=>10000});
let n=0,failed=0;function check(label,fn){try{fn();console.log('PASS '+label);n++}catch(e){failed++;console.log('FAIL '+label+' — '+e.message)}}
const move=(x,z)=>api.catRoot.position.set(x,0,z);api.start();
check('opening owner clue and guidance',()=>{move(-1.9,.3);assert.equal(api.nearby().type,'bed');api.interact();assert.equal(api.state.owner,true)});
check('food and water reduce bowl supplies',()=>{move(2.75,1.85);api.interact();assert.equal(api.state.homeFood,1);move(3.48,1.85);api.interact();assert.equal(api.state.homeWater,2)});
check('optional TV broadcasts caption',()=>{move(2.9,-1.65);api.interact();assert.equal(api.state.tv,true);assert.equal(node('caption').hidden,false)});
check('door stays locked',()=>{move(2.8,3.75);api.interact();assert.match(node('thought').textContent,/won’t budge/)});
check('home sleep triggers the first night visitor',()=>{api.state.hour=20;move(-1.9,.3);api.interact();assert.equal(api.visitorActive,true);assert.equal(api.state.hour,2.6)});
check('bed hiding avoids the visitor',()=>{api.toggleHiding();assert.equal(api.state.hidden,true);assert.equal(api.visible,false);api.updateThreats(1);assert.equal(api.visitorActive,true);api.toggleHiding();assert.equal(api.visible,true)});
check('quiet lets window visitor leave',()=>{api.updateThreats(30);assert.equal(api.visitorActive,false);assert.equal(api.state.visitorDone,true)});
check('sleep leads to next morning and empty home food',()=>{api.state.hour=3;move(-1.9,.3);api.interact();assert.equal(api.state.day,2);assert.equal(api.state.homeFood,0)});
check('empty bowl remains empty',()=>{move(2.75,1.85);api.interact();assert.equal(api.state.homeFood,0);assert.match(node('thought').textContent,/Empty/)});
check('outside food and water deplete and record discovery',()=>{move(8.7,-8.55);api.interact();assert.equal(api.state.outsideFood,true);move(3.0,-5.4);api.interact();assert.equal(api.state.outsideWater,true)});
check('neighbour house can be entered',()=>{move(-2.6,-11.3);api.interact();assert.equal(api.state.inDark,true);assert.equal(api.state.visitedDark,true)});
check('tins wake the dark-house figure and record noise lesson',()=>{move(22.1,-14.6);api.interact();assert.equal(api.state.darkAwake,true);assert.equal(api.state.noiseLesson,true)});
check('neighbour house exit returns to lane',()=>{move(24,-13);api.interact();assert.equal(api.state.inDark,false);assert.equal(api.catRoot.position.x,-2.6)});
check('radio can be heard without TV',()=>{api.state.tv=false;move(10.3,-11.95);api.interact();assert.equal(api.state.radioHeard,true)});
check('jumping over building fronts remains blocked',()=>{move(0,-11.9);assert.equal(api.validPosition(0,-12.35,2),false)});
check('first-night visitor can catch the cat standing outside beside it',()=>{api.state.inDark=false;api.state.day=1;api.state.visitorDone=false;api.startVisitor();move(-3.2,-5.1);for(let i=0;i<10;i++)api.updateThreats(.5);assert.ok(Math.hypot(api.catRoot.position.x+3.2,api.catRoot.position.z+5.1)>1,'cat remains beside visitor without being caught')});

check('visitor stays outside and cannot catch a cat indoors',()=>{api.state.day=1;api.state.visitorDone=false;api.startVisitor();move(-3.2,-3.7);for(let i=0;i<10;i++)api.updateThreats(.5);assert.equal(api.catRoot.position.z,-3.7);assert.ok(api.infected.position.z<=-4.35)});
check('chapter completion follows survival discoveries without the television',()=>{api.updateThreats(30);api.state.hidden=false;api.state.inDark=false;api.state.day=2;api.state.hour=20;api.state.owner=true;api.state.tv=false;api.state.visitorDone=true;api.state.outsideFood=true;api.state.outsideWater=true;api.state.dangerLearned=true;api.state.noiseLesson=true;api.state.chapterComplete=false;move(-1.9,.3);api.interact();assert.equal(api.state.chapterComplete,true);assert.equal(api.state.day,3);assert.match(node('thought').textContent,/not come back/)});
console.log('Integration checks completed: '+n+' passed, '+failed+' failed.');
if(failed)process.exitCode=1;
