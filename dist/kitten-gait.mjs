// Makes the kitten's legs agree with how fast it is actually travelling.
// The authored Walk and Run clips take very short steps (about 7 cm for a 30 cm kitten), so at any
// playable speed the body slides over the ground. We lengthen the leg swing once at load, measure how
// fast the planted paws really move, and then play each clip at the rate that matches the ground speed.
import * as THREE from 'three';
export const WALK_SPEED=.55,RUN_SPEED=1.45;                 // world units per second (0.73 and 1.9 m/s)
const LEG=/^(Upper|Lower)(FL|FR|HL|HR)$/,PAWS=['PawFL','PawFR','PawHL','PawHR'];
// Swing every leg joint further from its average pose by the factor k.
export function lengthenStride(clip,k){
 const q=new THREE.Quaternion(),mean=new THREE.Quaternion(),d=new THREE.Quaternion();
 for(const t of clip.tracks){
  if(!t.name.endsWith('.quaternion')||!LEG.test(t.name.split('.')[0]))continue;
  const v=t.values,n=v.length/4,m=[0,0,0,0];
  for(let i=0;i<n;i++){const s=v[i*4]*v[0]+v[i*4+1]*v[1]+v[i*4+2]*v[2]+v[i*4+3]*v[3]<0?-1:1;for(let j=0;j<4;j++)m[j]+=s*v[i*4+j]}
  mean.set(...m).normalize();
  for(let i=0;i<n;i++){
   q.fromArray(v,i*4);d.copy(mean).invert().multiply(q);if(d.w<0)d.set(-d.x,-d.y,-d.z,-d.w);
   const angle=2*Math.acos(Math.min(1,d.w)),s=Math.sqrt(1-d.w*d.w);
   if(s>1e-6){const a=angle*k/2,f=Math.sin(a)/s;d.set(d.x*f,d.y*f,d.z*f,Math.cos(a))}
   q.copy(mean).multiply(d).toArray(v,i*4);
  }
 }
 return clip;
}
// Ground speed of the planted paws at normal playback, in the model's own units per second.
export function plantedSpeed(root,clip,samples=48){
 const mixer=new THREE.AnimationMixer(root),action=mixer.clipAction(clip),tracks=PAWS.map(()=>[]),p=new THREE.Vector3();action.play();
 for(let i=0;i<samples;i++){mixer.setTime(clip.duration*i/samples);root.updateMatrixWorld(true);PAWS.forEach((name,k)=>{const o=root.getObjectByName(name);if(o)tracks[k].push(root.worldToLocal(o.getWorldPosition(p).clone()).z)})}
 action.stop();mixer.uncacheRoot(root);
 let sum=0,count=0;const dt=clip.duration/samples;
 for(const z of tracks)for(let i=0;i<z.length;i++){const back=z[i]-z[(i+1)%z.length];if(back>1e-5){sum+=back/dt;count++}}
 return count?sum/count:0;
}
// Prepare both gaits. Returns the playback rate to use for a given ground speed.
export function prepareGait(root,clips,scale=1){
 const walk=clips.find(c=>c.name==='Walk'),run=clips.find(c=>c.name==='Run'),natural={};
 if(walk){lengthenStride(walk,2.4);natural.Walk=plantedSpeed(root,walk)*scale}
 if(run){lengthenStride(run,2);natural.Run=plantedSpeed(root,run)*scale}
 return {natural,rate(name,speed){const n=natural[name];return n?Math.min(3.4,Math.max(.7,speed/n)):1}};
}
