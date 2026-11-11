// North Kolkata house generator. Pure data: no rendering here.
// A fixed seed always gives the same house, so the neighbourhood never changes between visits.
//
// Local frame: x across the front (centre 0), y up, the front wall on z = 0 facing +z, the body behind it.
// A part is {g, m, x, y, z, w, h, d, ry, rx, c}: geometry key, material key, centre, size, rotation, colour.
export function seededRandom(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}

// Lime-wash colours as they look after twenty monsoons.
const PAINT={
 old:[0xc49a52,0xcfa24a,0xbf8f4d,0xc8b27a,0xc48f7c,0xb97f66,0x9fb096,0xb9a98a,0xcbbf9c,0x9a5a45],
 flat:[0xb9c3b0,0x9fb7c2,0xc9a7a0,0xc7c08f,0xa8b98a,0xcfc8b5,0xb3a7bd,0xd0b48c,0x8fb3a7],
 tin:[0x5f93ad,0x6fa58c,0xc98f8a,0xc7b26a,0x7c9cb8],
 shop:[0xc49a52,0xcbbf9c,0xc48f7c,0x9fb096,0xb9c3b0,0xc7c08f]
};
const TRIM=[0xd9d0b6,0xe0dccf,0xcdbf9d,0xd6c9a8],SHUTTER=[0x2f5d49,0x27503f,0x356a57,0x34617a,0x5a4232,0x2f7770,0x6d756f,0x244536];
const DOOR=[0x2f5d49,0x5a3b29,0x34617a,0x612c27,0x3f4a3f,0x6b4a2c];
export const CLOTH=[0xb23a3a,0xd8c9a3,0x2f5f8a,0xd9a441,0x4f8a5b,0xc96f8f,0xe0e0d6,0x7a4b8a,0xd4572f,0x3f8f8f,0xe3c26b,0x8fa9c9];
const ROLL=[0x7e8a8f,0x5f7f93,0x8a8f7e,0x6f8f7a,0x9a7a5a,0x8f8f8f],SIGN={red:'#8f2a22',blue:'#1f4f7a',green:'#1f5a3c',cream:'#d9cfae',yellow:'#e0b62c',black:'#262626',med:'#f1ede0',std:'#e6c019',shut:null};
export const shade=(c,f)=>{const r=Math.min(255,((c>>16)&255)*f),g=Math.min(255,((c>>8)&255)*f),b=Math.min(255,(c&255)*f);return (r<<16)|(g<<8)|b|0};

export function generateBuilding(seed,lot){
 const R=seededRandom(seed),pick=a=>a[Math.floor(R()*a.length)],chance=p=>R()<p,range=(a,b)=>a+(b-a)*R();
 const W=lot.width,D=lot.depth||5.5,style=lot.style||'old',scenery=!!lot.scenery;
 const floors=lot.floors||(style==='tin'?1:2+Math.floor(R()*2));
 const upper=style==='shop'?(chance(.55)?'old':'flat'):style;
 const fh0=style==='tin'?2.15:style==='old'?2.7:style==='shop'?2.55:2.35,fh=upper==='old'?2.5:2.25;
 const H=fh0+(floors-1)*fh,floorY=f=>f===0?0:fh0+(f-1)*fh;
 const paint=pick(PAINT[style==='brick'?'flat':style]),trim=style==='flat'||upper==='flat'?shade(paint,1.12):pick(TRIM),shutter=pick(SHUTTER),door=pick(DOOR);
 const sidePaint=chance(.5)?0x8f8b7e:0x9a9486,wallMat=style==='brick'?'brick':chance(.35)?'plasterOld':'plaster',wallColour=style==='brick'?undefined:paint;
 const parts=[],decals=[],solids=[],hooks=[];
 const add=(g,m,x,y,z,w,h,d,ry=0,c,rx=0)=>{if(w>0&&h>0&&d>0)parts.push({g,m,x,y,z,w,h,d,ry,rx,c})};
 // A face places things by (u along the wall, y, distance out from the wall).
 function face(name){
  const ry={front:0,back:Math.PI,right:Math.PI/2,left:-Math.PI/2}[name],len=name==='front'||name==='back'?W:D;
  const at=(u,out)=>name==='front'?[u,out]:name==='back'?[-u,-D-out]:name==='right'?[W/2+out,-D/2-u]:[-W/2-out,-D/2+u];
  return {name,len,ry,
   box(u,y,out,w,h,t,m,c){const [x,z]=at(u,out);add('box',m,x,y,z,w,h,t,ry,c)},
   part(g,u,y,out,w,h,t,m,c,rx=0,turn=0){const [x,z]=at(u,out);add(g,m,x,y,z,w,h,t,ry+turn,c,rx)},
   turned(u,y,out,w,h,t,m,c,angle){const [x,z]=at(u,out);add('box',m,x,y,z,w,h,t,ry+angle,c)},
   decal(id,u,y,w,h,data={}){const [x,z]=at(u,.014+(data.out||0));decals.push({id,x,y,z,ry,w,h,...data})},
   hook(u,y,out,kind){const [x,z]=at(u,out);hooks.push({x,y,z,ry,kind})},
   solid(u0,u1,out0,out1,bottom,top){
    const a=name==='back'?{minX:-u1,maxX:-u0,minZ:-D-out1,maxZ:-D-out0}:name==='right'?{minX:W/2+out0,maxX:W/2+out1,minZ:-D/2-u1,maxZ:-D/2-u0}:name==='left'?{minX:-W/2-out1,maxX:-W/2-out0,minZ:-D/2+u0,maxZ:-D/2+u1}:{minX:u0,maxX:u1,minZ:out0,maxZ:out1};
    solids.push({...a,bottom,top})}
  };
 }
 const front=face('front'),back=face('back'),left=face('left'),right=face('right');

 // ------------------------------------------------------------ openings
 function shutters(F,u,y0,w,h,colour,state){
  for(const s of [-1,1]){
   const a=state==='shut'?0:state==='ajar'?(s<0?.5:0):state==='open'?2.95:(s<0?2.95:.25),hinge=u+s*w/2,va=-s*Math.cos(a)*w/2,vo=Math.sin(a)*w/2;
   F.turned(hinge+va/2,y0+h/2,.035+vo/2,w/2-.01,h,.03,'louver',colour,Math.atan2(-vo,va));
  }
 }
 function windowUnit(F,u,y0,w,h,o={}){
  F.box(u,y0+h/2,.008,w,h,.016,chance(.25)?'glass':'dark');
  if(o.arch){F.part('archfill',u,y0+h,.008,w/2,w/2,.016,'dark');F.part('arch',u,y0+h,.03,w/2+.11,w/2+.11,.07,o.archMat||'brick',o.archMat==='trim'?trim:undefined)}
  if(o.kind==='grillbox'){
   F.box(u,y0+h/2,.17,w+.04,h+.04,.012,'grille');for(const s of [-1,1])F.turned(u+s*(w/2+.02),y0+h/2,.09,.16,h+.04,.012,'grille',undefined,Math.PI/2);
   F.box(u,y0-.02,.09,w+.06,.025,.18,'iron');F.box(u,y0+h+.02,.09,w+.06,.02,.18,'iron');
   if(chance(.3))F.box(u+range(-.1,.1),y0+h*.55,.185,range(.18,.32),h*range(.5,.8),.012,'cloth',pick(CLOTH));
  }else if(o.grille!==false)F.box(u,y0+h/2,.055,w,h,.012,'grille');
  if(o.shutter!==false)shutters(F,u,y0,w,h,o.colour||shutter,o.state||pick(['shut','shut','ajar','open','half']));
  F.box(u,y0-.035,.06,w+.18,.07,.13,o.sill||'trim',o.sill?undefined:trim);
  if(o.chajja)F.box(u,y0+h+.09,.19,w+.34,.06,.38,'concrete');
  else if(!o.arch)F.box(u,y0+h+.045,.05,w+.16,.09,.1,'trim',trim);
  if(o.jambs)for(const s of [-1,1])F.box(u+s*(w/2+.045),y0+h/2,.035,.07,h,.07,'trim',trim);
 }
 function doorUnit(F,u,y0,w,h,o={}){
  F.box(u,y0+h/2,.012,w,h,.024,'door',o.colour||door);
  if(o.arch){F.part('archfill',u,y0+h,.012,w/2,w/2,.02,'glass');F.part('arch',u,y0+h,.035,w/2+.12,w/2+.12,.08,o.archMat||'brick',o.archMat==='trim'?trim:undefined)}
  else F.box(u,y0+h+.05,.05,w+.2,.1,.1,'trim',trim);
  for(const s of [-1,1])F.box(u+s*(w/2+.04),y0+h/2,.03,.08,h,.06,'trim',trim);
  if(o.gate)F.box(u,y0+h/2,.05,w,h,.012,'gate');
 }
 function pipe(F,u,y0,y1,colour=pick([0x6f6b63,0x3c3f42,0x7a4a36,0x8f8f86])){
  F.part('cyl',u,(y0+y1)/2,.07,.035,y1-y0,.035,'pipe',colour);for(let y=y0+.6;y<y1;y+=1.4)F.box(u,y,.04,.11,.03,.08,'iron');
 }
 function balcony(F,u,y,w,depth,kind,colour){
  F.box(u,y-.04,depth/2,w,.08,depth,'stone');
  if(kind==='iron'){
   F.box(u,y+.37,depth-.012,w,.74,.014,'railing');for(const s of [-1,1])F.turned(u+s*(w/2-.007),y+.37,depth/2,depth,.74,.014,'railing',undefined,Math.PI/2);
   F.box(u,y+.75,depth-.012,w+.02,.03,.04,'iron');
   const n=Math.max(2,Math.round(w/.9));for(let i=0;i<n;i++)F.box(u-w/2+.12+(w-.24)*i/(n-1),y-.2,.16,.07,.26,.3,'trim',trim);
  }else{
   F.box(u,y+.26,depth-.04,w,.52,.08,'plaster',colour);for(const s of [-1,1])F.turned(u+s*(w/2-.04),y+.26,depth/2,depth,.52,.08,'plaster',colour,Math.PI/2);
   F.box(u,y+.66,depth-.04,w,.28,.012,'grille');F.box(u,y+.81,depth-.04,w+.02,.03,.04,'iron');
  }
  // Washing over the rail: saris, gamchhas, a bedsheet.
  if(chance(.7)){let x=-w/2+.15;while(x<w/2-.3){const cw=range(.22,.5),ch=range(.45,1.5);if(chance(.6))F.box(u+x+cw/2,y+.74-ch/2,depth+.012,cw,ch,.012,'cloth',pick(CLOTH));x+=cw+range(.05,.3)}}
  if(chance(.45))F.hook(u+range(-w/3,w/3),y+.05,depth-.15,'plant');
  if(chance(.3))F.hook(u+range(-w/3,w/3),y+.8,depth,'crow');
 }
 function awning(F,u,y,w,depth,kind){
  const tilt=kind==='tarp'?.32:.2,c=kind==='tarp'?pick([0x2f5f9a,0xd46a2a,0x3f7a56,0x2f5f9a]):pick([0x8a8478,0x7a6a58,0x93897a]);
  F.part('box',u,y-Math.sin(tilt)*depth/2,depth/2*Math.cos(tilt)+.02,w,.025,depth,kind==='tarp'?'tarp':'tin',c,tilt);
  if(kind!=='tarp')for(const s of [-1,1])F.part('cyl',u+s*(w/2-.06),y-.45,depth*.9,.014,.9,.014,'iron');
 }
 function wallStuff(F,u0,u1,y1){
  // Posters, damp, paan spit, cow-dung cakes and the odd notice: what an old wall collects.
  const n=Math.round((u1-u0)*range(.5,1.1));
  for(let i=0;i<n;i++){const u=range(u0+.2,u1-.2),k=R();
   if(k<.3)F.decal('poster',u,range(.9,1.9),.42,.56,{v:Math.floor(R()*16),tilt:range(-.06,.06)});
   else if(k<.5)F.decal('damp',u,range(.25,.7),range(.7,1.4),range(.5,1.2),{v:Math.floor(R()*4)});
   else if(k<.62)F.decal('paan',u,range(.12,.5),range(.3,.5),range(.3,.55),{v:Math.floor(R()*2)});
   else if(k<.72)F.decal('crack',u,range(.8,Math.max(1,y1-1)),range(.5,1),range(.8,1.6),{v:Math.floor(R()*3)});
   else if(k<.8)F.decal('walltext',u,range(1.3,1.9),1.3,.3,{v:Math.floor(R()*8)});
   else if(k<.87&&y1>3)F.decal('soot',u,range(y1-1.6,y1-.6),range(.6,1.1),range(1.2,2),{v:Math.floor(R()*3)});
   else if(k<.93)F.decal('ghunte',u,range(.5,1.2),range(.8,1.3),range(.6,.9),{v:0});
   else F.decal('moss',u,range(.05,.35),range(.8,1.6),range(.35,.7),{v:Math.floor(R()*3)});
  }
 }

 // ------------------------------------------------------------ the shell
 const shops=(style==='shop'||style==='tin')&&lot.shops?lot.shops:null,shopDepth=1.05,shopTop=1.82;
 const sideMat=f=>lot[f]==='open'?(style==='brick'?'brick':'cement'):style==='brick'||chance(.45)?'brick':'cement';
 for(const [F,key] of [[left,'left'],[right,'right']]){const m=sideMat(key);F.box(0,H/2,-.07,D,H,.14,m,m==='cement'?shade(sidePaint,range(.85,1.05)):undefined)}
 const backMat=style==='brick'?'brick':'cement';back.box(0,H/2,-.07,W,H,.14,backMat,backMat==='cement'?shade(sidePaint,range(.8,1)):undefined);
 add('box','roof',0,H-.05,-D/2,W-.02,.1,D-.02);
 if(!shops)front.box(0,H/2,-.07,W,H,.14,wallMat,wallColour);
 else front.box(0,(H+shopTop)/2,-.07,W,H-shopTop,.14,wallMat,wallColour);
 solids.push({minX:-W/2,maxX:W/2,minZ:-D,maxZ:shops?-shopDepth:0,bottom:0,top:H+.5});
 if(shops)solids.push({minX:-W/2,maxX:W/2,minZ:-shopDepth,maxZ:0,bottom:shopTop,top:H+.5});

 // ------------------------------------------------------------ ground floor
 const bays=Math.max(2,Math.min(5,Math.round(W/(style==='old'?1.32:1.22)))),bw=W/bays,bayX=i=>-W/2+bw*(i+.5);
 const doorBay=chance(.5)?(chance(.5)?0:bays-1):Math.floor(bays/2);
 const plinth=(style==='old'||upper==='old')&&!shops?.3:.12,rowak=style==='old'&&!scenery&&chance(.8);
 if(shops){
  // Shop bays between masonry piers, plus one narrow door to the stairs.
  const stair=style==='shop'?.72:0,n=shops.length,sw=(W-stair-.16)/n,x0=-W/2+.08+(doorBay===0?stair:0);
  const pier=(x,w)=>{add('box',wallMat,x,shopTop/2,-shopDepth/2,w,shopTop,shopDepth,0,wallColour);solids.push({minX:x-w/2,maxX:x+w/2,minZ:-shopDepth,maxZ:0,bottom:0,top:shopTop})};
  pier(-W/2+.04,.08);pier(W/2-.04,.08);
  if(stair){const sx=doorBay===0?-W/2+.08+stair/2:W/2-.08-stair/2;pier(sx,stair);doorUnit(front,sx,.12,.56,1.62,{gate:chance(.5)});front.box(sx,.06,.16,.7,.12,.32,'stone');solids.push({minX:sx-.35,maxX:sx+.35,minZ:0,maxZ:.32,bottom:0,top:.12})}
  shops.forEach((shop,i)=>{
   const cx=x0+sw*(i+.5),ow=sw-.14,[bn,en,theme]=shop,shut=theme==='shut'||scenery&&chance(.5),half=!shut&&chance(.22);
   if(i>0)pier(x0+sw*i,.14);
   add('box','stone',cx,.045,-shopDepth/2+.12,sw,.09,shopDepth+.5);solids.push({minX:cx-sw/2,maxX:cx+sw/2,minZ:-shopDepth,maxZ:.37,bottom:0,top:.09});
   if(shut){front.box(cx,.09+(shopTop-.09)/2,-.03,ow,shopTop-.09,.03,'shutter',pick(ROLL));solids.push({minX:cx-sw/2,maxX:cx+sw/2,minZ:-shopDepth,maxZ:0,bottom:0,top:shopTop});
    if(chance(.6))front.decal('poster',cx+range(-.3,.3),range(.7,1.3),.42,.56,{v:Math.floor(R()*16),out:.02});
   }else{
    // An open shop: dark inside, shelves of stock, a counter at the front.
    add('box','dark',cx,shopTop/2,-shopDepth+.02,sw,shopTop,.04);add('box','dark',cx,shopTop-.02,-shopDepth/2,sw,.04,shopDepth);
    for(const sy of [.55,.95,1.35]){add('box','wood',cx,sy,-shopDepth+.16,ow,.03,.26,0,0x5a4632);let x=-ow/2+.06;while(x<ow/2-.1){const gw=range(.07,.2),gh=range(.1,.3);add('box','goods',cx+x+gw/2,sy+.015+gh/2,-shopDepth+.16,gw,gh,.2,0,pick(CLOTH));x+=gw+.02}}
    if(chance(.75)){add('box','wood',cx-ow*.12,.365,-.22,ow*.7,.55,.36,0,pick([0x6a5238,0x8a8478,0x5a4632]));add('box','glass',cx-ow*.12,.71,-.22,ow*.7,.14,.36);solids.push({minX:cx-ow*.47,maxX:cx+ow*.23,minZ:-.4,maxZ:-.04,bottom:0,top:.78})}
    if(half)front.box(cx,shopTop-.35,-.03,ow,.7,.03,'shutter',pick(ROLL));
    for(let k=0;k<Math.round(ow/.25);k++)if(chance(.6))add('box','goods',cx-ow/2+.12+k*.25,shopTop-.32-R()*.25,-.08,.06,range(.3,.6),.012,0,pick(CLOTH));   // hanging sachet strips
    add('box','glow',cx,shopTop-.1,-.5,ow*.6,.03,.03);
    if(chance(.6)){const gx=cx+ow*.36;add('box','goods',gx,.24,.16,.3,.3,.28,0,pick([0xb9a27a,0x8f7a5a,0xc7b98f]));solids.push({minX:gx-.15,maxX:gx+.15,minZ:.02,maxZ:.3,bottom:0,top:.39})}
   }
   if(bn||en){front.decal('sign',cx,shopTop+.26,ow+.06,.42,{text:[bn,en],theme:SIGN[theme]||SIGN.red,key:theme,out:.05});front.box(cx,shopTop+.26,.03,ow+.1,.46,.05,'wood',0x3a3028)}
   if(!shut&&chance(.75))awning(front,cx,shopTop+.02,ow+.2,range(.6,.95),chance(.5)?'tarp':'tin');
  });
  front.box(0,shopTop+.56,.06,W+.06,.1,.14,'trim',trim);
 }else{
  if(plinth>.15)front.box(0,plinth/2,.02,W+.04,plinth,.06,'stone');
  for(let i=0;i<bays;i++){
   const x=bayX(i);
   if(i===doorBay){
    const dw=style==='old'?.8:.68,dh=style==='old'?1.72:1.68;
    doorUnit(front,x,plinth,dw,dh,{arch:style==='old',archMat:chance(.5)?'brick':'trim',gate:style==='brick'||style==='flat'&&chance(.4)});
    // Steps down to the lane.
    const n=plinth>.2?3:1;for(let s=0;s<n;s++){const top=plinth-(plinth/n)*s,out=.13+s*.15;front.box(x,top/2,out+.02,dw+.3+s*.08,top,.15,'stone');
     if(!scenery)solids.push({minX:x-dw/2-.15-s*.04,maxX:x+dw/2+.15+s*.04,minZ:out-.055,maxZ:out+.095,bottom:0,top})}
    if(chance(.75))front.decal('number',x+dw/2+.2,plinth+1.25,.26,.17,{text:String(Math.floor(range(2,58)))+pick(['','','/1','B','/2','A'])});
    if(chance(.3))front.decal('plate',x,plinth+dh+(style==='old'?.62:.24),.62,.17,{v:Math.floor(R()*6)});
   }else if(style==='old')windowUnit(front,x,plinth+.62,.6,.98,{arch:true,archMat:chance(.6)?'brick':'trim',state:pick(['shut','shut','ajar']),jambs:true});
   else if(style==='brick')windowUnit(front,x,.85,.66,.9,{shutter:chance(.5),colour:0x6f7b80,sill:'concrete'});
   else windowUnit(front,x,.8,.7,.92,{kind:chance(.6)?'grillbox':'plain',chajja:true,state:pick(['shut','ajar','open'])});
  }
  // The rowak: the raised ledge where the para sits and talks.
  if(rowak){const a=doorBay===0?bayX(0)+bw/2+.1:-W/2+.06,b=doorBay===bays-1?bayX(bays-1)-bw/2-.1:W/2-.06,segs=doorBay>0&&doorBay<bays-1?[[a,bayX(doorBay)-bw/2-.1],[bayX(doorBay)+bw/2+.1,b]]:[[a,b]];
   for(const [p,q] of segs)if(q-p>.5){front.box((p+q)/2,plinth/2+.01,.3,q-p,plinth+.02,.56,wallMat,wallColour===undefined?undefined:shade(paint,.92));front.box((p+q)/2,plinth+.03,.3,q-p+.04,.03,.6,'stone');solids.push({minX:p,maxX:q,minZ:.02,maxZ:.6,bottom:0,top:plinth+.045});
    if(chance(.5))front.hook(range(p+.2,q-.2),plinth+.045,.38,'plant');if(chance(.3))front.hook(range(p+.2,q-.2),plinth+.045,.3,'bucket')}
  }
 }
 if(!scenery)wallStuff(front,-W/2,W/2,H);

 // ------------------------------------------------------------ upper floors
 for(let f=1;f<floors;f++){
  const y=floorY(f),kind=upper;
  front.box(0,y,.05,W+.08,kind==='old'?.12:.1,kind==='old'?.12:.06,kind==='brick'?'concrete':'trim',trim);
  if(kind==='old'){
   const full=chance(.55),wide=full?W-.25:bw*Math.min(bays,2)-.1,bx=full?0:bayX(Math.min(bays-2,Math.max(0,doorBay-(doorBay>0?1:0))))+bw/2,has=f===1||chance(.6);
   if(has)balcony(front,bx,y+.02,wide,.62,'iron');
   for(let i=0;i<bays;i++){const x=bayX(i),on=has&&Math.abs(x-bx)<wide/2;
    if(on){front.box(x,y+.12+.87,.008,.62,1.74,.016,'dark');shutters(front,x,y+.12,.62,1.74,shutter,pick(['shut','ajar','open','half','open']));front.box(x,y+2.0,.05,.8,.1,.1,'trim',trim)}
    else windowUnit(front,x,y+.72,.6,1.12,{state:pick(['shut','ajar','open','half']),jambs:true});
   }
  }else if(kind==='flat'){
   const shaft=chance(.7)?(doorBay===0?0:bays-1):-1;
   for(let i=0;i<bays;i++){const x=bayX(i);
    if(i===shaft){front.box(x,y+fh/2,.01,.52,fh-.2,.02,'jali');continue}
    if(chance(.32)){balcony(front,x,y+.02,bw-.12,.5,'solid',shade(paint,chance(.5)?.88:1.08));front.box(x,y+.99,.012,.6,1.74,.024,'door',shutter);front.box(x,y+1.95,.19,bw-.1,.06,.42,'concrete')}
    else{windowUnit(front,x,y+.78,.74,.95,{kind:chance(.55)?'grillbox':'plain',chajja:true,state:pick(['shut','ajar','open','half'])});
     if(chance(.14))front.box(x+.05,y+.5,.14,.5,.3,.24,'acunit')}
   }
  }else{
   for(let i=0;i<bays;i++)windowUnit(front,bayX(i),y+.8,.66,.92,{shutter:chance(.45),colour:0x6f7b80,sill:'concrete'});
  }
 }
 // Pilasters, corner drainpipe, cornice.
 if(upper==='old'){for(const s of [-1,1])front.box(s*(W/2-.1),(H+plinth)/2,.03,.2,H-plinth,.06,'trim',trim);
  front.box(0,H-.08,.12,W+.26,.16,.26,'trim',trim);for(let x=-W/2+.15;x<W/2;x+=.3)front.box(x,H-.22,.1,.1,.12,.16,'trim',trim)}
 else if(upper==='flat')front.box(0,H-.04,.1,W+.2,.08,.22,'concrete');
 if(style==='brick')for(let i=0;i<=bays;i++)front.box(-W/2+bw*i,H/2,.02,.2,H,.04,'concrete');
 if(!scenery||chance(.5))pipe(front,(chance(.5)?-1:1)*(W/2-.26),.25,H+.1);
 if(!scenery&&!shops&&chance(.7)){const mu=(doorBay===0?1:-1)*(W/2-.5);front.box(mu,1.45,.05,.24,.32,.1,'meter');front.box(mu,1.62+(H-1.62)/2,.02,.02,H-1.62,.02,'iron')}

 // ------------------------------------------------------------ sides and back that face a lane
 for(const [F,key] of [[left,'left'],[right,'right'],[back,'back']]){
  const mode=lot[key];if(scenery||mode==='party'||mode==='hidden'||!mode)continue;
  if(mode==='gap'){if(chance(.6))pipe(F,range(-F.len/3,F.len/3),.2,H);continue}
  const len=F.len,n=Math.max(1,Math.round(len/1.7));
  for(let f=0;f<floors;f++){const y=floorY(f);
   for(let i=0;i<n;i++){const u=-len/2+len*(i+.5)/n+range(-.15,.15);
    if(f===0&&key==='back'&&i===Math.floor(n/2)){doorUnit(F,u,.1,.6,1.62,{colour:pick(DOOR)});F.box(u,.05,.14,.8,.1,.28,'stone');F.solid(u-.4,u+.4,0,.28,0,.1);continue}
    if(chance(f===0?.55:.8))windowUnit(F,u,y+(f===0?1.05:.85),.5,f===0?.6:.78,{kind:chance(.25)?'grillbox':'plain',state:pick(['shut','ajar','open']),colour:pick([shutter,0x6f7b80,0x5a4232]),sill:'concrete',chajja:chance(.4)});
    else if(f>0&&chance(.25))F.box(u,y+.5,.14,.5,.3,.24,'acunit');
   }
   if(f>0&&chance(.35)){const u=range(-len/4,len/4),w=range(1,Math.min(2.2,len*.6));F.box(u,y+1.7,.3,w,.012,.012,'iron');let x=-w/2;while(x<w/2-.2){const cw=range(.2,.42),ch=range(.4,.9);F.box(u+x+cw/2,y+1.7-ch/2,.3,cw,ch,.012,'cloth',pick(CLOTH));x+=cw+.06}}
  }
  pipe(F,(chance(.5)?-1:1)*(len/2-range(.2,.7)),.1,H);if(chance(.6))pipe(F,range(-len/3,len/3),.1,H-range(0,2));
  if(chance(.8))F.box(range(-len/3,len/3),1.4,.05,.24,.32,.1,'meter');
  wallStuff(F,-len/2,len/2,H);
 }

 // ------------------------------------------------------------ roof
 const roofY=H;
 if(style==='tin'){
  // Corrugated sheet, pitched towards the lane, held down with bricks and an old tyre.
  add('box','tin',0,roofY+.12,-D/2+.2,W+.3,.03,D+.5,0,pick([0x8a8478,0x7d6f5c,0x93897a,0x6f6a62]),.16);
  for(let i=0;i<5;i++)add('box','brickbit',range(-W/2+.2,W/2-.2),roofY+.2,range(-D+.4,-.3),.18,.06,.09,range(0,3));
  if(chance(.6))add('cyl','tyre',range(-W/3,W/3),roofY+.22,range(-D*.7,-.5),.26,.08,.26);
 }else{
  const ph=upper==='old'?.5:.42,pm=style==='brick'?'brick':wallMat;
  for(const [F,l] of [[front,W],[back,W],[left,D],[right,D]]){
   if(upper==='old'&&F===front){const n=Math.max(2,Math.round(W/1.1));for(let i=0;i<=n;i++)F.box(-W/2+.1+(W-.2)*i/n,roofY+ph/2+.05,-.07,.2,ph+.1,.16,pm,wallColour);
    F.box(0,roofY+ph/2,-.07,l-.2,ph-.08,.03,'baluster');F.box(0,roofY+ph,-.07,l,.06,.18,'trim',trim)}
   else{const m=F===front?pm:pm==='brick'?'brick':'cement';F.box(0,roofY+ph/2,-.07,l,ph,.14,m,m==='brick'?undefined:F===front?paint:shade(sidePaint,.95));F.box(0,roofY+ph+.02,-.07,l+.04,.04,.2,'concrete')}
  }
  // Water tank on its stand, the little stair-head room, washing, a dish.
  const tx=range(-W/4,W/4),tz=-D*range(.45,.8);add('box','brick',tx,roofY+.25,tz,.75,.5,.75);add('cyl','tank',tx,roofY+.88,tz,.34,.76,.34);add('cyl','tank',tx,roofY+1.29,tz,.2,.06,.2);
  if(floors>2&&chance(.4))add('cyl','tankc',tx+(tx>0?-1:1)*.9,roofY+.5,tz,.3,.7,.3,0,pick([0x1c1c1e,0x1f4a8a,0xd8d3c4]));
  if(chance(upper==='old'?.6:.35)){const cx=(doorBay===0?-1:1)*(W/2-.85),cz=-D+1,m=wallMat==='brick'?'brick':'plaster';add('box',m,cx,roofY+.85,cz,1.4,1.7,1.5,0,m==='brick'?undefined:shade(paint,.95));add('box','concrete',cx,roofY+1.74,cz,1.6,.08,1.7);add('box','door',cx,roofY+.75,cz+.76,.55,1.45,.02,0,pick(DOOR))}
  if(chance(.55)){const a=-W/2+.3,b=W/2-.3,z=-range(.5,D*.4);for(const x of [a,b])add('cyl','bamboo',x,roofY+.9,z,.02,1.8,.02);add('box','iron',0,roofY+1.6,z,b-a,.01,.01);
   let x=a+.15;while(x<b-.4){const cw=range(.25,.6),ch=range(.4,1);if(chance(.75))add('box','cloth',x+cw/2,roofY+1.6-ch/2,z,cw,ch,.012,0,pick(CLOTH));x+=cw+range(.04,.25)}}
  if(chance(.5)){const dx=range(-W/3,W/3),dz=-range(.3,1);add('cyl','iron',dx,roofY+ph+.25,dz,.015,.5,.015);add('dish','dishgrey',dx,roofY+ph+.55,dz+.05,.3,.3,.3,range(-.6,.6),undefined,-.9)}
  if(style==='brick'){for(let i=0;i<=bays;i++)for(const z of [-.12,-D+.12]){add('box','concrete',-W/2+bw*i,roofY+.45,z,.18,.9,.18);for(const o of [-.05,.05])add('box','iron',-W/2+bw*i+o,roofY+1.15,z+o,.012,.5,.012)}
   if(chance(.5)&&!scenery){for(let x=-W/2+.2;x<=W/2-.1;x+=1.15)front.part('cyl',x,H/2+.3,.45,.03,H+.6,.03,'bamboo');for(let f=1;f<=floors;f++)front.part('cyl',0,floorY(f)-.5,.45,.025,W-.2,.025,'bamboo',undefined,Math.PI/2,Math.PI/2)}}
  for(let i=0;i<2;i++)if(chance(.5))hooks.push({x:range(-W/2+.2,W/2-.2),y:roofY+ph+.06,z:chance(.5)?-.07:-D+.07,ry:0,kind:'crow'});
 }
 return {...lot,seed,style,upper,width:W,depth:D,floors,bays,height:H,paint,trim,parts,decals,solids,hooks,scenery};
}
export function buildingSolids(spec){return spec.solids}
