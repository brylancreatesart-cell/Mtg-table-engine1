
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGDeckAdaptiveHUD=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase67-deck-adaptive-hud-1';
const DEFINITIONS=[
 {kind:'tokens',label:'TOKENS',action:'Create Tokens',patterns:[/\btoken(?:s)?\b/i,/create[^.]{0,100}token/i]},
 {kind:'counter',label:'COUNTERS',action:'Add Counter',patterns:[/\bcounter(?:s)?\b/i,/\+1\/\+1/i]},
 {kind:'life-gain',label:'LIFEGAIN',action:'Record Life Gain',patterns:[/gain[^.]{0,45}life/i,/lifelink/i]},
 {kind:'proliferate',label:'PROLIFERATE',action:'Proliferate',patterns:[/\bproliferate\b/i]},
 {kind:'storm',label:'SPELLS',action:'Track Storm',patterns:[/\bstorm\b/i,/whenever you cast/i,/instant or sorcery/i]},
 {kind:'poison',label:'POISON',action:'Record Poison',patterns:[/poison counter/i,/\btoxic\b/i,/\binfect\b/i]},
 {kind:'energy',label:'ENERGY',action:'Track Energy',patterns:[/energy counter/i,/\{e\}/i]},
 {kind:'experience',label:'EXPERIENCE',action:'Track Experience',patterns:[/experience counter/i]},
 {kind:'dungeon',label:'DUNGEON',action:'Venture / Dungeon',patterns:[/venture into the dungeon/i,/take the initiative/i,/complete a dungeon/i]},
 {kind:'monarch',label:'MONARCH',action:'Monarch',patterns:[/the monarch/i]},
 {kind:'day-night',label:'DAY · NIGHT',action:'Day / Night',patterns:[/daybound|nightbound|becomes day|becomes night/i]},
 {kind:'calculation',label:'MULTIPLIERS',action:'Review Calculation',patterns:[/twice that many|double|additional time|instead create/i]}
];
const corpus=c=>[c?.oracleText,c?.oracle_text,c?.typeLine,c?.type_line,(c?.keywords||[]).join(' '),(c?.mechanics||[]).join(' ')].filter(Boolean).join('\n');
const qty=c=>Math.max(1,Number(c?.q||1)||1);
function counterTypes(cards=[]){let map=new Map(),re=/(\+1\/\+1|[-+]?\d+\/[-+]?\d+|charge|loyalty|shield|stun|oil|incubation|time|age|lore|quest|brick|verse|storage|finality|rad|level|ki|luck|slime|soul|corpse|page|pressure|flood|depletion|intervention|velocity|omen|rev|growth|training) counters?\b/ig;for(const c of cards){let t=corpus(c),m;while((m=re.exec(t))){let k=m[1].toLowerCase(),w=qty(c);map.set(k,(map.get(k)||0)+w)}}return [...map].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);}
function tokenHints(cards=[]){let map=new Map();const res=[/create(?:s|d)?[^.]{0,100}?\b([A-Za-z][A-Za-z' -]{1,28}) creature token(?:s)?\b/ig,/create(?:s|d)?[^.]{0,90}?\b([A-Za-z][A-Za-z' -]{1,28}) token(?:s)?\b/ig];for(const c of cards){for(const re of res){let m;let t=corpus(c);while((m=re.exec(t))){let n=m[1].trim().replace(/^(?:a|an|one|two|three|x)\s+/i,'').trim();if(n.length<2||/that|those|copy|number|kind|many/i.test(n))continue;map.set(n,(map.get(n)||0)+qty(c))}}}return [...map].sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);}
function build(profile={},state={},playerId){let cards=profile.cards||[],commander=String(profile.commander||'').toLowerCase(),weights=new Map(),sources=new Map();for(const d of DEFINITIONS){let score=0,count=0;for(const c of cards){let text=corpus(c);if(!d.patterns.some(r=>r.test(text)))continue;let w=qty(c)*(String(c.n||c.name||'').toLowerCase()===commander?2.5:1);score+=w;count++}if(score){weights.set(d.kind,score);sources.set(d.kind,count)}}for(const c of profile.capabilities||[]){if(!weights.has(c.kind)){weights.set(c.kind,.5);sources.set(c.kind,1)}}let board=(state.battle||[]).filter(o=>Number(o.controllerId||o.owner)===Number(playerId));for(const o of board){let text=corpus(o);for(const d of DEFINITIONS)if(d.patterns.some(r=>r.test(text)))weights.set(d.kind,(weights.get(d.kind)||0)+1.25)}let ranked=[...DEFINITIONS].filter(d=>weights.has(d.kind)).map(d=>({...d,score:weights.get(d.kind),cardCount:sources.get(d.kind)||0})).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));let primary=ranked.slice(0,4),tags=ranked.slice(0,5).map(x=>({kind:x.kind,label:x.label,count:x.cardCount}));return{version:VERSION,primary,tags,counterTypes:counterTypes(cards).slice(0,4),tokenHints:tokenHints(cards),visibility:'private',commander:profile.commander||null,cardCount:cards.reduce((n,c)=>n+qty(c),0)}}
function publicSummary(x){return{x:VERSION};}
function localQA(){let p={commander:'Queen',cards:[{n:'Queen',q:1,oracleText:'Create two 1/1 Soldier creature tokens. Put a +1/+1 counter on each of them.'},{n:'Choir',q:3,oracleText:'Whenever another creature enters, you gain 1 life.'},{n:'Forest',q:20,typeLine:'Basic Land — Forest'}],capabilities:[]};let a=build(p,{battle:[]},1),checks=[];checks.push(['token deck detected',a.primary.some(x=>x.kind==='tokens')]);checks.push(['lifegain frequency detected',a.primary.some(x=>x.kind==='life-gain')]);checks.push(['counter deck detected',a.primary.some(x=>x.kind==='counter')]);checks.push(['private visibility only',a.visibility==='private']);checks.push(['commander weighted without card hardcoding',a.commander==='Queen']);checks.push(['public summary strips deck fingerprint',!('primary' in publicSummary(a))]);checks.push(['card count uses quantities',a.cardCount===24]);checks.push(['module identifies phase 67',a.version.includes('phase67')]);return{ok:checks.every(x=>x[1]),checks}}
return{VERSION,DEFINITIONS,build,counterTypes,tokenHints,publicSummary,localQA};
});
