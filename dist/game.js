import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { normaliseState,advanceTime,period,takeResource,sleep,guidance,movementMultiplier } from './story.mjs';
import { constrainCamera } from './camera.mjs';
import { makeThreat,stepThreat } from './threats.mjs';
import { insideFurniture,blocksFurniture,stepVertical,frontWallBlocks,groundHeight,clearOfFrontWall } from './physics.mjs';

const $ = id => document.getElementById(id);
const SAVE='nobodys-home-web-first-morning-v1';
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb8c9bc); scene.fog=new THREE.Fog(0x69746f,15,36);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,100);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.72; $('game').appendChild(renderer.domElement);
const ambient=new THREE.HemisphereLight(0xf7edce,0x667d6f,2.1); scene.add(ambient); const sun=new THREE.DirectionalLight(0xffe8bb,2); sun.position.set(-5,10,6); scene.add(sun);
const mats={}; const mat=(name,color,roughness=1)=>mats[name]??(mats[name]=new THREE.MeshStandardMaterial({color,roughness}));
const M={floor:mat('floor',0x713e35), plank:mat('plank',0x854237),wall:mat('wall',0xe1cfad),trim:mat('trim',0xf1ead7),dark:mat('dark',0x506359),wood:mat('wood',0x8d644b),cream:mat('cream',0xe7ddca),fabric:mat('fabric',0x8d9b85),pink:mat('pink',0xbd8e7c),bowl:mat('bowl',0x9eb3a1),water:mat('water',0x86aeb0,.3),food:mat('food',0x8c664f),grass:mat('grass',0x9eaf8b),road:mat('road',0x777c6d),pave:mat('pave',0xbeb9a6),leaf:mat('leaf',0x7d9872),trunk:mat('trunk',0x806b53),brick:mat('brick',0xb98c75),gold:mat('gold',0xd3af70),glass:mat('glass',0xb4d7cf)};
M.wall.side=THREE.DoubleSide;
const unitBox=new THREE.BoxGeometry(1,1,1), unitCylinder=new THREE.CylinderGeometry(1,1,1,12), unitSphere=new THREE.SphereGeometry(1,12,8);
const cameraFurniture=[],cameraBuildings=[];
function box(x,y,z,w,h,d,m){const mesh=new THREE.Mesh(unitBox,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);scene.add(mesh);if((m===M.fabric||m===M.wood)&&h>=.35&&x> -4.6&&x<4.6&&z> -4&&z<4)cameraFurniture.push(mesh);return mesh}
function cylinder(x,y,z,r,h,m,r2=r){const mesh=new THREE.Mesh(unitCylinder,m);mesh.position.set(x,y,z);mesh.scale.set(r,h,r2);scene.add(mesh);return mesh}
function ball(x,y,z,sx,sy,sz,m){const mesh=new THREE.Mesh(unitSphere,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);scene.add(mesh);return mesh}
// Small architectural details are instanced by material to keep draw calls low.
const detailGroups=new Map();
function detail(x,y,z,w,h,d,m){let a=detailGroups.get(m);if(!a)detailGroups.set(m,a=[]);a.push([x,y,z,w,h,d])}
function flushDetails(){const dummy=new THREE.Object3D();for(const [material,entries] of detailGroups){const mesh=new THREE.InstancedMesh(unitBox,material,entries.length);entries.forEach((v,i)=>{dummy.position.set(v[0],v[1],v[2]);dummy.scale.set(v[3],v[4],v[5]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh)}}
const deepGreen=mat('shutters',0x415b4a), iron=mat('old iron',0x3f4c42), terracotta=mat('terracotta',0xa5684d), courtyard=mat('courtyard',0xbea789), teal=mat('old teal',0x6f8c7d), sunwall=mat('sun faded ochre',0xd5b887), fadedRose=mat('faded rose',0xc7927d), wallShadow=mat('weather marks',0xbeae91);
// Red-oxide floor and a narrow, worn mosaic border; no per-frame texture work.
box(0,-.1,0,9,.2,8,M.floor);
for(let x=-4.28;x<4.3;x+=.34){detail(x,.006,-3.72,.30,.012,.17,M.cream);detail(x,.007,3.72,.30,.012,.17,M.cream)}
for(let z=-3.45;z<3.5;z+=.34){detail(-4.25,.006,z,.17,.012,.30,M.cream);detail(4.25,.006,z,.17,.012,.30,M.cream)}
const leftWall=box(-4.55,1.5,0,.15,3,8,M.wall),rightWall=box(4.55,1.5,0,.15,3,8,M.wall),backWall=box(0,1.5,4.05,9.2,3,.15,M.wall);
const frontLeft=box(-4.1,1.5,-4.05,.9,3,.16,M.wall),frontRight=box(.95,1.5,-4.05,7.3,3,.16,M.wall);
// Working opening through the wall: shutters folded outward, sill clear.
const windowLower=box(-3.2,.32,-4.05,.9,.64,.17,M.wall),windowUpper=box(-3.2,2.1,-4.05,.9,1.8,.17,M.wall);box(-3.2,.66,-4.05,1.02,.08,.3,M.trim);box(-3.2,1.27,-4.05,1.03,.06,.24,M.trim);
box(-3.68,.97,-4.05,.08,1.3,.23,M.trim);box(-2.72,.97,-4.05,.08,1.3,.23,M.trim);
// Open, side-folded khorkhori shutters: they do not block the window route.
for(const x of [-3.83,-2.57]){box(x,.98,-4.03,.24,.67,.07,deepGreen);for(let y=.72;y<1.28;y+=.08)detail(x,y,-3.98,.19,.025,.025,M.fabric)}
// A long cornice and narrow wall stain add age without hiding the cat.
box(-4.44,2.72,0,.12,.12,8,M.trim);box(4.44,2.72,0,.12,.12,8,M.trim);
for(let i=0;i<7;i++)detail(-4.46,.34+i*.08,-2.7+i*.28,.012,.035,.34,wallShadow);
// Locked front door and old, framed glass transom.
box(2.8,1.03,3.94,1.15,2.06,.13,deepGreen);box(2.8,2.1,3.88,1.3,.1,.12,M.trim);ball(3.17,1.02,3.83,.045,.045,.045,M.gold);
for(const x of [2.45,2.8,3.15])detail(x,1.02,3.855,.035,1.72,.018,M.wood);
// Everyday home: low wooden bed, old cabinet, cloth, a small lamp and ceiling fan.
box(-2.9,.28,2.2,2.35,.4,1.8,M.wood);box(-2.9,.52,2.2,2.2,.18,1.7,M.cream);box(-3.05,.62,2.6,1.9,.14,.7,M.fabric);box(-3.5,.69,1.72,.65,.16,.35,M.trim);box(-2.65,.69,1.72,.65,.16,.35,M.trim);
box(-4.12,.42,.8,.55,.72,.55,M.wood);box(-4.12,.82,.8,.65,.09,.65,M.trim);cylinder(-4.12,1.03,.8,.09,.35,M.gold);ball(-4.12,1.25,.8,.23,.16,.23,M.cream);
// The overhead fan is left out of the playable view until the camera handles ceilings.
// Furniture remains in the same places as the previous prototype.
box(.0,.012,.2,2.7,.02,1.8,M.fabric);box(-.35,.47,.35,1.65,.52,.65,M.fabric);box(-.35,.82,.64,1.65,.65,.18,M.fabric);box(-1.12,.65,.35,.18,.55,.75,M.fabric);box(.42,.65,.35,.18,.55,.75,M.fabric);
box(1.25,.3,-.1,.95,.48,.65,M.wood);box(1.25,.57,-.1,1.08,.08,.75,M.trim);box(3.83,.45,-1.65,1.1,.9,.55,M.wood);box(3.8,1.13,-1.65,.16,.65,1.0,M.dark);box(3.69,1.14,-1.65,.03,.53,.86,M.glass);
function bowl(x,z,contents){const b=cylinder(x,.07,z,.27,.12,M.bowl);return {base:b,contents:cylinder(x,.135,z,.205,.026,contents)}}
const homeFoodBowl=bowl(2.75,1.85,M.food),homeWaterBowl=bowl(3.48,1.85,M.water);box(3.1,.015,1.85,1.45,.03,.75,M.cream);
// A little shared courtyard sits between the window and lane.
box(0,-.14,-12,42,.2,24,M.grass);box(0,.005,-5.8,9,.04,3.5,courtyard);
for(let x=-4.1;x<=4.1;x+=.7)for(let z=-7.2;z< -4.4;z+=.7)detail(x,.029,z,.66,.01,.66,(Math.floor((x+z)*10)%3===0)?M.pave:courtyard);
// Water tap, potted plants and a clothesline give the courtyard an everyday use.
box(3.8,.31,-5.4,.75,.6,.55,terracotta);box(3.8,.64,-5.4,.84,.08,.62,M.trim);cylinder(3.8,.82,-5.48,.035,.35,iron);box(3.8,1.01,-5.38,.08,.05,.22,iron);
function plant(x,z){cylinder(x,.18,z,.21,.36,terracotta);ball(x,.55,z,.36,.32,.30,M.leaf);ball(x+.17,.66,z,.23,.25,.22,teal)}
plant(-4.12,-5.0);plant(3.45,-6.8);plant(-2.3,-7.15);
box(.4,2.52,-6.55,7.1,.025,.025,iron);box(-1.1,2.24,-6.55,.65,.55,.025,M.cream);box(.05,2.32,-6.55,.62,.40,.025,M.pink);box(1.16,2.22,-6.55,.72,.6,.025,M.fabric);
// Narrow lane, open drains and worn red-oxide rowaks outside the houses.
box(0,.005,-9.9,32,.05,4.2,M.road);box(0,.03,-7.72,32,.08,.35,M.pave);box(0,.03,-12.02,32,.08,.35,M.pave);
for(let x=-12.5;x<13;x+=.55)detail(x,.075,-12.18,.48,.10,.42,M.floor);
for(let x=-12.8;x<13;x+=.42)detail(x,.035,-7.58,.28,.025,.10,iron);
// Closely spaced, two-storey houses: shuttered windows and iron balconies.
function oldHouse(x,z,colour,variant){
 cameraBuildings.push(box(x,2.12,z,4.8,4.24,2.65,colour));box(x,4.27,z,5.0,.13,2.84,M.trim);
 box(x,2.44,z+1.36,4.85,.13,.18,M.trim);box(x,.99,z+1.37,.90,1.98,.10,deepGreen);
 detail(x,2.02,z+1.45,1.1,.10,.12,M.trim);detail(x-.52,1.0,z+1.44,.09,2.0,.10,M.trim);detail(x+.52,1.0,z+1.44,.09,2.0,.10,M.trim);
 for(const dx of [-1.55,1.55]){const wx=x+dx;box(wx,1.3,z+1.39,.80,1.18,.10,deepGreen);detail(wx,1.94,z+1.45,.99,.09,.10,M.trim);for(let y=.83;y<1.82;y+=.10)detail(wx,y,z+1.46,.70,.028,.025,M.fabric);detail(wx,1.35,z+1.49,.03,1.1,.02,iron)}
 // The upper verandah is a flat balcony with thin iron bars.
 box(x,2.52,z+1.65,4.45,.13,.67,terracotta);box(x,3.33,z+1.96,4.45,.06,.05,iron);
 for(let dx=-2.12;dx<=2.12;dx+=.22)detail(x+dx,2.94,z+1.96,.025,.78,.025,iron);
 for(const dx of [-1.35,0,1.35]){const wx=x+dx;box(wx,3.35,z+1.40,.82,1.42,.08,deepGreen);for(let y=2.75;y<4.0;y+=.12)detail(wx,y,z+1.46,.72,.03,.02,M.fabric);detail(wx,4.1,z+1.44,.94,.09,.07,M.trim)}
 // Cornice blocks and deliberately uneven marks on the plaster.
 for(let dx=-2;dx<=2;dx+=.5)detail(x+dx,4.09,z+1.39,.11,.21,.12,M.trim);
 for(let i=0;i<4;i++)detail(x-2.2+i*.13,.35+i*.11,z+1.41,.10,.025,.012,wallShadow);
}
oldHouse(-7.5,-13.75,fadedRose,0);oldHouse(-2.6,-13.75,sunwall,1);oldHouse(2.3,-13.75,teal,2);oldHouse(7.2,-13.75,M.wall,3);
// Everyday props drawn from the Unity home: slippers, phone, laptop and shopping.
box(-1.45,.045,2.8,.18,.09,.34,M.dark);box(-1.18,.045,2.87,.18,.09,.34,M.dark);
box(1.2,.635,-.1,.32,.025,.22,iron);const laptop=box(1.2,.76,-.21,.32,.23,.025,iron);laptop.rotation.x=-.18;
box(-4.12,.885,.8,.10,.025,.18,iron);
// Outside resources are finite and their state is saved.
box(8.7,.13,-8.55,.58,.24,.42,M.cream);const streetFoodVisual=ball(8.7,.27,-8.55,.16,.08,.14,M.food);
const porchFoodBowl=bowl(-7.5,-11.95,M.food);
// A small tea stall and everyday street objects, on the far side of the lane.
box(10.9,.55,-12.38,2.0,1.1,.76,M.wood);box(10.9,1.14,-12.35,2.1,.1,.90,M.trim);box(10.9,2.15,-12.38,2.2,.12,.95,terracotta);
for(let x=10.1;x<11.8;x+=.4)detail(x,1.22,-12.05,.10,.12,.10,M.cream);
box(5,.5,-7.2,.7,1,.7,M.dark);box(5,1.04,-7.2,.77,.1,.77,M.wood);
function tree(x,z){cylinder(x,.9,z,.13,1.8,M.trunk);ball(x,2.2,z,.65,.75,.60,M.leaf);ball(x+.38,2,z,.5,.55,.5,M.leaf)}tree(-8,-6.5);tree(8,-7);tree(11,-14);
// Fine overhead cables stay above the walkable space.
for(let i=0;i<3;i++)box(0,3.95+i*.15,-8.8+i*.18,25,.018,.018,iron);
flushDetails();
// Lightweight temporary character silhouettes. They can be replaced with authored assets.
function actorPart(group,geometry,material,x,y,z,sx,sy,sz){const p=new THREE.Mesh(geometry,material);p.position.set(x,y,z);p.scale.set(sx,sy,sz);group.add(p);return p}
const dog=new THREE.Group();scene.add(dog);dog.position.set(4,0,-10.2);const dogFur=mat('dog fur',0x806345);
actorPart(dog,unitBox,dogFur,0,.34,0,.65,.36,.95);actorPart(dog,unitBox,dogFur,0,.55,.49,.40,.38,.38);
for(const x of [-.22,.22])for(const z of [-.30,.30])actorPart(dog,unitBox,dogFur,x,.14,z,.13,.28,.14);
for(const x of [-.16,.16])actorPart(dog,unitBox,iron,x,.78,.48,.12,.19,.13);
const infected=new THREE.Group();scene.add(infected);infected.position.set(-1,0,-10.6);infected.visible=false;
const dogThreat=makeThreat('dog',dog.position),infectedThreat=makeThreat('infected',infected.position);
const cloth=mat('infected clothes',0x535a55),skin=mat('infected skin',0x998f7d);
actorPart(infected,unitBox,cloth,0,.98,0,.48,.70,.27);actorPart(infected,unitSphere,skin,0,1.53,0,.21,.25,.19);
for(const x of [-.14,.14])actorPart(infected,unitBox,cloth,x,.28,0,.16,.56,.18);
for(const x of [-.34,.34])actorPart(infected,unitBox,cloth,x,.93,0,.17,.55,.16);
// A single lightweight line mesh for rain; it is hidden until the weather changes.
const rainPositions=new Float32Array(120*6);const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0xb4c3c7,transparent:true,opacity:.28,depthWrite:false}));rain.visible=false;rain.frustumCulled=false;scene.add(rain);
function updateRain(now){const active=state.day>=3&&state.hour>=15&&state.hour<22&&!state.inDark;rain.visible=active;if(!active)return;rain.position.set(catRoot.position.x,0,catRoot.position.z);for(let i=0;i<120;i++){const x=((i*71)%131)/10-6.5,z=((i*43)%127)/10-6.3,y=3-((now*.003+i*.219)%3);const j=i*6;rainPositions[j]=x;rainPositions[j+1]=y;rainPositions[j+2]=z;rainPositions[j+3]=x-.025;rainPositions[j+4]=y-.24;rainPositions[j+5]=z}rainGeometry.attributes.position.needsUpdate=true}
// A modest dark neighbour's interior, kept away from the lane until entered.
box(24,-.1,-16,8,.2,7,mat('dark floor',0x544438));const darkPlaster=mat('dark plaster',0x716c61);darkPlaster.side=THREE.DoubleSide;
const darkWalls=[box(20,1.5,-16,.15,3,7,darkPlaster),box(28,1.5,-16,.15,3,7,darkPlaster),box(24,1.5,-19.5,8,3,.15,darkPlaster)];
box(25,.45,-16.3,1.4,.9,.8,M.wood);box(25,.94,-16.3,1.5,.08,.9,M.cream);cylinder(25,1.01,-16.3,.23,.08,M.food);
box(21.3,.2,-17.8,.8,.4,.7,M.dark);cylinder(22.0,.12,-14.6,.11,.24,M.cream);cylinder(22.28,.12,-14.6,.11,.24,M.cream);cylinder(22.15,.36,-14.6,.11,.24,M.cream);
const darkInfected=infected.clone();scene.add(darkInfected);darkInfected.position.set(26,0,-18);darkInfected.visible=false;
const darkFigure=infected.clone();scene.add(darkFigure);darkFigure.position.set(27.25,0,-18.6);darkFigure.visible=false;
const catRoot=new THREE.Group();scene.add(catRoot);let mixer,actions={},currentAction='',modelHeight=.6;
let state=normaliseState({x:-1.9,z:.3,food:55,water:62,owner:false,ate:false,drank:false,tv:false,outside:false});
try{const loaded=JSON.parse(localStorage.getItem(SAVE));if(loaded&&typeof loaded.x==='number'&&Number.isFinite(loaded.x))state=normaliseState({...state,...loaded})}catch{}
if(state.inDark){state.x=THREE.MathUtils.clamp(state.x,20.4,27.6);state.z=THREE.MathUtils.clamp(state.z,-19.1,-12.8)}else{state.x=THREE.MathUtils.clamp(state.x,-12,12);state.z=THREE.MathUtils.clamp(state.z,-19,3.7)}
if(!state.inDark)state.z=clearOfFrontWall(state.z);
if(state.z> -4&&insideFurniture(state.x,state.z)){state.x=-1.9;state.z=.3}
let y=0,vertical=0,playing=false,started=false,jumping=false,eatUntil=0,holdClip='Eat',thoughtTimer,captionTimer,quest='',visitorTimer=0,visitorActive=false,noiseTarget=null,noiseSerial=0,threatCooldown=0,lightingTimer=0,broadcastTimer=0;let yaw=.58,pitch=.72,cameraDistance=5.3,dragging=false,lastX=0,lastY=0,renderLast=0,prev=0,saveTime=0;
const keys=new Set();const targetLook=new THREE.Vector3(), cameraGoal=new THREE.Vector3(),cameraRay=new THREE.Raycaster();
const cameraWalls=[leftWall,rightWall,backWall,frontLeft,frontRight,windowLower,windowUpper,...cameraFurniture,...cameraBuildings,...darkWalls];
function say(text,ms=4500){$('thought').textContent=text;$('thought').classList.add('show');clearTimeout(thoughtTimer);thoughtTimer=setTimeout(()=>$('thought').classList.remove('show'),ms)}
function save(){state.x=catRoot.position.x;state.z=catRoot.position.z;try{localStorage.setItem(SAVE,JSON.stringify(state))}catch{}}
function questUI(){const q=guidance(state);if(quest!==q[0]){quest=q[0];$('quest-title').textContent=q[0];$('quest-copy').textContent=q[1];$('quest-index').textContent='✳';$('quest-category').textContent='A NORTH KOLKATA MORNING'}
 $('food-bar').style.width=state.food+'%';$('water-bar').style.width=state.water+'%';$('energy-bar').style.width=state.energy+'%';
 for(const [id,value] of [['food-bar',state.food],['water-bar',state.water],['energy-bar',state.energy]])$(id).parentElement.classList.toggle('critical',value<15);homeFoodBowl.contents.visible=state.homeFood>0;homeWaterBowl.contents.visible=state.homeWater>0;streetFoodVisual.visible=state.streetFood>0;porchFoodBowl.contents.visible=state.porchFood>0;$('period-label').textContent='NORTH KOLKATA · '+period(state).toUpperCase()}
const items=[{x:-3,z:2.2,r:2.3,label:'Look for your person',type:'bed',zone:'home'},{x:2.75,z:1.85,r:1.1,label:'Eat breakfast',type:'food',zone:'home'},{x:3.48,z:1.85,r:1.05,label:'Drink water',type:'water',zone:'home'},{x:3.8,z:-1.65,r:1.25,label:'Investigate the television',type:'tv',zone:'home'},{x:2.8,z:3.9,r:1.05,label:'Try the front door',type:'door',zone:'home'},{x:-3.2,z:-3.65,r:1.4,label:'Look at the open window',type:'window'},{x:8.7,z:-8.55,r:1.15,label:'Investigate the dropped food',type:'streetFood',zone:'street'},{x:-7.5,z:-11.95,r:1.1,label:'Investigate the porch dish',type:'porchFood',zone:'street'},{x:3.8,z:-5.4,r:1.1,label:'Drink from the tap puddle',type:'streetWater',zone:'street'},{x:-2.6,z:-11.95,r:1.15,label:'Enter the quiet house',type:'enterHouse',zone:'street'},{x:10.9,z:-11.95,r:1.3,label:'Listen to the radio',type:'radio',zone:'street'},{x:24,z:-13.0,r:1.3,label:'Return to the lane',type:'exitHouse',zone:'dark'},{x:24.4,z:-16.3,r:1.5,label:'Investigate the food',type:'darkFood',zone:'dark'},{x:22.1,z:-14.6,r:1.05,label:'Nudge the tins',type:'tins',zone:'dark'},{x:26,z:-17.0,r:1.2,label:'Listen at the inner door',type:'innerDoor',zone:'dark'}];
function nearby(){let nearest=null,best=Infinity;for(const item of items){if(state.inDark&&item.zone!=='dark')continue;if(!state.inDark&&item.zone==='dark')continue;if(item.zone==='home'&&catRoot.position.z< -4.05)continue;if(item.zone==='street'&&catRoot.position.z> -4.05)continue;const d=Math.hypot(catRoot.position.x-item.x,catRoot.position.z-item.z);if(d<item.r&&d<best){nearest=item;best=d}}return nearest}
function itemLabel(item){if(item.type==='bed'&&state.owner)return 'Rest by the bed';if(item.type==='food'&&state.homeFood<=0)return 'Inspect the empty bowl';if(item.type==='water'&&state.homeWater<=0)return 'Inspect the empty water bowl';if(['streetFood','porchFood','streetWater','darkFood'].includes(item.type)&&state[item.type]<=0)return 'Nothing left here';return item.label}
function caption(text,ms=6500){$('caption').textContent=text;$('caption').hidden=false;clearTimeout(captionTimer);captionTimer=setTimeout(()=>$('caption').hidden=true,ms)}
function startVisitor(){if(visitorActive||state.visitorDone)return;visitorActive=true;visitorTimer=0;state.visitorSeen=true;infected.position.set(-3.2,0,-5.2);infected.visible=true;say('A noise at the window. Someone is outside.',6000)}
function onDawn(){if(state.day>=3&&state.tv){state.tv=false;say('The television has gone quiet.')}state.food=Math.max(0,state.food-12);state.water=Math.max(0,state.water-10);if(state.day===2)say('The bowl is empty. Still no one.',6000);else say('Another quiet morning.',4500);save()}
function interact(){if(!playing||state.hidden)return;const item=nearby();if(!item)return;
 if(item.type==='bed'){
  if(!state.owner){state.owner=true;say('Their smell is here. Maybe they will be back soon.')}
  else if(visitorActive)say('Too much noise outside. Find a quiet place.');
  else {const result=sleep(state,true);if(!result.ok)say(result.reason);else if(result.event==='visitor'){holdClip='Sleep';animate('Sleep',true);eatUntil=performance.now()+1400;startVisitor()}else{holdClip='WakeUp';animate('WakeUp',true);eatUntil=performance.now()+1200;onDawn();if(result.event==='chapter')say('They have not come back.',7000)}}
 }
 if(item.type==='food'){if(takeResource(state,'homeFood')){state.food=Math.min(100,state.food+35);state.ate=true;holdClip='Eat';eatUntil=performance.now()+2300;say('Breakfast, just where it should be.')}else say('Empty. The familiar bowl has nothing left.')}
 if(item.type==='water'){if(takeResource(state,'homeWater')){state.water=Math.min(100,state.water+35);state.drank=true;holdClip='Eat';eatUntil=performance.now()+1800;say('A few quiet laps of water.')}else say('The water bowl is dry.')}
 if(item.type==='streetFood'||item.type==='porchFood'||item.type==='darkFood'){if(takeResource(state,item.type)){state.food=Math.min(100,state.food+30);holdClip='Eat';eatUntil=performance.now()+2300;say('A little food. Enough for now.')}else say('Nothing left to eat here.')}
 if(item.type==='streetWater'){if(takeResource(state,'streetWater')){state.water=Math.min(100,state.water+30);holdClip='Eat';eatUntil=performance.now()+1800;say('Water, cool against the ground.')}else say('The puddle has dried up.')}
 if(item.type==='tv'&&state.day>=3){state.tv=false;say('The screen stays dark.');}
 else if(item.type==='tv'){state.tv=!state.tv;if(state.tv){caption('NEWS: Residents are urged to remain indoors. Avoid contact with anyone showing unusual behaviour.');say('A voice crackles from the television.');emitNoise(4)}else say('The television falls quiet.')}
 if(item.type==='enterHouse'){state.inDark=true;state.visitedDark=true;catRoot.position.set(24,0,-13.5);y=vertical=0;jumping=false;say('It is dark here. Something moves beyond the door.',6000);updateLighting()}
 if(item.type==='exitHouse'){state.inDark=false;catRoot.position.set(-2.6,0,-11.0);y=vertical=0;jumping=false;say('Back in the lane.');updateLighting()}
 if(item.type==='tins'){state.darkAwake=true;state.noiseLesson=true;emitNoise(7);say('The tins clatter across the floor.',5000)}
 if(item.type==='innerDoor'){state.seenInfected=true;say('A thump. A shape behind the door.',5000)}
 if(item.type==='radio'){state.radioHeard=true;caption('RADIO: Stay away from the infected. Keep your doors locked and remain inside.');say('A voice from the little radio.');emitNoise(4)}
 if(item.type==='door')say('It won’t budge. The window smells like outside.');if(item.type==='window')say('A familiar way out. Jump up and through.');questUI();save()}
// The light colors follow the Unity prototype's day/evening/night ramps.
function sampleRamp(hour,keys){let h=hour;if(h<keys[0][0])h+=24;for(let i=0;i<keys.length-1;i++){const a=keys[i],b=keys[i+1];if(h<=b[0]){const t=THREE.MathUtils.clamp((h-a[0])/(b[0]-a[0]),0,1);return new THREE.Color(a[1]).lerp(new THREE.Color(b[1]),t)}}return new THREE.Color(keys[keys.length-1][1])}
function updateLighting(){const h=state.hour;const fog=sampleRamp(h,[[0,0x0a0b12],[6,0x9999a5],[10,0xbdc4cc],[16.5,0xb3b3b5],[18.5,0x8f8080],[19.7,0x4d4a5c],[20.6,0x12141f],[24,0x0a0b12]]);fog.multiplyScalar(.68);scene.background.copy(fog);scene.fog.color.copy(fog);
 sun.color.copy(sampleRamp(h,[[0,0x292f50],[6,0xffbf8c],[9,0xfff2e0],[16.5,0xffe0b8],[18.5,0xffa86b],[19.7,0xd96b4d],[20.4,0x4d577f],[24,0x292f50]]));
 const dark=period(state)==='night'||state.inDark;sun.intensity=dark?.18:.72;ambient.intensity=dark?.42:.92;ambient.color.set(dark?0x56627f:0xffeed7);ambient.groundColor.set(dark?0x252b3a:0x778576)}
function toggleHiding(){const nearBed=catRoot.position.z>-4&&Math.hypot(catRoot.position.x+3,catRoot.position.z-2.2)<2.4;if(!state.hidden&&!nearBed){say('There might be room under the bed.');return}state.hidden=!state.hidden;catRoot.visible=!state.hidden;$('shell').classList.toggle('hiding',state.hidden);if(state.hidden){state.dangerLearned=state.dangerLearned||visitorActive;say('Small. Dark. Quiet.')}else say('Carefully, back out.');save()}
function emitNoise(radius,kind='other',origin=catRoot.position){if(state.hidden&&kind==='meow'){say('Best to stay quiet here.');return}noiseTarget={id:++noiseSerial,x:origin.x,z:origin.z,life:8,radius:radius*(period(state)==='night'?1.5:1)};if(visitorActive){visitorTimer=Math.max(0,visitorTimer-5);say('The scratching at the window gets louder.')}if(kind==='meow'&&typeof AudioContext!=='undefined'){try{const ac=new AudioContext(),osc=ac.createOscillator(),gain=ac.createGain();osc.type='sine';osc.frequency.setValueAtTime(580,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(360,ac.currentTime+.18);gain.gain.setValueAtTime(.025,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.22);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+.23);osc.onended=()=>ac.close()}catch{}}}
function updateThreats(dt){
 darkInfected.visible=state.inDark;darkFigure.visible=state.inDark;darkInfected.rotation.z=state.darkAwake?0:.65;
 if(threatCooldown>0)threatCooldown-=dt;if(noiseTarget){noiseTarget.life-=dt;if(noiseTarget.life<=0)noiseTarget=null}
 if(visitorActive){visitorTimer+=dt;infected.visible=true;infected.position.set(-3.2,0,-5.05);infected.rotation.y=Math.sin(visitorTimer*1.5)*.16;
  if(visitorTimer>28){visitorActive=false;state.visitorDone=true;state.nightWarning=false;state.dangerLearned=true;infected.visible=state.day>=2;infected.position.set(-1,0,-10.6);infectedThreat.mode='idle';infectedThreat.timer=0;say('The sounds fade away. Quiet again.',5000);save()}}
 else infected.visible=state.day>=2;
 const outside=catRoot.position.z< -4.08&&!state.inDark;
 const player={x:catRoot.position.x,z:catRoot.position.z,y,hidden:state.hidden,outside};
 function advanceAgent(agent,mesh){
  const result=stepThreat(agent,dt,player,noiseTarget);if(typeof agent.position.rotation==='number')mesh.rotation.y=agent.position.rotation;
  if(result.noticedNoise&&agent.kind==='infected'){state.noiseLesson=true;sayOnceNoise()}
  if(result.escaped){state.dangerLearned=true;say(agent.kind==='dog'?'The dog has lost the scent.':'The footsteps fade away.',4000)}
  if(result.caught&&threatCooldown<=0){threatCooldown=5;state.dangerLearned=true;catRoot.position.set(-1.9,0,.3);y=vertical=0;jumping=false;noiseTarget=null;say(agent.kind==='dog'?'Teeth. Not that way.':'Hands. Not that way.',5000);save()}
 }
 if(!visitorActive&&state.day>=2){advanceAgent(infectedThreat,infected);if(outside&&Math.hypot(infected.position.x-catRoot.position.x,infected.position.z-catRoot.position.z)<5)state.seenInfected=true}
 advanceAgent(dogThreat,dog);
 if(state.inDark&&state.darkAwake&&!state.hidden){const dx=catRoot.position.x-darkInfected.position.x,dz=catRoot.position.z-darkInfected.position.z,d=Math.hypot(dx,dz);if(d>.6){darkInfected.position.x+=dx/d*.65*dt;darkInfected.position.z+=dz/d*.65*dt;darkInfected.rotation.y=Math.atan2(dx,dz)}if(d<.7&&threatCooldown<=0){state.inDark=false;state.dangerLearned=true;state.noiseLesson=true;catRoot.position.set(-2.6,0,-11);threatCooldown=5;updateLighting();say('Hands. Back outside.',5000);save()}}
 
}
let noiseHintShown=false;function sayOnceNoise(){if(!noiseHintShown){noiseHintShown=true;say('The sound brought it closer.',5000)}}
function animate(name,force=false){if(currentAction===name&&!force)return;let next=actions[name]||actions.Idle;if(!next)return;const previous=actions[currentAction];if(previous&&previous!==next)previous.fadeOut(.18);next.reset().fadeIn(.18).play();currentAction=name}
new GLTFLoader().load('./assets/kitten.glb',gltf=>{const model=gltf.scene;catRoot.add(model);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();bounds.getSize(size);const scale=.64/Math.max(size.y,.001);model.scale.setScalar(scale);model.updateMatrixWorld(true);const fitted=new THREE.Box3().setFromObject(model);model.position.y-=fitted.min.y;model.position.x-=(fitted.min.x+fitted.max.x)/2;model.position.z-=(fitted.min.z+fitted.max.z)/2;modelHeight=.64;model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});mixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations){if(clip.name==='Jump')clip.tracks=clip.tracks.filter(t=>!t.name.endsWith('Hips.position'));actions[clip.name]=mixer.clipAction(clip);if(['Jump','LieDown','WakeUp'].includes(clip.name)){actions[clip.name].setLoop(THREE.LoopOnce,1);actions[clip.name].clampWhenFinished=true}}animate('Idle');catRoot.position.set(state.x,0,state.z);questUI();updateLighting();$('loading').hidden=true;$('start-btn').disabled=false;$('start-btn').innerHTML='Begin the morning <span>↗</span>';renderOnce();},undefined,error=>{$('loading-detail').textContent='The kitten could not be loaded. Please reload the page.';console.error(error)});
// Keep the walls opaque. Move the camera to the near side of a wall when needed.
function placeCamera(target,desired,dt=1){camera.position.lerp(desired,Math.min(1,dt*9));constrainCamera(target,camera.position,cameraWalls,cameraRay);camera.lookAt(target)}
function renderOnce(){targetLook.set(catRoot.position.x,.5,catRoot.position.z);cameraGoal.set(targetLook.x+Math.sin(yaw)*Math.cos(pitch)*cameraDistance,targetLook.y+Math.sin(pitch)*cameraDistance,targetLook.z+Math.cos(yaw)*Math.cos(pitch)*cameraDistance);scene.updateMatrixWorld(true);camera.position.copy(targetLook);placeCamera(targetLook,cameraGoal,1);renderer.render(scene,camera)}
function pause(){if(!started)return;playing=false;keys.clear();$('pause').hidden=false;save()}
function resume(){if(!started)return;$('pause').hidden=true;playing=true;prev=performance.now();renderLast=0;requestAnimationFrame(frame)}
$('start-btn').onclick=()=>{started=true;if(state.day===1&&state.nightWarning&&!state.visitorDone)startVisitor();$('start').hidden=true;$('shell').hidden=false;playing=true;prev=performance.now();requestAnimationFrame(frame);say(state.owner?'The house is still quiet.':'A familiar morning. But something feels different.')};$('pause-btn').onclick=pause;$('help-btn').onclick=pause;$('resume-btn').onclick=resume;
$('reset-btn').onclick=()=>{try{localStorage.removeItem(SAVE)}catch{}location.reload()};
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(playing)pause();else if(started)resume();return}if(e.repeat)return;keys.add(e.code);if(e.code==='KeyE')interact();if(e.code==='KeyM'&&playing){say('Mrrrow.');emitNoise(7,'meow')}if(e.code==='KeyH'&&playing)toggleHiding();if(e.code==='Space'&&playing&&!state.hidden&&!jumping&&performance.now()>eatUntil){jumping=true;vertical=4.5;animate('Jump',true)}});addEventListener('keyup',e=>keys.delete(e.code));
function zoom(amount){cameraDistance=THREE.MathUtils.clamp(cameraDistance+amount,1.5,8)}
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*.004)},{passive:false});
$('zoom-in').onclick=()=>zoom(-.7);$('zoom-out').onclick=()=>zoom(.7);
renderer.domElement.addEventListener('pointerdown',e=>{if(playing){dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)}});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.004,.35,1.1);lastX=e.clientX;lastY=e.clientY});renderer.domElement.addEventListener('pointerup',()=>dragging=false);addEventListener('blur',()=>{if(playing)pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));renderer.setSize(innerWidth,innerHeight);if(!playing&&mixer)renderOnce()});
function validPosition(x,z,height){if(state.inDark){if(x<20.4||x>27.6||z< -19.1||z> -12.65)return false;if(x>24.1&&x<25.9&&z> -16.9&&z< -15.7)return false;return true}if(x< -13||x>13||z< -20||z>3.8)return false;const isInside=z> -4;
 // The front wall is solid except at the open window, reached by jumping up to the sill.
 if(frontWallBlocks(x,z,height))return false;
 if(isInside&&(x< -4.36||x>4.36))return false;
 // Building fronts are solid; the neighbour is entered through its doorway interaction.
 if(!isInside&&z< -12.28&&x> -10.05&&x<9.7)return false;
 if(!isInside&&((x>3.3&&x<4.3&&z> -5.85&&z< -5.0)||(x>4.5&&x<5.5&&z> -7.7&&z< -6.7)||(x>9.75&&x<12.0&&z> -12.95&&z< -11.8)))return false;
 // Furniture blocks the cat at the side and supports it when jumping onto the top.
 if(isInside&&blocksFurniture(x,z,height))return false;
 return true}
function frame(now){if(!playing)return;requestAnimationFrame(frame);if(now-renderLast<1000/24)return;const dt=Math.min((now-prev)/1000,.08);prev=now;renderLast=now;
 let a=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);let b=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);let move=new THREE.Vector3();if(performance.now()>eatUntil&&!state.hidden){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));move.addScaledVector(forward,b).addScaledVector(right,a);if(move.lengthSq()>0)move.normalize()}
 const running=keys.has('ShiftLeft')||keys.has('ShiftRight');const speed=(running?2.8:1.55)*movementMultiplier(state);const beforeX=catRoot.position.x,beforeZ=catRoot.position.z;let nx=catRoot.position.x+move.x*speed*dt,nz=catRoot.position.z+move.z*speed*dt;if(validPosition(nx,catRoot.position.z,y))catRoot.position.x=nx;if(validPosition(catRoot.position.x,nz,y))catRoot.position.z=nz;
 if(move.lengthSq()>.001){const target=Math.atan2(move.x,move.z);let diff=Math.atan2(Math.sin(target-catRoot.rotation.y),Math.cos(target-catRoot.rotation.y));catRoot.rotation.y+=diff*Math.min(1,dt*9)}
 if(!state.inDark&&!jumping&&frontWallBlocks(catRoot.position.x,catRoot.position.z,y))catRoot.position.z=clearOfFrontWall(catRoot.position.z);
 const ground=state.inDark?0:groundHeight(catRoot.position.x,catRoot.position.z);
 if(!jumping&&y>ground+.02){jumping=true;vertical=0}
 if(jumping){const next=stepVertical(y,vertical,ground,dt);y=next.y;vertical=next.velocity;if(next.landed)jumping=false}
 catRoot.position.y=y;
 const moved=Math.hypot(catRoot.position.x-beforeX,catRoot.position.z-beforeZ)>.001;
 if(!jumping){if(performance.now()<eatUntil)animate(holdClip);else if(moved)animate(running?'Run':'Walk');else animate('Idle')}
 if(mixer)mixer.update(dt);state.food=Math.max(0,state.food-dt*.025);state.water=Math.max(0,state.water-dt*.035);
 for(const event of advanceTime(state,dt)){if(event==='visitor')startVisitor();if(event==='dawn')onDawn()}
 updateThreats(dt);updateRain(now);
 if(state.tv&&state.day<3){broadcastTimer-=dt;if(broadcastTimer<=0){broadcastTimer=12;emitNoise(5,'broadcast',{x:3.8,z:-1.65})}}
 if(rain.visible&&!state.rainNoticed){state.rainNoticed=true;say('Rain on the rooftops.',4500)}
 lightingTimer-=dt;if(lightingTimer<=0){updateLighting();lightingTimer=2}
 if(!state.inDark&&state.outside&&catRoot.position.z> -4&&!state.returnedHome){state.returnedHome=true;say('Home. It still smells familiar.')}
 if(!state.inDark&&!state.outside&&catRoot.position.z< -4.4){state.outside=true;say('No footsteps. No voices. Where did everybody go?',6000)}
 const item=nearby();$('prompt').hidden=!item||jumping||state.hidden;$('prompt-text').textContent=item?itemLabel(item):'';questUI();
 targetLook.set(catRoot.position.x,.5+y,catRoot.position.z);const dist=cameraDistance;cameraGoal.set(targetLook.x+Math.sin(yaw)*Math.cos(pitch)*dist,targetLook.y+Math.sin(pitch)*dist,targetLook.z+Math.cos(yaw)*Math.cos(pitch)*dist);placeCamera(targetLook,cameraGoal,dt);renderer.render(scene,camera);if(now-saveTime>5000){saveTime=now;save()}}
