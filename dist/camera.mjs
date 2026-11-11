// Clip the actual smoothed camera position, not just its desired endpoint.
export function constrainCamera(target,cameraPosition,obstacles,raycaster,padding=.12){
 const direction=cameraPosition.clone().sub(target);const distance=direction.length();if(distance<.001)return false;
 direction.divideScalar(distance);raycaster.set(target,direction);raycaster.far=distance;
 const hits=raycaster.intersectObjects(obstacles,false);
 if(!hits.length)return false;
 cameraPosition.copy(target).addScaledVector(direction,Math.max(.05,hits[0].distance-padding));return true;
}
