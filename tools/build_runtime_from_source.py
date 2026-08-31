#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json
from pathlib import Path

def sha256(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def rebuild(report_path:str)->dict:
 report=json.loads(Path(report_path).read_text(encoding='utf-8'))
 parts=sorted(report['parts'],key=lambda x:x['order'])
 payload=b''.join(Path(p['path']).read_bytes() for p in parts)
 target=Path(report['source'])
 target.parent.mkdir(parents=True,exist_ok=True)
 target.write_bytes(payload)
 return {'target':str(target),'bytes':len(payload),'sha256':sha256(payload),'parts':len(parts)}

def main():
 results=[rebuild('controller-source-report.json'),rebuild('styles-source-report.json')]
 Path('runtime-build-report.json').write_text(json.dumps({'operation':'deterministic-source-rebuild','outputs':results},indent=2)+'\n',encoding='utf-8')
 print(json.dumps(results,indent=2))
if __name__=='__main__':main()
