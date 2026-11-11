import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildNeighbourhood} from './neighbourhood.mjs';
import {makeCollisionWorld,spawn,areaName,houses,props,walls,proceduralBuildings} from './explore-layout.mjs';
import {advancePlayer} from './explore-movement.mjs';
import {makeFollowCamera} from './follow-camera.mjs';
import {bindMouseLook} from './mouse-look.mjs';
import * as home from './home.mjs';
const $=id=>document.getElementById(id),SAVE='nobodys-home-kolkata-explore-v1',world=makeCollisionWorld();
const scene=new THREE.Scene();scene.background=new THREE.Color(0x858e8b);scene.fog=new THREE.Fog(0x858e8b,25,57);
const camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.045,85);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});
function pixelRatio(){return Math.min(devicePixelRatio||1,1,Math.sqrt(850000/(innerWidth*innerHeight)))}
renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;$('game').appendChild(renderer.domElement);
const sky=new THREE.HemisphereLight(0xc7d0d2,0x575344,1.65);scene.add(sky);
const sun=new THREE.DirectionalLight(0xefe0bd,2.1);sun.position.set(-12,19,8);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:.5,far:65});sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;
// A tiny neutral environment gives glass and chrome reflections without a live reflection pass.
const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,32);g.addColorStop(0,i===3?'#4c4940':'#9babae');g.addColorStop(1,i===2?'#bac4c5':'#585b51');x.fillStyle=g;x.fillRect(0,0,32,32);return c});
const env=new THREE.CubeTexture(faces);env.needsUpdate=true;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.35;
let light='overcast',player={...spawn,velocity:0,jumping:false},yaw=1.2,pitch=.3,distance=2.8;
try{const s=JSON.parse(localStorage.getItem(SAVE));if(s&&Number.isFinite(s.x)&&Number.isFinite(s.z)&&Number.isFinite(s.y)&&world.valid(s.x,s.z,s.y,false)){Object.assign(player,{x:s.x,z:s.z,y:s.y});yaw=Number.isFinite(s.yaw)?s.yaw:yaw;pitch=THREE.MathUtils.clamp(s.pitch||pitch,.15,1.1);distance=THREE.MathUtils.clamp(s.distance||distance,1.2,6);light=s.light==='dusk'?'dusk':'overcast'}}catch{}
let playing=false,started=false,mixer,actions={},current='',neighbourhood,prev=0,lastFrame=0,lastSave=0,lastVisibility=0,jumpQueued=false,climb=null,nap=false,toastTimer,shadowX=Infinity,shadowZ=Infinity;
const cat=new THREE.Group();scene.add(cat);cat.position.set(player.x,player.y,player.z);cat.rotation.y=-Math.PI/2;
const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=64;const cc=contactCanvas.getContext('2d'),cg=cc.createRadialGradient(32,32,0,32,32,32);cg.addColorStop(0,'rgba(12,17,12,.4)');cg.addColorStop(1,'rgba(12,17,12,0)');cc.fillStyle=cg;cc.fillRect(0,0,64,64);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(.28,.37),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(contactCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;scene.add(contact);
const diagnostics=new URLSearchParams(location.search).has('inspect')?document.createElement('output'):null;let diagnosticFrames=0,diagnosticTime=0;
if(diagnostics){diagnostics.style.cssText='position:fixed;left:24px;top:65px;color:white;font:11px monospace;background:#111b;padding:6px;z-index:6';document.body.appendChild(diagnostics)}
const keys=new Set(),target=new THREE.Vector3(),ray=new THREE.Raycaster(),cameraRig=makeFollowCamera();
const faded=new Map();let cameraConfined=false,lastSafe={...spawn};
const mouse=bindMouseLook(renderer.domElement,{enabled:()=>playing&&$('map').hidden,onLook:(dx,dy)=>{yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch+dy*.0025,.15,1.2)},onUnlock:pause});
function say(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500)}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({x:player.x,z:player.z,y:player.y,yaw,pitch,distance,light}))}catch{}}
function animate(name){if(name===current||!actions[name])return;actions[current]?.fadeOut(.15);actions[name].reset().fadeIn(.15).play();current=name}
function lighting(){const dusk=light==='dusk';sky.intensity=dusk?.9:1.65;sun.intensity=dusk?.8:2.1;sun.color.set(dusk?0xe4a879:0xefe0bd);scene.background.set(dusk?0x656d75:0x858e8b);scene.fog.color.copy(scene.background);renderer.toneMappingExposure=dusk?.8:.9;$('light').value=light;renderer.shadowMap.needsUpdate=true}
function placeCamera(dt=1){
 target.set(cat.position.x,cat.position.y+home.HEIGHT*.7,cat.position.z);
 const result=cameraRig.solve({target,yaw,pitch,distance:home.inside(player.x,player.z)?Math.min(distance,2.5):distance,solids:world.nearby(player.x,player.z,distance+.5),dt});
 cameraConfined=result.confined;camera.position.set(result.position.x,result.position.y,result.position.z);camera.lookAt(target);
 // Only when no physical view fits (e.g. under a bed), fade the particular occluder.
 // Restore its exact material as soon as the kitten is visible again.
 for(const [o,material] of faded){o.material=material}faded.clear();
 if(result.confined){const direction=target.clone().sub(camera.position);ray.set(camera.position,direction.clone().normalize());ray.far=direction.length();for(const hit of ray.intersectObjects(neighbourhood.obstacles,false)){const o=hit.object;if(!o.parent||faded.has(o))continue;faded.set(o,o.material);const original=Array.isArray(o.material)?o.material:[o.material];o.userData.cameraFade??=original.map(m=>{const f=m.clone();f.transparent=true;f.opacity=.18;f.depthWrite=false;return f});o.material=Array.isArray(o.material)?o.userData.cameraFade:o.userData.cameraFade[0]}}
}
function shadows(){if(Math.hypot(player.x-shadowX,player.z-shadowZ)<9)return;shadowX=player.x;shadowZ=player.z;sun.position.set(player.x-12,19,player.z+8);sun.target.position.set(player.x,0,player.z);sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true}
function renderStill(){cat.position.set(player.x,player.y,player.z);neighbourhood.updateVisibility(cat.position);scene.updateMatrixWorld(true);cameraRig.reset();placeCamera();shadows();renderer.render(scene,camera)}
function pause(){if(!started)return;playing=false;keys.clear();jumpQueued=false;mouse.unlock();$('map').hidden=true;save();$('pause').hidden=false}
function resume(){if(!neighbourhood||!mixer)return;$('pause').hidden=true;playing=true;mouse.lock();prev=performance.now();diagnosticTime=prev;diagnosticFrames=0;lastFrame=0;requestAnimationFrame(frame)}
function map(){const visible=$('map').hidden;$('map').hidden=!visible;keys.clear();if(visible)mouse.unlock();else mouse.lock();$('map-btn').setAttribute('aria-label',visible?'Hide neighbourhood map':'Show neighbourhood map');updateMap()}
function updateMap(){const marker=document.getElementById('map-you');if(marker){marker.setAttribute('cx',player.x);marker.setAttribute('cy',player.z)}}
function makeMap(){const rect=(x,z,w,d,color)=>`<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="${color}"/>`;
 let svg=rect(0,-9.8,66,4.8,'#737363')+rect(0,9.8,66,3.8,'#737363');for(const x of [-32,-12.8,-4.2,4.35,22.1,32])svg+=rect(x,1,2,19,'#737363');for(const p of [...houses,...proceduralBuildings])svg+=rect(p.x,p.z+(p.angle?3:-3),4.5,6,'#555e4f');svg+=rect(0,1.5,5.6,11.5,'#a49673');for(const p of props)svg+=rect(p.x,p.z,p.name==='Taxi'?3.2:2.4,p.name==='Taxi'?1.3:2,'#a68b4e');svg+='<text x="0" y="2">⌂ HOME</text><text x="-25" y="-16">MARKET</text><text x="1" y="10.5">BACK LANE</text><circle id="map-you" class="you" r=".65"/>';$('map-svg').innerHTML=svg;updateMap()}
function interact(){if(!playing||climb)return;const route=home.windowPath(player);if(route){climb={points:route,start:{...player},elapsed:0};player.jumping=false;player.velocity=0;animate('Walk')}else{nap=!nap;animate(nap?'Sleep':'Idle');if(nap)say('A quiet spot. Move whenever you’re ready.')}}
function frame(now){if(!playing)return;requestAnimationFrame(frame);if(now-lastFrame<1000/24)return;const dt=Math.min((now-prev)/1000,.08);prev=now;lastFrame=now;
 if(!$('map').hidden)keys.clear();
 const a=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),b=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),dx=-Math.sin(yaw)*b+Math.cos(yaw)*a,dz=-Math.cos(yaw)*b-Math.sin(yaw)*a,running=keys.has('ShiftLeft')||keys.has('ShiftRight');
 const oldX=player.x,oldZ=player.z,wasJumping=player.jumping;
 if(climb){const c=climb,end=c.points[0];c.elapsed+=dt;const t=Math.min(1,c.elapsed/.5),f=t*t*(3-2*t);for(const k of ['x','y','z'])player[k]=c.start[k]+(end[k]-c.start[k])*f;if(t===1){c.points.shift();c.start={...end};c.elapsed=0;if(!c.points.length)climb=null}}
 else advancePlayer(player,{x:dx,z:dz,running,jump:jumpQueued},dt,world);jumpQueued=false;
 const moved=Math.hypot(oldX-player.x,oldZ-player.z)>.0005;if(!player.jumping&&moved&&Math.hypot(player.x-lastSafe.x,player.z-lastSafe.z)>1.2&&world.valid(player.x,player.z,player.y,false)&&[[.3,0],[-.3,0],[0,.3],[0,-.3]].every(([x,z])=>world.valid(player.x+x,player.z+z,player.y,false)))lastSafe={...player};if(moved||player.jumping)nap=false;
 if(moved){const angle=Math.atan2(player.x-oldX,player.z-oldZ),diff=Math.atan2(Math.sin(angle-cat.rotation.y),Math.cos(angle-cat.rotation.y));cat.rotation.y+=diff*Math.min(1,dt*12)}
 if(player.jumping){if(!wasJumping)animate('Jump')}else animate(nap?'Sleep':moved?(running?'Run':'Walk'):'Idle');
 mixer.update(dt);cat.position.set(player.x,player.y,player.z);contact.position.set(player.x,world.ground(player.x,player.z,player.y)+.009,player.z);contact.material.opacity=player.jumping?.35:.8;contact.rotation.z=-cat.rotation.y;
 if(now-lastVisibility>600){neighbourhood.updateVisibility(cat.position);$('area').textContent=areaName(player.x,player.z);lastVisibility=now;updateMap()}
 $('prompt').hidden=climb!==null||(home.inside(player.x,player.z)&&player.y<.74)||Math.abs(player.x-home.window.x)>1.05||Math.abs(player.z-home.window.z)>.3;
 placeCamera(dt);shadows();renderer.render(scene,camera);if(diagnostics){diagnosticFrames++;if(now-diagnosticTime>2000){diagnostics.textContent=Math.round(diagnosticFrames*1000/(now-diagnosticTime))+' fps · '+renderer.info.render.calls+' draws · '+Math.round(renderer.info.render.triangles/1000)+'k triangles · camera '+camera.position.distanceTo(target).toFixed(2)+'m'+(cameraConfined?' tight':'');diagnosticFrames=0;diagnosticTime=now}}if(now-lastSave>5000){save();lastSave=now}
}
$('start-btn').onclick=()=>{started=true;$('start').hidden=true;$('hud').hidden=false;resume();say('Take your time. The lanes join up.')};$('pause-btn').onclick=pause;$('resume-btn').onclick=resume;$('map-btn').onclick=map;$('close-map').onclick=map;
$('home-btn').onclick=()=>{Object.assign(player,spawn,{velocity:0,jumping:false});climb=null;nap=false;yaw=1.2;distance=2.8;save();renderStill();resume()};$('light').onchange=()=>{light=$('light').value;lighting();renderStill();save()};
function zoom(v){distance=THREE.MathUtils.clamp(distance+v,1.2,6)}$('zoom-in').onclick=()=>zoom(-.5);$('zoom-out').onclick=()=>zoom(.5);
addEventListener('keydown',e=>{if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(playing)pause();else if(started)resume();return}if(e.repeat)return;if(e.code==='Tab'&&started){map();return}if(!playing||!$('map').hidden)return;keys.add(e.code);if(e.code==='Space')jumpQueued=true;if(e.code==='KeyE')interact();if(e.code==='KeyM')say('Mrrrow.');if(e.code==='KeyR'){Object.assign(player,lastSafe,{velocity:0,jumping:false});climb=null;cameraRig.reset();say('Back to a clear spot.')}});addEventListener('keyup',e=>keys.delete(e.code));
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*.003)},{passive:false});
addEventListener('blur',()=>{if(playing)pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause()});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);if(neighbourhood&&!playing)renderStill()});
try{
 const kitten=await new GLTFLoader().loadAsync('./assets/kitten.glb');const model=kitten.scene;model.scale.setScalar(home.SCALE);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);model.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);cat.add(model);
 model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});mixer=new THREE.AnimationMixer(model);for(const clip of kitten.animations){if(clip.name==='Jump')clip.tracks=clip.tracks.filter(t=>!t.name.endsWith('Hips.position'));actions[clip.name]=mixer.clipAction(clip);if(clip.name==='Jump'){actions[clip.name].setLoop(THREE.LoopOnce,1);actions[clip.name].clampWhenFinished=true}}animate('Idle');mixer.update(0);
 neighbourhood=await buildNeighbourhood(scene,text=>$('loading-detail').textContent=text);lighting();makeMap();renderStill();$('loading').hidden=true;$('start').hidden=false;
}catch(error){console.error(error);$('loading-detail').textContent='The neighbourhood could not load. Please refresh to try again.'}
