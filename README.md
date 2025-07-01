# inuichiba-ffscripts

このリポジトリは、`inuichiba-ffimages` や `inuichiba-ffworkers` のような複数プロジェクトで共通して使用される、**CLIスクリプト群の保管場所**です。  
Node.js・PowerShellベースの作業用スクリプトを主に収録しています。

---

## ✅ 命名規則と用途

- `ffimages-*`：画像圧縮やアップロードなど、Cloudflare Pages に関するバッチ処理
- `ffworkers-*`：Cloudflare Workers 環境での初期化・デプロイ・Secrets登録などの支援ツール
- 将来的に `ffmain-*`（Firebase Functions）などが追加される可能性もあります

---

## ❌ GUIは絶対に作らないこと！

- スクリプトは **あくまでCLI（コマンドライン）で動かすもの**です
- 「誰でも使えるGUI」を作ると、**誰も保守できなくなります**
- 一見便利なボタンで事故を起こし、後から誰も責任が取れない構成は絶対に避けてください

---

## ⚠ 利用時の注意（必読）

- 本リポジトリにあるスクリプトは、**「作業者の責任のもとで実行すること」**を前提としています
- 自動化による効率化と、事故時のリスクは**表裏一体**です
- READMEを読まず、**「よくわからないけど実行した結果」**に対して、保守者は責任を取りません

---

## 🐾 管理者メモ

- スクリプトは `D:\nasubi\inuichiba-ffscripts` で管理
- 各スクリプトは外部リポジトリの `../` 相対パスで呼び出されることを想定
- 不用意なディレクトリ移動は **スクリプト全体のリンク切れを引き起こす**ため慎重に

---

## 📁 推奨ファイル構成（例）

- inuichiba-ffscripts/
    - ffimages-upload-deploy.ps1
    - ffworkers-upload.ps1
    - ffworkers-set-secrets.ps1
    - :
    - .gitignore
    - README.md



