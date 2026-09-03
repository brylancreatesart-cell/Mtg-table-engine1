#!/usr/bin/env python3
from pathlib import Path

CSS=Path('styles/app-src/styles-part-12.part.css')
JS=Path('scripts/app-src/controller-part-04.part.js')
css=CSS.read_text(encoding='utf-8')
js=JS.read_text(encoding='utf-8')

def swap(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'Safety stop: {label} expected 1 exact owner, found {n}')
    print('replaced',label)
    return text.replace(old,new,1)

# Replace canonical Phase 109 owners directly.
css=swap(css,
'.sharedDisplayScreen{position:relative;min-height:100dvh;padding:max(16px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));overflow:hidden;background:radial-gradient(circle at 50% -8%,rgba(147,111,57,.18),transparent 30%),radial-gradient(circle at 10% 52%,rgba(32,84,76,.12),transparent 31%),radial-gradient(circle at 90% 52%,rgba(52,70,96,.12),transparent 31%),linear-gradient(180deg,#06090b 0%,#020405 48%,#010202 100%);color:#f3ead8}',
'.sharedDisplayScreen{position:relative;min-height:100dvh;padding:max(16px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));overflow:hidden;background:radial-gradient(circle at 50% -10%,rgba(190,139,63,.21),transparent 28%),radial-gradient(circle at 14% 46%,rgba(32,89,77,.13),transparent 34%),radial-gradient(circle at 86% 48%,rgba(56,76,108,.14),transparent 34%),linear-gradient(180deg,#070a0d 0%,#020405 46%,#010202 100%);color:#f3ead8}',
'shared display screen')
css=swap(css,
'.sharedDisplayStage{position:relative;z-index:2;display:grid;gap:12px;padding:14px}',
'.sharedDisplayStage{position:relative;z-index:2;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px;padding:14px;min-height:calc(100dvh - 36px)}',
'shared display stage')
css=swap(css,
'.sharedDisplayTurn{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;padding:12px 14px;border:1px solid rgba(161,124,69,.25);border-radius:14px;background:linear-gradient(90deg,rgba(17,25,29,.88),rgba(11,17,20,.96),rgba(17,25,29,.88));box-shadow:inset 0 1px rgba(255,255,255,.025)}',
'.sharedDisplayTurn{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,auto) minmax(0,1fr);gap:14px;align-items:center;padding:14px 18px;border:1px solid rgba(190,145,76,.34);border-radius:16px;background:linear-gradient(90deg,rgba(17,25,29,.9),rgba(8,13,16,.98),rgba(17,25,29,.9));box-shadow:0 12px 34px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.035)}',
'shared display turn banner')
css=swap(css,'.sharedDisplayTurnMain{text-align:center}', '.sharedDisplayTurnMain{text-align:center;min-width:0}', 'shared display turn center')
css=swap(css,
'.sharedDisplayTurnMain b{display:block;font-family:Georgia,serif;font-size:clamp(20px,2.5vw,36px);line-height:1.05}',
'.sharedDisplayTurnMain b{display:block;font-family:Georgia,serif;font-size:clamp(30px,4vw,58px);line-height:.96;letter-spacing:-.035em;text-shadow:0 0 28px rgba(196,151,79,.12)}',
'turn main typography')
css=swap(css,
'.sharedDisplayTurnMain span,.sharedDisplayStateSide{font-size:9px;color:#9cabaf;letter-spacing:.14em;font-weight:800}',
'.sharedDisplayTurnMain span,.sharedDisplayStateSide{font-size:clamp(8px,.72vw,11px);color:#9cabaf;letter-spacing:.14em;font-weight:850}',
'turn secondary typography')
css=swap(css,
'.sharedDisplayPlayers{display:grid;grid-template-columns:repeat(var(--shared-cols,2),minmax(0,1fr));gap:10px;align-items:stretch}',
'.sharedDisplayPlayers{display:grid;grid-template-columns:repeat(var(--shared-cols,2),minmax(0,1fr));gap:12px;align-items:stretch;align-content:center;min-height:0}',
'player grid')
css=swap(css,
'.sharedPlayerCard{position:relative;overflow:hidden;display:grid;grid-template-columns:clamp(54px,6vw,92px) minmax(0,1fr) auto;grid-template-areas:"avatar identity life" "avatar public public";gap:8px 12px;align-items:center;min-height:138px;padding:14px;border:1px solid rgba(91,112,120,.34);border-radius:16px;background:radial-gradient(circle at 8% 20%,rgba(89,120,111,.10),transparent 36%),linear-gradient(145deg,rgba(12,20,24,.96),rgba(4,8,10,.97));box-shadow:0 12px 34px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.026)}',
'.sharedPlayerCard{position:relative;overflow:hidden;display:grid;grid-template-columns:clamp(64px,7vw,106px) minmax(0,1fr) auto;grid-template-areas:"avatar identity life" "avatar public public";gap:10px 14px;align-items:center;min-height:154px;padding:16px;border:1px solid rgba(91,112,120,.36);border-radius:18px;background:radial-gradient(circle at 7% 18%,rgba(89,120,111,.12),transparent 38%),linear-gradient(145deg,rgba(12,20,24,.97),rgba(4,8,10,.98));box-shadow:0 14px 38px rgba(0,0,0,.3),inset 0 1px rgba(255,255,255,.03)}',
'player card')
css=swap(css,
'.sharedPlayerCard.active{border-color:rgba(198,157,83,.75);box-shadow:0 0 0 1px rgba(224,182,95,.13),0 15px 42px rgba(0,0,0,.34),inset 0 0 42px rgba(151,108,46,.08)}',
'.sharedPlayerCard.active{border-color:rgba(218,174,91,.9);box-shadow:0 0 0 1px rgba(224,182,95,.16),0 18px 48px rgba(0,0,0,.36),0 0 34px rgba(181,132,54,.13),inset 0 0 52px rgba(151,108,46,.1)}',
'active player card')
css=swap(css,
'.sharedPlayerCard.priority{outline:1px solid rgba(93,168,196,.42);outline-offset:-4px}',
'.sharedPlayerCard.priority{outline:2px solid rgba(93,178,214,.58);outline-offset:-5px}',
'priority player card')
css=swap(css,
'.sharedDisplayAvatar{grid-area:avatar;width:clamp(54px,6vw,92px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:1px solid rgba(188,151,86,.4);box-shadow:0 0 22px rgba(0,0,0,.4)}',
'.sharedDisplayAvatar{grid-area:avatar;width:clamp(64px,7vw,106px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:1px solid rgba(188,151,86,.44);box-shadow:0 0 28px rgba(0,0,0,.44)}',
'public avatar')
css=swap(css,
'.sharedDisplayIdentity b{display:block;font-family:Georgia,serif;font-size:clamp(16px,1.7vw,27px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.sharedDisplayIdentity b{display:block;font-family:Georgia,serif;font-size:clamp(19px,2vw,31px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.02}',
'public player name')
css=swap(css,
'.sharedDisplayIdentity span{display:block;margin-top:3px;color:#92a2a7;font-size:clamp(8px,.8vw,11px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.sharedDisplayIdentity span{display:block;margin-top:4px;color:#92a2a7;font-size:clamp(8px,.84vw,12px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sharedDisplayIdentity .sharedDisplayDeckName{color:#bba982}.sharedDisplayIdentity .sharedDisplayPlayerState{color:#78a9b7;font-weight:900;letter-spacing:.08em}',
'public identity lines')
css=swap(css,
'.sharedDisplayLife b{display:block;font-size:clamp(42px,5.8vw,82px);line-height:.85;font-weight:950;letter-spacing:-.06em}',
'.sharedDisplayLife b{display:block;font-size:clamp(52px,6.5vw,96px);line-height:.82;font-weight:950;letter-spacing:-.07em;text-shadow:0 0 24px rgba(255,237,202,.07)}',
'public life total')
css=swap(css,
'.sharedDisplayLower{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
'.sharedDisplayLower{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-self:end}',
'lower public panels')
css=swap(css,
'.sharedDisplayPanel{min-height:92px;padding:12px;border:1px solid rgba(91,112,120,.28);border-radius:13px;background:rgba(5,10,12,.84)}',
'.sharedDisplayPanel{min-height:88px;padding:12px 14px;border:1px solid rgba(91,112,120,.24);border-radius:13px;background:rgba(4,8,10,.72)}',
'public panel surface')
css=swap(css,'.sharedDisplayPlayers{--shared-cols:1!important}', '.sharedDisplayPlayers{--shared-cols:1}', 'responsive player grid ownership')

old_player="function sharedDisplayPlayerHtml(p){let avatar=avatarMarkup(p.avatarId||MTGAvatars.DEFAULT_ID,{compact:true}),cls='sharedPlayerCard'+(p.active?' active':'')+(p.priority?' priority':'')+(p.fallen?' fallen':'');let stateLabel=p.fallen?'FALLEN':p.active?'ACTIVE PLAYER':p.priority?'PRIORITY':p.connected?'CONNECTED':'OFFLINE';return '<article class=\"'+cls+'\"><div class=\"sharedDisplayAvatar\">'+avatar+'</div><div class=\"sharedDisplayIdentity\"><b>'+esc(p.name||('Player '+p.id))+'</b><span>'+esc(p.commander||p.deckName||('PLAYER '+p.id))+' · '+esc(stateLabel)+'</span></div><div class=\"sharedDisplayLife\"><b>'+esc(p.life)+'</b><span>LIFE</span></div><div class=\"sharedDisplayPublic\"><div class=\"sharedDisplayStat\"><b>'+esc(p.poison)+'</b><span>POISON</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.commanderDamage)+'</b><span>CMD MAX</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.permanents)+'</b><span>FIELD</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.lands)+'</b><span>LANDS</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.library)+'</b><span>LIBRARY</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.graveyard)+'</b><span>GRAVE</span></div></div></article>'}"
new_player="function sharedDisplayPlayerHtml(p){let avatar=avatarMarkup(p.avatarId||MTGAvatars.DEFAULT_ID,{compact:true}),cls='sharedPlayerCard'+(p.active?' active':'')+(p.priority?' priority':'')+(p.fallen?' fallen':'');let stateLabel=p.fallen?'FALLEN':p.active?'ACTIVE PLAYER':p.priority?'PRIORITY':p.connected?'CONNECTED':'OFFLINE',commander=p.commander||'NO COMMANDER',deck=p.deckName||'DECK NOT SHARED';return '<article class=\"'+cls+'\"><div class=\"sharedDisplayAvatar\">'+avatar+'</div><div class=\"sharedDisplayIdentity\"><b>'+esc(p.name||('Player '+p.id))+'</b><span>'+esc(commander)+'</span><span class=\"sharedDisplayDeckName\">'+esc(deck)+'</span><span class=\"sharedDisplayPlayerState\">'+esc(stateLabel)+'</span></div><div class=\"sharedDisplayLife\"><b>'+esc(p.life)+'</b><span>LIFE</span></div><div class=\"sharedDisplayPublic\"><div class=\"sharedDisplayStat\"><b>'+esc(p.poison)+'</b><span>POISON</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.commanderDamage)+'</b><span>CMD MAX</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.permanents)+'</b><span>FIELD</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.lands)+'</b><span>LANDS</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.library)+'</b><span>LIBRARY</span></div><div class=\"sharedDisplayStat\"><b>'+esc(p.graveyard)+'</b><span>GRAVE</span></div></div></article>'}"
js=swap(js,old_player,new_player,'shared display player identity')

old_render="$('sharedDisplayTurnMain').textContent=s.started?(s.battleName||'THE BATTLE BEGINS'):'LOBBY · WAITING FOR BATTLE';$('sharedDisplayTurnSub').textContent=s.started?('TURN '+Number(s.turn||1)+' · '+String(s.phase||'').toUpperCase()+' · '+(active?.name||('Player '+s.active))+' ACTIVE'+(priority?' · '+priority.name+' HAS PRIORITY':'')):(ps.filter(p=>p.ready).length+' / '+ps.length+' READY');"
new_render="$('sharedDisplayTurnMain').textContent=s.started?('TURN '+Number(s.turn||1)+' · '+String(s.phase||'').toUpperCase()):(s.battleName||'LOBBY · WAITING FOR BATTLE');$('sharedDisplayTurnSub').textContent=s.started?((s.battleName||'THE BATTLE')+' · '+(active?.name||('Player '+s.active))+' ACTIVE'+(priority?' · '+priority.name+' HAS PRIORITY':'')):(ps.filter(p=>p.ready).length+' / '+ps.length+' READY');"
js=swap(js,old_render,new_render,'shared display turn hierarchy')

# Ownership/safety audit.
if '--shared-cols:1!important' in css: raise SystemExit('Safety stop: stacked responsive shared-display override remains')
for exact in ('.sharedDisplayScreen{position:relative;min-height:100dvh', '.sharedDisplayPlayers{display:grid;', '.sharedDisplayLower{display:grid;'):
    if css.count(exact)!=1: raise SystemExit(f'Safety stop: canonical display base missing/duplicated: {exact}')
if js.count('function sharedDisplayPlayerHtml(p)')!=1 or js.count('function renderSharedDisplay()')!=1:
    raise SystemExit('Safety stop: shared display renderer ownership changed unexpectedly')

CSS.write_text(css,encoding='utf-8')
JS.write_text(js,encoding='utf-8')
print('Shared display premium centerpiece pass applied cleanly')
