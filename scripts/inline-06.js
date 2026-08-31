
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MTGLiveReconnect=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const VERSION='phase35-live-reconnect-1',SCHEMA=1;
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>Date.now();
function identityKey(room){return'mtgte_room_identity_v1_'+String(room||'').toLowerCase()}
function normalizeIdentity(v={}){return{room:String(v.room||'').toLowerCase(),playerId:String(v.playerId||''),seat:Number(v.seat||0),seatToken:v.seatToken?String(v.seatToken):null,role:v.role==='spectator'?'spectator':'player',epoch:Math.max(0,Number(v.epoch||0)),savedAt:Number(v.savedAt||now())}}
function saveIdentity(storage,identity){const x=normalizeIdentity(identity);if(!x.room||!x.playerId)return false;storage?.setItem?.(identityKey(x.room),JSON.stringify(x));return true}
function loadIdentity(storage,room){try{const raw=storage?.getItem?.(identityKey(room));return raw?normalizeIdentity(JSON.parse(raw)):null}catch{return null}}
function clearIdentity(storage,room){try{storage?.removeItem?.(identityKey(room));return true}catch{return false}}
function resumeHello({room,identity,peerId='',fingerprint=null,profile={}}={}){const i=normalizeIdentity({...identity,room:room||identity?.room});if(!i.room||!i.playerId||!i.seatToken)throw new Error('Stored room identity required');return{t:'resume_hello',room:i.room,cid:i.playerId,requestedSeat:i.seat,seatToken:i.seatToken,role:i.role,peerId:String(peerId||''),lastSeq:Number(fingerprint?.seq||0),stateHash:fingerprint?.hash||null,name:profile.name||null,commander:profile.commander||null,avatarId:profile.avatarId||null,deckName:profile.deckName||null,deckSize:Number(profile.deckSize||0)||null,commanderCount:Number(profile.commanderCount||0)||null,deckColorIdentity:Array.isArray(profile.deckColorIdentity)?profile.deckColorIdentity.slice(0,5):[]}}
function resumeState({descriptor,seat,seatToken,players,state}={}){if(!descriptor||!seat)throw new Error('Descriptor and seat required');return{t:'resume_state',descriptor:clone(descriptor),id:Number(seat),seatToken:String(seatToken||''),players:clone(players||[]),st:clone(state||{}),epoch:Number(descriptor.epoch||0),matchId:descriptor.matchId||null}}
function bootstrapWelcome({descriptor,seat,seatToken,players,state}={}){return{t:'welcome',descriptor:clone(descriptor),id:Number(seat),seatToken:String(seatToken||''),players:clone(players||[]),st:clone(state||{})}}
function reclaim({roomSession,descriptor,hello,peerId,at=now()}={}){if(!roomSession||!descriptor||!hello)return{ok:false,reason:'invalid-reclaim'};const seat=Number(hello.requestedSeat||0),role=hello.role==='spectator'?'spectator':'player';return roomSession.claimSeat(descriptor,{playerId:String(hello.cid||''),peerId:String(peerId||hello.peerId||''),seat:role==='spectator'?0:seat,role,seatToken:hello.seatToken||null,at})}
function freshClaim({roomSession,descriptor,playerId,peerId,seat,role='player',at=now(),tokenFactory}={}){return roomSession.claimSeat(descriptor,{playerId,peerId,seat,role,at,tokenFactory})}
function failoverCandidate({roomResilience,players,currentHostSeat=1,at=now(),timeoutMs=15000}={}){if(!roomResilience)return null;const peers=(players||[]).filter(p=>Number(p.id)!==Number(currentHostSeat)).map(p=>({playerId:Number(p.id),peerId:String(p.cid||''),seat:Number(p.id),connected:p.connected!==false,lastSeen:Number(p.lastSeen||at)}));return roomResilience.electHost(peers,{at,timeoutMs})}
function promote({roomSession,descriptor,newHostPlayerId,newHostPeerId,at=now()}={}){if(!roomSession||!descriptor)throw new Error('Room session required');return roomSession.failover(descriptor,{newHostPlayerId,newHostPeerId,at})}
function packetBootstrapDescriptor(legacy,current=null){const d=legacy?.descriptor;if(!d)return current||null;if(!current)return d;return Number(d.epoch||0)>=Number(current.epoch||0)?d:current}
function shouldResumeBattle({battleStarted=false,state=null}={}){return !!battleStarted||!!state?.meta?.startedAt}
function canGameplay({roomSession,descriptor,playerId}={}){return !!roomSession?.canSendGameplay?.(descriptor,playerId)}
return{VERSION,SCHEMA,identityKey,normalizeIdentity,saveIdentity,loadIdentity,clearIdentity,resumeHello,resumeState,bootstrapWelcome,reclaim,freshClaim,failoverCandidate,promote,packetBootstrapDescriptor,shouldResumeBattle,canGameplay};
});

