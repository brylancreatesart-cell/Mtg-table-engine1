
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGReliableDelivery=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase34-reliable-delivery-1',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();
function ackId(packet){return packet?.type==='ACK'?String(packet?.payload?.ackMessageId||''):''}
function isAck(packet){return !!ackId(packet)}
function supersedeKey(packet,channelId='default'){
  if(packet?.type!=='STATE_SNAPSHOT')return null;
  return String(channelId)+':STATE_SNAPSHOT';
}
function createQueue({baseDelayMs=500,maxDelayMs=8000,maxAttempts=5,clock=now,onEvent=null}={}){
  const pending=new Map();
  const stats={sent:0,acked:0,retries:0,timeouts:0,superseded:0,pending:0,lastAckAt:0,lastTimeoutAt:0};
  const emit=(code,meta={})=>{try{onEvent&&onEvent({code,at:clock(),...meta})}catch{}};
  const delayFor=attempt=>Math.min(maxDelayMs,baseDelayMs*Math.pow(2,Math.max(0,attempt-1)));
  function update(){stats.pending=pending.size;return stats}
  function removeSuperseded(key,exceptId=null){if(!key)return 0;let n=0;for(const [id,e] of pending){if(id!==exceptId&&e.supersedeKey===key){pending.delete(id);n++;stats.superseded++;emit('SUPERSEDED',{messageId:id,key})}}update();return n}
  function send(packet,sendFn,{channelId='default',reliable=true,supersede=null}={}){
    if(!packet?.messageId)throw new Error('Reliable packet requires messageId');
    if(typeof sendFn!=='function')throw new Error('sendFn required');
    if(isAck(packet)||reliable===false){sendFn(clone(packet));stats.sent++;emit('SENT_UNTRACKED',{messageId:packet.messageId,type:packet.type});return{tracked:false,messageId:packet.messageId}}
    const id=String(packet.messageId),key=supersede===false?null:(typeof supersede==='string'?supersede:supersedeKey(packet,channelId));
    removeSuperseded(key,id);
    const at=clock(),entry={messageId:id,packet:clone(packet),sendFn,channelId:String(channelId),supersedeKey:key,attempts:1,createdAt:at,lastSentAt:at,nextAttemptAt:at+delayFor(1)};
    pending.set(id,entry);sendFn(clone(packet));stats.sent++;update();emit('TRACKED',{messageId:id,type:packet.type,channelId,attempts:1});return{tracked:true,messageId:id,nextAttemptAt:entry.nextAttemptAt}
  }
  function acknowledge(messageId,{at=clock()}={}){const id=String(messageId||'');const e=pending.get(id);if(!e)return{ok:false,reason:'unknown-ack',messageId:id};pending.delete(id);stats.acked++;stats.lastAckAt=Number(at);update();emit('ACKED',{messageId:id,attempts:e.attempts,latencyMs:Number(at)-e.createdAt});return{ok:true,messageId:id,attempts:e.attempts,latencyMs:Number(at)-e.createdAt}}
  function receive(packet){const id=ackId(packet);return id?acknowledge(id):{ok:false,reason:'not-ack'}}
  function tick(at=clock()){
    const retried=[],timedOut=[];
    for(const [id,e] of Array.from(pending.entries())){
      if(Number(at)<e.nextAttemptAt)continue;
      if(e.attempts>=maxAttempts){pending.delete(id);stats.timeouts++;stats.lastTimeoutAt=Number(at);timedOut.push(id);emit('TIMEOUT',{messageId:id,attempts:e.attempts});continue}
      e.attempts++;e.lastSentAt=Number(at);e.nextAttemptAt=Number(at)+delayFor(e.attempts);e.sendFn(clone(e.packet));stats.sent++;stats.retries++;retried.push(id);emit('RETRY',{messageId:id,attempts:e.attempts,nextAttemptAt:e.nextAttemptAt});
    }
    update();return{retried,timedOut,stats:snapshot()}
  }
  function snapshot(){return{...stats,pending:pending.size,entries:Array.from(pending.values()).map(e=>({messageId:e.messageId,type:e.packet?.type,channelId:e.channelId,attempts:e.attempts,nextAttemptAt:e.nextAttemptAt,supersedeKey:e.supersedeKey}))}}
  function clear(){pending.clear();update()}
  return{send,acknowledge,receive,tick,snapshot,clear,pending,stats,delayFor};
}
return{VERSION,SCHEMA,ackId,isAck,supersedeKey,createQueue};
});

