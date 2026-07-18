# AI Research Compass β

AI Research Compass βは、利用者の自由入力を研究キーワードへ翻訳する辞書ベース検索です。

利用者側では生成AIを使いません。現在版は、一般知識辞書と研究接続辞書を分けた静的JSONを主辞書とし、入力ログを見ながら辞書を育てていくβ版として実装しています。

## 主要ファイル

- `data/ai_research_dictionary.csv`
  - 以前の質問由来辞書です。現在版では主辞書ではなく、後方互換・比較検証用として残します。
- `data/ai_lab_dictionary.csv`
  - 以前の研究室検索語CSVです。現在版では補助・比較検証用として残します。
- `data/ai-compass/general_dictionary.json`
  - 高校生が入力しそうな一般語を、上位概念へ変換する一般知識辞書です。
- `data/ai-compass/general-dictionary-sources/`
  - 一般知識辞書の元データです。動物名、植物名、健康、食品、環境、趣味、進路、実験方法などカテゴリ別に管理します。
- `data/ai-compass/research_bridge.json`
  - 一般概念を、My Labの研究タグへ接続する研究接続辞書です。
- `data/ai-compass/lab_research_tags.json`
  - 研究室ごとの検索用研究タグ、重み、根拠を管理します。カード表示用の短いキーワードとは別に、AI Compass用として広めに持ちます。
- `data/ai-compass/lab-keyword-sources.json`
  - 研究室紹介ページ、教員紹介、researchmap、学会要旨などで確認した追加語を研究室ごとに管理します。
- `data/ai_compass_logging_config.json`
  - Google Apps Scriptへ匿名ログを送信するための設定です。URL未設定時は送信しません。
- `docs/ai_research_compass_seed_questions.csv`
  - 高校生・大学生が入力しそうな自然文サンプル1000件です。
- `docs/ai_research_compass_test_questions.csv`
  - 1000件の自然文サンプルに、作成方針、トピック分類、想定タグを付けた検証用CSVです。
- `tools/evaluate_ai_compass.py`
  - 旧CSV辞書の比較検証用スクリプトです。
- `tools/evaluate_ai_compass_two_layer.py`
  - 現在の2層JSON辞書に1000件を通し、ヒット率、トピック別ヒット、上位表示研究室、未登録語候補を確認します。
- `tools/build_general_dictionary.py`
  - カテゴリ別の `general-dictionary-sources/*.json` を統合し、公開サイト用の `general_dictionary.json` を生成します。
- `tools/build_lab_research_tags.py`
  - `labs.json`、一般辞書、旧CSV、確認済み追加語から、公開サイト用の `lab_research_tags.json` を生成します。
- `tools/build_lab_keyword_sources.py`
  - `labs.json` と旧ラボ辞書CSVから、全研究室ぶんの `lab-keyword-sources.json` の初期候補を生成します。
- `js/ai-compass/`
  - 入力正規化、一般辞書照合、概念から研究タグへの変換、研究室スコア計算、未知語抽出を分離した公開サイト用モジュールです。
- `app.js`
  - 既存UIとの接続、データ読み込み、ログ保存を行います。検索ロジック本体は `js/ai-compass/` に分離しています。

## 現在の検索構造

現在版のAI Research Compass βは、以下の2層JSON辞書を主検索に使います。

```text
自由入力
↓
一般知識辞書 general_dictionary.json
例: ウマ → 哺乳類・動物・脊椎動物
↓
研究接続辞書 research_bridge.json
例: 哺乳類 → 比較解剖学・形態学・バイオメカニクス
↓
研究室タグ lab_research_tags.json
↓
おすすめ研究室
```

検索時に生成AI、Sudachi、外部API、Pythonサーバーは使用しません。公開サイトでは静的JSONとJavaScriptだけで動きます。

## 一般知識辞書JSON

```json
{
  "keyword": "ウマ",
  "aliases": ["馬", "うま", "競走馬", "サラブレッド"],
  "concepts": ["哺乳類", "動物", "脊椎動物"]
}
```

- `keyword`: 代表語。
- `aliases`: 表記ゆれ、別名、高校生が使いそうな言い換え。
- `concepts`: 研究タグへ橋渡しする上位概念。

`general_dictionary.json` は直接編集せず、原則として `general-dictionary-sources/` のカテゴリ別JSONを編集してから次のコマンドで再生成します。

```bash
python3 Mylab_gamma/tools/build_general_dictionary.py
```

現在のカテゴリ:

- `animals.json`: 動物名、水族館・動物園、野生動物など。
- `plants.json`: 植物名、作物、森林、園芸、光合成など。
- `health.json`: 病気、健康、医療、リハビリ、美容、免疫など。
- `food.json`: 発酵食品、食品ロス、栄養、食品開発など。
- `environment.json`: 環境問題、生態系、水質、保全、極限環境など。
- `hobbies_sports.json`: 部活、スポーツ、ゲーム、ものづくり、アウトドアなど。
- `career_learning.json`: 進路相談語、仕事、学び方の不安など。
- `experiments_methods.json`: 顕微鏡、DNA実験、培養、画像解析、センサ開発など。

## 研究接続辞書JSON

```json
{
  "concept": "哺乳類",
  "research_tags": [
    { "tag": "比較解剖学", "weight": 3 },
    { "tag": "形態学", "weight": 3 },
    { "tag": "動物行動", "weight": 2 }
  ]
}
```

- `concept`: 一般知識辞書から来る上位概念。
- `research_tags`: My Lab側の研究タグと重み。

## 研究室タグJSON

```json
{
  "lab_id": "gunji",
  "lab_name": "動物機能形態学研究室",
  "faculty_name": "郡司 芽久",
  "research_tags": [
    { "tag": "比較解剖学", "weight": 5 },
    { "tag": "形態学", "weight": 5 }
  ],
  "keywords": ["キリン", "鳥", "骨", "筋肉", "動物園"],
  "source_urls": []
}
```

研究室タグは、研究室ホームページ、教員紹介、学会要旨、researchmap、論文タイトル、KAKEN等の実情報から作成・確認していきます。

表示用の `labs.json` の `keywords` は3〜10語程度の見やすい語に抑え、AI Compass用の `lab_research_tags.json` は検索に必要な語を広く持ちます。研究室紹介ページ本文や教員ページで確認できる語は、`data/ai-compass/lab-keyword-sources.json` に追加してから次のコマンドで再生成します。

```bash
python3 Mylab_gamma/tools/build_lab_keyword_sources.py
python3 Mylab_gamma/tools/build_lab_research_tags.py
```

## 旧共通辞書CSV

```csv
word,synonym,tag,weight
骨,,骨格,5
恐竜,化石,進化,5
ゲーム,ゲーム制作|プログラミング,データ解析,3
```

- `word`: 入力文の中で探す語。
- `synonym`: `|` 区切りで同義語を入れます。
- `tag`: 研究室辞書や `labs.json` の語と照合しやすい日本語タグを使います。
- `weight`: 1〜5を目安にします。

このCSVは、現在版では主辞書ではありません。2層JSON辞書が読み込めなかった場合の後方互換、または旧方式との比較検証に使います。

## 研究室辞書CSV

```csv
lab_id,word,synonym,field,weight,source,needs_review
ito-m,野生動物,野外動物|フィールド動物,target,5,official_lab_url,false
ito-m,ロガー,データロガー|行動記録,method,5,official_lab_url,false
gunji,骨格,骨|骨格標本|からだの形,field,5,official_lab_url,false
```

- `lab_id`: `labs.json` の研究室ID。
- `word`: その研究室に結びつけたい研究語。
- `synonym`: 高校生が入力しそうな言い換え。`|` 区切り。
- `field`: `target`、`field`、`method`、`keyword`、`page_phrase` などの分類。
- `weight`: 1〜5を目安にします。研究室の核になる語は5、補助語は2〜3。
- `source`: 公式研究室紹介ページなど、語の根拠。
- `needs_review`: 教員確認が必要な語は `true`。

このCSVも、現在版では主スコアではありません。研究室スコアは `data/ai-compass/lab_research_tags.json` を中心に計算し、旧CSVは後方互換・比較検証用として残します。

```text
入力文
↓
共通辞書で研究語へ変換
↓
入力文そのもの + 変換タグを研究室辞書に照合
↓
研究室ごとにスコア計算
↓
おすすめ理由として一致語を表示
```

## ログ

ログはブラウザの `localStorage` に保存し、`data/ai_compass_logging_config.json` が有効な場合はGoogle Apps Scriptへ匿名送信します。

保存項目:

- 入力文章
- 抽出タグ
- 未登録語
- 表示研究室
- クリック研究室
- 👍 / 👎

個人情報を入力しない前提で、辞書改善の手がかりとして使います。

My Lab本体には教員向け管理画面を置かず、スプレッドシート側で教員ダッシュボードとして集計・分析します。

GAS連携の詳細は `docs/gas-ai-compass-logging.md` を参照してください。

## 辞書育成

「辞書育成支援ページ」に未登録語ランキングとクリック数ランキングを表示します。

未登録語を確認し、必要なものだけ `data/ai-compass/general-dictionary-sources/` の該当カテゴリ、または `data/ai-compass/research_bridge.json` に追記してください。カテゴリ別ソースを編集した場合は、`tools/build_general_dictionary.py` で `general_dictionary.json` を再生成します。

研究室の出方が弱い場合は、`data/ai-compass/lab-keyword-sources.json` にその研究室の語や研究タグを追記し、`tools/build_lab_research_tags.py` で `lab_research_tags.json` を再生成してください。`lab_research_tags.json` は生成物なので、原則として直接編集しません。

判断に迷う語は、ChatGPT等に次のように依頼します。

```text
My Labタグ体系に合わせて「クラゲ」を分類してください。
既存の general_dictionary.json / research_bridge.json / lab-keyword-sources.json に寄せて、追記候補をJSON形式で出してください。
```

## 注意点

- 研究室推薦そのものをAIに任せない。
- JSONだけ更新すれば検索精度が改善する構造を維持する。
- 広すぎる語だけを登録しない。
- 一般知識辞書は広めの翻訳、研究接続辞書は研究タグへの橋渡し、研究室タグは研究室ごとの具体語を優先する。
- 未登録語が出ることはβ版の目的の一部なので、無理にすべてを最初から埋めない。

## 1000件テスト

質問例は、3学科の公式ページと研究室一覧から見える研究領域をもとに作成しています。

- 生命科学科: 動物、脳神経、細胞、遺伝子、微生物、環境、生態、フィールド、生物多様性
- 生体医工学科: 医療、リハビリ、運動、QOL、医療機器、データ、工学、福祉、からだの計測
- 生物資源学科: 植物、農業、食品、香り、資源、微生物、発酵、環境、化学物質

Yahoo知恵袋などの公開Q&Aは、質問文をコピーせず、「進路に迷う」「生命科学で何を学ぶかわからない」「生物は好きだが化学・物理が不安」「がん研究や医療研究に進みたい」といった相談の型だけを参考にし、My Lab用の新しい自然文として作成します。

ローカルで検証する場合:

```bash
python3 Mylab_gamma/tools/evaluate_ai_compass_two_layer.py
python3 Mylab_gamma/tools/evaluate_ai_compass_two_layer.py --examples
```

主に確認する項目:

- 全体ヒット率
- トピック別ヒット率
- 研究室ごとのTOP3出現回数
- 未登録語ランキング
- ヒットしなかった質問例

未登録語が多い領域は、`data/ai-compass/general-dictionary-sources/` に `keyword,aliases,concepts,weight` を追記し、`tools/build_general_dictionary.py` で再生成してから再検証します。

一般概念から研究タグへの接続が弱い場合は、`data/ai-compass/research_bridge.json` を調整します。

特定の研究室が出にくい場合は、`data/ai-compass/lab-keyword-sources.json` に確認済み語を追記し、`tools/build_lab_research_tags.py` で再生成してから再検証します。

## URL

My Labは `index.html` 1枚の構成を維持しつつ、ハッシュURLで各タブを直接開けます。

- `#home`
- `#interest`
- `#ai-compass`
- `#ai-admin`
- `#labs`
- `#visitors`
- `#favorites`

GitHub Pagesでもそのまま動き、URL共有やブラウザの戻る・進む操作に対応します。
