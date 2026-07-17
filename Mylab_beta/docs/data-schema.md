# データ管理メモ

My Lab は、画面の大部分をJSONから組み立てます。

## `data/departments.json`

学科の表示順、説明、カラーを管理します。

```json
{
  "name": "生命科学科",
  "className": "life",
  "description": "動物・人体・細胞などから、生命のしくみと健康・進化の問いを探る研究室。",
  "color": "#b63b45",
  "soft": "#fff1f2",
  "line": "#efc5ca"
}
```

画面では次に使われます。

- 研究室一覧の学科フィルタ
- 研究室一覧の学科見出し
- クイックインデックスの学科タブ
- 「研究の問いから見る」の学科ボタン
- 受験生向けページの学科絞り込み
- 学科カラー

## `data/labs.json`

研究室ごとの本文データです。

主要項目:

- `id`: アプリ内で研究室を参照するID。イベント情報やお気に入りでも使います。
- `department`: 学科名。`data/departments.json` の `name` と一致させます。
- `lab_name`: 研究室名。末尾の「研究室」がない場合は画面側で補完します。
- `pi_name`: 教員名。
- `position`: 職位。
- `question`: 一覧カードと詳細モーダルで強く見せる研究の問い。
- `summary`: 一覧カードと詳細冒頭の短い紹介文。
- `description`: 詳細ページの本文。
- `methods`: 主な研究方法。
- `major_categories`: 植物、微生物、動物、細胞、環境、健康、化学などの大区分。
- `tags`: 検索用タグを `targets`、`fields`、`methods` に分けた構造。
- `tags.targets`: 研究対象。例: 動物、植物、微生物、DNA、神経、骨格、イネ、水環境。
- `tags.fields`: 学問領域。例: 比較解剖学、神経科学、分子生物学、微生物学、環境科学。
- `tags.methods`: 研究手法。例: フィールド調査、解剖、細胞培養、遺伝子解析、顕微鏡、統計解析。
- `keywords`: `tags.targets`、`tags.fields`、`tags.methods` をこの順番で連結した表示・検索用配列。
- `recommended_for`: 「こんな人におすすめ」。
- `courses`: 「この先生から学べる授業」。
- `links`: researchmap、研究室紹介、Web体験授業など。
- `media_links`: 大学公式インタビュー記事など。
- `needs_review`: 公開前確認が必要な場合のメモ。

## `data/events.json`

オープンキャンパスなどのイベント情報です。

研究室データとは分けておくことで、通常の研究室紹介を壊さず、イベント前だけ更新できます。

主要項目:

- `event`: イベント名。
- `lead`: 受験生向けページの説明文。
- `dates`: 日付ごとのプログラム一覧。
- `programs[].id`: プログラムID。
- `programs[].type`: 実験プログラム、学科紹介、学科相談など。
- `programs[].tags`: 絞り込み用タグ。
- `programs[].title`: プログラムタイトル。
- `programs[].program`: 当日の内容。
- `programs[].times`: 開催時間。
- `programs[].place`: 場所。
- `programs[].audience`: 対象。
- `programs[].lab_id` / `lab_ids`: 担当研究室ID。

## 興味検索との関係

興味検索は、`major_categories`、`tags`、`keywords`、`methods`、`summary`、`description` などから関連キーワードを判定します。

新しい学科や研究室を追加したときに検索結果が弱い場合は、まず `major_categories` と `tags` を見直します。それでも意図したトピックに出ない場合は、`app.js` の `interestRoutes` または `tagParents` に上位タグのルールを追加します。

タグ付けの基本方針:

- 研究室紹介ページの研究対象から、まず `major_categories` と `tags.targets` を付けます。
- `tags` は、研究対象3〜4個、学問領域2〜4個、研究手法2〜3個を目安にします。
- `keywords` は `tags.targets` → `tags.fields` → `tags.methods` の順で再生成します。
- `生命科学`、`生物`、`研究`、`医療`、`健康`、`環境`、`実験`、`データ` のような広すぎる語は、より具体的な語へ置き換えます。
- 例: `アカパンカビ` だけで終わらせず、`糸状菌`、`DNA修復`、`分子遺伝学`、`遺伝子解析` のように、対象・領域・手法がわかる語を残します。
