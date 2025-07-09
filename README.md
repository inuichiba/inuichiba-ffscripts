# inuichiba-ffscripts

このリポジトリは、`inuichiba-ffimages` や `inuichiba-ffworkers` のような複数プロジェクトで共通して使用される、**CLIスクリプト群の保管場所**です。  
Node.js・PowerShellベースの作業用スクリプトを主に収録しています。

---

## ✅ 命名規則と用途

- `ffimages-*` ：Cloudflare Pages（画像のGit pushやデプロイなど）に関するバッチ処理
- `ffworkers-*`：Cloudflare Workers 環境での初期化・デプロイ・Secrets登録などの支援ツール
- `ffscripts-*`：上記に関するスクリプトたちをGit pushして管理
- `wrangler.toml` は `Cloudflare Pages` 向け構成ファイルです(`inuichiba-ffimages`には極力gitと画像以外のファイルを含めたくなかったための措置)。

---

## ❌ GUIは絶対に作らないこと！

- スクリプトは **あくまでCLI（コマンドライン）で動かすもの**です
- 「誰でも使えるGUI」を作ると、**誰も保守できなくなります**
- 一見便利なボタンで事故を起こし、後から誰も責任が取れない構成は絶対に避けてください

---

## ⚠ 利用時の注意（必読）

- 本リポジトリにあるスクリプトは、**作業者の責任のもとで実行すること**を前提としています
- 自動化による効率化と、事故時のリスクは**表裏一体**です
- READMEを読まず、**よくわからないけど実行した結果**に対して、保守者は責任を取りません

---

## 🐾 管理者メモ

- スクリプトは以下で管理
    - `Windowds` の場合 `D:\nasubi\inuichiba-ffscripts` 
    - `Mac/Unix` の場合 `/Users/yourname/projectname/inuichiba-ffscripts/sh/`
- 各スクリプトは外部リポジトリの `../` 相対パスで呼び出されることを想定
- 不用意なディレクトリ移動は **スクリプト全体のリンク切れを引き起こす** ため慎重に

---

## 📁 ファイル構成
```sh
inuichiba-ffscripts/
  compress-images.js          # png(jpg)をファイルサイズを圧縮したjpgに変換し、base64のjsにも変換(Windows/Mac使用可能)
  compress                    # 変換ファイルのI/Oが入るディレクトリ
     input                    # 圧縮したいファイルを入れる
     output                   # 日付時間のディレクトリに変換後のファイルが格納される
     base64                   # 変換後のファイルが格納される(現在リッチメニュー機能でしか使っていない)
  ffimages-upload-deploy.ps1  # inuichiba-ffimages をGit登録し、画像ファイルをデプロイ(再キャッシュ)
  ffscripts-upload.ps1        # inuichiba-ffscripts をGit登録する
  ffworkers-upload.ps1        # inuichiba-ffworkers をGit登録する(デプロイは手動で実施)
  git-pull-main.ps1           # 3つすべてにおいて、Git pull を実行する
  ffworkers-run-richmenu.ps1  # inuichiba-ffworkers でリッチメニュー作成を行う(ローカルで行われる)
  ffworkers-set-secrets.ps1   # inuichiba-ffworkers の Secrets を .env.secrets.ff*.txt を元に一括登録
     :
  sh                          # .ps1スクリプトをMac/unix向け(.sh)に反映したスクリプト群
     ffworkers-upload.sh      # inuichiba-ffworkers をGit登録する(デプロイは手動で実施)
      :
  .github
     workflows
       ping-supabase.yml      # Supabaseが稼働し続けることを確認するための定期Ping処理
     :                        # 5日ごとに実行され、失敗時は Discord またはメールに通知される  
     :
  .git                        # Git が使用するファイル群一式 
  .gitignore                  # Git に含めないファイルを記述(秘匿ファイルやログなど開発に不要なファイルをGitに含めないようにする設定ファイル) 
  .gitattributes              # このリポジトリ内のファイルを、Git がどう扱うかを指定する設定ファイル 
     :
  package.json                # 依存パッケージ・スクリプト・メタ情報を管理  
  wrangler.toml               # Cloudflare Pages(inuichiba-ffimages) 向け構成ファイル
  README.md                   # このファイル(このディレクトリの説明を書いたファイル)
  README-MAC.md               # MACユーザ向けに初期導入するための手引書
  README-MAC-VSCode.md        # MAcユーザ向けにVSCodeの拡張インストールをするための手引書
``` 

### 主要なファイル構成の追加説明

### 1. package.json（依存管理・スクリプト）
- このプロジェクトの **依存パッケージ・スクリプト・メタ情報** を管理。
- 主要スクリプト（例）:
    - `start` や `deploy`、カスタムスクリプトを定義可能。
- 依存パッケージには以下が含まれることがあります：
    - `@supabase/supabase-js`
    - `node-fetch`（必要に応じて）
    - `@cloudflare/kv-asset-handler` など
- `type: "module"` が指定されているため、**ESM形式で記述されています**。


### 2. ping-supabase.yml（GitHub Actions）
- yamlとは、Git Push すると GitHub の Actions へ登録され、そこで(自動/手動)実行するファイルのこと。
- Supabase が稼働し続けることを確認するための **定期Ping処理**。
- 毎月 `1日, 5日, 10日, 15日, 20日, 25日, 30日` に実行。
- Cloudflare Workers の `/ping` エンドポイントを呼び出します。
- 失敗時は Discord またはログに通知されます（処理は `ping-supabase.sh`）。
- Supabase はテーブルに7日間アクセスがないとメールで警告を送り、1ヶ月半でそのテーブルを削除します。この定期pingは削除されないための方策です。


### 3. .gitignore（Git管理除外ファイル）
- `node_modules/` や `.env*` など、**開発に不要または秘匿ファイルをGitに含めないようにする設定ファイル**。
- 秘匿ファイルは `inuichiba-ffworkers/scr/secrets/` 配下にしか今はない。
- GitHubにいたらないものを登録しないよう、ファイルの中身には十分な配慮が必要。
- 主な除外対象：
    - `node_modules/`（依存パッケージ）
    - `.env.secrets.*.txt`（Secretsファイル）
    - `.backup/`（バックアップ系ログや設定）
    - `*.log`（ログファイル）
