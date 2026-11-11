import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildProceduralBuildings} from './procedural-view.mjs';
import {proceduralBuildings} from './procedural-buildings.mjs';
import * as home from './home.mjs';
import {houses,props,walls,benches,trees,pots,poles,SCALE} from './explore-layout.mjs';
const boxGeometry=new THREE.BoxGeometry(1,1,1);
function random(seed=103){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}
// Small repeating surface maps. No screen-space effects or per-frame texture work.
function surfaceTexture(kind){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),rand=random(kind==='road'?13:49),data=ctx.createImageData(512,512);
 const palette=kind==='road'?[83,80,72]:kind==='plaster'?[137,132,108]:[125,119,103];
 const grid=Array.from({length:17*17},()=>rand());
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const gx=x/32,gy=y/32,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
  const a=grid[iy*17+ix]*(1-fx)+grid[iy*17+ix+1]*fx,b=grid[(iy+1)*17+ix]*(1-fx)+grid[(iy+1)*17+ix+1]*fx;
  const n=((a*(1-fy)+b*fy)-.5)*24+(rand()-.5)*19;
  const i=(y*512+x)*4;for(let k=0;k<3;k++)data.data[i+k]=palette[k]+n;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);
 if(kind==='road'){
  for(let i=0;i<14;i++){ctx.strokeStyle='rgba(37,37,31,.3)';ctx.lineWidth=.5+rand();let x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<6;j++){x+=(rand()-.5)*34;y+=rand()*25;ctx.lineTo(x,y)}ctx.stroke()}
  for(let i=0;i<8;i++){ctx.fillStyle='rgba(44,43,37,.07)';ctx.beginPath();ctx.ellipse(rand()*512,rand()*512,10+rand()*50,4+rand()*18,rand()*3,0,Math.PI*2);ctx.fill()}
 }else if(kind==='paving'){
  ctx.strokeStyle='rgba(46,44,37,.42)';ctx.lineWidth=2;
  for(let y=0;y<=512;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();for(let x=(y%256?0:128);x<512;x+=256){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+128);ctx.stroke()}}
 }else{
  for(let i=0;i<100;i++){ctx.fillStyle=`rgba(56,67,39,${rand()*.13})`;ctx.fillRect(rand()*512,rand()*512,3+rand()*35,10+rand()*70)}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=2;return t;
}
function groundMaterial(kind,rx,rz){const map=surfaceTexture(kind);map.repeat.set(rx,rz);return new THREE.MeshStandardMaterial({map,roughness:kind==='road'?.94:.98})}
function signTexture(lines,color='#243d37'){
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,256);ctx.strokeStyle='#bcaf87';ctx.lineWidth=4;ctx.strokeRect(12,12,488,232);ctx.fillStyle='#e1d6b3';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='48px "Bangla Sangam MN", sans-serif';ctx.fillText(lines[0],256,96);ctx.font='22px sans-serif';ctx.fillText(lines[1],256,170);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export async function buildNeighbourhood(scene,onProgress=()=>{}){
 const obstacles=buildProceduralBuildings(scene,proceduralBuildings,signTexture),staticGroups=[],homeInterior=[];const mats={};
 const mat=(name,color,roughness=1)=>mats[name]??(mats[name]=new THREE.MeshStandardMaterial({color,roughness}));
 const plaster=new THREE.MeshStandardMaterial({map:surfaceTexture('plaster'),roughness:1});
 const iron=mat('iron',0x343a36),brick=mat('brick',0x775249),wood=mat('wood',0x5b4936),cement=mat('cement',0x7b7869),terracotta=mat('terracotta',0x8f5036);
 const batches=new Map(),dummy=new THREE.Object3D();
 function batch(geometry,material,x,y,z,sx,sy,sz,angle=0){const key=geometry.uuid+material.uuid;let group=batches.get(key);if(!group){group={geometry,material,items:[]};batches.set(key,group)}group.items.push([x,y,z,sx,sy,sz,angle])}
 function box(x,y,z,w,h,d,m=cement,solid=false){const o=new THREE.Mesh(boxGeometry,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=h>.1;o.receiveShadow=true;scene.add(o);if(solid)obstacles.push(o);return o}
 function details(x,y,z,w,h,d,m=cement,angle=0){batch(boxGeometry,m,x,y,z,w,h,d,angle)}
 function ground(x,z,w,d,kind='road',height=.025){const o=box(x,height-.025,z,w,.05,d,groundMaterial(kind,w/3,d/3));o.castShadow=false;return o}
 ground(0,-.5,85,46,'paving',.02);
 ground(0,-9.8,66,4.8);ground(0,9.8,66,3.8);
 for(const x of [-32,-12.8,-4.2,4.35,22.1,32])ground(x,1,Math.abs(x)<6?1.35:2.55,18.7);
 ground(-26,-12,14,1.4,'paving',.09);
 for(const z of [-7.45,-12,11.6]){
  box(0,.035,z,65,.075,.5,groundMaterial('paving',30,.3));
  for(let x=-32;x<33;x+=.62)details(x,.08,z,.025,.012,.49,iron);
  // Open drain with periodic iron covers, just below the pavement edge.
  box(0,.028,z+(z===-12?.34:-.34),65,.012,.15,iron);
  for(let x=-32;x<33;x+=1.5){details(x,.04,z+(z===-12?.34:-.34),.32,.025,.19,cement);for(let i=0;i<4;i++)details(x-.1+i*.065,.055,z+(z===-12?.34:-.34),.025,.008,.15,iron)}
 }
 for(const w of walls)box(...w,plaster,true);
 for(const b of benches){box(...b,wood,true);for(const dx of [-.5,.5])box(b[0]+dx,.15,b[2],.065,.3,.24,iron)}
 const rand=random(444),cyl=new THREE.CylinderGeometry(1,1,1,8),leafGeo=new THREE.IcosahedronGeometry(1,1);
 const leafMats=[mat('leaf olive',0x495339),mat('leaf dark',0x394531),mat('leaf grey',0x60684a)];
 function tube(points,r,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(4,points.length*4),r,4,false),material);scene.add(mesh);return mesh}
 function tree(x,z){
  batch(cyl,wood,x,1.8,z,.13,3.6,.13);
  for(let a=0;a<5;a++){const dx=Math.cos(a*1.4)*.9,dz=Math.sin(a*1.4)*.9;tube([[x,2,z],[x+dx*.5,3,z+dz*.5],[x+dx,4.2,z+dz]],.055,wood)}
  for(let i=0;i<44;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*1.65;batch(leafGeo,leafMats[i%3],x+Math.cos(a)*r,3.8+rand()*.95,z+Math.sin(a)*r,.32+rand()*.45,.18+rand()*.3,.35+rand()*.4,rand()*6)}
 }
 for(const p of trees)tree(...p);
 const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.07,.13,-.045,.16,.27,0,.07,.13,.045],3));blade.setIndex([0,1,2,0,2,3]);blade.computeVertexNormals();
 const plantMat=new THREE.MeshStandardMaterial({color:0x4b603b,roughness:1,side:THREE.DoubleSide});
 function pot(x,z){batch(cyl,terracotta,x,.13,z,.13,.26,.13);for(let i=0;i<11;i++)batch(blade,plantMat,x+(rand()-.5)*.12,.25,z+(rand()-.5)*.12,.65+rand()*.5,.5+rand()*.6,.7+rand()*.4,rand()*Math.PI*2)}
 for(const p of pots)pot(...p);
 // Water tap and buckets in the shared courtyard.
 box(11,.23,3.3,.65,.46,.6,brick,true);batch(cyl,iron,11,.65,3.3,.035,.4,.035);tube([[11,.84,3.3],[11,.84,3.06],[11,.77,3.06]],.028,iron);batch(cyl,mat('bucket',0x426b71),11.4,.18,3.2,.16,.36,.16);
 const wet=new THREE.MeshStandardMaterial({color:0x4f564f,roughness:.25,transparent:true,opacity:.45,depthWrite:false});
 for(const [x,z,sx,sz] of [[10.95,3,.7,.4],[-24.7,-10.5,.8,.22],[-5.2,-8,.9,.18],[18.6,9.2,1.1,.25]]){const p=new THREE.Mesh(new THREE.CircleGeometry(1,16),wet);p.rotation.x=-Math.PI/2;p.position.set(x,.053,z);p.scale.set(sx,sz,1);scene.add(p)}
 // Sagging service wires, poles and high-mounted junction boxes.
 for(const x of poles){
  batch(cyl,cement,x,2.4,-7.65,.07,4.8,.07);details(x,4.1,-7.65,.55,.05,.08,iron);details(x,2.95,-7.61,.17,.25,.12,iron);
  for(let j=0;j<3;j++){tube([[x,4.2+j*.12,-7.65+j*.08],[x+6.4,3.65+j*.12,-7.55+j*.08],[x+13,4.2+j*.12,-7.65+j*.08]],.009,iron)}
 }
 for(const x of [-17,3,23])tube([[x,4.5,-7.7],[x-1,3.8,-9.8],[x-2,4.7,-12.35]],.012,iron);
 // Laundry is deliberately above the walking routes.
 for(const [x,z] of [[-8,5.8],[14,6.1]]){
  tube([[x-1.4,2.2,z],[x,1.95,z],[x+1.4,2.2,z]],.009,iron);
  for(let i=0;i<4;i++)details(x-1+i*.62,1.72,z,.44,.64,.015,mat('cloth'+i,[0x8b8271,0x7e4440,0x465a61,0xb4aa8d][i]));
 }
 // Sparse clay cups, paper and broken brick fragments collect at the edges, not across the path.
 for(let i=0;i<90;i++){const x=rand()*63-31.5,z=(i%2?-7.9:-11.6)+(rand()-.5)*.2;
  if(i%3===0)batch(cyl,terracotta,x,.064,z,.027,.065,.027,rand()*6);
  else details(x,.048,z,.055+rand()*.08,.008,.04+rand()*.08,i%3===1?mat('paper',0xa69e85):brick,rand()*6);
 }
 function sign(x,y,z,angle,lines){const m=new THREE.MeshStandardMaterial({map:signTexture(lines),roughness:.85});const o=box(x,y,z,1.05,.525,.035,m);o.rotation.y=angle;return o}
 sign(-4.9,1.8,-7.07,Math.PI,['পুরনো পাড়া','OLD NEIGHBOURHOOD']);sign(-20.25,1.55,-12.6,0,['চা • মিষ্টি','TEA & SWEETS']);sign(3.45,1.5,7.5,Math.PI,['ধীরে চলুন','SLOW DOWN']);
 for(const {geometry,material,items} of batches.values()){const mesh=new THREE.InstancedMesh(geometry,material,items.length);items.forEach((v,i)=>{dummy.position.set(v[0],v[1],v[2]);dummy.scale.set(v[3],v[4],v[5]);dummy.rotation.set(0,v[6],0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh)}
 const loader=new GLTFLoader();onProgress('Loading the original houses, shops and taxi…');
 const [houseGltf,streetGltf,homeGltf]=await Promise.all([loader.loadAsync('./assets/kolkata-houses.glb'),loader.loadAsync('./assets/kolkata-street.glb'),loader.loadAsync('./assets/hero-home.glb')]);
 const houseSources=houseGltf.scene.children.slice().sort((a,b)=>a.name.localeCompare(b.name));
 function prepare(model){model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.anisotropy=2;m.side=THREE.DoubleSide}}})}

 for(const p of houses){const model=houseSources[p.i].clone(true);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);
  const wrapper=new THREE.Group();model.position.x-=(bounds.min.x+bounds.max.x)/2;model.position.y-=bounds.min.y;model.position.z-=bounds.max.z;wrapper.add(model);wrapper.scale.setScalar(SCALE);wrapper.rotation.y=p.angle;wrapper.position.set(p.x,0,p.z);prepare(wrapper);scene.add(wrapper);wrapper.updateMatrixWorld(true);wrapper.traverse(o=>{if(o.isMesh)obstacles.push(o)});staticGroups.push(wrapper);
 }
 for(const p of props){const source=streetGltf.scene.getObjectByName(p.name);if(!source)throw new Error('Missing authored asset: '+p.name);const model=source.clone(true);model.scale.setScalar(SCALE);model.position.set(p.x,0,p.z);model.rotation.y=p.angle;prepare(model);scene.add(model);model.updateMatrixWorld(true);
  // Actual mesh surfaces let the camera see under awnings and around counters.
  model.traverse(o=>{if(o.isMesh&&!o.material.transparent)obstacles.push(o)});staticGroups.push(model);
 }
 const model=homeGltf.scene;model.scale.setScalar(SCALE);model.rotation.y=Math.PI;model.position.set((home.sourceOrigin+3.7)*SCALE,0,home.FRONT_Z);prepare(model);scene.add(model);model.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isMesh){if(!(o.material.transparent&&o.material.opacity<.6))obstacles.push(o);if(!/shell|floor|yard|door|window|shutter|roof|Cornice|Parapet/i.test(o.name))homeInterior.push(o)}});
 // Distance visibility avoids submitting indoor details from the other end of the lane.
 return {obstacles,staticGroups,updateVisibility(position){const nearHome=Math.hypot(position.x,position.z)<10;for(const o of homeInterior)o.visible=nearHome;for(const o of staticGroups)o.visible=Math.hypot(o.position.x-position.x,o.position.z-position.z)<43}};
}
