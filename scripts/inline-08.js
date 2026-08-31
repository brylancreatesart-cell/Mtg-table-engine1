
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGProtocol=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase36-multiplayer-protocol-2',SCHEMA=1,DEFAULT_SEEN_LIMIT=2048;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();
const uid=(p='msg')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);

function envelope({type,room,sessionId,senderId,messageId,payload=null,seq=0,sentAt=now(),authority='peer',epoch=0,matchId=null}={}){
  if(!type)throw new Error('Message type required');
  if(!room)throw new Error('Room required');
  if(!sessionId)throw new Error('Session ID required');
  if(!senderId)throw new Error('Sender ID required');
  return{schemaVersion:SCHEMA,type:String(type),room:String(room),sessionId:String(sessionId),senderId:String(senderId),messageId:String(messageId||uid()),seq:Number(seq||0),sentAt:Number(sentAt),authority:String(authority||'peer'),epoch:Math.max(0,Math.trunc(Number(epoch)||0)),matchId:matchId==null?null:String(matchId),payload:payload==null?null:clone(payload)};
}
function validateMessage(msg,{room=null,sessionId=null,maxSkewMs=120000,at=now()}={}){
  const m=clone(msg||{});
  const errors=[];
  if(Number(m.schemaVersion)!==SCHEMA)errors.push('schema');
  if(!m.type)errors.push('type');
  if(!m.room)errors.push('room');
  if(!m.sessionId)errors.push('sessionId');
  if(!m.senderId)errors.push('senderId');
  if(!m.messageId)errors.push('messageId');
  if(!Number.isInteger(Number(m.epoch))||Number(m.epoch)<0)errors.push('epoch');
  if(room!=null&&String(m.room)!==String(room))errors.push('room-mismatch');
  if(sessionId!=null&&String(m.sessionId)!==String(sessionId))errors.push('session-mismatch');
  if(m.sentAt&&Math.abs(Number(at)-Number(m.sentAt))>maxSkewMs)errors.push('clock-skew');
  return{ok:errors.length===0,errors,message:m};
}
const HOST_TYPES=Object.freeze(['STATE_SNAPSHOT','HOST_CONTROL','MATCH_FINALIZED','HOST_ELECTED','ROOM_CLOSED','AUTHORITATIVE_EVENT']);
const PEER_TYPES=Object.freeze(['RESUME_HELLO','ACTION_REQUEST','HEARTBEAT','PROFILE_PRESENCE','ACK']);
function requiredAuthority(type){
  const t=String(type||'');
  if(HOST_TYPES.includes(t))return'host';
  if(PEER_TYPES.includes(t))return'peer';
  return null;
}
function authorityAllowed(msg,{hostId=null}={}){
  const req=requiredAuthority(msg?.type);
  if(!req)return false;
  if(req!=='host')return true;
  return !!hostId&&String(msg?.senderId)===String(hostId);
}
function createReplayGuard({limit=DEFAULT_SEEN_LIMIT}={}){
  const seen=new Map();
  function has(id){return seen.has(String(id))}
  function remember(id,at=now()){
    const k=String(id);if(seen.has(k))return false;
    seen.set(k,Number(at));
    while(seen.size>limit){const first=seen.keys().next().value;seen.delete(first)}
    return true;
  }
  function check(msg){const id=String(msg?.messageId||'');if(!id)return{ok:false,reason:'missing-message-id'};if(has(id))return{ok:false,reason:'duplicate'};remember(id);return{ok:true,reason:null}}
  function size(){return seen.size}
  function clear(){seen.clear()}
  return{has,remember,check,size,clear};
}
function actionKey(msg){
  const p=msg?.payload||{};
  if(p.actionId)return String(p.actionId);
  if(msg?.type==='AUTHORITATIVE_EVENT'&&p.event?.id)return String(p.event.id);
  return String(msg?.messageId||'');
}
function createActionGuard({limit=DEFAULT_SEEN_LIMIT}={}){
  const seen=new Map();
  function check(msg){
    const k=actionKey(msg);if(!k)return{ok:false,reason:'missing-action-key'};
    if(seen.has(k))return{ok:false,reason:'duplicate-action'};
    seen.set(k,now());while(seen.size>limit){const first=seen.keys().next().value;seen.delete(first)}
    return{ok:true,key:k};
  }
  function size(){return seen.size}
  return{check,size};
}
function inspectInbound(msg,ctx={}){
  const v=validateMessage(msg,ctx);
  if(!v.ok)return{accept:false,reason:'invalid',errors:v.errors};
  if(!requiredAuthority(v.message.type))return{accept:false,reason:'unsupported-type'};
  if(!authorityAllowed(v.message,ctx))return{accept:false,reason:'authority'};
  if(ctx.replayGuard){const r=ctx.replayGuard.check(v.message);if(!r.ok)return{accept:false,reason:r.reason}}
  if(ctx.actionGuard&&['AUTHORITATIVE_EVENT','ACTION_REQUEST'].includes(v.message.type)){const a=ctx.actionGuard.check(v.message);if(!a.ok)return{accept:false,reason:a.reason}}
  return{accept:true,reason:null,message:v.message};
}
function receipt(msg,{receiverId,status='ok'}={}){
  if(!msg?.messageId)throw new Error('Original message ID required');
  return envelope({type:'ACK',room:msg.room,sessionId:msg.sessionId,senderId:receiverId||'unknown',payload:{ackMessageId:msg.messageId,status},seq:msg.seq,epoch:msg.epoch||0,matchId:msg.matchId||null});
}
return{VERSION,SCHEMA,DEFAULT_SEEN_LIMIT,HOST_TYPES,PEER_TYPES,envelope,validateMessage,requiredAuthority,authorityAllowed,createReplayGuard,actionKey,createActionGuard,inspectInbound,receipt};
});
