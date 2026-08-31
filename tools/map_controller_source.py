#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
SOURCE=Path('scripts/inline-101.js'); OUT=Path('controller-ownership-map.json')
FEATURE_TERMS={
 'auth-profile':['auth','profile','avatar','account','identity','friend'],
 'verification-decks':['verify','verification','deck','commander','library','vault'],
 'multiplayer-sync':['presence','peer','sync','room','lobby','host','invite'],
 'battlefield':['battle','battlefield','life','counter','priority','turn','combat','permanent'],
 'display':['display','sharedDisplay','spectator','screen'],
 'recovery':['recovery','checkpoint','resume','restore'],
 'audio':['audio','music','sound','spatial','announcer']}
FUNC_RE=re.compile(r'(?m)^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(')
CONST_FN_RE=re.compile(r'(?m)^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^\n]*?\)|[A-Za-z_$][\w$]*)\s*=>')
def line_of(text,pos): return text.count('\n',0,pos)+1
def scores(name,snippet):
 hay=(name+' '+snippet).lower(); out={}
 for feature,terms in FEATURE_TERMS.items():
  score=sum(hay.count(term.lower()) for term in terms)
  if score: out[feature]=score
 return dict(sorted(out.items(),key=lambda kv:(-kv[1],kv[0])))
def main():
 text=SOURCE.read_text(encoding='utf-8'); defs=[]; seen=set()
 for rx,kind in ((FUNC_RE,'function'),(CONST_FN_RE,'arrow')):
  for m in rx.finditer(text):
   key=(m.start(),m.group(1))
   if key in seen: continue
   seen.add(key); start=m.start(); sc=scores(m.group(1),text[start:start+1600])
   defs.append({'name':m.group(1),'kind':kind,'line':line_of(text,start),'byte_offset':len(text[:start].encode('utf-8')),'feature_scores':sc,'primary_feature':next(iter(sc),'core-other')})
 defs.sort(key=lambda x:x['byte_offset'])
 buckets={name:[] for name in [*FEATURE_TERMS,'core-other']}
 for item in defs: buckets[item['primary_feature']].append(item['name'])
 OUT.write_text(json.dumps({'source':str(SOURCE),'functions_found':len(defs),'feature_terms':FEATURE_TERMS,'feature_functions':buckets,'definitions':defs},indent=2)+'\n',encoding='utf-8')
 print(f'Mapped {len(defs)} controller definitions.')
if __name__=='__main__': main()
