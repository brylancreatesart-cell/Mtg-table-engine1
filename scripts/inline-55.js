
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MTGTargeting=api})(typeof window!=='undefined'?window:globalThis,function(){
 const VERSION='phase39-targeting-1';
 function clone(x){return JSON.parse(JSON.stringify(x));}
 function normalizeTarget(t={}){const kind=String(t.kind||'').toLowerCase();if(kind==='player'){const playerId=Number(t.playerId);return playerId?{kind:'player',playerId}:null}if(kind==='object'){const objectId=String(t.objectId||'');return objectId?{kind:'object',objectId}:null}return null}
 function key(t){const n=normalizeTarget(t);return n?(n.kind==='player'?'p:'+n.playerId:'o:'+n.objectId):''}
 function normalizeTargets(a=[]){const out=[],seen=new Set();for(const x of a){const n=normalizeTarget(x),k=key(n);if(n&&k&&!seen.has(k)){seen.add(k);out.push(n)}}return out}
 function setIntent(setId,targets,meta={}){return{type:'TARGET_SET_CHANGED',payload:{setId:String(setId||'manual'),targets:normalizeTargets(targets),sourceObjectId:meta.sourceObjectId?String(meta.sourceObjectId):null,sourcePlayerId:meta.sourcePlayerId==null?null:Number(meta.sourcePlayerId)}}}
 function clearIntent(setId='manual'){return{type:'TARGET_SET_CLEARED',payload:{setId:String(setId)}}}
 function has(state,setId,target){return normalizeTargets(state.targeting?.sets?.[setId]?.targets||[]).some(x=>key(x)===key(target))}
 function localQA(engine){let st=engine.normalizeState({battle:[{id:'perm1',name:'QA Permanent',owner:1}],targeting:{sets:{}},events:[],snapshots:[],feed:[]});let e=engine.makeEvent(st,'TARGET_SET_CHANGED',{setId:'manual',targets:[{kind:'player',playerId:2},{kind:'object',objectId:'perm1'},{kind:'object',objectId:'perm1'}]},1);engine.reduce(st,e);let checks=[['deduplicated targets',st.targeting.sets.manual.targets.length===2],['player target tracked',has(st,'manual',{kind:'player',playerId:2})],['object target tracked',has(st,'manual',{kind:'object',objectId:'perm1'})]];let z=engine.makeEvent(st,'OBJECT_ZONE_CHANGED',{objectId:'perm1',toZone:'graveyard'},1);engine.reduce(st,z);checks.push(['zone change clears stale object target',!has(st,'manual',{kind:'object',objectId:'perm1'})]);let c=engine.makeEvent(st,'TARGET_SET_CLEARED',{setId:'manual'},1);engine.reduce(st,c);checks.push(['target set clears',!st.targeting.sets.manual]);return{ok:checks.every(x=>x[1]),checks,state:st}}
 return{VERSION,normalizeTarget,normalizeTargets,key,setIntent,clearIntent,has,localQA}
});

