#!/usr/bin/env python3
"""Rebalance 1990-2025 rider ratings to a realistic 35-99 distribution."""
from __future__ import annotations
import json,re,unicodedata,hashlib,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'historical-data'
spec=importlib.util.spec_from_file_location('archive_builder',ROOT/'tools/build_wt_archive.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
PROFILE_SETS=mod.PROFILE_SETS

def norm(s):
 s=unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().upper()
 return re.sub(r'\s+',' ',re.sub(r'[^A-Z0-9]+',' ',s)).strip()
def role_profile(name):
 n=norm(name)
 for role,names in PROFILE_SETS.items():
  if n in names:return role
 return None
def h(s): return int(hashlib.sha1(str(s).encode()).hexdigest()[:12],16)
def clamp(v,lo=35,hi=99): return max(lo,min(hi,int(round(v))))

BASE={
 'gc':dict(flat=80,sprint=60,mountain=88,hills=86,cobbles=58,tt=84,ttt=82,stamina=90,recovery=89,acceleration=80,positioning=85,downhill=82),
 'climber':dict(flat=68,sprint=50,mountain=90,hills=87,cobbles=45,tt=70,ttt=70,stamina=88,recovery=89,acceleration=82,positioning=78,downhill=80),
 'puncheur':dict(flat=80,sprint=76,mountain=75,hills=89,cobbles=77,tt=75,ttt=78,stamina=85,recovery=84,acceleration=88,positioning=85,downhill=84),
 'sprinter':dict(flat=87,sprint=91,mountain=42,hills=61,cobbles=73,tt=62,ttt=70,stamina=76,recovery=74,acceleration=94,positioning=91,downhill=76),
 'classics':dict(flat=89,sprint=78,mountain=55,hills=80,cobbles=91,tt=74,ttt=80,stamina=87,recovery=83,acceleration=84,positioning=92,downhill=85),
 'tt':dict(flat=91,sprint=58,mountain=68,hills=72,cobbles=69,tt=93,ttt=92,stamina=88,recovery=84,acceleration=66,positioning=86,downhill=81),
 'rouleur':dict(flat=89,sprint=68,mountain=56,hills=68,cobbles=78,tt=85,ttt=88,stamina=87,recovery=82,acceleration=72,positioning=88,downhill=82),
 'allrounder':dict(flat=81,sprint=69,mountain=76,hills=80,cobbles=70,tt=79,ttt=81,stamina=86,recovery=85,acceleration=78,positioning=84,downhill=83),
 'domestique':dict(flat=77,sprint=58,mountain=70,hills=73,cobbles=66,tt=72,ttt=80,stamina=84,recovery=84,acceleration=65,positioning=84,downhill=80)
}
WEIGHTS={
 'gc':{'mountain':.22,'hills':.12,'tt':.16,'stamina':.20,'recovery':.18,'positioning':.07,'downhill':.05},
 'climber':{'mountain':.34,'hills':.16,'stamina':.21,'recovery':.18,'acceleration':.07,'downhill':.04},
 'sprinter':{'sprint':.34,'acceleration':.22,'flat':.15,'positioning':.17,'stamina':.08,'cobbles':.04},
 'classics':{'cobbles':.30,'flat':.19,'hills':.15,'stamina':.16,'positioning':.14,'acceleration':.06},
 'tt':{'tt':.34,'flat':.22,'ttt':.15,'stamina':.15,'positioning':.08,'recovery':.06},
 'rouleur':{'flat':.28,'tt':.20,'ttt':.18,'stamina':.17,'positioning':.11,'cobbles':.06},
 'puncheur':{'hills':.30,'acceleration':.19,'stamina':.16,'sprint':.12,'positioning':.11,'mountain':.07,'recovery':.05},
 'allrounder':{'flat':.14,'mountain':.16,'hills':.16,'tt':.14,'stamina':.18,'recovery':.13,'positioning':.09},
 'domestique':{'stamina':.24,'recovery':.19,'ttt':.17,'flat':.15,'positioning':.15,'hills':.10}
}
ICONIC={norm(x) for x in '''Miguel Indurain Lance Armstrong Jan Ullrich Alberto Contador Chris Froome Tadej Pogacar Jonas Vingegaard Primoz Roglic Remco Evenepoel Marco Pantani Pedro Delgado Greg Lemond Tony Rominger Alex Zulle Bjarne Riis Ivan Basso Cadel Evans Bradley Wiggins Vincenzo Nibali Andy Schleck Richard Virenque Laurent Jalabert Alejandro Valverde Erik Zabel Mario Cipollini Mark Cavendish Peter Sagan Fabian Cancellara Tom Boonen Johan Museeuw Abraham Olano Roberto Heras Joseba Beloki Alexandre Vinokourov Michael Rasmussen Alejandro Valverde Oscar Freire'''.split(' | ')}
# Above split is intentionally broad; supplement exact normalized multiword names.

SPECIFIC_ROLE={norm(k):v for k,v in {
 'Bradley Wiggins':'tt','Abraham Olano':'tt','Melchor Mauri':'tt','Santiago Botero':'tt','Levi Leipheimer':'tt',
 'George Hincapie':'classics','Erik Zabel':'sprinter','Oscar Freire':'sprinter','Alejandro Valverde':'puncheur',
 'Laurent Jalabert':'puncheur','Fabian Cancellara':'classics','Tom Boonen':'classics','Peter Sagan':'classics',
 'Michael Rogers':'tt','Serhiy Honchar':'tt','Chris Boardman':'tt','Tony Martin':'tt','Filippo Ganna':'tt'
}.items()}

ICONIC.update(map(norm,['Miguel Indurain','Lance Armstrong','Jan Ullrich','Alberto Contador','Chris Froome','Tadej Pogacar','Jonas Vingegaard','Primoz Roglic','Remco Evenepoel','Marco Pantani','Pedro Delgado','Greg Lemond','Tony Rominger','Alex Zulle','Bjarne Riis','Ivan Basso','Cadel Evans','Bradley Wiggins','Vincenzo Nibali','Andy Schleck','Richard Virenque','Laurent Jalabert','Alejandro Valverde','Erik Zabel','Mario Cipollini','Mark Cavendish','Peter Sagan','Fabian Cancellara','Tom Boonen','Johan Museeuw','Abraham Olano','Roberto Heras','Joseba Beloki','Alexandre Vinokourov','Michael Rasmussen','Oscar Freire']))

def achievement_boost(r):
 try: best=int(r.get('careerBestTourRank',999))
 except: best=999
 if best<=3:b=5.5
 elif best<=10:b=4.0
 elif best<=20:b=2.5
 elif best<=40:b=1.0
 elif best<=80:b=0
 elif best<=120:b=-1.5
 else:b=0 if r.get('curatedHistoricalRoster') else -3
 try: apps=int(r.get('tourAppearances',1))
 except: apps=1
 b+=min(1.5,max(0,apps-1)*.18)
 if role_profile(r['name']):b+=3.0
 if norm(r['name']) in ICONIC:b+=2.0
 if r.get('curatedHistoricalRoster'):b+=1.5
 return b

def base_score(role,st):return clamp(sum(st[k]*v for k,v in WEIGHTS[role].items()),55,97)

summary={'riders':0,'duplicatesRemoved':0,'byBaseBand':{}}
for year in range(1990,2026):
 p=DATA/f'{year}.json';pack=json.loads(p.read_text())
 # deduplicate team/name after Unicode normalization; keep curated then most informative.
 unique={}
 for r in pack['riders']:
  key=(r['teamId'],norm(r['name']))
  score=(1 if r.get('curatedHistoricalRoster') else 0,0 if r.get('archivalReserve') else 1,int(r.get('tourAppearances',0) or 0))
  if key not in unique or score>unique[key][0]:unique[key]=(score,r)
 summary['duplicatesRemoved']+=len(pack['riders'])-len(unique)
 riders=[v[1] for v in unique.values()]
 for r in riders:
  role=r.get('roleKey','domestique')
  curated_role=SPECIFIC_ROLE.get(norm(r['name'])) or role_profile(r['name'])
  if curated_role: role=curated_role
  if role not in BASE:role='domestique'
  boost=achievement_boost(r);seed=h(f"{r['name']}-{year}-ratings")
  st={}
  for i,(k,v) in enumerate(BASE[role].items()):
   jitter=((seed>>(i%12))%5)-2
   # boost specialization more than weak terrain, retaining physiological shape.
   factor=1.0
   if k in ('mountain','hills') and role in ('gc','climber','puncheur'):factor=1.08
   if k in ('sprint','acceleration') and role=='sprinter':factor=1.08
   if k in ('cobbles','flat','positioning') and role=='classics':factor=1.06
   if k in ('tt','flat','ttt') and role=='tt':factor=1.06
   st[k]=clamp(v+boost*factor+jitter*.65)
  st['timeTrial']=st['tt'];st['teamTimeTrial']=st['ttt']
  b=base_score(role,st)
  r.update({'roleKey':role,'role':mod.ROLE_LABEL[role],'stats':st,'base':b,'form':b})
  summary['riders']+=1;band=f'{(b//5)*5}-{(b//5)*5+4}';summary['byBaseBand'][band]=summary['byBaseBand'].get(band,0)+1
 pack['riders']=riders
 for t in pack['teams']:
  t['riderCount']=sum(1 for r in riders if r['teamId']==t['id']);t['minimumSelectableRoster']=min(8,t['riderCount'])
 pack['completeness']['riderCount']=len(riders)
 p.write_text(json.dumps(pack,ensure_ascii=False,indent=2))
# Update manifests.
m=json.loads((DATA/'manifest.json').read_text())
for e in m['years']:
 pack=json.loads((DATA/f"{e['year']}.json").read_text());e['teamCount']=len(pack['teams']);e['riderCount']=len(pack['riders'])
(DATA/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
(ROOT/'historical-manifest.js').write_text('const HISTORICAL_MANIFEST_V025 = '+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'historical-data/rating-rebalance-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False,indent=2))
