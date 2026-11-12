import * as home from './home.mjs';
// Lightweight threat behaviour; no rendering or browser APIs.
// Pace is set against the kitten's own (it walks at .55 and runs at 1.45 units a second): the infected is a
// little slower than a walking kitten, the dog is faster than a walk and slower than a run. Reaction times
// are stretched in the same proportion, so a chase covers the same ground it always did, at a kitten's pace.
export const PACE={dog:{chase:1,search:.52,warn:1.7},infected:{chase:.5,search:.39,warn:2.5},home:.42,patrol:.18,lose:5.8,searchFor:13.5,rest:13.5};
export const STREET_BLOCKERS=[
 {minX:3.3,maxX:4.3,minZ:-5.85,maxZ:-5.0},
 {minX:4.5,maxX:5.5,minZ:-7.7,maxZ:-6.7},
 {minX:9.75,maxX:12,minZ:-12.95,maxZ:-11.8},
 {minX:-18.5,maxX:18.5,minZ:-20,maxZ:-12.28}
];
export function blockedPoint(x,z){return home.inside(x,z)||home.blocks(x,z,0,false)||STREET_BLOCKERS.some(r=>x>r.minX&&x<r.maxX&&z>r.minZ&&z<r.maxZ)}
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
 if(noise&&noise.id!==agent.lastNoise&&Math.hypot(noise.x-p.x,noise.z-p.z)<noise.radius){agent.lastNoise=noise.id;agent.lastKnown={x:noise.x,z:noise.z};noticedNoise=true;if(agent.mode!=='chase'&&agent.cooldown<=0){agent.mode='investigate';agent.timer=0}}
 if(canSee&&agent.cooldown<=0&&agent.mode!=='alert'&&agent.mode!=='chase'){agent.mode='alert';agent.timer=0;agent.lastKnown={x:player.x,z:player.z}}
 if(agent.mode==='alert'){
  if(canSee)agent.lastKnown={x:player.x,z:player.z};
  if(agent.timer>PACE[agent.kind].warn){agent.mode=canSee?'chase':'investigate';agent.timer=0}
 }else if(agent.mode==='chase'){
  if(canSee){agent.lastKnown={x:player.x,z:player.z};agent.timer=0}
  if(!canSee&&agent.timer>PACE.lose){agent.mode='return';agent.timer=0;return {escaped:true,noticedNoise}}
  if(canSee&&distance<.62){agent.mode='return';agent.cooldown=PACE.rest;agent.timer=0;return {caught:true,noticedNoise}}
  if(agent.lastKnown)moveToward(agent,agent.lastKnown,PACE[agent.kind].chase,dt)
 }else if(agent.mode==='investigate'){
  if(agent.lastKnown)moveToward(agent,agent.lastKnown,PACE[agent.kind].search,dt);
  if(agent.timer>PACE.searchFor){agent.mode='return';agent.timer=0}
 }else if(agent.mode==='return'){
  moveToward(agent,agent.home,PACE.home,dt);if(Math.hypot(p.x-agent.home.x,p.z-agent.home.z)<.15){agent.mode=agent.kind==='dog'?'patrol':'idle';agent.timer=0}
 }else if(agent.mode==='patrol'){
  const goal={x:agent.home.x+(agent.patrol?2:-1),z:agent.home.z};moveToward(agent,goal,PACE.patrol,dt);
  if(Math.hypot(p.x-goal.x,p.z-goal.z)<.15){agent.patrol=1-agent.patrol;agent.timer=0}
 }
 if(agent.lastKnown&&['alert','chase','investigate'].includes(agent.mode)){const x=agent.lastKnown.x-p.x,z=agent.lastKnown.z-p.z;if(Math.hypot(x,z)>.01)p.rotation=Math.atan2(x,z)}
 return {noticedNoise}
}
