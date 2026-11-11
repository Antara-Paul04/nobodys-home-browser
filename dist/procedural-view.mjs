// Rendering kit for the generated neighbourhood: every wall, shutter, pipe, pot and crow is an instance.
// Parts arrive as plain data ({g, m, x, y, z, w, h, d, ry, rx, c}); this turns them into a few dozen draw calls.
import * as THREE from 'three';
import {seededRandom} from './procedural-buildings.mjs';

// ---------------------------------------------------------------- textures
function tileNoise(size,period,seed){ // tileable value noise, 0…1
 const r=seededRandom(seed),g=Float32Array.from({length:period*period},()=>r()),out=new Float32Array(size*size),s=t=>t*t*(3-2*t);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const gx=x/size*period,gy=y/size*period,ix=Math.floor(gx),iy=Math.floor(gy),fx=s(gx-ix),fy=s(gy-iy),i1=(ix+1)%period,j1=(iy+1)%period;
  out[y*size+x]=(g[iy*period+ix]*(1-fx)+g[iy*period+i1]*fx)*(1-fy)+(g[j1*period+ix]*(1-fx)+g[j1*period+i1]*fx)*fy}
 return out;
}
// RGB: how much the monsoon has darkened the wall. A: where the plaster has let go.
function weatherTexture(){
 const S=512,a=tileNoise(S,3,11),b=tileNoise(S,7,23),c=tileNoise(S,19,37),d=tileNoise(S,61,53),e=tileNoise(S,5,71),data=new Uint8Array(S*S*4),r=seededRandom(5);
 const streak=new Float32Array(S);for(let x=0;x<S;x++)streak[x]=0;
 for(let i=0;i<34;i++){const x=Math.floor(r()*S),w=5+Math.floor(r()*16),k=.2+r()*.5;for(let j=-w;j<=w;j++){const f=1-Math.abs(j)/w;streak[(x+j+S)%S]=Math.max(streak[(x+j+S)%S],k*f*f)}}
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x,blot=a[i]*.5+b[i]*.3+c[i]*.2,fine=d[i];
  let v=.62+.38*Math.min(1,blot*1.5);v*=.9+.1*fine;v*=1-streak[x]*.34*Math.max(0,b[i]*1.6-.35);
  const warm=1-(1-blot)*.1;data[i*4]=255*Math.min(1,v);data[i*4+1]=255*Math.min(1,v*(.97+.03*warm));data[i*4+2]=255*Math.min(1,v*(.9+.08*warm));
  data[i*4+3]=255*Math.min(1,Math.max(0,b[i]*.5+c[i]*.32+a[i]*.24-.04));}
 const t=new THREE.DataTexture(data,S,S,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;
}
function canvasTexture(w,h,draw,{repeat=true,srgb=true,aniso=4}={}){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
 if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=aniso;return t;
}
function speckle(x,w,h,n,colours,size=[1,3],alpha=[.1,.5],r=seededRandom(9)){for(let i=0;i<n;i++){x.globalAlpha=alpha[0]+r()*(alpha[1]-alpha[0]);x.fillStyle=colours[Math.floor(r()*colours.length)];const s=size[0]+r()*(size[1]-size[0]);x.fillRect(r()*w,r()*h,s,s)}x.globalAlpha=1}
// Soft stain: fades to nothing at its edge. Hairline crack: wanders, never zigzags.
function stain(x,cx,cy,rx,ry,rgb,alpha,rot=0){x.save();x.translate(cx,cy);x.rotate(rot);x.scale(1,ry/rx);const g=x.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(.6,`rgba(${rgb},${alpha*.5})`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(-rx,-rx,rx*2,rx*2);x.restore()}
function hairline(x,r,w,h,len=220){let px=r()*w,py=r()*h,a=r()*6.28;x.beginPath();x.moveTo(px,py);for(let i=0;i<len/6;i++){a+=(r()-.5)*.7;px+=Math.cos(a)*6;py+=Math.sin(a)*6;x.lineTo(px,py);if(r()<.05){x.moveTo(px,py);a+=(r()<.5?1:-1)*(.6+r()*.6)}}x.stroke()}
const brickTexture=()=>canvasTexture(512,512,(x,w,h)=>{
 const r=seededRandom(77);x.fillStyle='#665c50';x.fillRect(0,0,w,h);const rows=18,cols=6,bh=h/rows,bw=w/cols;
 for(let j=0;j<rows;j++)for(let i=-1;i<cols;i++){const k=r(),R=92+r()*30,G=56+r()*16,B=46+r()*12,d=k<.1?.55:k<.25?.8:1;
  x.fillStyle=`rgb(${R*d|0},${G*d|0},${B*d|0})`;x.fillRect(i*bw+(j%2?bw/2:0)+2,j*bh+2,bw-4,bh-4)}
 speckle(x,w,h,5200,['#3a2c22','#8a7c68','#4a3628','#2c2a22'],[1,4],[.1,.4],r);
 for(let i=0;i<26;i++)stain(x,r()*w,r()*h,50+r()*70,10+r()*26,'30,34,24',.14+r()*.16,1.57);
});
const stripes=(n,dark,light,vertical=false)=>canvasTexture(64,64,(x,w,h)=>{for(let i=0;i<n;i++){const g=vertical?x.createLinearGradient(i*w/n,0,(i+1)*w/n,0):x.createLinearGradient(0,i*h/n,0,(i+1)*h/n);g.addColorStop(0,light);g.addColorStop(.55,'#ffffff');g.addColorStop(.62,dark);g.addColorStop(1,dark);x.fillStyle=g;vertical?x.fillRect(i*w/n,0,w/n+1,h):x.fillRect(0,i*h/n,w,h/n+1)}});
function alphaPattern(w,h,draw){const t=canvasTexture(w,h,(x,W,H)=>{x.clearRect(0,0,W,H);x.strokeStyle=x.fillStyle='#ffffff';draw(x,W,H)});return t}
const grilleTexture=()=>alphaPattern(128,128,(x,w,h)=>{x.lineWidth=5;for(let i=0;i<8;i++){x.beginPath();x.moveTo(8+i*16,0);x.lineTo(8+i*16,h);x.stroke()}x.lineWidth=6;for(const y of [20,108]){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}x.lineWidth=3;for(let i=0;i<4;i++){x.beginPath();x.arc(16+i*32,64,11,0,7);x.stroke()}});
const gateTexture=()=>alphaPattern(128,128,(x,w,h)=>{x.lineWidth=4;for(let i=-4;i<8;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32+128,h);x.stroke();x.beginPath();x.moveTo(i*32+128,0);x.lineTo(i*32,h);x.stroke()}x.lineWidth=7;for(const y of [4,124]){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}});
const railingTexture=()=>alphaPattern(128,128,(x,w,h)=>{x.lineWidth=5;for(let i=0;i<4;i++){const cx=16+i*32;x.beginPath();x.moveTo(cx,0);x.lineTo(cx,h);x.stroke();x.lineWidth=3;x.beginPath();x.ellipse(cx,44,10,20,0,0,7);x.stroke();x.beginPath();x.ellipse(cx,92,10,14,0,0,7);x.stroke();x.beginPath();x.moveTo(cx-16,66);x.lineTo(cx+16,66);x.stroke();x.lineWidth=5}x.lineWidth=8;for(const y of [4,124]){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}});
const balusterTexture=()=>alphaPattern(128,64,(x,w,h)=>{for(let i=0;i<4;i++){const cx=16+i*32;x.beginPath();x.moveTo(cx-4,0);x.bezierCurveTo(cx-13,16,cx-13,30,cx-5,40);x.lineTo(cx-7,h);x.lineTo(cx+7,h);x.lineTo(cx+5,40);x.bezierCurveTo(cx+13,30,cx+13,16,cx+4,0);x.fill()}});
const jaliTexture=()=>canvasTexture(64,64,(x,w,h)=>{x.fillStyle='#a39d8c';x.fillRect(0,0,w,h);x.fillStyle='#22241f';for(let j=0;j<2;j++)for(let i=0;i<2;i++){x.beginPath();x.moveTo(16+i*32,4+j*32);x.lineTo(28+i*32,16+j*32);x.lineTo(16+i*32,28+j*32);x.lineTo(4+i*32,16+j*32);x.fill()}speckle(x,w,h,200,['#5a574c','#c9c2ad'])});
const doorTexture=()=>canvasTexture(64,128,(x,w,h)=>{x.fillStyle='#e9e9e9';x.fillRect(0,0,w,h);x.fillStyle='#8a8a8a';x.fillRect(31,0,2,h);x.strokeStyle='#9c9c9c';x.lineWidth=2;for(const cx of [4,36])for(const [y,hh] of [[6,34],[46,34],[86,36]]){x.strokeRect(cx,y,24,hh);x.fillStyle='rgba(0,0,0,.08)';x.fillRect(cx+3,y+3,18,hh-6)}x.fillStyle='#3a3a3a';x.fillRect(26,62,3,8);x.fillRect(35,62,3,8);x.fillStyle='rgba(40,34,20,.35)';x.fillRect(0,h-16,w,16)},{repeat:false});
const tinTexture=()=>canvasTexture(128,128,(x,w,h)=>{for(let i=0;i<8;i++){const g=x.createLinearGradient(i*16,0,i*16+16,0);g.addColorStop(0,'#8f8f8f');g.addColorStop(.5,'#f4f4f4');g.addColorStop(1,'#858585');x.fillStyle=g;x.fillRect(i*16,0,16,h)}const r=seededRandom(3);for(let i=0;i<40;i++){x.fillStyle=`rgba(120,66,30,${.1+r()*.3})`;x.fillRect(r()*w,0,3+r()*14,h)}});
const acTexture=()=>canvasTexture(64,40,(x,w,h)=>{x.fillStyle='#cfcdc2';x.fillRect(0,0,w,h);x.strokeStyle='#8a887e';x.lineWidth=1;x.strokeRect(1,1,w-2,h-2);x.fillStyle='#5a5a55';x.beginPath();x.arc(22,20,14,0,7);x.fill();x.strokeStyle='#9a9a94';for(let i=0;i<6;i++){x.beginPath();x.moveTo(22,20);x.lineTo(22+14*Math.cos(i),20+14*Math.sin(i));x.stroke()}for(let i=0;i<6;i++)x.fillRect(42,6+i*5,16,2);x.fillStyle='rgba(60,50,30,.35)';x.fillRect(0,h-8,w,8)},{repeat:false});
const meterTexture=()=>canvasTexture(32,44,(x,w,h)=>{x.fillStyle='#4a4f50';x.fillRect(0,0,w,h);x.fillStyle='#b9b9ae';x.fillRect(5,5,22,14);x.fillStyle='#222';x.fillRect(8,9,16,5);x.fillStyle='#8a2a22';x.fillRect(6,26,8,8);x.fillStyle='#2a2a2a';x.fillRect(18,26,8,12)},{repeat:false});
function groundTexture(kind){
 return canvasTexture(512,512,(x,w,h)=>{const r=seededRandom({asphalt:31,cement:47,brick:59,earth:67,paver:71,tarmac:83}[kind]);
  if(kind==='asphalt'||kind==='tarmac'){x.fillStyle=kind==='tarmac'?'#6b6962':'#7a766a';x.fillRect(0,0,w,h);speckle(x,w,h,9000,['#56534b','#8f8b7e','#7f7b6e','#625f56'],[1,3],[.12,.4],r);
   for(let i=0;i<(kind==='tarmac'?3:9);i++)stain(x,r()*w,r()*h,36+r()*70,24+r()*44,`${150+r()*30|0},${146+r()*26|0},${132+r()*20|0}`,.22+r()*.2,r()*3);
   x.strokeStyle='rgba(30,30,26,.38)';for(let i=0;i<9;i++){x.lineWidth=.5+r()*.9;hairline(x,r,w,h,120+r()*200)}for(let i=0;i<12;i++)stain(x,r()*w,r()*h,30+r()*70,18+r()*40,'38,38,32',.1+r()*.14,r()*3);
  }else if(kind==='cement'){x.fillStyle='#9a9688';x.fillRect(0,0,w,h);speckle(x,w,h,7000,['#7f7b6e','#aeaa9a','#8a8678'],[1,4],[.1,.35],r);
   x.strokeStyle='rgba(40,38,30,.55)';x.lineWidth=3;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(0,i*256);x.lineTo(w,i*256);x.stroke();x.beginPath();x.moveTo(i*256+(i%2?40:0),0);x.lineTo(i*256,h);x.stroke()}
   x.strokeStyle='rgba(34,32,26,.42)';for(let i=0;i<6;i++){x.lineWidth=.5+r()*.8;hairline(x,r,w,h,100+r()*180)}
   for(let i=0;i<16;i++)stain(x,r()*w,r()*h,26+r()*70,16+r()*44,r()<.5?'46,54,36':'40,38,32',.1+r()*.16,r()*3);
  }else if(kind==='brick'){x.fillStyle='#4a4238';x.fillRect(0,0,w,h);const bw=64,bh=21;for(let j=0;j<Math.ceil(h/bh);j++)for(let i=-1;i<w/bw;i++){const d=.75+r()*.35;x.fillStyle=`rgb(${108*d|0},${70*d|0},${56*d|0})`;x.fillRect(i*bw+(j%2?bw/2:0)+1.5,j*bh+1.5,bw-3,bh-3)}
   speckle(x,w,h,6000,['#3a3229','#8f7f6a','#2a2620'],[1,4],[.1,.45],r);for(let i=0;i<12;i++)stain(x,r()*w,r()*h,30+r()*70,18+r()*40,'40,48,30',.16+r()*.2,r()*3);
  }else if(kind==='earth'){x.fillStyle='#6a5d49';x.fillRect(0,0,w,h);speckle(x,w,h,11000,['#4d4334','#85765c','#5b5040','#7a6f5a','#3f4a30'],[1,5],[.12,.5],r);
   for(let i=0;i<20;i++)stain(x,r()*w,r()*h,24+r()*80,16+r()*50,`${40+r()*30|0},${44+r()*30|0},${30+r()*14|0}`,.14+r()*.2,r()*3);
  }else{x.fillStyle='#6f6c63';x.fillRect(0,0,w,h);const s=32;for(let j=0;j<h/s;j++)for(let i=0;i<w/s;i++){const red=(i*7+j*3)%11===0,d=.9+r()*.16;x.fillStyle=red?`rgb(${140*d|0},${112*d|0},${100*d|0})`:`rgb(${134*d|0},${130*d|0},${120*d|0})`;x.fillRect(i*s+1,j*s+1,s-2,s-2)}speckle(x,w,h,5000,['#56534b','#a8a497'],[1,3],[.1,.3],r);for(let i=0;i<14;i++)stain(x,r()*w,r()*h,24+r()*70,16+r()*40,'40,40,32',.12+r()*.16,r()*3)}
 });
}

// ---------------------------------------------------------------- materials
export function createMaterials(){
 const weather=weatherTexture(),brickMap=brickTexture(),M={};
 // World-space weathering: stains run across walls and modules without repeating per box.
 const vertexHead='varying vec3 vWorldP;varying vec3 vWorldN;\n',vertexBody=`vec4 kWorld=vec4(transformed,1.0);vec3 kNormal=objectNormal;
#ifdef USE_INSTANCING
kWorld=instanceMatrix*kWorld;kNormal=mat3(instanceMatrix)*kNormal;
#endif
vWorldP=(modelMatrix*kWorld).xyz;vWorldN=mat3(modelMatrix)*kNormal;
#include <project_vertex>`;
 function weathered(name,{color=0xffffff,peel=1,damp=.8,brick='none',roughness=1,streak=1,tile=null,tileScale=1,macro=.21,side=THREE.FrontSide}={}){
  const m=new THREE.MeshStandardMaterial({color,roughness,map:weather,side});
  m.onBeforeCompile=s=>{
   s.uniforms.kBrick={value:brickMap};if(tile)s.uniforms.kTile={value:tile};
   s.vertexShader=vertexHead+s.vertexShader.replace('#include <project_vertex>',vertexBody);
   s.fragmentShader='varying vec3 vWorldP;varying vec3 vWorldN;uniform sampler2D kBrick;'+(tile?'uniform sampler2D kTile;':'')+'\n'+s.fragmentShader.replace('#include <map_fragment>','').replace('#include <color_fragment>',`#include <color_fragment>
{vec3 kn=normalize(vWorldN);bool flat_=abs(kn.y)>.6;vec2 kuv=flat_?vWorldP.xz:vec2(vWorldP.x+vWorldP.z,vWorldP.y);
vec4 w1=texture2D(map,kuv*${macro.toFixed(3)});vec4 w2=texture2D(map,mat2(.8,-.6,.6,.8)*kuv*.83+.31);
${tile?`diffuseColor.rgb*=texture2D(kTile,vWorldP.xz*${tileScale.toFixed(3)}).rgb;diffuseColor.rgb*=mix(vec3(1.),w1.rgb,.9)*mix(vec3(1.),w2.rgb,.35);`:`
float kd=flat_?0.:clamp((1.15-vWorldP.y)*.85+(w1.a-.45)*1.2,0.,1.);
vec3 kp=diffuseColor.rgb*mix(vec3(1.),w1.rgb,${streak.toFixed(2)})*mix(vec3(1.),w2.rgb,.5);
kp=mix(kp,kp*vec3(.46,.5,.38),kd*${damp.toFixed(2)});
vec3 kb=texture2D(kBrick,kuv).rgb*(.42+.5*w1.g)*mix(vec3(1.),vec3(.5,.54,.42),kd*.7);
${brick==='only'?'diffuseColor.rgb=kb*diffuseColor.rgb;':brick==='peel'?`float kpeel=smoothstep(${peel.toFixed(2)},${(peel+.07).toFixed(3)},w1.a*.5+w2.a*.5+kd*.16);diffuseColor.rgb=mix(kp,kb,kpeel);`:'diffuseColor.rgb=kp;'}`}
}`)};
  m.customProgramCacheKey=()=>name;return M[name]=m;
 }
 weathered('plaster',{brick:'peel',peel:.6});weathered('plasterOld',{brick:'peel',peel:.5,damp:1});
 weathered('cement',{damp:1});weathered('brick',{brick:'only'});weathered('trim',{damp:.6,streak:.8});
 weathered('stone',{color:0x8a877a,damp:.9});weathered('concrete',{color:0x9a978a,damp:.6});weathered('roof',{color:0x6a665b,damp:0});
 weathered('slab',{color:0xa39f90,damp:0});weathered('kerb',{color:0x7d7a6e,damp:0});weathered('ghat',{color:0x8d897b,damp:1});
 weathered('oxide',{color:0x8a3d2e,damp:.7});weathered('limewash',{color:0xd9d3be,damp:.8});
 for(const [kind,scale] of [['asphalt',.42],['cement',.5],['brick',.9],['earth',.36],['paver',.8],['tarmac',.3]])weathered('g_'+kind,{tile:groundTexture(kind),tileScale:scale,macro:.047,roughness:kind==='tarmac'?.85:.97});
 // Patterns that repeat by the size of the part, so bars and slats keep their spacing on any window.
 function sized(name,map,density,{alpha=false,color=0xffffff,roughness=.9,metalness=0}={}){
  const m=new THREE.MeshStandardMaterial({map,color,roughness,metalness,alphaTest:alpha?.45:0,side:alpha?THREE.DoubleSide:THREE.FrontSide});
  m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#if defined(USE_MAP) && defined(USE_INSTANCING)
vMapUv=uv*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz))*vec2(${density[0].toFixed(3)},${density[1].toFixed(3)});
#endif`)};
  m.customProgramCacheKey=()=>name;return M[name]=m;
 }
 sized('louver',stripes(8,'#5f5f5f','#c9c9c9'),[.01,1.9]);sized('shutter',stripes(8,'#6f6f6f','#d4d4d4'),[.01,2.8],{roughness:.6,metalness:.3});
 sized('grille',grilleTexture(),[1.5,1.25],{alpha:true,color:0x2a2f2c});sized('gate',gateTexture(),[3.2,3.2],{alpha:true,color:0x33383a});
 sized('railing',railingTexture(),[1.6,1.351],{alpha:true,color:0x1f2422});sized('baluster',balusterTexture(),[1.7,2.38],{alpha:true,color:0xd4ccb4});
 sized('jali',jaliTexture(),[5,5]);sized('tin',tinTexture(),[1.1,.01],{roughness:.7,metalness:.25});
 const plain=(name,color,o={})=>M[name]=new THREE.MeshStandardMaterial({color,roughness:1,...o});
 M.door=new THREE.MeshStandardMaterial({map:doorTexture(),roughness:.85});M.acunit=new THREE.MeshStandardMaterial({map:acTexture(),roughness:.8});M.meter=new THREE.MeshStandardMaterial({map:meterTexture(),roughness:.7});
 // Three shared bases carry every plain colour through the instance colour.
 plain('paint',0xffffff,{roughness:.85});plain('flat',0xffffff,{flatShading:true});plain('cloth',0xffffff,{side:THREE.DoubleSide});
 plain('glass',0x1b2a2f,{roughness:.12,metalness:.25});plain('glow',0xfff6dc,{emissive:0xfff0c8,emissiveIntensity:1.6});plain('brass',0xb8923a,{metalness:.85,roughness:.35});
 plain('drain',0x161b18,{roughness:.08,metalness:.1});plain('puddle',0x2c322e,{roughness:.05,metalness:.2,transparent:true,opacity:.62,depthWrite:false});
 plain('water',0x32463a,{roughness:.06,metalness:.25});plain('railsteel',0x8d8d90,{roughness:.3,metalness:.9});
 return M;
}

// ---------------------------------------------------------------- geometry
function makeGeometries(){
 const G={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,10),taper:new THREE.CylinderGeometry(.62,1.12,1,7),cone:new THREE.ConeGeometry(1,1,9),cone4:new THREE.ConeGeometry(1,1,4),
  blob:new THREE.IcosahedronGeometry(1,1),torus:new THREE.TorusGeometry(1,.075,6,18),disc:new THREE.CircleGeometry(1,16).rotateX(-Math.PI/2)};
 const ring=new THREE.Shape();ring.absarc(0,0,1,0,Math.PI,false);ring.lineTo(-.76,0);ring.absarc(0,0,.76,Math.PI,0,true);ring.lineTo(1,0);
 G.arch=new THREE.ExtrudeGeometry(ring,{depth:1,bevelEnabled:false,curveSegments:10}).translate(0,0,-.5);
 const half=new THREE.Shape();half.absarc(0,0,1,0,Math.PI,false);half.lineTo(1,0);G.archfill=new THREE.ExtrudeGeometry(half,{depth:1,bevelEnabled:false,curveSegments:10}).translate(0,0,-.5);
 G.dish=new THREE.SphereGeometry(1,12,4,0,Math.PI*2,0,.85).translate(0,-.75,0).rotateX(Math.PI);
 // A palm frond or banana leaf: arched midrib along +z, folded like a shallow V.
 const f=new THREE.PlaneGeometry(1,1,2,6),p=f.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i)+.5,w=Math.sin(Math.PI*(.12+.88*v))*.5+.04;p.setXYZ(i,u*2*w,.34*v-.72*v*v-Math.abs(u)*.3,v)}f.computeVertexNormals();G.frond=f;
 return G;
}

// ---------------------------------------------------------------- the kit
// Material keys that are only a colour: [shared base, default colour].
const ALIAS={wood:['paint',0x5a4632],iron:['paint',0x2b2f2e],dark:['paint',0x101312],tank:['paint',0x151516],tankc:['paint'],pipe:['paint'],goods:['paint'],bamboo:['paint',0x9a8f58],culm:['paint',0x8f9a4a],stem:['paint',0x7f9440],
 palm:['paint',0x8a7a62],bark:['paint',0x5f4c3a],barkpale:['paint',0x8f8776],brickbit:['paint',0x8a4a36],tyre:['paint',0x151515],cable:['paint',0x0c0c0c],earthen:['paint',0x9a5536],jute:['paint',0x9a8560],crow:['paint',0x0e0e10],crowbeak:['paint',0x2c2c2c],
 leaf:['flat'],flower:['flat'],garbage:['flat',0x3d3a32],sand:['flat',0xb9a67a],chips:['flat',0x7c7a72],coal:['flat',0x141414],hyacinth:['flat',0x4f7a36],tarp:['cloth'],frond:['cloth'],dishgrey:['cloth',0x9a9a94]};
export function createKit(scene,{chunk=40}={}){
 const M=createMaterials(),G=makeGeometries(),batches=new Map(),dummy=new THREE.Object3D(),matrix=new THREE.Matrix4(),colour=new THREE.Color(),white=new THREE.Color(1,1,1),centre=new THREE.Vector3();
 dummy.rotation.order='YXZ';
 const noShadow=new Set(['drain','puddle','glow','cable','water','g_asphalt','g_cement','g_brick','g_earth','g_paver','g_tarmac','kerb']);
 function add(part,parent){
  dummy.position.set(part.x,part.y,part.z);dummy.rotation.set(part.rx||0,part.ry||0,part.rz||0);dummy.scale.set(part.w,part.h,part.d);dummy.updateMatrix();
  if(parent)matrix.multiplyMatrices(parent,dummy.matrix);else matrix.copy(dummy.matrix);
  centre.setFromMatrixPosition(matrix);
  const alias=ALIAS[part.m],m=alias?alias[0]:part.m,c=part.c===undefined&&alias?alias[1]:part.c;
  const key=Math.floor(centre.x/chunk)+','+Math.floor(centre.z/chunk)+'|'+part.g+'|'+m;let b=batches.get(key);
  if(!b){if(!G[part.g])throw new Error('Unknown geometry '+part.g);if(!M[m])throw new Error('Unknown material '+part.m);b={g:part.g,m,matrices:[],colours:[]};batches.set(key,b)}
  b.matrices.push(matrix.clone());b.colours.push(c);
 }
 function addAll(parts,parent){for(const p of parts)add(p,parent)}
 function finish(){
  const meshes=[];
  for(const b of batches.values()){
   const mesh=new THREE.InstancedMesh(G[b.g],M[b.m],b.matrices.length);
   b.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,b.colours[i]===undefined?white:colour.setHex(b.colours[i]))});
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.castShadow=!noShadow.has(b.m);mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();
   if(b.m==='puddle')mesh.renderOrder=2;mesh.userData.material=b.m;scene.add(mesh);meshes.push(mesh);
  }
  batches.clear();return meshes;
 }
 return {materials:M,geometries:G,add,addAll,finish};
}
