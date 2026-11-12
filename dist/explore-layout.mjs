// The free-roam neighbourhood: a North Kolkata para of narrow lanes.
// Everything here is data. One unit is 1.33 m (the authored houses are scaled 0.75 to match the kitten).
//
//   north lane  ─────────────────────────────────────────────  (behind the houses)
//   [shops][corner shop]│[ six authored houses ][ generated ]│[corner]
//   Kali Mitra Lane ══════ chowk ═══════════════════════════════════╡ big road
//   [ ][ ]   tea  │[ thin houses, backs onto the home gali ]         │
//            stall│─── home gali ───────────[HOME]──────────┐ [courtyard]
//   pond / plot   │[ houses ]  window alley [HOME] [houses] │
//                 │─ drain alley ─          [yard]          │
//   ──────────────┴──── back lane ──────────────────────────┴───────╡
import {generateBuilding,buildingSolids} from './procedural-buildings.mjs';
import * as home from './home.mjs';
import streetData from './street-data.mjs';
import houseData from './house-collisions.mjs';
import propData from './props-data.mjs';
import {makeClutter} from './street-clutter.mjs';
export const SCALE=home.SCALE;
export const spawn={x:-1.2,z:-5.7,y:.04};
export const limits={minX:-33.7,maxX:33.6,minZ:-22.25,maxZ:10.05};

// ---------------------------------------------------------------- lanes (walkable strips, for paving and names)
export const lanes=[
 {id:'road',name:'The big road',kind:'tarmac',x0:27.3,x1:36.6,z0:-46,z1:33},
 {id:'footpath',name:'The big road',kind:'paver',x0:25.8,x1:27.3,z0:-46,z1:33},
 {id:'main',name:'Kali Mitra Lane',kind:'asphalt',x0:-34,x1:25.8,z0:-13,z1:-9.6},
 {id:'chowk',name:'The chowk',kind:'asphalt',x0:-26.2,x1:-20.1,z0:-9.6,z1:-6.4},
 {id:'north',name:'Behind the houses',kind:'earth',x0:-34,x1:25.8,z0:-22.4,z1:-20.7},
 {id:'back',name:'The back lane',kind:'cement',x0:-27,x1:25.8,z0:8,z1:10.1},
 {id:'homegali',name:'The home gali',kind:'cement',x0:-20.1,x1:13.9,z0:-6.3,z1:-4.3},
 {id:'g1n',name:'Tube-well gali',kind:'brick',x0:-21.5,x1:-20.1,z0:-20.7,z1:-13},
 {id:'g1s',name:'Tube-well gali',kind:'brick',x0:-21.5,x1:-20.1,z0:-6.4,z1:8},
 {id:'g2n',name:'The short cut',kind:'brick',x0:-7.7,x1:-6.5,z0:-9.6,z1:-6.3},
 {id:'g2',name:'The window alley',kind:'cement',x0:-4.45,x1:-2.77,z0:-4.3,z1:8},
 {id:'g3n',name:'The narrow gali',kind:'cement',x0:8.5,x1:9.6,z0:-9.6,z1:-6.3},
 {id:'g3s',name:'Courtyard gali',kind:'brick',x0:12.7,x1:13.9,z0:-4.3,z1:8},
 {id:'g4',name:'Godown gali',kind:'brick',x0:19.3,x1:20.8,z0:-20.7,z1:-13},
 {id:'drain',name:'The drain alley',kind:'earth',x0:-20.1,x1:-4.45,z0:1.3,z1:2.4},
 {id:'slot',name:'Between the walls',kind:'earth',x0:3.3,x1:12.7,z0:1.7,z1:2.6},
 {id:'homegap',name:'Between the walls',kind:'earth',x0:2.77,x1:3.3,z0:-4.3,z1:8},
 {id:'recess',name:'The back lane',kind:'earth',x0:-2.77,x1:2.77,z0:6.95,z1:8},
 {id:'court',name:'The courtyard',kind:'earth',x0:13.9,x1:21.3,z0:-3.4,z1:2.8},
 {id:'plot',name:'The pond',kind:'earth',x0:-34,x1:-21.5,z0:-5,z1:5.3}
];
export const pond={x:-28.6,z:.5,rx:3.5,rz:2.5};

// ---------------------------------------------------------------- rows of buildings
const FACE={S:0,N:Math.PI,E:Math.PI/2,W:-Math.PI/2},houseNames=Object.keys(houseData);
export const houses=[],lots=[];
// Each row walks along a lane edge. `line` is where the wall faces meet the lane; items are generated lots,
// authored houses ({house:i}) or gaps ({gap:width}: the slits only a cat fits through).
function row(face,line,start,items){
 let t=start;const alongX=face==='S'||face==='N',out=face==='S'||face==='E'?-1:1; // direction a setback pushes the front
 items.forEach((it,index)=>{
  if(it.gap){t+=it.gap;return}
  const before=items[index-1],after=items[index+1],auto=n=>!n?'party':n.gap?'gap':'party';
  if(it.house!==undefined){
   const body=houseData[houseNames[it.house]].solids[0],w=(body.maxX-body.minX)*SCALE;
   const p={i:it.house,angle:FACE[face],width:w,depth:(body.maxZ-body.minZ)*SCALE};
   if(face==='S'){p.x=t-body.minX*SCALE;p.z=line-body.maxZ*SCALE}else{p.x=t+body.maxX*SCALE;p.z=line+body.maxZ*SCALE}
   p.x0=t;p.x1=t+w;p.back=face==='S'?line-p.depth:line+p.depth;houses.push(p);t+=w;return;
  }
  const w=it.w,front=line+out*(it.set||0),c=t+w/2,min=it.min||auto(before),max=it.max||auto(after);
  const lot={...it,width:w,depth:it.d,angle:FACE[face],face,x:alongX?c:front,z:alongX?front:c,
   left:face==='S'||face==='W'?min:max,right:face==='S'||face==='W'?max:min,back:it.back||'party',seed:4001+lots.length*97};
  delete lot.w;delete lot.d;delete lot.min;delete lot.max;delete lot.set;lots.push(lot);t+=w;
 });
}
// North row: the sweet shop and grocery, then the six authored houses in their original order.
row('S',-15.3,-33.6,[{w:6.1,d:5.4,style:'flat',floors:3,back:'open',name:'Godown'}]);
row('S',-13,-27.3,[{house:3},{gap:1.75},{house:0},{gap:.35},{house:1},{gap:.3},{house:2},{gap:.4},{house:4},{gap:.3},{house:5},{gap:.35},
 {w:3.95,d:6.6,style:'old',floors:2,back:'open',set:.1},{w:3.4,d:7.2,style:'brick',floors:4,back:'open'},{gap:.4},
 {w:3.8,d:6.9,style:'shop',floors:3,back:'open',set:.08,shops:[['সেন মেডিক্যাল','SEN MEDICAL HALL','med'],['জেরক্স • STD • PCO','XEROX','std']]},
 {w:3.7,d:7.4,style:'flat',floors:3,back:'open',max:'open'},{gap:1.5},
 {w:5,d:7.7,style:'shop',floors:4,back:'open',min:'open',max:'open',shops:[['নিউ ক্যালকাটা বেকারি','NEW CALCUTTA BAKERY','red'],['বাটা','SHOE STORES','blue'],['ঘোষ ডেয়ারি','GHOSH DAIRY','green']]}]);
// West end of the main lane and the chowk.
row('N',-9.6,-33.8,[{w:3.9,d:4.6,style:'old',floors:2,back:'open'},{w:3.7,d:4.6,style:'flat',floors:3,back:'open',max:'open'}]);
row('N',-6.4,-26.2,[{w:4.7,d:4.2,style:'shop',floors:2,back:'open',max:'open',shops:[['হোমিও হল','HOMEO HALL','cream'],['ভাই ভাই সেলুন','BHAI BHAI SALOON','blue']]}]);
// Middle row: thin houses whose fronts face the main lane and whose backs face the home gali.
row('N',-9.6,-20.1,[{w:3.5,d:3.3,style:'shop',floors:3,back:'open',min:'open',shops:[['মা তারা ভাণ্ডার','MAA TARA BHANDAR','red'],['কয়লা ও কেরোসিন','COAL DEPOT','black']]},
 {w:3.2,d:3.3,style:'old',floors:2,back:'open'},{gap:.35},{w:2.85,d:3.3,style:'flat',floors:3,back:'open'},
 {w:2.5,d:3.3,style:'tin',floors:1,back:'open',max:'open',shops:[['লক্ষ্মী লন্ড্রি','IRONING • DRY CLEAN','blue']]},{gap:1.2},
 {w:3.9,d:3.3,style:'old',floors:3,back:'open',min:'open'},{w:3.2,d:3.3,style:'flat',floors:3,back:'open',set:.12},
 {w:3.8,d:3.3,style:'shop',floors:2,back:'open',shops:[['দত্ত সাইকেল','CYCLE REPAIRING','green'],['নিউ ফ্যাশন টেলার্স','TAILORS','red']]},
 {w:4.1,d:3.3,style:'brick',floors:3,back:'open',max:'open'},{gap:1.1},{w:4.3,d:3.3,style:'old',floors:2,back:'open',min:'open'},
 {w:3.8,d:6.2,style:'flat',floors:4,back:'open',min:'open'},{w:3.8,d:6.2,style:'old',floors:3,back:'open'},
 {w:4.3,d:6.2,style:'shop',floors:3,back:'open',max:'open',shops:[['বোস ইলেকট্রিক','BOSE ELECTRIC','blue'],['পান • বিড়ি • সিগারেট','COLD DRINKS','red']]}]);
// Home row, either side of the furnished home (which sits at x −2.8…2.8, z −4.3…7).
row('N',-4.3,-20.1,[{w:4.2,d:5.6,style:'brick',floors:3,back:'open',min:'open'},{w:3.65,d:5.6,style:'old',floors:2,back:'open'},{gap:.35},
 {w:3.5,d:5.6,style:'flat',floors:3,back:'open'},{w:3.95,d:5.6,style:'old',floors:2,back:'open',max:'open',set:.06}]);
row('N',-4.3,3.3,[{w:4.3,d:6,style:'old',floors:3,back:'open',min:'gap'},{w:5.1,d:6,style:'flat',floors:4,back:'open',max:'open'}]);
// Back lane, north side.
row('S',8,-26.6,[{w:5.1,d:2.7,style:'tin',floors:1,back:'open',max:'open',shops:[['সাইকেল সারাই','PUNCTURE • AIR','yellow'],['','','shut']]}]);
row('S',8,-20.1,[{w:3.9,d:5.6,style:'flat',floors:3,back:'open',min:'open'},{w:3.6,d:5.6,style:'old',floors:2,back:'open'},{gap:.35},
 {w:3.95,d:5.6,style:'brick',floors:3,back:'open'},{w:3.85,d:5.6,style:'old',floors:2,back:'open',max:'open'}]);
row('S',8,3.3,[{w:4.8,d:5.4,style:'flat',floors:3,back:'open',min:'gap'},{w:4.6,d:5.4,style:'old',floors:3,back:'open',max:'open'}]);
row('S',8,13.9,[{w:4,d:5.2,style:'old',floors:2,back:'open',min:'open'},{w:3.9,d:5.2,style:'flat',floors:3,back:'open'},
 {w:4,d:5.2,style:'shop',floors:3,back:'open',max:'open',shops:[['কালী মিষ্টান্ন','SWEETS & SNACKS','red'],['মোবাইল রিচার্জ','MOBILE RECHARGE','yellow']]}]);
// Courtyard: one house faces west into it.
row('W',21.3,-3.4,[{w:6.2,d:4.5,style:'old',floors:2,back:'open',name:'Courtyard house'}]);
// Back lane, south side: taller, to close the view.
row('N',10.1,-27,[{w:4.4,d:6,style:'flat',floors:3},{w:3.7,d:6,style:'old',floors:3},{w:3.5,d:6,style:'brick',floors:4},{gap:.35},
 {w:4.15,d:6,style:'shop',floors:3,shops:[['সেন স্টোর্স','GENERAL STORES','green'],['','','shut']]},{w:3.9,d:6,style:'old',floors:2},{w:3.4,d:6,style:'flat',floors:4},
 {w:4.5,d:6,style:'old',floors:3},{w:3.4,d:6,style:'tin',floors:1,shops:[['চা','TEA','red']]},{gap:.35},{w:4.25,d:6,style:'flat',floors:3},
 {w:3.5,d:6,style:'brick',floors:3},{w:4.2,d:6,style:'old',floors:3},{w:3.8,d:6,style:'flat',floors:4},
 {w:5.4,d:6,style:'shop',floors:3,max:'open',shops:[['পাল ফার্মেসি','PAL PHARMACY','med'],['বই • খাতা','BOOKS & STATIONERY','cream'],['','','shut']]}]);
// Things you only see: the dead end of the main lane, roofs beyond the north wall, the far side of the big road.
row('E',-34,-13.4,[{w:4.2,d:3,style:'flat',floors:3,name:'Dead end',scenery:true}]);
row('E',-27,7.5,[{w:2.8,d:3,style:'brick',floors:2,scenery:true}]);
row('S',-23,-33,['flat','old','brick','flat','old','flat','old','brick','flat','old','flat','old'].map((style,i)=>({w:4.6+(i%3)*.5,d:4,style,floors:3+(i%2),scenery:true})));
row('E',25.8,-45,['flat','shop','old','flat','shop'].map((style,i)=>({w:4.48,d:4,style,floors:3+(i%2),scenery:true,shops:style==='shop'?[['','','shut'],['','','shut']]:undefined})));
row('E',25.8,16.1,['old','shop','flat'].map((style,i)=>({w:5.3,d:4,style,floors:3,scenery:true,shops:style==='shop'?[['','','shut'],['','','shut']]:undefined})));
// The far side of the big road is the long red British-era block (an exported model, see `assets`).
export const proceduralBuildings=lots.map(lot=>generateBuilding(lot.seed,lot));

// ---------------------------------------------------------------- authored shops and exported street props
export const props=[
 {name:'SweetShop',x:-31.9,z:-13.94,angle:0},{name:'Grocery',x:-28.95,z:-13.94,angle:0},
 {name:'TeaShop',x:-23.1,z:-7.45,angle:Math.PI},{name:'PaanKiosk',x:-18.9,z:-10.3,angle:Math.PI}
];
// angle 0 leaves a vehicle pointing west (−x), as modelled.
export const assets=[
 {name:'Taxi',x:-13.4,z:-10.75,angle:Math.PI+.03},{name:'Rickshaw',x:2.2,z:-10.4,angle:.06},{name:'CycleVan',x:-24.6,z:-10.15,angle:Math.PI-.08},
 {name:'HandPump',x:-22.5,z:.9,angle:Math.PI},{name:'HandPump',x:16.6,z:-.4,angle:Math.PI/2},{name:'Phuchka',x:23.6,z:-10.35,angle:Math.PI},
 {name:'FruitCart',x:26.55,z:-8.1,angle:Math.PI/2},{name:'Bins',x:26.2,z:5.2,angle:Math.PI/2},
 {name:'Auto',x:28.35,z:-15.6,angle:Math.PI/2+.05},{name:'Taxi',x:28.25,z:2.4,angle:-Math.PI/2+.02},{name:'Minibus',x:29.1,z:-2.9,angle:-Math.PI/2},
 {name:'Tram',x:31.9,z:-11.5,angle:Math.PI/2},{name:'Bus',x:33.4,z:6.5,angle:-Math.PI/2},{name:'BusShelter',x:26.55,z:-3.2,angle:-Math.PI/2},
 {name:'TridentLamp',x:26.9,z:-19.4,angle:Math.PI/2},{name:'TridentLamp',x:26.9,z:9.9,angle:Math.PI/2},{name:'LampPost',x:27.05,z:-6.1,angle:-Math.PI/2},{name:'LampPost',x:27.05,z:4,angle:-Math.PI/2},
 // Inside the para: the blue-and-white lamp posts, trident lamps, bins and the shrine tree.
 {name:'LampPost',x:-30.2,z:-10.25,angle:Math.PI},{name:'LampPost',x:17,z:-10.3,angle:Math.PI},{name:'LampPost',x:-9.2,z:9.5,angle:Math.PI},
 {name:'TridentLamp',x:-26,z:-9.78,angle:0},{name:'TridentLamp',x:14.45,z:1.05,angle:Math.PI/2},{name:'Bins',x:.1,z:7.25,angle:0},{name:'ShrineTree',x:19.3,z:1.1,angle:Math.PI/2},
 {name:'Auto',x:29.2,z:8.6,angle:-Math.PI/2-.04},{name:'RedBlock',x:46.4,z:-6,angle:-Math.PI/2}
];
// Seeded trees: [kind, x, z, seed, scale]. Trunks are solid; canopies are above everything.
export const trees=[
 ['banyan',-25.35,-8.35,3,.62],['neem',-23.4,3.9,41,.55],['coconut',-32.2,-3.4,91,.62],['coconut',-25.6,-2.9,93,.6],['krishnachura',-27.6,-3.95,24,.5],
 ['supari',-33,3.6,101,.6],['banana',-31.6,4.2,111,.62],['banana',-24.2,-.6,112,.6],['banana',20.2,-2.4,113,.55],['bamboo',-32.6,-1.2,121,.6],
 ['peepal',-1.2,7.45,12,.42],['mango',-9.8,-19.6,51,.5],['jackfruit',6.3,-20.2,61,.48],['neem',-17.6,-20.2,43,.45],['coconut',1.6,-19.8,94,.6],['supari',-13.3,-20.1,102,.55],
 ['peepal',-33.25,-12.55,13,.42],['radhachura',19.52,-13.7,33,.42],['neem',13.62,-4.62,44,.4],['kadam',24.95,8.22,82,.42],
 // Footpath trees in blue-and-white guards, and a row in front of the red block.
 ['radhachura',26.6,-13.7,31,.5],['kadam',26.6,7.2,81,.5],['krishnachura',26.6,-21.6,23,.5],['neem',26.6,14,42,.5],['radhachura',26.6,-30,32,.5],['krishnachura',26.6,22,21,.5],
 ['krishnachura',35.3,-26,25,.58],['radhachura',35.3,-16.5,34,.55],['neem',35.3,4.5,45,.58],['krishnachura',35.3,14.5,26,.55],['radhachura',35.3,24,35,.55],
 // Palms rising behind the houses and beyond the west wall.
 ['coconut',-20,17.6,95,.95],['coconut',-6,17.9,96,.95],['coconut',9,17.6,97,.95],['coconut',18,18.1,98,.9],['supari',2,17.7,103,.9],['coconut',-35.4,-2,99,.9],['coconut',-35.6,3.2,100,.85],['bamboo',-35.5,-6.8,122,.8]
];
export const trunkRadius={banyan:.42,krishnachura:.17,neem:.16,coconut:.13,supari:.06,banana:.12,bamboo:.3,peepal:.15,radhachura:.15,kadam:.16,mango:.2,jackfruit:.2};
// Boundary and yard walls: [x, y, z, width, height, depth, material].
export const walls=[
 [-4,1.1,-22.5,60,2.2,.2,'cement'],[-34.05,1.3,-11.3,.2,2.6,24,'cement'],[-34.05,1,.2,.2,2,11,'brick'],[-30.3,1,5.4,7.6,2,.2,'brick'],
 [-21.5,.55,-1.2,.16,1.1,2,'brick'],[-21.5,.55,3.65,.16,1.1,3.3,'brick'],                       // broken plot wall along the gali, with a gap
 [13.97,.85,-2.35,.14,1.7,2.1,'plaster'],[13.97,.85,1.7,.14,1.7,2.2,'plaster'],[13.97,2,-.35,.14,.5,1.9,'plaster'], // courtyard gateway
 [-27.1,1,9.05,.2,2,2.1,'cement'],
 // Back yards of the authored houses, each with a slit left for the cat.
 [-24.6,.75,-20.62,5.3,1.5,.12,'brick'],[-17.8,.75,-20.62,4.4,1.5,.12,'cement'],[-13.2,.75,-20.62,3.3,1.5,.12,'brick'],[-8.85,.75,-20.62,3.9,1.5,.12,'cement'],[1.4,.75,-20.62,4.6,1.5,.12,'brick'],
 [27.22,.62,-17.6,.05,.44,6.6,'rail'],[27.22,.62,-4.6,.05,.44,8,'rail'],[27.22,.62,4.3,.05,.44,6.4,'rail'],
 // Blue-and-white railing round the pond, open at the ghat steps.
 [-32.6,.62,.5,.05,.44,6.2,'rail'],[-28.65,.62,-2.6,7.9,.44,.05,'rail'],[-28.65,.62,3.6,7.9,.44,.05,'rail'],[-24.7,.62,-1.65,.05,.44,1.9,'rail'],[-24.7,.62,2.65,.05,.44,1.9,'rail'],
 // The long railing in front of the red block, open at its steps.
 [35.95,.62,-27,.05,.44,31,'rail'],[35.95,.62,14.5,.05,.44,31,'rail'],
 // Tree guards on the footpath.
 ...[-13.7,7.2,-21.6].flatMap(z=>[[26.6,.62,z-.45,.9,.44,.05,'rail'],[26.6,.62,z+.45,.9,.44,.05,'rail'],[26.15,.62,z,.05,.44,.9,'rail'],[27.05,.62,z,.05,.44,.9,'rail']])
];
export const bollards=[[26.4,-13.2],[26.9,-13.2],[26.4,-9.4],[26.9,-9.4],[26.4,7.85],[26.9,7.85],[26.4,10.25],[26.9,10.25],[-20.8,-13.15],[19.6,-12.85],[20.5,-12.85]];
export const poles=[[-30.6,-12.45],[-21.62,-12.7],[-12.3,-10.05],[-2.6,-12.05],[6.4,-10.05],[15.8,-12.05],[24.9,-10],[-9.2,-6.15],[7.2,-6.15],[-14.2,8.15],[-2.2,9.95],[10.2,8.15],[21.2,9.95],[-21.3,-1.6],[13.74,3.4]];
export const benches=[[18.6,.3,2.45,1.4,.07,.3],[2.6,.3,9.78,1.3,.07,.3]];
export const clutter=makeClutter({lanes,buildings:proceduralBuildings,houses,poles,trees,benches,pond});

// ---------------------------------------------------------------- collision
export function transformSolid(s,p,scale=SCALE){
 const c=Math.cos(p.angle||0),sn=Math.sin(p.angle||0),corners=[[s.minX,s.minZ],[s.maxX,s.minZ],[s.minX,s.maxZ],[s.maxX,s.maxZ]].map(([x,z])=>[p.x+scale*(c*x+sn*z),p.z+scale*(-sn*x+c*z)]);
 return {minX:Math.min(...corners.map(a=>a[0])),maxX:Math.max(...corners.map(a=>a[0])),minZ:Math.min(...corners.map(a=>a[1])),maxZ:Math.max(...corners.map(a=>a[1])),bottom:s.bottom*scale,top:s.top*scale};
}
// Exported props collide as a few simple boxes: a car is one box, a cart is its table.
export function assetSolids(a){
 const b=propData[a.name].bounds,box=(minX,maxX,minZ,maxZ,bottom,top)=>transformSolid({minX,maxX,minZ,maxZ,bottom,top},a);
 switch(a.name){
  case 'Rickshaw':return [box(b.minX+1.9,b.maxX,b.minZ,b.maxZ,0,1.3)];                     // the shafts stay walkable
  case 'CycleVan':return [box(b.minX+1.6,b.maxX,b.minZ,b.maxZ,.3,1.2),box(b.minX,b.minX+.7,-.1,.1,0,1)];
  case 'HandPump':return [box(-.6,.6,-.5,.5,0,.2),box(-.12,.12,-.12,.12,0,1.2)];
  case 'Phuchka':return [box(-.5,.5,-.5,.5,.9,1.4),box(-.08,.08,-.08,.08,0,1)];
  case 'FruitCart':return [box(-.95,.95,-.6,.6,.25,1.1)];
  case 'BusShelter':return [box(b.minX,b.maxX,b.maxZ-.15,b.maxZ,.5,2.6),box(b.minX+.2,b.maxX-.2,-.3,.3,.3,.5)];
  case 'TridentLamp':case 'LampPost':return [box(-.2,.2,-.2,.2,0,4)];
  case 'RedBlock':return [];
  case 'ShrineTree':return [box(-.5,.5,-.5,.5,0,4),box(-.9,.9,.4,1.4,0,.45)];
  default:return [box(b.minX,b.maxX,b.minZ,b.maxZ,0,b.top)];
 }
}
export function makeCollisionWorld(){
 const solids=home.solids.map(s=>({...s})),sourceHouses=Object.values(houseData);
 for(const p of houses){for(const s of sourceHouses[p.i].solids)solids.push(transformSolid(s,p));
  // These exterior-only houses have no authored playable rooms. Close their shell below roof level.
  const parts=sourceHouses[p.i].solids,body=parts[0];
  solids.push(transformSolid({minX:body.minX+.22,maxX:body.maxX-.22,minZ:body.minZ+.1,maxZ:body.maxZ-.3,bottom:0,top:2.5},p));
 }
 for(const p of proceduralBuildings)if(!p.scenery)for(const s of buildingSolids(p))solids.push(transformSolid(s,p,1));
 for(const p of props)for(const s of streetData[p.name].solids)solids.push(transformSolid(s,p));
 for(const a of assets)solids.push(...assetSolids(a));
 for(const [x,y,z,w,h,d] of [...walls,...benches])solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom:y-h/2,top:y+h/2});
 // The raised footpath of the big road is stepable; the pond is not for kittens.
 solids.push({minX:25.8,maxX:27.3,minZ:-46,maxZ:33,bottom:0,top:.09});
 solids.push({minX:pond.x-pond.rx*.8,maxX:pond.x+pond.rx*.8,minZ:pond.z-pond.rz*.8,maxZ:pond.z+pond.rz*.8,bottom:-1,top:1.6});
 solids.push({minX:pond.x-pond.rx,maxX:pond.x+pond.rx,minZ:pond.z-pond.rz*.45,maxZ:pond.z+pond.rz*.45,bottom:-1,top:1.6});
 for(const [kind,x,z,,scale] of trees){const r=trunkRadius[kind]*(scale/.6);solids.push({minX:x-r,maxX:x+r,minZ:z-r,maxZ:z+r,bottom:0,top:3})}
 solids.push({minX:-26.05,maxX:-24.65,minZ:-9.05,maxZ:-7.65,bottom:0,top:.3});               // the shrine platform round the banyan
 for(const [x,z] of bollards)solids.push({minX:x-.06,maxX:x+.06,minZ:z-.06,maxZ:z+.06,bottom:0,top:.7});
 for(const [x,z] of poles)solids.push({minX:x-.07,maxX:x+.07,minZ:z-.07,maxZ:z+.07,bottom:0,top:5});
 for(const b of benches)for(const dx of [-.5,.5])solids.push({minX:b[0]+dx-.03,maxX:b[0]+dx+.03,minZ:b[2]-.12,maxZ:b[2]+.12,bottom:0,top:.28});
 for(const c of clutter.solids)solids.push(c);
 const grid=new Map(),cell=1.5,r=home.RADIUS;
 for(const s of solids){for(let x=Math.floor((s.minX-r)/cell);x<=Math.floor((s.maxX+r)/cell);x++)for(let z=Math.floor((s.minZ-r)/cell);z<=Math.floor((s.maxZ+r)/cell);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s)}}
 const at=(x,z)=>grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
 const overlaps=(s,x,z)=>{const dx=Math.max(s.minX-x,0,x-s.maxX),dz=Math.max(s.minZ-z,0,z-s.maxZ);return dx*dx+dz*dz<r*r};
 return {solids,
 nearby(x,z,radius=6){const found=new Set();for(let a=Math.floor((x-radius)/cell);a<=Math.floor((x+radius)/cell);a++)for(let b=Math.floor((z-radius)/cell);b<=Math.floor((z+radius)/cell);b++)for(const s of grid.get(a+','+b)||[])found.add(s);return [...found]},
 valid(x,z,y,step=true){return x>=limits.minX&&x<=limits.maxX&&z>=limits.minZ&&z<=limits.maxZ&&!at(x,z).some(s=>overlaps(s,x,z)&&y+home.HEIGHT>s.bottom+.02&&y<s.top-(step?home.STEP:.02))},
 ground(x,z,y){let h=.025;for(const s of at(x,z))if(overlaps(s,x,z)&&s.top<=y+home.STEP+.001)h=Math.max(h,s.top);return h},
 landing(x,z,oldY,newY){let top=newY<=.025?.025:null;for(const s of at(x,z))if(overlaps(s,x,z)&&s.top<=oldY+.03&&s.top>=newY&&(top===null||s.top>top))top=s.top;return top},
 ceiling(x,z,oldY,newY){let y=newY;for(const s of at(x,z))if(overlaps(s,x,z)&&s.bottom>=oldY+home.HEIGHT-.03&&s.bottom<y+home.HEIGHT)y=s.bottom-home.HEIGHT;return y}
 };
}
export function areaName(x,z){
 if(home.inside(x,z))return 'Home';
 let best=null;for(const l of lanes)if(x>=l.x0&&x<=l.x1&&z>=l.z0&&z<=l.z1&&(!best||(l.x1-l.x0)*(l.z1-l.z0)<(best.x1-best.x0)*(best.z1-best.z0)))best=l;
 return best?best.name:'The old neighbourhood';
}
