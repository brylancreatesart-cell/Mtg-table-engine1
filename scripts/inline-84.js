
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGPortability=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase13-portability-recovery-1';
const FORMAT='mtg-table-engine-backup';
const SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
function normalizeCode(x){return String(x||'').replace(/^TME-/i,'').toUpperCase()}
function exportProfile(profile){
  if(!profile||typeof profile!=='object')throw new Error('Profile required');
  return {format:FORMAT,schemaVersion:SCHEMA,exportedAt:now(),app:'MTG Table Engine',profile:clone(profile)};
}
function stringify(profile,space=2){return JSON.stringify(exportProfile(profile),null,space)}
function validateBackup(data){
  const d=typeof data==='string'?JSON.parse(data):clone(data);
  if(!d||d.format!==FORMAT)throw new Error('Not an MTG Table Engine backup');
  if(Number(d.schemaVersion)!==SCHEMA)throw new Error('Unsupported backup schema');
  if(!d.profile||typeof d.profile!=='object')throw new Error('Backup profile missing');
  if(!Array.isArray(d.profile.decks)||!Array.isArray(d.profile.history))throw new Error('Backup profile is incomplete');
  return d;
}
function byIdMerge(current=[],incoming=[],idKey='id'){
  const map=new Map();
  for(const x of current||[]){const k=String(x?.[idKey]||'');if(k)map.set(k,clone(x))}
  for(const x of incoming||[]){const k=String(x?.[idKey]||'');if(k&&!map.has(k))map.set(k,clone(x))}
  return [...map.values()];
}
function mergeFriends(a=[],b=[]){
  const out=[],seen=new Set();
  for(const x of [...a,...b]){const c=normalizeCode(x?.code||x?.friendCode);const k=c||String(x?.id||x?.name||'').toLowerCase();if(k&&!seen.has(k)){seen.add(k);out.push(clone(x))}}
  return out;
}
function mergeProfiles(current,incoming){
  if(!current)return clone(incoming);
  const out=clone(current),inc=clone(incoming);
  out.decks=byIdMerge(out.decks,inc.decks);
  out.history=byIdMerge(out.history,inc.history);
  out.playgroups=byIdMerge(out.playgroups,inc.playgroups);
  out.recentPlayers=byIdMerge(out.recentPlayers,inc.recentPlayers,'code');
  out.friends=mergeFriends(out.friends,inc.friends);
  out.stats=out.stats||{games:0,wins:0,losses:0};
  // Recompute local aggregate stats from deduplicated history where possible.
  if(out.history.length){
    out.stats.games=out.history.length;
    out.stats.wins=out.history.filter(m=>m.result==='win').length;
    out.stats.losses=out.history.filter(m=>m.result==='loss').length;
  }
  out.updatedAt=now();
  return out;
}
function importBackup(current,data,{mode='merge'}={}){
  const backup=validateBackup(data);
  if(mode==='replace')return clone(backup.profile);
  if(mode!=='merge')throw new Error('Import mode must be merge or replace');
  return mergeProfiles(current,backup.profile);
}
function summary(data){
  const b=validateBackup(data),p=b.profile;
  return{displayName:p.displayName||p.name||'Player',decks:(p.decks||[]).length,matches:(p.history||[]).length,playgroups:(p.playgroups||[]).length,friends:(p.friends||[]).length,exportedAt:b.exportedAt||null};
}
return{VERSION,FORMAT,SCHEMA,exportProfile,stringify,validateBackup,mergeProfiles,importBackup,summary};
});
