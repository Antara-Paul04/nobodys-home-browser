// Persistent, renderer-independent story and survival rules.
export const HOUR_SECONDS=120;
export const DEFAULT_STORY={day:1,hour:8.5,energy:85,homeFood:2,homeWater:3,streetFood:2,porchFood:1,streetWater:3,darkFood:1,inDark:false,darkAwake:false,visitedDark:false,radioHeard:false,visitorSeen:false,visitorDone:false,nightWarning:false,outsideFood:false,outsideWater:false,returnedHome:false,noiseLesson:false,dangerLearned:false,seenInfected:false,chapterComplete:false,hidden:false};
export function normaliseState(saved={}){
 const s={...DEFAULT_STORY,...saved};
 for(const [k,low,high] of [['day',1,999],['hour',0,23.999],['energy',0,100],['homeFood',0,2],['homeWater',0,3],['streetFood',0,2],['porchFood',0,1],['streetWater',0,3],['darkFood',0,1]]){
  if(typeof s[k]!=='number'||!Number.isFinite(s[k]))s[k]=DEFAULT_STORY[k];s[k]=Math.max(low,Math.min(high,s[k]));
 }
 s.hidden=false;return s;
}
export function period(s){return s.hour>=19||s.hour<5.5?'night':s.hour>=17?'evening':'morning'}
export function advanceTime(s,seconds){
 const events=[];let prev=s.hour;let hours=seconds/HOUR_SECONDS;
 while(hours>0){const step=Math.min(hours,24-s.hour);s.hour+=step;hours-=step;if(s.hour>=24){s.hour=0}}
 // Dawn is a world transition, not a visible countdown or an objective.
 if((prev<5.5&&s.hour>=5.5)||(prev>=5.5&&s.hour<prev&&s.hour>=5.5)){dawn(s);events.push('dawn')}
 if(s.day===1&&!s.visitorDone&&!s.nightWarning&&s.hour>=22.5){s.nightWarning=true;events.push('visitor')}
 s.energy=Math.max(0,s.energy-seconds*.012);return events;
}
export function dawn(s){s.day++;if(s.day>=2)s.homeFood=0;if(s.day>=3)s.homeWater=0;s.hidden=false}
export function takeResource(s,id){if(!(id in s)||s[id]<=0)return false;s[id]--;if(id==='streetFood'||id==='porchFood'||id==='darkFood')s.outsideFood=true;if(id==='streetWater')s.outsideWater=true;return true}
export function sleep(s,insideHome){
 if(s.hour<18.5&&s.hour>=5.5&&s.energy>55)return {ok:false,reason:'Not sleepy yet.'};
 if(s.day===1&&insideHome&&!s.visitorDone){s.hour=2.6;s.energy=Math.min(100,s.energy+25);s.nightWarning=true;return {ok:true,event:'visitor'}}
 s.visitorDone=true;s.hour=7.4;dawn(s);s.energy=Math.min(100,s.energy+65);
 if(insideHome&&s.outsideFood)s.returnedHome=true;
 const lessons=[s.outsideFood,s.outsideWater,s.dangerLearned,s.noiseLesson,s.returnedHome,(s.seenInfected||s.radioHeard||s.tv||s.visitedDark)];
 if(s.day>=3&&lessons.filter(Boolean).length>=4)s.chapterComplete=true;
 return {ok:true,event:s.chapterComplete?'chapter':'dawn'};
}
export function guidance(s){
 if(!s.owner&&!s.outside)return ['Where is everyone?','The house is quiet. Look around for your person.'];
 if(s.day===1&&!s.ate&&!s.outside&&s.homeFood>0)return ['Breakfast first','There is food where it always is.'];
 if(!s.outside)return ['A little fresh air','The front door is shut. Perhaps the open window?'];
 if(s.day>=2&&!s.outsideFood)return ['An empty bowl','The familiar bowl is bare. Follow the smell of food outside.'];
 if(s.day>=2&&!s.outsideWater&&s.water<50)return ['Looking for water','A dripping tap or a puddle might help.'];
 if(period(s)==='night'&&!s.visitorDone)return ['Something at the window','Find a quiet place. The bed offers shelter.'];
 if(s.chapterComplete)return ['Still here','The neighbourhood is changing. Keep exploring.'];
 return ['The quiet neighbourhood','Explore, find food and water, and return somewhere safe when tired.'];
}
// Matches the Unity prototype: critical needs slow the cat rather than killing it.
export function movementMultiplier(s){let speed=1;if(s.food<15)speed-=.22;if(s.water<15)speed-=.14;if(s.energy<15)speed-=.14;return Math.max(.4,Math.min(1,speed))}
