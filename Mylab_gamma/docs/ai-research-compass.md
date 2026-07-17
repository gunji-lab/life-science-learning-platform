# AI Research Compass β

AI Research Compass βは、利用者の自由入力を研究キーワードへ翻訳する辞書ベース検索です。

利用者側では生成AIを使いません。検索辞書をCSVで管理し、入力ログを見ながら辞書を育てていくβ版として実装しています。

## 主要ファイル

- `data/ai_research_dictionary.csv`
  - 自由入力語、同義語、共通研究タグ、重みを管理します。
- `data/ai_lab_dictionary.csv`
  - 研究室ごとの検索語、同義語、重み、出典、要確認フラグを管理します。
- `data/ai_compass_logging_config.json`
  - Google Apps Scriptへ匿名ログを送信するための設定です。URL未設定時は送信しません。
- `docs/ai_research_compass_seed_questions.csv`
  - 高校生・大学生が入力しそうな自然文サンプル1000件です。
- `docs/ai_research_compass_test_questions.csv`
  - 1000件の自然文サンプルに、作成方針、トピック分類、想定タグを付けた検証用CSVです。
- `tools/evaluate_ai_compass.py`
  - 1000件を共通辞書と研究室辞書に通し、ヒット率、トピック別ヒット、上位表示研究室、未登録語候補を確認します。
- `app.js`
  - CSV読み込み、入力正規化、タグ抽出、研究室スコア計算、ログ保存を行います。

## 共通辞書CSV

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

検索では、研究室辞書を主スコアとして使い、既存の `labs.json` タグ照合は補助スコアとして残しています。

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

未登録語を確認し、必要なものだけ `data/ai_research_dictionary.csv` に追記してください。

研究室の出方が弱い場合は、`data/ai_lab_dictionary.csv` にその研究室の語や同義語を追記してください。

判断に迷う語は、ChatGPT等に次のように依頼します。

```text
My Labタグ体系に合わせて「クラゲ」を分類してください。
既存タグに寄せて、word,synonym,tag,weight 形式の候補を出してください。
```

## 注意点

- 研究室推薦そのものをAIに任せない。
- CSVだけ更新すれば検索精度が改善する構造を維持する。
- 広すぎる語だけを登録しない。
- 共通辞書は広めの翻訳、研究室辞書は研究室ごとの具体語を優先する。
- 未登録語が出ることはβ版の目的の一部なので、無理にすべてを最初から埋めない。

## 1000件テスト

質問例は、3学科の公式ページと研究室一覧から見える研究領域をもとに作成しています。

- 生命科学科: 動物、脳神経、細胞、遺伝子、微生物、環境、生態、フィールド、生物多様性
- 生体医工学科: 医療、リハビリ、運動、QOL、医療機器、データ、工学、福祉、からだの計測
- 生物資源学科: 植物、農業、食品、香り、資源、微生物、発酵、環境、化学物質

Yahoo知恵袋などの公開Q&Aは、質問文をコピーせず、「進路に迷う」「生命科学で何を学ぶかわからない」「生物は好きだが化学・物理が不安」「がん研究や医療研究に進みたい」といった相談の型だけを参考にし、My Lab用の新しい自然文として作成します。

ローカルで検証する場合:

```bash
python3 Mylab_gamma/tools/evaluate_ai_compass.py
```

主に確認する項目:

- 全体ヒット率
- トピック別ヒット率
- 研究室ごとのTOP3出現回数
- 未登録語ランキング
- ヒットしなかった質問例

未登録語が多い領域は、`data/ai_research_dictionary.csv` に `word,synonym,tag,weight` を追記して再検証します。

特定の研究室が出にくい場合は、`data/ai_lab_dictionary.csv` に `lab_id,word,synonym,field,weight,source,needs_review` を追記して再検証します。

## URL

My Labは `index.html` 1枚の構成を維持しつつ、ハッシュURLで各タブを直接開けます。

- `#home`
- `#interest`
- `#ai-compass`
- `#labs`
- `#visitors`
- `#favorites`

GitHub Pagesでもそのまま動き、URL共有やブラウザの戻る・進む操作に対応します。
