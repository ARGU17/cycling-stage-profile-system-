#!/usr/bin/env python3
"""Build season packs for Cycling Manager Tour v0.25 Historical.

The program reads public team/rider pages from ProCyclingStats with a strict
rate limit and local cache. Before using it, review PCS terms and consider
requesting API access from https://www.procyclingstats.com/info/api.

Examples:
  python tools/build_historical_database.py --start-year 1990 --end-year 2026
  python tools/build_historical_database.py --year 1992 --delay 1.5 --resume

No rider names are invented. A pack is marked complete only when validation
finds no duplicate IDs, no orphan riders and plausible roster sizes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import re
import sys
import time
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

PCS = "https://www.procyclingstats.com/"
ROLE_LABELS = {
    "gc":"Líder GC","co":"Co-líder","climber":"Escalador","tt":"Croner",
    "sprinter":"Sprinter","classics":"Clasicómano","rouleur":"Rodador",
    "puncheur":"Puncheur","domestique":"Gregario"
}
ROLE_TEMPLATES = {
    "gc": dict(flat=82,sprint=62,mountain=92,hills=86,cobbles=62,tt=86,ttt=86,stamina=92,recovery=90,acceleration=80,positioning=84,downhill=83),
    "co": dict(flat=80,sprint=61,mountain=88,hills=84,cobbles=63,tt=82,ttt=84,stamina=89,recovery=87,acceleration=78,positioning=82,downhill=82),
    "climber": dict(flat=69,sprint=50,mountain=89,hills=81,cobbles=49,tt=69,ttt=71,stamina=86,recovery=84,acceleration=76,positioning=73,downhill=79),
    "tt": dict(flat=88,sprint=62,mountain=68,hills=73,cobbles=68,tt=91,ttt=91,stamina=86,recovery=80,acceleration=68,positioning=79,downhill=74),
    "sprinter": dict(flat=88,sprint=92,mountain=47,hills=65,cobbles=73,tt=65,ttt=74,stamina=77,recovery=74,acceleration=94,positioning=90,downhill=72),
    "classics": dict(flat=85,sprint=78,mountain=66,hills=86,cobbles=90,tt=74,ttt=79,stamina=85,recovery=80,acceleration=85,positioning=90,downhill=79),
    "rouleur": dict(flat=89,sprint=67,mountain=64,hills=73,cobbles=77,tt=83,ttt=87,stamina=85,recovery=80,acceleration=70,positioning=82,downhill=75),
    "puncheur": dict(flat=79,sprint=76,mountain=78,hills=90,cobbles=71,tt=72,ttt=75,stamina=82,recovery=79,acceleration=90,positioning=83,downhill=78),
    "domestique": dict(flat=78,sprint=59,mountain=76,hills=75,cobbles=65,tt=73,ttt=78,stamina=83,recovery=80,acceleration=69,positioning=79,downhill=76),
}

MAJOR_RACE_SLUGS = {
    "tour-down-under","cadel-evans-great-ocean-road-race","uae-tour","omloop-het-nieuwsblad",
    "strade-bianche","paris-nice","tirreno-adriatico","milano-sanremo","volta-a-catalunya",
    "e3-harelbeke","gent-wevelgem","ronde-van-vlaanderen","itzulia-basque-country",
    "paris-roubaix","amstel-gold-race","la-fleche-wallone","liege-bastogne-liege",
    "tour-de-romandie","eschborn-frankfurt","giro-d-italia","criterium-du-dauphine",
    "tour-de-suisse","tour-de-france","san-sebastian","vuelta-a-espana","gp-quebec",
    "gp-montreal","world-championship","il-lombardia"
}


def slug(value: str) -> str:
    text = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", text)).strip("-")


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def stable_int(value: str) -> int:
    return int(hashlib.sha256(value.encode("utf-8")).hexdigest()[:12], 16)


def generated_visual(name: str, year: int) -> dict:
    seed = stable_int(f"{name}-{year}")
    hue = seed % 360
    hue2 = (hue + 55 + (seed // 360) % 85) % 360
    hue3 = (hue + 175) % 360
    words = re.findall(r"[A-Za-zÀ-ÿ0-9]+", name)
    return {
        "primary": f"hsl({hue} 70% 37%)",
        "secondary": f"hsl({hue2} 76% 52%)",
        "accent": f"hsl({hue3} 82% 58%)",
        "logoText": "".join(w[0] for w in words[:4]).upper() or "TEAM",
        "pattern": ["diagonal", "center", "bands", "chevron"][seed % 4],
    }


@dataclass
class Fetcher:
    cache: Path
    delay: float
    timeout: float = 35.0

    def __post_init__(self) -> None:
        self.cache.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "CyclingManagerHistoricalBuilder/0.25 (+personal research; rate limited)",
            "Accept-Language": "en-US,en;q=0.8",
        })
        self._last_request = 0.0

    def get(self, url: str, refresh: bool = False) -> str:
        key = hashlib.sha256(url.encode()).hexdigest()
        path = self.cache / f"{key}.html"
        if path.exists() and not refresh:
            return path.read_text(encoding="utf-8", errors="replace")
        wait = self.delay - (time.monotonic() - self._last_request)
        if wait > 0:
            time.sleep(wait)
        last_error: Exception | None = None
        for attempt in range(5):
            try:
                response = self.session.get(url, timeout=self.timeout)
                self._last_request = time.monotonic()
                if response.status_code in {429, 503}:
                    time.sleep((attempt + 1) * 8)
                    continue
                response.raise_for_status()
                path.write_text(response.text, encoding="utf-8")
                return response.text
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                time.sleep((attempt + 1) * 3)
        raise RuntimeError(f"No se pudo descargar {url}: {last_error}")


def clean_text(node) -> str:
    return " ".join(node.get_text(" ", strip=True).split()) if node else ""


def parse_number(text: str) -> float | None:
    match = re.search(r"(-?\d+(?:[.,]\d+)?)", text.replace(" ", ""))
    return float(match.group(1).replace(",", ".")) if match else None


def team_links_for_year(fetcher: Fetcher, year: int) -> list[str]:
    url = f"{PCS}teams.php?year={year}"
    soup = BeautifulSoup(fetcher.get(url), "lxml")
    found: dict[str, str] = {}
    for a in soup.select("a[href]"):
        href = urljoin(PCS, a.get("href", ""))
        path = urlparse(href).path.strip("/")
        if not path.startswith("team/"):
            continue
        if not re.search(rf"-{year}(?:/|$)", path):
            continue
        overview = href.split("?")[0].rstrip("/")
        found[overview] = clean_text(a) or path.split("/")[1].replace("-", " ").title()
    return sorted(found)


def choose_roster_container(soup: BeautifulSoup):
    candidates = []
    for node in soup.find_all(["div", "section", "ul", "table"]):
        links = {urljoin(PCS, a.get("href", "")) for a in node.select('a[href*="/rider/"]')}
        links = {u for u in links if re.search(r"/rider/[^/?#]+$", u)}
        if 6 <= len(links) <= 50:
            candidates.append((len(links), len(clean_text(node)), node))
    if candidates:
        # Most rider links, then least surrounding text to avoid selecting whole page.
        return sorted(candidates, key=lambda x: (-x[0], x[1]))[0][2]
    return soup


def parse_team(fetcher: Fetcher, url: str, year: int) -> tuple[dict, list[tuple[str, str]]]:
    soup = BeautifulSoup(fetcher.get(url), "lxml")
    h1 = soup.find("h1")
    raw_name = clean_text(h1) or urlparse(url).path.split("/")[-1].rsplit(f"-{year}", 1)[0].replace("-", " ").title()
    name = re.sub(rf"\s*{year}\s*$", "", raw_name).strip()
    text = clean_text(soup)
    level = "WT" if re.search(r"WorldTeam|World Tour", text, re.I) else "PRT" if re.search(r"ProTeam|Pro Continental", text, re.I) else "CT"
    country = "International"
    flag = soup.select_one('[class*="flag"]')
    if flag:
        country = flag.get("title") or flag.get("data-original-title") or country
    container = choose_roster_container(soup)
    rider_links: dict[str, str] = {}
    for a in container.select('a[href*="/rider/"]'):
        href = urljoin(PCS, a.get("href", "")).split("?")[0].rstrip("/")
        if not re.search(r"/rider/[^/?#]+$", href):
            continue
        rider_name = clean_text(a)
        if len(rider_name) < 3:
            rider_name = href.split("/")[-1].replace("-", " ").title()
        rider_links[href] = rider_name
    team_id = f"y{year}__{slug(name)}"
    team = {
        "id": team_id, "name": name, "displayName": name, "season": year,
        "level": level, "country": country, "archetype": f"Equipo profesional {year}",
        "visual": generated_visual(name, year),
        "material": {"frame":"canyon", "wheels":"shimano"},
        "ai": {"gc":60,"sprint":60,"classics":60,"breakaway":65,"control":55},
        "source": {"provider":"ProCyclingStats", "url":url, "status":"scraped"},
    }
    return team, sorted((u, n) for u, n in rider_links.items())


def value_after_label(soup: BeautifulSoup, labels: Iterable[str]) -> str | None:
    wanted = [x.lower() for x in labels]
    for text_node in soup.find_all(string=True):
        text = " ".join(str(text_node).split())
        if not text or not any(label in text.lower() for label in wanted):
            continue
        parent = text_node.parent
        for node in [parent.find_next_sibling(), parent.parent.find_next_sibling() if parent.parent else None, parent.find_next()]:
            candidate = clean_text(node)
            if candidate and candidate != text:
                return candidate
    return None


def profile_scores(soup: BeautifulSoup) -> dict[str, float]:
    text = clean_text(soup)
    aliases = {
        "oneday": ["One day races", "One-day races"], "gc":["GC", "General classification"],
        "tt":["Time trial", "Time trials"], "sprint":["Sprint"],
        "climber":["Climber", "Climbing"], "hills":["Hills", "Hill"]
    }
    scores = {}
    for key, labels in aliases.items():
        found = None
        for label in labels:
            # Accept labels followed by a number in the same visual block.
            match = re.search(rf"{re.escape(label)}\s*[:\-]?\s*(\d+(?:[.,]\d+)?)", text, re.I)
            if match:
                found = float(match.group(1).replace(",", ".")); break
        if found is not None:
            scores[key] = found
    return scores


def infer_role(scores: dict[str, float], weight: float | None, seed: str) -> str:
    if scores:
        normalized = {k: math.log1p(max(0, v)) for k, v in scores.items()}
        key = max(normalized, key=normalized.get)
        if key == "gc": return "gc"
        if key == "climber": return "climber"
        if key == "tt": return "tt"
        if key == "sprint": return "sprinter"
        if key == "oneday": return "classics"
        if key == "hills": return "puncheur"
    if weight and weight < 62: return "climber"
    if weight and weight > 77: return "sprinter" if stable_int(seed) % 2 else "rouleur"
    return ["domestique","rouleur","puncheur","classics","climber","tt"][stable_int(seed) % 6]


def build_stats(role: str, scores: dict[str, float], base: int, seed: str) -> dict:
    tpl = ROLE_TEMPLATES[role]
    # Convert PCS category points/profile values into a bounded percentile-like boost.
    converted = {k: clamp(50 + 10 * math.log10(1 + max(0, v)), 50, 98) for k, v in scores.items()}
    mapping = {
        "flat": converted.get("tt"), "sprint": converted.get("sprint"),
        "mountain": converted.get("climber") or converted.get("gc"),
        "hills": converted.get("hills") or converted.get("oneday"),
        "cobbles": converted.get("oneday"), "tt": converted.get("tt"),
    }
    result = {}
    lift = (base - 75) * .45
    for key, value in tpl.items():
        evidence = mapping.get(key)
        noise = ((stable_int(seed + key) % 700) / 100) - 3.5
        blended = value + lift + noise
        if evidence is not None:
            blended = blended * .56 + evidence * .44
        result[key] = int(round(clamp(blended, 35, 99)))
    result["ttt"] = int(round(clamp(result.get("tt", 70) * .65 + result.get("flat", 70) * .2 + result.get("stamina", 70) * .15, 35, 99)))
    result["timeTrial"] = result["tt"]
    result["teamTimeTrial"] = result["ttt"]
    return result



def build_rider_stub(fallback_name: str, rider_url: str, team_id: str, year: int) -> dict:
    name = fallback_name.strip() or rider_url.rstrip("/").split("/")[-1].replace("-", " ").title()
    seed = f"{name}-{year}-{team_id}"
    role = ["domestique","rouleur","puncheur","classics","climber","tt","sprinter"][stable_int(seed) % 7]
    base = int(clamp(67 + (stable_int(seed + "base") % 1500) / 100, 64, 82))
    stats = build_stats(role, {}, base, seed)
    rider_id = f"y{year}__{slug(team_id)}__{slug(name)}"
    return {
        "id": rider_id, "historicalId": rider_id, "name": name, "nationality": "Unknown",
        "age": 27, "birthdate": "", "heightM": None,
        "weightKg": {"climber":60,"sprinter":77,"rouleur":76,"tt":75,"classics":72,"puncheur":66,"domestique":70}[role],
        "teamId": team_id, "season": year, "roleKey": role, "role": ROLE_LABELS[role], "base": base,
        "defaultOrder":"hold", "defaultEffort":65, "stats":stats, "form":base, "morale":75,
        "fatigue":0, "energy":100, "totalTime":0, "points":0, "mountainPoints":0, "uciPoints":0,
        "stageWins":0, "seasonStageWins":0, "raceDays":0, "abandoned":False,
        "source":{"provider":"ProCyclingStats", "url":rider_url, "ratingSource":"deterministic roster estimate; run without --rosters-only to enrich"},
    }

def parse_rider(fetcher: Fetcher, url: str, fallback_name: str, team_id: str, year: int) -> dict:
    soup = BeautifulSoup(fetcher.get(url), "lxml")
    name = clean_text(soup.find("h1")) or fallback_name
    name = re.sub(r"\s+Overview.*$", "", name, flags=re.I).strip()
    page_text = clean_text(soup)
    birth_raw = value_after_label(soup, ["Date of birth", "Born"]) or ""
    birth_match = re.search(r"(19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.](19|20)\d{2}", birth_raw + " " + page_text)
    birthdate = birth_match.group(0) if birth_match else ""
    birth_year_match = re.search(r"(19|20)\d{2}", birthdate)
    birth_year = int(birth_year_match.group(0)) if birth_year_match else year - 27
    age = int(clamp(year - birth_year, 17, 48))
    height_text = value_after_label(soup, ["Height"]) or ""
    weight_text = value_after_label(soup, ["Weight"]) or ""
    height = parse_number(height_text)
    weight = parse_number(weight_text)
    if height and height > 10: height /= 100
    if weight and weight > 150: weight /= 2.20462
    country = "Unknown"
    flag = soup.select_one('[class*="flag"]')
    if flag: country = flag.get("title") or flag.get("data-original-title") or country
    scores = profile_scores(soup)
    seed = f"{name}-{year}-{team_id}"
    role = infer_role(scores, weight, seed)
    max_score = max(scores.values(), default=0)
    base = int(round(clamp(68 + 7.5 * math.log10(1 + max_score) + (stable_int(seed) % 350) / 100, 62, 97)))
    stats = build_stats(role, scores, base, seed)
    default_weight = {"gc":64,"co":66,"climber":60,"tt":75,"sprinter":77,"classics":72,"rouleur":76,"puncheur":66,"domestique":70}[role]
    rider_id = f"y{year}__{slug(team_id)}__{slug(name)}"
    return {
        "id": rider_id, "historicalId": rider_id, "name": name, "nationality": country,
        "age": age, "birthdate": birthdate, "heightM": round(height, 2) if height else None,
        "weightKg": round(weight, 1) if weight else default_weight, "teamId": team_id,
        "season": year, "roleKey": role, "role": ROLE_LABELS[role], "base": base,
        "defaultOrder": "hold", "defaultEffort": 65, "stats": stats,
        "form": base, "morale": 75, "fatigue": 0, "energy": 100, "totalTime": 0,
        "points": 0, "mountainPoints": 0, "uciPoints": 0, "stageWins": 0,
        "seasonStageWins": 0, "raceDays": 0, "abandoned": False,
        "source": {"provider":"ProCyclingStats", "url":url, "ratingSource":"PCS profile categories + role model", "profileScores":scores},
    }


def parse_calendar(fetcher: Fetcher, year: int) -> list[dict]:
    try:
        soup = BeautifulSoup(fetcher.get(f"{PCS}races.php?year={year}"), "lxml")
    except Exception:
        return []
    races = {}
    for a in soup.select('a[href*="/race/"]'):
        href = urljoin(PCS, a.get("href", "")).split("?")[0]
        match = re.search(r"/race/([^/]+)/(?:(\d{4}))", href)
        if not match or int(match.group(2)) != year:
            continue
        race_slug = match.group(1)
        if race_slug not in MAJOR_RACE_SLUGS:
            continue
        row = a.find_parent("tr") or a.parent
        row_text = clean_text(row)
        date_match = re.search(rf"({year})[-/.](\d{{1,2}})[-/.](\d{{1,2}})|(\d{{1,2}})[-/.](\d{{1,2}})[-/.]({year})", row_text)
        date = f"{year}-01-01"
        if date_match:
            nums = [int(x) for x in date_match.groups() if x]
            if nums[0] == year: _, month, day = nums
            else: day, month, _ = nums
            date = f"{year}-{month:02d}-{day:02d}"
        races[race_slug] = {
            "id": f"y{year}__{race_slug}", "name": clean_text(a), "country": "",
            "date": date, "season": year, "type": "classic", "jersey": "Ganador",
            "jerseyClass": "jersey-rainbow", "stages": [],
            "source": {"provider":"ProCyclingStats", "url":href},
        }
    return sorted(races.values(), key=lambda r: r["date"])


def validate_pack(pack: dict) -> tuple[list[str], list[str]]:
    errors, warnings = [], []
    teams, riders = pack.get("teams", []), pack.get("riders", [])
    team_ids = [t.get("id") for t in teams]
    rider_ids = [r.get("id") for r in riders]
    if len(team_ids) != len(set(team_ids)): errors.append("IDs de equipo duplicados")
    if len(rider_ids) != len(set(rider_ids)): errors.append("IDs de corredor duplicados")
    known = set(team_ids)
    orphans = [r.get("name") for r in riders if r.get("teamId") not in known]
    if orphans: errors.append(f"{len(orphans)} corredores sin equipo válido")
    if not teams: errors.append("No se encontraron equipos")
    if not riders: errors.append("No se encontraron corredores")
    for team in teams:
        count = sum(1 for r in riders if r.get("teamId") == team.get("id"))
        team["riderCount"] = count
        if count < 6: warnings.append(f"Plantilla muy corta: {team.get('name')} ({count})")
        if count > 45: warnings.append(f"Plantilla demasiado grande: {team.get('name')} ({count})")
    for rider in riders:
        if not rider.get("name"): errors.append("Corredor sin nombre")
        stats = rider.get("stats") or {}
        for key in ["flat","sprint","mountain","hills","cobbles","tt","ttt"]:
            value = stats.get(key)
            if not isinstance(value, (int,float)) or not 30 <= value <= 100:
                errors.append(f"Rating inválido {rider.get('name')}:{key}")
                break
    return errors, warnings


def build_year(fetcher: Fetcher, year: int, output: Path, resume: bool, include_calendar: bool, rosters_only: bool) -> dict:
    out_file = output / f"{year}.json"
    if resume and out_file.exists():
        print(f"[{year}] ya existe; omitido por --resume")
        return json.loads(out_file.read_text(encoding="utf-8"))
    team_urls = team_links_for_year(fetcher, year)
    print(f"[{year}] {len(team_urls)} páginas de equipo")
    teams, riders = [], []
    rider_seen: set[tuple[str,str]] = set()
    failures = []
    for team_index, team_url in enumerate(team_urls, 1):
        try:
            team, roster = parse_team(fetcher, team_url, year)
            teams.append(team)
            print(f"  {team_index:02d}/{len(team_urls):02d} {team['name']}: {len(roster)} enlaces")
            for rider_url, fallback_name in roster:
                key = (team["id"], rider_url)
                if key in rider_seen: continue
                rider_seen.add(key)
                try:
                    riders.append(build_rider_stub(fallback_name, rider_url, team["id"], year) if rosters_only else parse_rider(fetcher, rider_url, fallback_name, team["id"], year))
                except Exception as exc:  # noqa: BLE001
                    failures.append({"type":"rider","url":rider_url,"team":team["name"],"error":str(exc)})
        except Exception as exc:  # noqa: BLE001
            failures.append({"type":"team","url":team_url,"error":str(exc)})
    calendar = parse_calendar(fetcher, year) if include_calendar else []
    pack = {
        "schemaVersion": 2, "season": year, "label": f"Pelotón profesional {year}",
        "generatedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "source": {"provider":"ProCyclingStats", "teamsUrl":f"{PCS}teams.php?year={year}", "method":"rate-limited HTML builder", "profileEnrichment":not rosters_only},
        "completeness": {}, "teams": teams, "riders": riders, "calendar": calendar,
        "failures": failures,
    }
    errors, warnings = validate_pack(pack)
    status = ("roster-complete-ratings-estimated" if rosters_only else "complete") if not errors and not failures and not warnings else "partial"
    pack["completeness"] = {
        "status": status, "teamCount": len(teams), "riderCount": len(riders),
        "errorCount": len(errors), "warningCount": len(warnings), "requestFailureCount": len(failures),
        "errors": errors, "warnings": warnings,
    }
    output.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"[{year}] {status}: {len(teams)} equipos, {len(riders)} corredores, {len(errors)} errores, {len(warnings)} avisos")
    return pack


def update_manifest(output: Path) -> None:
    years = []
    for year in range(1990, 2027):
        path = output / f"{year}.json"
        if path.exists():
            pack = json.loads(path.read_text(encoding="utf-8"))
            comp = pack.get("completeness", {})
            years.append({"year":year,"status":comp.get("status","partial"),"teamCount":len(pack.get("teams",[])),"riderCount":len(pack.get("riders",[])),"file":path.name})
        else:
            years.append({"year":year,"status":"build-required","teamCount":0,"riderCount":0,"file":None})
    manifest = {"schemaVersion":2,"generatedAt":datetime.utcnow().date().isoformat(),"years":years}
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    js = output.parent / "historical-manifest.js"
    js.write_text("const HISTORICAL_MANIFEST_V025 = " + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int)
    parser.add_argument("--start-year", type=int, default=1990)
    parser.add_argument("--end-year", type=int, default=2026)
    parser.add_argument("--output", type=Path, default=Path("historical-data"))
    parser.add_argument("--cache", type=Path, default=Path(".cache/pcs"))
    parser.add_argument("--delay", type=float, default=1.25)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--refresh", action="store_true", help="Reserved: clear cache files manually before use")
    parser.add_argument("--no-calendar", action="store_true")
    parser.add_argument("--rosters-only", action="store_true", help="Fetch team rosters only; preserves names/teams and estimates ratings without rider-page requests")
    args = parser.parse_args()
    if args.year:
        start = end = args.year
    else:
        start, end = args.start_year, args.end_year
    if start < 1990 or end > 2026 or start > end:
        parser.error("Rango permitido: 1990-2026")
    fetcher = Fetcher(args.cache, max(.5, args.delay))
    for year in range(start, end + 1):
        try:
            build_year(fetcher, year, args.output, args.resume, not args.no_calendar, args.rosters_only)
        except KeyboardInterrupt:
            raise
        except Exception as exc:  # noqa: BLE001
            print(f"[{year}] ERROR: {exc}", file=sys.stderr)
    update_manifest(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
