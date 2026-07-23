#!/usr/bin/env python3
"""Rebuild gpx-stage-data.js from every gpx/stage-*-parcours.gpx file."""
from __future__ import annotations

import json
import re
from pathlib import Path

import build_stage_data

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT = ROOT / "gpx-stage-data.js"


def main() -> None:
    build_stage_data.main()
    packed: dict[int, dict] = {}
    files = sorted(
        DATA_DIR.glob("stage-*.json"),
        key=lambda path: int(re.search(r"(\d+)", path.stem).group(1)),
    )
    for path in files:
        stage = json.loads(path.read_text(encoding="utf-8"))
        meta = stage["meta"]
        packed[int(meta["stageId"])] = {
            "meta": {
                "stageId": int(meta["stageId"]),
                "sourceFile": meta["sourceFile"],
                "distanceKm": meta["distanceKm"],
                "totalAscentM": meta["totalAscentM"],
                "totalDescentM": meta["totalDescentM"],
                "minElevationM": meta["minElevationM"],
                "maxElevationM": meta["maxElevationM"],
                "pointSpacingM": meta["pointSpacingM"],
                "gradeWindowM": meta["gradeWindowM"],
            },
            "points": stage["points"],
        }

    javascript = (
        "/* Generated from the GPX files in /gpx. Do not edit manually. */\n"
        "globalThis.GPX_TOUR_STAGE_DATA_2026="
        + json.dumps(packed, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    OUTPUT.write_text(javascript, encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(packed)} GPX stages.")


if __name__ == "__main__":
    main()
