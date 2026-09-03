from pathlib import Path

CSS = Path('styles/app-src/styles-part-01.part.css')
START = '/* Verify Deck reference-fidelity shell — canonical owner */'
END_HINT = '\n/* '
css = CSS.read_text()
start = css.find(START)
if start < 0:
    raise SystemExit('canonical Verify owner marker not found')
end = css.find(END_HINT, start + len(START))
if end < 0:
    end = len(css)
block = css[start:end]

# Precision calibration: direct edits inside the single canonical owner only.
block = block.replace(
    '#setup{position:relative;isolation:isolate;padding:0 2px 18px;',
    '#setup{position:relative;isolation:isolate;padding:0 max(2px,env(safe-area-inset-left)) calc(18px + env(safe-area-inset-bottom)) max(2px,env(safe-area-inset-right));'
)
block = block.replace(
    '#setup .verifyShell{position:relative;overflow:hidden;margin:8px 0 18px;padding:118px clamp(20px,5.4vw,46px) 25px;',
    '#setup .verifyShell{position:relative;overflow:hidden;margin:8px auto 18px;padding:118px clamp(20px,5.4vw,46px) 25px;--verify-content-width:620px;'
)
block = block.replace(
    '#setup .verifyHero{position:relative;z-index:3;text-align:center;padding-top:66px}',
    '#setup .verifyHero{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-inline:auto;text-align:center;padding-top:66px}'
)
block = block.replace(
    '#setup .verifyDivider{position:relative;z-index:3;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin:13px 2px 14px;',
    '#setup .verifyDivider{position:relative;z-index:3;width:min(100%,var(--verify-content-width));display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;justify-items:center;gap:12px;margin:13px auto 14px;'
)
block = block.replace(
    '#setup .verifyDivider b{font-family:Georgia,\'Times New Roman\',serif;font-size:12px;letter-spacing:.26em;font-weight:700;',
    '#setup .verifyDivider b{font-family:Georgia,\'Times New Roman\',serif;font-size:12px;letter-spacing:.26em;font-weight:700;text-align:center;white-space:nowrap;'
)
block = block.replace(
    '#setup .verifyDeckPanel{position:relative;z-index:3;padding:5px;',
    '#setup .verifyDeckPanel{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-inline:auto;padding:5px;'
)
block = block.replace(
    '#setup .legalityToolbar{position:relative;z-index:3;display:grid;',
    '#setup .legalityToolbar{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-left:auto;margin-right:auto;display:grid;'
)
block = block.replace(
    'gap:12px;margin:13px 0 24px;padding:10px 12px;',
    'gap:12px;margin-top:13px;margin-bottom:24px;padding:10px 12px;'
)
block = block.replace(
    '#setup .legalityToolbar label{font-size:9px;color:#adb1b5;letter-spacing:.17em}',
    '#setup .legalityToolbar label{font-size:9px;color:#adb1b5;letter-spacing:.17em;text-align:center;line-height:1.35}'
)
block = block.replace(
    '#setup .legalityToolbar select{padding:9px 10px;',
    '#setup .legalityToolbar select{width:100%;padding:9px 10px;text-align:center;text-align-last:center;'
)
block = block.replace(
    '#setup .importActions{position:relative;z-index:3;display:grid;grid-template-columns:1fr 1fr;gap:11px}',
    '#setup .importActions{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-inline:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'
)
block = block.replace(
    '#setup .verifyImportCard,#setup .verifyVaultRow{display:grid;align-items:center;text-align:left;',
    '#setup .verifyImportCard,#setup .verifyVaultRow{display:grid;align-items:center;text-align:center;'
)
block = block.replace(
    '#setup .verifyImportCard{grid-template-columns:54px minmax(0,1fr);gap:12px;min-height:88px;padding:14px;border-radius:11px}',
    '#setup .verifyImportCard{grid-template-columns:54px minmax(0,1fr) 54px;gap:12px;min-height:88px;padding:14px;border-radius:11px}#setup .verifyImportCard:after{content:"";width:54px;height:1px}'
)
block = block.replace(
    '#setup .verifyActionIcon{display:grid;place-items:center;width:48px;height:48px;',
    '#setup .verifyActionIcon{display:grid;place-items:center;justify-self:center;width:48px;height:48px;'
)
block = block.replace(
    '#setup .verifyVaultRow{position:relative;z-index:3;',
    '#setup .verifyVaultRow{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-left:auto;margin-right:auto;'
)
block = block.replace(
    '#setup .physicalDeckNote{position:relative;z-index:3;',
    '#setup .physicalDeckNote{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-left:auto;margin-right:auto;text-align:center;'
)
block = block.replace(
    '#setup .verifyDeckCta{position:relative;z-index:3;',
    '#setup .verifyDeckCta{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-left:auto;margin-right:auto;'
)
block = block.replace(
    '#setup .verifyDeckCta>span:last-child{',
    '#setup .verifyDeckCta>span:last-child{justify-self:center;text-align:center;'
)
block = block.replace(
    '#setup .verifyPrivacy{position:relative;z-index:3;',
    '#setup .verifyPrivacy{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-left:auto;margin-right:auto;text-align:center;justify-content:center;'
)
block = block.replace(
    '#setup #vr{position:relative;z-index:3;',
    '#setup #vr{position:relative;z-index:3;width:min(100%,var(--verify-content-width));margin-left:auto;margin-right:auto;'
)

# Tight optical centering and consistent typography rhythm.
block = block.replace('left:50%;top:-92px;transform:translateX(-50%);', 'left:50%;top:-92px;transform:translateX(-50.5%);')
block = block.replace('margin:10px 0 14px;', 'margin:10px auto 14px;text-align:center;')
block = block.replace('margin:0 auto 33px;max-width:555px;', 'margin:0 auto 33px;max-width:555px;text-align:center;')
block = block.replace('right:18px;bottom:14px;', 'right:18px;bottom:14px;text-align:right;')

# Mobile geometry: one centerline, equal gutters, stacked controls with centered copy.
if '@media(max-width:620px)' in block:
    block = block.replace(
        '@media(max-width:620px){',
        '@media(max-width:620px){#setup .verifyShell{--verify-content-width:100%;padding-left:clamp(18px,5vw,24px);padding-right:clamp(18px,5vw,24px)}#setup .legalityToolbar{grid-template-columns:1fr;text-align:center}#setup .importActions{grid-template-columns:1fr}#setup .verifyImportCard{grid-template-columns:52px minmax(0,1fr) 52px}#setup .verifyImportCard:after{width:52px}#setup .verifyPrivacy{flex-wrap:wrap;row-gap:5px}'
    )
else:
    block += '\n@media(max-width:620px){#setup .verifyShell{--verify-content-width:100%;padding-left:clamp(18px,5vw,24px);padding-right:clamp(18px,5vw,24px)}#setup .legalityToolbar{grid-template-columns:1fr;text-align:center}#setup .importActions{grid-template-columns:1fr}#setup .verifyImportCard{grid-template-columns:52px minmax(0,1fr) 52px}#setup .verifyImportCard:after{width:52px}#setup .verifyPrivacy{flex-wrap:wrap;row-gap:5px}}\n'

# Ownership/stacking guardrails.
if block.count(START) != 1:
    raise SystemExit('canonical marker count changed')
if '!important' in block:
    raise SystemExit('precision pass introduced or retained !important inside Verify owner')
for old in ['#setup>.card{','#setup>.card:before{','#setup>.card::after{']:
    if old in block:
        raise SystemExit(f'obsolete Verify owner still present: {old}')
for required in ['--verify-content-width:620px','width:min(100%,var(--verify-content-width))','grid-template-columns:repeat(2,minmax(0,1fr))','text-align-last:center']:
    if required not in block:
        raise SystemExit(f'precision calibration missing: {required}')

CSS.write_text(css[:start] + block + css[end:])
print('Verify precision alignment calibration applied to canonical owner.')
