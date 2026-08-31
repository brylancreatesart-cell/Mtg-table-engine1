#!/usr/bin/env python3
from pathlib import Path
SRC_DIR=Path('scripts/app-src')

def replace_once(old,new,label):
    hits=[]
    for p in sorted(SRC_DIR.glob('controller-part-*.part.js')):
        t=p.read_text(encoding='utf-8'); n=t.count(old)
        if n: hits.append((p,n,t))
    total=sum(n for _,n,_ in hits)
    if total!=1: raise SystemExit(f'Safety stop: {label} expected 1 match, found {total}')
    p,_,t=hits[0]; p.write_text(t.replace(old,new,1),encoding='utf-8'); print('patched',label,p)

old_hydrate="function hydrateProfileFromSavedDeck(d){if(!d)return false;let cards=Array.isArray(d.list)&&d.list.length?JSON.parse(JSON.stringify(d.list)):parse(deckListText(d));prof={cards,mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:d.commander||null,partner:d.partner||null};profile();$('deck').value=deckListText(d);if($('formatSelect'))$('formatSelect').value=String(d.format||'commander').toLowerCase();return true}"
new_hydrate="function hydrateProfileFromSavedDeck(d){if(!d)return false;let cards=Array.isArray(d.list)&&d.list.length?JSON.parse(JSON.stringify(d.list)):parse(deckListText(d));prof={cards,mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:d.commander||null,partner:d.partner||null};profile();$('deck').value=deckListText(d);if($('formatSelect'))$('formatSelect').value=String(d.format||'commander').toLowerCase();return true}function propagateActiveDeckSelection(){try{syncLocalProfilePresence({broadcast:true})}catch{}try{refreshPresence()}catch{}try{if(sharedDisplayMode)renderSharedDisplay()}catch{}return true}"
replace_once(old_hydrate,new_hydrate,'active deck propagation helper')

old_activate="function activateSavedDeck(id,{close=true,silent=false}={}){let d=MTGProfileStore.activeDeck(playerProfile,id);if(!d)return false;persistActiveDeckSelection(id);hydrateProfileFromSavedDeck(d);renderDeckLibrary();try{slots()}catch{}if(close)closeDeckVault();else{vaultSelectedDeckId=id;renderDeckVault()}if(!silent)toast(d.name+' is now active.');return true}"
new_activate="function activateSavedDeck(id,{close=true,silent=false}={}){let d=MTGProfileStore.activeDeck(playerProfile,id);if(!d)return false;persistActiveDeckSelection(id);hydrateProfileFromSavedDeck(d);propagateActiveDeckSelection();renderDeckLibrary();try{slots()}catch{}if(close)closeDeckVault();else{vaultSelectedDeckId=id;renderDeckVault()}if(!silent)toast(d.name+' is now active.');return true}"
replace_once(old_activate,new_activate,'activate deck live propagation')

old_remove="function removeSavedDeck(id){let d=MTGProfileStore.activeDeck(playerProfile,id);if(!d)return;let wasActive=id===activeDeckId;playerProfile=MTGProfileStore.removeDeck(playerProfile,id);if(wasActive){persistActiveDeckSelection(null);prof={cards:[],mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:null,partner:null};applyDeckTheme()}saveProfile();let decks=playerProfile.decks||[];vaultSelectedDeckId=decks[0]?.id||null;vaultPanelMode='actions';vaultDrawerOpen=false;vaultDrawerOpening=false;renderDeckLibrary();renderDeckVault({preserveScroll:true});toast(wasActive?'Deck removed. Choose another verified deck to make active.':'Deck removed from the Vault.')}"
new_remove="function removeSavedDeck(id){let d=MTGProfileStore.activeDeck(playerProfile,id);if(!d)return;let wasActive=id===activeDeckId;playerProfile=MTGProfileStore.removeDeck(playerProfile,id);if(wasActive){persistActiveDeckSelection(null);prof={cards:[],mods:[],tags:[],capabilities:[],cardMap:new Map(),commander:null,partner:null};applyDeckTheme()}saveProfile();if(wasActive)propagateActiveDeckSelection();let decks=playerProfile.decks||[];vaultSelectedDeckId=decks[0]?.id||null;vaultPanelMode='actions';vaultDrawerOpen=false;vaultDrawerOpening=false;renderDeckLibrary();renderDeckVault({preserveScroll:true});toast(wasActive?'Deck removed. Choose another verified deck to make active.':'Deck removed from the Vault.')}"
replace_once(old_remove,new_remove,'active deck removal propagation')

old_edit="if(editingExisting){let saved=result.deck,editedWasActive=previousActive===saved.id;editingDeckId=null;editingPreviousActiveDeckId=null;$('saveDeckBtn').textContent='Save to Deck Library';if(editedWasActive||!previousActive){persistActiveDeckSelection(saved.id);hydrateProfileFromSavedDeck(saved)}else{persistActiveDeckSelection(previousActive);let prior=MTGProfileStore.activeDeck(playerProfile,previousActive);if(prior)hydrateProfileFromSavedDeck(prior)}$('setup').classList.add('h');"
new_edit="if(editingExisting){let saved=result.deck,editedWasActive=previousActive===saved.id;editingDeckId=null;editingPreviousActiveDeckId=null;$('saveDeckBtn').textContent='Save to Deck Library';if(editedWasActive||!previousActive){persistActiveDeckSelection(saved.id);hydrateProfileFromSavedDeck(saved)}else{persistActiveDeckSelection(previousActive);let prior=MTGProfileStore.activeDeck(playerProfile,previousActive);if(prior)hydrateProfileFromSavedDeck(prior)}propagateActiveDeckSelection();$('setup').classList.add('h');"
replace_once(old_edit,new_edit,'edited deck propagation')

old_new="if(creatingNewDeckFromVault){let saved=result.deck;creatingNewDeckFromVault=false;editingPreviousActiveDeckId=null;$('saveDeckBtn').textContent='Save to Deck Library';if(previousActive&&MTGProfileStore.activeDeck(playerProfile,previousActive)){persistActiveDeckSelection(previousActive);hydrateProfileFromSavedDeck(MTGProfileStore.activeDeck(playerProfile,previousActive))}else{persistActiveDeckSelection(saved.id);hydrateProfileFromSavedDeck(saved)}$('setup').classList.add('h');"
new_new="if(creatingNewDeckFromVault){let saved=result.deck;creatingNewDeckFromVault=false;editingPreviousActiveDeckId=null;$('saveDeckBtn').textContent='Save to Deck Library';if(previousActive&&MTGProfileStore.activeDeck(playerProfile,previousActive)){persistActiveDeckSelection(previousActive);hydrateProfileFromSavedDeck(MTGProfileStore.activeDeck(playerProfile,previousActive))}else{persistActiveDeckSelection(saved.id);hydrateProfileFromSavedDeck(saved)}propagateActiveDeckSelection();$('setup').classList.add('h');"
replace_once(old_new,new_new,'new verified deck active-selection propagation')

old_default="persistActiveDeckSelection(result.deck.id);renderDeckLibrary();toast(result.created?'Deck saved.':'Deck version saved.')"
new_default="persistActiveDeckSelection(result.deck.id);hydrateProfileFromSavedDeck(result.deck);propagateActiveDeckSelection();renderDeckLibrary();toast(result.created?'Deck saved.':'Deck version saved.')"
replace_once(old_default,new_default,'first/default save propagation')

combined=''.join(p.read_text(encoding='utf-8') for p in sorted(SRC_DIR.glob('controller-part-*.part.js')))
assert 'function propagateActiveDeckSelection()' in combined
assert 'hydrateProfileFromSavedDeck(d);propagateActiveDeckSelection();renderDeckLibrary()' in combined
assert 'if(wasActive)propagateActiveDeckSelection()' in combined
assert combined.count('propagateActiveDeckSelection();') >= 5
print('batch 8 live active-deck propagation checks passed')
