// Pointer-lock mouse look, with ordinary mouse movement as a no-drag fallback.
export function bindMouseLook(canvas,{enabled,onLook,onUnlock=()=>{},doc=document}){
 let wasLocked=false,ignoreUnlock=false,previous=null;
 const locked=()=>doc.pointerLockElement===canvas;
 function move(dx,dy){if(!enabled())return;onLook(Math.max(-160,Math.min(160,dx)),Math.max(-160,Math.min(160,dy)))}
 doc.addEventListener('mousemove',e=>{if(locked())move(e.movementX||0,e.movementY||0)});
 canvas.addEventListener('pointermove',e=>{if(locked()||!enabled())return;const p={x:e.clientX,y:e.clientY};if(previous)move(p.x-previous.x,p.y-previous.y);previous=p});
 canvas.addEventListener('pointerleave',()=>previous=null);
 doc.addEventListener('pointerlockchange',()=>{const now=locked();previous=null;if(wasLocked&&!now&&!ignoreUnlock&&enabled())onUnlock();wasLocked=now;ignoreUnlock=false});
 const api={
  lock(){previous=null;if(locked()||!enabled())return;ignoreUnlock=false;try{const result=canvas.requestPointerLock?.();result?.catch(()=>{})}catch{}},
  unlock(){previous=null;if(locked()){ignoreUnlock=true;doc.exitPointerLock?.()}},
  isLocked:locked
 };
 canvas.addEventListener('pointerdown',()=>api.lock());return api;
}
