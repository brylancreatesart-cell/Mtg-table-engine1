
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGRoomResilience=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase22-room-resilience-1',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();

function normalizePeer(p={}){
  return{
    playerId:Number(p.playerId||p.id||0),
    peerId:String(p.peerId||''),
    seat:Number(p.seat||p.playerId||p.id||0),
    connected:p.connected!==false,
    lastSeen:Number(p.lastSeen||now()),
    isHost:!!p.isHost
  };
}
function heartbeat(peer,at=now()){const p=normalizePeer(peer);p.connected=true;p.lastSeen=at;return p}
function isStale(peer,{at=now(),timeoutMs=15000}={}){
  const p=normalizePeer(peer);return !p.connected||(at-p.lastSeen)>timeoutMs;
}
function roomHealth(peers,{at=now(),timeoutMs=15000}={}){
  const list=(peers||[]).map(normalizePeer),stale=list.filter(p=>isStale(p,{at,timeoutMs}));
  return{total:list.length,connected:list.length-stale.length,stale:stale.length,healthy:stale.length===0,stalePlayerIds:stale.map(p=>p.playerId)};
}
function electHost(peers,{at=now(),timeoutMs=15000}={}){
  const candidates=(peers||[]).map(normalizePeer).filter(p=>!isStale(p,{at,timeoutMs}));
  candidates.sort((a,b)=>a.seat-b.seat||a.playerId-b.playerId||a.peerId.localeCompare(b.peerId));
  return candidates[0]||null;
}
function handshake({room,playerId,peerId,lastSeq=0,stateHash=null}={}){
  if(!room)throw new Error('Room required');
  if(!playerId)throw new Error('Player ID required');
  return{type:'RESUME_HELLO',schemaVersion:SCHEMA,room:String(room),playerId:Number(playerId),peerId:String(peerId||''),lastSeq:Number(lastSeq||0),stateHash:stateHash||null,sentAt:now()};
}
function resumeOffer({room,hostPeerId,state,lastSeq=0,stateHash=null}={}){
  if(!room||!state)throw new Error('Room and state required');
  return{type:'RESUME_STATE',schemaVersion:SCHEMA,room:String(room),hostPeerId:String(hostPeerId||''),lastSeq:Number(lastSeq||0),stateHash:stateHash||null,state:clone(state),sentAt:now()};
}
function shouldAcceptSnapshot(local,{remoteSeq=0,remoteHash=null,localSeq=0,localHash=null}={}){
  remoteSeq=Number(remoteSeq||0);localSeq=Number(localSeq||0);
  if(remoteSeq<localSeq)return false;
  if(remoteSeq>localSeq)return true;
  if(remoteHash&&localHash&&remoteHash===localHash)return false;
  return remoteSeq===localSeq && !!remoteHash && remoteHash!==localHash;
}
function reconcileSnapshot(localState,offer,{localSeq=0,localHash=null}={}){
  if(!offer||offer.type!=='RESUME_STATE'||!offer.state)throw new Error('Invalid resume state');
  const accept=shouldAcceptSnapshot(localState,{remoteSeq:offer.lastSeq,remoteHash:offer.stateHash,localSeq,localHash});
  return{accepted:accept,state:accept?clone(offer.state):clone(localState),remoteSeq:Number(offer.lastSeq||0)};
}
function hostTransition(peers,currentHostId,opts={}){
  const current=(peers||[]).map(normalizePeer).find(p=>p.playerId===Number(currentHostId));
  if(current&&!isStale(current,opts))return{changed:false,host:current};
  const next=electHost(peers,opts);return{changed:!!next&&next.playerId!==Number(currentHostId),host:next};
}
function reconnectPlan({isHost=false,room,playerId,peerId,lastSeq=0,stateHash=null}={}){
  return isHost?{mode:'await-resume',room:String(room||''),playerId:Number(playerId||0)}:{mode:'request-resume',message:handshake({room,playerId,peerId,lastSeq,stateHash})};
}
return{VERSION,SCHEMA,normalizePeer,heartbeat,isStale,roomHealth,electHost,handshake,resumeOffer,shouldAcceptSnapshot,reconcileSnapshot,hostTransition,reconnectPlan};
});
