#!/usr/bin/env python3
import json
import math
import os
import re
import statistics
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GPX_DIR = ROOT / 'gpx'
DATA_DIR = ROOT / 'data'
SPACING_M = 20.0           # horizontal sampling density for profile rendering
SMOOTH_WINDOW = 9          # 9 * 20m = 180m visual elevation smoothing window
MEDIAN_WINDOW = 5          # reject spikes before moving-average smoothing
GRADE_WINDOW_M = 100.0     # centered slope window for Radial-like colouring


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(min(1.0, math.sqrt(a)))


def parse_gpx(path: Path):
    root = ET.parse(path).getroot()
    ns = ''
    if root.tag.startswith('{'):
        ns = root.tag.split('}')[0] + '}'
    trkpts = root.findall(f'.//{ns}trkpt')
    pts = []
    for p in trkpts:
        lat = float(p.attrib['lat'])
        lon = float(p.attrib['lon'])
        ele_node = p.find(f'{ns}ele')
        ele = float(ele_node.text) if ele_node is not None and ele_node.text else 0.0
        pts.append((lat, lon, ele))
    return pts


def cumulative_distances(points):
    dists = [0.0]
    for i in range(1, len(points)):
        lat1, lon1, _ = points[i - 1]
        lat2, lon2, _ = points[i]
        dists.append(dists[-1] + haversine(lat1, lon1, lat2, lon2))
    return dists


def lerp(a, b, t):
    return a + (b - a) * t


def resample_track(points, distances, spacing_m=20.0):
    if not points:
        return []
    total = distances[-1]
    targets = []
    n = int(total // spacing_m)
    for i in range(n + 1):
        targets.append(min(total, i * spacing_m))
    if targets[-1] < total:
        targets.append(total)

    result = []
    seg = 0
    for target in targets:
        while seg < len(distances) - 2 and distances[seg + 1] < target:
            seg += 1
        d0 = distances[seg]
        d1 = distances[seg + 1] if seg + 1 < len(distances) else distances[seg]
        p0 = points[seg]
        p1 = points[seg + 1] if seg + 1 < len(points) else points[seg]
        if d1 == d0:
            t = 0.0
        else:
            t = (target - d0) / (d1 - d0)
        lat = lerp(p0[0], p1[0], t)
        lon = lerp(p0[1], p1[1], t)
        ele = lerp(p0[2], p1[2], t)
        result.append([round(target, 2), round(lat, 8), round(lon, 8), round(ele, 2)])
    return result


def sliding_window(seq, size):
    half = size // 2
    out = []
    n = len(seq)
    for i in range(n):
        lo = max(0, i - half)
        hi = min(n, i + half + 1)
        out.append(seq[lo:hi])
    return out


def median_filter(values, window=5):
    if window <= 1:
        return values[:]
    return [statistics.median(chunk) for chunk in sliding_window(values, window)]


def moving_average(values, window=9):
    if window <= 1:
        return values[:]
    half = window // 2
    out = []
    n = len(values)
    for i in range(n):
        lo = max(0, i - half)
        hi = min(n, i + half + 1)
        segment = values[lo:hi]
        out.append(sum(segment) / len(segment))
    return out


def compute_grades(points, window_m=100.0):
    if not points:
        return []
    dists = [p[0] for p in points]
    eles = [p[3] for p in points]
    smoothed = moving_average(median_filter(eles, MEDIAN_WINDOW), SMOOTH_WINDOW)
    for i, v in enumerate(smoothed):
        points[i].append(round(v, 2))  # index 4 = smoothed ele

    grades = []
    half = window_m / 2.0
    n = len(points)
    left = 0
    right = 0
    for i in range(n):
        d = dists[i]
        target_left = max(0.0, d - half)
        target_right = min(dists[-1], d + half)
        while left < n - 1 and dists[left] < target_left:
            left += 1
        while right < n - 1 and dists[right] < target_right:
            right += 1
        l_idx = max(0, left - 1)
        r_idx = min(n - 1, right)
        d0 = dists[l_idx]
        d1 = dists[r_idx]
        if d1 == d0:
            grade = 0.0
        else:
            grade = ((smoothed[r_idx] - smoothed[l_idx]) / (d1 - d0)) * 100.0
        grades.append(grade)
    return smoothed, grades


def total_gain_and_loss(smoothed):
    gain = 0.0
    loss = 0.0
    for i in range(1, len(smoothed)):
        delta = smoothed[i] - smoothed[i - 1]
        if delta > 0:
            gain += delta
        else:
            loss -= delta
    return gain, loss


def simplify_route(points, every=2):
    simplified = [[round(p[1], 6), round(p[2], 6)] for i, p in enumerate(points) if i % every == 0]
    if simplified[-1] != [round(points[-1][1], 6), round(points[-1][2], 6)]:
        simplified.append([round(points[-1][1], 6), round(points[-1][2], 6)])
    return simplified


def build_stage(path: Path):
    raw_points = parse_gpx(path)
    raw_distances = cumulative_distances(raw_points)
    sampled = resample_track(raw_points, raw_distances, SPACING_M)
    smoothed, grades = compute_grades(sampled, GRADE_WINDOW_M)

    distances = [p[0] for p in sampled]
    gain, loss = total_gain_and_loss(smoothed)
    latitudes = [p[1] for p in sampled]
    longitudes = [p[2] for p in sampled]
    sm = [p[4] for p in sampled]

    stage_match = re.search(r'stage-(\d+)', path.stem)
    stage_id = int(stage_match.group(1)) if stage_match else 0
    slug = path.stem.replace('-parcours', '')

    points_out = []
    for i, p in enumerate(sampled):
        # [distance_m, elev_smooth_m, grade_pct, lat, lon]
        points_out.append([
            round(p[0], 1),
            round(p[4], 1),
            round(grades[i], 1),
            round(p[1], 6),
            round(p[2], 6),
        ])

    stage_data = {
        'meta': {
            'stageId': stage_id,
            'slug': slug,
            'name': f'Stage {stage_id}',
            'sourceFile': path.name,
            'pointSpacingM': SPACING_M,
            'gradeWindowM': GRADE_WINDOW_M,
            'distanceKm': round(distances[-1] / 1000.0, 2),
            'totalAscentM': round(gain),
            'totalDescentM': round(loss),
            'minElevationM': round(min(sm)),
            'maxElevationM': round(max(sm)),
            'bounds': {
                'minLat': min(latitudes),
                'maxLat': max(latitudes),
                'minLon': min(longitudes),
                'maxLon': max(longitudes),
            }
        },
        'route': simplify_route(sampled, every=2),
        'points': points_out,
        'format': ['distanceM', 'elevationM', 'gradePct', 'lat', 'lon']
    }
    return stage_data


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    for gpx_file in sorted(GPX_DIR.glob('stage-*.gpx'), key=lambda p: int(re.search(r'(\d+)', p.stem).group(1))):
        stage = build_stage(gpx_file)
        out_path = DATA_DIR / f"{stage['meta']['slug']}.json"
        with out_path.open('w', encoding='utf-8') as f:
            json.dump(stage, f, ensure_ascii=False, separators=(',', ':'))
        manifest.append({
            'stageId': stage['meta']['stageId'],
            'slug': stage['meta']['slug'],
            'name': stage['meta']['name'],
            'distanceKm': stage['meta']['distanceKm'],
            'totalAscentM': stage['meta']['totalAscentM'],
            'file': out_path.name,
        })
        print(f"Built {out_path.name}: {stage['meta']['distanceKm']} km, +{stage['meta']['totalAscentM']} m")

    manifest_path = DATA_DIR / 'manifest.json'
    with manifest_path.open('w', encoding='utf-8') as f:
        json.dump({'stages': manifest}, f, ensure_ascii=False, indent=2)
    print(f'Wrote {manifest_path}')


if __name__ == '__main__':
    main()
