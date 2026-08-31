#!/usr/bin/env python3
from pathlib import Path

SRC_DIR=Path('scripts/app-src')

def replace_once(old,new,label):
    found=[]
    for path in sorted(SRC_DIR.glob('controller-part-*.part.js')):
        text=path.read_text(encoding='utf-8')
        n=text.count(old)
        if n: found.append((path,n,text))
    total=sum(n for _,n,_ in found)
    if total!=1:
        raise SystemExit(f'Safety stop: {label} expected 1 match, found {total}')
    path,_,text=found[0]
    path.write_text(text.replace(old,new,1),encoding='utf-8')
    print(f'patched {label}: {path}')

old_profile="function profile(){const commander=prof.commander||localStorage.getItem('mtgte_commander')||null,partner=prof.partner||localStorage.getItem('mtgte_partner')||null,analyzed=MTGDeckEngine.analyzeDeck(prof.cards);prof={...analyzed,commander,partner};prof.cardMap=new Map(prof.cards.map(c=>[c.n.toLowerCase(),c]));prof.mods=MTGDeckEngine.quickActionGroups(prof);applyDeckTheme()}"
new_profile="function profile(){const analyzed=MTGDeckEngine.analyzeDeck(prof.cards),names=new Set((analyzed.cards||[]).map(c=>String(c.n||'').trim().toLowerCase())),commanderCandidate=prof.commander||localStorage.getItem('mtgte_commander')||null,partnerCandidate=prof.partner||localStorage.getItem('mtgte_partner')||null,commander=commanderCandidate&&names.has(String(commanderCandidate).trim().toLowerCase())?commanderCandidate:null,partner=partnerCandidate&&names.has(String(partnerCandidate).trim().toLowerCase())?partnerCandidate:null;prof={...analyzed,commander,partner};prof.cardMap=new Map(prof.cards.map(c=>[c.n.toLowerCase(),c]));prof.mods=MTGDeckEngine.quickActionGroups(prof);applyDeckTheme()}"
replace_once(old_profile,new_profile,'discard stale commander selections')

old_verify="$('ver').onclick=async()=>{prof.cards=parse($('deck').value);if(!prof.cards.length)return toast('Add a deck first');$('conf').textContent='Reading deck list…';"
new_verify="function resetVerificationPresentation(){if($('vr'))$('vr').classList.add('h');if($('commanderPick'))$('commanderPick').classList.add('h');if($('legalityReport'))$('legalityReport').innerHTML='';if($('tags'))$('tags').innerHTML='';if($('conf'))$('conf').textContent='';if($('verifyDetails'))$('verifyDetails').innerHTML='';if($('commanderSelect'))$('commanderSelect').innerHTML='<option value=\"\">Choose your commander</option>';if($('partnerSelect'))$('partnerSelect').innerHTML='<option value=\"\">None</option>';if($('commanderInfo'))$('commanderInfo').textContent='Choose the card the app should track as your commander.'}function clearInvalidVerificationState(){prof={...prof,cards:[],mods:[],tags:[],capabilities:[],cardMap:new Map(),legality:null};resetVerificationPresentation()}$('ver').onclick=async()=>{resetVerificationPresentation();prof.cards=parse($('deck').value);if(!prof.cards.length){clearInvalidVerificationState();return toast('Add a valid deck list first')}$('conf').textContent='Reading deck list…';"
replace_once(old_verify,new_verify,'reset stale verification presentation')

combined=''.join(p.read_text(encoding='utf-8') for p in sorted(SRC_DIR.glob('controller-part-*.part.js')))
for required in ('function resetVerificationPresentation()','function clearInvalidVerificationState()','names.has(String(commanderCandidate).trim().toLowerCase())'):
    if required not in combined: raise SystemExit(f'Safety stop: missing {required}')
print('batch 2 source checks passed')
