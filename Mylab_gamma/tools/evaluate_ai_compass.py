#!/usr/bin/env python3
"""Evaluate AI Research Compass seed questions against the CSV dictionary.

This script mirrors the beta search idea closely enough for content QA:
normalize text, extract common dictionary tags, score labs primarily with the
lab dictionary, and summarize gaps that should guide dictionary updates.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_QUESTIONS = ROOT / "docs" / "ai_research_compass_test_questions.csv"
DEFAULT_DICTIONARY = ROOT / "data" / "ai_research_dictionary.csv"
DEFAULT_LAB_DICTIONARY = ROOT / "data" / "ai_lab_dictionary.csv"
DEFAULT_LABS = ROOT / "data" / "labs.json"


STOPWORDS = {
    "です",
    "ます",
    "して",
    "したい",
    "知りたい",
    "興味",
    "研究",
    "大学",
    "生命科学",
    "について",
    "どんな",
    "あります",
    "つながる",
    "気になります",
}


def normalize(text: str) -> str:
    text = text.lower()
    text = text.replace("　", " ")
    return re.sub(r"\s+", " ", text).strip()


def read_dictionary(path: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            terms = [row["word"].strip()]
            terms.extend(x.strip() for x in row.get("synonym", "").split("|") if x.strip())
            rows.append(
                {
                    "word": row["word"].strip(),
                    "terms": [normalize(term) for term in terms if term.strip()],
                    "tag": row["tag"].strip(),
                    "weight": int(row["weight"] or 1),
                }
            )
    return rows


def read_lab_dictionary(path: Path) -> dict[str, list[dict[str, object]]]:
    by_lab: dict[str, list[dict[str, object]]] = {}
    if not path.exists():
        return by_lab
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            terms = [row["word"].strip()]
            terms.extend(x.strip() for x in row.get("synonym", "").split("|") if x.strip())
            entry = {
                "lab_id": row["lab_id"].strip(),
                "word": row["word"].strip(),
                "terms": [normalize(term) for term in terms if term.strip()],
                "field": row.get("field", "").strip(),
                "weight": int(row.get("weight") or 1),
            }
            by_lab.setdefault(str(entry["lab_id"]), []).append(entry)
    return by_lab


def lab_terms(lab: dict[str, object]) -> set[str]:
    terms: set[str] = set()
    for field in ("keywords", "major_categories", "methods"):
        values = lab.get(field, [])
        if isinstance(values, str):
            values = [values]
        terms.update(str(value) for value in values if value)
    tags = lab.get("tags", {})
    if isinstance(tags, dict):
        for values in tags.values():
            if isinstance(values, list):
                terms.update(str(value) for value in values if value)
    return terms


def analyze(text: str, dictionary: list[dict[str, object]]) -> tuple[Counter[str], list[str]]:
    normalized = normalize(text)
    tags: Counter[str] = Counter()
    matched_terms: set[str] = set()
    for entry in dictionary:
        for term in entry["terms"]:
            if term and term in normalized:
                tags[str(entry["tag"])] += int(entry["weight"])
                matched_terms.add(term)
                break

    tokens = re.findall(r"[a-z0-9]+|[ぁ-んァ-ン一-龥ー]{2,}", text)
    unknown = []
    for token in tokens:
        clean = normalize(token)
        if clean in STOPWORDS:
            continue
        if any(clean in term or term in clean for term in matched_terms):
            continue
        if not any(clean in term for entry in dictionary for term in entry["terms"]):
            unknown.append(token)
    return tags, unknown


def score_labs(
    text: str,
    tags: Counter[str],
    labs: list[dict[str, object]],
    lab_dictionary: dict[str, list[dict[str, object]]],
) -> list[tuple[float, dict[str, object], list[str]]]:
    normalized = normalize(text)
    scored = []
    for lab in labs:
        matched_scores: Counter[str] = Counter()
        score = 0.0
        for entry in lab_dictionary.get(str(lab.get("id")), []):
            direct_hit = any(term and term in normalized for term in entry["terms"])
            if direct_hit:
                weight = float(entry["weight"])
                score += weight
                matched_scores[str(entry["word"])] += weight
                continue
            tag_hit = next((term for term in entry["terms"] if term in tags), "")
            if tag_hit:
                weight = max(1.0, float(entry["weight"]) * 0.75)
                score += weight
                matched_scores[str(entry["word"])] += weight

        terms = lab_terms(lab)
        for tag, weight in tags.items():
            if tag not in terms:
                continue
            fallback = max(0.5, float(weight) * 0.35)
            score += fallback
            matched_scores[tag] += fallback

        if score:
            matched = [term for term, _ in matched_scores.most_common()]
            scored.append((score, lab, matched))
    scored.sort(key=lambda item: (-item[0], item[1].get("department", ""), item[1].get("lab_name", "")))
    return scored


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--questions", type=Path, default=DEFAULT_QUESTIONS)
    parser.add_argument("--dictionary", type=Path, default=DEFAULT_DICTIONARY)
    parser.add_argument("--lab-dictionary", type=Path, default=DEFAULT_LAB_DICTIONARY)
    parser.add_argument("--labs", type=Path, default=DEFAULT_LABS)
    parser.add_argument("--top", type=int, default=3)
    args = parser.parse_args()

    dictionary = read_dictionary(args.dictionary)
    lab_dictionary = read_lab_dictionary(args.lab_dictionary)
    labs = json.loads(args.labs.read_text(encoding="utf-8"))
    questions = list(csv.DictReader(args.questions.open(newline="", encoding="utf-8")))

    topic_total: Counter[str] = Counter()
    topic_hit: Counter[str] = Counter()
    unknown_terms: Counter[str] = Counter()
    lab_top_hits: Counter[str] = Counter()
    no_hit_examples: list[str] = []

    for row in questions:
        text = row["sample_input"]
        topic = row.get("topic_group", "unknown")
        topic_total[topic] += 1
        tags, unknown = analyze(text, dictionary)
        for term in unknown:
            unknown_terms[term] += 1
        scored = score_labs(text, tags, labs, lab_dictionary)
        if scored:
            topic_hit[topic] += 1
            for _, lab, _ in scored[: args.top]:
                lab_top_hits[str(lab.get("lab_name", lab.get("id", "unknown")))] += 1
        elif len(no_hit_examples) < 20:
            no_hit_examples.append(text)

    total = len(questions)
    hit_total = sum(topic_hit.values())
    print(f"questions,{total}")
    print(f"dictionary_entries,{len(dictionary)}")
    print(f"lab_dictionary_entries,{sum(len(entries) for entries in lab_dictionary.values())}")
    print(f"hit_rate,{hit_total / total:.3f}")
    print()
    print("topic,hit,total,rate")
    for topic, count in topic_total.items():
        hits = topic_hit[topic]
        print(f"{topic},{hits},{count},{hits / count:.3f}")
    print()
    print("top_lab_appearances")
    for lab, count in lab_top_hits.most_common():
        print(f"{lab},{count},{count / total:.3f}")
    print()
    print("unknown_terms_top30")
    for term, count in unknown_terms.most_common(30):
        print(f"{term},{count}")
    if no_hit_examples:
        print()
        print("no_hit_examples")
        for example in no_hit_examples:
            print(example)


if __name__ == "__main__":
    main()
