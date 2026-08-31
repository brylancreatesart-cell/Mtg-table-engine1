
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGRoomSession=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase33-room-session-1',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();
const token=()=>('seat_'+Math.random().toString(36).slice(2)+Date.now().toString(36));

function normalizeParticipant(p={}){
  return{
    playerId:String(p.playerId??''),
    peerId:String(p.peerId??''),
    seat:Number(p.seat||0),
    role:p.role==='spectator'?'spectator':'player',
    seatToken:p.seatToken?String(p.seatToken):null,
    joinedAt:Number(p.joinedAt||now()),
    lastSeen:Number(p.lastSeen||now())
  };
}
function createDescriptor({room,sessionId,matchId=null,hostPlayerId,hostPeerId,participants=[],epoch=1,at=now()}={}){
  if(!room||!sessionId||!hostPlayerId)throw new Error('room, sessionId and hostPlayerId required');
  const ps=participants.map(normalizeParticipant);
  if(!ps.some(p=>p.playerId===String(hostPlayerId)))ps.push(normalizeParticipant({playerId:hostPlayerId,peerId:hostPeerId||'',seat:1,role:'player',seatToken:token(),joinedAt:at,lastSeen:at}));
  return{schemaVersion:SCHEMA,room:String(room),sessionId:String(sessionId),matchId:matchId==null?null:String(matchId),epoch:Math.max(1,Math.trunc(Number(epoch)||1)),hostPlayerId:String(hostPlayerId),hostPeerId:String(hostPeerId||''),createdAt:Number(at),updatedAt:Number(at),participants:ps.sort((a,b)=>a.seat-b.seat||a.playerId.localeCompare(b.playerId))};
}
function hostSenderId(d){return d?'host:'+d.room+':epoch:'+Number(d.epoch||0):null}
function validateDescriptor(d){
  const errors=[];
  if(Number(d?.schemaVersion)!==SCHEMA)errors.push('schema');
  if(!d?.room)errors.push('room');
  if(!d?.sessionId)errors.push('sessionId');
  if(!Number.isInteger(Number(d?.epoch))||Number(d.epoch)<1)errors.push('epoch');
  if(!d?.hostPlayerId)errors.push('hostPlayerId');
  return{ok:errors.length===0,errors};
}
function participantByPlayer(d,playerId){return(d?.participants||[]).find(p=>String(p.playerId)===String(playerId))||null}
function participantBySeat(d,seat){return(d?.participants||[]).find(p=>Number(p.seat)===Number(seat))||null}
function claimSeat(d,{playerId,peerId,seat,role='player',seatToken=null,at=now(),tokenFactory=token}={}){
  if(!validateDescriptor(d).ok)throw new Error('Invalid descriptor');
  const out=clone(d),existing=participantByPlayer(out,playerId),occupied=participantBySeat(out,seat);
  if(role==='spectator'){
    const p=normalizeParticipant({playerId,peerId,seat:0,role:'spectator',seatToken:null,joinedAt:existing?.joinedAt||at,lastSeen:at});
    out.participants=(out.participants||[]).filter(x=>String(x.playerId)!==String(playerId)).concat(p);out.updatedAt=at;return{ok:true,descriptor:out,participant:p,reclaimed:false};
  }
  if(existing&&existing.seatToken){
    if(String(existing.seatToken)!==String(seatToken||''))return{ok:false,reason:'bad-seat-token',descriptor:d};
    if(occupied&&String(occupied.playerId)!==String(playerId))return{ok:false,reason:'seat-occupied',descriptor:d};
    const p=normalizeParticipant({...existing,peerId,seat,role:'player',lastSeen:at});
    out.participants=out.participants.map(x=>String(x.playerId)===String(playerId)?p:x);out.updatedAt=at;
    return{ok:true,descriptor:out,participant:p,reclaimed:true};
  }
  if(occupied)return{ok:false,reason:'seat-occupied',descriptor:d};
  const p=normalizeParticipant({playerId,peerId,seat,role:'player',seatToken:tokenFactory(),joinedAt:at,lastSeen:at});
  out.participants=(out.participants||[]).filter(x=>String(x.playerId)!==String(playerId)).concat(p).sort((a,b)=>a.seat-b.seat||a.playerId.localeCompare(b.playerId));out.updatedAt=at;
  return{ok:true,descriptor:out,participant:p,reclaimed:false};
}
function canSendGameplay(d,playerId){
  const p=participantByPlayer(d,playerId);return !!p&&p.role==='player';
}
function failover(d,{newHostPlayerId,newHostPeerId,at=now()}={}){
  if(!participantByPlayer(d,newHostPlayerId))throw new Error('New host must be participant');
  const out=clone(d);out.epoch=Number(out.epoch||0)+1;out.hostPlayerId=String(newHostPlayerId);out.hostPeerId=String(newHostPeerId||participantByPlayer(out,newHostPlayerId)?.peerId||'');out.updatedAt=at;return out;
}
function packetEpochStatus(packet,d){
  const pe=Number(packet?.epoch||0),ce=Number(d?.epoch||0);
  if(pe<ce)return'stale';
  if(pe>ce)return'future';
  return'current';
}
function validatePacket(packet,d,{allowFuture=false}={}){
  const errors=[];
  if(String(packet?.room)!==String(d?.room))errors.push('room-mismatch');
  if(String(packet?.sessionId)!==String(d?.sessionId))errors.push('session-mismatch');
  if(d?.matchId!=null&&packet?.matchId!=null&&String(packet.matchId)!==String(d.matchId))errors.push('match-mismatch');
  const es=packetEpochStatus(packet,d);
  if(es==='stale')errors.push('stale-epoch');
  if(es==='future'&&!allowFuture)errors.push('future-epoch');
  if(packet?.authority==='host'&&String(packet?.senderId)!==String(hostSenderId(d)))errors.push('stale-host');
  return{ok:errors.length===0,errors,epochStatus:es};
}
return{VERSION,SCHEMA,normalizeParticipant,createDescriptor,hostSenderId,validateDescriptor,participantByPlayer,participantBySeat,claimSeat,canSendGameplay,failover,packetEpochStatus,validatePacket};
});
