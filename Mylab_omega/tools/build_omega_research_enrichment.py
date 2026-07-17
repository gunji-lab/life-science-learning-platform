#!/usr/bin/env python3
import csv
import html
import json
import random
import re
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DOCS = ROOT / "docs"
UA = "Mozilla/5.0 (compatible; MyLabOmegaResearchCompass/0.2)"

RESEARCH_VOCAB = [
    "哲学", "倫理", "思想", "宗教", "価値観", "論理", "対話", "テキスト読解", "東洋思想", "仏教",
    "インド哲学", "中国思想", "日本文学", "日本文化", "古典", "現代文学", "創作", "編集", "出版",
    "英語", "英米文学", "異文化理解", "翻訳", "通訳", "言語", "コミュニケーション", "歴史", "史料",
    "日本史", "東洋史", "西洋史", "文化財", "考古学", "地域史", "教育", "学校", "教職", "授業",
    "小学校教員", "人間発達", "生涯学習", "子ども", "保育", "心理", "学習支援",
    "経済", "金融", "財政", "市場", "統計", "データ分析", "政策", "国際経済", "貿易", "開発",
    "グローバル", "経営", "企業", "組織", "会計", "ファイナンス", "マーケティング", "広告",
    "ブランド", "商品企画", "消費者行動", "法律", "民法", "刑法", "憲法", "行政", "公務員",
    "企業法", "知的財産", "社会学", "社会調査", "メディア", "SNS", "ジャーナリズム", "情報発信",
    "国際社会", "多文化", "移民", "ジェンダー", "社会心理", "人間関係", "地域", "まちづくり",
    "観光", "旅行", "ホテル", "ホスピタリティ", "地域振興", "国際協力", "開発支援", "文化交流",
    "イノベーション", "起業", "リーダーシップ", "英語教育", "留学", "インターンシップ",
    "情報", "プログラミング", "AI", "人工知能", "データサイエンス", "機械学習", "ICT", "IoT",
    "ネットワーク", "セキュリティ", "システム", "アプリ", "ゲーム", "コンテンツ", "メディア情報",
    "心理情報", "スポーツ情報", "シミュレーション", "UX", "デザイン", "人間中心設計",
    "福祉", "社会福祉", "相談支援", "高齢者", "障害", "共生", "介護", "子育て", "児童福祉",
    "人間環境", "住まい", "建築", "空間", "インテリア", "プロダクトデザイン", "ユニバーサルデザイン",
    "スポーツ", "運動", "健康", "筋肉", "トレーニング", "運動生理", "コーチング", "栄養", "食事",
    "管理栄養士", "予防", "食品", "機械", "ロボット", "ものづくり", "材料", "エネルギー", "自動車",
    "航空", "電気", "電子", "通信", "半導体", "回路", "制御", "化学", "応用化学", "有機化学",
    "無機化学", "高分子", "触媒", "環境化学", "都市", "都市計画", "交通", "防災", "水環境",
    "インフラ", "土木", "構造", "設計", "気候変動", "地球温暖化", "サステナビリティ", "環境政策",
    "資源循環", "再生可能エネルギー", "脱炭素", "生命科学", "生物学", "細胞", "遺伝子", "DNA",
    "ゲノム", "タンパク質", "酵素", "微生物", "細菌", "ウイルス", "発酵", "免疫", "神経", "脳",
    "ホルモン", "生理学", "毒性", "放射線", "生態", "生物多様性", "環境保全", "水質", "動物",
    "動物園", "哺乳類", "鳥類", "魚類", "昆虫", "骨格", "筋肉", "運動", "行動", "進化", "形態",
    "解剖", "比較解剖", "フィールドワーク", "野外調査", "標本", "博物館", "化石", "絶滅動物",
    "植物", "作物", "稲", "米", "農業", "園芸", "森林", "土壌", "種子", "光合成", "植物病理",
    "植物化学", "香り", "生物資源", "食糧問題", "環境問題", "バイオマス", "生体医工学", "医療",
    "医療機器", "医用材料", "再生医療", "細胞工学", "バイオセンサ", "生体信号", "リハビリ",
    "バイオメカニクス", "臨床工学", "検査", "ヘルスケア", "QOL", "薬", "創薬", "診断", "治療",
    "食", "食環境", "食品安全", "食品機能", "フードシステム", "食文化", "食品ロス", "フードデータ",
    "食ビジネス", "健康栄養", "臨床栄養", "公衆栄養",
]

EVERYDAY_SYNONYMS = {
    "動物園": ["動物園が好き", "飼育員", "動物の動き", "キリン", "ゾウ", "水族館"],
    "骨格": ["骨", "骨を見るのが好き", "恐竜の骨", "標本"],
    "進化": ["恐竜", "化石", "絶滅動物", "生き物の歴史"],
    "DNA": ["遺伝", "遺伝子", "親子で似る", "ゲノム"],
    "微生物": ["菌", "ばい菌", "発酵食品", "ヨーグルト", "納豆"],
    "植物": ["花", "野菜", "農業", "米", "稲", "森"],
    "医療機器": ["医療ロボット", "検査機械", "病院の機械"],
    "生体信号": ["心拍", "脳波", "体のデータ", "ウェアラブル"],
    "バイオメカニクス": ["筋トレ", "走る仕組み", "体の動き", "スポーツ科学"],
    "環境": ["地球温暖化", "環境問題", "自然を守る", "SDGs"],
    "食": ["料理", "食品", "食べ物", "栄養", "フードロス"],
    "データサイエンス": ["データ", "AI", "分析", "統計"],
    "建築": ["家", "建物", "空間", "設計"],
    "まちづくり": ["地域を元気にしたい", "地方創生", "観光地"],
    "福祉": ["人を支えたい", "介護", "相談に乗る仕事", "バリアフリー"],
    "教育": ["先生", "学校", "子どもに教えたい", "授業"],
    "心理": ["人の気持ち", "性格", "人間関係", "こころ"],
    "経済": ["お金", "景気", "投資", "社会の仕組み"],
    "マーケティング": ["商品企画", "広告", "SNSで売る", "ブランド"],
    "法律": ["裁判", "ルール", "公務員", "社会を守る"],
    "観光": ["旅行", "ホテル", "地域の魅力", "外国人観光客"],
    "英語": ["海外", "留学", "英会話", "翻訳"],
    "歴史": ["歴史が好き", "史料", "文化財", "日本史"],
}

QUESTION_TEMPLATES = [
    "{term}が好きです。東洋大学ではどの学科につながりますか。",
    "{term}に興味があります。大学で深く学ぶならどこが近いですか。",
    "高校で{term}が面白いと思いました。研究につながりますか。",
    "{term}を使って社会に役立つことをしたいです。",
    "{term}と{other}の両方が気になります。",
    "将来は{term}に関わる仕事がしたいです。",
    "{term}を研究するならどの学科を見ればよいですか。",
    "{term}が好きですが、文系理系どちらで考えたらよいですか。",
    "{term}を学ぶ学科の雰囲気を知りたいです。",
    "まだ進路は決まっていないけれど、{term}が少し気になります。",
    "{term}が日常生活とどうつながるのか知りたいです。",
    "{term}を大学で研究できるなら見てみたいです。",
]

BAD_TERM_FRAGMENTS = [
    "私", "当研究室", "本研究室", "この研究室", "研究室行事", "指導教員", "他大学", "動画は",
    "実験系", "理論系", "希望すれば", "一緒に", "そこで", "このよう", "4年次", "2025年",
    "何を", "こうした", "そして", "それによって", "では同一", "もちろん", "教員や",
    "が当", "また当", "大学の", "研究を含めた", "行事を通じて", "は2020",
]


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.links = []
        self._skip = False
        self._current = None

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self._skip = True
        if tag == "a":
            self._current = {"href": dict(attrs).get("href", ""), "text": ""}

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self._skip = False
        if tag == "a" and self._current:
            self.links.append(self._current)
            self._current = None

    def handle_data(self, data):
        if self._skip:
            return
        if self._current is not None:
            self._current["text"] += data
        self.text.append(data)


def normalize(text):
    return re.sub(r"\s+", "", str(text).lower().replace("　", " "))


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as res:
        raw = res.read()
    charset = "utf-8"
    m = re.search(br"charset=([A-Za-z0-9_-]+)", raw[:2000])
    if m:
        charset = m.group(1).decode("ascii", "ignore")
    return raw.decode(charset, "ignore")


def parse_page(url):
    parser = TextParser()
    parser.feed(fetch(url))
    text = clean_official_text(html.unescape(" ".join(parser.text)))
    links = []
    for link in parser.links:
        href = link["href"].strip()
        if not href:
            continue
        full = urllib.parse.urljoin(url, href)
        if not full.startswith("https://www.toyo.ac.jp/nyushi/"):
            continue
        links.append({"url": full.split("#")[0], "text": re.sub(r"\s+", " ", link["text"]).strip()})
    return text, links


def clean_official_text(text):
    text = re.sub(r"\s+", " ", text)
    # Toyo official pages include a large shared navigation block before the actual page body.
    # Keeping text after the last menu marker removes most unrelated faculty names.
    menu_pos = text.rfind("メニュー ")
    if menu_pos >= 0:
        text = text[menu_pos + len("メニュー ") :]
    # Related article/video blocks after the main body often contain all-faculty keywords.
    for marker in ["入試前に", "Feature Contents", "おすすめ記事", "関連コンテンツ"]:
        pos = text.find(marker)
        if pos > 0:
            text = text[:pos]
    return text.strip()


def discover_program_sources(program):
    base = program["official_url"]
    sources = [base]
    try:
        text, links = parse_page(base)
    except Exception:
        return sources
    for link in links:
        label = f"{link['text']} {link['url']}".lower()
        if "/column/video-lecture/" in link["url"] or "/column/toyo-lab/" in link["url"]:
            continue
        if "/laboratory/" in link["url"] or any(k in label for k in ["研究室", "研究紹介"]):
            sources.append(link["url"])
    # If the department follows the nyushi laboratory convention, try it even when the link is hidden.
    if base.endswith("/") and "/undergraduate/" in base:
        sources.append(urllib.parse.urljoin(base, "laboratory/"))
    sources = list(dict.fromkeys(sources))

    expanded = []
    for url in sources[:12]:
        expanded.append(url)
        if "/laboratory/" not in url:
            continue
        try:
            _, links = parse_page(url)
        except Exception:
            continue
        for link in links:
            if "/laboratory/" in link["url"] and link["url"].rstrip("/") != url.rstrip("/"):
                expanded.append(link["url"])
        time.sleep(0.05)
    return list(dict.fromkeys(expanded))[:36]


def extract_terms(text, program):
    norm_text = normalize(text)
    scores = {}

    def add(term, score):
        term = str(term).strip(" ・、。,.")
        if len(term) < 2 or len(term) > 24:
            return
        if any(x in term for x in ["東洋大学", "入試情報", "メニュー", "ログイン", "学部学科"]):
            return
        if any(x in term for x in BAD_TERM_FRAGMENTS):
            return
        if term.endswith(("の", "が", "を", "に", "は", "で", "と")):
            return
        if term.endswith("研究室") and not re.search(r"(学|工学|科学|生物|動物|植物|細胞|神経|環境|情報|材料|機械|ロボット|設計|心理|栄養|食品|法|史|論|文化|経済|経営|福祉|観光|デザイン)研究室$", term):
            return
        scores[term] = max(scores.get(term, 0), score)

    for term in RESEARCH_VOCAB:
        count = norm_text.count(normalize(term))
        if count:
            add(term, count * 3 + min(len(term), 10) * 0.2)
    labs = re.findall(r"([一-龯ぁ-んァ-ヶA-Za-z0-9・ー]{2,24}研究室)", text)
    for lab in labs:
        if not any(skip in lab for skip in ["研究室紹介", "この研究室"]):
            add(lab, 80)
            add(lab.replace("研究室", ""), 55)
    # Extract compact academic phrases that frequently appear in official headings.
    chunks = re.findall(r"[一-龯ぁ-んァ-ヶA-Za-z0-9・ー]{2,18}(?:学|論|法|工学|科学|情報|政策|設計|解析|分析|支援|開発|デザイン|システム)", text)
    for chunk in chunks:
        if re.search(r"(が|を|に|は|で|も|と|の|や|へ|から|まで|です|ます|した|する|され|れる|られる)", chunk):
            continue
        count = norm_text.count(normalize(chunk))
        if count:
            add(chunk, count * 1.5 + 1)
    for term in program.get("tags", []) + program.get("areas", []) + program.get("policy_keywords", []) + program.get("research_keywords", []):
        add(term, scores.get(term, 0) + 35)
    seen = set()
    out = []
    for term, _ in sorted(scores.items(), key=lambda x: (-x[1], x[0])):
        key = normalize(term)
        if key in seen:
            continue
        seen.add(key)
        out.append(term)
    return out


def make_synonyms(term):
    syns = [f"{term}が好き", f"{term}に興味", f"{term}を学びたい", f"{term}が気になる"]
    syns.extend(EVERYDAY_SYNONYMS.get(term, []))
    return "|".join(dict.fromkeys(syns))


def load_csv(path):
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path, fieldnames, rows):
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def rebuild_program_dictionary(programs, research_records):
    path = DATA / "program_dictionary.csv"
    rows = load_csv(path)
    rows = [r for r in rows if r.get("field") not in {"official_page", "research_page", "lab_name", "extracted_research"}]
    seen = {(r["program_id"], r["word"], r["field"]) for r in rows}
    for record in research_records:
        program = record["program"]
        source_terms = record["terms"][:80]
        for i, term in enumerate(source_terms):
            field = "lab_name" if term.endswith("研究室") else "research_page"
            if (program["id"], term, field) in seen:
                continue
            seen.add((program["id"], term, field))
            rows.append({
                "program_id": program["id"],
                "word": term,
                "synonym": make_synonyms(term),
                "field": field,
                "weight": "6" if field == "lab_name" else ("5" if i < 25 else "4"),
                "source": record["primary_source"],
                "needs_review": "True",
            })
    write_csv(path, ["program_id", "word", "synonym", "field", "weight", "source", "needs_review"], rows)


def rebuild_common_dictionary(research_records):
    path = DATA / "common_dictionary.csv"
    rows = load_csv(path)
    seen = {(r["word"], r["tag"]) for r in rows}
    for term, syns in EVERYDAY_SYNONYMS.items():
        if (term, term) not in seen:
            rows.append({"word": term, "synonym": "|".join(syns), "tag": term, "weight": "5"})
            seen.add((term, term))
    for record in research_records:
        for term in record["terms"][:50]:
            if (term, term) in seen:
                continue
            rows.append({"word": term, "synonym": make_synonyms(term), "tag": term, "weight": "4"})
            seen.add((term, term))
    write_csv(path, ["word", "synonym", "tag", "weight"], rows)


def update_program_tags(programs, research_records):
    by_id = {r["program"]["id"]: r for r in research_records}
    for program in programs:
        terms = by_id.get(program["id"], {}).get("terms", [])
        merged = list(dict.fromkeys(program.get("tags", []) + terms[:24]))
        program["tags"] = merged[:36]
        program["research_keywords"] = list(dict.fromkeys(program.get("research_keywords", []) + terms[:36]))[:56]
        program["needs_review"] = True
        program["review_note"] = "公式の学科ページ・研究室紹介ページ・Web体験授業欄から抽出した研究語彙を追加したドラフトです。正式運用前に各学科で確認してください。"
    (DATA / "programs.json").write_text(json.dumps(programs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def generate_questions(programs):
    rng = random.Random(20260717)
    rows = []
    per_program = 220
    for program in programs:
        terms = list(dict.fromkeys(program.get("tags", []) + program.get("areas", []) + program.get("research_keywords", [])))
        terms = [t for t in terms if 2 <= len(t) <= 18]
        if not terms:
            terms = [program["department"], program["faculty"]]
        for i in range(per_program):
            term = terms[i % len(terms)]
            other = terms[(i * 7 + 3) % len(terms)]
            template = QUESTION_TEMPLATES[(i + len(program["id"])) % len(QUESTION_TEMPLATES)]
            rows.append({
                "sample_input": template.format(term=term, other=other),
                "source_type": "official_research_synthetic",
                "topic_hint": program["id"],
            })
    broad_patterns = [
        "理系に進みたいけれど、{term}も気になります。",
        "大学の研究で{term}を扱う学科はありますか。",
        "{term}が好きな高校生に合う学びを知りたいです。",
        "将来の仕事は未定ですが、{term}から進路を考えたいです。",
        "知恵袋で進路相談を見ていると{term}が気になりました。",
    ]
    all_terms = list(dict.fromkeys(t for p in programs for t in (p.get("tags", []) + p.get("areas", [])) if 2 <= len(t) <= 18))
    while len(rows) < 10000:
        term = rng.choice(all_terms)
        rows.append({
            "sample_input": rng.choice(broad_patterns).format(term=term),
            "source_type": "qa_style_synthetic",
            "topic_hint": "cross_program",
        })
    rng.shuffle(rows)
    rows = rows[:10000]
    write_csv(DOCS / "seed_questions.csv", ["sample_input", "source_type", "topic_hint"], rows)


def main():
    programs = json.loads((DATA / "programs.json").read_text(encoding="utf-8"))
    research_records = []
    for index, program in enumerate(programs, 1):
        sources = discover_program_sources(program)
        texts = []
        ok_sources = []
        for url in sources:
            try:
                text, _ = parse_page(url)
            except Exception:
                continue
            if len(text) > 200:
                texts.append(text)
                ok_sources.append(url)
            time.sleep(0.04)
        terms = extract_terms(" ".join(texts), program)
        research_records.append({
            "program": program,
            "sources": ok_sources,
            "primary_source": ok_sources[0] if ok_sources else program["official_url"],
            "terms": terms,
        })
        print(f"{index:02d}/{len(programs)} {program['department']}: sources={len(ok_sources)} terms={len(terms)}")
    update_program_tags(programs, research_records)
    rebuild_program_dictionary(programs, research_records)
    rebuild_common_dictionary(research_records)
    generate_questions(programs)
    payload = [
        {
            "program_id": r["program"]["id"],
            "faculty": r["program"]["faculty"],
            "department": r["program"]["department"],
            "sources": r["sources"],
            "extracted_terms": r["terms"],
        }
        for r in research_records
    ]
    (DATA / "research_sources.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
