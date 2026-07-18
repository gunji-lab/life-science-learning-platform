#!/usr/bin/env python3
"""Evaluate the two-layer AI Research Compass JSON dictionaries.

This mirrors the public GitHub Pages implementation without using AI,
Sudachi, or a server-side API. It is intended for content QA when updating
general_dictionary.json, research_bridge.json, or lab_research_tags.json.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GENERAL = ROOT / "data" / "ai-compass" / "general_dictionary.json"
DEFAULT_BRIDGE = ROOT / "data" / "ai-compass" / "research_bridge.json"
DEFAULT_LAB_TAGS = ROOT / "data" / "ai-compass" / "lab_research_tags.json"
DEFAULT_LABS = ROOT / "data" / "labs.json"
DEFAULT_QUESTIONS = ROOT / "docs" / "ai_research_compass_test_questions.csv"

STOPWORDS = {
    "です",
    "ます",
    "して",
    "したい",
    "知りたい",
    "興味",
    "関心",
    "学び",
    "学びたい",
    "実験",
    "使い",
    "使いたい",
    "育てる",
    "研究",
    "大学",
    "生命科学",
    "について",
    "ついて",
    "どんな",
    "あります",
    "あり",
    "なり",
    "つな",
    "気になる",
    "好き",
    "生命科学部",
    "研究テーマ",
}


def normalize(text: str) -> str:
    text = (
        text.replace("癌", "がん")
        .replace("ガン", "がん")
        .replace("ＡＩ", "ai")
        .replace("ＤＮＡ", "dna")
    )
    text = text.lower().replace("　", " ")
    return re.sub(r"[、。,.!?！？「」『』（）()\[\]【】・/／\\\s]", "", text)


def input_terms(text: str) -> set[str]:
    whole = normalize(text)
    rough_terms = re.split(
        r"(?:について|が(?!ん)|を|に|へ|で|と|の|は|も|や|って|です|ます|した|したい|たい|好き|興味|気になる|面白い|面白そう|知りたい|ありますか|から|まで|[\s、。,.!?！？「」『』（）()\[\]【】・/／\\]+)",
        text,
    )
    terms = {whole}
    terms.update(normalize(term) for term in rough_terms if len(normalize(term)) >= 2)
    return {term for term in terms if term and term not in {"あり", "ある", "する", "なる", "いる", "これ", "それ"}}


def is_short_kana_term(value: str) -> bool:
    return len(value) <= 2 and bool(re.fullmatch(r"[ぁ-んァ-ヶー]+", value))


def matches_candidate(normalized: str, terms: set[str], candidate: str) -> bool:
    normalized_candidate = normalize(candidate)
    if not normalized_candidate:
        return False
    if normalized_candidate in terms:
        return True
    if is_short_kana_term(normalized_candidate) and normalized_candidate != "がん":
        return False
    return normalized_candidate in normalized


def can_use_substring_match(normalized_term: str) -> bool:
    return normalized_term == "がん" or len(normalized_term) > 2 or not is_short_kana_term(normalized_term)


def is_specific_term(normalized_term: str) -> bool:
    broad_terms = {
        "動物",
        "植物",
        "微生物",
        "細胞",
        "健康",
        "医療",
        "環境",
        "材料",
        "実験",
        "解析",
        "観察",
        "測定",
        "研究",
        "生物",
        "生命科学",
    }
    if normalized_term in broad_terms:
        return False
    if normalized_term == "がん":
        return True
    if re.fullmatch(r"[a-z0-9]+", normalized_term, re.IGNORECASE):
        return len(normalized_term) >= 3
    return len(normalized_term) >= 4 or bool(re.search(r"[ァ-ヶー]{3,}", normalized_term))


def direct_term_multiplier(normalized_term: str, exact_hit: bool) -> int:
    if is_specific_term(normalized_term):
        return 25 if exact_hit else 12
    return 4 if exact_hit else 2


def rough_input_terms(text: str) -> set[str]:
    rough_terms = re.split(
        r"(?:について|が(?!ん)|を|に|へ|で|と|の|は|も|や|って|です|ます|した|したい|たい|好き|興味|関心|学びたい|学び|実験|使いたい|使い|育てる|気になる|面白い|面白そう|知りたい|ありますか|から|まで|[\s、。,.!?！？「」『』（）()\[\]【】・/／\\]+)",
        text,
    )
    return {normalize(term) for term in rough_terms if len(normalize(term)) >= 2}


def read_json(path: Path) -> list[dict[str, object]]:
    return json.loads(path.read_text(encoding="utf-8"))


def match_dictionary(text: str, dictionary: list[dict[str, object]]) -> tuple[Counter[str], list[dict[str, object]], list[str]]:
    normalized = normalize(text)
    input_term_set = input_terms(text)
    matched_forms: set[str] = set()
    concept_scores: Counter[str] = Counter()
    detected: list[dict[str, object]] = []

    for entry in dictionary:
        keyword = str(entry.get("keyword", ""))
        aliases = [str(alias) for alias in entry.get("aliases", [])]
        candidates = [keyword, *aliases]
        normalized_terms = [normalize(term) for term in candidates if normalize(term)]
        if not any(matches_candidate(normalized, input_term_set, term) for term in normalized_terms):
            continue
        weight = int(entry.get("weight", 3) or 3)
        for term in normalized_terms:
            matched_forms.add(term)
        for concept in entry.get("concepts", []):
            concept_scores[str(concept)] += weight
        detected.append({"keyword": keyword, "concepts": entry.get("concepts", [])})

    unknown = []
    for clean in rough_input_terms(text):
        if not clean or clean in STOPWORDS:
            continue
        if any(clean in term or term in clean for term in matched_forms):
            continue
        unknown.append(clean)
    return concept_scores, detected, unknown


def map_to_research_tags(concept_scores: Counter[str], bridge: list[dict[str, object]]) -> Counter[str]:
    research_scores: Counter[str] = Counter()
    bridge_by_concept = {str(entry.get("concept")): entry for entry in bridge}
    for concept, concept_weight in concept_scores.items():
        entry = bridge_by_concept.get(concept)
        if not entry:
            continue
        for tag_item in entry.get("research_tags", []):
            tag = str(tag_item.get("tag", ""))
            weight = float(tag_item.get("weight", 1) or 1)
            if tag:
                research_scores[tag] += concept_weight * weight
    return research_scores


def score_labs(
    text: str,
    concept_scores: Counter[str],
    research_scores: Counter[str],
    lab_tags: list[dict[str, object]],
    labs: list[dict[str, object]],
) -> list[tuple[float, dict[str, object], list[str]]]:
    normalized = normalize(text)
    terms = input_terms(text)
    labs_by_id = {str(lab.get("id")): lab for lab in labs}
    scored: list[tuple[float, dict[str, object], list[str]]] = []

    for record in lab_tags:
        lab = labs_by_id.get(str(record.get("lab_id")))
        if not lab:
            continue
        matched: Counter[str] = Counter()
        score = 0.0

        for keyword in record.get("keywords", []):
            normalized_keyword = normalize(str(keyword))
            if normalized_keyword and (normalized_keyword in terms or (can_use_substring_match(normalized_keyword) and normalized_keyword in normalized)):
                value = 3 * direct_term_multiplier(normalized_keyword, normalized_keyword in terms)
                score += value
                matched[str(keyword)] += value

        for tag_item in record.get("research_tags", []):
            tag = str(tag_item.get("tag", ""))
            lab_weight = float(tag_item.get("weight", 1) or 1)
            normalized_tag = normalize(tag)
            if normalized_tag and (normalized_tag in terms or (can_use_substring_match(normalized_tag) and normalized_tag in normalized)):
                value = (5 + lab_weight) * direct_term_multiplier(normalized_tag, normalized_tag in terms)
                score += value
                matched[tag] += value
                continue
            if research_scores.get(tag):
                value = research_scores[tag] * lab_weight
                score += value
                matched[tag] += value
            if concept_scores.get(tag):
                value = concept_scores[tag] * max(1.0, lab_weight * 0.6)
                score += value
                matched[tag] += value

        if score:
            scored.append((score, lab, [tag for tag, _ in matched.most_common()]))

    scored.sort(key=lambda item: (-item[0], item[1].get("department", ""), item[1].get("lab_name", "")))
    return scored


def evaluate_examples(args: argparse.Namespace) -> None:
    dictionary = read_json(args.general)
    bridge = read_json(args.bridge)
    lab_tags = read_json(args.lab_tags)
    labs = read_json(args.labs)
    examples = [
        "ウマの骨や筋肉に興味があります",
        "ペンギンの泳ぎ方と骨が気になります",
        "乳酸菌や発酵食品が好きです",
        "桜や植物の香りが好きです",
        "カピバラが好きです",
        "癌について研究したいです",
        "ガン転移に関わる研究が気になります",
    ]

    for text in examples:
        concepts, detected, unknown = match_dictionary(text, dictionary)
        research = map_to_research_tags(concepts, bridge)
        scored = score_labs(text, concepts, research, lab_tags, labs)
        print(f"input,{text}")
        print("detected_terms," + "|".join(str(item["keyword"]) for item in detected))
        print("concepts," + "|".join(term for term, _ in concepts.most_common(8)))
        print("research_tags," + "|".join(term for term, _ in research.most_common(8)))
        print("unknown_terms," + "|".join(unknown))
        for score, lab, matched in scored[: args.top]:
            print(f"top_lab,{lab.get('lab_name')},{score:.1f},{'|'.join(matched[:6])}")
        print()


def evaluate_questions(args: argparse.Namespace) -> None:
    dictionary = read_json(args.general)
    bridge = read_json(args.bridge)
    lab_tags = read_json(args.lab_tags)
    labs = read_json(args.labs)
    questions = list(csv.DictReader(args.questions.open(newline="", encoding="utf-8")))
    topic_total: Counter[str] = Counter()
    topic_hit: Counter[str] = Counter()
    unknown_terms: Counter[str] = Counter()
    lab_top_hits: Counter[str] = Counter()

    for row in questions:
        text = row["sample_input"]
        topic = row.get("topic_group", "unknown")
        topic_total[topic] += 1
        concepts, _, unknown = match_dictionary(text, dictionary)
        research = map_to_research_tags(concepts, bridge)
        scored = score_labs(text, concepts, research, lab_tags, labs)
        for term in unknown:
            unknown_terms[term] += 1
        if scored:
            topic_hit[topic] += 1
            for _, lab, _ in scored[: args.top]:
                lab_top_hits[str(lab.get("lab_name", lab.get("id", "unknown")))] += 1

    total = len(questions)
    print(f"questions,{total}")
    print(f"general_dictionary_entries,{len(dictionary)}")
    print(f"research_bridge_entries,{len(bridge)}")
    print(f"lab_research_tag_records,{len(lab_tags)}")
    print(f"hit_rate,{sum(topic_hit.values()) / total:.3f}")
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--general", type=Path, default=DEFAULT_GENERAL)
    parser.add_argument("--bridge", type=Path, default=DEFAULT_BRIDGE)
    parser.add_argument("--lab-tags", type=Path, default=DEFAULT_LAB_TAGS)
    parser.add_argument("--labs", type=Path, default=DEFAULT_LABS)
    parser.add_argument("--questions", type=Path, default=DEFAULT_QUESTIONS)
    parser.add_argument("--top", type=int, default=3)
    parser.add_argument("--examples", action="store_true", help="Show detailed checks for representative inputs.")
    args = parser.parse_args()
    if args.examples:
        evaluate_examples(args)
    else:
        evaluate_questions(args)


if __name__ == "__main__":
    main()
