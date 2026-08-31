
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSync=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase14-sync-foundation-1',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
const uid=(p='dev')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
const code=x=>String(x||'').replace(/^TME-/i,'').toUpperCase();
function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'}
function hash(v){let h=2166136261,s=stable(v);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function ensureSync(profile,deviceId){
  const p=clone(profile||{});p.sync=p.sync||{};
  p.sync.schemaVersion=SCHEMA;p.sync.deviceId=p.sync.deviceId||deviceId||uid();
  p.sync.localRevision=Number(p.sync.localRevision||0);p.sync.lastSyncedRevision=Number(p.sync.lastSyncedRevision||0);
  p.sync.lastSyncAt=p.sync.lastSyncAt||null;p.sync.lastSyncHash=p.sync.lastSyncHash||null;
  return p;
}
function touch(profile,deviceId){const p=ensureSync(profile,deviceId);p.sync.localRevision++;p.sync.lastModifiedAt=now();return p}
function itemKey(kind,x){
  if(kind==='friends')return code(x?.code||x?.friendCode)||String(x?.id||x?.name||'').toLowerCase();
  if(kind==='recentPlayers')return code(x?.code)||String(x?.id||x?.name||'').toLowerCase();
  return String(x?.id||'');
}
function itemStamp(x={}){return{revision:Number(x._syncRevision||x.revision||0),updatedAt:String(x.updatedAt||x.date||x.createdAt||''),deleted:!!x._deleted,hash:hash(x)}}
function choose(kind,a,b){
  if(!a)return clone(b);if(!b)return clone(a);
  const A=itemStamp(a),B=itemStamp(b);
  if(A.deleted!==B.deleted)return A.deleted?clone(a):clone(b);
  if(A.revision!==B.revision)return clone(A.revision>B.revision?a:b);
  if(A.updatedAt!==B.updatedAt)return clone(A.updatedAt>B.updatedAt?a:b);
  // Completed match history is immutable: never field-merge a conflicting record.
  // Deterministic content hash is the final tie-breaker.
  return clone(A.hash>=B.hash?a:b);
}
function mergeCollection(kind,local=[],remote=[]){
  const map=new Map();
  for(const x of local||[]){const k=itemKey(kind,x);if(k)map.set(k,clone(x))}
  for(const x of remote||[]){const k=itemKey(kind,x);if(k)map.set(k,choose(kind,map.get(k),x))}
  return [...map.values()].filter(x=>!x._deleted);
}
function publicPayload(profile){
  const p=clone(profile||{});
  delete p.auth; // auth/provider secrets are never sync payload content
  return p;
}
function replica(profile,deviceId){
  const p=ensureSync(profile,deviceId),collections={};
  for(const k of ['decks','history','playgroups','friends','recentPlayers'])collections[k]=clone(p[k]||[]);
  return{format:'mtgte-sync-replica',schemaVersion:SCHEMA,profileId:p.id||null,deviceId:p.sync.deviceId,revision:p.sync.localRevision,generatedAt:now(),collections,profileFields:{displayName:p.displayName,name:p.name,username:p.username,friendCode:p.friendCode,avatarId:p.avatarId,privacy:clone(p.privacy||{}),preferences:clone(p.preferences||{})},hash:hash({collections,profileId:p.id||null})}
}
function validateReplica(r){
  if(!r||r.format!=='mtgte-sync-replica')throw new Error('Invalid sync replica');
  if(Number(r.schemaVersion)!==SCHEMA)throw new Error('Unsupported sync replica schema');
  if(!r.collections||typeof r.collections!=='object')throw new Error('Replica collections missing');
  return clone(r);
}
function mergeReplica(profile,remote,deviceId){
  const r=validateReplica(remote),p=ensureSync(profile,deviceId);
  for(const k of ['decks','history','playgroups','friends','recentPlayers'])p[k]=mergeCollection(k,p[k]||[],r.collections[k]||[]);
  const rf=r.profileFields||{};
  // Identity remains local-first; preferences/privacy can safely converge key-by-key.
  p.displayName=p.displayName||rf.displayName;p.name=p.displayName||p.name||rf.name;p.username=p.username||rf.username;p.friendCode=p.friendCode||rf.friendCode;p.avatarId=p.avatarId||rf.avatarId;
  p.privacy={...(rf.privacy||{}),...(p.privacy||{})};p.preferences={...(rf.preferences||{}),...(p.preferences||{})};
  p.sync.localRevision=Math.max(Number(p.sync.localRevision||0),Number(r.revision||0));
  p.sync.lastSyncedRevision=p.sync.localRevision;p.sync.lastSyncAt=now();
  p.sync.lastSyncHash=hash({history:p.history,decks:p.decks,playgroups:p.playgroups,friends:p.friends,recentPlayers:p.recentPlayers});
  return p;
}
function diff(profile,remote){
  const r=validateReplica(remote),p=ensureSync(profile),out={};
  for(const k of ['decks','history','playgroups','friends','recentPlayers']){
    const a=new Map((p[k]||[]).map(x=>[itemKey(k,x),x])),b=new Map((r.collections[k]||[]).map(x=>[itemKey(k,x),x]));
    let localOnly=0,remoteOnly=0,conflicts=0;
    for(const key of new Set([...a.keys(),...b.keys()])){if(!b.has(key))localOnly++;else if(!a.has(key))remoteOnly++;else if(hash(a.get(key))!==hash(b.get(key)))conflicts++}
    out[k]={localOnly,remoteOnly,conflicts};
  }
  return out;
}
function status(profile){const p=ensureSync(profile);return{deviceId:p.sync.deviceId,localRevision:p.sync.localRevision,lastSyncedRevision:p.sync.lastSyncedRevision,pendingChanges:Math.max(0,p.sync.localRevision-p.sync.lastSyncedRevision),lastSyncAt:p.sync.lastSyncAt,lastSyncHash:p.sync.lastSyncHash}}
return{VERSION,SCHEMA,stable,hash,ensureSync,touch,itemKey,mergeCollection,replica,validateReplica,mergeReplica,diff,status,publicPayload};
});
