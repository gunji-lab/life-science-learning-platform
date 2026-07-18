#!/usr/bin/env python3
"""Build the AI Compass lab-side search dictionary.

The visual lab cards intentionally keep only a small number of keywords.
AI Compass needs a wider search surface, so this script generates
lab_research_tags.json from:

- structured tags and keywords in data/labs.json
- terms found in lab descriptions using general_dictionary.json
- optional source-confirmed additions in lab-keyword-sources.json
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LABS = ROOT / "data" / "labs.json"
DEFAULT_GENERAL = ROOT / "data" / "ai-compass" / "general_dictionary.json"
DEFAULT_LEGACY = ROOT / "data" / "ai_lab_dictionary.csv"
DEFAULT_SOURCE_TERMS = ROOT / "data" / "ai-compass" / "lab-keyword-sources.json"
DEFAULT_OUTPUT = ROOT / "data" / "ai-compass" / "lab_research_tags.json"


FIELD_WEIGHTS = {
    "fields": 5,
    "targets": 4,
    "methods": 4,
    "keywords": 4,
    "methods_list": 3,
    "text": 2,
    "legacy": 3,
    "source_confirmed": 4,
}


def normalize(text: str) -> str:
    text = (
        str(text)
        .replace("癌", "がん")
        .replace("ガン", "がん")
        .replace("ＡＩ", "ai")
        .replace("ＤＮＡ", "dna")
    )
    text = text.lower().replace("　", " ")
    return re.sub(r"[、。,.!?！？「」『』（）()\[\]【】・/／\\\s\-‐‑–—]", "", text)


def add_term(store: OrderedDict[str, dict[str, object]], term: str, weight: int, source: str) -> None:
    term = str(term).strip()
    if not term:
        return
    key = normalize(term)
    if len(key) < 2:
        return
    current = store.setdefault(key, {"tag": term, "weight": 0, "sources": []})
    current["weight"] = max(int(current["weight"]), int(weight))
    if source not in current["sources"]:
        current["sources"].append(source)


def lab_text(lab: dict[str, object]) -> str:
    parts: list[str] = []
    for key in ("lab_name", "pi_name", "summary", "question", "description"):
        if lab.get(key):
            parts.append(str(lab[key]))
    for key in ("keywords", "methods", "recommended_for", "major_categories"):
        parts.extend(str(item) for item in lab.get(key, []) or [])
    for course in lab.get("courses", []) or []:
        parts.append(str(course.get("title", "")))
        parts.append(str(course.get("description", "")))
    return "\n".join(parts)


def load_source_terms(path: Path) -> dict[str, list[dict[str, object]]]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    by_lab: dict[str, list[dict[str, object]]] = {}
    for item in data:
        by_lab.setdefault(str(item.get("lab_id")), []).append(item)
    return by_lab


def load_legacy_terms(path: Path) -> dict[str, list[dict[str, object]]]:
    if not path.exists():
        return {}
    by_lab: dict[str, list[dict[str, object]]] = {}
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if not row.get("lab_id") or not row.get("word"):
                continue
            by_lab.setdefault(row["lab_id"], []).append(row)
    return by_lab


def build_records(labs: list[dict[str, object]], general: list[dict[str, object]], source_terms: dict[str, list[dict[str, object]]], legacy_terms: dict[str, list[dict[str, object]]]) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for lab in labs:
        lab_id = str(lab.get("id"))
        terms: OrderedDict[str, dict[str, object]] = OrderedDict()
        tags = lab.get("tags", {}) or {}

        for field in ("fields", "targets", "methods"):
            for term in tags.get(field, []) or []:
                add_term(terms, term, FIELD_WEIGHTS[field], f"labs.json:tags.{field}")
        for term in lab.get("keywords", []) or []:
            add_term(terms, term, FIELD_WEIGHTS["keywords"], "labs.json:keywords")
        for term in lab.get("methods", []) or []:
            add_term(terms, term, FIELD_WEIGHTS["methods_list"], "labs.json:methods")

        text = lab_text(lab)
        normalized_text = normalize(text)
        for entry in general:
            candidates = [entry.get("keyword"), *(entry.get("aliases", []) or [])]
            if any(normalize(candidate) and normalize(candidate) in normalized_text for candidate in candidates):
                weight = min(4, int(entry.get("weight", 2) or 2))
                add_term(terms, str(entry.get("keyword")), weight, "labs.json:text")
                for concept in entry.get("concepts", []) or []:
                    add_term(terms, str(concept), min(3, weight), "general_dictionary:concept")

        for row in legacy_terms.get(lab_id, []):
            add_term(terms, row["word"], int(row.get("weight") or FIELD_WEIGHTS["legacy"]), "ai_lab_dictionary.csv")
            for synonym in str(row.get("synonym", "")).split("|"):
                add_term(terms, synonym, max(2, int(row.get("weight") or FIELD_WEIGHTS["legacy"]) - 1), "ai_lab_dictionary.csv:synonym")

        urls: list[str] = []
        for source in source_terms.get(lab_id, []):
            if source.get("url"):
                urls.append(str(source["url"]))
            for item in source.get("terms", []) or []:
                if isinstance(item, str):
                    add_term(terms, item, FIELD_WEIGHTS["source_confirmed"], f"{source.get('source_type', 'source')}:terms")
                else:
                    add_term(terms, str(item.get("term", "")), int(item.get("weight") or FIELD_WEIGHTS["source_confirmed"]), f"{source.get('source_type', 'source')}:terms")

        sorted_terms = sorted(terms.values(), key=lambda item: (-int(item["weight"]), str(item["tag"])))
        records.append(
            {
                "lab_id": lab_id,
                "lab_name": lab.get("lab_name"),
                "faculty_name": lab.get("pi_name"),
                "research_tags": sorted_terms,
                "keywords": [str(item["tag"]) for item in sorted_terms],
                "source_urls": sorted(set(urls)),
            }
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--labs", type=Path, default=DEFAULT_LABS)
    parser.add_argument("--general", type=Path, default=DEFAULT_GENERAL)
    parser.add_argument("--legacy", type=Path, default=DEFAULT_LEGACY)
    parser.add_argument("--source-terms", type=Path, default=DEFAULT_SOURCE_TERMS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    labs = json.loads(args.labs.read_text(encoding="utf-8"))
    general = json.loads(args.general.read_text(encoding="utf-8"))
    records = build_records(labs, general, load_source_terms(args.source_terms), load_legacy_terms(args.legacy))
    args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"labs,{len(records)}")
    print(f"research_tags,{sum(len(record['research_tags']) for record in records)}")


if __name__ == "__main__":
    main()
