// Everything a Kolkata lane collects: drains, garbage, cycles, drums, washing, wires, shrines.
// Pure data, fixed seed. Returns instanced parts, ground/wall decals, wires and the boxes worth bumping into.
import {seededRandom,CLOTH} from './procedural-buildings.mjs';
import {makeTree} from './trees.mjs';
const PLASTIC=[0xe6e6e0,0x3a6fb0,0xd98aa0,0x202022,0xd9b030,0x4f8a5b,0xc84a3a];
export function makeClutter({lanes,buildings,houses,poles,trees,benches,pond,hit}){
 const R=seededRandom(90210),range=(a,b)=>a+(b-a)*R(),pick=a=>a[Math.floor(R()*a.length)],chance=p=>R()<p,int=(a,b)=>a+Math.floor(R()*(b-a+1));
 const parts=[],decals=[],solids=[],wires=[];
 const P=(g,m,x,y,z,w,h,d,ry=0,rx=0,c)=>parts.push({g,m,x,y,z,w,h,d,ry,rx,c});
 const tube=(a,b,r,m='iron',c)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||.001;P('cyl',m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,len,r,Math.atan2(dx,dz),Math.acos(Math.max(-1,Math.min(1,dy/len))),c)};
 const solid=(x,z,w,d,top,bottom=0)=>solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom,top});
 const G=(id,x,z,w,h,rot=0,v=0,y=0)=>decals.push({id,ground:true,x,z,w,h,rot,v,y});          // ground decal
 const Wd=(id,x,y,z,ry,w,h,v=0,extra={})=>decals.push({id,x,y,z,ry,w,h,v,...extra});          // wall decal
 const inLane=(x,z)=>lanes.some(l=>x>=l.x0&&x<=l.x1&&z>=l.z0&&z<=l.z1);

 // ------------------------------------------------------------ things
 function cycle(x,z,heading,lean=.16,colour=pick([0x1f1f22,0x2f4f7a,0x7a2f2a,0x2f6a4a])){
  const ca=Math.cos(heading),sa=Math.sin(heading),cl=Math.cos(lean),sl=Math.sin(lean);
  const L=(lx,ly,lz)=>{const y=ly*cl-lz*sl,zz=ly*sl+lz*cl;return [x+lx*ca+zz*sa,y,z-lx*sa+zz*ca]};
  for(const wx of [-.36,.36]){const p=L(wx,.245,0);P('torus','tyre',p[0],p[1],p[2],.245,.245,.245,heading,lean)}
  const T=(a,b,r=.012)=>tube(L(...a),L(...b),r,'paint',colour);
  T([-.12,.25,0],[-.2,.62,0]);T([-.2,.6,0],[.2,.62,0]);T([.22,.6,0],[-.12,.25,0]);T([.2,.7,0],[.36,.245,0]);T([-.12,.25,0],[-.36,.245,0],.009);T([-.2,.6,0],[-.36,.245,0],.009);
  tube(L(.2,.71,-.17),L(.2,.71,.17),.01,'iron');const s=L(-.22,.66,0);P('box','dark',s[0],s[1],s[2],.2,.04,.09,heading,lean);
  const c=L(-.38,.53,0);P('box','iron',c[0],c[1],c[2],.24,.012,.1,heading,lean);
  if(chance(.4)){const b=L(-.38,.6,0);P('box','goods',b[0],b[1],b[2],.2,.12,.14,heading,lean,pick([0xb9a27a,0x8f7a5a,0x3a6fb0]))}
  solid(x,z,Math.abs(ca)*.95+Math.abs(sa)*.22+.05,Math.abs(sa)*.95+Math.abs(ca)*.22+.05,.7);
 }
 function drum(x,z,colour=pick([0x2f62a8,0x2f62a8,0x7a4a36,0x3f7a56]),r=.19,h=.55){P('cyl','paint',x,h/2,z,r,h,r,0,0,colour);P('cyl','paint',x,h+.012,z,r+.012,.025,r+.012,0,0,colour);solid(x,z,r*1.8,r*1.8,h+.02)}
 function bucket(x,z,colour=pick(PLASTIC)){P('cyl','paint',x,.075,z,.085,.15,.085,0,0,colour)}
 function kolshi(x,z,brass=chance(.3)){P('blob',brass?'brass':'earthen',x,.13,z,.13,.13,.13);P('cyl',brass?'brass':'earthen',x,.27,z,.06,.05,.06)}
 function crates(x,z,ry,n=int(1,3)){for(let i=0;i<n;i++)P('box',chance(.5)?'wood':'paint',x+range(-.03,.03),.11+i*.22,z+range(-.03,.03),.36,.21,.27,ry+range(-.15,.15),0,chance(.5)?0x7a6548:pick(PLASTIC));solid(x,z,.4,.4,n*.22)}
 function sacks(x,z,n=int(2,4)){for(let i=0;i<n;i++)P('blob','jute',x+range(-.18,.18),.1+(i>1?.16:0),z+range(-.14,.14),.2,.11,.14,range(0,3));solid(x,z,.55,.45,.25)}
 function gas(x,z){P('cyl','paint',x,.19,z,.085,.38,.085,0,0,0xa8281f);P('cyl','iron',x,.41,z,.035,.06,.035)}
 function chair(x,z,ry,colour=pick([0xe6e6e0,0xa8281f,0x2f6a4a,0x3a6fb0])){
  const c=Math.cos(ry),s=Math.sin(ry),L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  P('box','paint',x,.3,z,.3,.025,.3,ry,0,colour);const b=L(0,-.14);P('box','paint',b[0],.47,b[1],.3,.32,.025,ry,0,colour);
  for(const [lx,lz] of [[-.13,-.13],[.13,-.13],[-.13,.13],[.13,.13]]){const p=L(lx,lz);P('box','paint',p[0],.15,p[1],.025,.3,.025,ry,0,colour)}
  solid(x,z,.34,.34,.32);
 }
 function pot(x,z,y=0,big=chance(.4)){const r=big?.11:.075;P('cyl','earthen',x,y+r*.9,z,r,r*1.8,r);const n=int(2,4);for(let i=0;i<n;i++)P('blob','leaf',x+range(-.06,.06),y+r*1.8+range(.05,.22),z+range(-.06,.06),range(.07,.14),range(.08,.16),range(.07,.14),range(0,6),0,pick([0x3f6a30,0x5c8a3a,0x2c4a26,0x74a443]))}
 function tulsi(x,z){P('box','limewash',x,.14,z,.3,.28,.3);P('box','limewash',x,.33,z,.22,.1,.22);P('box','oxide',x,.02,z,.4,.04,.4);pot(x,z,.38,false);solid(x,z,.32,.32,.4)}
 function heap(x,z,r,rich=true){
  P('blob','garbage',x,.03,z,r,r*.3,r*.82,range(0,3));
  for(let i=0;i<Math.round(r*26);i++){const a=range(0,6.28),d=r*Math.sqrt(R())*.92,y=r*.3*(1-(d/r)*(d/r))+.02;
   if(chance(.2))P('blob','paint',x+Math.cos(a)*d,y,z+Math.sin(a)*d*.82,.06,.045,.06,0,0,0x6f8f3f);      // tender-coconut shells
   else P('box','paint',x+Math.cos(a)*d,y,z+Math.sin(a)*d*.82,range(.05,.14),range(.012,.05),range(.05,.12),range(0,3),range(-.3,.3),pick(PLASTIC))}
  G('litter',x,z,r*3.4,r*3,range(0,3),int(0,2));G('wet',x+range(-.2,.2),z+range(-.2,.2),r*2.6,r*2.2,range(0,3),0,.0005);
  if(rich)for(let i=0;i<int(1,2);i++)crow(x+range(-r,r),r*.28,z+range(-r,r)*.8,range(0,6));
  solid(x,z,r*1.3,r*1.1,r*.22);
 }
 function crow(x,y,z,ry){P('blob','crow',x,y+.07,z,.05,.045,.09,ry);const c=Math.cos(ry),s=Math.sin(ry);P('blob','crow',x+s*.075,y+.115,z+c*.075,.032,.032,.036,ry);P('box','crowbeak',x+s*.115,y+.112,z+c*.115,.012,.012,.04,ry);P('box','crow',x-s*.1,y+.06,z-c*.1,.035,.012,.09,ry,-.25)}
 function bricks(x,z,ry){P('box','brick',x,.14,z,.62,.28,.3,ry);P('box','brick',x+.06,.33,z,.4,.1,.3,ry+.05);solid(x,z,.66,.4,.3)}
 function sand(x,z,r=.5,stone=false){P('cone',stone?'chips':'sand',x,r*.28,z,r,r*.56,r);G('sandspill',x,z,r*3,r*3,range(0,3));solid(x,z,r*1.1,r*1.1,r*.3)}
 function bamboos(x,z,dx,dz,n=4){for(let i=0;i<n;i++)tube([x+i*.07*Math.abs(dz)+range(-.05,.05),0,z+i*.07*Math.abs(dx)+range(-.05,.05)],[x+dx*.7+i*.07*Math.abs(dz),range(2.6,3.4),z+dz*.7+i*.07*Math.abs(dx)],.022,'bamboo')}
 function tyres(x,z,n=3){for(let i=0;i<n;i++)P('torus','tyre',x+range(-.02,.02),.05+i*.09,z+range(-.02,.02),.2,.2,.2,0,Math.PI/2);solid(x,z,.45,.45,n*.09)}
 function cart(x,z,ry){const c=Math.cos(ry),s=Math.sin(ry),L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  P('box','wood',x,.42,z,1.3,.05,.7,ry,0,0x6a5238);for(const lz of [-.39,.39]){const p=L(0,lz);P('torus','tyre',p[0],.3,p[1],.3,.3,.3,ry)}
  const a=L(.65,.3),b=L(1.25,.3),a2=L(.65,-.3),b2=L(1.25,-.3);tube([a[0],.44,a[1]],[b[0],.5,b[1]],.02,'wood');tube([a2[0],.44,a2[1]],[b2[0],.5,b2[1]],.02,'wood');
  for(let i=0;i<4;i++){const p=L(-.35+i*.22,range(-.15,.15));P('blob','jute',p[0],.56+(i%2)*.12,p[1],.2,.11,.15,ry+range(-.3,.3))}
  solid(x,z,Math.abs(c)*1.3+Math.abs(s)*.8,Math.abs(s)*1.3+Math.abs(c)*.8,.6,.3);
 }
 function tap(x,z){P('cyl','iron',x,.25,z,.03,.5,.03);P('box','iron',x,.46,z+.07,.03,.03,.14);G('wet',x,z+.2,1.3,1,range(0,3));G('puddle',x+.1,z+.3,.9,.6,range(0,3),0,.001)}
 function shrine(x,z){ // red-oxide platform round the banyan, a small temple and offerings
  P('box','oxide',x,.15,z,1.4,.3,1.4);P('box','limewash',x,.31,z,1.46,.03,1.46);
  P('box','oxide',x+.42,.62,z-.38,.42,.62,.36);P('cone4','oxide',x+.42,1.06,z-.38,.3,.28,.3,Math.PI/4);P('box','dark',x+.42,.6,z-.19,.22,.3,.02);P('blob','brass',x+.42,.53,z-.18,.04,.06,.04);
  P('cyl','cloth',x-.07,.75,z+.07,.335,.22,.335,0,0,0xb23a3a);P('cyl','cloth',x-.07,.9,z+.07,.34,.05,.34,0,0,0xe08a1e);
  tube([x-.45,.3,z+.45],[x-.45,1.1,z+.45],.012,'iron');P('box','iron',x-.45,1.08,z+.45,.16,.012,.012);for(const o of [-.08,0,.08])P('box','iron',x-.45+o,1.14,z+.45,.012,.12,.012);
  for(let i=0;i<8;i++)P('blob','paint',x+range(-.5,.5),.34,z+range(.1,.6),.03,.02,.03,0,0,pick([0xe08a1e,0xe9b824,0xb23a3a]));
  G('petals',x,z+.9,1.6,1,0);
 }
 function pole(x,z,light=true,dir=1){
  P('cyl','concrete',x,2.5,z,.065,5,.065);P('box','iron',x,4.55,z,.9,.045,.06,chance(.5)?0:Math.PI/2);P('box','meter',x,2.6,z+.09*dir,.2,.28,.1);
  for(let i=0;i<int(1,3);i++)P('torus','cable',x+range(-.05,.05),range(3.4,4.2),z+.08*dir,range(.13,.2),range(.13,.2),range(.13,.2),range(0,3),range(-.4,.4));
  if(light){tube([x,4.2,z],[x,4.35,z+.7*dir],.018,'iron');P('box','glow',x,4.33,z+.75*dir,.07,.05,.5);P('box','iron',x,4.37,z+.75*dir,.1,.02,.56)}
  Wd('polenum',x,1.3,z+.068*dir,dir>0?0:Math.PI,.12,.3,int(0,3));
 }
 const wire=(a,b,sag=.35,r=.008)=>{const n=7,pts=[];for(let i=0;i<=n;i++){const t=i/n;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b[2]-a[2])*t])}wires.push({pts,r})};
 function washing(a,b,sag=.2){ // a line strung across the lane with the day's clothes on it
  wire(a,b,sag,.006);const len=Math.hypot(b[0]-a[0],b[2]-a[2]),ry=Math.atan2(-(b[2]-a[2]),b[0]-a[0]);let t=.12;
  while(t<.88){const cw=range(.22,.5),ch=range(.35,chance(.25)?1.5:.75),x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=a[1]+(b[1]-a[1])*t-sag*4*t*(1-t);
   if(chance(.8))P('box','cloth',x,y-ch/2,z,cw,ch,.012,ry,range(-.05,.05),pick(CLOTH));t+=(cw+range(.04,.2))/len}
 }
 function bunting(a,b){wire(a,b,.3,.004);const n=Math.round(Math.hypot(b[0]-a[0],b[2]-a[2])/.22),ry=Math.atan2(-(b[2]-a[2]),b[0]-a[0]);
  for(let i=1;i<n;i++){const t=i/n;P('box','cloth',a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-.3*4*t*(1-t)-.07,a[2]+(b[2]-a[2])*t,.11,.14,.006,ry,0,pick([0xd4572f,0xe9b824,0x2f6a4a,0xb23a3a,0xe6e6e0,0x2f5f8a]))}}
 // An open drain along a wall, bridged by cement slabs wherever someone needed to step across.
 function drain(x0,z0,x1,z1,width=.15,cover=.5){
  const alongX=Math.abs(x1-x0)>Math.abs(z1-z0),len=alongX?x1-x0:z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  P('box','drain',cx,.0275,cz,alongX?len:width,.006,alongX?width:len);
  for(const o of [-1,1])P('box','kerb',cx+(alongX?0:o*(width/2+.02)),.03,cz+(alongX?o*(width/2+.02):0),alongX?len:.04,.014,alongX?.04:len);
  for(let t=.3;t<len-.3;t+=range(.34,.5)){if(!chance(cover))continue;const l=range(.26,.36);P('box','slab',alongX?x0+t:cx+range(-.01,.01),.043,alongX?cz+range(-.01,.01):z0+t,alongX?l:width+.12,.03,alongX?width+.12:l,range(-.04,.04))}
  for(let t=1;t<len;t+=range(1.5,3.5))G('wet',alongX?x0+t:cx,alongX?cz:z0+t,range(.5,1),range(.4,.7),range(0,3),0,.0004);
 }

 // ------------------------------------------------------------ drains and the grime where walls meet the ground
 drain(-33.6,-12.08,25.6,-12.08,.15,.55);drain(-19.9,-6.19,13.7,-6.19,.13,.45);drain(-26.8,8.12,25.6,8.12,.14,.4);
 drain(-21.39,-20.5,-21.39,-13.2,.12,.3);drain(-21.36,-6.2,-21.36,7.8,.12,.3);drain(-4.33,-4.1,-4.33,7.9,.12,.35);drain(-7.6,-9.5,-7.6,-6.4,.1,.3);
 drain(8.6,-9.5,8.6,-6.4,.1,.3);drain(13.78,-4.2,13.78,7.9,.12,.3);drain(20.68,-20.5,20.68,-13.2,.12,.3);drain(-33.6,-20.85,25.6,-20.85,.22,.12);
 drain(-19.9,1.85,-4.6,1.85,.26,.08);drain(3.5,2.15,12.5,2.15,.2,.1);drain(3.16,-4.1,3.16,7.9,.1,.15);
 for(const l of lanes){
  // Walk each edge; wherever the far side is not another lane there is a wall, and dirt gathers against it.
  const edges=l.id==='road'||l.id==='footpath'?[]:[[l.x0,l.z0,l.x1,l.z0,0,-1],[l.x0,l.z1,l.x1,l.z1,0,1],[l.x0,l.z0,l.x0,l.z1,-1,0],[l.x1,l.z0,l.x1,l.z1,1,0]];
  for(const [ax,az,bx,bz,nx,nz] of edges){const len=Math.hypot(bx-ax,bz-az),step=1.6;
   for(let t=0;t<len;t+=step){const s=Math.min(step,len-t),mx=ax+(bx-ax)*(t+s/2)/len,mz=az+(bz-az)*(t+s/2)/len;
    if(inLane(mx+nx*.3,mz+nz*.3))continue;
    G('edge',mx-nx*.3,mz-nz*.3,s+.1,.62,nx?(nx>0?-Math.PI/2:Math.PI/2):(nz>0?Math.PI:0),int(0,3),.0002);
    if(chance(.5))G('litter',mx-nx*range(.15,.4),mz-nz*range(.15,.4),range(.6,1.3),range(.4,.8),range(0,3),int(0,2),.0006);
    if(chance(.22))G('moss',mx-nx*.18,mz-nz*.18,range(.7,1.3),range(.3,.5),nx?(nx>0?-Math.PI/2:Math.PI/2):(nz>0?Math.PI:0),int(0,2),.0004);
    if(chance(.12))G('leaves',mx-nx*range(.3,.6),mz-nz*range(.3,.6),range(.8,1.4),range(.6,1),range(0,3),0,.0007);
   }
  }
  // Worn patches, cracks and the odd pothole, scaled to the lane.
  const area=(l.x1-l.x0)*(l.z1-l.z0),n=Math.round(area/(l.kind==='asphalt'?6:l.kind==='tarmac'?26:l.kind==='paver'?14:10));
  for(let i=0;i<n;i++){const x=range(l.x0+.3,l.x1-.3),z=range(l.z0+.3,l.z1-.3),k=R();
   if(l.kind==='asphalt'){if(k<.2)G('patch',x,z,range(.8,1.8),range(.6,1.3),range(0,3),int(0,3));else if(k<.42){G('pothole',x,z,range(.45,.9),range(.35,.7),range(0,3),int(0,2));if(chance(.5))G('puddle',x,z,.42,.3,range(0,3),0,.001)}else if(k<.85)G('wet',x,z,range(.8,1.6),range(.6,1.2),range(0,3));else G('litter',x,z,range(.6,1.2),range(.5,.9),range(0,3),int(0,2))}
   else if(l.kind==='earth'){if(k<.5)G('weeds',x,z,range(.5,1.1),range(.4,.9),range(0,3),int(0,2));else if(k<.75)G('litter',x,z,range(.6,1.3),range(.5,1),range(0,3),int(0,2));else G('wet',x,z,range(.8,1.5),range(.6,1.1),range(0,3))}
   else{const xx=l.id==='road'?range(27.5,33.5):l.id==='footpath'?range(25.9,27.2):x,zz=l.id==='road'||l.id==='footpath'?range(-24,12):z;if(xx!==x){if(k<.6)G('patch',xx,zz,range(.8,1.6),range(.6,1.2),range(0,3),int(0,3));else if(k<.8)G('wet',xx,zz,range(.8,1.6),range(.6,1.2),range(0,3));else G('litter',xx,zz,range(.5,1),range(.4,.8),range(0,3),int(0,2))}
   else if(k<.45)G('patch',x,z,range(.6,1.3),range(.5,1),range(0,3),int(0,3));else if(k<.8)G('wet',x,z,range(.6,1.3),range(.5,1),range(0,3));else G('moss',x,z,range(.5,1),range(.4,.8),range(0,3),int(0,2),.0003)}
  }
 }
 for(const [x,z] of [[-28,-11.2],[-9.2,-11.3],[11.5,-11.1],[-21,-9],[2.5,9],[-16,9.1],[19,9]])G('manhole',x,z,.5,.5,range(0,3));

 // ------------------------------------------------------------ Kali Mitra Lane
 poles.forEach(([x,z],i)=>pole(x,z,true,z< -12||z>9.4||(z> -6.3&&z< -6)?1:-1));
 heap(-33.05,-11.4,.62);Wd('walltext',-33.93,1.5,-11.4,Math.PI/2,1.5,.34,2);
 cycle(-8.95,-10.2,0,-.14);cycle(11.6,-10.25,.08,-.15);cycle(13.3,-12.3,Math.PI,-.15);cycle(-27.9,-10.05,.05,-.14);
 sacks(-17.2,-10.05);P('cone','coal',-18.05,.12,-10.02,.3,.24,.28);G('coalspill',-17.7,-10.25,1.8,1);solid(-18.05,-10.02,.5,.45,.2);
 crates(.95,-10.02,.1);crates(4.05,-10,.05,2);drum(15.95,-12.55);drum(16.42,-12.6,0x7a4a36);gas(12.05,-12.62);gas(12.25,-12.6);
 crates(21.2,-12.62,0,2);sacks(22.3,-12.6);chair(22.7,-10.1,2.6);chair(24.5,-10.05,-2.2);
 bunting([-6.2,3.5,-12.9],[-4.4,3.3,-9.7]);bunting([8.6,3.4,-12.9],[10.4,3.6,-9.7]);bunting([-23.4,3.6,-12.9],[-22.2,3.2,-6.5]);
 washing([-15.6,3.1,-12.95],[-15.2,2.9,-9.65],.25);washing([17.2,2.8,-12.95],[17.6,3,-9.65],.2);
 G('oil',-13.4,-10.75,2.6,1.2,.03);G('hopscotch',6.2,-5.45,1.7,.62,0);G('alpona',5.45,-4.72,.9,.9,0);G('chalk',-12.4,-5.3,1.1,.8,.3);
 // ------------------------------------------------------------ the chowk: banyan shrine, tea stall litter, cycle van
 shrine(-25.35,-8.35);for(let i=0;i<14;i++)P('cyl','earthen',-22.2+range(-.5,.5),.045,-8.75+range(-.3,.3),.022,.04,.022,0,range(-1.5,1.5));G('bhar',-22.3,-8.8,1.1,.7);
 cycle(-20.75,-7.0,Math.PI/2+.1,-.15);drum(-25.9,-6.75);bucket(-25.5,-6.7);kolshi(-25.15,-6.72);
 // ------------------------------------------------------------ the home gali
 cycle(-11.3,-5.98,0,.15);cycle(9.2,-5.95,Math.PI,-.15);bucket(-15.3,-6.0);kolshi(-15.0,-6.02);bucket(1.9,-6.02);tulsi(-6.9,-4.75);chair(10.6,-4.72,.4);
 pot(-13.7,-4.62);pot(-13.35,-4.6);pot(6.6,-4.6);pot(11.9,-4.62,0,true);heap(13.45,-5.9,.36,false);gas(-17.8,-6.08);
 washing([-14.2,2.9,-6.25],[-14,3.1,-4.35],.12);washing([6.6,3.3,-6.25],[6.9,3,-4.35],.12);washing([-7.3,2.7,-6.25],[-7.1,2.9,-4.35],.1);washing([11,2.6,-6.25],[11.2,2.9,-4.35],.1);
 Wd('wicket',-2.9,.32,-6.285,0,.3,.6,0);P('box','brick',-2.9,.06,-5.95,.17,.12,.08,.2);
 // ------------------------------------------------------------ the window alley and the gaps
 pot(-4.25,-1.2);pot(-4.28,4.6,0,true);bucket(-4.2,6.9);washing([-4.4,3,.8],[-2.82,3.2,.9],.08);heap(-4.1,7.55,.3,false);
 heap(1.7,7.45,.55);for(const [x,z,w,d] of [[1.7,7.02,1.5,.1],[.98,7.45,.1,.9],[2.42,7.45,.1,.9]]){P('box','cement',x,.28,z,w,.56,d);solid(x,z,w,d,.56)}
 Wd('walltext',1.7,1.25,6.94,Math.PI,1.5,.34,3);bricks(-2.1,7.5,.2);
 // ------------------------------------------------------------ the back lane
 cycle(-24.4,8.7,.1,-.15);cycle(-23.2,8.62,-.2,.5);tyres(-25.6,8.45,4);tyres(-25.1,8.4,2);drum(-22.1,8.42,0x7a4a36);
 sand(-10.7,8.6,.5);bricks(-9.35,8.42,0);bricks(-8.65,8.4,.1);bamboos(-11.6,8.1,0,-.5,5);sand(-12,9.6,.4,true);
 cycle(5.6,9.85,Math.PI,.15);crates(7.4,8.4,0);pot(15.4,8.3);pot(15.75,8.32,0,true);tulsi(19.2,8.42);chair(1.9,9.6,3.3);drum(22.9,8.45);
 washing([-17.5,3,8.05],[-17.2,3.2,10.05],.12);washing([9.4,2.8,8.05],[9.7,3.1,10.05],.12);washing([17.8,3.2,8.05],[18,2.9,10.05],.1);bunting([-6,3.4,8.05],[-5,3.2,10.05]);
 heap(-26.4,9.6,.45);
 // ------------------------------------------------------------ tube-well gali, the plot and the pond
 pot(-20.3,-3.4);pot(-20.28,5.6,0,true);pot(-20.3,-17.2);bucket(-20.32,-15.2);cycle(-20.42,-18.4,Math.PI/2,.15);
 bucket(-22.2,1.5);bucket(-22.55,1.75,0xd9b030);kolshi(-22.9,1.55);kolshi(-23.2,1.2,true);drum(-23.4,.4);G('wet',-22.5,.9,2.4,2,0);G('puddle',-22.3,1.25,1,.7,.4,0,.001);
 heap(-23.4,-3.7,1);heap(-25.2,-4.35,.6,false);Wd('walltext',-24.2,1.3,-2.14,0,1.5,.34,3);
 for(let i=0;i<3;i++){P('box','ghat',pond.x+pond.rx-.25+i*.28,-.05-i*.0+.03-i*.045,pond.z,.3,.12,1.6);}
 bricks(-31.8,-4.2,.4);bamboos(-33.4,2.2,.4,0,3);cart(-27.2,4.4,.3);
 for(let i=0;i<26;i++){const a=range(0,6.28),r=range(1.02,1.25);G('weeds',pond.x+Math.cos(a)*pond.rx*r,pond.z+Math.sin(a)*pond.rz*r,range(.6,1.2),range(.5,.9),range(0,3),int(0,2),.0004)}
 // ------------------------------------------------------------ behind the houses
 heap(-30.2,-21.5,.55);heap(-3.2,-21.6,.5);heap(12.4,-21.5,.6);bamboos(-14.5,-22.3,0,.5,4);cart(14.8,-21.4,.2);drum(5.2,-21.9,0x7a4a36);tyres(-18.6,-21.9,3);
 bricks(-26.2,-21.9,0);sand(1.2,-21.8,.45,true);washing([-12.9,2.4,-20.6],[-9.4,2.5,-20.55],.2);washing([3.8,2.3,-20.6],[1,2.5,-20.55],.15);
 cart(20.05,-16.6,Math.PI/2);sacks(19.6,-18.4);drum(20.5,-14.4);pot(19.45,-15.2);
 for(const x of [-28,-19,-10,-1,8,17])Wd(chance(.5)?'vote':'walltext',x+range(-1,1),1.25,-22.39,0,2.2,chance(.5)?.9:.4,int(0,5));
 // ------------------------------------------------------------ the courtyard
 tulsi(15.1,-2.6);bucket(17.2,-.9);bucket(17.5,-.55,0xc84a3a);kolshi(17.1,.3);drum(16,-1.3);G('wet',16.9,-.4,2.2,1.8,0);G('puddle',17.2,-.1,.9,.6,.2,0,.001);
 chair(19.2,1.9,-.6);chair(18.1,2.2,.5);cycle(20.9,.6,Math.PI/2,.15);pot(14.3,2.5);pot(14.6,2.55,0,true);pot(20.95,-3.1);
 washing([14.2,2.4,-3.3],[21.2,2.5,-2.2],.3);washing([14.2,2.3,2.6],[21.2,2.6,1.6],.3);
 G('alpona',20.75,-.6,1,1,0);
 // ------------------------------------------------------------ narrow galis
 pot(-7.55,-8.1);bucket(-6.65,-7);pot(9.45,-8.6);pot(12.9,-1.2);pot(12.85,5.8,0,true);cycle(13.6,6.5,Math.PI/2,-.15);bucket(12.9,2.9);
 washing([-7.65,2.6,-8.2],[-6.55,2.7,-8],.06);washing([8.55,2.9,-8],[9.55,2.8,-7.7],.06);washing([12.75,3,-1.5],[13.85,3.1,-1.2],.06);washing([12.75,2.7,5],[13.85,2.6,5.3],.06);
 // ------------------------------------------------------------ benches, trees, wall saplings
 for(const [x,y,z,w,h,d] of benches){P('box','wood',x,y,z,w,h,d,0,0,0x6a5238);for(const dx of [-.5,.5])P('box','brick',x+dx,.14,z,.12,.28,.24)}
 for(const [kind,x,z,seed,scale] of trees)parts.push(...makeTree(kind,seed,x,z,scale));
 for(const [x,y,z,ry,seed] of [[-13.05,3.4,-7.5,-Math.PI/2,7],[4.05,4.2,-15.5,-Math.PI/2,8],[-21.5,2.6,-4.4,Math.PI/2,9],[2.77,3.2,2.2,Math.PI/2,10],[-12.6,3.6,5.2,Math.PI/2,11],[20.8,4.4,-16,-Math.PI/2,12]])
  parts.push(...makeTree('wallpeepal',seed,x,z,.55,{y,ry}));
 for(const t of trees)if(['banyan','peepal','neem','krishnachura','mango','radhachura','kadam','jackfruit'].includes(t[0]))G('leaves',t[1],t[2],4.5*t[4]/.6,4.2*t[4]/.6,range(0,3),0,.0008);

 // ------------------------------------------------------------ wires: the black tangle overhead
 const runs=[[0,1,2,3,4,5,6],[7,8],[9,10,11,12]];
 for(const run of runs)for(let i=0;i<run.length-1;i++){const a=poles[run[i]],b=poles[run[i+1]];for(let k=0;k<4;k++)wire([a[0],4.35+k*.11,a[1]+k*.03],[b[0],4.35+k*.11,b[1]+k*.03],range(.3,.7),k?.007:.012)}
 for(const b of buildings){if(b.scenery||b.style==='tin')continue;
  // A service drop from the nearest pole to each house, then loose loops along the front.
  let best=null,bd=1e9;for(const p of poles){const d=Math.hypot(p[0]-b.x,p[1]-b.z);if(d<bd){bd=d;best=p}}
  const c=Math.cos(b.angle),s=Math.sin(b.angle),front=(u,out)=>[b.x+c*u+s*out,b.z-s*u+c*out];
  if(best&&bd<11){const [fx,fz]=front(range(-b.width/3,b.width/3),.06);wire([best[0],4.3,best[1]],[fx,Math.min(b.height-.3,range(2.6,3.8)),fz],range(.2,.5),.007);if(chance(.5)){const [gx,gz]=front(range(-b.width/3,b.width/3),.06);wire([best[0],4.1,best[1]],[gx,Math.min(b.height-.3,range(2.3,3.2)),gz],range(.2,.5),.006)}}
  if(chance(.7)){const y=Math.min(b.height-.4,range(2.4,3.4)),[ax,az]=front(-b.width/2+.1,.07),[bx,bz]=front(b.width/2-.1,.07);wire([ax,y,az],[bx,y+range(-.2,.2),bz],range(.08,.2),.006)}
 }
 // ------------------------------------------------------------ things the houses asked for: plants on ledges, buckets, crows
 for(const b of buildings){const c=Math.cos(b.angle),s=Math.sin(b.angle);
  for(const h of b.hooks){const x=b.x+c*h.x+s*h.z,z=b.z-s*h.x+c*h.z;
   if(h.kind==='plant')pot(x,z,h.y);else if(h.kind==='bucket'){P('cyl','paint',x,h.y+.075,z,.085,.15,.085,0,0,pick(PLASTIC))}else if(h.kind==='crow'&&chance(.6))crow(x,h.y,z,range(0,6));
  }
 }
 return {parts,decals,solids,wires};
}
