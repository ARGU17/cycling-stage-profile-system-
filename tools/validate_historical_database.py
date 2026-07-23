#!/usr/bin/env python3
import argparse, json, sys
from pathlib import Path

STAT_KEYS=("flat","sprint","mountain","hills","cobbles","tt","ttt","stamina","recovery","acceleration","positioning","downhill")

def validate(path: Path):
    pack=json.loads(path.read_text(encoding='utf-8'))
    errors=[]; warnings=[]
    year=pack.get('season')
    teams=pack.get('teams',[]); riders=pack.get('riders',[])
    tids=[t.get('id') for t in teams]; rids=[r.get('id') for r in riders]
    if len(tids)!=len(set(tids)): errors.append('team IDs duplicated')
    if len(rids)!=len(set(rids)): errors.append('rider IDs duplicated')
    known=set(tids)
    orphans=[r for r in riders if r.get('teamId') not in known]
    if orphans: errors.append(f'{len(orphans)} orphan riders')
    for t in teams:
        count=sum(r.get('teamId')==t.get('id') for r in riders)
        if count<6: warnings.append(f"short roster {t.get('name')}={count}")
        if count>45: warnings.append(f"large roster {t.get('name')}={count}")
    for r in riders:
        if not r.get('name'): errors.append('unnamed rider')
        stats=r.get('stats',{})
        for k in STAT_KEYS:
            v=stats.get(k)
            if not isinstance(v,(int,float)) or not 30<=v<=100:
                errors.append(f"invalid stat {r.get('name')}:{k}={v}")
                break
    print(f"{path.name}: year={year} teams={len(teams)} riders={len(riders)} errors={len(errors)} warnings={len(warnings)}")
    for e in errors[:30]: print('  ERROR',e)
    for w in warnings[:30]: print('  WARN ',w)
    return errors,warnings

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('directory',nargs='?',default='historical-data'); ap.add_argument('--require-complete',action='store_true'); args=ap.parse_args()
    root=Path(args.directory); files=sorted(p for p in root.glob('*.json') if p.name!='manifest.json')
    if not files: print('No packs found',file=sys.stderr); return 2
    failures=0
    for p in files:
        e,w=validate(p); failures += bool(e or (args.require_complete and w))
    return 1 if failures else 0
if __name__=='__main__': raise SystemExit(main())
