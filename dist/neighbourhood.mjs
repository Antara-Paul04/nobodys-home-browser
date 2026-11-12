// Builds the free-roam para: paving, generated houses, clutter, wires, the pond, the big road and the authored models.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createKit} from './procedural-view.mjs';
import {createDecals} from './decals.mjs';
import * as home from './home.mjs';
import {houses,props,assets,walls,lanes,pond,bollards,proceduralBuildings,clutter,SCALE} from './explore-layout.mjs';

export async function buildNeighbourhood(scene,onProgress=()=>{}){
 const kit=createKit(scene),decals=createDecals(),obstacles=[],staticGroups=[],homeInterior=[];
 const P=(g,m,x,y,z,w,h,d,ry=0,rx=0,c)=>kit.add({g,m,x,y,z,w,h,d,ry,rx,c});

 // ------------------------------------------------------------ ground
 P('box','g_earth',1,-.03,-6,150,.05,130);
 const order={tarmac:0,paver:1,earth:2,asphalt:3,cement:4,brick:5};
 for(const l of lanes){const y=.012+order[l.kind]*.0012+(l.id==='footpath'?.065:0),h=l.id==='footpath'?.09:.025;P('box','g_'+l.kind,(l.x0+l.x1)/2,y+ (l.id==='footpath'?-.02:0),(l.z0+l.z1)/2,l.x1-l.x0,h,l.z1-l.z0)}
 // The pond: still green water, hyacinth drifting at the edges.
 P('cyl','water',pond.x,.02,pond.z,pond.rx,.03,pond.rz);P('cyl','g_earth',pond.x,.012,pond.z,pond.rx+.35,.03,pond.rz+.35);
 for(let i=0;i<40;i++){const a=i*2.4,r=.55+.4*((i*37)%10)/10;P('blob','hyacinth',pond.x+Math.cos(a)*pond.rx*r,.04,pond.z+Math.sin(a)*pond.rz*r,.14+.1*((i*13)%7)/7,.025,.12+.1*((i*7)%5)/5,a)}
 // The big road: painted kerb, tram rails set in stone, a worn centre line.
 for(let z=-45.5,i=0;z<32.5;z+=.5,i++)P('box','paint',27.32,.06,z+.25,.06,.105,.5,0,0,i%2?0xe6e9e6:0x2f79c2);
 P('box','g_brick',31.9,.0125,-6.5,1.9,.026,79);for(const dx of [-.54,.54])P('box','railsteel',31.9+dx,.03,-6.5,.045,.02,79);
 for(let z=-44;z<32;z+=2.4)P('box','paint',29.9,.0262,z,.07,.004,1.1,0,0,0xcfd0c4);
 // Boundary walls, yard walls and the blue-and-white railing of the footpath.
 for(const [x,y,z,w,h,d,m] of walls){
  if(m==='rail'){ // posts, three rails and thin bars, bay by bay in alternating blue and white
   const alongX=w>d,len=alongX?w:d,n=Math.max(1,Math.round(len/1.1)),base=x>25.8&&x<27.3?.09:.025,at=t=>alongX?[x-len/2+t,z]:[x,z-len/2+t];
   for(let i=0;i<=n;i++){const [px,pz]=at(len*i/n);P('box','paint',px,base+.41,pz,.05,.82,.05,0,0,0xe6e9e6);P('box','paint',px,base+.84,pz,.065,.05,.065,0,0,0x2f79c2)}
   for(let i=0;i<n;i++){const c=i%2?0xe6e9e6:0x2f79c2,[mx,mz]=at(len*(i+.5)/n),bay=len/n;
    for(const yy of [.31,.53,.75])P('box','paint',mx,base+yy,mz,alongX?bay:.03,.03,alongX?.03:bay,0,0,c);
    for(let k=1;k<5;k++){const [bx,bz]=at(len*i/n+bay*k/5);P('box','paint',bx,base+.53,bz,.016,.44,.016,0,0,c)}}
   continue}
  P('box',m,x,y,z,w,h,d,0,0,m==='plaster'?0xc8b27a:m==='cement'?0x9a9486:undefined);P('box','concrete',x,y+h/2+.02,z,w+.06,.04,d+.06);
 }

 for(const [x,z] of bollards){const base=x>25.8?.09:.025;P('cyl','paint',x,base+.19,z,.05,.38,.05,0,0,0x2f79c2);P('cyl','paint',x,base+.52,z,.05,.28,.05,0,0,0xe6e9e6);P('cyl','paint',x,base+.68,z,.058,.04,.058,0,0,0x2f79c2)}
 // Tram poles with bracket arms and the overhead wire the trolley pole rides on.
 for(let z=-40;z<=30;z+=14){for(let k=0;k<6;k++)P('cyl','paint',27.12,.09+.45+k*.9,z,.06,.9,.06,0,0,k%2?0xe6e9e6:0x2f79c2);P('cyl','railsteel',29.5,5.42,z,.022,4.8,.022,Math.PI/2,Math.PI/2);P('box','paint',31.9,5.2,z,.02,.42,.02,0,0,0x151515)}
 clutter.wires.push({pts:[[31.9,4.98,-44],[31.9,4.96,-20],[31.9,4.98,4],[31.9,4.96,31]],r:.01});

 // ------------------------------------------------------------ generated houses
 const parent=new THREE.Matrix4();
 for(const b of proceduralBuildings){
  parent.makeRotationY(b.angle);parent.setPosition(b.x,0,b.z);kit.addAll(b.parts,parent);
  for(const d of b.decals)decals.add(d,parent);
 }
 // ------------------------------------------------------------ clutter, decals, wires
 kit.addAll(clutter.parts.filter(p=>p.g));
 for(const d of clutter.decals){if(d.id==='puddle')P('disc','puddle',d.x,.0285+(d.y||0),d.z,d.w/2,1,d.h/2,d.rot||0);else decals.add(d)}
 for(const [x,y,z,ry] of [[-21.66,2.3,-12.98,0],[-20.1,2.3,-6.28,-Math.PI/2],[25.82,2.4,-9.75,Math.PI/2],[-20.08,2.2,7.9,-Math.PI/2]])decals.add({id:'laneplate',x,y,z,ry,w:.9,h:.3});
 const tubes=[];for(const w of clutter.wires){const curve=new THREE.CatmullRomCurve3(w.pts.map(p=>new THREE.Vector3(...p)));tubes.push(new THREE.TubeGeometry(curve,w.pts.length*2,w.r,3,false))}
 if(tubes.length){const mesh=new THREE.Mesh(mergeGeometries(tubes),new THREE.MeshStandardMaterial({color:0x0c0c0c,roughness:.8}));mesh.castShadow=false;scene.add(mesh);tubes.forEach(t=>t.dispose())}
 const instanced=kit.finish(),solidLooking=new Set(['plaster','plasterOld','cement','brick','roof','tin','concrete','stone','shutter','door','oxide','limewash']);
 for(const m of instanced)if(solidLooking.has(m.userData.material))obstacles.push(m);
 decals.build(scene);

 // ------------------------------------------------------------ authored models
 const loader=new GLTFLoader();onProgress('Opening the lanes of North Kolkata…');
 const [houseGltf,streetGltf,homeGltf,propGltf]=await Promise.all(['kolkata-houses','kolkata-street','hero-home','kolkata-props'].map(n=>loader.loadAsync(`./assets/${n}.glb`)));
 const houseSources=houseGltf.scene.children.slice().sort((a,b)=>a.name.localeCompare(b.name));
 function prepare(model,doubleSide=true){model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.anisotropy=4;if(doubleSide)m.side=THREE.DoubleSide}}})}
 for(const p of houses){const model=houseSources[p.i].clone(true);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);
  const wrapper=new THREE.Group();model.position.x-=(bounds.min.x+bounds.max.x)/2;model.position.y-=bounds.min.y;model.position.z-=bounds.max.z;wrapper.add(model);wrapper.scale.setScalar(SCALE);wrapper.rotation.y=p.angle;wrapper.position.set(p.x,0,p.z);prepare(wrapper);scene.add(wrapper);wrapper.updateMatrixWorld(true);wrapper.traverse(o=>{if(o.isMesh)obstacles.push(o)});staticGroups.push(wrapper);
 }
 for(const p of props){const source=streetGltf.scene.getObjectByName(p.name);if(!source)throw new Error('Missing authored asset: '+p.name);const model=source.clone(true);model.scale.setScalar(SCALE);model.position.set(p.x,0,p.z);model.rotation.y=p.angle;prepare(model);scene.add(model);model.updateMatrixWorld(true);
  model.traverse(o=>{if(o.isMesh&&!o.material.transparent)obstacles.push(o)});staticGroups.push(model);
 }
 for(const a of assets){const source=propGltf.scene.getObjectByName(a.name);if(!source)throw new Error('Missing street prop: '+a.name);const model=source.clone(true);model.scale.setScalar(SCALE);model.position.set(a.x,a.x>25.8&&a.x<27.3?.09:0,a.z);model.rotation.y=a.angle;prepare(model,false);
  model.traverse(o=>{if(o.isMesh){const flat=/Tram|Bus|Minibus|Rickshaw|CycleVan|HandPump|Phuchka|FruitCart|Bins|Shelter|Lamp/.test(a.name);for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.transparent){m.depthWrite=false;o.castShadow=false}}}});
  scene.add(model);model.updateMatrixWorld(true);if(a.name==='RedBlock')model.userData.reach=40;else model.traverse(o=>{if(o.isMesh&&!o.material.transparent)obstacles.push(o)});staticGroups.push(model);
 }
 const model=homeGltf.scene;model.scale.setScalar(SCALE);model.rotation.y=Math.PI;model.position.set((home.sourceOrigin+3.7)*SCALE,0,home.FRONT_Z);prepare(model);scene.add(model);model.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isMesh){if(!(o.material.transparent&&o.material.opacity<.6))obstacles.push(o);if(!/shell|floor|yard|door|window|shutter|roof|Cornice|Parapet/i.test(o.name))homeInterior.push(o)}});
 // Distance visibility avoids submitting indoor details from the other end of the lane.
 const spheres=instanced.map(m=>m.boundingSphere);
 return {obstacles,staticGroups,updateVisibility(position){
  const nearHome=Math.hypot(position.x,position.z)<10;for(const o of homeInterior)o.visible=nearHome;
  for(const o of staticGroups)o.visible=Math.hypot(o.position.x-position.x,o.position.z-position.z)-(o.userData.reach||0)<46;
  instanced.forEach((m,i)=>{const s=spheres[i];m.visible=Math.hypot(s.center.x-position.x,s.center.z-position.z)-s.radius<52});
 }};
}
