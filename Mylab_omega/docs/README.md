# Mylab Ω / AI Department Compass β

東洋大学の学部・学科を、自由入力から探す辞書ベースのプロトタイプです。

## 主要ファイル

- `index.html`: 単独ページ
- `app.js`: 検索ロジック
- `styles.css`: 画面デザイン
- `data/programs.json`: 学部・学科データ
- `data/common_dictionary.csv`: 中高校生・学部生の言葉を学問キーワードへ翻訳する共通辞書
- `data/program_dictionary.csv`: 学部・学科ごとの辞書
- `docs/seed_questions.csv`: テスト用の自然文1000件
- `tools/evaluate_omega.py`: 1000件テスト用スクリプト

## 情報源

初期版は東洋大学公式サイト、東洋大学入試情報サイトの学部・学科一覧を中心に作成しています。

- https://www.toyo.ac.jp/
- https://www.toyo.ac.jp/nyushi/undergraduate/

Yahoo知恵袋等のQ&Aサイトは、質問文をコピーせず、進路相談の型だけを参考にした合成質問として扱います。

## 注意

各学部・学科のディプロマポリシー、教員紹介、研究室情報は、正式運用前に追加確認が必要です。`programs.json` の `needs_review` と `review_note` を参照してください。
