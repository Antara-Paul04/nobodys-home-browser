// Seeded Kolkata trees as instanced parts: a different individual for every seed, so no two repeat.
// Sizes are in metres and multiplied by `scale` (0.75 is life size next to the kitten).
import {seededRandom} from './procedural-buildings.mjs';
const LEAF={dark:0x2c4a26,mid:0x3f6a30,light:0x5c8a3a,fresh:0x74a443,blue:0x2f5a44,yellow:0x7f9440};
const SPECIES={
 banyan:{h:[4.5,6],r:.55,lean:.06,nb:[5,7],elev:[15,40],blen:[3.5,5.5],levels:2,br:[1.6,2.4],sq:.75,leaves:['dark','mid','blue'],props:true,buttress:true},
 peepal:{h:[5,7],r:.36,lean:.1,nb:[4,6],elev:[30,60],blen:[3,4.5],levels:2,br:[1.3,1.9],sq:.9,leaves:['light','fresh','mid'],bark:'barkpale',buttress:true},
 krishnachura:{h:[3.5,4.5],r:.3,lean:.08,nb:[4,6],elev:[10,30],blen:[3.5,5],levels:2,br:[1.2,1.8],sq:.5,leaves:['light','fresh'],flower:[0xd8421a,.85]},
 radhachura:{h:[4,5.5],r:.28,lean:.05,nb:[4,5],elev:[25,50],blen:[2.5,3.5],levels:2,br:[1.1,1.6],sq:.65,leaves:['mid','light'],flower:[0xe9b824,.7]},
 neem:{h:[4,5.5],r:.3,lean:.05,nb:[4,6],elev:[35,65],blen:[2,3],levels:2,br:[1,1.5],sq:.85,leaves:['dark','mid']},
 mango:{h:[2.5,3.5],r:.4,lean:.08,nb:[5,7],elev:[20,50],blen:[2.5,3.5],levels:2,br:[1.4,2],sq:.8,leaves:['dark','blue','mid'],fruit:[0x8fa63a,.07]},
 jackfruit:{h:[3,4],r:.38,lean:.05,nb:[4,6],elev:[25,55],blen:[2,3],levels:2,br:[1.2,1.7],sq:.85,leaves:['dark','mid'],trunkFruit:true},
 kadam:{h:[4,5],r:.3,lean:.04,nb:[5,6],elev:[5,25],blen:[2.5,3.5],levels:2,br:[1.1,1.5],sq:.7,leaves:['light','mid'],fruit:[0xe58a1e,.09]}
};
export function makeTree(kind,seed,x0,z0,scale=.75,base={}){
 const R=seededRandom(seed*7919+13),range=(a,b)=>a+(b-a)*R(),pick=a=>a[Math.floor(R()*a.length)],int=(a,b)=>a+Math.floor(R()*(b-a+1)),parts=[];
 const S=scale,turn=base.ry||0,ct=Math.cos(turn),st=Math.sin(turn),y0=base.y||0;
 const P=(g,m,x,y,z,w,h,d,ry=0,rx=0,c)=>parts.push({g,m,x:x0+(x*ct+z*st)*S,y:y0+y*S,z:z0+(-x*st+z*ct)*S,w:w*S,h:h*S,d:d*S,ry:ry+turn,rx,c});
 // A tapered limb between two points; radius is the mean, the geometry narrows towards the tip.
 const limb=(a,b,r,m='bark')=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||.001;P('taper',m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,len,r,Math.atan2(dx,dz),Math.acos(Math.max(-1,Math.min(1,dy/len))))};
 const blob=(c,rx,ry,colour,m='leaf')=>P('blob',m,c[0],c[1],c[2],rx*range(.85,1.15),ry*range(.85,1.15),rx*range(.85,1.15),range(0,6),range(-.2,.2),colour);
 const frond=(base,az,el,len,width,colour)=>P('frond','frond',base[0],base[1],base[2],width,len,len,az,-el,colour);
 if(SPECIES[kind]){
  const sp=SPECIES[kind],bark=sp.bark||'bark',H=range(...sp.h),r0=sp.r*range(.85,1.15),lx=range(-1,1)*sp.lean,lz=range(-1,1)*sp.lean,blobs=[];
  let prev=[0,0,0];for(let i=1;i<=4;i++){const t=i/4,p=[lx*H*t*t+range(-.08,.08),H*t,lz*H*t*t+range(-.08,.08)];limb(prev,p,r0*(1-.45*(t-.125)),bark);prev=p}
  const top=prev;
  const branch=(start,d,len,r,level)=>{
   let cur=start,dir=d;
   for(let i=0;i<3;i++){dir=[dir[0]+range(-.25,.25),dir[1]+range(-.1,.18),dir[2]+range(-.25,.25)];const l=Math.hypot(...dir);dir=dir.map(v=>v/l);const next=[cur[0]+dir[0]*len/3,cur[1]+dir[1]*len/3,cur[2]+dir[2]*len/3];limb(cur,next,r*(1-i*.18),bark);cur=next}
   if(level<sp.levels){for(let k=0;k<int(2,3);k++){const a=range(-.9,.9);branch(cur,[dir[0]*Math.cos(a)-dir[2]*Math.sin(a),dir[1]+range(.1,.5),dir[0]*Math.sin(a)+dir[2]*Math.cos(a)],len*range(.5,.7),r*.55,level+1)}if(R()<.5)blobs.push([cur,range(...sp.br)*.8])}
   else blobs.push([cur,range(...sp.br)]);
  };
  const n=int(...sp.nb),a0=range(0,6.28);
  for(let k=0;k<n;k++){const az=a0+6.283*k/n+range(-.3,.3),el=range(...sp.elev)*Math.PI/180;branch(top,[Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el)],range(...sp.blen),r0*.5,1)}
  for(const [c,r] of blobs){
   blob(c,r,r*sp.sq,LEAF[pick(sp.leaves)]);
   if(sp.flower&&R()<sp.flower[1])blob([c[0]+range(-.3,.3),c[1]+r*sp.sq*.4,c[2]+range(-.3,.3)],r*.78,r*sp.sq*.45,sp.flower[0],'flower');
   if(sp.fruit&&R()<.4)for(let k=0;k<int(3,6);k++){const a=range(0,6.28),rr=r*range(.6,1);P('blob','flower',c[0]+rr*Math.cos(a),c[1]+range(-r*.4,r*.2),c[2]+rr*Math.sin(a),sp.fruit[1],sp.fruit[1]*1.3,sp.fruit[1],0,0,sp.fruit[0])}
   // Banyan aerial roots: near the trunk they reach the ground and thicken; further out they just hang.
   if(sp.props&&c[1]>2.5){const far=Math.hypot(c[0],c[2]);
    if(far<2.4){if(R()<.7)for(let k=0;k<int(1,2);k++){const px=c[0]*.7+range(-.4,.4),pz=c[2]*.7+range(-.4,.4);limb([px+range(-.15,.15),0,pz+range(-.15,.15)],[px,c[1]-r*.3,pz],.045,bark)}}
    else for(let k=0;k<int(1,3);k++){const px=c[0]+range(-r*.5,r*.5),pz=c[2]+range(-r*.5,r*.5),top=c[1]-r*.35;limb([px+range(-.06,.06),top-range(.8,2.2),pz+range(-.06,.06)],[px,top,pz],.018,bark)}}
  }
  if(sp.buttress)for(let k=0;k<int(4,6);k++){const a=range(0,6.28),L=r0*range(1.6,2.6);limb([L*Math.cos(a),0,L*Math.sin(a)],[r0*.4*Math.cos(a),r0*1.9,r0*.4*Math.sin(a)],r0*.3,bark)}
  if(sp.trunkFruit)for(let k=0;k<int(3,6);k++){const a=range(0,6.28),y=range(.8,H*.8);P('blob','flower',r0*1.1*Math.cos(a),y,r0*1.1*Math.sin(a),.17,.28,.17,0,0,0x7f9440)}
 }else if(kind==='coconut'||kind==='supari'){
  const coco=kind==='coconut',H=coco?range(8,12):range(7,11),r=coco?.2:.085,lx=range(-1,1)*(coco?.18:.05),lz=range(-1,1)*(coco?.18:.05);
  let prev=[0,0,0];for(let i=1;i<=6;i++){const t=i/6,p=[lx*H*Math.pow(t,1.6),H*t,lz*H*Math.pow(t,1.6)];limb(prev,p,r*(1-.25*t),'palm');prev=p}
  const n=coco?int(9,13):int(6,9),a0=range(0,6.28);
  for(let k=0;k<n;k++)frond(prev,a0+6.283*k/n+range(-.2,.2),range(-.35,.7),coco?range(3.2,4.5):range(1.8,2.6),coco?.95:.6,LEAF[pick(['mid','light','yellow'])]);
  if(coco)for(let k=0;k<int(4,8);k++){const a=range(0,6.28),rr=range(.25,.5);P('blob','flower',prev[0]+rr*Math.cos(a),prev[1]-range(.2,.6),prev[2]+rr*Math.sin(a),.14,.16,.14,0,0,0x5a4a22)}
  else for(let k=0;k<int(2,3);k++){const a=range(0,6.28);for(let j=0;j<5;j++)P('blob','flower',prev[0]+.2*Math.cos(a)+range(-.08,.08),prev[1]-.3-j*.07,prev[2]+.2*Math.sin(a)+range(-.08,.08),.04,.04,.04,0,0,0xd8842a)}
 }else if(kind==='banana'){
  for(let s=0;s<int(2,4);s++){
   const ox=s?range(-.9,.9):0,oz=s?range(-.9,.9):0,H=s?range(1,2):range(2.2,3);limb([ox,0,oz],[ox,H,oz],.13*H/3+.03,'stem');
   const n=int(6,8),a0=range(0,6.28);for(let k=0;k<n;k++)frond([ox,H,oz],a0+6.283*k/n+range(-.3,.3),range(.15,1.05),range(1.6,2.4)*H/3,range(.55,.8),LEAF[pick(['fresh','light'])]);
   if(!s){const a=range(0,6.28),bx=ox+.5*Math.cos(a),bz=oz+.5*Math.sin(a);limb([ox,H-.1,oz],[bx,H-.6,bz],.03,'stem');P('blob','flower',bx,H-.95,bz,.2,.38,.2,0,0,0x6f9a3a);P('blob','flower',bx,H-1.45,bz,.09,.18,.09,0,0,0x5a1f3a)}
  }
 }else if(kind==='bamboo'){
  for(let c=0;c<int(8,13);c++){
   const a=range(0,6.28),rr=range(0,.55),bx=rr*Math.cos(a),bz=rr*Math.sin(a),H=range(6,9),lx=Math.cos(a)*range(.3,1.2),lz=Math.sin(a)*range(.3,1.2);
   let prev=[bx,0,bz];for(let i=1;i<=5;i++){const t=i/5,p=[bx+lx*t*t,H*t,bz+lz*t*t];limb(prev,p,.045*(1-.4*t),'culm');prev=p}
   for(let i=0;i<int(4,7);i++){const t=range(.5,1);blob([bx+lx*t*t+range(-.5,.5),H*t,bz+lz*t*t+range(-.5,.5)],.45,.22,LEAF[pick(['light','fresh'])])}
  }
 }else if(kind==='wallpeepal'){
  // The sapling that roots in a crack high on an old wall.
  const H=range(1.1,1.9);limb([0,0,0],[range(-.2,.2),H*.6,.25],.045,'barkpale');limb([range(-.2,.2),H*.6,.25],[range(-.3,.3),H,.4],.03,'barkpale');
  for(let k=0;k<int(3,5);k++)blob([range(-.6,.6),H*range(.6,1.1),.35+range(0,.5)],range(.35,.55),range(.3,.45),LEAF[pick(['fresh','light'])]);
  for(let k=0;k<int(3,5);k++){const x=range(-.5,.5);limb([0,0,.03],[x*.5,-range(.6,1.2),.03],.02,'barkpale');limb([x*.5,-1,.03],[x,-range(1.6,2.6),.03],.012,'barkpale')}
 }
 return parts;
}
