# 学科を追加するときの手順

次に新しい学科を加えるときは、基本的にデータを追加するだけで画面に反映されます。

## 1. 学科設定を追加する

`data/departments.json` に新しい学科を1件追加します。

```json
{
  "name": "新しい学科名",
  "className": "new-department",
  "description": "研究室一覧の学科見出しに出す短い説明文。",
  "color": "#4d6f91",
  "soft": "#eef5fb",
  "line": "#c8d9e8"
}
```

- `name`: `data/labs.json` の `department` と完全一致させます。
- `className`: 英数字とハイフンで短く付けます。
- `description`: 学科カードの説明文です。
- `color`: 学科カラーの濃い色です。
- `soft`: hover / tap 時の薄い背景色です。
- `line`: 枠線や淡いアクセント色です。

## 2. 研究室データを追加する

`data/labs.json` に研究室を追加します。

最低限、次の項目がそろっていれば一覧・詳細・検索に出せます。

- `id`
- `department`
- `lab_name`
- `pi_name`
- `position`
- `question`
- `summary`
- `description`
- `methods`
- `keywords`
- `recommended_for`
- `courses`
- `links`

`department` は必ず `data/departments.json` の `name` と同じ文字列にします。

## 3. イベント情報がある場合だけ追加する

オープンキャンパスや文化祭に出す場合は、`data/events.json` の各プログラムに `lab_id` または `lab_ids` を入れます。

学科名で絞り込むボタンは、`data/departments.json` と `data/labs.json` から自動生成されます。

## 4. 表示確認

ローカルサーバーで開きます。

```bash
python3 -m http.server 8123
```

確認する場所:

- ホーム
- 興味から探す
- 研究室一覧の学科フィルタ
- 研究室一覧のクイックインデックス
- 研究の問いから見る
- 研究室詳細モーダル
- 受験生のみなさんへ
- スマホ幅

## 追加時に詰まりやすいところ

- `department` の表記ゆれがあると、学科設定と研究室が結びつきません。
- `id` は既存研究室と重複しないようにします。
- `keywords` と `methods` が少ないと、興味検索で見つかりにくくなります。
- `courses` は共通導入科目に偏らないよう、座学2件＋実験1件を基本にします。
- 外部リンクはURLだけでなく、リンク先の種類がわかる `label` と `title` を付けると詳細ページで読みやすくなります。
