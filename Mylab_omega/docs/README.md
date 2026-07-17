# Mylab Ω / AI Department Compass β

東洋大学の学部・学科を、自由入力から探す辞書ベースのプロトタイプです。

## 主要ファイル

- `index.html`: 単独ページ
- `app.js`: 検索ロジック
- `styles.css`: 画面デザイン
- `data/programs.json`: 学部・学科データ
- `data/research_sources.json`: 公式学科ページ・研究室紹介ページから取得した確認用ソースと抽出語
- `data/common_dictionary.csv`: 中高校生・学部生の言葉を学問キーワードへ翻訳する共通辞書
- `data/program_dictionary.csv`: 学部・学科ごとの辞書
- `docs/seed_questions.csv`: テスト用の自然文10000件
- `tools/build_omega_research_enrichment.py`: 公式ページを再収集し、研究語彙・辞書・テスト質問を再生成するスクリプト
- `tools/evaluate_omega.py`: 10000件テスト用スクリプト

## 情報源

初期版は東洋大学公式サイト、東洋大学入試情報サイトの学部・学科一覧を中心に作成しています。
現在版では、各学科ページに加えて、公式ページ上で確認できる研究室紹介ページ・研究室個別ページも収集対象にしています。

- https://www.toyo.ac.jp/
- https://www.toyo.ac.jp/nyushi/undergraduate/

Yahoo知恵袋等のQ&Aサイトは、質問文をコピーせず、進路相談の型だけを参考にした合成質問として扱います。

## 注意

各学部・学科のディプロマポリシー、教員紹介、研究室情報は、正式運用前に追加確認が必要です。`programs.json` の `needs_review` と `review_note` を参照してください。
文系・社会科学系の一部学科は公式入試ページ上で研究室個別ページを確認できないため、学科ページ本文を中心に辞書化しています。
