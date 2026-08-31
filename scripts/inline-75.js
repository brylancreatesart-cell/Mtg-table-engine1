
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGQuickActions=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase56-quick-actions-1';
const BASE=Object.freeze([
 {id:'tokens',label:'Create Tokens',kind:'tokens',phases:['main','combat'],base:24},
 {id:'counter',label:'Add Counter',kind:'counter',phases:['main','combat','other'],base:22},
 {id:'life',label:'Record Life Gain',kind:'life-gain',phases:['main','other'],base:18},
 {id:'poison',label:'Record Poison',kind:'poison',phases:['combat','main'],base:18},
 {id:'storm',label:'Track Storm',kind:'storm',phases:['main','other'],base:20},
 {id:'energy',label:'Track Energy',kind:'energy',phases:['main','other'],base:16},
 {id:'experience',label:'Track Experience',kind:'experience',phases:['main','other'],base:16},
 {id:'proliferate',label:'Proliferate',kind:'proliferate',phases:['main'],base:18},
 {id:'dungeon',label:'Venture / Dungeon',kind:'dungeon',phases:['main','combat'],base:16},
 {id:'monarch',label:'Monarch',kind:'monarch',phases:['combat','main'],base:14},
 {id:'daynight',label:'Day / Night',kind:'day-night',phases:['main','other'],base:12},
 {id:'calc',label:'Review Calculation',kind:'calculation',phases:['main','combat','other'],base:10},
 {id:'permanent',label:'Add Manual Permanent',kind:'manual',phases:['main'],base:8}
]);
function phaseGroup(phase=''){if(typeof MTGTurnStructure!=='undefined')return MTGTurnStructure.group(phase);let p=String(phase).toUpperCase();if(p.includes('COMBAT')||p.includes('DECLARE'))return'combat';if(p.includes('MAIN'))return'main';return'other'}
function capKinds(profile={}){return new Set((profile.capabilities||[]).map(x=>String(x.kind||'')))}
function recentKinds(events=[]){let out=new Map();for(const e of (events||[]).slice(-12)){let text=(String(e.type||'')+' '+JSON.stringify(e.payload||{})).toLowerCase();for(const a of BASE){if(text.includes(a.kind)||text.includes(a.id)||text.includes(a.label.toLowerCase().split(' ')[0]))out.set(a.kind,(out.get(a.kind)||0)+1)}}return out}
function archetype(profile={}){let kinds=capKinds(profile),tags=[];if(kinds.has('tokens'))tags.push('Token');if(kinds.has('counter')||kinds.has('proliferate'))tags.push('Counters');if(kinds.has('life-gain'))tags.push('Lifegain');if(kinds.has('storm'))tags.push('Spellslinger');if(kinds.has('poison'))tags.push('Poison');if(kinds.has('energy'))tags.push('Energy');if(kinds.has('dungeon'))tags.push('Dungeon');return tags}
function rank({profile={},state={},playerId,limit=6}={}){const kinds=capKinds(profile),recent=recentKinds(state.events||[]),pg=phaseGroup(state.phase),stackActive=Array.isArray(state.stack)&&state.stack.length>0,active=Number(state.active)===Number(playerId),out=[];
 for(const a of BASE){let supported=a.kind==='manual'||a.kind==='calculation'||kinds.has(a.kind);if(!supported)continue;let score=a.base,reasons=[];if(kinds.has(a.kind)){score+=40;reasons.push('loaded deck uses this mechanic')}if(a.phases.includes(pg)){score+=10;reasons.push('fits current phase')}if(recent.has(a.kind)){score+=Math.min(15,recent.get(a.kind)*5);reasons.push('recently used')}if(active&&pg==='main'&&['tokens','counter','storm','energy','proliferate'].includes(a.kind))score+=5;if(stackActive&&a.kind==='calculation')score+=18;if(!active&&pg==='other'&&['tokens','permanent','storm'].includes(a.kind))score-=8;out.push({...a,score,reasons,visibility:'private'})}
 return out.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label)).slice(0,Math.max(1,Number(limit)||6));}
function publicSummary(items=[]){return (items||[]).map(x=>({id:x.id,label:x.label,kind:x.kind}));}
function localQA(){let profile={capabilities:[{kind:'tokens'},{kind:'counter'},{kind:'life-gain'}]},state={active:1,phase:'MAIN 1',stack:[],events:[]},r=rank({profile,state,playerId:1});let checks=[];checks.push(['deck mechanic ranks',r.some(x=>x.kind==='tokens')]);checks.push(['main-phase token action ranks highly',r[0].kind==='tokens'||r[1]?.kind==='tokens']);checks.push(['unsupported poison stays hidden',!r.some(x=>x.kind==='poison')]);checks.push(['manual permanent remains fallback',rank({profile:{capabilities:[]},state,playerId:1,limit:10}).some(x=>x.kind==='manual')]);checks.push(['calculation remains safe fallback',rank({profile:{capabilities:[]},state,playerId:1,limit:10}).some(x=>x.kind==='calculation')]);checks.push(['all suggestions are private',r.every(x=>x.visibility==='private')]);checks.push(['public summary strips reasons',!('reasons'in publicSummary(r)[0])]);checks.push(['archetype detects tokens',archetype(profile).includes('Token')]);return{ok:checks.every(x=>x[1]),checks}}
return{VERSION,BASE,phaseGroup,capKinds,recentKinds,archetype,rank,publicSummary,localQA};
});

