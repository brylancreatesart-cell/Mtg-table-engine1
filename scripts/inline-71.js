
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSpatialOpponents=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase54-spatial-opponents-1';
const MAP_KEY='mtgte_spatial_seat_map_v1';
const PRIMARY_SLOTS=Object.freeze(['left','top','right']);
const clone=x=>JSON.parse(JSON.stringify(x));
function playerIds(players=[]){return players.map(p=>Number(p?.id)).filter(Number.isInteger)}
function defaultSlots(players=[],localId){
  const ids=playerIds(players),me=Number(localId),i=ids.indexOf(me),ordered=i>=0?ids.slice(i+1).concat(ids.slice(0,i)):ids.filter(x=>x!==me),opps=ordered.filter(x=>x!==me),slots={};
  if(opps.length===1){slots[opps[0]]='top';return slots}
  if(opps.length===2){slots[opps[0]]='left';slots[opps[1]]='right';return slots}
  if(opps.length>=3){slots[opps[0]]='left';slots[opps[1]]='top';slots[opps[2]]='right';for(let x=3;x<opps.length;x++)slots[opps[x]]='top-extra-'+(x-2)}
  return slots
}
function normalizeMap(input={},players=[],localId){
  const valid=new Set(playerIds(players).filter(x=>x!==Number(localId)).map(String)),out={};
  if(input&&typeof input==='object')for(const [pid,slot] of Object.entries(input)){if(valid.has(String(pid))&&(PRIMARY_SLOTS.includes(String(slot))||/^top-extra-\d+$/.test(String(slot))))out[String(pid)]=String(slot)}
  const defaults=defaultSlots(players,localId),used=new Set(Object.values(out));
  for(const [pid,slot] of Object.entries(defaults))if(!(pid in out)&&!used.has(slot)){out[pid]=slot;used.add(slot)}
  return out
}
function loadMap(storage,players=[],localId){if(!storage?.getItem)return normalizeMap({},players,localId);try{return normalizeMap(JSON.parse(storage.getItem(MAP_KEY)||'{}'),players,localId)}catch{return normalizeMap({},players,localId)}}
function saveMap(storage,map,players=[],localId){const next=normalizeMap(map,players,localId);storage?.setItem?.(MAP_KEY,JSON.stringify(next));return next}
function assign(map,playerId,slot,players=[],localId){
  const pid=String(Number(playerId)),target=String(slot),next=normalizeMap(map,players,localId);if(!PRIMARY_SLOTS.includes(target))return next;
  const other=Object.keys(next).find(k=>k!==pid&&next[k]===target),old=next[pid];next[pid]=target;if(other){if(old&&PRIMARY_SLOTS.includes(old))next[other]=old;else delete next[other]}
  return normalizeMap(next,players,localId)
}
function layout(players=[],localId,map={}){const normalized=normalizeMap(map,players,localId);return players.filter(p=>Number(p.id)!==Number(localId)).map(p=>({...clone(p),spatialSlot:normalized[String(p.id)]||'top'}))}
function commanderDamageBand(amount){const n=Math.max(0,Number(amount)||0);if(n>=21)return'fallen';if(n>=18)return'critical';if(n>=11)return'warn';return'subtle'}
function quickAmounts(){return[1,2,3,5,10]}
function localQA(){
  const ps=[{id:1},{id:2},{id:3},{id:4}],checks=[];let d=defaultSlots(ps,1);
  checks.push(['four-player table maps three opponents',Object.keys(d).length===3]);checks.push(['next seat defaults left',d['2']==='left']);checks.push(['across seat defaults top',d['3']==='top']);checks.push(['final seat defaults right',d['4']==='right']);
  let a=assign(d,4,'left',ps,1);checks.push(['manual spatial assignment moves chosen player',a['4']==='left']);checks.push(['manual assignment swaps displaced player',a['2']==='right']);
  checks.push(['one opponent defaults across',defaultSlots([{id:1},{id:2}],1)['2']==='top']);checks.push(['commander warning band starts at 11',commanderDamageBand(11)==='warn']);checks.push(['commander critical band starts at 18',commanderDamageBand(18)==='critical']);checks.push(['commander fallen band starts at 21',commanderDamageBand(21)==='fallen']);checks.push(['quick damage presets remain small and useful',JSON.stringify(quickAmounts())==='[1,2,3,5,10]']);checks.push(['seat map normalization rejects unknown players',!('9'in normalizeMap({'9':'left'},ps,1))]);
  return{ok:checks.every(x=>x[1]),checks}
}
return{VERSION,MAP_KEY,PRIMARY_SLOTS,defaultSlots,normalizeMap,loadMap,saveMap,assign,layout,commanderDamageBand,quickAmounts,localQA};
});

