
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGProtocolPolicy=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase108-strict-protocol-policy-2',SCHEMA=1;
const LEGACY_TYPES=Object.freeze({
  state:'STATE_SNAPSHOT',start:'STATE_SNAPSHOT',welcome:'STATE_SNAPSHOT',resume_state:'STATE_SNAPSHOT',
  resume_hello:'RESUME_HELLO',
  players:'HOST_CONTROL',kicked:'HOST_CONTROL',room_full:'HOST_CONTROL',hello_request:'HOST_CONTROL',reconnect_rejected:'HOST_CONTROL',command_result:'HOST_CONTROL',
  cmd:'ACTION_REQUEST',respond:'ACTION_REQUEST',pass:'ACTION_REQUEST',ready:'ACTION_REQUEST',resync_request:'ACTION_REQUEST',
  ping:'HEARTBEAT',pong:'HEARTBEAT',hello:'PROFILE_PRESENCE',profile_update:'PROFILE_PRESENCE'
});
const ENVELOPE_TYPES=Object.freeze(['STATE_SNAPSHOT','RESUME_HELLO','HOST_CONTROL','ACTION_REQUEST','HEARTBEAT','PROFILE_PRESENCE','ACK']);
const HOST_LEGACY=new Set(['state','start','welcome','resume_state','players','kicked','room_full','hello_request','reconnect_rejected','command_result']);
const PEER_LEGACY=new Set(['resume_hello','cmd','respond','pass','ready','resync_request','ping','pong','hello','profile_update']);
function wireType(legacy={}){return LEGACY_TYPES[String(legacy?.t||'')]||null}
function knownLegacy(legacy={}){return !!wireType(legacy)}
function knownEnvelope(type){return ENVELOPE_TYPES.includes(String(type||''))}
function finite(v){return Number.isFinite(Number(v))}
function validateLegacy(legacy={}){
  const t=String(legacy?.t||'');
  if(!knownLegacy(legacy))return{ok:false,reason:'unsupported-legacy-type',errors:['legacy-type']};
  const e=[];
  if(['state','start','welcome','resume_state'].includes(t)&&(!legacy.st||typeof legacy.st!=='object'))e.push('state');
  if(['start','welcome','resume_state','players'].includes(t)&&!Array.isArray(legacy.players))e.push('players');
  if(t==='resume_hello'){
    if(!legacy.cid)e.push('cid');
    if(!finite(legacy.requestedSeat)||Number(legacy.requestedSeat)<0)e.push('requestedSeat');
    if(!legacy.seatToken)e.push('seatToken');
  }
  if(t==='cmd'){
    if(typeof legacy.c!=='string'||!legacy.c)e.push('command');
    if(legacy.p!=null&&typeof legacy.p!=='object')e.push('payload');
  }
  if(t==='respond'&&legacy.response!=null&&typeof legacy.response!=='object'&&typeof legacy.response!=='string')e.push('response');
  if(['ping','pong'].includes(t)&&legacy.ts!=null&&!finite(legacy.ts))e.push('timestamp');
  if(t==='hello'&&!legacy.cid)e.push('cid');
  if(t==='profile_update'){
    if(legacy.avatarId!=null&&(typeof legacy.avatarId!=='string'||legacy.avatarId.length>80))e.push('avatarId');
    if(legacy.name!=null&&(typeof legacy.name!=='string'||legacy.name.length>120))e.push('name');
    if(legacy.commander!=null&&(typeof legacy.commander!=='string'||legacy.commander.length>220))e.push('commander');
    if(legacy.deckName!=null&&(typeof legacy.deckName!=='string'||legacy.deckName.length>220))e.push('deckName');
    if(legacy.deckColorIdentity!=null&&(!Array.isArray(legacy.deckColorIdentity)||legacy.deckColorIdentity.length>5||legacy.deckColorIdentity.some(x=>typeof x!=='string'||!/^(W|U|B|R|G)$/.test(String(x).toUpperCase()))))e.push('deckColorIdentity');
  }
  if(t==='resync_request'){
    if(!legacy.requestId||typeof legacy.requestId!=='string')e.push('requestId');
    if(legacy.clientRevision!=null&&!finite(legacy.clientRevision))e.push('clientRevision');
    if(legacy.clientSeq!=null&&!finite(legacy.clientSeq))e.push('clientSeq');
  }
  if(t==='command_result'){
    if(!legacy.requestId||typeof legacy.requestId!=='string')e.push('requestId');
    if(typeof legacy.accepted!=='boolean')e.push('accepted');
    if(legacy.authorityRevision!=null&&!finite(legacy.authorityRevision))e.push('authorityRevision');
  }
  return{ok:e.length===0,reason:e.length?'invalid-legacy-payload':null,errors:e};
}
function authorityForLegacy(legacy={}){
  const t=String(legacy?.t||'');
  if(HOST_LEGACY.has(t))return'host';
  if(PEER_LEGACY.has(t))return'peer';
  return null;
}
function inspect(packet,{expectedHostId=null,roomSession=null,descriptor=null}={}){
  if(!packet||!knownEnvelope(packet.type))return{ok:false,reason:'unsupported-envelope-type',errors:['envelope-type']};
  if(packet.type==='ACK')return{ok:true,reason:null};
  const legacy=packet?.payload?.legacy;
  const v=validateLegacy(legacy);
  if(!v.ok)return v;
  const required=authorityForLegacy(legacy);
  if(required==='host'&&String(packet.senderId)!==String(expectedHostId||''))return{ok:false,reason:'authority',errors:['host-authority']};
  if(required==='peer'&&String(packet.authority||'peer')==='host'&&String(packet.senderId)===String(expectedHostId||'')){
    // Host may emit heartbeat/presence-compatible packets for compatibility.
  }
  if(descriptor&&roomSession){
    const participant=roomSession.participantByPlayer?.(descriptor,String(packet.senderId||legacy?.cid||''));
    if(participant?.role==='spectator'&&['cmd','respond','pass','ready'].includes(String(legacy.t||'')))return{ok:false,reason:'spectator-gameplay',errors:['spectator-gameplay']};
  }
  return{ok:true,reason:null,legacy};
}
function summary(){return{version:VERSION,schemaVersion:SCHEMA,legacyTypes:Object.keys(LEGACY_TYPES),envelopeTypes:[...ENVELOPE_TYPES]}}
return{VERSION,SCHEMA,LEGACY_TYPES,ENVELOPE_TYPES,wireType,knownLegacy,knownEnvelope,validateLegacy,authorityForLegacy,inspect,summary};
});

