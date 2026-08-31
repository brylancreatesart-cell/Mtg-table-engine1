
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGTransportGateway=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase108-live-transport-gateway-5';
const clone=x=>JSON.parse(JSON.stringify(x));

function wireType(legacy={},policy=null){
  if(policy?.wireType)return policy.wireType(legacy)||'UNSUPPORTED';
  const t=String(legacy.t||'');
  if(['state','start','welcome','resume_state'].includes(t))return'STATE_SNAPSHOT';
  if(t==='resume_hello')return'RESUME_HELLO';
  if(['players','kicked','room_full','hello_request','reconnect_rejected','command_result'].includes(t))return'HOST_CONTROL';
  if(['cmd','respond','pass','ready','resync_request'].includes(t))return'ACTION_REQUEST';
  if(['ping','pong'].includes(t))return'HEARTBEAT';
  if(['hello','profile_update'].includes(t))return'PROFILE_PRESENCE';
  return'PEER_MESSAGE';
}
function requiresHost(legacy={}){
  return ['state','start','welcome','resume_state','players','kicked','room_full','hello_request','reconnect_rejected','command_result'].includes(String(legacy.t||''));
}
function senderId({isHost=false,room='',clientId='',descriptor=null}={}){return isHost?(descriptor?'host:'+String(descriptor.room)+':epoch:'+Number(descriptor.epoch||0):'host:'+String(room)):String(clientId||'peer')}
function hostId(room,descriptor=null){return descriptor?'host:'+String(descriptor.room)+':epoch:'+Number(descriptor.epoch||0):'host:'+String(room)}
function bootstrapHostId(packet,legacy,room,descriptor=null){
  if(descriptor)return hostId(room,descriptor);
  const t=String(legacy?.t||''),epoch=Math.max(0,Math.trunc(Number(packet?.epoch||0)||0));
  // These packets may legitimately arrive before a joining client has received the room descriptor.
  // They carry no gameplay state; bind them to the packet epoch so a real host can start/reject bootstrap.
  if(epoch&&['hello_request','room_full','reconnect_rejected'].includes(t))return'host:'+String(room)+':epoch:'+epoch;
  return hostId(room,null);
}
function actionId(legacy={}){
  if(legacy.requestId)return String(legacy.requestId);
  if(legacy.actionId)return String(legacy.actionId);
  return null;
}
function wrap(legacy,{protocol,policy=null,room,sessionId,clientId,isHost=false,seq=0,stateHash=null,descriptor=null}={}){
  if(!protocol)throw new Error('Protocol API required');
  if(legacy?.schemaVersion===protocol.SCHEMA&&legacy?.messageId&&legacy?.payload?.legacy)return clone(legacy);
  const payload={legacy:clone(legacy||{})};
  const aid=actionId(legacy);if(aid)payload.actionId=aid;
  if(stateHash)payload.stateHash=stateHash;
  const mapped=wireType(legacy,policy);
  if(mapped==='UNSUPPORTED')throw new Error('Unsupported legacy transport type: '+String(legacy?.t||''));
  return protocol.envelope({
    type:mapped,room,sessionId,senderId:senderId({isHost,room,clientId,descriptor}),
    seq,authority:isHost?'host':'peer',epoch:descriptor?.epoch||0,matchId:descriptor?.matchId||null,payload
  });
}
function inspect(packet,{protocol,policy=null,verifier,room,sessionId,replayGuard,actionGuard,localState=null,descriptor=null,roomSession=null}={}){
  if(!protocol)throw new Error('Protocol API required');
  // During transition, raw legacy packets are rejected instead of silently bypassing protection.
  if(!packet||packet.schemaVersion!==protocol.SCHEMA||!packet.payload?.legacy)
    return{accept:false,reason:'unenveloped'};
  const legacy=packet.payload.legacy;
  // Initial welcome / resume packets may carry the descriptor a client needs in order
  // to validate the very packet that bootstraps or advances the host epoch.
  let effectiveDescriptor=descriptor;
  if(legacy?.descriptor&&['welcome','resume_state','start','state'].includes(String(legacy.t||''))){
    const candidate=legacy.descriptor;
    if(!effectiveDescriptor||Number(candidate.epoch||0)>=Number(effectiveDescriptor.epoch||0))effectiveDescriptor=candidate;
  }
  const expectedHost=bootstrapHostId(packet,legacy,room,effectiveDescriptor);
  if(policy){const pv=policy.inspect(packet,{expectedHostId:expectedHost,roomSession,descriptor:effectiveDescriptor});if(!pv.ok)return{accept:false,reason:pv.reason||'policy',errors:pv.errors||[]}}
  // Bind the packet to the expected room/session before any authority decision.
  const base=protocol.validateMessage(packet,{room,sessionId});
  if(!base.ok)return{accept:false,reason:'invalid',errors:base.errors};
  // Presence, heartbeat and resume requests must remain usable while a reconnecting peer
  // is still learning the current epoch. Host snapshots remain epoch-bound.
  const bootstrapPeer=['PROFILE_PRESENCE','HEARTBEAT','RESUME_HELLO'].includes(String(packet.type||''));
  if(effectiveDescriptor&&roomSession&&!bootstrapPeer){const rv=roomSession.validatePacket(packet,effectiveDescriptor,{allowFuture:false});if(!rv.ok)return{accept:false,reason:'invalid',errors:rv.errors}}
  if(requiresHost(legacy)&&String(packet.senderId)!==expectedHost)
    return{accept:false,reason:'authority'};
  const checked=protocol.inspectInbound(packet,{room,sessionId,hostId:expectedHost,replayGuard,actionGuard});
  if(!checked.accept)return checked;
  if(['state','start','welcome','resume_state'].includes(String(legacy.t||''))&&legacy.st&&verifier&&localState){
    const remoteFp=verifier.fingerprint(legacy.st),localFp=verifier.fingerprint(localState);
    // Phase 108 adds a monotonic authority revision that is independent of game event sequence.
    // That distinction is required so an intentional host undo/rollback can move event seq backward
    // while still being a newer authoritative snapshot on the wire.
    if(typeof MTGAuthoritativeSync!=='undefined'&&Number(legacy.syncRevision||legacy.st?.meta?.authorityRevision||0)>0){
      const syncDecision=MTGAuthoritativeSync.inspectSnapshot(localState,legacy,{packet,currentDescriptor:effectiveDescriptor});
      if(!syncDecision.accept)return{accept:false,reason:syncDecision.reason||'stale-state',decision:syncDecision,remoteFp,localFp};
      return{accept:true,reason:null,message:legacy,packet,decision:syncDecision,remoteFp,localFp};
    }
    const decision=verifier.resyncDecision(localState,legacy.st,{remoteTrusted:String(packet.senderId)===expectedHost});
    // Pre-Phase-108 compatibility: trusted host snapshots still converge by event sequence/hash.
    if(decision.action==='send-local'||decision.action==='request-host')
      return{accept:false,reason:'stale-state',decision,remoteFp,localFp};
    return{accept:true,reason:null,message:legacy,packet,decision,remoteFp,localFp};
  }
  return{accept:true,reason:null,message:legacy,packet};
}
function createSession({protocol,policy=null,verifier,room,sessionId,clientId,isHost=false,replayLimit=2048,descriptor=null,roomSession=null}={}){
  const replayGuard=protocol.createReplayGuard({limit:replayLimit});
  const actionGuard=protocol.createActionGuard({limit:replayLimit});
  const stats={accepted:0,rejected:0,duplicates:0,authorityRejects:0,staleRejects:0,lastReason:null};
  function encode(legacy,{seq=0,stateHash=null}={}){
    return wrap(legacy,{protocol,policy,room,sessionId,clientId,isHost,seq,stateHash,descriptor});
  }
  function decode(packet,{localState=null}={}){
    const r=inspect(packet,{protocol,policy,verifier,room,sessionId,replayGuard,actionGuard,localState,descriptor,roomSession});
    if(r.accept)stats.accepted++;
    else{
      stats.rejected++;stats.lastReason=r.reason||'rejected';
      if(r.reason==='duplicate'||r.reason==='duplicate-action')stats.duplicates++;
      if(r.reason==='authority')stats.authorityRejects++;
      if(r.reason==='stale-state')stats.staleRejects++;
    }
    return r;
  }
  return{encode,decode,stats,replayGuard,actionGuard,room,sessionId,clientId,isHost,descriptor};
}
return{VERSION,wireType,requiresHost,senderId,hostId,bootstrapHostId,actionId,wrap,inspect,createSession};
});
