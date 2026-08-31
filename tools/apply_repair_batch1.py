#!/usr/bin/env python3
from pathlib import Path

SRC_DIR=Path('scripts/app-src')


def replace_once(old,new,label):
    hits=[]
    for path in sorted(SRC_DIR.glob('controller-part-*.part.js')):
        text=path.read_text(encoding='utf-8')
        count=text.count(old)
        if count:
            hits.append((path,count,text))
    total=sum(c for _,c,_ in hits)
    if total!=1:
        raise SystemExit(f'Safety stop: {label} expected exactly 1 match, found {total}')
    path,count,text=hits[0]
    path.write_text(text.replace(old,new,1),encoding='utf-8')
    print(f'patched {label}: {path}')

old_invite="function joinRoomInvite(m){let room=socialRoomCode(m?.room);if(!room)return toast('That room invite is invalid.');$('modal').classList.add('h');$('room').classList.remove('h');$('jb').classList.remove('h');$('jc').value=room;$('join').click();setTimeout(()=>$('con').click(),100)}"
new_invite="function joinRoomInvite(m){let room=socialRoomCode(m?.room);if(!room)return toast('That room invite is invalid.');$('modal').classList.add('h');openJoinRoomPanel();$('jc').value=room;connectToRoomCode(room)}"
replace_once(old_invite,new_invite,'direct invite join')

old_handlers="$('join').onclick=()=>{soloTestMode=false;startLobbyAmbience();$('room').classList.remove('h');$('jb').classList.remove('h')};$('con').onclick=()=>{let roomInput=$('jc').value.trim().toLowerCase();if(!/^[a-z0-9]{6}$/.test(roomInput))return toast('Enter a valid 6-character room code.');let go=()=>{if(!window.Peer){if(peerTransportState==='unavailable'){netState('LOCAL MODE',1);return toast('Multiplayer transport unavailable.')}return setTimeout(go,400)}activeRoom=roomInput;roomDescriptor=null;transportSession=null;authoritySyncRevision=0;authorityLobbyRevision=0;lastLobbyRevision=0;clientConnectionGuard?.invalidate?.();pendingCommands.clear();localStorage.setItem('mtgte_last_room',activeRoom);peer=new Peer();peer.on('open',()=>{cc=peer.connect('mtgte-'+activeRoom);bindConn(cc,null)});peer.on('disconnected',()=>netState('RECONNECTING',1))};go()};"
new_handlers="function openJoinRoomPanel(){soloTestMode=false;startLobbyAmbience();$('room').classList.remove('h');$('jb').classList.remove('h')}function connectToRoomCode(raw){let roomInput=String(raw||'').trim().toLowerCase();if(!/^[a-z0-9]{6}$/.test(roomInput))return toast('Enter a valid 6-character room code.');openJoinRoomPanel();$('jc').value=roomInput;let go=()=>{if(!window.Peer){if(peerTransportState==='unavailable'){netState('LOCAL MODE',1);return toast('Multiplayer transport unavailable.')}return setTimeout(go,400)}activeRoom=roomInput;roomDescriptor=null;transportSession=null;authoritySyncRevision=0;authorityLobbyRevision=0;lastLobbyRevision=0;clientConnectionGuard?.invalidate?.();pendingCommands.clear();localStorage.setItem('mtgte_last_room',activeRoom);peer=new Peer();peer.on('open',()=>{cc=peer.connect('mtgte-'+activeRoom);bindConn(cc,null)});peer.on('disconnected',()=>netState('RECONNECTING',1))};go()}$('join').onclick=openJoinRoomPanel;$('con').onclick=()=>connectToRoomCode($('jc').value);"
replace_once(old_handlers,new_handlers,'direct room controls')

# Guard against the specific synthetic-click regression we are removing.
combined=''.join(p.read_text(encoding='utf-8') for p in sorted(SRC_DIR.glob('controller-part-*.part.js')))
for bad in ("$('join').click()","$('con').click()"):
    if bad in combined:
        raise SystemExit(f'Safety stop: synthetic room click remains: {bad}')
if 'function connectToRoomCode(raw)' not in combined or 'function openJoinRoomPanel()' not in combined:
    raise SystemExit('Safety stop: direct room helpers were not installed')
print('batch 1 source checks passed')
