#!/usr/bin/env python3
from pathlib import Path
SRC_DIR=Path('scripts/app-src')
old="function persistActiveDeckSelection(id){activeDeckId=id||null;if(!playerProfile)return activeDeckId;if(playerProfile?.auth?.mode==='authenticated'){let key='mtgte_active_deck_'+playerProfile.id;if(activeDeckId){localStorage.setItem(key,activeDeckId);localStorage.setItem('mtgte_active_deck',activeDeckId)}else{localStorage.removeItem(key);localStorage.removeItem('mtgte_active_deck')}}else{try{if(activeDeckId)sessionStorage.setItem('mtgte_guest_active_deck',activeDeckId);else sessionStorage.removeItem('mtgte_guest_active_deck')}catch{}}return activeDeckId}"
new="function persistActiveDeckSelection(id){activeDeckId=id||null;if(!playerProfile)return activeDeckId;if(playerProfile?.auth?.mode==='authenticated'){let key='mtgte_active_deck_'+playerProfile.id;if(activeDeckId)localStorage.setItem(key,activeDeckId);else localStorage.removeItem(key);localStorage.removeItem('mtgte_active_deck')}else{try{if(activeDeckId)sessionStorage.setItem('mtgte_guest_active_deck',activeDeckId);else sessionStorage.removeItem('mtgte_guest_active_deck')}catch{}}return activeDeckId}"
hits=[]
for p in sorted(SRC_DIR.glob('controller-part-*.part.js')):
    t=p.read_text(encoding='utf-8');n=t.count(old)
    if n:hits.append((p,n,t))
if sum(n for _,n,_ in hits)!=1:raise SystemExit(f'Safety stop: active deck owner expected once, found {sum(n for _,n,_ in hits)}')
p,_,t=hits[0];p.write_text(t.replace(old,new,1),encoding='utf-8')
all_text=''.join(x.read_text(encoding='utf-8') for x in sorted(SRC_DIR.glob('controller-part-*.part.js')))
if "localStorage.setItem('mtgte_active_deck',activeDeckId)" in all_text:raise SystemExit('Safety stop: generic active deck write remains')
print('batch 5 account-scoped active deck repair applied')
