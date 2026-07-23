#!/usr/bin/env python3
"""Curated restoration of iconic elite teams/riders missing from Tour finishers.

This script never replaces source records. It adds historically important riders and
teams whose Tour record is absent because of non-selection, withdrawal, DNS/DNF or
classification removal. Every addition is tagged `curatedHistoricalRoster`.
"""
from __future__ import annotations
import json, re, unicodedata, hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'historical-data'

TEMPLATES={
 'gc':dict(flat=84,sprint=66,mountain=95,hills=91,cobbles=63,tt=91,ttt=89,stamina=96,recovery=96,acceleration=86,positioning=90,downhill=86),
 'climber':dict(flat=71,sprint=53,mountain=96,hills=92,cobbles=49,tt=76,ttt=74,stamina=94,recovery=94,acceleration=87,positioning=82,downhill=84),
 'puncheur':dict(flat=84,sprint=80,mountain=80,hills=96,cobbles=82,tt=80,ttt=81,stamina=91,recovery=89,acceleration=94,positioning=90,downhill=88),
 'sprinter':dict(flat=93,sprint=98,mountain=43,hills=67,cobbles=78,tt=68,ttt=76,stamina=82,recovery=79,acceleration=99,positioning=96,downhill=82),
 'classics':dict(flat=94,sprint=84,mountain=59,hills=87,cobbles=97,tt=80,ttt=86,stamina=93,recovery=88,acceleration=90,positioning=97,downhill=90),
 'tt':dict(flat=96,sprint=62,mountain=73,hills=80,cobbles=75,tt=98,ttt=97,stamina=93,recovery=90,acceleration=74,positioning=91,downhill=86),
 'rouleur':dict(flat=93,sprint=73,mountain=60,hills=74,cobbles=85,tt=90,ttt=94,stamina=92,recovery=87,acceleration=78,positioning=93,downhill=87),
 'allrounder':dict(flat=86,sprint=75,mountain=82,hills=86,cobbles=77,tt=84,ttt=86,stamina=91,recovery=90,acceleration=84,positioning=89,downhill=88),
 'domestique':dict(flat=82,sprint=63,mountain=76,hills=79,cobbles=72,tt=77,ttt=85,stamina=90,recovery=89,acceleration=72,positioning=89,downhill=85),
}
ROLE_LABEL={'gc':'Líder GC','climber':'Escalador','puncheur':'Puncheur','sprinter':'Sprinter','classics':'Clasicómano','tt':'Especialista CRI','rouleur':'Rodador','allrounder':'Todoterreno','domestique':'Gregario'}
NATIONS={
 'Lance Armstrong':'United States','Alberto Contador':'Spain','Alejandro Valverde':'Spain','Jan Ullrich':'Germany','Ivan Basso':'Italy',
 'Michael Rasmussen':'Denmark','Marco Pantani':'Italy','Richard Virenque':'France','Alex Zülle':'Switzerland','Laurent Jalabert':'France',
 'Abraham Olano':'Spain','Roberto Heras':'Spain','Fernando Escartín':'Spain','Santiago Botero':'Colombia','Óscar Sevilla':'Spain',
 'Joseba Beloki':'Spain','Carlos Sastre':'Spain','Igor González de Galdeano':'Spain','Alexandre Vinokourov':'Kazakhstan',
 'Andreas Klöden':'Germany','Levi Leipheimer':'United States','Riccardo Riccò':'Italy','Leonardo Piepoli':'Italy',
 'Juan José Cobo':'Spain','David Millar':'Great Britain','Bradley Wiggins':'Great Britain','Sylvain Chavanel':'France'
}
VISUALS={
 'BANESTO':('#f4f4f4','#123b7a','#e7342f','BAN','diagonal'),'ONCE':('#ffd200','#111111','#f4f4f4','ONCE','center'),
 'KELME':('#1f9d55','#ffffff','#1d3f75','KEL','center'),'FESTINA':('#173f8a','#e5232e','#ffffff','FES','bands'),
 'TVM':('#ffe600','#1c1c1c','#ffffff','TVM','center'),'VITALICIO':('#f2c900','#173e8c','#ffffff','VIT','bands'),
 'ASTANA':('#22b8cf','#f4d03f','#ffffff','AST','bands'),'COFIDIS':('#d71920','#ffffff','#f2c230','COF','bands'),
 'UNIBET':('#1e9e4a','#ffffff','#111111','UNI','center'),'SAUNIER':('#f4df00','#222222','#ffffff','SDV','diagonal'),
 'POSTAL':('#164a9c','#d71920','#ffffff','USP','bands'),'DISCOVERY':('#111111','#2b6db6','#ffffff','DSC','center'),
 'MERCATONE':('#ffd200','#1553a4','#ffffff','MER','diagonal'),'RABOBANK':('#f5a400','#1f4ea3','#ffffff','RAB','bands'),
 'TELEKOM':('#e20074','#ffffff','#1d1d1d','TMO','center'),'T-MOBILE':('#e20074','#ffffff','#1d1d1d','TMO','center'),
 'CAISSE':('#c91c2b','#142b55','#ffffff','CDE','diagonal'),'ILLES':('#c91c2b','#142b55','#ffffff','CDE','diagonal'),
 'LIBERTY':('#f4c400','#1b1b1b','#ffffff','LIB','center'),'SAXO':('#174a92','#ffffff','#e3212b','SAX','diagonal')
}

def norm(s):
 s=unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().upper()
 return re.sub(r'\s+',' ',re.sub(r'[^A-Z0-9]+',' ',s)).strip()
def slug(s): return re.sub(r'(^-|-$)','',re.sub(r'[^a-z0-9]+','-',norm(s).lower()))
def h(s): return int(hashlib.sha1(str(s).encode()).hexdigest()[:12],16)
def clamp(v,lo=35,hi=99): return max(lo,min(hi,int(round(v))))

def base_from_stats(role,st):
 weights={
  'gc':{'mountain':.22,'hills':.12,'tt':.16,'stamina':.20,'recovery':.18,'positioning':.07,'downhill':.05},
  'climber':{'mountain':.34,'hills':.16,'stamina':.21,'recovery':.18,'acceleration':.07,'downhill':.04},
  'sprinter':{'sprint':.34,'acceleration':.22,'flat':.15,'positioning':.17,'stamina':.08,'cobbles':.04},
  'classics':{'cobbles':.30,'flat':.19,'hills':.15,'stamina':.16,'positioning':.14,'acceleration':.06},
  'tt':{'tt':.34,'flat':.22,'ttt':.15,'stamina':.15,'positioning':.08,'recovery':.06},
  'rouleur':{'flat':.28,'tt':.20,'ttt':.18,'stamina':.17,'positioning':.11,'cobbles':.06},
  'puncheur':{'hills':.30,'acceleration':.19,'stamina':.16,'sprint':.12,'positioning':.11,'mountain':.07,'recovery':.05},
  'allrounder':{'flat':.14,'mountain':.16,'hills':.16,'tt':.14,'stamina':.18,'recovery':.13,'positioning':.09},
  'domestique':{'stamina':.24,'recovery':.19,'ttt':.17,'flat':.15,'positioning':.15,'hills':.10}
 }[role]
 return clamp(sum(st[k]*v for k,v in weights.items()),55,97)

def stats_for(name,role,quality=0):
 seed=h(name)
 st={}
 for i,(k,v) in enumerate(TEMPLATES[role].items()):
  st[k]=clamp(v+quality+(((seed>>(i%10))%5)-2)*.45)
 st['timeTrial']=st['tt'];st['teamTimeTrial']=st['ttt']
 return st

def visual(name):
 n=norm(name)
 for token,v in VISUALS.items():
  if token in n:
   p,s,a,l,pat=v;return {'primary':p,'secondary':s,'accent':a,'logoText':l,'pattern':pat}
 hue=h(name)%360
 return {'primary':f'hsl({hue} 70% 37%)','secondary':f'hsl({(hue+70)%360} 75% 52%)','accent':f'hsl({(hue+180)%360} 80% 58%)','logoText':''.join(x[0] for x in norm(name).split()[:4]),'pattern':['diagonal','center','bands','chevron'][hue%4]}

def find_team(pack,matcher):
 m=norm(matcher)
 for t in pack['teams']:
  if m in norm(t['name']) or norm(t['name']) in m:return t
 return None

def ensure_team(pack,name,country='International'):
 t=find_team(pack,name)
 if t:return t
 year=pack['season'];tid=f'y{year}__{slug(name)}'
 t={'id':tid,'name':name,'displayName':name,'season':year,'level':'WT-HIST','country':country,
    'archetype':f'Máxima categoría histórica {year}','color':'historical','visual':visual(name),
    'material':{'frame':'canyon','wheels':'shimano'},'ai':{'gc':82,'sprint':75,'classics':76,'breakaway':80,'control':80},
    'riderCount':0,'minimumSelectableRoster':8,'lineage':slug(name),
    'source':{'provider':'curated elite-team restoration','status':'historically important roster restoration'}}
 pack['teams'].append(t);return t

def add_rider(pack,team,name,role,quality=0,age=28):
 nn=norm(name)
 for r in pack['riders']:
  if r['teamId']==team['id'] and norm(r['name'])==nn:
   # Upgrade curated stars that were present only as lower-rated archive records.
   st=stats_for(name,role,quality)
   r.update({'roleKey':role,'role':ROLE_LABEL[role],'stats':st,'base':base_from_stats(role,st),'form':base_from_stats(role,st),'curatedHistoricalRoster':True,'curatedQuality':quality})
   r['source']=dict(r.get('source') or {},ratingSource='curated iconic profile')
   return r
 seed=h(f'{name}-{pack["season"]}')
 st=stats_for(name,role,quality);base=base_from_stats(role,st)
 ranges={'gc':(60,70),'climber':(55,65),'puncheur':(62,73),'sprinter':(72,85),'classics':(72,83),'tt':(70,83),'rouleur':(70,83),'allrounder':(64,76),'domestique':(64,79)}
 lo,hi=ranges[role];kg=round(lo+(seed%int((hi-lo)*10+1))/10,1)
 rid=f'{team["id"]}__{slug(name)}'
 r={'id':rid,'historicalId':rid,'name':name,'nationality':NATIONS.get(name,'International'),'age':age,
    'heightM':round(1.68+(seed%180)/1000,2),'weightKg':kg,'teamId':team['id'],'season':pack['season'],
    'roleKey':role,'role':ROLE_LABEL[role],'base':base,'defaultOrder':'hold','defaultEffort':65,'stats':st,
    'form':base,'morale':80,'fatigue':0,'energy':100,'totalTime':0,'points':0,'mountainPoints':0,'uciPoints':0,
    'stageWins':0,'seasonStageWins':0,'raceDays':0,'abandoned':False,'curatedHistoricalRoster':True,'curatedQuality':quality,
    'source':{'provider':'curated historical roster','ratingSource':'curated iconic profile'}}
 pack['riders'].append(r);return r

# Missing teams due to withdrawals/non-invitation, with principal riders.
TEAMS={
 1998:{
  'BANESTO': [('Abraham Olano','gc',1),('José María Jiménez','climber',1),('Francisco Mancebo','gc',-2),('Vicente García Acosta','rouleur',-2),('José Luis Arrieta','domestique',-1),('Orlando Rodrigues','climber',-2),('Aitor Osa','allrounder',-2),('Marino Alonso','domestique',-2)],
  'ONCE': [('Laurent Jalabert','puncheur',1),('Melchor Mauri','tt',0),('Carlos Sastre','gc',-2),('David Etxebarria','puncheur',-1),('Marcos Serrano','climber',-2),('Herminio Díaz Zabala','rouleur',-2),('Neil Stephens','rouleur',-1),('Santos González','tt',-2)],
  'KELME - COSTA BLANCA': [('Roberto Heras','gc',0),('Fernando Escartín','climber',1),('Santiago Botero','tt',-1),('Óscar Sevilla','gc',-2),('José Luis Rubiera','climber',-1),('José Enrique Gutiérrez','rouleur',-2),('Ignacio García Camacho','domestique',-2),('Félix García Casas','climber',-2)],
  'FESTINA LOTUS': [('Richard Virenque','climber',1),('Alex Zülle','gc',1),('Laurent Dufaux','gc',0),('Christophe Moreau','gc',-1),('Pascal Hervé','climber',-1),('Laurent Brochard','puncheur',0),('Didier Rous','allrounder',-1),('Armin Meier','rouleur',-2)],
  'TVM - FARM FRITES': [('Jeroen Blijlevens','sprinter',0),('Steven de Jongh','classics',-1),('Servais Knaven','classics',0),('Bart Voskamp','tt',-1),('Tristan Hoffman','classics',-1),('Maarten den Bakker','allrounder',-1),('Hendrik Van Dyck','sprinter',-2),('Michel Lafis','domestique',-2)],
 },
 2006:{
  'ASTANA - WÜRTH': [('Alexandre Vinokourov','gc',1),('Alberto Contador','gc',0),('Andrey Kashechkin','gc',-1),('Luis León Sánchez','allrounder',-1),('Sérgio Paulinho','tt',-1),('Allan Davis','sprinter',-1),('Michele Scarponi','climber',-1),('Jörg Jaksche','allrounder',-1)]
 },
 2007:{
  'ASTANA': [('Alexandre Vinokourov','gc',1),('Andreas Klöden','gc',1),('Andrey Kashechkin','gc',0),('Paolo Savoldelli','gc',0),('Maxim Iglinskiy','classics',-1),('Serguei Ivanov','puncheur',-1),('Antonio Colom','climber',-1),('Daniel Navarro','climber',-2)],
  'COFIDIS, LE CRÉDIT PAR TÉLÉPHONE': [('David Moncoutié','climber',0),('Sylvain Chavanel','allrounder',0),('Bradley Wiggins','tt',0),('Nick Nuyens','classics',0),('Rik Verbrugghe','tt',-1),('Stéphane Augé','allrounder',-1),('Cristian Moreni','puncheur',-1),('Staf Scheirlinckx','classics',-1)],
  'UNIBET.COM': [('Juan Antonio Flecha','classics',0),('Baden Cooke','sprinter',0),('Gustav Erik Larsson','tt',0),('Jimmy Casper','sprinter',-1),('Matthew Wilson','allrounder',-1),('Luis Pasamontes','climber',-1),('Rigoberto Urán','climber',-1),('José Rujano','climber',0)]
 },
 2008:{
  'ASTANA': [('Alberto Contador','gc',2),('Levi Leipheimer','gc',1),('Andreas Klöden','gc',1),('Janez Brajkovič','gc',-1),('Chris Horner','allrounder',0),('Sérgio Paulinho','tt',-1),('José Luis Rubiera','climber',-1),('Maxim Iglinskiy','classics',-1)],
  'SAUNIER DUVAL - SCOTT': [('Riccardo Riccò','climber',1),('Leonardo Piepoli','climber',1),('Juan José Cobo','gc',0),('David de la Fuente','climber',-1),('Rubens Bertogliati','tt',-1),('Josep Jufré','climber',-1),('Jesús del Nero','allrounder',-1),('Luciano Pagliarini','sprinter',-1)]
 }
}

# Stars absent from official final classifications / source extract.
STARS=[]
for y in range(1999,2005): STARS.append((y,'US POSTAL','Lance Armstrong','gc',2))
STARS += [
 (2005,'DISCOVERY','Lance Armstrong','gc',2),(2002,'TELEKOM','Jan Ullrich','gc',2),(2005,'ILLES','Alejandro Valverde','puncheur',1),
 (2006,'T-MOBILE','Jan Ullrich','gc',2),(2006,'TEAM CSC','Ivan Basso','gc',2),(2007,'RABOBANK','Michael Rasmussen','climber',2),
 (2010,'ASTANA','Alberto Contador','gc',2),(2011,'SAXO BANK','Alberto Contador','gc',2),
 (1999,'MERCATONE','Marco Pantani','climber',2),(2001,'MERCATONE','Marco Pantani','climber',2),(2002,'MERCATONE','Marco Pantani','climber',2),(2003,'MERCATONE','Marco Pantani','climber',2)
]

# team matcher aliases for existing records
COUNTRIES={'BANESTO':'Spain','ONCE':'Spain','KELME - COSTA BLANCA':'Spain','FESTINA LOTUS':'France','TVM - FARM FRITES':'Netherlands',
'ASTANA - WÜRTH':'Kazakhstan','ASTANA':'Kazakhstan','COFIDIS, LE CRÉDIT PAR TÉLÉPHONE':'France','UNIBET.COM':'Sweden','SAUNIER DUVAL - SCOTT':'Spain'}

summary={'teamsAdded':0,'ridersAdded':0,'starsUpgraded':0,'baseRecomputed':0,'details':[]}
for year in range(1990,2026):
 p=DATA/f'{year}.json';pack=json.loads(p.read_text())
 before_t=len(pack['teams']);before_r=len(pack['riders'])
 # Recompute meaningful overall base according to specialty.
 for r in pack['riders']:
  role=r.get('roleKey','domestique')
  if role not in TEMPLATES: role='domestique'
  st=r.get('stats') or {}
  if all(k in st for k in TEMPLATES[role]):
   b=base_from_stats(role,st);r['base']=b;r['form']=b;summary['baseRecomputed']+=1
 for team_name,roster in TEAMS.get(year,{}).items():
  t=ensure_team(pack,team_name,COUNTRIES.get(team_name,'International'))
  for name,role,q in roster:add_rider(pack,t,name,role,q)
 for y,matcher,name,role,q in STARS:
  if y!=year:continue
  t=find_team(pack,matcher)
  if t:add_rider(pack,t,name,role,q)
 # Update team counts and completeness.
 for t in pack['teams']:
  t['riderCount']=sum(1 for r in pack['riders'] if r['teamId']==t['id'])
  t['minimumSelectableRoster']=min(8,t['riderCount'])
 pack['teams'].sort(key=lambda t:norm(t['name']))
 pack['riders'].sort(key=lambda r:(norm(next((t['name'] for t in pack['teams'] if t['id']==r['teamId']),'')),-r['base'],norm(r['name'])))
 pack.setdefault('completeness',{})['teamCount']=len(pack['teams']);pack['completeness']['riderCount']=len(pack['riders'])
 pack['completeness']['curatedRestoration']=True
 p.write_text(json.dumps(pack,ensure_ascii=False,indent=2))
 summary['teamsAdded']+=len(pack['teams'])-before_t;summary['ridersAdded']+=len(pack['riders'])-before_r
 if len(pack['teams'])!=before_t or len(pack['riders'])!=before_r:summary['details'].append({'year':year,'teams':len(pack['teams']),'riders':len(pack['riders'])})

# Update manifest counts.
mp=DATA/'manifest.json';m=json.loads(mp.read_text())
for e in m['years']:
 pack=json.loads((DATA/f"{e['year']}.json").read_text());e['teamCount']=len(pack['teams']);e['riderCount']=len(pack['riders'])
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2))
(ROOT/'historical-manifest.js').write_text('const HISTORICAL_MANIFEST_V025 = '+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'historical-data/archive-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False,indent=2))
