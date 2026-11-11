import data from './home-data.mjs';
export const SCALE=.75,FRONT_Z=-4.3,RADIUS=.095,HEIGHT=.38,STEP=.18;
export const point=(u,v,h=.45)=>({x:(3.7-u)*SCALE,z:v*SCALE+FRONT_Z,y:h*SCALE});
export const spawn=point(4.1,8.6),bed=point(4.25,8.7),food=point(5.1,6.4),water=point(5.8,6.4),radio=point(3.6,4.3),door=point(1.4,.6),window=point(7.2,8.45),visitor=point(8.15,8.45,0);
export const sourceOrigin=data.sourceOrigin,lights=data.lights,solids=data.solids;
export function inside(x,z){return x> -2.775&&x<2.775&&z>FRONT_Z&&z<4.7}
export function area(x,z){return x> -3.6&&x<3.6&&z> -5.2&&z<7.3}
const cells=new Map();
for(const s of solids){for(let x=Math.floor(s.minX-RADIUS);x<=Math.floor(s.maxX+RADIUS);x++)for(let z=Math.floor(s.minZ-RADIUS);z<=Math.floor(s.maxZ+RADIUS);z++){const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(s)}}
const at=(x,z)=>cells.get(Math.floor(x)+','+Math.floor(z))||[];
const overlaps=(s,x,z)=>x>s.minX-RADIUS&&x<s.maxX+RADIUS&&z>s.minZ-RADIUS&&z<s.maxZ+RADIUS;
export function blocks(x,z,y,stepping=true){return at(x,z).some(s=>overlaps(s,x,z)&&y+HEIGHT>s.bottom+.025&&y<s.top-(stepping?STEP:.025))}
export function ground(x,z,y){let h=0;for(const s of at(x,z))if(overlaps(s,x,z)&&s.top<=y+STEP+.001)h=Math.max(h,s.top);return h}
export function ceiling(x,z,oldY,newY){let y=newY;for(const s of at(x,z))if(overlaps(s,x,z)&&s.bottom>=oldY+HEIGHT-.03&&s.bottom<y+HEIGHT)y=s.bottom-HEIGHT;return y}
export function migrate(state){if(state.homeLayout!==2){if(!state.inDark&&state.z> -4.3&&Math.abs(state.x)<4.7){state.x=spawn.x;state.z=spawn.z;state.y=spawn.y}state.homeLayout=2}return state}
// Pick the actual horizontal surfaces crossed while falling, including table/bed tops.
export function landing(x,z,oldY,newY){let top=null;for(const s of at(x,z))if(overlaps(s,x,z)&&s.top<=oldY+.03&&s.top>=newY&&(top===null||s.top>top))top=s.top;return top}

export function windowPath(position){
 const outdoors=!inside(position.x,position.z);
 if(Math.abs(position.z-window.z)>.3||Math.abs(position.x-window.x)>1.1||(!outdoors&&position.y<.74))return null;
 const sill=point(7.2,8.45,1.65),outer=point(8.05,8.45,0),inner=point(6.7,8.45,1.14);
 const points=outdoors?[{...outer,y:sill.y},{...inner,y:sill.y},inner]:[{x:position.x,z:window.z,y:sill.y},{...outer,y:sill.y},outer];
 let previous=position;
 for(const target of points){for(let i=1;i<=30;i++){const t=i/30,p={x:previous.x+(target.x-previous.x)*t,z:previous.z+(target.z-previous.z)*t,y:previous.y+(target.y-previous.y)*t};if(blocks(p.x,p.z,p.y,false))return null}previous=target}
 return points;
}
