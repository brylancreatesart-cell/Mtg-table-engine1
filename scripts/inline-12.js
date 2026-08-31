
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGChaosNet=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase26-chaos-network-1';
const clone=x=>JSON.parse(JSON.stringify(x));

function rng(seed=1){
  let x=(Number(seed)||1)>>>0;
  return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296};
}
function faultPlan(messages,{seed=1,dropRate=0,duplicateRate=0,reorder=false}={}){
  const r=rng(seed),out=[];
  for(const m of messages||[]){
    if(r()<dropRate)continue;
    out.push(clone(m));
    if(r()<duplicateRate)out.push(clone(m));
  }
  if(reorder){
    for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  }
  return out;
}
function deliver(session,packets,{localState=null}={}){
  const accepted=[],rejected=[];
  for(const p of packets||[]){
    const r=session.decode(clone(p),{localState});
    (r.accept?accepted:rejected).push(r);
    if(r.accept&&r.message?.st)localState=clone(r.message.st);
  }
  return{accepted,rejected,state:localState,stats:clone(session.stats)};
}
function convergence(states,verifier){
  if(!states?.length)return{converged:true,fingerprint:null};
  const fps=states.map(s=>verifier.fingerprint(s)),first=fps[0];
  return{converged:fps.every(x=>x.seq===first.seq&&x.hash===first.hash),fingerprint:first,fingerprints:fps};
}
function retransmitUntilAccepted({senderSession,receiverSession,legacy,localState,maxAttempts=3}={}){
  let attempts=0,last=null;
  while(attempts<maxAttempts){
    attempts++;
    const pkt=senderSession.encode(legacy);
    last=receiverSession.decode(pkt,{localState});
    if(last.accept)return{accepted:true,attempts,result:last};
  }
  return{accepted:false,attempts,result:last};
}
function scenarioSummary(results){
  const arr=results||[];
  return{
    scenarios:arr.length,
    passed:arr.filter(x=>x.pass).length,
    failed:arr.filter(x=>!x.pass).length,
    allPassed:arr.every(x=>x.pass)
  };
}
return{VERSION,rng,faultPlan,deliver,convergence,retransmitUntilAccepted,scenarioSummary};
});
