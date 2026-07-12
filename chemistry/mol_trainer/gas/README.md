# GAS でGoogleログインと学習記録を使う手順

physics_spring と同じ考え方で動きます。

1. GAS の `?view=auth` を開く
2. 大学Googleアカウントを確認する
3. メールアドレスから学籍番号を抜く
4. 署名付きの一時トークンを発行する
5. GitHub Pages の mol Trainer に `#auth=...` を付けて戻る
6. mol Trainer がトークンを保存し、結果送信時に添付する
7. GAS がトークンを検証して `Log` と `Counts` に保存する

## 1. Apps Script を作る

Google スプレッドシートを作り、`拡張機能` → `Apps Script` を開きます。
`Code.gs` にこのフォルダの `Code.gs` を貼り付けます。

## 2. 設定を変更する

`Code.gs` の先頭を環境に合わせます。

```js
const SCHOOL_DOMAIN = "toyo.jp";
const NEW_TRAINER_BASE_URL = "https://ユーザー名.github.io/リポジトリ名";
```

学籍番号の取り出し方は physics_spring と同じで、学生メールを次の形として扱います。

```text
s学籍番号1桁の数字@toyo.jp
```

例:

```text
s24abc1234@toyo.jp → 24ABC123
```

必要なら `getAuthenticatedStudentId_()` の正規表現を変更してください。

## 3. 教員アカウントを設定する

初期設定では次のアカウントが教員用です。

```js
const STAFF_TEST_STUDENT_IDS = {
  "gunji@toyo.jp": "ADMIN_GUNJI"
};
```

教員ダッシュボードは `?view=teacher` で開きます。

## 4. 初期設定を実行する

Apps Script の関数一覧から `setup` を選び、一度実行します。
初回は Google の権限確認が出ます。

## 5. Webアプリとしてデプロイする

`デプロイ` → `新しいデプロイ` → `ウェブアプリ` を選びます。

推奨設定:

- 実行するユーザー: `自分`
- アクセスできるユーザー: 学校ドメイン内のユーザー、または必要な範囲

この方式では、ログイン確認は `?view=auth` で行い、結果保存は署名付きトークンで検証します。

## 6. mol Trainer にGASのURLを入れる

デプロイ後の WebアプリURLを `js/tracking.js` に貼ります。

```js
window.MOL_TRACKING = {
  gasUrl: "https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec",
  trainerBaseUrl: "https://ユーザー名.github.io/リポジトリ名",
  tokenStorageKey: "molTrainerAuthToken"
};
```

## 7. 学生の入口

学生には次のURLを案内します。

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec?view=auth
```

ログイン後、自動で mol Trainer に戻ります。

## 8. 管理画面

教員ダッシュボード:

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec?view=teacher
```

学生本人の学習状況:

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec?view=my
```

## 注意

GitHub Pages だけでは Googleログイン中のメールアドレスは取得できません。
GASで大学アカウントを確認し、署名付きトークンを使ってGitHub Pages側から結果を保存します。
