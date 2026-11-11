import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = id => document.getElementById(id);
const SAVE='nobodys-home-web-first-morning-v1';
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb8c9bc); scene.fog=new THREE.Fog(0xb8c9bc,23,44);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,100);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1; $('game').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xf7edce,0x667d6f,2.1)); const sun=new THREE.DirectionalLight(0xffe8bb,2); sun.position.set(-5,10,6); scene.add(sun);
const mats={}; const mat=(name,color,roughness=1)=>mats[name]??(mats[name]=new THREE.MeshStandardMaterial({color,roughness}));
const M={floor:mat('floor',0xb29575), plank:mat('plank',0x96795e),wall:mat('wall',0xe5dfc9),trim:mat('trim',0xf1ead7),dark:mat('dark',0x506359),wood:mat('wood',0x8d644b),cream:mat('cream',0xe7ddca),fabric:mat('fabric',0x8d9b85),pink:mat('pink',0xbd8e7c),bowl:mat('bowl',0x9eb3a1),water:mat('water',0x86aeb0,.3),food:mat('food',0x8c664f),grass:mat('grass',0x9eaf8b),road:mat('road',0x777c6d),pave:mat('pave',0xbeb9a6),leaf:mat('leaf',0x7d9872),trunk:mat('trunk',0x806b53),brick:mat('brick',0xb98c75),gold:mat('gold',0xd3af70),glass:mat('glass',0xb4d7cf)};
const unitBox=new THREE.BoxGeometry(1,1,1), unitCylinder=new THREE.CylinderGeometry(1,1,1,12), unitSphere=new THREE.SphereGeometry(1,12,8);
function box(x,y,z,w,h,d,m){const mesh=new THREE.Mesh(unitBox,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);scene.add(mesh);return mesh}
function cylinder(x,y,z,r,h,m,r2=r){const mesh=new THREE.Mesh(unitCylinder,m);mesh.position.set(x,y,z);mesh.scale.set(r,h,r2);scene.add(mesh);return mesh}
function ball(x,y,z,sx,sy,sz,m){const mesh=new THREE.Mesh(unitSphere,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);scene.add(mesh);return mesh}
// Home: three interior walls and a front wall with a real open window.
box(0,-.1,0,9,.2,8,M.floor);for(let x=-4.2;x<4.5;x+=.7)box(x,.006,0,.018,.012,8,M.plank);
const leftWall=box(-4.55,1.5,0,.15,3,8,M.wall),rightWall=box(4.55,1.5,0,.15,3,8,M.wall),backWall=box(0,1.5,4.05,9.2,3,.15,M.wall);
box(-4.1,1.5,-4.05,.9,3,.16,M.wall);box(.95,1.5,-4.05,7.3,3,.16,M.wall); // gap: x -3.65 to -2.75 approximately
// Match the visual opening to the traversable window gap: x -3.65..-2.75.
box(-3.2,.32,-4.05,.9,.64,.17,M.wall);box(-3.2,2.1,-4.05,.9,1.8,.17,M.wall);box(-3.2,.66,-4.05,1.02,.08,.3,M.trim);box(-3.2,1.27,-4.05,1.03,.06,.24,M.trim);
box(-3.68,.97,-4.05,.08,1.3,.23,M.trim);box(-2.72,.97,-4.05,.08,1.3,.23,M.trim);
// Locked front door on the back wall.
box(2.8,1.03,3.94,1.15,2.06,.13,M.wood);box(2.8,2.1,3.88,1.3,.1,.12,M.trim);ball(3.17,1.02,3.83,.045,.045,.045,M.gold);
// Bed and side table; the cat begins close to its familiar place.
box(-2.9,.28,2.2,2.35,.4,1.8,M.wood);box(-2.9,.52,2.2,2.2,.18,1.7,M.cream);box(-3.05,.62,2.6,1.9,.14,.7,M.fabric);box(-3.5,.69,1.72,.65,.16,.35,M.trim);box(-2.65,.69,1.72,.65,.16,.35,M.trim);
box(-4.12,.42,.8,.55,.72,.55,M.wood);box(-4.12,.82,.8,.65,.09,.65,M.trim);cylinder(-4.12,1.03,.8,.09,.35,M.gold);ball(-4.12,1.25,.8,.23,.16,.23,M.cream);
// Sofa, rug, table, television.
box(.0,.13,.2,2.7,.08,1.8,M.fabric);box(-.35,.47,.35,1.65,.52,.65,M.fabric);box(-.35,.82,.64,1.65,.65,.18,M.fabric);box(-1.12,.65,.35,.18,.55,.75,M.fabric);box(.42,.65,.35,.18,.55,.75,M.fabric);
box(1.25,.3,-.1,.95,.48,.65,M.wood);box(1.25,.57,-.1,1.08,.08,.75,M.trim);box(3.83,.45,-1.65,1.1,.9,.55,M.wood);box(3.8,1.13,-1.65,.16,.65,1.0,M.dark);box(3.69,1.14,-1.65,.03,.53,.86,M.glass);
// Food and water at the kitchen wall.
function bowl(x,z,contents){const b=cylinder(x,.07,z,.27,.12,M.bowl);cylinder(x,.135,z,.205,.026,contents);return b}
bowl(2.75,1.85,M.food);bowl(3.48,1.85,M.water);box(3.1,.015,1.85,1.45,.03,.75,M.cream);
// Road and a modest quiet neighbourhood, bounded for this first slice.
box(0,-.14,-12,42,.2,24,M.grass);box(0,-.01,-11,40,.04,4.8,M.road);box(0,.01,-8.15,40,.12,.9,M.pave);box(0,.01,-13.9,40,.12,.9,M.pave);for(let x=-17;x<18;x+=4)box(x,.02,-11,1.5,.02,.08,M.cream);
function house(x,z,color){box(x,1.4,z,5,2.8,3.2,color);box(x,2.85,z,5.2,.15,3.35,M.wood);box(x,.95,z+1.64,.75,1.9,.08,M.dark);for(const dx of [-1.5,1.4]){box(x+dx,1.45,z+1.64,.75,.8,.08,M.trim);box(x+dx,1.45,z+1.69,.58,.6,.03,M.glass)}}
house(-8,-18,M.brick);house(0,-18,M.cream);house(8,-18,M.wall);
function tree(x,z){cylinder(x,.9,z,.18,1.8,M.trunk);ball(x,2.2,z,.9,1,.8,M.leaf);ball(x+.55,2,z,.7,.7,.7,M.leaf)}tree(-8,-6.5);tree(7,-7);tree(11,-14);tree(-14,-14);
box(5,.5,-7.2,.7,1,.7,M.dark);box(5,1.04,-7.2,.77,.1,.77,M.wood);box(-7,.23,-7.2,1.4,.45,.5,M.wood);
const catRoot=new THREE.Group();scene.add(catRoot);let mixer,actions={},currentAction='',modelHeight=.6;
let state={x:-1.9,z:.3,food:55,water:62,owner:false,ate:false,drank:false,tv:false,outside:false};
try{const loaded=JSON.parse(localStorage.getItem(SAVE));if(loaded&&typeof loaded.x==='number'&&Number.isFinite(loaded.x))state={...state,...loaded}}catch{}
state.x=THREE.MathUtils.clamp(state.x,-12,12);state.z=THREE.MathUtils.clamp(state.z,-19,3.7);
let y=0,vertical=0,playing=false,started=false,jumping=false,eatUntil=0,thoughtTimer,quest='';let yaw=.58,pitch=.72,dragging=false,lastX=0,lastY=0,renderLast=0,prev=0,saveTime=0;
const keys=new Set();const targetLook=new THREE.Vector3(), cameraGoal=new THREE.Vector3();
function say(text,ms=4500){$('thought').textContent=text;$('thought').classList.add('show');clearTimeout(thoughtTimer);thoughtTimer=setTimeout(()=>$('thought').classList.remove('show'),ms)}
function save(){state.x=catRoot.position.x;state.z=catRoot.position.z;try{localStorage.setItem(SAVE,JSON.stringify(state))}catch{}}
function questUI(){let q;if(!state.owner)q=['Where is everyone?','The house is quiet. Look around for your person.','01','A FAMILIAR MORNING'];else if(!state.ate)q=['Breakfast first','There’s still food where it always is.','02','A FAMILIAR MORNING'];else if(!state.outside)q=['A little fresh air','The front door is shut. Perhaps the open window?','03','SOMETHING FEELS DIFFERENT'];else q=['The quiet street','There are places to explore, but nobody seems to be around.','04','OUTSIDE'];
if(quest!==q[0]){quest=q[0];$('quest-title').textContent=q[0];$('quest-copy').textContent=q[1];$('quest-index').textContent=q[2];$('quest-category').textContent=q[3]};$('food-bar').style.width=state.food+'%';$('water-bar').style.width=state.water+'%'}
const items=[{x:-3,z:2.2,r:2.3,label:'Look for your person',type:'bed'},{x:2.75,z:1.85,r:1.1,label:'Eat breakfast',type:'food'},{x:3.48,z:1.85,r:1.05,label:'Drink water',type:'water'},{x:3.8,z:-1.65,r:1.25,label:'Investigate the television',type:'tv'},{x:2.8,z:3.9,r:1.05,label:'Try the front door',type:'door'},{x:-3.2,z:-3.65,r:1.4,label:'Look at the open window',type:'window'}];
function nearby(){let nearest=null,best=Infinity;for(const item of items){const d=Math.hypot(catRoot.position.x-item.x,catRoot.position.z-item.z);if(d<item.r&&d<best && !(catRoot.position.z< -4.3 && item.type!=='window')){nearest=item;best=d}}return nearest}
function interact(){if(!playing)return;const item=nearby();if(!item)return;if(item.type==='bed'){state.owner=true;say('Their smell is here. Maybe they will be back soon.')}if(item.type==='food'){state.food=Math.min(100,state.food+35);state.ate=true;eatUntil=performance.now()+2300;say('Breakfast, just where it should be.')}if(item.type==='water'){state.water=Math.min(100,state.water+40);eatUntil=performance.now()+1800;say('A few quiet laps of water.')}if(item.type==='tv'){state.tv=true;say('The screen flickers. A voice crackles from somewhere inside.',5500)}if(item.type==='door')say('It won’t budge. The window smells like outside.');if(item.type==='window')say('A familiar way out. Jump up and through.');questUI();save()}
function animate(name,force=false){if(currentAction===name&&!force)return;let next=actions[name]||actions.Idle;if(!next)return;const previous=actions[currentAction];if(previous&&previous!==next)previous.fadeOut(.18);next.reset().fadeIn(.18).play();currentAction=name}
new GLTFLoader().load('./assets/kitten.glb',gltf=>{const model=gltf.scene;catRoot.add(model);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();bounds.getSize(size);const scale=.64/Math.max(size.y,.001);model.scale.setScalar(scale);model.updateMatrixWorld(true);const fitted=new THREE.Box3().setFromObject(model);model.position.y-=fitted.min.y;model.position.x-=(fitted.min.x+fitted.max.x)/2;model.position.z-=(fitted.min.z+fitted.max.z)/2;modelHeight=.64;model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});mixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations){actions[clip.name]=mixer.clipAction(clip);if(['Jump','LieDown','WakeUp'].includes(clip.name)){actions[clip.name].setLoop(THREE.LoopOnce,1);actions[clip.name].clampWhenFinished=true}}animate('Idle');catRoot.position.set(state.x,0,state.z);questUI();$('loading').hidden=true;$('start-btn').disabled=false;$('start-btn').innerHTML='Begin the morning <span>↗</span>';renderOnce();},undefined,error=>{$('loading-detail').textContent='The kitten could not be loaded. Please reload the page.';console.error(error)});
function wallVisibility(){const inside=catRoot.position.z>-4;backWall.visible=!(inside&&camera.position.z>3.65);leftWall.visible=!(inside&&camera.position.x< -4.3);rightWall.visible=!(inside&&camera.position.x>4.3)}
function renderOnce(){camera.position.set(catRoot.position.x+5,5.3,catRoot.position.z+7);camera.lookAt(catRoot.position.x,.45,catRoot.position.z);wallVisibility();renderer.render(scene,camera)}
function pause(){if(!started)return;playing=false;keys.clear();$('pause').hidden=false;save()}
function resume(){if(!started)return;$('pause').hidden=true;playing=true;prev=performance.now();renderLast=0;requestAnimationFrame(frame)}
$('start-btn').onclick=()=>{started=true;$('start').hidden=true;$('shell').hidden=false;playing=true;prev=performance.now();requestAnimationFrame(frame);say(state.owner?'The house is still quiet.':'A familiar morning. But something feels different.')};$('pause-btn').onclick=pause;$('help-btn').onclick=pause;$('resume-btn').onclick=resume;
$('reset-btn').onclick=()=>{try{localStorage.removeItem(SAVE)}catch{}location.reload()};
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(playing)pause();else if(started)resume();return}if(e.repeat)return;keys.add(e.code);if(e.code==='KeyE')interact();if(e.code==='Space'&&playing&&!jumping&&performance.now()>eatUntil){jumping=true;vertical=4.5;animate('Jump',true)}});addEventListener('keyup',e=>keys.delete(e.code));
renderer.domElement.addEventListener('pointerdown',e=>{if(playing){dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)}});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.004,.35,1.1);lastX=e.clientX;lastY=e.clientY});renderer.domElement.addEventListener('pointerup',()=>dragging=false);addEventListener('blur',()=>{if(playing)pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));renderer.setSize(innerWidth,innerHeight);if(!playing&&mixer)renderOnce()});
function validPosition(x,z,height){if(x< -13||x>13||z< -20||z>3.8)return false;const wasInside=catRoot.position.z> -4;const isInside=z> -4;
 if(wasInside!==isInside){if(!(x> -3.58&&x< -2.83&&height>.61&&height<1.38))return false}
 if(isInside&&(x< -4.36||x>4.36))return false;
 // Sofa, table and bed; low window is approached without a hidden blocker.
 if(isInside&&height<.7){if(x> -1.22&&x<.52&&z> -.08&&z<.86)return false;if(x>.72&&x<1.8&&z>-.56&&z<.32)return false;if(x> -4.1&&x< -1.7&&z>1.5&&z<3.15)return false}
 return true}
function frame(now){if(!playing)return;requestAnimationFrame(frame);if(now-renderLast<1000/24)return;const dt=Math.min((now-prev)/1000,.08);prev=now;renderLast=now;
 let a=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);let b=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);let move=new THREE.Vector3();if(performance.now()>eatUntil){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));move.addScaledVector(forward,b).addScaledVector(right,a);if(move.lengthSq()>0)move.normalize()}
 const running=keys.has('ShiftLeft')||keys.has('ShiftRight');const speed=running?2.8:1.55;let nx=catRoot.position.x+move.x*speed*dt,nz=catRoot.position.z+move.z*speed*dt;if(validPosition(nx,catRoot.position.z,y))catRoot.position.x=nx;if(validPosition(catRoot.position.x,nz,y))catRoot.position.z=nz;
 if(move.lengthSq()>.001){const target=Math.atan2(move.x,move.z);let diff=Math.atan2(Math.sin(target-catRoot.rotation.y),Math.cos(target-catRoot.rotation.y));catRoot.rotation.y+=diff*Math.min(1,dt*9)}
 if(jumping){vertical-=11*dt;y+=vertical*dt;if(y<=0){y=0;vertical=0;jumping=false}}catRoot.position.y=y;
 if(!jumping){if(performance.now()<eatUntil)animate('Eat');else if(move.lengthSq()>.001)animate(running?'Run':'Walk');else animate('Idle')}
 if(mixer)mixer.update(dt);state.food=Math.max(0,state.food-dt*.025);state.water=Math.max(0,state.water-dt*.035);
 if(!state.outside&&catRoot.position.z< -4.4){state.outside=true;say('No footsteps. No voices. Where did everybody go?',6000)}
 const item=nearby();$('prompt').hidden=!item||jumping;$('prompt-text').textContent=item?.label||'';questUI();
 targetLook.set(catRoot.position.x,.5+y*.3,catRoot.position.z);const dist=5.3;cameraGoal.set(targetLook.x+Math.sin(yaw)*Math.cos(pitch)*dist,targetLook.y+Math.sin(pitch)*dist,targetLook.z+Math.cos(yaw)*Math.cos(pitch)*dist);camera.position.lerp(cameraGoal,Math.min(1,dt*5));camera.lookAt(targetLook);wallVisibility();renderer.render(scene,camera);if(now-saveTime>5000){saveTime=now;save()}}
