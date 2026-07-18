#!/usr/bin/env python3
"""Build lab-keyword-sources.json for AI Compass.

This creates a per-lab source file for search-only terms. It keeps the visual
lab cards concise while giving AI Compass a wider dictionary surface.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import OrderedDict, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LABS = ROOT / "data" / "labs.json"
DEFAULT_LEGACY = ROOT / "data" / "ai_lab_dictionary.csv"
DEFAULT_OUTPUT = ROOT / "data" / "ai-compass" / "lab-keyword-sources.json"

GENERIC_TERMS = {
    "研究",
    "生命科学",
    "生命科学部",
    "大学",
    "実験",
    "解析",
    "評価",
    "測定",
    "観察",
    "技術",
    "方法",
    "開発",
    "利用",
    "応用",
    "情報",
    "環境",
    "健康",
    "医療",
    "材料",
    "細胞",
    "動物",
    "植物",
    "微生物",
    "データ解析",
}


def normalize(value: str) -> str:
    value = str(value).strip().replace("癌", "がん").replace("ガン", "がん")
    return re.sub(r"\s+", "", value).casefold()


def add_term(terms: OrderedDict[str, dict[str, object]], term: str, weight: int) -> None:
    term = str(term).strip()
    key = normalize(term)
    if not term or len(key) < 2:
        return
    if key in {"する", "なる", "ある", "あり", "いる", "こと", "もの", "ため"}:
        return
    current = terms.setdefault(key, {"term": term, "weight": 0})
    current["weight"] = max(int(current["weight"]), int(weight))


def load_legacy(path: Path) -> dict[str, list[dict[str, str]]]:
    by_lab: dict[str, list[dict[str, str]]] = defaultdict(list)
    if not path.exists():
        return by_lab
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row.get("lab_id"):
                by_lab[row["lab_id"]].append(row)
    return by_lab


def build_sources(labs: list[dict[str, object]], legacy_by_lab: dict[str, list[dict[str, str]]], existing: list[dict[str, object]], limit: int) -> list[dict[str, object]]:
    existing_by_lab: dict[str, list[dict[str, object]]] = defaultdict(list)
    for item in existing:
        existing_by_lab[str(item.get("lab_id"))].append(item)

    entries: list[dict[str, object]] = []
    for lab in labs:
        lab_id = str(lab["id"])
        terms: OrderedDict[str, dict[str, object]] = OrderedDict()

        for source in existing_by_lab.get(lab_id, []):
            for item in source.get("terms", []) or []:
                if isinstance(item, str):
                    add_term(terms, item, 4)
                else:
                    add_term(terms, str(item.get("term", "")), int(item.get("weight") or 4))

        tags = lab.get("tags") or {}
        for field, weight in (("fields", 5), ("targets", 5), ("methods", 4)):
            for term in tags.get(field, []) or []:
                add_term(terms, term, weight)
        for term in lab.get("keywords", []) or []:
            add_term(terms, term, 5)
        for term in lab.get("methods", []) or []:
            add_term(terms, term, 4)
        for term in lab.get("major_categories", []) or []:
            add_term(terms, term, 3)

        for row in legacy_by_lab.get(lab_id, []):
            word = str(row.get("word", "")).strip()
            entry_type = row.get("type", "")
            weight = int(row.get("weight") or 3)
            if word and (word not in GENERIC_TERMS or entry_type in {"target", "field"}):
                add_term(terms, word, min(5, max(3, weight)))
            for synonym in str(row.get("synonym", "")).split("|"):
                synonym = synonym.strip()
                if synonym and synonym not in GENERIC_TERMS and len(normalize(synonym)) >= 3:
                    add_term(terms, synonym, max(2, min(4, weight - 1)))

        ranked = sorted(terms.values(), key=lambda item: (-int(item["weight"]), len(normalize(str(item["term"]))), str(item["term"])))
        selected = [{"term": item["term"], "weight": item["weight"]} for item in ranked[:limit]]
        entries.append(
            {
                "lab_id": lab_id,
                "source_type": "official_lab_and_mylab_seed",
                "url": (lab.get("links") or {}).get("official_lab", ""),
                "checked_at": "2026-07-19",
                "terms": selected,
            }
        )
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--labs", type=Path, default=DEFAULT_LABS)
    parser.add_argument("--legacy", type=Path, default=DEFAULT_LEGACY)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=45)
    args = parser.parse_args()

    labs = json.loads(args.labs.read_text(encoding="utf-8"))
    existing = json.loads(args.output.read_text(encoding="utf-8")) if args.output.exists() else []
    entries = build_sources(labs, load_legacy(args.legacy), existing, args.limit)
    args.output.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"labs,{len(entries)}")
    print(f"source_terms,{sum(len(entry['terms']) for entry in entries)}")


if __name__ == "__main__":
    main()
