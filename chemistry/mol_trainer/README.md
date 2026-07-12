# mol Trainer

mol の基礎を学ぶための静的 Web 教材です。`index.html` から開始します。

## ローカルで見る

`index.html` をブラウザで開いてください。

## GitHub Pages で公開する

1. GitHub で新しいリポジトリを作ります。
2. このフォルダの中身をリポジトリのルートに置きます。
3. GitHub の `Settings` → `Pages` を開きます。
4. `Build and deployment` の `Source` を `Deploy from a branch` にします。
5. `Branch` を `main`、フォルダを `/root` にして保存します。

数分後、GitHub Pages の URL で公開されます。

## 主な内容

- Study Notes
- Stage 1: mol と粒子数
- Stage 2: モル質量
- Stage 3: 質量と mol
- Stage 4: 総合練習
- Stage 5: 発展・実践

## Googleログイン連携

`gas/` に Google Apps Script 用のテンプレートがあります。
physics_spring と同じように、GAS 側で大学Googleアカウントを確認し、署名付きトークンを発行してから、Study Note の確認問題完了や Stage の結果をスプレッドシートに記録できます。

GAS の Web アプリ URL は `js/tracking.js` に設定します。
