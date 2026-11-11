export const CAT_RADIUS=.16;
// Solid bodies with top surfaces, in the same coordinates as the room geometry.
export const FURNITURE=[
 {name:'bed',minX:-4.075,maxX:-1.725,minZ:1.30,maxZ:3.10,top:.77},
 {name:'bedside table',minX:-4.445,maxX:-3.795,minZ:.475,maxZ:1.125,top:.865},
 {name:'sofa cushion',minX:-1.175,maxX:.475,minZ:.025,maxZ:.55,top:.73},
 {name:'sofa back',minX:-1.175,maxX:.475,minZ:.55,maxZ:.73,top:1.145},
 {name:'sofa left arm',minX:-1.21,maxX:-1.03,minZ:-.025,maxZ:.725,top:.925},
 {name:'sofa right arm',minX:.33,maxX:.51,minZ:-.025,maxZ:.725,top:.925},
 {name:'coffee table',minX:.71,maxX:1.79,minZ:-.475,maxZ:.275,top:.615},
 {name:'television cabinet',minX:3.28,maxX:4.38,minZ:-1.925,maxZ:-1.375,top:.91}
];
export function overlaps(item,x,z){return x>item.minX-CAT_RADIUS&&x<item.maxX+CAT_RADIUS&&z>item.minZ-CAT_RADIUS&&z<item.maxZ+CAT_RADIUS}
export function insideFurniture(x,z){return FURNITURE.some(item=>overlaps(item,x,z))}
export function blocksFurniture(x,z,feetY){return FURNITURE.some(item=>overlaps(item,x,z)&&feetY<item.top-.025)}
export function supportHeight(x,z){let height=0;for(const item of FURNITURE)if(overlaps(item,x,z))height=Math.max(height,item.top);return height}
export function stepVertical(y,velocity,ground,dt){const old=y;velocity-=11*dt;y+=velocity*dt;if(velocity<=0&&y<=ground&&old>=ground-.04)return {y:ground,velocity:0,landed:true};if(y<0)return {y:0,velocity:0,landed:true};return {y,velocity,landed:false}}
