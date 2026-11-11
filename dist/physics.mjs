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
// The front wall of the home has real thickness. Only the open window lets the cat
// through, and only once its paws are up at the sill, where it can also stand.
export const FRONT_WALL={minX:-4.63,maxX:4.6,minZ:-4.13,maxZ:-3.97};
export const WINDOW={minX:-3.58,maxX:-2.83,sill:.70,lintel:1.2};
export function inFrontWall(z){return z>FRONT_WALL.minZ-CAT_RADIUS&&z<FRONT_WALL.maxZ+CAT_RADIUS}
export function inWindow(x){return x>WINDOW.minX&&x<WINDOW.maxX}
export function frontWallBlocks(x,z,feetY){if(!inFrontWall(z)||x<FRONT_WALL.minX-CAT_RADIUS||x>FRONT_WALL.maxX+CAT_RADIUS)return false;return !(inWindow(x)&&feetY>=WINDOW.sill-.025&&feetY<WINDOW.lintel)}
export function groundHeight(x,z){return Math.max(supportHeight(x,z),inFrontWall(z)&&inWindow(x)?WINDOW.sill:0)}
// Moves a grounded cat that is somehow inside the wall (older saves, edge cases) to the nearer face.
export function clearOfFrontWall(z){if(!inFrontWall(z))return z;return z>(FRONT_WALL.minZ+FRONT_WALL.maxZ)/2?FRONT_WALL.maxZ+CAT_RADIUS+.01:FRONT_WALL.minZ-CAT_RADIUS-.01}
