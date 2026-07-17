# AI Compass GAS Logging

AI Compassの入力ログは、Google Apps Scriptを使ってGoogle Spreadsheetへ匿名送信できます。

My Lab本体には教員向け管理画面を置かず、スプレッドシート側で集計・分析する運用を想定します。

## My Lab側の設定

`data/ai_compass_logging_config.json` を編集します。

```json
{
  "enabled": true,
  "endpoint": "https://script.google.com/macros/s/XXXXX/exec",
  "site_id": "mylab-gamma",
  "send_user_agent": false
}
```

- `enabled`: `true` にすると送信します。
- `endpoint`: GASのWebアプリURL。
- `site_id`: 複数サイトを運用する場合の識別名。
- `send_user_agent`: 端末・ブラウザの簡易情報を保存する場合だけ `true`。

## 送信される項目

- `event_type`: `search` / `click` / `feedback`
- `site_id`
- `log_id`
- `timestamp`
- `page_url`
- `input_text`
- `extracted_tags`
- `unknown_terms`
- `displayed_labs`
- `clicked_lab`
- `feedback`
- `user_agent`

個人情報は保存しない前提です。公開時は、AI Compassの近くに「入力内容は匿名で辞書改善に利用します。個人情報は入力しないでください。」という案内を置く運用を推奨します。

## GASファイル

スプレッドシートを作成し、拡張機能 > Apps Script に `gas/ai_compass_logging.gs` の内容を貼り付けます。

リポジトリ内のGASファイル:

```text
Mylab_gamma/gas/ai_compass_logging.gs
```

内容は以下です。

```js
const SHEET_NAME = 'ai_compass_logs';

function doPost(e) {
  const sheet = getLogSheet_();
  const payload = parsePayload_(e);
  sheet.appendRow([
    new Date(),
    payload.event_type || '',
    payload.site_id || '',
    payload.log_id || '',
    payload.timestamp || '',
    payload.page_url || '',
    payload.input_text || '',
    payload.extracted_tags || '',
    payload.unknown_terms || '',
    payload.displayed_labs || '',
    payload.clicked_lab || '',
    payload.feedback || '',
    payload.user_agent || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, app: 'My Lab AI Compass logging' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(e) {
  try {
    return JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return {};
  }
}

function getLogSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'received_at',
      'event_type',
      'site_id',
      'log_id',
      'timestamp',
      'page_url',
      'input_text',
      'extracted_tags',
      'unknown_terms',
      'displayed_labs',
      'clicked_lab',
      'feedback',
      'user_agent'
    ]);
  }
  return sheet;
}
```

デプロイ時は「ウェブアプリ」として公開します。

- 次のユーザーとして実行: 自分
- アクセスできるユーザー: 全員

スプレッドシート本体は管理者だけが閲覧できる状態にします。

## 集計の考え方

スプレッドシート側では、以下を教員ダッシュボードとして見ると辞書改善に使いやすくなります。

- 検索回数
- 未登録語ランキング
- 表示研究室ランキング
- クリック研究室ランキング
- 👍 / 👎 比率
- 入力文の例
- 研究室ごとの表示回数とクリック率

入力文をそのまま公開・共有せず、教員確認では必要な範囲に絞って扱います。
