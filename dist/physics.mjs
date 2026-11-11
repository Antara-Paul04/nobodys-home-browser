// Shared vertical integration. Authored collision geometry lives in home.mjs.
export function stepVertical(y,velocity,ground,dt){const old=y;velocity-=11*dt;y+=velocity*dt;if(velocity<=0&&y<=ground&&old>=ground-.04)return {y:ground,velocity:0,landed:true};if(y<0)return {y:0,velocity:0,landed:true};return {y,velocity,landed:false}}
