#!/usr/bin/env python3
from pathlib import Path
import re

CSS=Path('styles/inline-01.css')
HTML=Path('index.html')
css=CSS.read_text(encoding='utf-8')
html=HTML.read_text(encoding='utf-8')

def swap(old,new,label,expected=1):
    global css
    n=css.count(old)
    if n!=expected: raise SystemExit(f'Safety stop: {label} expected {expected} exact match(es), found {n}')
    css=css.replace(old,new,expected)
    print('replaced',label)

def drop(old,label,expected=1): swap(old,'',label,expected)

swap('.avatarMount,.hudAvatar{overflow:hidden}', '.avatarMount,.hudAvatar{overflow:visible}', 'avatar mount overflow')
swap('.hudAvatar{width:52px;height:52px;border-radius:50%;border:1px solid #34556c;background:#0b131b}', '.hudAvatar{width:52px;height:52px;border-radius:50%;border:1px solid transparent;background:transparent;box-shadow:none}', 'hud avatar base')
swap('.oppMiniAvatar{width:30px;height:30px;border-radius:50%;overflow:hidden;border:1px solid #34556c;background:#0b131b}', '.oppMiniAvatar{width:30px;height:30px;border-radius:50%;overflow:visible;border:1px solid transparent;background:transparent;box-shadow:none}', 'opponent avatar base')
swap('.bfSeatAvatar{width:38px;height:38px;border-radius:50%;overflow:hidden;border:1px solid #3b596b}', '.bfSeatAvatar{width:38px;height:38px;border-radius:50%;overflow:visible;border:1px solid transparent;background:transparent;box-shadow:none}', 'battlefield seat avatar base')

# Remove obsolete decorative effects that the late inline patch had been suppressing.
drop('.playerHud[data-poison-band="danger"] .hudAvatar,.playerHud[data-poison-band="critical"] .hudAvatar{box-shadow:0 0 0 2px rgba(116,180,95,.28),0 0 18px rgba(93,173,74,.18)}', 'poison avatar ring')
drop('.hudAvatar{border-color:color-mix(in srgb,var(--deck-a) 68%,#34556c);box-shadow:0 0 16px var(--deck-glow)}', 'deck avatar ring')
drop('.battleActive .hudAvatar{background:radial-gradient(circle,color-mix(in srgb,var(--deck-a) 13%,#0b131b),#081018 70%);box-shadow:0 0 22px var(--deck-glow),inset 0 0 18px color-mix(in srgb,var(--deck-b) 10%,transparent)}', 'battle avatar glow')

swap('.fantasyAvatar.portraitAvatar{background:#050b10;border-radius:50%;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(201,168,94,.65),0 0 15px color-mix(in srgb,var(--avatar-accent) 25%,transparent)}', '.fantasyAvatar.portraitAvatar{background:transparent;border-radius:0;overflow:visible;box-shadow:none}', 'portrait avatar base')
swap('.fantasyAvatar.portraitAvatar img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.015)}', '.fantasyAvatar.portraitAvatar img{width:100%;height:100%;object-fit:contain;object-position:center;display:block;transform:none;filter:none}', 'portrait image fit')
swap('.fantasyAvatar.portraitAvatar .avatarAura{inset:2px;border-width:1px;border-color:color-mix(in srgb,var(--deck-a) 36%,var(--avatar-accent));box-shadow:inset 0 0 10px rgba(0,0,0,.25)}', '.fantasyAvatar.portraitAvatar .avatarAura{display:none}', 'portrait aura')

swap('.avatarHeroArt{position:relative;min-width:0;aspect-ratio:4/5;border-radius:18px;overflow:hidden;background:#09131b;border:1px solid color-mix(in srgb,var(--hero-accent,var(--deck-a,#c9a85e)) 30%,#243b4c);box-shadow:0 18px 32px rgba(0,0,0,.26)}', '.avatarHeroArt{position:relative;min-width:0;aspect-ratio:1/1;border-radius:18px;overflow:visible;background:transparent;border:1px solid transparent;box-shadow:none}', 'avatar hero art')
swap('.avatarHeroArt .fantasyAvatar,.avatarChoicePortrait .fantasyAvatar{width:100%!important;height:100%!important}', '.avatarHeroArt .fantasyAvatar,.avatarChoicePortrait .fantasyAvatar{width:100%;height:100%}', 'avatar stage size')
swap('.avatarHeroArt .portraitAvatar,.avatarChoicePortrait .portraitAvatar{border-radius:inherit!important;box-shadow:none!important;background:#09131b!important}', '.avatarHeroArt .portraitAvatar,.avatarChoicePortrait .portraitAvatar{border-radius:0;box-shadow:none;background:transparent;overflow:visible}', 'avatar stage portrait shell')
swap('.avatarHeroArt .avatarAura,.avatarChoicePortrait .avatarAura{display:none!important}', '.avatarHeroArt .avatarAura,.avatarChoicePortrait .avatarAura{display:none}', 'avatar stage aura')
swap('.avatarHeroArt .portraitAvatar img{width:100%;height:100%;object-fit:cover;object-position:center 22%;transform:scale(1.06)!important;filter:saturate(1.03) contrast(1.02)}', '.avatarHeroArt .portraitAvatar img{width:100%;height:100%;object-fit:contain;object-position:center;transform:none;filter:none}', 'avatar hero image')
swap('.avatarChoicePortrait{position:relative;aspect-ratio:1/1;border-radius:14px;overflow:hidden;background:#08131b;border:1px solid rgba(201,168,94,.14)}', '.avatarChoicePortrait{position:relative;aspect-ratio:1/1;border-radius:14px;overflow:visible;background:transparent;border:1px solid transparent}', 'avatar choice portrait')
swap('.avatarChoicePortrait .portraitAvatar img{width:100%;height:100%;object-fit:cover;object-position:center 18%;transform:scale(1.06)!important}', '.avatarChoicePortrait .portraitAvatar img{width:100%;height:100%;object-fit:contain;object-position:center;transform:none;filter:none}', 'avatar choice image')
swap('.avatarChoicePremium.selected .avatarChoicePortrait{border-color:color-mix(in srgb,var(--sel-accent,var(--deck-a,#c9a85e)) 52%,#56728a)}', '.avatarChoicePremium.selected .avatarChoicePortrait{border-color:transparent}', 'selected portrait inner border')

swap('.profileHubAvatarButton .fantasyAvatar{width:100%;height:100%;border-radius:inherit!important;box-shadow:none!important}', '.profileHubAvatarButton .fantasyAvatar{width:100%;height:100%;border-radius:0;box-shadow:none;overflow:visible}', 'profile hub avatar shell')
swap('.profileHubAvatarButton .avatarAura{display:none!important}', '.profileHubAvatarButton .avatarAura{display:none}', 'profile hub aura')
swap('#myAvatar,.profileAvatarTap{border:0!important;box-shadow:none!important;background:transparent!important}', '#myAvatar,.profileAvatarTap{border:0;box-shadow:none;background:transparent;overflow:visible}', 'profile avatar container')
drop('#myAvatar .portraitAvatar,.profileAvatarTap .portraitAvatar{box-shadow:none!important}', 'redundant profile portrait shadow')
drop('#myAvatar .avatarAura,.profileAvatarTap .avatarAura{display:none!important}', 'redundant profile aura rule')
swap('#myAvatar .portraitAvatar img,.profileAvatarTap .portraitAvatar img{transform:scale(1.08);object-fit:cover}', '#myAvatar .portraitAvatar img,.profileAvatarTap .portraitAvatar img{transform:none;object-fit:contain;object-position:center;filter:none}', 'profile avatar image fit')

# The old late override is now obsolete: remove it instead of stacking another patch.
pattern=r'\n?<style id="premiumExternalAvatarAssets">.*?</style>\n?'
html2,n=re.subn(pattern,'\n',html,count=1,flags=re.S)
if n!=1: raise SystemExit(f'Safety stop: expected one premiumExternalAvatarAssets block, found {n}')
html=html2

# Invariants: one canonical portrait base and no obsolete external override marker.
if css.count('.fantasyAvatar.portraitAvatar{')!=1: raise SystemExit('Safety stop: portrait avatar base does not have exactly one owner')
if 'premiumExternalAvatarAssets' in html: raise SystemExit('Safety stop: stacked inline avatar CSS remains')
if 'object-fit:cover;object-position:center 22%' in css or 'transform:scale(1.08);object-fit:cover' in css: raise SystemExit('Safety stop: obsolete avatar crop remains')
CSS.write_text(css,encoding='utf-8')
HTML.write_text(html,encoding='utf-8')
print('batch 6 direct avatar visual ownership repair applied')
