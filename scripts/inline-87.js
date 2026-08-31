
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGRecovery=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase15-live-recovery-1',SCHEMA=1,KEY='mtgte_live_checkpoint_v1',MAX_AGE_MS=1000*60*60*24*7;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();
function checkpoint({state,players,room,localPlayerId,isHost,battleStarted}={}){
 if(!state||typeof state!=='object')throw new Error('Authoritative state required');
 return{format:'mtgte-live-checkpoint',schemaVersion:SCHEMA,savedAt:now(),matchId:state.meta?.matchId||null,room:room||null,localPlayerId:Number(localPlayerId||1),isHost:!!isHost,battleStarted:!!battleStarted,players:clone(players||[]),state:clone(state)};
}
function validate(c){
 const x=typeof c==='string'?JSON.parse(c):clone(c);
 if(!x||x.format!=='mtgte-live-checkpoint')throw new Error('Invalid live checkpoint');
 if(Number(x.schemaVersion)!==SCHEMA)throw new Error('Unsupported checkpoint schema');
 if(!x.state||typeof x.state!=='object')throw new Error('Checkpoint state missing');
 return x;
}
function finalized(c){const x=validate(c);return !!(x.state.meta?.finalized||x.state.matchFinalized||x.state.finalized||x.state.events?.some(e=>e.type==='MATCH_FINALIZED'))}
function recoverable(c,{maxAgeMs=MAX_AGE_MS,at=now()}={}){
 try{const x=validate(c);if(finalized(x))return false;if(!x.battleStarted)return false;if(at-Number(x.savedAt||0)>maxAgeMs)return false;return true}catch{return false}
}
function summary(c){const x=validate(c);return{matchId:x.matchId,room:x.room,savedAt:x.savedAt,players:(x.players||[]).length,turn:Number(x.state.turn||0),phase:x.state.phase||null,localPlayerId:x.localPlayerId,isHost:x.isHost,finalized:finalized(x)}}
function resolveKey(key){return key||KEY}
function save(c,storage,key){storage=storage||((typeof localStorage!=='undefined')?localStorage:null);if(!storage)return c;storage.setItem(resolveKey(key),JSON.stringify(validate(c)));return c}
function load(storage,key){storage=storage||((typeof localStorage!=='undefined')?localStorage:null);if(!storage)return null;try{return validate(storage.getItem(resolveKey(key))||'null')}catch{return null}}
function clear(storage,key){storage=storage||((typeof localStorage!=='undefined')?localStorage:null);storage?.removeItem(resolveKey(key))}
function saveSession(args,storage,key){const c=checkpoint(args);if(finalized(c)){clear(storage,key);return null}save(c,storage,key);return c}
function restore(c){const x=validate(c);if(!recoverable(x))throw new Error('Checkpoint is not recoverable');return{state:clone(x.state),players:clone(x.players),room:x.room,localPlayerId:x.localPlayerId,isHost:x.isHost,battleStarted:true}}
return{VERSION,SCHEMA,KEY,MAX_AGE_MS,checkpoint,validate,finalized,recoverable,summary,save,load,clear,saveSession,restore};
});
