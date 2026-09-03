from pathlib import Path
import re

INDEX = Path('index.html')
CSS = Path('styles/app-src/styles-part-01.part.css')
JS = Path('scripts/app-src/controller-part-04.part.js')

NEW_SETUP = r'''<section id="setup"><div class="card verifyShell">
<div class="verifyFrame" aria-hidden="true"><span class="verifyCorner tl">✦</span><span class="verifyCorner tr">✦</span><span class="verifyCorner bl">✦</span><span class="verifyCorner br">✦</span></div>
<div class="verifyArcaneRail verifyArcaneRailLeft" aria-hidden="true">ᚠ<br>ᚢ<br>ᚦ<br>ᚨ<br>ᚱ<br>ᚲ<br>ᚷ<br>ᚹ<br>ᚺ<br>ᚾ<br>ᛁ<br>ᛃ</div><div class="verifyArcaneRail verifyArcaneRailRight" aria-hidden="true">ᛉ<br>ᛏ<br>ᛒ<br>ᛖ<br>ᛗ<br>ᛚ<br>ᛜ<br>ᛞ<br>ᛟ<br>ᚫ<br>ᛇ<br>ᛡ</div>
<div class="verifyManaAtmosphere" aria-hidden="true"><span class="manaFlow cool"></span><span class="manaFlow warm"></span></div>
<div class="verifyHero">
  <div class="verifyManaWheel" aria-hidden="true"><span class="manaMark white">✹</span><span class="manaMark blue">◆</span><span class="manaMark black">☠</span><span class="manaMark red">✦</span><span class="manaMark green">♣</span><span class="manaCore"></span></div>
  <h2>Import Your Deck</h2><p class="verifyLead">Deck verification builds your private Quick Cast list<br>and your custom match HUD.</p>
</div>
<div class="verifyDivider"><span>✦</span><b>DECKLIST</b><span>✦</span></div>
<div class="verifyDeckPanel"><textarea id="deck" rows="8" placeholder="Paste your decklist here..." aria-label="Decklist"></textarea><div id="deckCharCount" class="deckCharCount" aria-live="polite">0 / 10000</div></div>
<div class="legalityToolbar"><label for="formatSelect">FORMAT / LEGALITY PLATFORM</label><select id="formatSelect"><option value="commander" selected>Commander</option><option value="standard">Standard</option><option value="pioneer">Pioneer</option><option value="modern">Modern</option><option value="legacy">Legacy</option><option value="vintage">Vintage</option><option value="pauper">Pauper</option><option value="brawl">Brawl</option></select></div>
<div class="verifyDivider verifyImportDivider"><span>✦</span><b>IMPORT OPTIONS</b><span>✦</span></div>
<div class="importActions"><button id="pasteDeckBtn" class="btn verifyImportCard" type="button"><span class="verifyActionIcon">≡</span><span><b>Paste Decklist</b><small>Paste from clipboard</small></span></button><button id="importDeckFileBtn" class="btn verifyImportCard" type="button"><span class="verifyActionIcon">▣</span><span><b>Import Deck File</b><small>From file or image</small></span></button></div>
<button id="setupDeckVaultBtn" class="btn verifyVaultRow" type="button"><span class="verifyActionIcon vaultIcon">◇</span><span><b>Deck Vault</b><small>View and manage your saved decks</small></span><strong>›</strong></button>
<input id="deckFileInput" class="h" type="file" accept=".txt,.dec,.deck,text/plain">
<div class="physicalDeckNote">PHYSICAL DECK REQUIRED · Your list stays private and is used only to verify legality and personalize your Sidekick.</div>
<button id="ver" class="btn pri verifyDeckCta" type="button"><span class="verifyShield" aria-hidden="true">✦</span><span><b>Verify Deck</b><small>Check legality and build your Quick Cast list</small></span></button>
<div id="vr" class="h"><div id="legalityReport"></div><div id="tags" class="tags"></div><div id="conf" class="small"></div><div id="verifyDetails"></div>
<div id="commanderPick" class="cmdPick h"><label>COMMANDER</label><select id="commanderSelect"><option value="">Choose your commander</option></select><label for="partnerSelect">CO-COMMANDER / PARTNER (OPTIONAL)</label><select id="partnerSelect"><option value="">None</option></select><div id="commanderInfo" class="small">Choose the card the app should track as your commander.</div></div>
<div class="grid verifyContinueGrid"><button id="saveDeckBtn" class="btn">Save to Deck Library</button><button id="cont" class="btn gr">Continue to Lobby</button></div></div>
<div class="verifyPrivacy"><span aria-hidden="true">▣</span><b>Private</b><i>•</i><b>Secure</b><i>•</i><span>Your decklist is never shared</span></div>
</div></section>'''

NEW_CSS = r'''
/* Verify Deck reference-fidelity shell — canonical owner */
#setup{position:relative;isolation:isolate;padding:0 2px 14px;--verify-gold:#c9a45b;--verify-gold-bright:#efd391;--verify-ink:#02080d;--verify-panel:#061019}
#setup .verifyShell{position:relative;overflow:hidden;margin:8px 0 16px;padding:112px clamp(18px,5vw,42px) 24px;border:1px solid color-mix(in srgb,var(--deck-a,#58b9ff) 13%,var(--verify-gold));border-radius:14px;background:radial-gradient(circle at 16% 12%,color-mix(in srgb,var(--deck-a,#58b9ff) 20%,transparent),transparent 28%),radial-gradient(circle at 84% 13%,color-mix(in srgb,var(--deck-b,#ff654d) 20%,transparent),transparent 30%),linear-gradient(180deg,#061019 0%,#030a10 42%,#02070b 100%);box-shadow:0 24px 64px rgba(0,0,0,.56),inset 0 0 0 5px rgba(0,0,0,.28),inset 0 0 0 6px rgba(201,164,91,.12)}
#setup .verifyFrame{position:absolute;inset:8px;border:1px solid rgba(201,164,91,.48);pointer-events:none;z-index:5}
#setup .verifyFrame:before,#setup .verifyFrame:after{content:"";position:absolute;left:28px;right:28px;height:1px;background:linear-gradient(90deg,transparent,rgba(239,211,145,.65),transparent)}
#setup .verifyFrame:before{top:7px}#setup .verifyFrame:after{bottom:7px}
#setup .verifyCorner{position:absolute;color:var(--verify-gold-bright);font-family:Georgia,serif;font-size:16px;text-shadow:0 0 10px rgba(239,211,145,.38)}
#setup .verifyCorner.tl{left:-8px;top:-11px}#setup .verifyCorner.tr{right:-8px;top:-11px}#setup .verifyCorner.bl{left:-8px;bottom:-11px}#setup .verifyCorner.br{right:-8px;bottom:-11px}
#setup .verifyArcaneRail{position:absolute;top:178px;bottom:112px;z-index:1;width:18px;overflow:hidden;font:10px/2.15 Georgia,serif;letter-spacing:.08em;text-align:center;opacity:.34;pointer-events:none}
#setup .verifyArcaneRailLeft{left:14px;color:color-mix(in srgb,var(--deck-a,#5db8ff) 64%,#8ca36d)}#setup .verifyArcaneRailRight{right:14px;color:color-mix(in srgb,var(--deck-b,#ff654d) 62%,#b18450)}
#setup .verifyManaAtmosphere{position:absolute;z-index:0;left:32px;right:32px;top:58px;height:210px;overflow:hidden;pointer-events:none;filter:saturate(1.18)}
#setup .manaFlow{position:absolute;top:42px;width:58%;height:120px;border-radius:50%;filter:blur(18px);opacity:.54}
#setup .manaFlow.cool{left:-7%;background:radial-gradient(ellipse at center,color-mix(in srgb,var(--deck-a,#5db8ff) 58%,#dcecff),transparent 67%);transform:rotate(-8deg)}#setup .manaFlow.warm{right:-7%;background:radial-gradient(ellipse at center,color-mix(in srgb,var(--deck-b,#ff654d) 58%,#ff7a41),transparent 67%);transform:rotate(8deg)}
#setup .verifyHero{position:relative;z-index:2;text-align:center;padding-top:64px}
#setup .verifyManaWheel{position:absolute;left:50%;top:-88px;transform:translateX(-50%);width:148px;height:148px;border-radius:50%;border:3px solid var(--verify-gold);background:conic-gradient(from -18deg,#e5dfc4 0 20%,#1677a8 20% 40%,#111820 40% 60%,#9d3427 60% 80%,#2f7043 80% 100%);box-shadow:0 0 0 5px #071018,0 0 0 7px rgba(239,211,145,.68),0 15px 38px rgba(0,0,0,.55),0 0 34px color-mix(in srgb,var(--deck-a,#5db8ff) 18%,transparent)}
#setup .verifyManaWheel:before{content:"";position:absolute;inset:17px;border-radius:50%;border:1px solid rgba(247,237,208,.45);box-shadow:inset 0 0 24px rgba(0,0,0,.42)}
#setup .manaCore{position:absolute;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%) rotate(45deg);border:1px solid rgba(239,211,145,.8);background:#071018;box-shadow:0 0 18px rgba(239,211,145,.24)}
#setup .manaMark{position:absolute;z-index:2;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#090c0e;text-shadow:0 1px rgba(255,255,255,.18)}
#setup .manaMark.white{left:58px;top:10px}#setup .manaMark.blue{right:10px;top:52px;color:#dceffc}#setup .manaMark.black{right:29px;bottom:12px;color:#d8d9d9}#setup .manaMark.red{left:27px;bottom:13px;color:#ffd1b8}#setup .manaMark.green{left:7px;top:53px;color:#d7f0d5}
#setup h2{font-family:Georgia,'Times New Roman',serif;color:#f6f0df;font-size:clamp(38px,9vw,58px);font-weight:700;line-height:1.02;letter-spacing:.005em;margin:9px 0 15px;text-shadow:0 2px 16px rgba(0,0,0,.75),0 0 18px rgba(239,211,145,.08)}
#setup .verifyLead{margin:0 auto 31px;max-width:540px;color:#b4b8bd;font-size:clamp(13px,3.2vw,17px);line-height:1.55}
#setup .verifyDivider{position:relative;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:11px;margin:12px 2px 13px;color:var(--verify-gold-bright)}
#setup .verifyDivider:before,#setup .verifyDivider:after{content:"";height:1px;background:linear-gradient(90deg,transparent,rgba(201,164,91,.4))}#setup .verifyDivider:after{background:linear-gradient(90deg,rgba(201,164,91,.4),transparent)}
#setup .verifyDivider b{font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:.25em;font-weight:700;color:#e9dfc7}#setup .verifyDivider span{font-size:9px;color:var(--verify-gold)}
#setup .verifyDeckPanel{position:relative;z-index:2}
#setup textarea{min-height:286px;padding:18px 18px 38px;border:1px solid rgba(201,164,91,.55);border-radius:11px;background:linear-gradient(180deg,rgba(2,10,15,.92),rgba(2,8,13,.96));color:#edf1f3;font-size:15px;line-height:1.45;resize:vertical;box-shadow:inset 0 0 36px rgba(0,0,0,.44),0 0 0 4px rgba(0,0,0,.18)}
#setup textarea::placeholder{color:#7f858a}
#setup textarea:focus,#setup select:focus{outline:1px solid color-mix(in srgb,var(--deck-a,#5db8ff) 44%,var(--verify-gold));outline-offset:2px}
#setup .deckCharCount{position:absolute;right:15px;bottom:12px;color:#8f9498;font-size:11px;letter-spacing:.04em;pointer-events:none}
#setup .legalityToolbar{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) minmax(142px,200px);align-items:center;gap:12px;margin:12px 0 23px;padding:9px 11px;border:1px solid rgba(201,164,91,.24);border-radius:8px;background:rgba(2,9,14,.65)}
#setup .legalityToolbar label{font-size:9px;color:#aaafb3;letter-spacing:.16em}#setup .legalityToolbar select{padding:9px 10px;border:1px solid rgba(201,164,91,.38);border-radius:7px;background:#061018;color:#e8e1cf}
#setup .verifyImportDivider{margin-top:5px}
#setup .importActions{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:10px}
#setup .verifyImportCard,#setup .verifyVaultRow{display:grid;align-items:center;text-align:left;color:#efe9d9;border:1px solid rgba(201,164,91,.48);background:linear-gradient(145deg,rgba(8,19,27,.95),rgba(3,10,15,.98));box-shadow:inset 0 1px rgba(255,255,255,.025),0 8px 22px rgba(0,0,0,.2)}
#setup .verifyImportCard{grid-template-columns:52px minmax(0,1fr);gap:12px;min-height:84px;padding:13px;border-radius:10px}
#setup .verifyImportCard b,#setup .verifyVaultRow b{display:block;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:500;color:#f2ead8}#setup .verifyImportCard small,#setup .verifyVaultRow small{display:block;margin-top:4px;color:#8d959a;font-size:11px;font-weight:500}
#setup .verifyActionIcon{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;border:1px solid rgba(201,164,91,.6);background:radial-gradient(circle at 35% 30%,rgba(201,164,91,.16),#061018 70%);color:#e8c979;font-family:Georgia,serif;font-size:26px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.2)}
#setup .verifyVaultRow{position:relative;z-index:2;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;width:100%;min-height:72px;margin-top:10px;padding:11px 14px;border-radius:10px}#setup .verifyVaultRow>strong{font-size:28px;font-weight:300;color:#d9b76c}
#setup .physicalDeckNote{position:relative;z-index:2;margin:10px 0 12px;padding:7px 10px;border:0;background:transparent;color:#7f8a90;text-align:center;font-size:9px;line-height:1.5;letter-spacing:.055em}
#setup .verifyDeckCta{position:relative;z-index:2;display:grid;grid-template-columns:72px minmax(0,1fr);align-items:center;gap:14px;width:100%;min-height:108px;padding:14px 22px;border:1px solid rgba(239,211,145,.76);border-radius:9px;background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--deck-a,#4b99d0) 18%,transparent),transparent 48%),linear-gradient(145deg,#071d31,#05111d 62%,#061421);color:#fff;box-shadow:0 0 0 4px rgba(2,8,12,.9),0 0 0 5px rgba(201,164,91,.38),0 14px 34px rgba(0,0,0,.42),0 0 28px color-mix(in srgb,var(--deck-a,#4b99d0) 18%,transparent)}
#setup .verifyDeckCta b{display:block;font-family:Georgia,'Times New Roman',serif;font-size:clamp(29px,7vw,43px);line-height:1;font-weight:500;color:#f7f0df}#setup .verifyDeckCta small{display:block;margin-top:7px;color:#c2c9ce;font-size:11px;font-weight:500}
#setup .verifyShield{display:grid;place-items:center;width:62px;height:68px;clip-path:polygon(50% 0,92% 16%,86% 72%,50% 100%,14% 72%,8% 16%);border:1px solid var(--verify-gold);background:radial-gradient(circle at 50% 42%,rgba(239,211,145,.22),#07111a 68%);color:#f0d58c;font-size:28px;text-shadow:0 0 14px rgba(239,211,145,.38)}
#setup #vr{position:relative;z-index:2;margin-top:18px}#setup #conf{margin-top:8px}#setup .cmdPick{border-color:rgba(201,164,91,.34);background:rgba(3,11,16,.8)}#setup .cmdPick label{margin-top:8px}#setup .verifyContinueGrid{margin-top:10px}
#setup .verifyPrivacy{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:22px 0 2px;color:#7f858a;font-size:11px}#setup .verifyPrivacy b{color:#d2ad63;font-weight:650}#setup .verifyPrivacy i{font-style:normal;color:#7d673e}
#setup .verifyImportCard:hover,#setup .verifyVaultRow:hover,#setup .verifyDeckCta:hover{border-color:color-mix(in srgb,var(--deck-a,#5db8ff) 36%,var(--verify-gold-bright))}
@media(max-width:620px){#setup .verifyShell{margin-top:4px;padding:104px 17px 20px;border-radius:10px}#setup .verifyFrame{inset:6px}#setup .verifyArcaneRail{display:none}#setup .verifyManaAtmosphere{left:12px;right:12px;top:52px;height:190px}#setup .verifyHero{padding-top:58px}#setup .verifyManaWheel{top:-82px;width:132px;height:132px}#setup .verifyManaWheel .white{left:50px}#setup .verifyManaWheel .blue{right:6px;top:45px}#setup .verifyManaWheel .black{right:23px;bottom:9px}#setup .verifyManaWheel .red{left:22px;bottom:10px}#setup .verifyManaWheel .green{left:4px;top:46px}#setup h2{font-size:40px}#setup .verifyLead{font-size:13px;margin-bottom:25px}#setup textarea{min-height:250px}#setup .legalityToolbar{grid-template-columns:1fr;gap:6px}#setup .importActions{grid-template-columns:1fr 1fr;gap:8px}#setup .verifyImportCard{grid-template-columns:42px minmax(0,1fr);gap:9px;min-height:78px;padding:10px}#setup .verifyActionIcon{width:40px;height:40px;font-size:22px}#setup .verifyImportCard b,#setup .verifyVaultRow b{font-size:16px}#setup .verifyImportCard small,#setup .verifyVaultRow small{font-size:10px}#setup .verifyDeckCta{grid-template-columns:58px minmax(0,1fr);min-height:94px;padding:12px 16px}#setup .verifyShield{width:52px;height:58px}#setup .verifyDeckCta b{font-size:33px}}
@media(max-width:420px){#setup .verifyShell{padding-left:13px;padding-right:13px}#setup .importActions{grid-template-columns:1fr}#setup .verifyDeckCta{grid-template-columns:50px minmax(0,1fr);gap:10px}#setup .verifyShield{width:46px;height:52px}#setup .verifyDeckCta b{font-size:30px}#setup .verifyDeckCta small{font-size:10px}#setup .verifyPrivacy{font-size:10px;gap:6px}}
'''

def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected exactly 1 replacement, got {n}')
    return out

# Replace the Verify section markup, preserving every functional ID used by runtime logic.
idx = INDEX.read_text()
start = idx.index('<section id="setup">')
end = idx.index('</section>', start) + len('</section>')
idx = idx[:start] + NEW_SETUP + idx[end:]
INDEX.write_text(idx)

css = CSS.read_text()
phase68 = css.index('/* Phase 68 — immersive gateway')
phase69 = css.index('/* Phase 69 — premium fantasy shell')
pre, mid, post = css[:phase68], css[phase68:phase69], css[phase69:]

# Delete the obsolete Phase 68 Verify visual owner, but preserve unrelated lobby/avatar rules.
for pat, label in [
    (r'#setup\{[^{}]*\}\n', 'phase68 setup root'),
    (r'#setup:before\{[^{}]*\}\n', 'phase68 setup atmosphere'),
    (r'#setup>\.card\{[^{}]*\}\n', 'phase68 setup card'),
    (r'#setup>\.card:before\{[^{}]*\}\n', 'phase68 setup accent'),
    (r'#setup h2\{[^{}]*\}\n', 'phase68 setup heading'),
    (r'#setup textarea\{[^{}]*\}\n', 'phase68 setup textarea'),
    (r'\.importActions\{[^{}]*\}\.importActions #savedDecksSetupBtn\{[^{}]*\}\n', 'phase68 import actions'),
    (r'\.physicalDeckNote\{[^{}]*\}\n', 'phase68 physical note'),
    (r'\.verifyDeckCta\{[^{}]*\}\n', 'phase68 verify CTA'),
]:
    mid = sub_once(mid, pat, '', label)

# Split the later shared ornate owner so Lobby keeps its styling and Verify receives one new owner.
post = post.replace('#setup>.card::after,#lobby>.card::after', '#lobby>.card::after')
post = post.replace('#setup>.card,#lobby>.card', '#lobby>.card')
post = post.replace('#setup h2,#lobby h2', '#lobby h2')
post = post.replace('#setup textarea,#setup select,#lobby input', '#lobby input')
post = post.replace('#setup .verifyDeckCta,#lobby #rdy', '#lobby #rdy')
post = post.replace('#lobby .btn,#setup .btn', '#lobby .btn')
for pat in [
    r'#setup>\.card\{[^{}]*\}\n',
    r'#setup h2\{[^{}]*\}\n',
    r'#setup \.physicalDeckNote\{[^{}]*\}\n',
    r'#setup \.verifyDeckCta\{[^{}]*\}\n',
]:
    post = re.sub(pat, '', post, count=1)

# New canonical Verify owner is inserted at the start of the premium-shell section, not appended as an override.
marker = '/* Phase 69 — premium fantasy shell, portrait avatars, live deck-theme lobby */\n'
if marker not in post:
    raise SystemExit('Phase 69 owner marker missing')
post = post.replace(marker, marker + NEW_CSS + '\n', 1)
CSS.write_text(pre + mid + post)

# Minimal behavior wiring: visual character counter + setup Deck Vault bridge to the existing canonical vault control.
js = JS.read_text()
needle = "function resetVerificationPresentation(){"
behavior = "function syncVerifyDeckCount(){let e=$('deckCharCount'),d=$('deck');if(e&&d)e.textContent=String(d.value.length)+' / 10000'}if($('deck')){$('deck').addEventListener('input',syncVerifyDeckCount);syncVerifyDeckCount()}if($('setupDeckVaultBtn'))$('setupDeckVaultBtn').onclick=()=>{let vault=$('deckVaultLock');if(!vault)return toast('Deck Vault is unavailable.');$('setup').classList.add('h');showLobbyPage();setTimeout(()=>vault.click(),120)};"
if behavior not in js:
    if needle not in js:
        raise SystemExit('Verify behavior insertion point missing')
    js = js.replace(needle, behavior + needle, 1)
JS.write_text(js)

# Ownership / safety audit.
css_check = CSS.read_text()
required = ['#setup .verifyShell{', '#setup .verifyManaWheel{', '#setup .verifyDeckCta{', '#setup .verifyPrivacy{']
for token in required:
    if css_check.count(token) != 1:
        raise SystemExit(f'ownership audit failed for {token}: {css_check.count(token)}')
for obsolete in ['#setup>.card{', '#setup>.card:before{', '#setup>.card::after{']:
    if obsolete in css_check:
        raise SystemExit(f'obsolete Verify owner remains: {obsolete}')
if '!important' in NEW_CSS:
    raise SystemExit('new Verify owner contains !important')
if INDEX.read_text().count('id="deck"') != 1 or INDEX.read_text().count('id="ver"') != 1:
    raise SystemExit('Verify functional IDs duplicated')
print('Verify shell fidelity patch applied; canonical ownership audit passed.')
