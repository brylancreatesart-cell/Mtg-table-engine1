#!/usr/bin/env python3
from pathlib import Path
SRC_DIR=Path('scripts/app-src')

def replace_once(old,new,label):
    hits=[]
    for p in sorted(SRC_DIR.glob('controller-part-*.part.js')):
        t=p.read_text(encoding='utf-8');n=t.count(old)
        if n:hits.append((p,n,t))
    total=sum(n for _,n,_ in hits)
    if total!=1:raise SystemExit(f'Safety stop: {label} expected 1 match, found {total}')
    p,_,t=hits[0];p.write_text(t.replace(old,new,1),encoding='utf-8');print('patched',label,p)

old_close="if(!HST&&x===cc&&roomDescriptor){let hp=MTGRoomSession.participantByPlayer(roomDescriptor,roomDescriptor.hostPlayerId),hostSeat=Number(hp?.seat||1),h=players.find(p=>p.id===hostSeat);if(h){h.connected=false;h.lastSeen=Date.now()-20000}setTimeout(()=>{if(current()&&(!cc||!cc.open))attemptHostFailover()},1800)}});"
new_close="if(!HST&&x===cc&&roomDescriptor){let hp=MTGRoomSession.participantByPlayer(roomDescriptor,roomDescriptor.hostPlayerId),hostSeat=Number(hp?.seat||1),h=players.find(p=>p.id===hostSeat);if(h){h.connected=false;h.lastSeen=Date.now()}setTimeout(()=>{if(current()&&(!cc||!cc.open))resumeNet()},900);setTimeout(()=>{if(current()&&(!cc||!cc.open))resumeNet()},4200);setTimeout(()=>{if(current()&&(!cc||!cc.open))attemptHostFailover()},16000)}});"
replace_once(old_close,new_close,'graceful client reconnect before failover')

old_failover="function attemptHostFailover(){if(HST||!activeRoom||!roomDescriptor||typeof MTGLiveReconnect==='undefined'||typeof MTGRoomResilience==='undefined')return false;let hostPart=MTGRoomSession.participantByPlayer(roomDescriptor,roomDescriptor.hostPlayerId),hostSeat=Number(hostPart?.seat||1),candidate=MTGLiveReconnect.failoverCandidate({roomResilience:MTGRoomResilience,players,currentHostSeat:hostSeat,timeoutMs:15000});if(!candidate||Number(candidate.playerId)!==Number(me))return false;let mine=MTGRoomSession.participantBySeat(roomDescriptor,me);if(!mine)return false;try{roomDescriptor=MTGLiveReconnect.promote({roomSession:MTGRoomSession,descriptor:roomDescriptor,newHostPlayerId:mine.playerId,newHostPeerId:'mtgte-'+activeRoom});transportSession=null;authoritySyncRevision=Math.max(authoritySyncRevision,typeof MTGAuthoritativeSync!=='undefined'?MTGAuthoritativeSync.stateRevision(st):0);HST=1;let oldHost=players.find(p=>p.id===hostSeat);if(oldHost)oldHost.connected=false;let self=players.find(p=>p.id===me);if(self){self.connected=true;self.lastSeen=Date.now()}try{cc?.close()}catch{};cc=null;try{peer?.destroy?.()}catch{};peer=new Peer('mtgte-'+activeRoom);peer.on('open',()=>{netState('HOST FAILOVER ONLINE');toast('Host failover complete · epoch '+roomDescriptor.epoch);send({t:'players',players});send({t:'state',st})});peer.on('connection',bindHostIncoming);peer.on('disconnected',()=>netState('HOST RECONNECTING',1));peer.on('error',()=>netState('HOST FAILOVER ERROR',1));return true}catch(e){netState('FAILOVER WAITING',1);return false}}"
new_failover="function attemptHostFailover(){if(HST||!activeRoom||!roomDescriptor||typeof MTGLiveReconnect==='undefined'||typeof MTGRoomResilience==='undefined')return false;let hostPart=MTGRoomSession.participantByPlayer(roomDescriptor,roomDescriptor.hostPlayerId),hostSeat=Number(hostPart?.seat||1),candidate=MTGLiveReconnect.failoverCandidate({roomResilience:MTGRoomResilience,players,currentHostSeat:hostSeat,timeoutMs:15000});if(!candidate||Number(candidate.playerId)!==Number(me))return false;let mine=MTGRoomSession.participantBySeat(roomDescriptor,me);if(!mine)return false;let previousDescriptor=roomDescriptor;try{roomDescriptor=MTGLiveReconnect.promote({roomSession:MTGRoomSession,descriptor:roomDescriptor,newHostPlayerId:mine.playerId,newHostPeerId:'mtgte-'+activeRoom});transportSession=null;authoritySyncRevision=Math.max(authoritySyncRevision,typeof MTGAuthoritativeSync!=='undefined'?MTGAuthoritativeSync.stateRevision(st):0);HST=1;let oldHost=players.find(p=>p.id===hostSeat);if(oldHost)oldHost.connected=false;let self=players.find(p=>p.id===me);if(self){self.connected=true;self.lastSeen=Date.now()}try{cc?.close()}catch{};cc=null;try{peer?.destroy?.()}catch{};peer=new Peer('mtgte-'+activeRoom);peer.on('open',()=>{saveRoomIdentity(me,mine.seatToken,'player');netState('HOST FAILOVER ONLINE');toast('Host failover complete · epoch '+roomDescriptor.epoch);send({t:'players',players});send({t:'state',st})});peer.on('connection',bindHostIncoming);peer.on('disconnected',()=>{netState('HOST RECONNECTING',1);setTimeout(resumeNet,900)});peer.on('error',e=>{if(e?.type==='unavailable-id'){roomDescriptor=previousDescriptor;transportSession=null;toast('Another host recovered first. Rejoining the room.');demoteFormerHost()}else{netState('HOST FAILOVER ERROR',1);setTimeout(resumeNet,900)}});return true}catch(e){roomDescriptor=previousDescriptor;transportSession=null;HST=0;netState('FAILOVER WAITING',1);setTimeout(resumeNet,900);return false}}"
replace_once(old_failover,new_failover,'failover rollback and host reconnect')

old_interval="setInterval(()=>{try{if(HST){cs.forEach(x=>{if(x.open)x.send({t:'ping',ts:Date.now()})})}else if(cc&&cc.open)cc.send({t:'ping',ts:Date.now()});else if(activeRoom)resumeNet()}catch{}},15000);"
new_interval="setInterval(()=>{try{if(HST){if(peer?.disconnected)resumeNet();cs.forEach(x=>{if(x.open)x.send({t:'ping',ts:Date.now()})})}else if(cc&&cc.open)cc.send({t:'ping',ts:Date.now()});else if(activeRoom)resumeNet()}catch{}},15000);"
replace_once(old_interval,new_interval,'host heartbeat reconnect')

old_host="peer.on('open',()=>netState('HOST ONLINE'));peer.on('disconnected',()=>netState('RECONNECTING',1));peer.on('error',e=>{if(e?.type==='unavailable-id')demoteFormerHost();else netState('HOST ERROR',1)});peer.on('connection',bindHostIncoming)"
new_host="peer.on('open',()=>netState('HOST ONLINE'));peer.on('disconnected',()=>{netState('HOST RECONNECTING',1);setTimeout(resumeNet,900)});peer.on('error',e=>{if(e?.type==='unavailable-id')demoteFormerHost();else{netState('HOST ERROR',1);setTimeout(resumeNet,900)}});peer.on('connection',bindHostIncoming)"
replace_once(old_host,new_host,'initial host reconnect handler')

combined=''.join(p.read_text(encoding='utf-8') for p in sorted(SRC_DIR.glob('controller-part-*.part.js')))
assert 'h.lastSeen=Date.now()-20000' not in combined
assert 'attemptHostFailover()},1800' not in combined
assert 'attemptHostFailover()},16000' in combined
assert 'if(peer?.disconnected)resumeNet()' in combined
assert "e?.type==='unavailable-id'" in combined
assert 'roomDescriptor=previousDescriptor' in combined
print('batch 7 reconnect hardening checks passed')
