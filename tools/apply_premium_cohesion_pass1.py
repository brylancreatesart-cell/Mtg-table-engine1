#!/usr/bin/env python3
from pathlib import Path

CSS=Path('styles/app-src/styles-part-01.part.css')
JS4=Path('scripts/app-src/controller-part-04.part.js')
JS5=Path('scripts/app-src/controller-part-05.part.js')
css=CSS.read_text(encoding='utf-8')
js4=JS4.read_text(encoding='utf-8')
js5=JS5.read_text(encoding='utf-8')

def replace_once(text,old,new,label):
    n=text.count(old)
    if n!=1:
        raise SystemExit(f'Safety stop: {label} expected exactly one owner, found {n}')
    print('replace',label)
    return text.replace(old,new,1)

# DO NOT STACK EDITS: replace existing canonical visual owners directly.
css=replace_once(css,
'.lobbyAtmosphere{position:absolute;inset:-12px 0 auto;height:260px;pointer-events:none;overflow:hidden;z-index:-1}',
'.lobbyAtmosphere{position:absolute;inset:-18px -10px auto;height:300px;pointer-events:none;overflow:hidden;z-index:-1;opacity:.96;filter:saturate(1.08)}',
'lobby atmosphere shell')
css=replace_once(css,
'.lobbyAtmosphere:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 22%,rgba(82,184,255,.12),transparent 55%),radial-gradient(circle at 15% 80%,rgba(180,88,255,.08),transparent 45%);animation:lobbyDrift 9s ease-in-out infinite alternate}',
'.lobbyAtmosphere:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 18%,color-mix(in srgb,var(--deck-a,#52b8ff) 24%,transparent),transparent 54%),radial-gradient(circle at 12% 82%,color-mix(in srgb,var(--deck-b,#b458ff) 16%,transparent),transparent 46%),linear-gradient(180deg,color-mix(in srgb,var(--deck-a,#52b8ff) 5%,transparent),transparent 78%);animation:lobbyDrift 9s ease-in-out infinite alternate}',
'lobby deck atmosphere')
css=replace_once(css,
'.readyHeadline{font-size:12px;font-weight:900;letter-spacing:.08em}',
'.readyHeadline{font-size:13px;font-weight:950;letter-spacing:.095em;text-shadow:0 0 18px color-mix(in srgb,var(--deck-a,#52b8ff) 28%,transparent)}',
'ready headline')
css=replace_once(css,
'.readyRitual{display:grid;grid-template-columns:64px 1fr;gap:11px;align-items:center;margin-top:11px;padding:10px;border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 22%,#213744);border-radius:12px;background:rgba(3,10,15,.58);transition:.45s}',
'.readyRitual{display:grid;grid-template-columns:64px 1fr;gap:11px;align-items:center;margin-top:11px;padding:11px;border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 34%,#213744);border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--deck-a,#52b8ff) 8%,#050d13),color-mix(in srgb,var(--deck-b,#b458ff) 5%,#03090e));box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 14px 34px rgba(0,0,0,.18),0 0 24px color-mix(in srgb,var(--deck-glow,rgba(82,184,255,.2)) 28%,transparent);transition:.45s}',
'ready ritual')
css=replace_once(css,
'.battleIntro{position:fixed;z-index:95;inset:0;background:radial-gradient(circle at 50% 35%,#10283a 0,#071018 42%,#020406 100%);display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:opacity .3s}',
'.battleIntro{position:fixed;z-index:95;inset:0;isolation:isolate;overflow:hidden;background:radial-gradient(circle at 50% 28%,color-mix(in srgb,var(--deck-a,#52b8ff) 18%,#10283a) 0,color-mix(in srgb,var(--deck-b,#b458ff) 7%,#071018) 42%,#020406 100%);display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:opacity .3s}',
'battle intro shell')
css=replace_once(css,
'.battleIntroPanel{width:min(760px,100%);text-align:center}',
'.battleIntroPanel{width:min(760px,100%);text-align:center;padding:clamp(18px,4vw,34px);border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 26%,#263b4a);border-radius:24px;background:linear-gradient(180deg,rgba(5,13,19,.82),rgba(2,6,9,.72));box-shadow:0 30px 80px rgba(0,0,0,.42),0 0 70px color-mix(in srgb,var(--deck-glow,rgba(82,184,255,.2)) 24%,transparent),inset 0 1px 0 rgba(255,255,255,.035);backdrop-filter:blur(14px)}',
'battle intro panel')
css=replace_once(css,
'.battleIntroTitle{font-size:32px;font-weight:950;margin-top:7px}',
'.battleIntroTitle{font-size:clamp(28px,7vw,46px);font-weight:950;margin-top:8px;line-height:1.02;letter-spacing:-.025em;text-wrap:balance;text-shadow:0 0 28px color-mix(in srgb,var(--deck-a,#52b8ff) 30%,transparent)}',
'battle intro title')
css=replace_once(css,
'.battleIntroPlayer{display:grid;grid-template-columns:50px 1fr;gap:10px;text-align:left;align-items:center;border:1px solid #28465a;border-radius:12px;background:rgba(6,14,20,.78);padding:10px;transform:translateY(8px);opacity:0;animation:rosterRise .45s ease forwards}',
'.battleIntroPlayer{display:grid;grid-template-columns:54px 1fr;gap:11px;text-align:left;align-items:center;border:1px solid color-mix(in srgb,var(--intro-a,var(--deck-a,#52b8ff)) 42%,#28465a);border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--intro-a,var(--deck-a,#52b8ff)) 10%,rgba(6,14,20,.9)),color-mix(in srgb,var(--intro-b,var(--deck-b,#b458ff)) 5%,rgba(3,9,14,.88)));box-shadow:inset 3px 0 0 color-mix(in srgb,var(--intro-a,var(--deck-a,#52b8ff)) 70%,transparent),0 10px 28px rgba(0,0,0,.2);padding:11px;transform:translateY(8px);opacity:0;animation:rosterRise .45s ease forwards}',
'battle intro player')
css=replace_once(css,
'.battleIntroName{font-weight:950}',
'.battleIntroName{font-weight:950;font-size:14px;letter-spacing:.02em;color:#f4f7f8}',
'battle intro player name')
css=replace_once(css,
'.battleIntroCmd{font-size:9px;color:var(--m);margin-top:2px}',
'.battleIntroCmd{font-size:9px;color:color-mix(in srgb,var(--intro-a,var(--deck-a,#52b8ff)) 42%,#c8d4dc);margin-top:3px;letter-spacing:.035em}',
'battle intro commander')
css=replace_once(css,
'.battleIntroFinal.show{opacity:1;transform:scale(1);text-shadow:0 0 32px rgba(82,184,255,.4)}',
'.battleIntroFinal.show{opacity:1;transform:scale(1);text-shadow:0 0 18px color-mix(in srgb,var(--deck-a,#52b8ff) 60%,transparent),0 0 42px color-mix(in srgb,var(--deck-b,#b458ff) 30%,transparent)}',
'battle intro final')
css=replace_once(css,
'.playerHud{position:relative;border:1px solid #244257;background:linear-gradient(180deg,#0b1822,#071019);border-radius:16px;padding:13px;margin-bottom:10px;overflow:hidden}',
'.playerHud{position:relative;border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 30%,#244257);background:linear-gradient(160deg,color-mix(in srgb,var(--deck-a,#52b8ff) 7%,#0b1822),color-mix(in srgb,var(--deck-b,#b458ff) 4%,#071019) 62%,#050c12);border-radius:18px;padding:13px;margin-bottom:10px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,.24),0 0 28px color-mix(in srgb,var(--deck-glow,rgba(82,184,255,.2)) 22%,transparent),inset 0 1px 0 rgba(255,255,255,.025)}',
'player hud base')

# Personalize existing behavior owners rather than layering observers/listeners.
old_status="if($('readyHeadline'))$('readyHeadline').textContent=all?'THE TABLE IS READY':count?'THE BATTLEFIELD FILLS':'WAITING FOR COMBATANTS';if($('readySub'))$('readySub').textContent=all?'Every connected seat is locked in.':count?count+' of '+total+' connected players ready.':'Join the room, choose your deck, then ready up.';"
new_status="let lobbyDeck=currentSavedDeck?.(),lobbyDeckName=lobbyDeck?.name||prof?.commander||'Your deck',lobbyCommander=prof?.commander||'Commander';if($('readyHeadline'))$('readyHeadline').textContent=all?'THE TABLE IS READY':count?'THE BATTLEFIELD FILLS':String(lobbyCommander).toUpperCase()+' IS READY';if($('readySub'))$('readySub').textContent=all?'Every connected seat is locked in.':count?count+' of '+total+' connected players ready.':lobbyDeckName+' is loaded · host or join a room when you are ready.';"
js4=replace_once(js4,old_status,new_status,'personalized lobby status copy')
old_intro="function introRosterHtml(){return players.filter(p=>p.connected!==false).map(p=>'<div class=\"battleIntroPlayer\"><div class=\"battleIntroAvatar\">'+rosterAvatar(p)+'</div><div><div class=\"battleIntroName\">'+(p.name||('Player '+p.id))+'</div><div class=\"battleIntroCmd\">'+(p.commander||'No commander')+(p.deckName?' · '+p.deckName:'')+'</div></div></div>').join('')}"
new_intro="function battleIntroDeckAccent(identity){let palette={W:'#f3e7bd',U:'#58a8df',B:'#9b79b6',R:'#d76a4a',G:'#5fa879'},ids=Array.isArray(identity)?identity:String(identity||'').toUpperCase().match(/[WUBRG]/g)||[],colors=[...new Set(ids)].map(x=>palette[x]).filter(Boolean);return[colors[0]||'var(--deck-a,#52b8ff)',colors[1]||colors[0]||'var(--deck-b,#b458ff)']}function introRosterHtml(){return players.filter(p=>p.connected!==false).map(p=>{let[a,b]=battleIntroDeckAccent(p.deckColorIdentity);return'<div class=\"battleIntroPlayer\" style=\"--intro-a:'+a+';--intro-b:'+b+'\"><div class=\"battleIntroAvatar\">'+rosterAvatar(p)+'</div><div><div class=\"battleIntroName\">'+(p.name||('Player '+p.id))+'</div><div class=\"battleIntroCmd\">'+(p.commander||'No commander')+(p.deckName?' · '+p.deckName:'')+'</div></div></div>'}).join('')}"
js4=replace_once(js4,old_intro,new_intro,'deck-accented battle intro roster')

old_play="function playBattleIntro(done){introDone=done||null;let ov=$('battleIntro');$('setup').classList.add('h');$('lobby').classList.add('h');$('game').classList.add('h');$('hostControl').classList.add('h');$('battleIntroRoster').innerHTML=introRosterHtml();$('battleIntroCall').textContent='All combatants are ready.';$('battleIntroFinal').classList.remove('show');ov.classList.remove('h');ov.setAttribute('aria-hidden','false');requestAnimationFrame(()=>ov.classList.add('on'));MTGAnnouncerEngine.event('battleEntry',{});setTimeout(()=>{$('battleIntroCall').textContent='The battlefield waits.'},1250);setTimeout(()=>{$('battleIntroFinal').classList.add('show');$('battleIntroCall').textContent='';MTGAnnouncerEngine.event('battleStart',{force:true})},2300);introTimer=setTimeout(finishBattleIntro,3600)}"
new_play="function playBattleIntro(done){introDone=done||null;let ov=$('battleIntro'),battleName=String(st?.meta?.battleName||'Entering the Battlefield');$('setup').classList.add('h');$('lobby').classList.add('h');$('game').classList.add('h');$('hostControl').classList.add('h');$('battleIntroTitle').textContent=battleName;$('battleIntroRoster').innerHTML=introRosterHtml();$('battleIntroCall').textContent='Every combatant has answered the call.';$('battleIntroFinal').textContent='LET THE BATTLE BEGIN';$('battleIntroFinal').classList.remove('show');ov.classList.remove('h');ov.setAttribute('aria-hidden','false');requestAnimationFrame(()=>ov.classList.add('on'));MTGAnnouncerEngine.event('battleEntry',{});setTimeout(()=>{$('battleIntroCall').textContent='The battlefield waits.'},1250);setTimeout(()=>{$('battleIntroFinal').classList.add('show');$('battleIntroCall').textContent='';MTGAnnouncerEngine.event('battleStart',{force:true})},2300);introTimer=setTimeout(finishBattleIntro,3600)}"
js5=replace_once(js5,old_play,new_play,'premium battle intro sequence')

# Ownership audit.
for selector in ('.lobbyAtmosphere{','.readyRitual{','.battleIntro{','.battleIntroPanel{','.battleIntroPlayer{','.playerHud{'):
    if css.count(selector)!=1:
        raise SystemExit(f'Ownership audit failed for {selector}: {css.count(selector)} owners')
combined_js=js4+'\n'+js5
if 'battleIntroDeckAccent' not in combined_js or 'LET THE BATTLE BEGIN' not in combined_js:
    raise SystemExit('Premium intro behavior missing')
if '.premiumOverride' in css:
    raise SystemExit('Unexpected override layer detected')

CSS.write_text(css,encoding='utf-8')
JS4.write_text(js4,encoding='utf-8')
JS5.write_text(js5,encoding='utf-8')
print('Premium cohesion pass 1 source edits complete; canonical owners remain singular.')
