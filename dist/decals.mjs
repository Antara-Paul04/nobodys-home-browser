// One texture atlas and one mesh for everything that is painted, pasted, spilt or grown on a surface:
// shop signs, posters, wall writing, damp, paan stains, drain grime, potholes, chalk games.
import * as THREE from 'three';
import {seededRandom} from './procedural-buildings.mjs';
const BN='"Bangla Sangam MN","Kohinoor Bangla","Noto Sans Bengali","Nirmala UI","Vrinda",sans-serif',EN='"Gill Sans","Trebuchet MS","Helvetica Neue",Arial,sans-serif';
const WALLTEXT=[['বিজ্ঞাপন মারিবেন না','#1c1c1c'],['STICK NO BILLS','#1c1c1c'],['এখানে আবর্জনা ফেলিবেন না','#7a1a14'],['এখানে আবর্জনা ফেলিবেন না','#1c2c5a'],['এখানে প্রস্রাব করিবেন না','#7a1a14'],['টিউশন পড়ানো হয়','#1c2c5a'],['ঘর ভাড়া দেওয়া হইবে','#1c1c1c'],['সাবধান! কুকুর আছে','#7a1a14']];
const POSTERS=[['আজ মুক্তি','#d8457a'],['বিরাট জলসা','#e3b62a'],['যাত্রাপালা','#2f8fb0'],['কোচিং সেন্টার','#e9e4d2'],['রক্তদান শিবির','#c8372d'],['সার্কাস','#e07a2a'],['হোমিও চিকিৎসা','#8fc27a'],['কম্পিউটার শিক্ষা','#5a7fd0'],
 ['সেল! সেল!','#e3d12a'],['স্পোকেন ইংলিশ','#e9e4d2'],['নববর্ষ মেলা','#d85a3a'],['ফুটবল ম্যাচ','#3f9a5a'],['ম্যাজিক শো','#7a4ab0'],['গানের আসর','#d8457a'],['চাকরি','#e9e4d2'],['বইমেলা','#e3b62a']];
const VOTES=[['লণ্ঠন','#b0281f','lantern'],['ঘুড়ি','#1f5a9a','kite'],['ছাতা','#1f7a4a','umbrella'],['চাকা','#b0281f','wheel'],['ঢাক','#c26a1a','drum'],['সূর্য','#c2901a','sun']];
const PLATES=['শান্তি নিবাস','মাতৃ ভবন','গাঙ্গুলী বাড়ি','আনন্দ কুটির','লক্ষ্মী ভিলা','দত্ত ভবন'];
const SIZE={sign:[320,100],poster:[96,128],walltext:[384,90],vote:[352,160],plate:[192,56],number:[64,42],polenum:[32,80],laneplate:[256,84],wicket:[64,128],
 damp:[128,128],paan:[96,96],crack:[96,160],soot:[96,160],ghunte:[160,112],moss:[160,80],
 edge:[256,96],litter:[192,160],wet:[128,128],patch:[160,128],pothole:[128,96],crackg:[128,128],manhole:[96,96],oil:[160,80],hopscotch:[256,96],alpona:[128,128],chalk:[128,96],bhar:[160,96],petals:[160,96],leaves:[192,192],weeds:[128,96],sandspill:[128,128],coalspill:[160,96]};

function fitText(x,text,maxW,size,font,weight='bold'){do{x.font=`${weight} ${size}px ${font}`;size-=1}while(x.measureText(text).width>maxW&&size>6);return size+1}
function blobs(x,r,n,cx,cy,sx,sy,colour,alpha,rad){ // soft-edged, so stains fade into the surface
 const rgb=[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16)).join(',');
 for(let i=0;i<n;i++){const a=r()*6.28,d=Math.sqrt(r()),px=cx+Math.cos(a)*d*sx,py=cy+Math.sin(a)*d*sy,rr=rad*(.5+r());
  if(rr<5){x.fillStyle=colour;x.globalAlpha=alpha*(.4+r()*.6);x.beginPath();x.ellipse(px,py,rr,rr*(.5+r()*.5),r()*3,0,7);x.fill();continue}
  const g=x.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,`rgba(${rgb},${alpha*(.5+r()*.5)})`);g.addColorStop(1,`rgba(${rgb},0)`);x.globalAlpha=1;x.fillStyle=g;x.fillRect(px-rr,py-rr,rr*2,rr*2)}
 x.globalAlpha=1}
function grime(x,w,h,r,strength=1){for(let i=0;i<30*strength;i++){x.fillStyle=`rgba(${50+r()*30|0},${42+r()*24|0},${26+r()*16|0},${.04+r()*.1})`;x.fillRect(r()*w,r()*h,2+r()*14,6+r()*h*.6)}x.fillStyle=`rgba(40,34,22,${.18*strength})`;x.fillRect(0,h*.82,w,h*.18)}
function scrawl(x,r,x0,y0,x1,y1,steps=6,jitter=10){x.beginPath();x.moveTo(x0,y0);for(let i=1;i<=steps;i++){const t=i/steps;x.lineTo(x0+(x1-x0)*t+(r()-.5)*jitter,y0+(y1-y0)*t+(r()-.5)*jitter)}x.stroke()}

const DRAW={
 sign(x,w,h,r,d){const bg=d.theme||'#8f2a22',light=parseInt(bg.slice(1,3),16)*.3+parseInt(bg.slice(3,5),16)*.59+parseInt(bg.slice(5,7),16)*.11>150;
  x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=light?'#5a2a20':'#d9cfae';x.lineWidth=3;x.strokeRect(5,5,w-10,h-10);
  let tx=w/2,tw=w-28;if(d.key==='med'){x.fillStyle='#1f8a4a';x.fillRect(18,h/2-22,14,44);x.fillRect(3,h/2-7,44,14);tx=w/2+22;tw=w-70}
  x.textAlign='center';x.textBaseline='middle';x.fillStyle=d.key==='med'?'#b0281f':d.key==='std'?'#1a1a1a':light?'#3a1a14':'#f0e6c4';
  fitText(x,d.text[0],tw,44,BN);x.fillText(d.text[0],tx,h*.4);x.fillStyle=d.key==='std'?'#b0281f':light?'#5a3a2a':'#e3c66a';fitText(x,d.text[1],tw,19,EN);x.fillText(d.text[1],tx,h*.78);grime(x,w,h,r)},
 poster(x,w,h,r,d){const [text,bg]=POSTERS[d.v%16];x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=`hsl(${r()*360|0},45%,${28+r()*18|0}%)`;x.fillRect(8,36,w-16,48);
  x.fillStyle='rgba(255,255,255,.75)';x.beginPath();x.arc(w/2,56,13,0,7);x.fill();x.fillRect(w/2-17,68,34,16);
  x.fillStyle='#161616';x.textAlign='center';x.textBaseline='middle';fitText(x,text,w-10,22,BN);x.fillText(text,w/2,19);for(let i=0;i<4;i++)x.fillRect(10+r()*10,92+i*8,w-30-r()*30,3);
  x.fillStyle='#b0281f';x.fillRect(10,h-12,w-20,6);grime(x,w,h,r,1.6);
  if(r()<.7){x.globalCompositeOperation='destination-out';for(let i=0;i<3;i++){x.beginPath();const cx=r()<.5?0:w,cy=r()<.5?0:h;x.moveTo(cx,cy);x.lineTo(cx+(cx?-1:1)*(10+r()*38),cy);x.lineTo(cx,cy+(cy?-1:1)*(10+r()*46));x.fill()}if(r()<.4)x.fillRect(0,40+r()*50,w,5+r()*14);x.globalCompositeOperation='source-over'}},
 walltext(x,w,h,r,d){const [text,colour]=WALLTEXT[d.v%8];if(r()<.6){x.fillStyle='rgba(222,214,190,.78)';x.fillRect(2,6,w-4,h-12)}x.fillStyle=colour;x.globalAlpha=.82;x.textAlign='center';x.textBaseline='middle';fitText(x,text,w-18,46,BN);x.fillText(text,w/2,h/2+2);x.globalAlpha=1;
  x.globalCompositeOperation='destination-out';for(let i=0;i<90;i++){x.globalAlpha=.5;x.fillRect(r()*w,r()*h,1+r()*4,1+r()*3)}x.globalAlpha=1;x.globalCompositeOperation='source-over'},
 vote(x,w,h,r,d){const [name,colour,symbol]=VOTES[d.v%6];x.fillStyle='rgba(226,220,200,.9)';x.fillRect(0,0,w,h);x.strokeStyle=colour;x.lineWidth=7;x.strokeRect(6,6,w-12,h-12);x.fillStyle=x.strokeStyle=colour;const cx=70,cy=h/2;x.lineWidth=6;
  if(symbol==='lantern'){x.fillRect(cx-16,cy-22,32,44);x.fillRect(cx-22,cy+22,44,8);x.beginPath();x.arc(cx,cy-30,14,3.14,0);x.stroke()}
  else if(symbol==='kite'){x.beginPath();x.moveTo(cx,cy-42);x.lineTo(cx+30,cy);x.lineTo(cx,cy+34);x.lineTo(cx-30,cy);x.fill();x.lineWidth=3;scrawl(x,r,cx,cy+34,cx+18,cy+62,5,10)}
  else if(symbol==='umbrella'){x.beginPath();x.arc(cx,cy,38,3.14,0);x.fill();x.fillRect(cx-3,cy,6,40);x.beginPath();x.arc(cx-9,cy+40,9,0,3.14);x.stroke()}
  else if(symbol==='wheel'){x.beginPath();x.arc(cx,cy,36,0,7);x.stroke();for(let i=0;i<8;i++){x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+36*Math.cos(i*.785),cy+36*Math.sin(i*.785));x.stroke()}}
  else if(symbol==='drum'){x.fillRect(cx-24,cy-30,48,60);x.beginPath();x.ellipse(cx,cy-30,24,9,0,0,7);x.fill();x.lineWidth=3;x.strokeStyle='#e2dcc8';for(let i=-2;i<3;i++){x.beginPath();x.moveTo(cx+i*10,cy-26);x.lineTo(cx+i*10+6,cy+28);x.stroke()}}
  else{x.beginPath();x.arc(cx,cy,24,0,7);x.fill();for(let i=0;i<12;i++){x.beginPath();x.moveTo(cx+30*Math.cos(i*.52),cy+30*Math.sin(i*.52));x.lineTo(cx+44*Math.cos(i*.52),cy+44*Math.sin(i*.52));x.stroke()}}
  x.textAlign='center';x.textBaseline='middle';x.fillStyle=colour;fitText(x,name+' চিহ্নে',w-150,40,BN);x.fillText(name+' চিহ্নে',w/2+62,h*.36);x.fillStyle='#1a1a1a';fitText(x,'ভোট দিন',w-150,44,BN);x.fillText('ভোট দিন',w/2+62,h*.7);
  x.globalCompositeOperation='destination-out';for(let i=0;i<260;i++){x.globalAlpha=.55;x.fillRect(r()*w,r()*h,2+r()*8,1+r()*5)}x.globalAlpha=1;x.globalCompositeOperation='source-over';grime(x,w,h,r,1.3)},
 plate(x,w,h,r,d){x.fillStyle='#d8d4c6';x.fillRect(0,0,w,h);x.strokeStyle='#6a6658';x.lineWidth=2;x.strokeRect(3,3,w-6,h-6);x.fillStyle='#1c1c1c';x.textAlign='center';x.textBaseline='middle';fitText(x,PLATES[d.v%6],w-16,30,BN);x.fillText(PLATES[d.v%6],w/2,h/2+1);grime(x,w,h,r,.6)},
 number(x,w,h,r,d){x.fillStyle='#1f3f7a';x.fillRect(0,0,w,h);x.strokeStyle='#e6e6e0';x.lineWidth=2;x.strokeRect(3,3,w-6,h-6);x.fillStyle='#f0f0ea';x.textAlign='center';x.textBaseline='middle';fitText(x,d.text,w-12,26,EN);x.fillText(d.text,w/2,h/2+1);grime(x,w,h,r,.4)},
 polenum(x,w,h,r){x.fillStyle='#d9b62a';x.fillRect(0,0,w,h);x.fillStyle='#1a1a1a';x.fillRect(0,0,w,8);x.fillRect(0,h-8,w,8);x.save();x.translate(w/2,h/2);x.rotate(-Math.PI/2);x.textAlign='center';x.textBaseline='middle';x.font=`bold 15px ${EN}`;x.fillText('KMC '+(10+r()*80|0),0,1);x.restore();grime(x,w,h,r,.8)},
 laneplate(x,w,h,r){x.fillStyle='#1d4f96';x.fillRect(0,0,w,h);x.strokeStyle='#eef0ee';x.lineWidth=3;x.strokeRect(5,5,w-10,h-10);x.fillStyle='#f2f2ee';x.textAlign='center';x.textBaseline='middle';fitText(x,'কালী মিত্র লেন',w-26,34,BN);x.fillText('কালী মিত্র লেন',w/2,h*.36);fitText(x,'KALI MITRA LANE · KOLKATA 6',w-26,15,EN);x.fillText('KALI MITRA LANE · KOLKATA 6',w/2,h*.74);grime(x,w,h,r,.7)},
 wicket(x,w,h,r){x.strokeStyle='rgba(236,234,222,.9)';x.lineWidth=4;for(const cx of [16,32,48])scrawl(x,r,cx,12,cx,h-4,6,3);scrawl(x,r,10,12,54,12,4,3)},
 damp(x,w,h,r){blobs(x,r,34,w/2,h*.6,w*.3,h*.26,'#2c3324',.26,w*.17);blobs(x,r,18,w/2,h*.78,w*.32,h*.12,'#1f2a1c',.3,w*.13)},
 paan(x,w,h,r){blobs(x,r,9,w/2,h*.35,w*.16,h*.14,'#6e1f14',.5,w*.12);x.fillStyle='#6e1f14';for(let i=0;i<5;i++){x.globalAlpha=.55;const px=w*.3+r()*w*.4;x.fillRect(px,h*.4,2+r()*3,h*(.2+r()*.38))}for(let i=0;i<26;i++){x.globalAlpha=.6;x.beginPath();x.arc(r()*w,r()*h*.8,.8+r()*2.2,0,7);x.fill()}x.globalAlpha=1},
 crack(x,w,h,r){x.strokeStyle='rgba(24,22,18,.8)';x.lineWidth=1.6;let px=w*(.3+r()*.4),py=2;x.beginPath();x.moveTo(px,py);while(py<h-6){px+=(r()-.5)*22;py+=6+r()*16;x.lineTo(px,py);if(r()<.2){x.moveTo(px,py);x.lineTo(px+(r()-.5)*40,py+r()*22);x.moveTo(px,py)}}x.stroke()},
 soot(x,w,h,r){for(let i=0;i<9;i++){const px=r()*w,ww=4+r()*18,g=x.createLinearGradient(0,0,0,h*(.5+r()*.5));g.addColorStop(0,'rgba(16,18,14,.55)');g.addColorStop(1,'rgba(16,18,14,0)');x.fillStyle=g;x.fillRect(px,0,ww,h)}},
 ghunte(x,w,h,r){for(let j=0;j<3;j++)for(let i=0;i<5;i++){if(r()<.2)continue;const cx=18+i*31+(j%2)*12,cy=18+j*36,rad=13+r()*3;x.fillStyle=`rgb(${96+r()*26|0},${78+r()*20|0},${46+r()*14|0})`;x.beginPath();x.ellipse(cx,cy,rad,rad*.92,0,0,7);x.fill();x.strokeStyle='rgba(50,40,22,.5)';x.lineWidth=1.5;for(let k=0;k<3;k++){x.beginPath();x.arc(cx,cy,3+k*3.2,r()*3,r()*3+3);x.stroke()}}},
 moss(x,w,h,r){blobs(x,r,160,w/2,h*.7,w*.46,h*.26,'#3f5a2a',.35,3.2);blobs(x,r,60,w/2,h*.8,w*.44,h*.16,'#26381c',.4,4)},
 edge(x,w,h,r){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(22,22,17,.85)');g.addColorStop(.3,'rgba(32,30,22,.46)');g.addColorStop(1,'rgba(34,32,24,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
  blobs(x,r,26,w/2,h*.12,w*.5,h*.14,'#2f3a22',.3,7);for(let i=0;i<120;i++){x.fillStyle=['#191914','#5a5646','#2f3a22','#8a826a'][r()*4|0];x.globalAlpha=.25+r()*.5;x.fillRect(r()*w,r()*r()*h*.8,1+r()*3,1+r()*3)}x.globalAlpha=1},
 litter(x,w,h,r){for(let i=0;i<70;i++){const px=w*.5+(r()-.5)*(r()+.3)*w*.9,py=h*.5+(r()-.5)*(r()+.3)*h*.9,k=r();x.save();x.translate(px,py);x.rotate(r()*6);
   x.globalAlpha=.85;x.fillStyle='rgba(0,0,0,.2)';x.fillRect(.6,.6,4,3);x.fillStyle=k<.4?'#a8a290':k<.5?'#4a6a8f':k<.57?'#b08a90':k<.74?'#6e6040':k<.88?'#8a5a40':'#bdbbae';x.fillRect(0,0,1.5+r()*4.5,1+r()*3.5);x.restore()}x.globalAlpha=1},
 wet(x,w,h,r){blobs(x,r,9,w/2,h/2,w*.14,h*.14,'#1a1c1c',.13,w*.34)},
 patch(x,w,h,r,d){const dark=d.v%2;x.fillStyle=dark?'rgba(52,51,47,.5)':'rgba(158,154,140,.42)';x.beginPath();for(let i=0;i<22;i++){const a=i/22*6.28,rr=.34+r()*.1;x.lineTo(w/2+Math.cos(a)*w*rr,h/2+Math.sin(a)*h*rr)}x.fill();for(let i=0;i<80;i++){x.fillStyle=dark?'#6a685f':'#77746a';x.globalAlpha=.25;x.fillRect(w*.2+r()*w*.6,h*.2+r()*h*.6,1+r()*3,1+r()*3)}x.globalAlpha=1},
 pothole(x,w,h,r){blobs(x,r,22,w/2,h/2,w*.26,h*.24,'#8a8576',.4,12);blobs(x,r,26,w/2,h/2,w*.18,h*.16,'#1c1b18',.7,13);for(let i=0;i<40;i++){x.fillStyle=['#8f8a7a','#5a564c','#a09a88'][r()*3|0];x.fillRect(w*.2+r()*w*.6,h*.2+r()*h*.6,2+r()*4,2+r()*3)}},
 crackg(x,w,h,r){x.strokeStyle='rgba(26,26,22,.5)';x.lineWidth=1;let px=w/2,py=h/2,a=r()*6.28;x.beginPath();x.moveTo(px,py);for(let i=0;i<26;i++){a+=(r()-.5)*.8;px+=Math.cos(a)*4;py+=Math.sin(a)*4;x.lineTo(px,py)}x.stroke()},
 manhole(x,w,h,r){x.fillStyle='#3a3530';x.beginPath();x.arc(w/2,h/2,w*.47,0,7);x.fill();x.fillStyle='#57483a';x.beginPath();x.arc(w/2,h/2,w*.41,0,7);x.fill();x.strokeStyle='#2a2622';x.lineWidth=3;for(let i=-3;i<=3;i++){x.beginPath();x.moveTo(w/2+i*11,h*.16);x.lineTo(w/2+i*11,h*.84);x.stroke()}x.beginPath();x.arc(w/2,h/2,w*.26,0,7);x.stroke();blobs(x,r,14,w/2,h/2,w*.3,h*.3,'#7a4a2a',.25,7)},
 oil(x,w,h,r){blobs(x,r,22,w/2,h/2,w*.3,h*.24,'#0e0f12',.34,w*.14);blobs(x,r,8,w/2,h/2,w*.18,h*.14,'#2a2440',.3,w*.09)},
 hopscotch(x,w,h,r){x.strokeStyle='rgba(238,236,224,.85)';x.lineWidth=3;x.fillStyle='rgba(238,236,224,.85)';x.font=`bold 20px ${EN}`;x.textAlign='center';x.textBaseline='middle';
  [[8,30,40,36,'1'],[50,30,40,36,'2'],[92,10,40,36,'3'],[92,50,40,36,'4'],[134,30,40,36,'5'],[176,10,40,36,'6'],[176,50,40,36,'7']].forEach(([a,b,c,e,n])=>{scrawl(x,r,a,b,a+c,b,3,3);scrawl(x,r,a+c,b,a+c,b+e,3,3);scrawl(x,r,a+c,b+e,a,b+e,3,3);scrawl(x,r,a,b+e,a,b,3,3);x.fillText(n,a+c/2,b+e/2)});x.beginPath();x.arc(232,48,26,-1.57,1.57);x.stroke()},
 alpona(x,w,h,r){x.strokeStyle='rgba(244,242,232,.92)';x.fillStyle='rgba(244,242,232,.92)';x.lineWidth=2.5;const c=w/2;for(const rad of [12,34,56]){x.beginPath();x.arc(c,c,rad,0,7);x.stroke()}
  for(let i=0;i<12;i++){const a=i*.5236;x.beginPath();x.ellipse(c+Math.cos(a)*23,c+Math.sin(a)*23,11,5,a,0,7);x.stroke();x.beginPath();x.ellipse(c+Math.cos(a+.26)*45,c+Math.sin(a+.26)*45,11,6,a+.26,0,7);x.stroke();x.beginPath();x.arc(c+Math.cos(a)*60,c+Math.sin(a)*60,2.5,0,7);x.fill()}},
 chalk(x,w,h,r){x.strokeStyle='rgba(238,236,224,.8)';x.lineWidth=2.5;scrawl(x,r,14,80,14,44,3,3);scrawl(x,r,14,44,40,22,3,3);scrawl(x,r,40,22,66,44,3,3);scrawl(x,r,66,44,66,80,3,3);scrawl(x,r,66,80,14,80,3,3);x.beginPath();x.arc(100,24,13,0,7);x.stroke();for(let i=0;i<8;i++){x.beginPath();x.moveTo(100+17*Math.cos(i*.785),24+17*Math.sin(i*.785));x.lineTo(100+24*Math.cos(i*.785),24+24*Math.sin(i*.785));x.stroke()}
  x.beginPath();x.ellipse(98,68,14,9,0,0,7);x.stroke();x.beginPath();x.arc(114,58,6,0,7);x.stroke();scrawl(x,r,84,66,74,54,3,4)},
 bhar(x,w,h,r){for(let i=0;i<26;i++){const px=r()*w,py=r()*h;x.strokeStyle=x.fillStyle=`rgb(${128+r()*24|0},${78+r()*16|0},${54+r()*12|0})`;x.lineWidth=2;if(r()<.5){x.beginPath();x.arc(px,py,4+r()*5,r()*6,r()*6+2.2);x.stroke()}else x.fillRect(px,py,2+r()*5,2+r()*4)}},
 petals(x,w,h,r){for(let i=0;i<90;i++){x.fillStyle=['#e08a1e','#e9b824','#d4572f','#f0d060'][r()*4|0];x.globalAlpha=.9;x.beginPath();x.ellipse(w*.5+(r()-.5)*(r()+.2)*w,h*.5+(r()-.5)*(r()+.2)*h,1.5+r()*2.5,1+r()*1.5,r()*3,0,7);x.fill()}x.globalAlpha=1},
 leaves(x,w,h,r){for(let i=0;i<110;i++){x.fillStyle=['#7a6a2a','#8a5a2a','#5a6a2a','#9a8a3a','#4a5a26'][r()*5|0];x.globalAlpha=.85;x.beginPath();x.ellipse(w*.5+(r()-.5)*(r()+.25)*w*.95,h*.5+(r()-.5)*(r()+.25)*h*.95,2+r()*4,1+r()*2,r()*3,0,7);x.fill()}x.globalAlpha=1},
 weeds(x,w,h,r){for(let i=0;i<70;i++){x.strokeStyle=['#4a6a2a','#5c8a3a','#3a5522','#7a8a3a'][r()*4|0];x.lineWidth=1+r()*1.5;x.globalAlpha=.9;const px=w*.5+(r()-.5)*(r()+.3)*w*.85,py=h*.5+(r()-.5)*(r()+.3)*h*.8;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+(r()-.5)*10,py-6,px+(r()-.5)*16,py-8-r()*10);x.stroke()}x.globalAlpha=1},
 sandspill(x,w,h,r){blobs(x,r,200,w/2,h/2,w*.4,h*.4,'#b9a67a',.3,3.5)},
 coalspill(x,w,h,r){blobs(x,r,200,w/2,h/2,w*.42,h*.38,'#121212',.4,3)}
};

export function createDecals(){
 const SIZE_PX=2048,canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE_PX;const ctx=canvas.getContext('2d'),regions=new Map();
 let shelfX=2,shelfY=2,shelfH=0,full=false;
 const positions=[],uvs=[],normals=[],indices=[],v=new THREE.Vector3(),e=new THREE.Euler(0,0,0,'YXZ');
 function region(d){
  const id=d.id,key=id+':'+(id==='sign'?d.text.join('|')+d.theme:id==='number'?d.text:(d.v||0));let reg=regions.get(key);if(reg)return reg;
  const [w,h]=SIZE[id];if(shelfX+w+2>SIZE_PX){shelfX=2;shelfY+=shelfH+2;shelfH=0}if(shelfY+h+2>SIZE_PX){if(!full){full=true;console.warn('Decal atlas is full')}return regions.values().next().value}
  const seed=[...key].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);
  ctx.save();ctx.beginPath();ctx.rect(shelfX,shelfY,w,h);ctx.clip();ctx.translate(shelfX,shelfY);DRAW[id](ctx,w,h,seededRandom(seed),d);ctx.restore();
  reg={u0:(shelfX+.5)/SIZE_PX,u1:(shelfX+w-.5)/SIZE_PX,v0:1-(shelfY+.5)/SIZE_PX,v1:1-(shelfY+h-.5)/SIZE_PX};regions.set(key,reg);shelfX+=w+2;shelfH=Math.max(shelfH,h);return reg;
 }
 function quad(reg,corners,normal){const base=positions.length/3;for(const c of corners)positions.push(c.x,c.y,c.z);uvs.push(reg.u0,reg.v0,reg.u1,reg.v0,reg.u1,reg.v1,reg.u0,reg.v1);for(let i=0;i<4;i++)normals.push(normal.x,normal.y,normal.z);indices.push(base,base+2,base+1,base,base+3,base+2)}
 // d: {id, x, y, z, ry, w, h, tilt} on a wall, or {id, ground:true, x, z, w, h, rot, y} on the ground.
 function add(d,parent){
  if(!DRAW[d.id])throw new Error('Unknown decal '+d.id);const reg=region(d),m=new THREE.Matrix4(),corners=[];
  if(d.ground){e.set(0,d.rot||0,0);m.makeRotationFromEuler(e).setPosition(d.x,.0265+(d.y||0),d.z);for(const [a,b] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]])corners.push(new THREE.Vector3(a*d.w,0,b*d.h))}
  else{e.set(0,d.ry||0,d.tilt||0);m.makeRotationFromEuler(e).setPosition(d.x,d.y,d.z);for(const [a,b] of [[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]])corners.push(new THREE.Vector3(a*d.w,b*d.h,0))}
  if(parent)m.premultiply(parent);for(const c of corners)c.applyMatrix4(m);
  v.set(0,d.ground?1:0,d.ground?0:1).transformDirection(m);quad(reg,corners,v.clone());
 }
 function build(scene){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,side:THREE.DoubleSide}));
  mesh.receiveShadow=true;mesh.renderOrder=1;scene.add(mesh);return mesh;
 }
 return {add,build,count:()=>positions.length/12};
}
