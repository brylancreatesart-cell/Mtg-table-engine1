#!/usr/bin/env python3
from pathlib import Path
import re

CSS=Path('styles/app-src/styles-part-01.part.css')
HTML=Path('index.html')
css=CSS.read_text(encoding='utf-8')
html=HTML.read_text(encoding='utf-8')

def replace_rule(selector,new_body,label):
    global css
    pat=re.compile(re.escape(selector)+r'\{[^{}]*\}')
    hits=list(pat.finditer(css))
    if len(hits)!=1:
        raise SystemExit(f'Safety stop: {label} expected 1 canonical owner for {selector}, found {len(hits)}')
    repl=selector+'{'+new_body+'}'
    css=css[:hits[0].start()]+repl+css[hits[0].end():]
    print('replaced',label)

# Canonical Host HUD owners only. No appended overrides.
replace_rule('.hostTabs','display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:10px 0 12px;overflow:visible','host tabs layout')
replace_rule('.hostTab','min-width:0;white-space:nowrap;border:1px solid #263d4d;background:#071119;color:#8ea2b0;border-radius:10px;padding:10px 7px;font-size:9px;font-weight:950;letter-spacing:.055em;transition:border-color .18s,background .18s,color .18s,box-shadow .18s','host tab base')
replace_rule('.hostTab.active','color:#fff;border-color:color-mix(in srgb,var(--deck-a,#52b8ff) 78%,#fff);background:linear-gradient(145deg,color-mix(in srgb,var(--deck-a,#52b8ff) 18%,#0b1822),color-mix(in srgb,var(--deck-b,#b458ff) 10%,#071019));box-shadow:0 0 18px color-mix(in srgb,var(--deck-glow,rgba(82,184,255,.2)) 62%,transparent),inset 0 1px 0 rgba(255,255,255,.04)','host active tab')
replace_rule('.hostCard,.hostPlayer,.judgeBlock','border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 20%,#243b4c);background:linear-gradient(155deg,color-mix(in srgb,var(--deck-a,#52b8ff) 5%,#09151d),#071018 68%);border-radius:14px;padding:13px;box-shadow:0 12px 28px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.02)','host card surfaces')
replace_rule('.hostPlayerActions,.hostPlayerStats','display:flex;flex-wrap:wrap;gap:7px;margin-top:9px','host control clusters')
replace_rule('.hostStackItem,.hostEvent','padding:11px 0;border-bottom:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 12%,#172733)','host stack/log rows')

# Optional canonical rules: replace only if each exists exactly once.
optional={
'.hostGrid':'display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.65fr);gap:10px',
'.hostMetric':'font-size:28px;font-weight:950;line-height:1;letter-spacing:-.035em;color:#f6fbff;margin:7px 0 5px;text-shadow:0 0 18px color-mix(in srgb,var(--deck-a,#52b8ff) 18%,transparent)',
'.hostMuted':'font-size:10px;color:#8297a6;line-height:1.45',
'.hostStat':'border:1px solid #263d4d;background:#08131b;color:#c6d5de;border-radius:999px;padding:6px 8px;font-size:9px;font-weight:850',
'.judgeTitle':'font-size:10px;letter-spacing:.14em;font-weight:950;color:#d7e5ee;margin-bottom:8px',
'.hostPlayerName':'font-size:13px;font-weight:950;color:#f4f8fb',
'.hostPlayerMeta':'font-size:10px;color:#8da2b0;margin-top:2px',
'.hostStackName':'font-size:12px;font-weight:900;color:#eef6fb;margin-top:2px',
'.hostStackType':'font-size:9px;font-weight:950;letter-spacing:.08em;color:color-mix(in srgb,var(--deck-a,#52b8ff) 55%,#b7c9d4)',
'.hostEventMeta':'font-size:9px;color:#8196a4;margin-top:4px'
}
for sel,body in optional.items():
    pat=re.compile(re.escape(sel)+r'\{[^{}]*\}')
    hits=list(pat.finditer(css))
    if len(hits)==1:
        m=hits[0]; css=css[:m.start()]+sel+'{'+body+'}'+css[m.end():]
        print('replaced optional',sel)
    elif len(hits)>1:
        raise SystemExit(f'Safety stop: duplicate base owner for {sel}: {len(hits)}')

# Shared canonical hostMini owner is grouped with lobby buttons; do not fork it. Add semantic states by replacing existing state owners if present.
for sel,body in {
'.hostMini.danger':'border-color:#7d3434;background:#2b1114;color:#ffb4ae',
'.rulesFreeze':'border-color:#987326;background:#2c220d;color:#ffe19a;box-shadow:0 0 15px rgba(235,187,67,.12)'
}.items():
    pat=re.compile(re.escape(sel)+r'\{[^{}]*\}')
    hits=list(pat.finditer(css))
    if len(hits)==1:
        m=hits[0];css=css[:m.start()]+sel+'{'+body+'}'+css[m.end():]
    elif len(hits)>1:
        raise SystemExit(f'Safety stop: duplicate state owner for {sel}: {len(hits)}')

# Host screen topbar gets a dedicated semantic shell; replace markup, then add its canonical rule near the existing shared flex owner.
old_markup='<div class="hostTopbar">\n    <div><div class="battleTitle">Table Control</div><div class="battleRoom">AUTHORITATIVE HOST HUD · ROOM <span id="hostRoomCode">------</span></div></div>\n    <button id="playerHudBtn" class="battleExit">PLAYER HUD</button>\n  </div>'
new_markup='<div class="hostTopbar">\n    <div class="hostAuthorityIdentity"><div class="hostKicker">AUTHORITATIVE TABLE CONTROL</div><div class="battleTitle">Host Command</div><div class="battleRoom">ROOM <span id="hostRoomCode">------</span> · CORRECTIONS, RECOVERY & TABLE RULES</div></div>\n    <button id="playerHudBtn" class="battleExit">RETURN TO PLAYER HUD</button>\n  </div>'
if html.count(old_markup)!=1:
    raise SystemExit(f'Safety stop: Host HUD topbar markup expected once, found {html.count(old_markup)}')
html=html.replace(old_markup,new_markup,1)

anchor='.hostTabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:10px 0 12px;overflow:visible}'
insert='.hostAuthorityIdentity{min-width:0}.hostKicker{font-size:8px;font-weight:950;letter-spacing:.18em;color:color-mix(in srgb,var(--deck-a,#52b8ff) 58%,#9db0bd);margin-bottom:3px}.hostScreen{position:relative;padding-bottom:28px}.hostScreen .hostTopbar{margin:2px 0 4px;padding:12px 13px;border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 24%,#243b4c);border-radius:15px;background:linear-gradient(145deg,color-mix(in srgb,var(--deck-a,#52b8ff) 7%,#08131b),color-mix(in srgb,var(--deck-b,#b458ff) 4%,#050b10));box-shadow:0 16px 34px rgba(0,0,0,.2)}.hostScreen .battleTitle{font-size:24px;letter-spacing:-.025em}.hostScreen .battleRoom{margin-top:3px}.hostTab[data-host-tab="judge"]{border-color:#53363a;color:#caa8aa}.hostTab[data-host-tab="judge"].active{border-color:#a54d4d;background:linear-gradient(145deg,#301317,#140a0d);box-shadow:0 0 18px rgba(206,73,73,.16)}@media(max-width:700px){.hostTabs{grid-template-columns:repeat(3,minmax(0,1fr))}.hostScreen .hostTopbar{display:grid;grid-template-columns:1fr;align-items:stretch}.hostScreen .hostTopbar .battleExit{width:100%;margin-top:8px}.hostGrid{grid-template-columns:1fr}}'
if css.count(anchor)!=1:
    raise SystemExit('Safety stop: host tabs anchor missing after replacement')
css=css.replace(anchor,anchor+insert,1)

# Ownership audit: new canonical owners are singular and no late !important Host HUD overrides are introduced.
for sel in ('.hostTabs{','.hostTab{','.hostTab.active{','.hostCard,.hostPlayer,.judgeBlock{'):
    if css.count(sel)!=1:
        raise SystemExit(f'Safety stop: canonical Host HUD owner count for {sel} is {css.count(sel)}')
if re.search(r'\.host(?:Tabs|Tab|Card|Player|Screen|Topbar)[^{}]*\{[^{}]*!important',css):
    raise SystemExit('Safety stop: stacked !important Host HUD override detected')

CSS.write_text(css,encoding='utf-8')
HTML.write_text(html,encoding='utf-8')
print('Host HUD premium cohesion pass applied with canonical owners only')
