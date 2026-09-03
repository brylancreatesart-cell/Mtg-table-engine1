#!/usr/bin/env python3
from pathlib import Path

HTML=Path('index.html')
CSS=Path('styles/app-src/styles-part-01.part.css')
JS1=Path('scripts/app-src/controller-part-01.part.js')
JS3=Path('scripts/app-src/controller-part-03.part.js')
html=HTML.read_text(encoding='utf-8')
css=CSS.read_text(encoding='utf-8')
js1=JS1.read_text(encoding='utf-8')
js3=JS3.read_text(encoding='utf-8')

def once(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'Safety stop: {label} expected 1 canonical match, found {n}')
    print('replace',label)
    return text.replace(old,new,1)

old_identity='<div><div id="myName" style="font-weight:850">Player</div><div class="small"><span class="onlineDot"></span>ONLINE · FRIEND CODE <span id="myFriendCode">------</span></div></div>'
new_identity='<div class="lobbyIdentityText"><div id="myName" style="font-weight:850">Player</div><div id="lobbyDeckIdentity" class="lobbyDeckIdentity" aria-live="polite"><span class="lobbyDeckPrimary">NO ACTIVE DECK</span><span class="lobbyDeckCommander">Verify or select a deck</span></div><div class="small lobbyAccountMeta"><span class="onlineDot"></span>ONLINE · FRIEND CODE <span id="myFriendCode">------</span></div></div>'
html=once(html,old_identity,new_identity,'lobby identity markup')

old_css='.profileCard{justify-content:flex-start}.profileCard>button{margin-left:auto}'
new_css='.profileCard{justify-content:flex-start}.profileCard>button{margin-left:auto}.lobbyIdentityText{min-width:0;display:grid;gap:2px}.lobbyDeckIdentity{display:flex;align-items:center;flex-wrap:wrap;gap:5px 8px;min-width:0;margin-top:2px}.lobbyDeckPrimary{font-size:11px;font-weight:900;letter-spacing:.045em;color:color-mix(in srgb,var(--deck-a,#52b8ff) 58%,#f2f7fa);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(48vw,360px)}.lobbyDeckCommander{font-size:9px;color:color-mix(in srgb,var(--deck-b,#b458ff) 28%,var(--m));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(55vw,420px)}.lobbyDeckIdentity .deckManaPips{transform:translateY(1px)}.lobbyAccountMeta{margin-top:1px}'
css=once(css,old_css,new_css,'lobby identity visual owner')

old_render="function renderProfile(){\n if(!playerProfile)return;\n playerProfile.displayName=playerProfile.displayName||playerProfile.name||'Player';playerProfile.name=playerProfile.displayName;playerProfile.code=String(playerProfile.friendCode||playerProfile.code||'').replace(/^TME-/,'');\n $('myName').textContent=playerProfile.displayName;$('myFriendCode').textContent=playerProfile.friendCode||('TME-'+playerProfile.code);$('myAvatar').innerHTML=avatarMarkup(playerProfile.avatarId,{compact:true});let ha=$('hudAvatar');if(ha)ha.innerHTML=avatarMarkup(playerProfile.avatarId);let hud=document.querySelector('.playerHud'),av=MTGAvatars.get(playerProfile.avatarId);if(hud)hud.dataset.avatarTheme=av.theme;\n}"
new_render="function renderLobbyDeckIdentity(){let el=$('lobbyDeckIdentity');if(!el)return;let d=typeof currentSavedDeck==='function'?currentSavedDeck():null,deckName=d?.name||null,commander=prof?.commander||d?.commander||null,identity=d?deckIdentity(d):[];if(!deckName&&!commander){el.innerHTML='<span class=\"lobbyDeckPrimary\">NO ACTIVE DECK</span><span class=\"lobbyDeckCommander\">Verify or select a deck</span>';return}el.innerHTML='<span class=\"lobbyDeckPrimary\">'+esc(deckName||'ACTIVE DECK')+'</span>'+deckManaPips(identity,{compact:true})+'<span class=\"lobbyDeckCommander\">COMMANDER · '+esc(commander||'Not selected')+'</span>'}\nfunction renderProfile(){\n if(!playerProfile)return;\n playerProfile.displayName=playerProfile.displayName||playerProfile.name||'Player';playerProfile.name=playerProfile.displayName;playerProfile.code=String(playerProfile.friendCode||playerProfile.code||'').replace(/^TME-/,'');\n $('myName').textContent=playerProfile.displayName;$('myFriendCode').textContent=playerProfile.friendCode||('TME-'+playerProfile.code);$('myAvatar').innerHTML=avatarMarkup(playerProfile.avatarId,{compact:true});let ha=$('hudAvatar');if(ha)ha.innerHTML=avatarMarkup(playerProfile.avatarId);let hud=document.querySelector('.playerHud'),av=MTGAvatars.get(playerProfile.avatarId);if(hud)hud.dataset.avatarTheme=av.theme;renderLobbyDeckIdentity();\n}"
js1=once(js1,old_render,new_render,'lobby deck identity renderer')

old_prop="function hydrateProfileFromSavedDeck(d){if(!d)return false;let cards=Array.isArray(d.list)&&d.list.length?JSON.parse(JSON.stringify(d.list)):parse(deckListText(d));prof={cards,mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:d.commander||null,partner:d.partner||null};profile();$('deck').value=deckListText(d);if($('formatSelect'))$('formatSelect').value=String(d.format||'commander').toLowerCase();return true}function propagateActiveDeckSelection(){try{syncLocalProfilePresence({broadcast:true})}catch{}try{refreshPresence()}catch{}try{if(sharedDisplayMode)renderSharedDisplay()}catch{}return true}"
new_prop="function hydrateProfileFromSavedDeck(d){if(!d)return false;let cards=Array.isArray(d.list)&&d.list.length?JSON.parse(JSON.stringify(d.list)):parse(deckListText(d));prof={cards,mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:d.commander||null,partner:d.partner||null};profile();$('deck').value=deckListText(d);if($('formatSelect'))$('formatSelect').value=String(d.format||'commander').toLowerCase();return true}function propagateActiveDeckSelection(){try{renderLobbyDeckIdentity()}catch{}try{syncLocalProfilePresence({broadcast:true})}catch{}try{refreshPresence()}catch{}try{if(sharedDisplayMode)renderSharedDisplay()}catch{}return true}"
js3=once(js3,old_prop,new_prop,'live lobby deck identity refresh')

# Ownership / integration audit.
assert html.count('id="lobbyDeckIdentity"')==1
assert css.count('.lobbyDeckIdentity{')==1
assert js1.count('function renderLobbyDeckIdentity()')==1
assert js1.count('renderLobbyDeckIdentity();')==1
assert js3.count('try{renderLobbyDeckIdentity()}catch{}')==1
assert old_identity not in html
HTML.write_text(html,encoding='utf-8')
CSS.write_text(css,encoding='utf-8')
JS1.write_text(js1,encoding='utf-8')
JS3.write_text(js3,encoding='utf-8')
print('Premium cohesion pass 2 complete: active deck identity is visible and live-refreshing in the Lobby.')
