
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGStateVerify=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase23-state-verification-1';
const clone=x=>JSON.parse(JSON.stringify(x));

function stable(v){
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return'['+v.map(stable).join(',')+']';
  return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
}
function hash(v){
  let h=2166136261,s=stable(v);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return(h>>>0).toString(16).padStart(8,'0');
}
function eventSeq(state){
  const ev=Array.isArray(state?.events)?state.events:[];
  return ev.reduce((m,e)=>Math.max(m,Number(e?.seq||0)),0);
}
function publicProjection(state){
  const s=clone(state||{});
  delete s.logs;
  delete s.ui;
  delete s.presentation;
  delete s.transient;
  return s;
}
function fingerprint(state){
  const projection=publicProjection(state);
  return{seq:eventSeq(state),hash:hash(projection),projection};
}
function compare(local,remote){
  const a=fingerprint(local),b=fingerprint(remote);
  if(a.seq===b.seq&&a.hash===b.hash)return{status:'identical',local:a,remote:b};
  if(a.seq<b.seq)return{status:'local-behind',local:a,remote:b};
  if(a.seq>b.seq)return{status:'remote-behind',local:a,remote:b};
  return{status:'diverged',local:a,remote:b};
}
function inspectEvents(state){
  const ev=Array.isArray(state?.events)?state.events:[],issues=[];
  let last=0,seen=new Set();
  for(const e of ev){
    const seq=Number(e?.seq||0);
    if(!seq)issues.push({code:'EVENT_SEQ_MISSING',severity:'error',event:e});
    if(seq&&seen.has(seq))issues.push({code:'EVENT_SEQ_DUPLICATE',severity:'error',seq});
    if(seq&&seq<=last)issues.push({code:'EVENT_SEQ_NON_MONOTONIC',severity:'error',seq,last});
    if(seq){seen.add(seq);last=seq}
  }
  return{ok:issues.length===0,issues,lastSeq:last,count:ev.length};
}
function resyncDecision(local,remote,{remoteTrusted=false}={}){
  const c=compare(local,remote);
  if(c.status==='identical')return{action:'none',reason:'identical',comparison:c};
  if(c.status==='local-behind'&&remoteTrusted)return{action:'accept-remote',reason:'newer-trusted-remote',comparison:c};
  if(c.status==='remote-behind')return{action:'send-local',reason:'remote-behind',comparison:c};
  if(c.status==='diverged')return{action:remoteTrusted?'accept-remote':'manual-review',reason:'same-sequence-divergence',comparison:c};
  return{action:'request-host',reason:'remote-newer-untrusted',comparison:c};
}
function roomConsensus(samples=[]){
  const groups=new Map();
  for(const x of samples){
    const key=String(x.seq)+'|'+String(x.hash);
    const g=groups.get(key)||{seq:Number(x.seq||0),hash:x.hash,peers:[]};
    g.peers.push(x.peerId||x.playerId||'unknown');groups.set(key,g);
  }
  const list=[...groups.values()].sort((a,b)=>b.peers.length-a.peers.length||b.seq-a.seq);
  return{groups:list,consensus:list[0]||null,unanimous:list.length<=1};
}
return{VERSION,stable,hash,eventSeq,publicProjection,fingerprint,compare,inspectEvents,resyncDecision,roomConsensus};
});
