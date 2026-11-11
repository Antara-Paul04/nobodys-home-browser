import {proceduralBuildings,buildingSolids} from './procedural-buildings.mjs';
export {proceduralBuildings};
import * as home from './home.mjs';
import streetData from './street-data.mjs';
import houseData from './house-collisions.mjs';
export const SCALE=home.SCALE;
export const spawn={x:-3.7,z:-9.4,y:.04};
export const limits={minX:-33,maxX:33,minZ:-22,maxZ:21};
// Front edges face the street. All authored assets retain the same metre scale.
export const houses=[
 {i:4,x:-28.5,z:-16.3,angle:0},{i:5,x:-22.5,z:-15.6,angle:0},{i:1,x:-17.8,z:-16.3,angle:0},
 ...[-10.36,-5.9,-1.49,3.51,9.21,14.86].map((x,i)=>({i,x,z:-12.35,angle:0})),
 {i:1,x:23,z:-12.35,angle:0},{i:0,x:29.1,z:-12.35,angle:0},
 {i:4,x:-26,z:-7.1,angle:Math.PI},{i:5,x:-18,z:-7.1,angle:Math.PI},{i:0,x:-8.6,z:-7.1,angle:Math.PI},
 {i:0,x:8.1,z:-7.1,angle:Math.PI},{i:3,x:15.5,z:-7.1,angle:Math.PI},{i:4,x:27.3,z:-7.1,angle:Math.PI},
 ...[-10,1.5,10].flatMap((z,i)=>[{i:[4,0,5][i],x:-33,z,angle:Math.PI/2},{i:[0,5,4][i],x:33,z,angle:-Math.PI/2}])
];
export const props=[
 {name:'SweetShop',x:-29,z:-13.45,angle:0}, {name:'Grocery',x:-25.65,z:-13.45,angle:0},
 {name:'TeaShop',x:-22.1,z:-13.1,angle:0}, {name:'PaanKiosk',x:-17.6,z:-12.6,angle:0},
 {name:'Taxi',x:-8.8,z:-10.65,angle:.04}, {name:'Taxi',x:23,z:5.1,angle:Math.PI/2}
];
export const walls=[
 // Courtyard boundaries, with actual gaps on two sides.
 [-10.4,1.05,4.8,.15,2.1,6],[-6.25,1.05,4.8,.15,2.1,6],[-9.6,.65,7.7,1.6,1.3,.16],[-6.95,.65,7.7,1.4,1.3,.16],
 [6.1,.8,4.7,.16,1.6,5.5],[19.6,.8,4.7,.16,1.6,5.5],[8.4,.65,7.5,4.6,1.3,.16],[16.4,.65,7.5,6.4,1.3,.16],
 [-33.3,1.1,-.5,.3,2.2,44],[33.3,1.1,-.5,.3,2.2,44],[0,1.1,-22.3,67,2.2,.3],[0,1.1,21.3,67,2.2,.3]
];
export const trees=[[-8.2,3.8],[14.6,3.5],[21.2,10.7],[-31,8]];
export const pots=[[-6.7,6.8],[-9.7,6.5],[6.5,6.6],[18.6,6.8],[-3.1,-5.4],[3.2,-5.4],[-21,-11.5],[-20.6,-11.4],[11.3,-6.7]];
export const poles=[-30,-17,-3,11,25];
export const benches=[[-8.8,.32,5.4,1.25,.1,.35],[12,.32,5.7,1.6,.1,.4]];
export function transformSolid(s,p,scale=SCALE){
 const c=Math.cos(p.angle||0),sn=Math.sin(p.angle||0),corners=[[s.minX,s.minZ],[s.maxX,s.minZ],[s.minX,s.maxZ],[s.maxX,s.maxZ]].map(([x,z])=>[p.x+scale*(c*x+sn*z),p.z+scale*(-sn*x+c*z)]);
 return {minX:Math.min(...corners.map(a=>a[0])),maxX:Math.max(...corners.map(a=>a[0])),minZ:Math.min(...corners.map(a=>a[1])),maxZ:Math.max(...corners.map(a=>a[1])),bottom:s.bottom*scale,top:s.top*scale};
}
export function makeCollisionWorld(){
 const solids=home.solids.map(s=>({...s})),sourceHouses=Object.values(houseData);
 for(const p of houses){for(const s of sourceHouses[p.i].solids)solids.push(transformSolid(s,p));
  // These exterior-only houses have no authored playable rooms. Close their shell below roof level.
  const parts=sourceHouses[p.i].solids,lo=Math.min(...parts.map(s=>s.minX)),hi=Math.max(...parts.map(s=>s.maxX)),back=Math.min(...parts.map(s=>s.minZ));
  solids.push(transformSolid({minX:lo+.22,maxX:hi-.22,minZ:back+.1,maxZ:-1.35,bottom:0,top:2.5},p));
 }
 for(const p of proceduralBuildings)for(const s of buildingSolids(p))solids.push(transformSolid(s,p,1));
 for(const p of props)for(const s of streetData[p.name].solids)solids.push(transformSolid(s,p));
 for(const [x,y,z,w,h,d] of [...walls,...benches])solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom:y-h/2,top:y+h/2});
 // Thin pavements are stepable; their heights also support landings.
 for(const [x,z,w,d,h] of [[0,-7.45,65,.5,.075],[0,-12,65,.5,.075],[0,11.6,65,.5,.075],[-26,-12,14,1.4,.09]])solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom:0,top:h});
 for(const [x,z,r,h] of [...trees.map(([x,z])=>[x,z,.14,3.6]),...pots.map(([x,z])=>[x,z,.13,.26]),...poles.map(x=>[x,-7.65,.07,4.8]),[11,3.3,.33,.46],[11.4,3.2,.16,.36]])solids.push({minX:x-r,maxX:x+r,minZ:z-r,maxZ:z+r,bottom:0,top:h});
 for(const b of benches)for(const dx of [-.5,.5])solids.push({minX:b[0]+dx-.0325,maxX:b[0]+dx+.0325,minZ:b[2]-.12,maxZ:b[2]+.12,bottom:0,top:.3});
 const grid=new Map(),cell=1.5,r=home.RADIUS;
 for(const s of solids){for(let x=Math.floor((s.minX-r)/cell);x<=Math.floor((s.maxX+r)/cell);x++)for(let z=Math.floor((s.minZ-r)/cell);z<=Math.floor((s.maxZ+r)/cell);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s)}}
 const at=(x,z)=>grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
 const overlaps=(s,x,z)=>{const dx=Math.max(s.minX-x,0,x-s.maxX),dz=Math.max(s.minZ-z,0,z-s.maxZ);return dx*dx+dz*dz<r*r};
 return {solids,
 nearby(x,z,radius=6){const found=new Set();for(let a=Math.floor((x-radius)/cell);a<=Math.floor((x+radius)/cell);a++)for(let b=Math.floor((z-radius)/cell);b<=Math.floor((z+radius)/cell);b++)for(const s of grid.get(a+','+b)||[])found.add(s);return [...found]},
 valid(x,z,y,step=true){return x>=limits.minX&&x<=limits.maxX&&z>=limits.minZ&&z<=limits.maxZ&&!at(x,z).some(s=>overlaps(s,x,z)&&y+home.HEIGHT>s.bottom+.02&&y<s.top-(step?home.STEP:.02))},
 ground(x,z,y){let h=.025;for(const s of at(x,z))if(overlaps(s,x,z)&&s.top<=y+home.STEP+.001)h=Math.max(h,s.top);return h},
 landing(x,z,oldY,newY){let top=newY<=.025?.025:null;for(const s of at(x,z))if(overlaps(s,x,z)&&s.top<=oldY+.03&&s.top>=newY&&(top===null||s.top>top))top=s.top;return top},
 ceiling(x,z,oldY,newY){let y=newY;for(const s of at(x,z))if(overlaps(s,x,z)&&s.bottom>=oldY+home.HEIGHT-.03&&s.bottom<y+home.HEIGHT)y=s.bottom-home.HEIGHT;return y}
 };
}
export function areaName(x,z){if(home.inside(x,z))return 'Home';if(z>8)return 'The back lane';if(x< -16&&z< -7)return 'The market corner';if(x>21)return 'The eastern lane';if(z>0)return 'The courtyards';if(z> -7)return 'The side passage';return 'The old neighbourhood'}
