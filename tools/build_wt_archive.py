#!/usr/bin/env python3
"""Build bundled 1990-2025 elite historical packs from the Tour de France rider archive.

The input contains Tour finishers by season. The builder keeps every recorded rider,
creates deterministic performance ratings, augments sparse team rosters with real riders
from the same historical team lineage in adjacent seasons, and emits one JSON pack per year.

This is intentionally offline and reproducible. It does not invent rider names.
"""
from __future__ import annotations
import argparse, hashlib, json, math, re, unicodedata
from collections import defaultdict
from pathlib import Path
import pandas as pd

STAT_KEYS = ["flat","sprint","mountain","hills","cobbles","tt","ttt","stamina","recovery","acceleration","positioning","downhill"]

TEMPLATES = {
    "gc":          dict(flat=82,sprint=65,mountain=93,hills=90,cobbles=62,tt=88,ttt=87,stamina=95,recovery=95,acceleration=85,positioning=88,downhill=84),
    "climber":     dict(flat=70,sprint=52,mountain=95,hills=91,cobbles=48,tt=74,ttt=72,stamina=93,recovery=94,acceleration=86,positioning=80,downhill=82),
    "puncheur":    dict(flat=82,sprint=79,mountain=79,hills=95,cobbles=80,tt=78,ttt=79,stamina=89,recovery=87,acceleration=92,positioning=88,downhill=86),
    "sprinter":    dict(flat=91,sprint=96,mountain=43,hills=65,cobbles=76,tt=66,ttt=74,stamina=79,recovery=76,acceleration=97,positioning=94,downhill=79),
    "classics":    dict(flat=92,sprint=82,mountain=58,hills=85,cobbles=96,tt=78,ttt=84,stamina=91,recovery=86,acceleration=88,positioning=95,downhill=88),
    "tt":          dict(flat=94,sprint=61,mountain=72,hills=78,cobbles=73,tt=97,ttt=96,stamina=91,recovery=88,acceleration=72,positioning=89,downhill=84),
    "rouleur":     dict(flat=92,sprint=72,mountain=59,hills=73,cobbles=83,tt=88,ttt=92,stamina=90,recovery=85,acceleration=77,positioning=91,downhill=85),
    "allrounder":  dict(flat=84,sprint=73,mountain=80,hills=84,cobbles=75,tt=82,ttt=84,stamina=89,recovery=88,acceleration=82,positioning=87,downhill=86),
    "domestique":  dict(flat=80,sprint=62,mountain=75,hills=78,cobbles=70,tt=75,ttt=83,stamina=88,recovery=87,acceleration=70,positioning=87,downhill=83),
}

ROLE_LABEL = {
    "gc":"Líder GC", "climber":"Escalador", "puncheur":"Puncheur", "sprinter":"Sprinter",
    "classics":"Clasicómano", "tt":"Especialista CRI", "rouleur":"Rodador", "allrounder":"Todoterreno", "domestique":"Gregario"
}

# Curated profiles only override role, never names or team membership.
PROFILE_GROUPS = {
    "gc": [
        "MIGUEL INDURAIN","LANCE ARMSTRONG","JAN ULLRICH","ALBERTO CONTADOR","CHRIS FROOME","CADEL EVANS","BRADLEY WIGGINS",
        "VINCENZO NIBALI","TADEJ POGACAR","JONAS VINGEGAARD","PRIMOZ ROGLIC","REMCO EVENEPOEL","BERNARD HINAULT",
        "PEDRO DELGADO","GREG LEMOND","TONY ROMINGER","ALEX ZULLE","BJARNE RIIS","IVAN BASSO","CARLOS SASTRE","ANDY SCHLECK",
        "FRANK SCHLECK","NAIRO QUINTANA","RICHARD CARAPAZ","GERAINT THOMAS","TOM DUMOULIN","JOAQUIM RODRIGUEZ","ALEJANDRO VALVERDE",
        "CLAUDIO CHIAPPUCCI","FRANCO CHIOCCIOLI","GIANNI BUGNO","EVGENI BERZIN","PAVEL TONKOV","DENIS MENCHOV","ALEXANDRE VINOKOUROV",
        "ROBERTO HERAS","JOSEBA BELOKI","SAMUEL SANCHEZ","LUIS OCANA","MARCOS PANTANI","MARCO PANTANI","SEPP KUSS","ADAM YATES","SIMON YATES",
        "JUAN AYUSO","JOAO ALMEIDA","ENRIC MAS","ROMAIN BARDET","THIBAUT PINOT","MIGUEL ANGEL LOPEZ","DANIEL MARTINEZ"
    ],
    "climber": [
        "RICHARD VIRENQUE","LUCHO HERRERA","LUIS HERRERA","FEDERICO ECHAVE","PEDRO TORRES","IBAN MAYO","ROBERTO LUCARELLI",
        "JOSE MARIA JIMENEZ","JOSE RUIZ CABESTANY","FERNANDO ESCARTIN","JOSE LUIS ARRIETA","MICKAEL RASMUSSEN","MICHAEL RASMUSSEN",
        "MARIO AERTS","JULIO JIMENEZ","RAFAEL MAJKA","MIKEL LANDA","DOMENICO POZZOVIVO","DANIEL NAVARRO","PIERRE ROLLAND",
        "WARREN BARGUIL","DAVID GAUDU","GIULIO CICCONE","CARLOS RODRIGUEZ","LANDER MARTINEZ","SANTIAGO BUITRAGO","BEN OCONNOR"
    ],
    "sprinter": [
        "MARIO CIPOLLINI","ERIK ZABEL","MARK CAVENDISH","ALESSANDRO PETACCHI","ROBBIE MCEWEN","MARCEL KITTEL","ANDRE GREIPEL",
        "JASPER PHILIPSEN","CALEB EWAN","DYLAN GROENEWEGEN","FERNANDO GAVIRIA","SAM BENNETT","ARNAUD DEMARE","FABIO JAKOBSEN",
        "ELIA VIVIANI","THOR HUSHOVD","TOM STEELS","FREDDY MAERTENS","JAMOLIDINE ABDOUJAPAROV","DJAMOLIDINE ABDOUJAPAROV",
        "JIMMY CASPER","OSCAR FREIRE","PETER SAGAN","ALEXANDER KRISTOFF","OLAV KOOIJ","JONATHAN MILAN","BINIAM GIRMAY"
    ],
    "classics": [
        "JOHAN MUSEEUW","TOM BOONEN","FABIAN CANCELLARA","WOUT VAN AERT","MATHIEU VAN DER POEL","GREG VAN AVERMAET",
        "PHILIPPE GILBERT","ANDREA TAFI","FRANCO BALLERINI","GEORGE HINCAPIE","NIKI TERPSTRA","JOHN DEGENKOLB","MADS PEDERSEN",
        "STIJN DEVOLDER","PETER VAN PETEGEM","SEAN KELLY","MORENO ARGENTIN","MICHELE BARTOLI","PAOLO BETTINI","JASPER STUYVEN",
        "MATTEO TRENTIN","SEP VANMARCKE","OLIVER NAESEN","FLORIAN VERMEERSCH"
    ],
    "tt": [
        "CHRIS BOARDMAN","TONY MARTIN","FILIPPO GANNA","DAVID MILLAR","DAVID MILLAR","ABRAHAM OLANO","MIGUEL INDURAIN",
        "JAN ULLRICH","BRADLEY WIGGINS","TOM DUMOULIN","REMCO EVENEPOEL","FABIAN CANCELLARA","VIATCHESLAV EKIMOV","VYACHESLAV EKIMOV",
        "MELCHOR MAURI","SERHIY HONCHAR","SERGEI GONCHAR","LEV LEIPHEIMER","LEVI LEIPHEIMER","STEFAN KUNG","JOSHUA TARLING"
    ],
    "puncheur": [
        "LAURENT JALABERT","ALEJANDRO VALVERDE","JULIAN ALAPHILIPPE","DANILO DI LUCA","DAVIDE REBELLIN","MICHAEL BOOGERD",
        "ALEXIS VUILLERMOZ","SIMON GERRANS","MICHAEL MATTHEWS","TOM PIDCOCK","THIBAU NYS","MARC HIRSCHI","MAURO GIANETTI"
    ],
    "rouleur": [
        "JENS VOIGT","STUART OGRADY","LUKE ROWE","IAN STANNARD","NILS POLITT","YVES LAMPAERT","TIM DECLERCQ","SILVAN DILLIER",
        "MARCUS BURGHARDT","LASZLO BODROGI","DARIO CIONI","MATTEO TOSATTO","MICHAEL ROGERS","RICHIE PORTE","Rolf Aldag"
    ]
}

NATIONALITY = {
    "MIGUEL INDURAIN":"Spain","PEDRO DELGADO":"Spain","ALBERTO CONTADOR":"Spain","ALEJANDRO VALVERDE":"Spain","ROBERTO HERAS":"Spain",
    "LANCE ARMSTRONG":"United States","GREG LEMOND":"United States","JAN ULLRICH":"Germany","ERIK ZABEL":"Germany","TONY MARTIN":"Germany",
    "TADEJ POGACAR":"Slovenia","PRIMOZ ROGLIC":"Slovenia","JONAS VINGEGAARD":"Denmark","REMCO EVENEPOEL":"Belgium","WOUT VAN AERT":"Belgium",
    "MATHIEU VAN DER POEL":"Netherlands","MARK CAVENDISH":"Great Britain","CHRIS FROOME":"Great Britain","BRADLEY WIGGINS":"Great Britain",
    "MARCO PANTANI":"Italy","VINCENZO NIBALI":"Italy","MARIO CIPOLLINI":"Italy","FILIPPO GANNA":"Italy","LAURENT JALABERT":"France",
    "RICHARD VIRENQUE":"France","THIBAUT PINOT":"France","ROMAIN BARDET":"France","NAIRO QUINTANA":"Colombia","RICHARD CARAPAZ":"Ecuador"
}

TEAM_VISUALS = [
    (("ONCE",), ("#ffd200","#111111","#f4f4f4","ONCE","center")),
    (("BANESTO","IBANESTO"), ("#f4f4f4","#123b7a","#e7342f","BAN","diagonal")),
    (("U.S POSTAL","US POSTAL","DISCOVERY CHANNEL"), ("#164a9c","#d71920","#ffffff","USP","bands")),
    (("CAISSE D","ILLES BALEARS"), ("#c91c2b","#142b55","#ffffff","CDE","diagonal")),
    (("KELME",), ("#1f9d55","#ffffff","#1d3f75","KEL","center")),
    (("ASTANA",), ("#22b8cf","#f4d03f","#ffffff","AST","bands")),
    (("TREK","LEOPARD","RADIOSHACK"), ("#151515","#d62027","#ffffff","TRK","chevron")),
    (("TELEKOM","T-MOBILE","HIGH ROAD","COLUMBIA","HTC"), ("#e20074","#ffffff","#1d1d1d","TMO","center")),
    (("COFIDIS",), ("#d71920","#ffffff","#f2c230","COF","bands")),
    (("SAUNIER DUVAL","FUJI-SERVETTO","GEOX"), ("#f4df00","#222222","#ffffff","SDV","diagonal")),
    (("FESTINA",), ("#173f8a","#e5232e","#ffffff","FES","bands")),
    (("MAPEI",), ("#1d63b7","#ffffff","#e3312d","MAP","diagonal")),
    (("RABOBANK","BELKIN","LOTTO NL","JUMBO","VISMA"), ("#f5c400","#111111","#ffffff","VIS","chevron")),
    (("SKY","INEOS"), ("#111827","#1d9bf0","#ffffff","INE","center")),
    (("CSC","SAXO","TINKOFF"), ("#d71920","#111111","#ffffff","CSC","diagonal")),
    (("QUICK-STEP","QUICK STEP","SOUDAL","OMEGA PHARMA"), ("#195cb5","#ffffff","#e1252f","QST","bands")),
    (("LAMPRE","UAE TEAM"), ("#e84393","#253c80","#ffffff","LAM","diagonal")),
    (("LIQUIGAS","CANNONDALE"), ("#5bbd32","#ffffff","#1b1b1b","LIQ","center")),
    (("BMC",), ("#d71920","#111111","#ffffff","BMC","bands")),
    (("PHONAK",), ("#b5d334","#f4dc23","#1b1b1b","PHO","center")),
    (("GEROLSTEINER",), ("#77bce8","#ffffff","#1b4d8f","GST","bands")),
    (("FASSA BORTOLO",), ("#4f8fd8","#ffffff","#e62e2e","FAS","center")),
    (("EUSKALTEL",), ("#f58220","#ffffff","#1a1a1a","EUS","center")),
    (("MERCATONE UNO",), ("#ffd200","#1553a4","#ffffff","MER","diagonal")),
    (("MOTOROLA",), ("#124e9e","#e52b34","#ffffff","MOT","bands")),
    (("CARRERA",), ("#f6f6f6","#355b8c","#d12b2b","CAR","center")),
    (("FDJ","GROUPAMA"), ("#174b99","#ffffff","#e42b2f","FDJ","bands")),
    (("AG2R","CASINO","DECATHLON"), ("#6a3a2a","#54a8d8","#ffffff","AG2","diagonal")),
    (("LOTTO",), ("#d71920","#ffffff","#111111","LOT","center")),
    (("MOVISTAR",), ("#113f99","#35c5f0","#ffffff","MOV","chevron")),
]

LINEAGE_RULES = [
    (("BANESTO","IBANESTO","ILLES BALEARS","CAISSE D","MOVISTAR"),"abarca"),
    (("ONCE","LIBERTY SEGUROS","ASTANA-WURTH"),"once-liberty"),
    (("U.S POSTAL","US POSTAL","DISCOVERY CHANNEL"),"postal-discovery"),
    (("TELEKOM","T-MOBILE","HIGH ROAD","COLUMBIA","HTC"),"telekom-highroad"),
    (("KELME","COMUNIDAD VALENCIANA"),"kelme"),
    (("SAUNIER DUVAL","FUJI-SERVETTO","GEOX"),"saunier-geox"),
    (("TREK","LEOPARD","RADIOSHACK"),"trek-line"),
    (("RABOBANK","BLANCO","BELKIN","LOTTO NL","LOTTO-JUMBO","JUMBO","VISMA"),"rabobank-visma"),
    (("SKY","INEOS"),"sky-ineos"),
    (("CSC","SAXO","TINKOFF"),"csc-saxo"),
    (("LIQUIGAS","CANNONDALE"),"liquigas-cannondale"),
    (("GARMIN","SLIPSTREAM","CANNONDALE-DRAPAC","EF EDUCATION"),"slipstream-ef"),
    (("AG2R","CASINO","DECATHLON"),"ag2r"),
    (("FDJ","GROUPAMA"),"fdj"),
    (("LAMPRE","UAE TEAM"),"lampre-uae"),
    (("BMC","CCC TEAM"),"bmc-ccc"),
    (("QUICK-STEP","QUICK STEP","OMEGA PHARMA","SOUDAL"),"quickstep"),
    (("ORICA","MITCHELTON","BIKEEXCHANGE","JAYCO"),"greenedge"),
    (("SUNWEB","DSM","PICNIC"),"sunweb-dsm"),
    (("BORA","RED BULL"),"bora"),
    (("ASTANA",),"astana"),
    (("COFIDIS",),"cofidis"),
    (("FESTINA",),"festina"),
    (("MAPEI",),"mapei"),
    (("EUSKALTEL",),"euskaltel"),
    (("MERCATONE UNO",),"mercatone"),
    (("FASSA BORTOLO",),"fassa"),
    (("GEROLSTEINER",),"gerolsteiner"),
    (("PHONAK",),"phonak"),
    (("MOTOROLA",),"motorola"),
    (("CARRERA",),"carrera"),
]

COUNTRY_RULES = [
    (("BANESTO","ONCE","KELME","CAISSE","MOVISTAR","EUSKALTEL","AMAYA","CLAS","SEUR"),"Spain"),
    (("TELEKOM","T-MOBILE","GEROLSTEINER","MILRAM","BORA"),"Germany"),
    (("COFIDIS","FESTINA","CASTORAMA","GAN","CREDIT AGRICOLE","AG2R","FDJ","R.M.O","EUROPCAR","TOTALENERGIES","ARKEA"),"France"),
    (("MAPEI","LAMPRE","LIQUIGAS","SAECO","FASSA","MERCATONE","CARRERA","POLTI","ARIOSA","ARIOTEA"),"Italy"),
    (("RABOBANK","PDM","TVM","PANASONIC","JUMBO","VISMA"),"Netherlands"),
    (("LOTTO","QUICK-STEP","INTERMARCHE","ALPECIN"),"Belgium"),
    (("ASTANA",),"Kazakhstan"),
    (("SKY","INEOS"),"Great Britain"),
    (("CSC","SAXO"),"Denmark"),
    (("U.S POSTAL","US POSTAL","DISCOVERY","BMC","GARMIN","TREK","EF EDUCATION"),"United States"),
    (("ORICA","MITCHELTON","BIKEEXCHANGE","JAYCO"),"Australia"),
    (("UAE",),"United Arab Emirates"),
    (("BAHRAIN",),"Bahrain"),
]

def norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text or "")).encode("ascii","ignore").decode("ascii")
    text = re.sub(r"[^A-Za-z0-9]+"," ",text).strip().upper()
    return re.sub(r"\s+"," ",text)

def slug(text: str) -> str:
    return re.sub(r"(^-|-$)","",re.sub(r"[^a-z0-9]+","-",norm(text).lower()))

def stable_int(text: str) -> int:
    return int(hashlib.sha1(str(text).encode("utf-8")).hexdigest()[:12],16)

def clamp(v, lo=35, hi=99):
    return max(lo,min(hi,int(round(v))))

def profile_lookup(name: str) -> str|None:
    n = norm(name)
    for role,names in PROFILE_GROUPS.items():
        if n in {norm(x) for x in names}:
            return role
    return None

PROFILE_SETS = {k:{norm(x) for x in v} for k,v in PROFILE_GROUPS.items()}
def profile_lookup(name: str) -> str|None:
    n=norm(name)
    for role,s in PROFILE_SETS.items():
        if n in s: return role
    return None

def lineage(team: str) -> str:
    n=norm(team)
    for tokens,key in LINEAGE_RULES:
        if any(norm(t) in n for t in tokens): return key
    # stable fallback based on first meaningful sponsor token
    tokens=[t for t in n.split() if t not in {"TEAM","PRO","CYCLING","SERVICE","CLUB","THE","DE","LA","LE","AND"}]
    return slug(" ".join(tokens[:2]) or n)

def team_country(team: str) -> str:
    n=norm(team)
    for tokens,country in COUNTRY_RULES:
        if any(norm(t) in n for t in tokens): return country
    return "International"

def team_visual(team: str, year: int):
    n=norm(team)
    for tokens,vals in TEAM_VISUALS:
        if any(norm(t) in n for t in tokens):
            p,s,a,logo,pattern=vals
            return dict(primary=p,secondary=s,accent=a,logoText=logo,pattern=pattern)
    h=stable_int(f"{team}-{year}")%360
    return dict(primary=f"hsl({h} 70% 37%)",secondary=f"hsl({(h+70)%360} 75% 52%)",accent=f"hsl({(h+180)%360} 80% 58%)",logoText="".join(w[0] for w in norm(team).split()[:4]),pattern=["diagonal","center","bands","chevron"][stable_int(team)%4])

def infer_role(name: str, rank: int, career_best: int, team_slot: int) -> str:
    curated=profile_lookup(name)
    if curated: return curated
    h=stable_int(name)
    if career_best <= 8: return "gc"
    if career_best <= 20: return "climber" if h%3 else "allrounder"
    if career_best <= 40: return ["allrounder","climber","puncheur","tt"][h%4]
    # create realistic team balance for lower-ranked finishers
    if team_slot==0: return "gc"
    if team_slot==1: return "climber"
    if team_slot==2: return "rouleur"
    if team_slot==3: return "sprinter" if h%2 else "classics"
    return ["domestique","rouleur","classics","puncheur","sprinter","tt"][h%6]

def ratings(name: str, role: str, rank: int, field_size: int, career_best: int, appearances: int, year: int):
    template=TEMPLATES[role]
    percentile=1-(max(1,rank)-1)/max(1,field_size-1)
    career=1-(max(1,career_best)-1)/max(1,field_size-1)
    quality=0.58*career+0.30*percentile+0.12*min(appearances/10,1)
    # quality shift keeps stars elite while preserving the template's shape
    shift=(quality-0.45)*14
    rnd=stable_int(f"{name}-{year}")
    stats={}
    for i,k in enumerate(STAT_KEYS):
        jitter=((rnd>>(i%10))%7)-3
        stats[k]=clamp(template[k]+shift+jitter*0.55)
    # Tour GC rank should especially inform endurance / recovery / mountain, not sprint.
    if rank<=10:
        stats["stamina"]=max(stats["stamina"],91)
        stats["recovery"]=max(stats["recovery"],91)
        stats["mountain"]=max(stats["mountain"],85)
    stats["timeTrial"]=stats["tt"]
    stats["teamTimeTrial"]=stats["ttt"]
    base=clamp(sum(stats[k] for k in ["flat","mountain","hills","tt","stamina","recovery"])/6,55,97)
    return stats,base

def rider_mass(role: str, seed: int):
    ranges={"gc":(60,69),"climber":(54,64),"puncheur":(62,72),"sprinter":(72,84),"classics":(72,82),"tt":(70,82),"rouleur":(70,82),"allrounder":(64,75),"domestique":(64,78)}
    lo,hi=ranges[role]
    return round(lo+(seed%(int((hi-lo)*10)+1))/10,1)

def build(args):
    src=Path(args.input)
    out=Path(args.output)
    out.mkdir(parents=True,exist_ok=True)
    df=pd.read_csv(src)
    df=df[(df["Year"]>=args.start_year)&(df["Year"]<=args.end_year)].copy()
    df["Rider"]=df["Rider"].astype(str).str.strip()
    df["Team"]=df["Team"].astype(str).str.strip()
    df["rank_num"]=pd.to_numeric(df["Rank"],errors="coerce").fillna(999).astype(int)
    df["rider_key"]=df["Rider"].map(norm)
    df["lineage"]=df["Team"].map(lineage)

    career=df.groupby("rider_key").agg(career_best=("rank_num","min"),appearances=("Year","nunique"),first_year=("Year","min"),last_year=("Year","max")).to_dict("index")
    records_by_lineage=defaultdict(list)
    for row in df.to_dict("records"):
        records_by_lineage[row["lineage"]].append(row)

    manifest={"schemaVersion":3,"generatedAt":"2026-07-22","scope":"Men's Tour-level elite / UCI top tier archive","years":[]}
    summary={"requestedTeams":{},"totalTeams":0,"totalRiders":0,"archivalReserves":0}

    requested_patterns=["ONCE","BANESTO","US POSTAL","CAISSE","KELME","ASTANA","TREK","TELEKOM","T-MOBILE","COFIDIS","SAUNIER"]

    for year in range(args.start_year,args.end_year+1):
        ydf=df[df["Year"]==year].copy()
        field_size=max(1,len(ydf))
        teams=[]; riders=[]
        for team_name,tdf in ydf.groupby("Team",sort=True):
            rows=tdf.sort_values("rank_num").to_dict("records")
            seen={r["rider_key"] for r in rows}
            # Add real riders from the same lineage and nearest seasons until the simulator has 8 selectable names.
            candidates=[]
            for r in records_by_lineage[lineage(team_name)]:
                if r["rider_key"] in seen: continue
                distance=abs(int(r["Year"])-year)
                candidates.append((distance,r["rank_num"],r))
            candidates.sort(key=lambda x:(x[0],x[1],x[2]["Rider"]))
            augmented=list(rows)
            for distance,_,r in candidates:
                if len(augmented)>=8: break
                rr=dict(r); rr["archivalReserve"]=True; rr["sourceSeason"]=int(r["Year"]); rr["Team"]=team_name
                augmented.append(rr); seen.add(rr["rider_key"])
            # Extremely sparse one-off squads remain selectable with a smaller roster rather than invented names.
            team_id=f"y{year}__{slug(team_name)}"
            visual=team_visual(team_name,year)
            team_riders=[]
            for slot,row in enumerate(augmented):
                c=career[row["rider_key"]]
                role=infer_role(row["Rider"],int(row["rank_num"]),int(c["career_best"]),slot)
                stats,base=ratings(row["Rider"],role,int(row["rank_num"]),field_size,int(c["career_best"]),int(c["appearances"]),year)
                age=max(20,min(39,22+(year-int(c["first_year"]))))
                seed=stable_int(f"{row['Rider']}-{year}")
                rid=f"{team_id}__{slug(row['Rider'])}"
                rider={
                    "id":rid,"historicalId":rid,"name":" ".join(w.capitalize() for w in row["Rider"].split()),
                    "nationality":NATIONALITY.get(norm(row["Rider"]),"International"),"age":age,
                    "heightM":round(1.68+(seed%180)/1000,2),"weightKg":rider_mass(role,seed),
                    "teamId":team_id,"season":year,"roleKey":role,"role":ROLE_LABEL[role],"base":base,
                    "defaultOrder":"hold","defaultEffort":65,"stats":stats,"form":base,"morale":76,"fatigue":0,"energy":100,
                    "totalTime":0,"points":0,"mountainPoints":0,"uciPoints":0,"stageWins":0,"seasonStageWins":0,"raceDays":0,"abandoned":False,
                    "tourRank":int(row["rank_num"]),"careerBestTourRank":int(c["career_best"]),"tourAppearances":int(c["appearances"]),
                    "source":{"provider":"LeTourDataSet / official Tour historical classifications","url":"https://github.com/thomascamminady/LeTourDataSet","ratingSource":"curated-star-profile + Tour classification model"}
                }
                if row.get("archivalReserve"):
                    rider["archivalReserve"]=True; rider["sourceSeason"]=int(row["sourceSeason"]); summary["archivalReserves"]+=1
                team_riders.append(rider)
            # Compute team AI from roster capabilities.
            def avg(key): return round(sum(r["stats"][key] for r in team_riders)/max(1,len(team_riders)))
            ai={"gc":avg("mountain"),"sprint":avg("sprint"),"classics":round((avg("cobbles")+avg("hills"))/2),"breakaway":round((avg("stamina")+avg("hills"))/2),"control":round((avg("flat")+avg("ttt")+avg("positioning"))/3)}
            team={
                "id":team_id,"name":team_name,"displayName":team_name,"season":year,
                "level":"WT-HIST" if year<2005 else "WT/ELITE","country":team_country(team_name),
                "archetype":f"Máxima categoría histórica {year}","color":"historical","visual":visual,
                "material":{"frame":"canyon","wheels":"shimano"},"ai":ai,"riderCount":len(team_riders),
                "minimumSelectableRoster":min(8,len(team_riders)),"lineage":lineage(team_name),
                "source":{"provider":"Tour de France historical field","url":"https://github.com/thomascamminady/LeTourDataSet","status":"all recorded finishers + real archival reserves from same team lineage"}
            }
            teams.append(team); riders.extend(team_riders)

        completeness={
            "status":"included-tour-elite-archive","teamCount":len(teams),"riderCount":len(riders),
            "coverage":"Every recorded Tour de France finisher in the source for this season; sparse squads augmented only with real riders from the same team lineage.",
            "strictWorldTour": year>=2005,
            "note":"Before 2005 WorldTour did not exist; the pack represents the elite Tour field / historical top-tier equivalent."
        }
        pack={"schemaVersion":3,"season":year,"label":f"Élite histórica {year}","source":{"provider":"LeTourDataSet","url":"https://github.com/thomascamminady/LeTourDataSet","license":"MIT"},"completeness":completeness,"teams":teams,"riders":riders,"calendar":[]}
        (out/f"{year}.json").write_text(json.dumps(pack,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
        manifest["years"].append({"year":year,"status":"included-tour-elite-archive","teamCount":len(teams),"riderCount":len(riders),"file":f"{year}.json"})
        summary["totalTeams"]+=len(teams); summary["totalRiders"]+=len(riders)
        for pat in requested_patterns:
            matches=[t["name"] for t in teams if pat in norm(t["name"])]
            if matches: summary["requestedTeams"].setdefault(pat,[]).append({"year":year,"teams":matches})

    (out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    (out/"archive-summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--input",required=True)
    ap.add_argument("--output",required=True)
    ap.add_argument("--start-year",type=int,default=1990)
    ap.add_argument("--end-year",type=int,default=2025)
    build(ap.parse_args())
