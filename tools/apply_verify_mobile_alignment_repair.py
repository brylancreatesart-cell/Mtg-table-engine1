from pathlib import Path
import re

CSS = Path('styles/app-src/styles-part-01.part.css')
START = '/* Verify Deck reference-fidelity shell — canonical owner */'
END_HINT = '\n/* '
css = CSS.read_text()

# ---- top app header: repair the existing owner directly ----
old_header = 'header{display:flex;justify-content:space-between;align-items:center}'
new_header = 'header{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:14px;row-gap:8px}'
if old_header in css:
    css = css.replace(old_header, new_header, 1)
elif new_header not in css:
    raise SystemExit('top header base owner not found')

old_h1 = 'h1{font-size:18px;margin:0}'
new_h1 = 'h1{font-size:18px;line-height:1.08;margin:0}'
if old_h1 in css:
    css = css.replace(old_h1, new_h1, 1)
elif new_h1 not in css:
    raise SystemExit('h1 base owner not found')

anchor = '.sub{font-size:9px;color:var(--m);letter-spacing:.15em}'
header_cluster = '.sub{font-size:9px;color:var(--m);letter-spacing:.15em}header>div:last-child{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:7px;min-width:0}'
if anchor in css:
    css = css.replace(anchor, header_cluster, 1)
elif 'header>div:last-child{display:flex' not in css:
    raise SystemExit('header subtitle owner not found')

start = css.find(START)
if start < 0:
    raise SystemExit('canonical Verify owner marker not found')
end = css.find(END_HINT, start + len(START))
if end < 0:
    end = len(css)
block = css[start:end]

# ---- divider: exactly line | label | line ----
if '#setup .verifyDivider>span{display:none}' not in block:
    divider_rule_end = block.find('}', block.find('#setup .verifyDivider{'))
    if divider_rule_end < 0:
        raise SystemExit('Verify divider owner not found')
    block = block[:divider_rule_end+1] + '#setup .verifyDivider>span{display:none}' + block[divider_rule_end+1:]

block = re.sub(
    r'(#setup \.verifyDivider\{[^}]*?)grid-template-columns:[^;]+;',
    r'\1grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);',
    block,
    count=1,
)
block = re.sub(
    r'(#setup \.verifyDivider:before,#setup \.verifyDivider:after\{)([^}]*)\}',
    lambda m: m.group(1) + ('width:100%;justify-self:stretch;' if 'width:100%' not in m.group(2) else '') + m.group(2) + '}',
    block,
    count=1,
)

# ---- CTA: the text owns the true centerline ----
cta_match = re.search(r'#setup \.verifyDeckCta\{([^}]*)\}', block)
if not cta_match:
    raise SystemExit('Verify CTA owner not found')
cta_body = cta_match.group(1)
cta_body = re.sub(r'grid-template-columns:[^;]+;', '', cta_body)
cta_body = re.sub(r'gap:[^;]+;', '', cta_body)
for decl in ['display:grid;', 'grid-template-columns:1fr;', 'place-items:center;', 'text-align:center;']:
    if decl not in cta_body:
        cta_body += decl
new_cta = '#setup .verifyDeckCta{' + cta_body + '}'
block = block[:cta_match.start()] + new_cta + block[cta_match.end():]

shield_match = re.search(r'#setup \.verifyShield\{([^}]*)\}', block)
if not shield_match:
    raise SystemExit('Verify shield owner not found')
shield_body = shield_match.group(1)
for prop in ['position', 'left', 'top', 'transform', 'justify-self']:
    shield_body = re.sub(rf'{prop}:[^;]+;', '', shield_body)
shield_body += 'position:absolute;left:clamp(18px,5vw,32px);top:50%;transform:translateY(-50%);justify-self:auto;'
block = block[:shield_match.start()] + '#setup .verifyShield{' + shield_body + '}' + block[shield_match.end():]

# Current branch may or may not have an explicit last-child text rule. Normalize to one canonical rule.
last_re = re.compile(r'#setup \.verifyDeckCta\s*>\s*span:last-child\{([^}]*)\}')
last_match = last_re.search(block)
canonical_last = '#setup .verifyDeckCta>span:last-child{width:100%;max-width:100%;text-align:center;justify-self:center}'
if last_match:
    block = block[:last_match.start()] + canonical_last + block[last_match.end():]
else:
    insert_at = block.find('}', block.find('#setup .verifyDeckCta{')) + 1
    block = block[:insert_at] + canonical_last + block[insert_at:]

# ---- replace the existing mobile variant; do not stack another media block ----
mobile_start = block.find('@media(max-width:620px){')
if mobile_start < 0:
    raise SystemExit('Verify mobile owner not found')
depth = 0
mobile_end = None
for i in range(mobile_start, len(block)):
    if block[i] == '{':
        depth += 1
    elif block[i] == '}':
        depth -= 1
        if depth == 0:
            mobile_end = i + 1
            break
if mobile_end is None:
    raise SystemExit('Verify mobile owner is unterminated')

mobile = '''@media(max-width:620px){
header{grid-template-columns:1fr;align-items:start;gap:10px;padding:2px 6px 4px}
header>div:first-child{min-width:0;text-align:left}
header h1{font-size:clamp(24px,7.2vw,31px);line-height:1.02;letter-spacing:-.025em;white-space:nowrap}
header .sub{font-size:8px;line-height:1.45;letter-spacing:.18em;max-width:100%}
header>div:last-child{width:100%;justify-content:flex-start;gap:6px}
header .chip,header .pill{font-size:8px;padding:6px 9px;white-space:nowrap}
#setup .verifyShell{--verify-content-width:100%;padding-left:clamp(18px,5vw,24px);padding-right:clamp(18px,5vw,24px)}
#setup .verifyHero,#setup .verifyDivider,#setup .verifyDeckPanel,#setup .legalityToolbar,#setup .importActions,#setup .verifyVaultRow,#setup .physicalDeckNote,#setup .verifyDeckCta,#setup .verifyPrivacy,#setup #vr{width:100%;max-width:100%;margin-left:auto;margin-right:auto}
#setup .verifyDivider{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:14px}
#setup .verifyDivider b{text-align:center;justify-self:center;white-space:nowrap}
#setup .verifyDivider:before,#setup .verifyDivider:after{width:100%;justify-self:stretch}
#setup .legalityToolbar{grid-template-columns:1fr;text-align:center}
#setup .importActions{grid-template-columns:1fr}
#setup .verifyImportCard{grid-template-columns:52px minmax(0,1fr) 52px}
#setup .verifyImportCard:after{width:52px}
#setup .verifyDeckCta{grid-template-columns:1fr;place-items:center;text-align:center;padding-left:clamp(76px,20vw,94px);padding-right:clamp(76px,20vw,94px)}
#setup .verifyDeckCta>span:last-child{width:100%;max-width:100%;text-align:center;justify-self:center}
#setup .verifyShield{left:clamp(22px,7vw,34px);top:50%;transform:translateY(-50%)}
#setup .verifyPrivacy{flex-wrap:wrap;row-gap:5px;justify-content:center;text-align:center}
}'''
block = block[:mobile_start] + mobile + block[mobile_end:]

if block.count(START) != 1:
    raise SystemExit('canonical marker count changed')
if '!important' in block:
    raise SystemExit('targeted repair introduced or retained !important in Verify owner')
for required in [
    '#setup .verifyDivider>span{display:none}',
    'grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)',
    '#setup .verifyDeckCta>span:last-child{width:100%;max-width:100%;text-align:center;justify-self:center}',
    'header h1{font-size:clamp(24px,7.2vw,31px)',
]:
    if required not in block and required not in css:
        raise SystemExit(f'missing targeted repair: {required}')

css = css[:start] + block + css[end:]
CSS.write_text(css)
print('Targeted mobile alignment repair applied: header, dividers, CTA, and shared centerline.')
