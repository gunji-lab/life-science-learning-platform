#!/usr/bin/env python3
"""Build the public AI Compass general dictionary from category sources."""

from __future__ import annotations

import argparse
import json
import re
from collections import OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "data" / "ai-compass" / "general-dictionary-sources"
DEFAULT_OUTPUT = ROOT / "data" / "ai-compass" / "general_dictionary.json"


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        value = str(value).strip()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def is_valid_input_term(value: str) -> bool:
    compact = str(value).casefold().replace(" ", "").replace("　", "")
    return len(compact) >= 2 or bool(re.search(r"[\u4e00-\u9fff]", compact))


def load_entries(source_dir: Path) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    for path in sorted(source_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError(f"{path} must contain a JSON array")
        for item in data:
            if not item.get("keyword"):
                raise ValueError(f"{path} contains an entry without keyword")
            item = dict(item)
            item.setdefault("aliases", [])
            item.setdefault("concepts", [])
            item["_source"] = path.name
            entries.append(item)
    return entries


def merge_entries(entries: list[dict[str, object]]) -> list[dict[str, object]]:
    merged: OrderedDict[str, dict[str, object]] = OrderedDict()
    for entry in entries:
        keyword = str(entry["keyword"]).strip()
        current = merged.setdefault(
            keyword,
            {
                "keyword": keyword,
                "aliases": [],
                "concepts": [],
            },
        )
        aliases = [alias for alias in entry.get("aliases", []) if is_valid_input_term(str(alias))]
        current["aliases"] = unique([*current["aliases"], *aliases])
        current["concepts"] = unique([*current["concepts"], *entry.get("concepts", [])])
        if entry.get("weight") is not None:
            current["weight"] = max(int(current.get("weight", 1)), int(entry["weight"]))
    return list(merged.values())


def validate(entries: list[dict[str, object]]) -> None:
    normalized_terms: dict[str, str] = {}
    for entry in entries:
        keyword = str(entry["keyword"])
        if not entry.get("concepts"):
            raise ValueError(f"{keyword} has no concepts")
        for term in [keyword, *entry.get("aliases", [])]:
            compact = str(term).casefold().replace(" ", "").replace("　", "")
            if not is_valid_input_term(compact):
                raise ValueError(f"{keyword} has too-short term: {term}")
            normalized_terms.setdefault(compact, keyword)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    entries = merge_entries(load_entries(args.source_dir))
    validate(entries)
    args.output.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    aliases = {alias for entry in entries for alias in entry.get("aliases", [])}
    concepts = {concept for entry in entries for concept in entry.get("concepts", [])}
    print(f"entries,{len(entries)}")
    print(f"aliases,{len(aliases)}")
    print(f"input_terms,{len({entry['keyword'] for entry in entries} | aliases)}")
    print(f"concepts,{len(concepts)}")


if __name__ == "__main__":
    main()
