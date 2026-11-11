import * as THREE from 'three';
import {seededRandom} from './procedural-buildings.mjs';
function plasterMap(color,seed){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),r=seededRandom(seed),rgb=[color>>16,(color>>8)&255,color&255],pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,n=(r()-.5)*13;for(let k=0;k<3;k++)pixels.data[i+k]=rgb[k]+n;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0);
 for(let i=0;i<85;i++){const x=r()*256,y=r()*256;ctx.fillStyle=i%3?'rgba(67,61,42,.13)':'rgba(106,65,50,.34)';ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<7;j++){const a=j/7*Math.PI*2,sz=3+r()*13;ctx.lineTo(x+Math.cos(a)*sz,y+Math.sin(a)*sz)}ctx.fill()}
 for(let i=0;i<25;i++){ctx.fillStyle='rgba(49,56,40,.08)';ctx.fillRect(r()*256,r()*256,1+r()*4,15+r()*60)}
 const map=new THREE.CanvasTexture(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=2;return map;
}
export function buildProceduralBuildings(scene,specs,signTexture){
 const geometry=new THREE.BoxGeometry(1,1,1),batches=new Map(),obstacles=[],dummy=new THREE.Object3D(),parent=new THREE.Matrix4();
 const mats={trim:new THREE.MeshStandardMaterial({color:0xb1ae94,roughness:1}),stone:new THREE.MeshStandardMaterial({color:0x797d6c,roughness:1}),shutter:new THREE.MeshStandardMaterial({color:0x3b574c,roughness:.95}),louver:new THREE.MeshStandardMaterial({color:0x587064,roughness:1}),wood:new THREE.MeshStandardMaterial({color:0x433d2d,roughness:1}),dark:new THREE.MeshStandardMaterial({color:0x1e2928,roughness:.5}),iron:new THREE.MeshStandardMaterial({color:0x303b34,roughness:.8})};
 function add(material,matrix){let b=batches.get(material);if(!b){b=[];batches.set(material,b)}b.push(matrix.clone())}
 for(const s of specs){
  const paint=new THREE.MeshStandardMaterial({map:plasterMap(s.paint,s.seed),roughness:1});
  // Sample the texture in world coordinates so weathering continues across modules.
  paint.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vFacadePosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 facadePosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nfacadePosition=instanceMatrix*facadePosition;\n#endif\nvFacadePosition=(modelMatrix*facadePosition).xyz;\n#include <project_vertex>`);shader.fragmentShader='varying vec3 vFacadePosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP\nvec4 sampledDiffuseColor=texture2D(map,vec2(vFacadePosition.x+vFacadePosition.z,vFacadePosition.y)*.42);\ndiffuseColor*=sampledDiffuseColor;\ndiffuseColor.rgb*=mix(.58,1.,smoothstep(0.,.9,vFacadePosition.y));\n#endif`)};
  parent.makeRotationY(s.angle);parent.setPosition(s.x,0,s.z);
  for(const p of s.parts){dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();add(p.material==='plaster'?paint:mats[p.material],new THREE.Matrix4().multiplyMatrices(parent,dummy.matrix))}
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(s.tank.r,s.tank.r,s.tank.h,12),mats.iron);tank.position.set(s.tank.x,s.tank.y,s.tank.z).applyMatrix4(parent);tank.castShadow=true;scene.add(tank);
  if(s.shop){
   const group=new THREE.Group(),board=new THREE.Mesh(new THREE.BoxGeometry(s.width*.8,.42,.06),new THREE.MeshStandardMaterial({map:signTexture(s.shop,s.seed%2?'#5c3935':'#394b52'),roughness:.9}));board.position.set(0,2,.17);group.add(board);
   const awning=new THREE.Mesh(new THREE.BoxGeometry(s.width*.85,.045,.95),mats.iron);awning.position.set(0,1.76,.48);awning.rotation.x=-.1;awning.castShadow=true;group.add(awning);
   group.position.set(s.x,0,s.z);group.rotation.y=s.angle;scene.add(group);group.updateMatrixWorld(true);group.traverse(o=>{if(o.isMesh)obstacles.push(o)});
  }
 }
 for(const [material,matrices] of batches){const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);obstacles.push(mesh)}
 return obstacles;
}
