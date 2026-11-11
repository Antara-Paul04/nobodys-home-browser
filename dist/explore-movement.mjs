
export function advancePlayer(p,input,dt,world){
 const length=Math.hypot(input.x,input.z),speed=input.running?2.25:1.05;
 if(length){const dx=input.x/length*speed*dt,dz=input.z/length*speed*dt;
  // Substeps keep sprinting and low frame rates from tunnelling through thin rails.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));
  function attempt(x,z){const floor=world.ground(x,z,p.y),feet=!p.jumping&&floor>p.y?floor:p.y;if(!world.valid(x,z,feet,false))return false;p.x=x;p.z=z;p.y=feet;return true}
  for(let i=0;i<steps;i++){if(attempt(p.x+dx/steps,p.z+dz/steps))continue;if(Math.abs(dx)>Math.abs(dz)){attempt(p.x+dx/steps,p.z);attempt(p.x,p.z+dz/steps)}else{attempt(p.x,p.z+dz/steps);attempt(p.x+dx/steps,p.z)}}
 }
 if(input.jump&&!p.jumping){p.jumping=true;p.velocity=4.1}
 const floor=world.ground(p.x,p.z,p.y);
 if(!p.jumping){if(p.y>floor+.035){p.jumping=true;p.velocity=0}else p.y=floor}
 if(p.jumping){const old=p.y;p.velocity-=12*dt;p.y+=p.velocity*dt;
  if(p.velocity>0){const ceiling=world.ceiling(p.x,p.z,old,p.y);if(ceiling<p.y){p.y=ceiling;p.velocity=0}}
  const landing=world.landing(p.x,p.z,old,p.y);if(p.velocity<=0&&landing!==null){p.y=landing;p.velocity=0;p.jumping=false}
 }
 if(!Number.isFinite(p.y)||p.y< -2){p.y=.025;p.velocity=0;p.jumping=false}
 return p;
}
