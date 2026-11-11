// Stable architectural rules: change the seed to author a new neighbourhood, never on reload.
export function seededRandom(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
export function generateBuilding(seed,lot){
 const random=seededRandom(seed),width=lot.width,depth=lot.depth||5.5,floors=random()>.45?3:2,bays=width>4.6?3:2,floorHeight=2.25,height=floors*floorHeight,parts=[];
 const colors=[0xa19765,0x869b86,0x9f7870,0x969a91,0xb0a27c],paint=colors[Math.floor(random()*colors.length)];
 const box=(x,y,z,w,h,d,material='plaster',angle=0)=>parts.push({x,y,z,w,h,d,material,angle});
 box(0,height/2,-depth+.1,width,height,.2);box(-width/2+.1,height/2,-depth/2,.2,height,depth);box(width/2-.1,height/2,-depth/2,.2,height,depth);
 box(0,.06,-depth/2,width,.12,depth,'stone');box(0,height,-depth/2,width+.15,.14,depth+.15,'stone');
 box(0,height+.24,-depth+.1,width,.48,.18,'plaster');for(const x of [-width/2,width/2])box(x,height+.24,-depth/2,.18,.48,depth,'plaster');
 box(0,height+.25,0,width,.5,.2,'plaster');box(0,height+.52,0,width+.18,.08,.32,'trim');
 const shop=lot.shop||null;
 for(let floor=0;floor<floors;floor++){
  const base=floor*floorHeight;
  box(0,base+.08,-depth/2,width,.14,depth,'stone');box(0,base+floorHeight-.05,.09,width+.18,.13,.28,'trim');
  for(let bay=0;bay<bays;bay++){
   const bw=width/bays,x=-width/2+bw*(bay+.5),door=floor===0&&bay===Math.floor(bays/2),ww=door?.87:bw*.57,low=door?.14:.68,top=door?1.93:1.75,band=(bw-ww)/2;
   box(x-ww/2-band/2,base+floorHeight/2,0,band,floorHeight,.2);box(x+ww/2+band/2,base+floorHeight/2,0,band,floorHeight,.2);
   box(x,base+low/2,0,ww,low,.2);box(x,base+(top+floorHeight)/2,0,ww,floorHeight-top,.2);
   box(x,base+(low+top)/2,-.11,ww,top-low,.035,door?'wood':'dark');
   for(const sx of [-1,1])box(x+sx*(ww/2+.025),base+(low+top)/2,.075,.055,top-low+.14,.2,'trim');
   box(x,base+top+.055,.08,ww+.17,.11,.24,'trim');box(x,base+low-.035,.13,ww+.23,.09,.4,'stone');
   if(door){for(const sx of [-1,1]){box(x+sx*.21,base+1.05,-.035,.35,1.6,.045,'shutter');for(const yy of [.62,1.42])box(x+sx*.21,base+yy,.002,.27,.43,.025,'wood')}
    box(x,.04,.48,1.18,.08,.55,'stone');box(x,.105,.22,1.04,.13,.3,'stone');
   }else{
    const open=random()>.55;
    for(const sx of [-1,1]){const leafX=x+sx*(open?ww*.57:ww*.25),angle=open?sx*.6:0;box(leafX,base+(low+top)/2,.13,ww*.48,top-low,.045,'shutter',angle);
     for(let k=0;k<7;k++)box(leafX,base+low+.1+k*(top-low-.15)/7,.16,ww*.43,.035,.035,'louver',angle)}
    for(let k=0;k<5;k++)box(x-ww*.4+k*ww*.2,base+(low+top)/2,.19,.018,top-low,.018,'iron');
    box(x,base+low+.37,.19,ww,.025,.018,'iron');
   }
  }
  // A projecting balcony is a module, so railings and columns stay correctly sized.
  if(floor===1&&random()>.3){const bw=width*.8;box(0,base+.1,.4,bw,.14,.85,'stone');box(0,base+.8,.8,bw,.045,.035,'iron');box(0,base+.22,.8,bw,.035,.035,'iron');for(let x=-bw/2;x<=bw/2;x+=.12)box(x,base+.5,.8,.02,.6,.025,'iron');for(const x of [-bw/2,bw/2])box(x,base+.8,.4,.035,.045,.8,'iron')}
 }
 // Service fittings, pilasters and cornice teeth vary without distorting the windows.
 box(-width/2+.23,height/2,.13,.055,height,.055,'iron');box(width/2-.32,.9,.18,.24,.32,.13,'iron');
 for(const x of [-width/2+.12,width/2-.12])box(x,height/2,.055,.22,height,.2,'trim');
 for(let x=-width/2+.17;x<width/2;x+=.28)box(x,height-.16,.15,.09,.14,.15,'trim');
 const tank={x:width*.23,y:height+.5,z:-depth*.68,r:.34,h:.7};
 return {...lot,seed,width,depth,floors,bays,height,paint,parts,tank,shop};
}
export const proceduralBuildings=[
 {x:-26,z:12,width:5.2,angle:Math.PI,shop:['সেন স্টোরস','SEN STORES']},
 {x:-18,z:12,width:4.4,angle:Math.PI},
 {x:-9.5,z:12,width:4.7,angle:Math.PI,shop:['বোস ইলেকট্রিক','BOSE ELECTRIC']},
 {x:-1,z:12,width:4.3,angle:Math.PI},
 {x:7.5,z:12,width:5.1,angle:Math.PI},
 {x:15.5,z:12,width:5.3,angle:Math.PI,shop:['দত্ত সাইকেল','DUTTA CYCLES']},
 {x:27,z:12,width:5.2,angle:Math.PI}
].map((lot,i)=>generateBuilding(8211+i*173,lot));
export function buildingSolids(spec){
 const solids=[{minX:-spec.width/2,maxX:spec.width/2,minZ:-spec.depth,maxZ:.1,bottom:0,top:spec.height+.52}];
 for(const p of spec.parts)if(p.material==='stone'&&p.z>0)solids.push({minX:p.x-p.w/2,maxX:p.x+p.w/2,minZ:p.z-p.d/2,maxZ:p.z+p.d/2,bottom:p.y-p.h/2,top:p.y+p.h/2});
 return solids;
}
