
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGObservability=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase27-observability-1',LIMIT=500;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();

function normalizeEvent(e={}){
  return{
    ts:Number(e.ts||now()),
    category:String(e.category||'system'),
    level:String(e.level||'info'),
    code:String(e.code||'GENERIC'),
    message:String(e.message||''),
    meta:e.meta==null?null:clone(e.meta)
  };
}
function append(log,event,{limit=LIMIT}={}){
  const out=Array.isArray(log)?clone(log):[];
  out.push(normalizeEvent(event));
  return out.slice(-limit);
}
function summarize(log=[]){
  const items=(log||[]).map(normalizeEvent);
  const byLevel={},byCategory={},byCode={};
  for(const e of items){
    byLevel[e.level]=(byLevel[e.level]||0)+1;
    byCategory[e.category]=(byCategory[e.category]||0)+1;
    byCode[e.code]=(byCode[e.code]||0)+1;
  }
  return{total:items.length,byLevel,byCategory,byCode,last:items[items.length-1]||null};
}
function transportEvent(reason,ctx={}){
  const map={
    duplicate:['warning','DUPLICATE_PACKET'],
    'duplicate-action':['warning','DUPLICATE_ACTION'],
    authority:['error','AUTHORITY_REJECT'],
    invalid:['error','INVALID_PACKET'],
    'stale-state':['warning','STALE_STATE_REJECT'],
    unenveloped:['error','UNENVELOPED_PACKET']
  };
  const [level,code]=map[reason]||['warning','TRANSPORT_REJECT'];
  return normalizeEvent({category:'transport',level,code,message:String(reason||'transport rejection'),meta:ctx});
}
function stateEvent(status,ctx={}){
  const map={
    identical:['info','STATE_IDENTICAL'],
    'local-behind':['warning','LOCAL_BEHIND'],
    'remote-behind':['warning','REMOTE_BEHIND'],
    diverged:['error','STATE_DIVERGED']
  };
  const [level,code]=map[status]||['warning','STATE_CHECK'];
  return normalizeEvent({category:'state',level,code,message:String(status||'state check'),meta:ctx});
}
function health({transportStats={},integrity=null,recovery=null,online=true}={}){
  const critical=[];
  if(Number(transportStats.authorityRejects||0)>0)critical.push('authority-rejects');
  if(Number(transportStats.staleRejects||0)>3)critical.push('repeated-stale-state');
  if(integrity?.status==='error')critical.push('data-integrity');
  if(recovery?.stale===true)critical.push('stale-recovery');
  return{status:critical.length?'degraded':online?'healthy':'offline',critical,online:!!online};
}
function exportDiagnostics({log=[],transportStats={},stateFingerprint=null,profileHealth=null,roomHealth=null,appVersion=null}={}){
  return{
    format:'mtgte-diagnostics',
    schemaVersion:1,
    exportedAt:new Date().toISOString(),
    appVersion:appVersion||null,
    transportStats:clone(transportStats||{}),
    stateFingerprint:clone(stateFingerprint),
    profileHealth:clone(profileHealth),
    roomHealth:clone(roomHealth),
    events:clone(log||[])
  };
}
return{VERSION,LIMIT,normalizeEvent,append,summarize,transportEvent,stateEvent,health,exportDiagnostics};
});
