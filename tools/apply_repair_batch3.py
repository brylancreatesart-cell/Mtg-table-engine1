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

replace_once(
"function clearLegacyGuestPersistence(){\n try{localStorage.removeItem(MTGProfileStore.KEY);localStorage.removeItem('mtgte_profile');localStorage.removeItem('mtgte_active_deck')}catch{}\n}",
"function clearLegacyGuestPersistence(){\n try{localStorage.removeItem(MTGProfileStore.KEY);localStorage.removeItem('mtgte_profile');localStorage.removeItem('mtgte_active_deck');localStorage.removeItem('mtgte_commander');localStorage.removeItem('mtgte_partner')}catch{}\n}",
'clear legacy deck identity keys')

replace_once(
" bindAccountStorage(row.profile_data.id,'authenticated');playerProfile=MTGProfileStore.migrate(row.profile_data);playerProfile.auth={mode:'authenticated',provider:'supabase',subject:user.id,email:user.email||null};playerProfile.onboardingComplete=!!row.onboarding_complete;cloudOnboardingComplete=!!row.onboarding_complete;\n profileStorage.save(playerProfile);MTGAccounts.setActive(playerProfile.id,localStorage);MTGAccounts.saveAccount(playerProfile,localStorage);\n activeDeckId=localStorage.getItem('mtgte_active_deck_'+playerProfile.id)||null;startPresence();renderProfile();renderDeckLibrary();$('accountOverlay').classList.add('h');",
" bindAccountStorage(row.profile_data.id,'authenticated');playerProfile=MTGProfileStore.migrate(row.profile_data);playerProfile.auth={mode:'authenticated',provider:'supabase',subject:user.id,email:user.email||null};playerProfile.onboardingComplete=!!row.onboarding_complete;cloudOnboardingComplete=!!row.onboarding_complete;\n profileStorage.save(playerProfile);MTGAccounts.setActive(playerProfile.id,localStorage);MTGAccounts.saveAccount(playerProfile,localStorage);clearLegacyGuestPersistence();\n activeDeckId=localStorage.getItem('mtgte_active_deck_'+playerProfile.id)||null;let restoredDeck=activeDeckId?MTGProfileStore.activeDeck(playerProfile,activeDeckId):null;if(restoredDeck)hydrateProfileFromSavedDeck(restoredDeck);else prof={cards:[],mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:null,partner:null};startPresence();renderProfile();renderDeckLibrary();$('accountOverlay').classList.add('h');",
'hydrate account-scoped active deck')

replace_once(
"function startGuestIdentity(){\n MTGCloudAccount.clearMemory();",
"function startGuestIdentity(){\n clearLegacyGuestPersistence();MTGCloudAccount.clearMemory();",
'clear persistent identity before guest')

old_profile="function profile(){const analyzed=MTGDeckEngine.analyzeDeck(prof.cards),names=new Set((analyzed.cards||[]).map(c=>String(c.n||'').trim().toLowerCase())),commanderCandidate=prof.commander||localStorage.getItem('mtgte_commander')||null,partnerCandidate=prof.partner||localStorage.getItem('mtgte_partner')||null,commander=commanderCandidate&&names.has(String(commanderCandidate).trim().toLowerCase())?commanderCandidate:null,partner=partnerCandidate&&names.has(String(partnerCandidate).trim().toLowerCase())?partnerCandidate:null;prof={...analyzed,commander,partner};prof.cardMap=new Map(prof.cards.map(c=>[c.n.toLowerCase(),c]));prof.mods=MTGDeckEngine.quickActionGroups(prof);applyDeckTheme()}"
new_profile="function profile(){const analyzed=MTGDeckEngine.analyzeDeck(prof.cards),names=new Set((analyzed.cards||[]).map(c=>String(c.n||'').trim().toLowerCase())),commanderCandidate=prof.commander||null,partnerCandidate=prof.partner||null,commander=commanderCandidate&&names.has(String(commanderCandidate).trim().toLowerCase())?commanderCandidate:null,partner=partnerCandidate&&names.has(String(partnerCandidate).trim().toLowerCase())?partnerCandidate:null;prof={...analyzed,commander,partner};prof.cardMap=new Map(prof.cards.map(c=>[c.n.toLowerCase(),c]));prof.mods=MTGDeckEngine.quickActionGroups(prof);applyDeckTheme()}"
replace_once(old_profile,new_profile,'remove global commander fallback')

replace_once(
"function hydrateProfileFromSavedDeck(d){if(!d)return false;let cards=Array.isArray(d.list)&&d.list.length?JSON.parse(JSON.stringify(d.list)):parse(deckListText(d));prof={cards,mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:d.commander||null,partner:d.partner||null};profile();$('deck').value=deckListText(d);if($('formatSelect'))$('formatSelect').value=String(d.format||'commander').toLowerCase();localStorage.setItem('mtgte_commander',prof.commander||'');localStorage.setItem('mtgte_partner',prof.partner||'');return true}",
"function hydrateProfileFromSavedDeck(d){if(!d)return false;let cards=Array.isArray(d.list)&&d.list.length?JSON.parse(JSON.stringify(d.list)):parse(deckListText(d));prof={cards,mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:d.commander||null,partner:d.partner||null};profile();$('deck').value=deckListText(d);if($('formatSelect'))$('formatSelect').value=String(d.format||'commander').toLowerCase();return true}",
'stop global deck identity writes on hydrate')

replace_once(
"$('commanderSelect').onchange=()=>{prof.commander=$('commanderSelect').value||null;localStorage.setItem('mtgte_commander',prof.commander||'');$('commanderInfo').innerHTML=prof.commander?",
"$('commanderSelect').onchange=()=>{prof.commander=$('commanderSelect').value||null;$('commanderInfo').innerHTML=prof.commander?",
'stop commander draft persistence')
replace_once(
"$('partnerSelect').onchange=()=>{prof.partner=$('partnerSelect').value||null;localStorage.setItem('mtgte_partner',prof.partner||'');$('commanderInfo').innerHTML=prof.commander?",
"$('partnerSelect').onchange=()=>{prof.partner=$('partnerSelect').value||null;$('commanderInfo').innerHTML=prof.commander?",
'stop partner draft persistence')
replace_once(
"if(!$('commanderSelect').value)return toast('Choose your commander first.');prof.commander=$('commanderSelect').value;prof.partner=$('partnerSelect').value||null;localStorage.setItem('mtgte_commander',prof.commander);localStorage.setItem('mtgte_partner',prof.partner||'');",
"if(!$('commanderSelect').value)return toast('Choose your commander first.');prof.commander=$('commanderSelect').value;prof.partner=$('partnerSelect').value||null;",
'stop continue-to-lobby global identity persistence')
replace_once(
"function commanderName(){return prof?.commander||localStorage.getItem('mtgte_commander')||null}function coCommanderName(){return prof?.partner||localStorage.getItem('mtgte_partner')||null}",
"function commanderName(){return prof?.commander||null}function coCommanderName(){return prof?.partner||null}",
'remove runtime global identity fallback')

combined=''.join(p.read_text(encoding='utf-8') for p in sorted(SRC_DIR.glob('controller-part-*.part.js')))
for forbidden in ("localStorage.getItem('mtgte_commander')","localStorage.getItem('mtgte_partner')","localStorage.setItem('mtgte_commander'","localStorage.setItem('mtgte_partner'"):
    if forbidden in combined: raise SystemExit(f'Safety stop: persistent deck identity leak remains: {forbidden}')
for required in ("clearLegacyGuestPersistence();MTGCloudAccount.clearMemory()","if(restoredDeck)hydrateProfileFromSavedDeck(restoredDeck)"):
    if required not in combined: raise SystemExit(f'Safety stop: missing {required}')
print('batch 3 identity-boundary checks passed')
