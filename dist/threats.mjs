// Lightweight threat behaviour; no rendering or browser APIs.
export const STREET_BLOCKERS=[
 {minX:3.3,maxX:4.3,minZ:-5.85,maxZ:-5.0},
 {minX:4.5,maxX:5.5,minZ:-7.7,maxZ:-6.7},
 {minX:9.75,maxX:12,minZ:-12.95,maxZ:-11.8},
 {minX:-18.5,maxX:18.5,minZ:-20,maxZ:-12.28}
];
export function blockedPoint(x,z){return z> -4.35||STREET_BLOCKERS.some(r=>x>r.minX&&x<r.maxX&&z>r.minZ&&z<r.maxZ)}
// A small number of static rectangles: sampling keeps the cost bounded.
export function lineClear(a,b){const distance=Math.hypot(b.x-a.x,b.z-a.z);const count=Math.max(1,Math.ceil(distance/.25));for(let i=1;i<count;i++){const t=i/count;if(blockedPoint(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false}return true}
export function makeThreat(kind,position){return {kind,position,home:{x:position.x,z:position.z},mode:kind==='dog'?'patrol':'idle',timer:0,lastNoise:0,patrol:0,lastKnown:null,cooldown:0}}
function moveToward(agent,target,speed,dt){const p=agent.position,dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);if(d<.03)return d;const step=Math.min(d,speed*dt);const nx=p.x+dx/d*step,nz=p.z+dz/d*step;if(!blockedPoint(nx,p.z))p.x=nx;if(!blockedPoint(p.x,nz))p.z=nz;return d}
export function stepThreat(agent,dt,player,noise){
 const p=agent.position;agent.timer+=dt;agent.cooldown=Math.max(0,agent.cooldown-dt);
 const dx=player.x-p.x,dz=player.z-p.z,distance=Math.hypot(dx,dz);
 const elevated=player.y>(agent.kind==='dog'?.75:.6);
 const canSee=player.outside&&!player.hidden&&!elevated&&distance<(agent.kind==='dog'?3.3:3.5)&&lineClear(p,player);
 let noticedNoise=false;
 if(noise&&noise.id!==agent.lastNoise&&Math.hypot(noise.x-p.x,noise.z-p.z)<noise.radius){agent.lastNoise=noise.id;agent.lastKnown={x:noise.x,z:Math.min(-4.36,noise.z)};noticedNoise=true;if(agent.mode!=='chase'&&agent.cooldown<=0){agent.mode='investigate';agent.timer=0}}
 if(canSee&&agent.cooldown<=0&&agent.mode!=='alert'&&agent.mode!=='chase'){agent.mode='alert';agent.timer=0;agent.lastKnown={x:player.x,z:player.z}}
 if(agent.mode==='alert'){
  if(canSee)agent.lastKnown={x:player.x,z:player.z};
  if(agent.timer>(agent.kind==='dog'?.9:1.3)){agent.mode=canSee?'chase':'investigate';agent.timer=0}
 }else if(agent.mode==='chase'){
  if(canSee){agent.lastKnown={x:player.x,z:player.z};agent.timer=0}
  if(!canSee&&agent.timer>3){agent.mode='return';agent.timer=0;return {escaped:true,noticedNoise}}
  if(canSee&&distance<.62){agent.mode='return';agent.cooldown=7;agent.timer=0;return {caught:true,noticedNoise}}
  if(agent.lastKnown)moveToward(agent,agent.lastKnown,agent.kind==='dog'?1.9:1.35,dt)
 }else if(agent.mode==='investigate'){
  if(agent.lastKnown)moveToward(agent,agent.lastKnown,agent.kind==='dog'?1.0:.75,dt);
  if(agent.timer>7){agent.mode='return';agent.timer=0}
 }else if(agent.mode==='return'){
  moveToward(agent,agent.home,.8,dt);if(Math.hypot(p.x-agent.home.x,p.z-agent.home.z)<.15){agent.mode=agent.kind==='dog'?'patrol':'idle';agent.timer=0}
 }else if(agent.mode==='patrol'){
  const goal={x:agent.home.x+(agent.patrol?2:-1),z:agent.home.z};moveToward(agent,goal,.35,dt);
  if(Math.hypot(p.x-goal.x,p.z-goal.z)<.15){agent.patrol=1-agent.patrol;agent.timer=0}
 }
 if(agent.lastKnown&&['alert','chase','investigate'].includes(agent.mode)){const x=agent.lastKnown.x-p.x,z=agent.lastKnown.z-p.z;if(Math.hypot(x,z)>.01)p.rotation=Math.atan2(x,z)}
 return {noticedNoise}
}
