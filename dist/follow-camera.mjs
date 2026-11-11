// A camera boom with volume, not a single ray. User yaw is never changed by obstacles.
export function segmentBox(from,to,box,radius=0){
 let lo=0,hi=1;
 for(const [axis,min,max] of [['x','minX','maxX'],['y','bottom','top'],['z','minZ','maxZ']]){
  const a=from[axis],d=to[axis]-a,mn=box[min]-radius,mx=box[max]+radius;
  if(Math.abs(d)<1e-9){if(a<mn||a>mx)return null;continue}
  let t1=(mn-a)/d,t2=(mx-a)/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return null;
 }
 return lo;
}
export function makeFollowCamera(){
 let length=0,elevation=.3,initialized=false;
 return {reset(){initialized=false},solve({target,yaw,pitch,distance,solids,dt=1/24}){
  const radius=.065;
  const position=(angle,d)=>({x:target.x+Math.sin(yaw)*Math.cos(angle)*d,y:target.y+Math.sin(angle)*d,z:target.z+Math.cos(yaw)*Math.cos(angle)*d});
  function clearance(angle){const end=position(angle,distance);let d=distance;for(const s of solids){if(s.maxX-s.minX<.2&&s.maxZ-s.minZ<.2)continue;const t=segmentBox(target,end,s,radius);if(t!==null)d=Math.min(d,Math.max(0,t*distance-.025))}return d}
  let angle=pitch,available=clearance(angle);
  // Elevate only when necessary; never swing horizontally or reverse the controls.
  if(available<.8){let best=available;for(const p of [.65,1.0,1.3,1.5,1.555]){if(p<pitch)continue;const d=clearance(p);if(d>best+.1){best=d;angle=p;available=d}if(d>=1.1)break}}
  if(!initialized){length=available;elevation=angle;initialized=true}
  // Enter tight spaces immediately; ease out so doorposts don't make the view pump.
  elevation=angle>elevation?angle:elevation+(angle-elevation)*(1-Math.exp(-dt*3));
  available=clearance(elevation);length=available<length?available:length+(available-length)*(1-Math.exp(-dt*3));
  const confined=length<.48;const shownDistance=confined?.85:Math.max(.1,length);
  return {position:position(elevation,shownDistance),target:{...target},distance:shownDistance,confined,elevation,yaw};
 }};
}
