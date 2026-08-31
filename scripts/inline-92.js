
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGSyncJournal=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase19-offline-journal-1',SCHEMA=1,DEFAULT_LIMIT=1000;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();
const uid=(p='mut')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);

function normalize(j={}){return{schemaVersion:SCHEMA,entries:Array.isArray(j.entries)?j.entries.map(normalizeEntry):[],lastAckRevision:Number(j.lastAckRevision||0)}}
function normalizeEntry(e={}){
  return{id:e.id||uid(),revision:Number(e.revision||0),kind:String(e.kind||'profile'),operation:String(e.operation||'upsert'),recordId:e.recordId==null?null:String(e.recordId),payload:e.payload==null?null:clone(e.payload),createdAt:Number(e.createdAt||now()),attempts:Number(e.attempts||0),nextAttemptAt:Number(e.nextAttemptAt||0),acked:!!e.acked,error:e.error?String(e.error):null};
}
function append(journal,entry,{limit=DEFAULT_LIMIT}={}){
  const j=normalize(clone(journal||{})),e=normalizeEntry(entry);
  if(j.entries.some(x=>x.id===e.id))return j;
  j.entries.push(e);j.entries=j.entries.slice(-limit);return j;
}
function pending(journal,{at=now()}={}){
  return normalize(journal).entries.filter(e=>!e.acked&&e.nextAttemptAt<=at).sort((a,b)=>a.revision-b.revision||a.createdAt-b.createdAt);
}
function backoff(attempts,{baseMs=1000,maxMs=60000}={}){
  const n=Math.max(0,Number(attempts||0));return Math.min(maxMs,baseMs*Math.pow(2,n));
}
function fail(journal,id,error,{at=now(),baseMs=1000,maxMs=60000}={}){
  const j=normalize(clone(journal));const e=j.entries.find(x=>x.id===id);if(!e)return j;
  e.attempts++;e.error=String(error||'sync failed');e.nextAttemptAt=at+backoff(e.attempts-1,{baseMs,maxMs});return j;
}
function ack(journal,id,{revision=null}={}){
  const j=normalize(clone(journal));const e=j.entries.find(x=>x.id===id);if(!e)return j;
  e.acked=true;e.error=null;e.nextAttemptAt=0;if(revision!=null)j.lastAckRevision=Math.max(j.lastAckRevision,Number(revision||0));else j.lastAckRevision=Math.max(j.lastAckRevision,e.revision);return compact(j);
}
function compact(journal){
  const j=normalize(clone(journal));const floor=j.lastAckRevision;
  j.entries=j.entries.filter(e=>!e.acked||e.revision>floor);return j;
}
function summary(journal,{at=now()}={}){
  const j=normalize(journal),p=j.entries.filter(e=>!e.acked),ready=p.filter(e=>e.nextAttemptAt<=at),delayed=p.filter(e=>e.nextAttemptAt>at);
  return{total:j.entries.length,pending:p.length,ready:ready.length,delayed:delayed.length,lastAckRevision:j.lastAckRevision,failed:p.filter(e=>e.error).length};
}
class MemoryJournalStore{
  constructor(seed=null){this.value=normalize(seed||{})}
  async load(){return clone(this.value)}
  async save(j){this.value=normalize(clone(j));return this.load()}
}
class MutationProcessor{
  constructor({journalStore,pushMutation,clock=now}){this.store=journalStore;this.pushMutation=pushMutation;this.clock=clock}
  async enqueue(entry){let j=await this.store.load();j=append(j,entry);return this.store.save(j)}
  async flush({max=50}={}){
    let j=await this.store.load(),items=pending(j,{at:this.clock()}).slice(0,max),results=[];
    for(const e of items){
      try{
        const r=await this.pushMutation(clone(e));
        j=ack(j,e.id,{revision:r?.revision??e.revision});results.push({id:e.id,ok:true});
      }catch(err){
        j=fail(j,e.id,err?.message||err,{at:this.clock()});results.push({id:e.id,ok:false,error:String(err?.message||err)});
      }
    }
    await this.store.save(j);return{journal:j,results,summary:summary(j,{at:this.clock()})};
  }
}
return{VERSION,SCHEMA,DEFAULT_LIMIT,normalize,normalizeEntry,append,pending,backoff,fail,ack,compact,summary,MemoryJournalStore,MutationProcessor};
});
