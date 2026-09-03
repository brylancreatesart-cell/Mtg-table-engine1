#!/usr/bin/env python3
from pathlib import Path

CSS=Path('styles/app-src/styles-part-01.part.css')
css=CSS.read_text(encoding='utf-8')

replacements=[]
def swap(old,new,label):
    global css
    n=css.count(old)
    if n!=1:
        raise SystemExit(f'Safety stop: {label} expected 1 canonical match, found {n}')
    css=css.replace(old,new,1)
    replacements.append((old,new,label))
    print('replace',label)

def drop(old,label):
    swap(old,'',label)

# DO NOT STACK EDITS — replace the actual HUD base owners.
swap('.hudIdentity{display:grid;grid-template-columns:52px 1fr auto;gap:10px;align-items:center}',
     '.hudIdentity{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:12px;align-items:center;padding-bottom:4px}',
     'HUD identity hierarchy')
swap('.hudAvatar{width:52px;height:52px;border-radius:50%;border:1px solid transparent;background:transparent;box-shadow:none}',
     '.hudAvatar{width:58px;height:58px;border-radius:50%;border:1px solid transparent;background:transparent;box-shadow:none;filter:drop-shadow(0 0 12px color-mix(in srgb,var(--deck-a,#52b8ff) 26%,transparent))}',
     'HUD avatar presence')
swap('.hudName{font-size:17px;font-weight:900}',
     '.hudName{font-size:19px;font-weight:950;line-height:1.05;letter-spacing:-.01em}',
     'HUD player name')
swap('.hudCommander{font-size:10px;color:var(--m);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
     '.hudCommander{font-size:10px;font-weight:800;letter-spacing:.035em;color:color-mix(in srgb,var(--deck-a,#52b8ff) 38%,#aebfca);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}',
     'HUD commander identity')
swap('.priorityPill{border:1px solid #31495b;border-radius:999px;padding:7px 9px;font-size:9px;font-weight:900;color:var(--m)}',
     '.priorityPill{border:1px solid #31495b;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:950;letter-spacing:.06em;color:var(--m);background:rgba(4,10,14,.62);transition:border-color .2s,box-shadow .2s,color .2s,background .2s}',
     'priority status hierarchy')
swap('.priorityPill.mine{color:#dff8ff;border-color:var(--bl);box-shadow:0 0 14px rgba(82,184,255,.18)}',
     '.priorityPill.mine{color:#f4fbff;border-color:color-mix(in srgb,var(--deck-a,#52b8ff) 78%,#fff);background:color-mix(in srgb,var(--deck-a,#52b8ff) 12%,rgba(4,10,14,.84));box-shadow:0 0 0 1px color-mix(in srgb,var(--deck-a,#52b8ff) 18%,transparent),0 0 22px color-mix(in srgb,var(--deck-glow,rgba(82,184,255,.2)) 62%,transparent)}',
     'active priority emphasis')
swap('.turnStrip{display:flex;justify-content:space-between;margin-top:11px;padding:8px 0;border-top:1px solid #1b2e3a;color:#b7c8d4;font-size:11px;font-weight:800}',
     '.turnStrip{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;padding:9px 11px;border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 18%,#1b2e3a);border-radius:11px;background:color-mix(in srgb,var(--deck-a,#52b8ff) 5%,rgba(3,9,13,.62));color:#d5e0e7;font-size:11px;font-weight:900;letter-spacing:.025em}',
     'turn phase strip')
swap('.lifeStage{text-align:center;padding:12px 0}',
     '.lifeStage{text-align:center;padding:17px 0 14px;position:relative}',
     'life stage spacing')
swap('.lifeLabel{font-size:10px;color:var(--m);letter-spacing:.18em}',
     '.lifeLabel{font-size:9px;font-weight:900;color:color-mix(in srgb,var(--deck-a,#52b8ff) 42%,var(--m));letter-spacing:.24em}',
     'life label hierarchy')
swap('.lifeButton{font-size:78px!important;line-height:1;border:0;background:transparent;color:var(--t);font-weight:950}',
     '.lifeButton{font-size:clamp(74px,19vw,94px);line-height:.94;border:0;background:transparent;color:var(--t);font-weight:950;letter-spacing:-.055em;text-shadow:0 0 28px color-mix(in srgb,var(--deck-glow,rgba(82,184,255,.2)) 42%,transparent)}',
     'life total hierarchy')
swap('.statusRail{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
     '.statusRail{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 12%,#1d3443)}',
     'status rail separation')
swap('.statusRail .st{background:#08131b;border:1px solid #1d3443;color:var(--t);border-radius:10px;padding:8px}',
     '.statusRail .st{background:rgba(6,15,21,.7);border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 14%,#1d3443);color:var(--t);border-radius:10px;padding:8px}',
     'status cells')

# Life-size ownership cleanup: remove the old !important size owner and retain a clean mobile variant.
drop('.lifeUniversal .lifeButton{font-size:72px!important}', 'obsolete life-size override')
swap('@media(max-width:420px){.universalNumeric{grid-template-columns:50px minmax(100px,1fr) 50px}.numericStep{height:52px}.lifeUniversal .lifeButton{font-size:64px!important}.contextHint{bottom:calc(67px + env(safe-area-inset-bottom))}}',
     '@media(max-width:420px){.universalNumeric{grid-template-columns:50px minmax(100px,1fr) 50px}.numericStep{height:52px}.lifeButton{font-size:68px}.contextHint{bottom:calc(67px + env(safe-area-inset-bottom))}}',
     'clean mobile life size')

# Move the final contextual dock presentation into its real base owner.
swap('.dock{position:fixed;left:50%;bottom:calc(8px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(822px,calc(100% - 28px));display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:#071019eb;border:1px solid var(--l);padding:7px;border-radius:14px;backdrop-filter:blur(12px)}',
     '.dock{position:fixed;z-index:30;left:50%;bottom:calc(8px + env(safe-area-inset-bottom));transform:translateX(-50%);width:calc(100vw - 20px - env(safe-area-inset-left) - env(safe-area-inset-right));max-width:820px;display:flex;justify-content:center;align-items:stretch;gap:7px;background:linear-gradient(145deg,color-mix(in srgb,var(--deck-a,#52b8ff) 9%,rgba(3,7,10,.96)),color-mix(in srgb,var(--deck-b,#b458ff) 7%,rgba(3,7,10,.96)));border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 30%,#243b4c);padding:7px;border-radius:15px;box-shadow:0 10px 38px rgba(0,0,0,.42),0 0 22px var(--deck-glow);backdrop-filter:blur(18px)}',
     'contextual dock base owner')
swap('.dk{border:1px solid #2d4658;background:#0a1720;color:#fff;border-radius:9px;padding:11px 3px;font-size:10px}',
     '.dk{flex:1 1 0;max-width:196px;min-width:0;border:1px solid color-mix(in srgb,var(--deck-a,#52b8ff) 34%,#2b4353);background:linear-gradient(145deg,color-mix(in srgb,var(--deck-a,#52b8ff) 8%,#0c1720),color-mix(in srgb,var(--deck-b,#b458ff) 6%,#09141c));color:#fff;border-radius:10px;padding:13px 8px;font-size:10px;font-weight:850;overflow:hidden;text-overflow:ellipsis}',
     'contextual action base')
drop('.contextualDock{box-sizing:border-box;width:100%;max-width:none}', 'redundant contextual dock box owner')
drop('.contextualDock .dk{min-width:0;overflow:hidden;text-overflow:ellipsis}', 'redundant contextual action owner')
swap('.contextualDock .dk:first-child{border-color:var(--bl);background:#102333}',
     '.contextualDock .dk:not(.h):first-of-type{border-color:color-mix(in srgb,var(--deck-a,#52b8ff) 75%,#fff);box-shadow:0 0 16px var(--deck-glow)}',
     'primary contextual action state')

# Preserve legitimate responsive behavior, but stop it from switching the dock back to a grid/edge-anchored model.
swap('.contextualDock{left:0;right:0;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding-left:max(7px,env(safe-area-inset-left));padding-right:max(7px,env(safe-area-inset-right))}',
     '.contextualDock{width:calc(100vw - 14px - env(safe-area-inset-left) - env(safe-area-inset-right));gap:6px;padding-left:max(6px,env(safe-area-inset-left));padding-right:max(6px,env(safe-area-inset-right))}',
     'responsive contextual dock')
swap('.contextualDock .dk{font-size:9px;padding:12px 3px;white-space:normal;line-height:1.1}',
     '.contextualDock .dk{max-width:none;font-size:9px;padding:12px 5px;white-space:normal;line-height:1.1}',
     'responsive contextual action')

late='''/* Viewport-centered action dock. Flex keeps 1–4 visible actions centered instead of leaving empty grid columns. */
.contextualDock{position:fixed!important;z-index:30!important;left:50vw!important;right:auto!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;width:calc(100vw - 20px - env(safe-area-inset-left) - env(safe-area-inset-right))!important;max-width:820px!important;box-sizing:border-box!important;display:flex!important;justify-content:center!important;align-items:stretch!important;gap:7px!important;padding:7px!important;margin:0!important;border:1px solid color-mix(in srgb,var(--deck-a) 30%,#243b4c)!important;border-radius:15px!important;background:linear-gradient(145deg,color-mix(in srgb,var(--deck-a) 9%,rgba(3,7,10,.96)),color-mix(in srgb,var(--deck-b) 7%,rgba(3,7,10,.96)))!important;box-shadow:0 10px 38px rgba(0,0,0,.42),0 0 22px var(--deck-glow)!important;backdrop-filter:blur(18px)}
.contextualDock.h{display:none!important}
.contextualDock .dk{flex:1 1 0!important;max-width:196px!important;min-width:0!important;padding:13px 8px!important;border-color:color-mix(in srgb,var(--deck-a) 34%,#2b4353)!important;background:linear-gradient(145deg,color-mix(in srgb,var(--deck-a) 8%,#0c1720),color-mix(in srgb,var(--deck-b) 6%,#09141c))!important}
.contextualDock .dk:not(.h):first-of-type{border-color:color-mix(in srgb,var(--deck-a) 75%,#fff)!important;box-shadow:0 0 16px var(--deck-glow)}
.contextHint{left:50vw!important;transform:translateX(-50%)!important}
@media(max-width:620px){.contextualDock{width:calc(100vw - 14px - env(safe-area-inset-left) - env(safe-area-inset-right))!important;gap:6px!important;padding:6px!important}.contextualDock .dk{max-width:none!important;font-size:9px!important;padding:12px 5px!important}.lifeCenterWrap .delta{font-size:25px}.lifeCenterWrap .delta.gainDelta{margin-left:6px}.lifeCenterWrap .delta.lossDelta{margin-right:6px}}
@media(max-width:390px){.lifeCenterWrap .delta{font-size:22px}.lifeCenterWrap .delta.gainDelta{margin-left:4px}.lifeCenterWrap .delta.lossDelta{margin-right:4px}}
@media(prefers-reduced-motion:reduce){.lifeCenterWrap .delta.on{animation-duration:.18s!important;transform:none!important}}
'''
clean='''/* Viewport-centered life delta refinements. The action dock is owned by .dock / .dk above. */
@media(max-width:620px){.lifeCenterWrap .delta{font-size:25px}.lifeCenterWrap .delta.gainDelta{margin-left:6px}.lifeCenterWrap .delta.lossDelta{margin-right:6px}}
@media(max-width:390px){.lifeCenterWrap .delta{font-size:22px}.lifeCenterWrap .delta.gainDelta{margin-left:4px}.lifeCenterWrap .delta.lossDelta{margin-right:4px}}
@media(prefers-reduced-motion:reduce){.lifeCenterWrap .delta.on{animation-duration:.18s!important;transform:none!important}}
'''
swap(late,clean,'remove stacked contextual dock override block')

# Post-edit ownership audit.
for old,new,label in replacements:
    if old and old in css:
        raise SystemExit(f'Ownership audit failed: obsolete owner remains for {label}')
    if new and css.count(new)!=1:
        raise SystemExit(f'Ownership audit failed: replacement count for {label} is {css.count(new)}')
if '.contextualDock{position:fixed!important' in css or '.contextualDock .dk{flex:1 1 0!important' in css:
    raise SystemExit('Stacked !important contextual dock owner still exists')
if '.lifeUniversal .lifeButton{font-size:' in css:
    raise SystemExit('Old life-size override owner still exists')

CSS.write_text(css,encoding='utf-8')
print('Premium cohesion pass 3 complete: HUD hierarchy sharpened and contextual dock ownership consolidated.')
