
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGPlaygroups=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase12-playgroups-intelligence-1';
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=(p='pg')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
const code=x=>String(x||'').replace(/^TME-/i,'').toUpperCase();
function normalize(g={}){return{id:g.id||uid(),name:String(g.name||'Playgroup').trim().slice(0,40)||'Playgroup',createdAt:g.createdAt||new Date().toISOString(),updatedAt:g.updatedAt||new Date().toISOString(),members:Array.isArray(g.members)?g.members.map(m=>({name:m.name||'Player',code:code(m.code||m.friendCode),profileId:m.profileId||null})):[],notes:String(g.notes||'').slice(0,500)}}
function create(name,members=[]){return normalize({name,members})}
function save(profile,group){const p=clone(profile),g=normalize(group);p.playgroups=Array.isArray(p.playgroups)?p.playgroups:[];const i=p.playgroups.findIndex(x=>x.id===g.id);g.updatedAt=new Date().toISOString();if(i>=0)p.playgroups[i]=g;else p.playgroups.unshift(g);return p}
function remove(profile,id){const p=clone(profile);p.playgroups=(p.playgroups||[]).filter(x=>String(x.id)!==String(id));return p}
function addMember(group,person){const g=normalize(group),c=code(person.code||person.friendCode);if(c&&!g.members.some(m=>code(m.code)===c))g.members.push({name:person.name||person.displayName||'Player',code:c,profileId:person.profileId||person.id||null});return g}
function matchKey(m){return (m.players||[]).map(p=>String(p.name||p.id)).sort().join('|')}
function groupMatches(profile,group){const names=new Set((group?.members||[]).map(m=>String(m.name).toLowerCase()));return (profile?.history||[]).filter(m=>{const ps=(m.players||[]).map(p=>String(p.name||'').toLowerCase());return names.size&&[...names].every(n=>ps.includes(n))})}
function intelligence(profile,group=null){const h=group?groupMatches(profile,group):(profile?.history||[]);const opponents=new Map(),decks=new Map();for(const m of h){for(const p of (m.players||[])){if(Number(p.id)===Number(m.localPlayerId))continue;const k=p.name||('Player '+p.id),o=opponents.get(k)||{name:k,games:0,winsAgainst:0,lossesAgainst:0};o.games++;if(m.result==='win')o.winsAgainst++;else if(m.result==='loss')o.lossesAgainst++;opponents.set(k,o)}const dk=m.deckId||'unknown',d=decks.get(dk)||{deckId:dk,commander:m.commander||null,games:0,wins:0,placements:[]};d.games++;if(m.result==='win')d.wins++;if(m.placement)d.placements.push(Number(m.placement));decks.set(dk,d)}
const opponentStats=[...opponents.values()].map(o=>({...o,winRate:o.games?o.winsAgainst/o.games:0})).sort((a,b)=>b.games-a.games);
const deckStats=[...decks.values()].map(d=>({...d,winRate:d.games?d.wins/d.games:0,averagePlacement:d.placements.length?d.placements.reduce((a,b)=>a+b,0)/d.placements.length:null})).sort((a,b)=>b.games-a.games);
return{games:h.length,opponents:opponentStats,decks:deckStats,mostPlayedOpponent:opponentStats[0]||null,bestDeck:deckStats.slice().sort((a,b)=>b.winRate-a.winRate||b.games-a.games)[0]||null}}
return{VERSION,normalize,create,save,remove,addMember,groupMatches,intelligence,matchKey};
});
