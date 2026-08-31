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

old_decl="let phase109DisplayRequested=typeof MTGSharedDisplay!=='undefined'&&MTGSharedDisplay.displayRequested(location),phase109DisplayRoom=typeof MTGSharedDisplay!=='undefined'?(MTGSharedDisplay.parseDisplayRoom(location)||''):'',sharedDisplayMode=!!phase109DisplayRequested,sharedDisplayWakeLock=null;let battleStarted=false;"
new_decl="let phase109DisplayRequested=typeof MTGSharedDisplay!=='undefined'&&MTGSharedDisplay.displayRequested(location),phase109DisplayRoom=typeof MTGSharedDisplay!=='undefined'?(MTGSharedDisplay.parseDisplayRoom(location)||''):'',sharedDisplayMode=!!phase109DisplayRequested,sharedDisplayWakeLock=null,sharedDisplayReconnectTimer=null,sharedDisplayConnectGeneration=0;let battleStarted=false;"
replace_once(old_decl,new_decl,'shared display reconnect state')

old_close="if(sharedDisplayMode){setTimeout(()=>{if(sharedDisplayMode&&activeRoom&&(!cc||!cc.open))connectSharedDisplay(activeRoom)},1800);return}"
new_close="if(sharedDisplayMode){scheduleSharedDisplayReconnect('connection-close',1800);return}"
replace_once(old_close,new_close,'shared display connection close scheduler')

old_connect="function connectSharedDisplay(room){if(typeof MTGSharedDisplay==='undefined')return;let r=MTGSharedDisplay.normalizeRoom(room);if(!r){showSharedDisplayPage();$('sharedDisplayJoin')?.classList.remove('h');$('sharedDisplayStage')?.classList.add('h');return toast('Enter a valid 6-character room code.')}sharedDisplayMode=true;phase109DisplayRoom=r;activeRoom=r.toLowerCase();roomDescriptor=null;transportSession=null;authoritySyncRevision=0;authorityLobbyRevision=0;lastLobbyRevision=0;clientConnectionGuard?.invalidate?.();pendingCommands.clear();showSharedDisplayPage();$('sharedDisplayJoin').classList.add('h');$('sharedDisplayStage').classList.remove('h');netState('CONNECTING',1);try{cc?.close()}catch{};try{peer?.destroy?.()}catch{};cc=null;peer=null;let go=()=>{if(!window.Peer){if(peerTransportState==='unavailable')return netState('DISPLAY OFFLINE',1);return setTimeout(go,400)}peer=new Peer();peer.on('open',()=>{cc=peer.connect('mtgte-'+activeRoom);bindConn(cc,null)});peer.on('disconnected',()=>netState('RECONNECTING',1));peer.on('error',()=>netState('DISPLAY ERROR',1))};go()}"
new_connect="function scheduleSharedDisplayReconnect(reason='retry',delay=1800){if(!sharedDisplayMode||!activeRoom)return false;clearTimeout(sharedDisplayReconnectTimer);let generation=sharedDisplayConnectGeneration,room=activeRoom;netState('DISPLAY RECONNECTING',1);sharedDisplayReconnectTimer=setTimeout(()=>{if(!sharedDisplayMode||generation!==sharedDisplayConnectGeneration||room!==activeRoom||cc?.open)return;connectSharedDisplay(room)},Math.max(500,Number(delay)||1800));return true}function connectSharedDisplay(room){if(typeof MTGSharedDisplay==='undefined')return;let r=MTGSharedDisplay.normalizeRoom(room);if(!r){showSharedDisplayPage();$('sharedDisplayJoin')?.classList.remove('h');$('sharedDisplayStage')?.classList.add('h');return toast('Enter a valid 6-character room code.')}sharedDisplayMode=true;phase109DisplayRoom=r;activeRoom=r.toLowerCase();let generation=++sharedDisplayConnectGeneration;clearTimeout(sharedDisplayReconnectTimer);sharedDisplayReconnectTimer=null;roomDescriptor=null;transportSession=null;authoritySyncRevision=0;authorityLobbyRevision=0;lastLobbyRevision=0;clientConnectionGuard?.invalidate?.();pendingCommands.clear();showSharedDisplayPage();$('sharedDisplayJoin').classList.add('h');$('sharedDisplayStage').classList.remove('h');netState('CONNECTING',1);try{cc?.close()}catch{};try{peer?.destroy?.()}catch{};cc=null;peer=null;let current=()=>sharedDisplayMode&&generation===sharedDisplayConnectGeneration&&activeRoom===r.toLowerCase();let go=()=>{if(!current())return;if(!window.Peer){if(peerTransportState==='unavailable'){netState('DISPLAY OFFLINE',1);return scheduleSharedDisplayReconnect('transport-unavailable',4000)}return setTimeout(go,400)}peer=new Peer();peer.on('open',()=>{if(!current())return;cc=peer.connect('mtgte-'+activeRoom);bindConn(cc,null)});peer.on('disconnected',()=>{if(!current())return;try{peer.reconnect()}catch{}scheduleSharedDisplayReconnect('peer-disconnected',1800)});peer.on('error',()=>{if(!current())return;netState('DISPLAY ERROR',1);scheduleSharedDisplayReconnect('peer-error',3000)})};go()}"
replace_once(old_connect,new_connect,'guarded shared display reconnect')

combined=''.join(p.read_text(encoding='utf-8') for p in sorted(SRC_DIR.glob('controller-part-*.part.js')))
assert "function scheduleSharedDisplayReconnect(reason='retry',delay=1800)" in combined
assert "scheduleSharedDisplayReconnect('connection-close',1800)" in combined
assert "scheduleSharedDisplayReconnect('peer-disconnected',1800)" in combined
assert "scheduleSharedDisplayReconnect('peer-error',3000)" in combined
assert 'generation!==sharedDisplayConnectGeneration' in combined
assert "peer.on('disconnected',()=>netState('RECONNECTING',1))" not in combined[combined.find('function connectSharedDisplay'):combined.find('function startSharedDisplayMode')]
print('batch 9 shared display reconnect checks passed')
