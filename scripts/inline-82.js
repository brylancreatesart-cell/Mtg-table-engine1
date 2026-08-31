
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGHistoryAnalytics=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase12-history-replay-analytics-2';
const clone=x=>JSON.parse(JSON.stringify(x));
const safe=n=>Number.isFinite(Number(n))?Number(n):0;
function records(profile){return Array.isArray(profile?.history)?profile.history.slice():[];}
function summary(profile){const h=records(profile),games=h.length,wins=h.filter(x=>x.result==='win'||(x.winnerId!=null&&Number(x.winnerId)===Number(x.localPlayerId))).length,placements=h.map(x=>safe(x.placement)).filter(Boolean);return{games,wins,losses:Math.max(0,games-wins),winRate:games?wins/games:0,averagePlacement:placements.length?placements.reduce((a,b)=>a+b,0)/placements.length:null,averageTurns:games?h.reduce((a,m)=>a+safe(m.turnCount),0)/games:0,averageDurationMs:games?h.reduce((a,m)=>a+safe(m.durationMs),0)/games:0};}
function deckPerformance(profile){const h=records(profile),map=new Map();for(const m of h){const key=m.deckId||'unknown';if(!map.has(key))map.set(key,{deckId:key,commander:m.commander||null,games:0,wins:0,losses:0,placements:[],versionIds:new Set()});const d=map.get(key);d.games++;if(m.result==='win')d.wins++;else d.losses++;if(m.placement)d.placements.push(Number(m.placement));if(m.deckVersionId)d.versionIds.add(m.deckVersionId);}return [...map.values()].map(d=>({...d,winRate:d.games?d.wins/d.games:0,averagePlacement:d.placements.length?d.placements.reduce((a,b)=>a+b,0)/d.placements.length:null,versionCount:d.versionIds.size,versionIds:[...d.versionIds]})).sort((a,b)=>b.games-a.games||b.winRate-a.winRate);}
function placementTrend(profile,limit=20){return records(profile).slice(0,limit).reverse().map(m=>({id:m.id,date:m.date,placement:safe(m.placement)||null,turnCount:safe(m.turnCount),result:m.result||null,deckId:m.deckId||null}));}
function replayTimeline(match){return (match?.timeline||[]).slice().sort((a,b)=>safe(a.seq)-safe(b.seq)||safe(a.at)-safe(b.at)).map(clone);}
function replayFrame(match,index){const timeline=replayTimeline(match);index=Math.max(-1,Math.min(timeline.length-1,Number(index)));const upto=index<0?[]:timeline.slice(0,index+1);return{matchId:match?.id||null,index,event:index>=0?clone(timeline[index]):null,events:clone(upto),progress:timeline.length?Math.max(0,(index+1)/timeline.length):0,finalState:clone(match?.finalState||null)};}
function eventBreakdown(match){const out={};for(const e of replayTimeline(match))out[e.type]=(out[e.type]||0)+1;return out;}
function streak(profile){const h=records(profile);if(!h.length)return{kind:null,count:0};const kind=h[0].result||null;let count=0;for(const m of h){if(m.result!==kind)break;count++}return{kind,count}}
function opponentPerformance(profile){const map=new Map();for(const m of records(profile)){for(const p of (m.players||[])){if(Number(p.id)===Number(m.localPlayerId))continue;const k=p.name||('Player '+p.id),o=map.get(k)||{name:k,games:0,wins:0,losses:0};o.games++;if(m.result==='win')o.wins++;else if(m.result==='loss')o.losses++;map.set(k,o)}}return[...map.values()].map(o=>({...o,winRate:o.games?o.wins/o.games:0})).sort((a,b)=>b.games-a.games||b.winRate-a.winRate)}
function findMatch(profile,id){return records(profile).find(m=>String(m.id)===String(id))||null;}
return{VERSION,records,summary,deckPerformance,placementTrend,replayTimeline,replayFrame,eventBreakdown,streak,opponentPerformance,findMatch};
});

