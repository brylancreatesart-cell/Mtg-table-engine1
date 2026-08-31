#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,shutil
from pathlib import Path
SOURCE=Path('styles/inline-01.css'); OUT_DIR=Path('styles/app-src'); REPORT=Path('styles-source-report.json'); MAX_PART_BYTES=70000
def sha256(data): return hashlib.sha256(data).hexdigest()
def split_at_newlines(data,max_bytes):
 parts=[]; start=0; total=len(data)
 while start<total:
  target=min(start+max_bytes,total)
  if target<total:
   cut=data.rfind(b'\n',start,target+1)
   if cut<=start:
    cut=data.find(b'\n',target)
    cut=total if cut==-1 else cut+1
   else: cut+=1
  else: cut=total
  parts.append(data[start:cut]); start=cut
 return parts
def main():
 if not SOURCE.exists(): raise SystemExit(f'Missing {SOURCE}')
 original=SOURCE.read_bytes()
 if len(original)<100000: raise SystemExit(f'Safety stop: stylesheet unexpectedly small ({len(original)} bytes)')
 parts=split_at_newlines(original,MAX_PART_BYTES)
 if len(parts)<2: raise SystemExit('Safety stop: stylesheet did not split')
 if OUT_DIR.exists(): shutil.rmtree(OUT_DIR)
 OUT_DIR.mkdir(parents=True)
 entries=[]
 for i,payload in enumerate(parts,1):
  path=OUT_DIR/f'styles-part-{i:02d}.part.css'; path.write_bytes(payload)
  entries.append({'order':i,'path':str(path),'bytes':len(payload),'sha256':sha256(payload)})
 rebuilt=b''.join(Path(x['path']).read_bytes() for x in entries)
 if rebuilt!=original: raise SystemExit('Safety stop: byte-for-byte stylesheet reconstruction failed')
 REPORT.write_text(json.dumps({'operation':'byte-exact-stylesheet-source-fragmentation','runtime_file_changed':False,'source':str(SOURCE),'source_bytes':len(original),'source_sha256':sha256(original),'max_part_bytes':MAX_PART_BYTES,'parts':entries,'reconstructed_bytes':len(rebuilt),'reconstructed_sha256':sha256(rebuilt),'byte_exact':True,'note':'Source fragments rebuild the existing stylesheet exactly; browser continues loading styles/inline-01.css.'},indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'parts':len(entries),'bytes':len(original),'byte_exact':True},indent=2))
if __name__=='__main__': main()
