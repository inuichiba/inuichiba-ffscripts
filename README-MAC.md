以下は、inuichiba-ff系3リポジトリをまとめて使う初心者向けの導入ガイドです：

# 🚀 inuichiba開発環境セットアップガイド for Macユーザー

このガイドは **inuichiba-ffworkers / inuichiba-ffscripts / inuichiba-ffimages** を使って開発・デプロイを行う **Macユーザーの初心者** 向けに書かれています。Windowsとの違いや注意点も説明します。

---

# 🐣 はじめに（GitHubからプロジェクトを取得）
このプロジェクトを使うには、まず GitHub 上のリポジトリを自分のPCに複製（clone）する必要があります。

## 1. ターミナルを使う（Launchpad → "ターミナル"）

### A. ターミナルを開く
- Finder → アプリケーション → ユーティリティ → Terminal
- または、potlight（⌘ Cmd + Space）で Terminal

### B. スクリプトがあるディレクトリに移動
```bash
cd /projectname/inuichiba-ffscripts
例）
cd ~/nasubi/inuichiba-ffscripts
```

### C. スクリプトに実行権限を付与（初回だけ）
```sh
  ./ffworkers-upload.sh
```

### D. 管理者権限(=sudo)が必要なとき（通常は不必要）
```sh
状況                                 管理者権限 (sudo) の必要性
/usr/local/bin にソフトをインストール ✅ 必要（例: Homebrew）
npmやnpxをグローバルに入れる          ✅ 場合によって必要
CloudflareやGitHub操作               ❌ 不要（ログイン済みなら）
```

- Node.js / npx が必要です。入っていない場合は次のように Homebrew で入れます：
```bash
brew install node
```


## 2. 任意の作業フォルダへ移動（例: ~/projects/）
```bash
mkdir -p ~/projects && cd ~/projects
```

## 3. GitHubからクローン（あなたの権限があるリポジトリURLに読み替えてください）
- git clone https://github.com/inuichiba/inuichiba-ffworkers.git
- git clone https://github.com/inuichiba/inuichiba-ffscripts.git
- git clone https://github.com/inuichiba/inuichiba-ffimages.git


## 4. 作業後にやるべきGit操作の意味(実行はコマンドではなく git-pull-main.sh で行う)

### A. 最新の変更を取り込む（pull）
- 他の人が何か変更したかもしれないので、まずはリモートの内容を取り込みます。
- 以下のコマンドではなく、git-pull-main.sh のスクリプトを使って実施すること。
```bash
git pull origin main
```  
- 🔍 main は、作業するブランチ名です

### B. 自分の変更を反映する（add → commit → push）
- ffimages-upload-deploy.sh / ffworkers-upload.sh / ffscripts-upload.sh を使うこと
```bash
git status           # 変更点を確認
git add .            # すべての変更をステージに追加
git commit -m "変更内容を簡潔にわかりやすく書く"
git push origin main # リモート（GitHub）へ送信
```

### C. 🧠 補足：この作業がなぜ必要か？
```sh
操作        目的
pull        他の人の変更を自分に反映（競合防止）
push        自分の変更をGitHubに反映（バックアップ・共有）
add/commit  ローカルでの作業履歴の記録（Gitの基本）
```

### D. 📌 注意点
- pull せずに push すると「競合」が起きることがあります
- 変更がないと push しても「何も起きません」
- .env.secrets.*.txt など秘匿ファイルはGit管理に含めていないので、共有しないでください（.gitignoreに含まれている）


## 5. 🔄 作業後のGit反映について

- このプロジェクトでは `git push` を手動で行う必要は **ありません**。
- 代わりに、次の安全なスクリプトを使ってください：
```sh
./ffimages-upload-deploy.sh   # ffimages の変更をGitHubに反映
./ffworkers-upload.sh         # ffworkers の変更をGitHubに反映
./ffscripts-upload.sh         # ffscripts の変更をGitHubに反映
```

- これらのスクリプトは以下を安全に自動実行します：
    - 現在のブランチを確認
    - 差分があるかチェック
    - 差分があれば add → commit → push
    - 差分がなければ何もしない（安全）

## 🙅‍♂️ git push を直接実行する必要はありません。競合やミスを防ぐため、必ずスクリプトを使ってください。
- pull のみコマンドまたはVSCodeで実施してください。
- ffimages-upload-deploy.sh で画像をアップロードする場合はデプロイまで自動的に行われることに気を付けてください。 

## 🔒 このスクリプトは、リモートとの差分がある場合、pushをブロックします。
- 他の人の変更がリモートにある場合は、git pull 用スクリプトを実行して競合を解決してから、再度このスクリプトを使ってください。

## ✅ ヒント
- GitHubのアクセス権限が必要です（エラーが出たら相談してください）
- クローン後に cd inuichiba-ffworkers などで各プロジェクトに入って作業します（ソースコードはルート又は src 配下にあります）
- 作業後は必ず pull/push の操作が必要です


## 6. git pull を知ろう
```sh
基本的にpull専用スクリプト (git-pull-main.sh) を使うこと。
```

### A. いつpullするか
- 以下のようなタイミングで git pull origin main を実行するのがよいです：
```sh
タイミング                              理由
作業を始める前                          最新のリモート状態を取り込むため（最重要）
他の人がpushしたと聞いた時               リモートが更新されたから
uploadスクリプトで差分ありと警告された時  pushできないので先にpullが必要
```

### B. pullの基本コマンド
git pull origin main

- これは 「リモート（origin）のmainブランチをローカルに取り込む」 という意味です。
- 今のブランチが main なのでこれで問題ありません。
- 💡 push 前には必ず `git pull origin main (git-pull-main.sh)` を実行して、他の人の変更を取り込みましょう。
- ❌ pull を忘れると push が失敗します。
- ⚠️ pull によって競合が発生することがあります。
- 慣れないうちは pull 専用スクリプト(git-pull-main.sh)を使うと安心です。

### C. pull 専用スクリプト(git-pull-main.sh)
- 💡 各Gitリポジトリの最新状態を取得するには、inuichiba-ffscripts/sh 配下にある git-pull-main.sh を使ってください：
- ⚠️ pullによって競合が発生することがあります。pushの前に必ず実行してください。

```bash
chmod +x ./git-pull-main.sh
.\git-pull-main.sh -target ffscripts
.\git-pull-main.sh -target ffimages
.\git-pull-main.sh -target ffworkers
```

---

# 📦 必要なインストール

すべての作業を行うには、以下のソフトウェアが必要です。

---

## 1. Homebrew（Mac用パッケージ管理ツール）
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## 2. Node.js（バージョン18以上を推奨）
```sh
このガイドは、macOS に Node.js（および npm / npx）をインストールし、Cloudflare Workers などの開発環境を構築するための手順をまとめたものです。
```

### 📌 前提条件
- Mac（Intel または Apple Silicon 両対応）
- ターミナル（Terminal.app）を使用可能であること
- Homebrew（Mac用パッケージマネージャ）がインストール済であること  
    - → 未導入の方は [Homebrew公式](https://brew.sh/index_ja) を参照


## 🛠 Node.js セットアップ手順

### 1. Node.js を Homebrew 経由でインストール
```bash
brew install node
```
- このコマンドで以下がインストールされます：
    - node（JavaScriptランタイム）
    - npm（Node.jsパッケージマネージャ）
    - npx（CLIツール実行用）

### 2. インストール確認    
```bash
node -v
npm -v
npx -v
```

### 3. グローバルnpmパスが通っているか確認（任意）
```bash
npm config get prefix
```
- 出力が /opt/homebrew や /usr/local であれば OK
- .bashrc や .zshrc に以下を追記することで PATH を補完できます：
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

### 4. 必要に応じて wrangler CLI をインストール（Cloudflare 用）
```bash
npm install -g wrangler
```
- またはプロジェクト単位で npx wrangler を使っても OK

### ✅ 補足
```sh
内容                          コマンド/説明
Node.js をアンインストール      brew uninstall node
npm パッケージのアップデート    npm update -g <package>
wrangler のバージョン確認      wrangler --version
CLI トラブル時の再インストール  npm uninstall -g wrangler && npm install -g wrangler
```

### 🧪 簡単な動作確認
```bash
npx wrangler --version
```
- 正常に動作すれば wrangler 3.x.x や 4.x.x のように表示されます。

### 📦 よく使う npm コマンド（参考）
```bash
npm install パッケージ名        # ローカルにパッケージをインストール
npm install -g パッケージ名     # グローバルにパッケージをインストール
npm uninstall パッケージ名      # アンインストール
npm update                     # アップデート
```

---

### 3. Git（通常は最初から入っています）
```bash
git --version
```

---

## 4. wrangler（Cloudflare用CLIツール）
```sh
ここでは、Cloudflare Workers 開発を行うための CLI ツール「Wrangler」のセットアップ手順を説明します。
```

### 📌 前提条件

- macOS（Intel or Apple Silicon）
- Node.js と npm がインストール済み  
  （未導入の方は [Node.js セットアップ手順](./README.md) を参照）

### A. グローバルインストール(推奨)
```bash
npm install -g wrangler
```
- 最新の Wrangler v4 をインストールします
- wrangler コマンドがグローバルに使えるようになります

```bash
# ✅ インストール確認
wrangler --version

# ⛅️ 出力例：
wrangler 4.22.0
```

### B. 🗂️ リポジトリ構成（3つ。ディレクトリ構成は並列に並べること）
```sh
ディレクトリ名	     内容説明
inuichiba-ffworkers	LINE Bot の Cloudflare Workers 実装
inuichiba-ffscripts	Git 操作・ファイル圧縮などの補助スクリプト
inuichiba-ffimages	Clouodflare Pages に登録する Flex Message 画像やQRコードなどの管理

projectname/
├── inuichiba-ffimages/
│   └── README.md（必要最小限のファイルしか入れないポリシーの明記。画像アップロード方法など）
├── inuichiba-ffscripts/
│   ├── README-MAC.md（←このファイル）
│   ├── README-MAC-VSCode.md（VSCodeで最低限入れておくべき拡張ファイルの一覧）
│   └── git-pull-main.ps1 など
│        └── sh など
│             └── git-pull-main.sh など
├── inuichiba-ffworkers/
│   └── README.md（運用ポリシー、ファイル構成、Workers デプロイ手順など）
```

### C. ログイン（Cloudflareアカウント連携）
```bash
npx wrangler login
```
- ブラウザが開き、Cloudflare にログインします
- 完了後、自動的に CLI に戻りログイン状態になります

### D. 🔁 Wrangler のアップデート（定期推奨）
```bash
npm update -g wrangler
```

### E. ✅ 補足
```bash
コマンド例                        機能
npx wrangler dev                 # 開発用サーバー起動        
npx wrangler deploy --env ffdev  # 開発環境指定付きデプロイ   
npx wrangler deploy --env ffdev  # 本番環境指定付きデプロイ
```

---

## Cloudflare Workers プロジェクトの構築と運用の準備
```sh
このドキュメントでは、Cloudflare Workers プロジェクトの新規作成手順を説明します。
```

### A. 📁 新しいプロジェクトの作成
```bash
wrangler init my-worker-project
```
- my-worker-project ディレクトリが作成されます
- wrangler.toml, src/index.js などが自動生成されます

### B. 🔍 プロジェクト構成（例）
```sh
my-worker-project/
├── wrangler.toml          # 設定ファイル
├── package.json           # 任意（npm init後）
├── src/
│   └── index.js           # エントリポイント
```

### C. ⚙️ Wrangler 設定ファイル（wrangler.toml）
### cloudflare Workers
```sh
# 📛 ベース名（この name は fallback 用。各環境で上書きされます）
name = "inuichiba-ffworkers"

# エントリーポイント
main = "src/index.js"

# ✅ Cloudflare Workers は .js が ESM（ES Modules）形式なら自動的に module 型を検出
# type = "module"

# 📅 Wrangler の日付
compatibility_date = "2025-06-24"

# 💳 Cloudflare アカウント
account_id = "YOUR_ACCOUNT_ID"

# 独自ドメインがないときは true
workers_dev = true

# 本番環境用KV(Supabase連打スキップ機能)
[[kv_namespaces]]
binding = "users_kv"
id = "9cc8cd1153a34a66a4e1bf313078664c"
preview_id = "4ebfa42f89f7478888677c5486b6b540"


# 🌍 通常は Workers.dev を使用（routes や zones は省略）
# route = ""
# zone_id = ""


# ==========================
# ✅ 開発環境 ffdev
# ==========================
[env.ffdev]
# デプロイ時のWorker名
name = "inuichiba-ffworkers-ffdev"

# ⚠️ この vars セクションは Cloudflare Pages の "ビルド時" 変数用です
# Cloudflare Workers の env.GCLOUD_PROJECT には渡されません
# Workers で使うには Cloudflare ダッシュボードの「Variables(プレーンテキスト)」
# に登録してください
# https://dash.cloudflare.com/ → Workers → 環境変数（Variables）
vars = { GCLOUD_PROJECT = "inuichiba-ffworkers-ffdev" }

# ⚠️ kv_namespaces は継承されないので明示的に定義する
[[env.ffdev.kv_namespaces]]
binding = "users_kv"
id = "4ebfa42f89f7478888677c5486b6b540"


# ==========================
# ✅ 本番環境 ffprod
# ==========================
[env.ffprod]
name = "inuichiba-ffworkers-ffprod"
vars = { GCLOUD_PROJECT = "inuichiba-ffworkers-ffprod" }

[[env.ffprod.kv_namespaces]]
binding = "users_kv"
id = "9cc8cd1153a34a66a4e1bf313078664c"
```
- account_id は wrangler whoami で取得可能


### Cloudflare Pages
```sh
# ffimages用手動デプロイのために作成

name = "inuichiba-ffimages"
compatibility_date = "2025-06-24"
pages_build_output_dir = "/Users/yourname/projectname/inuichiba-ffimages/public"
```
- **inuichiba-ffscripts** に置くこと(間違えないように！)

--

### D. 🧪 ローカル開発（devモード）
```sh
npx wrangler dev
```
- http://localhost:8787 でローカル実行
- 本番と同じ動作環境でテスト可能

--

### E. 🚀 デプロイ 
```sh
npx wrangler deploy --env ffdev
```
- wrangler.toml に定義された ffdev 環境へデプロイ
- --env を省略すると production 扱いになります

--

### F. 📦 本番環境へデプロイ
```sh
npx wrangler deploy --env ffprod
```
- env.ffprod の設定に従って Cloudflare に本番公開されます

--

### G. 📝 その他よく使うコマンド
```bash
コマンド	                         説明
wrangler init	                    # 新規プロジェクト作成
wrangler dev	                    # ローカル実行
wrangler deploy	                  # デプロイ（デフォルト環境）
wrangler deploy --env ffdev	      # 開発環境にデプロイ
wrangler secret put <KEY>	        # Secret 登録
wrangler secret list --env ffdev	# Secret 一覧表示
wrangler tail --env ffdev	        # ログのリアルタイム表示
```

---

### 🔐 シークレットファイルの準備
- Cloudflare Workersとタブ付きリッチメニュー作成に使う秘匿情報（APIキーなど）は .env.secrets.ff*.txt にまとめてあり一括登録もできます。秘匿ファイルですので詳細は先輩に聞いてください。
- 実行には inuichiba-ffworkers と inuichiba-ffscripts が隣のディレクトリにある必要があります。

---

## 5. 🧰 推奨エディタ（必須に近いです）

初心者には **Visual Studio Code（VSCode）** の使用を強くおすすめします。

### ✅ 理由：
- JavaScript / Shell / Markdown に対応した**構文チェックや色分け**
- **Git操作が画面からできる**
- **ターミナル統合**ですぐにコマンドが実行できる
- `.sh` や `.env` ファイルの扱いも簡単

### 💻 インストール方法（Mac）
```sh
brew install --cask visual-studio-code
```
- または 公式サイト(https://code.visualstudio.com/)から直接ダウンロード
- メモ: Windows の NotePad++ や テキストエディタ は非推奨です。拡張子や文字コードの扱いが不安定で、設定ミスによるトラブルが発生しやすいためです。
- inuichibaプロジェクト開発に必要なプレインストールは、**README-MAC-VSCode.md** を参照してください。

---

## 6. 🏗️ 主に修正するファイル
```sh
ファイルパス	                                               内容
inuichiba-ffworkers/src/handlers/event.js	                  # LINEメッセージの応答処理ロジック
inuichiba-ffworkers/src/richmenu-manager/richMenuHandler.js	# リッチメニューの構成や画像の設定
inuichiba-ffworkers/src/richmenu-manager/data/messages.js	  # 表示するメッセージ定義やpostbackの定義
inuichiba-ffworkers/src/lib/env.js	                        # 環境変数やSecretsの取得（参照/呼び出しのみで極力修正しない事）
```

---

## 7. 🚀 Git登録（Git add → Git commit → Git Push）/デプロイ方法
- Git は main ひとつだけでffprod/ffdev両方を管理しています。
- ffprod/ffdevは、functions/lib/env.js 内の isProd フラグが true/false によって環境を自動判別し、Supabase/LINE設定などが切り替わる仕組みです。

## 🚩 Cloudflare Pages：画像をGit登録し、Cloudflare Pagesにアップロード、デプロイ（同時にCDNキャッシュも更新）
```bash
inuichiba-ffscripts/sh
./ffimages-upload.sh
```

## 🚩 Cloudflare Workers：LINE BotのソースコードをGit登録し、Cloudflare Workersをデプロイ、ログを取りながら評価
- Git登録
```bash
cd inuichiba-ffscripts
./ffworkers-upload.sh
```

- デプロイ（手動）
```bash
npx wrangler deploy --env ffdev  # 開発環境（wrangler.tomlに[env.ffdev]  定義済であること）
npx wrangler deploy --env ffprod # 本番環境（wrangler.tomlに[env.ffprod] 定義済であること）
```

- 評価（ログをとる）
  - 以下のコマンドを実行してから動かしましょう。ログが取れます。
  - 本番環境は殆どログが出ないので見ると少し悲しいです。
      - npx wrangler tail --env ffdev   # 開発環境
      - npx wrangler tail --env ffprod  # 本番環境

---

## 🚩 リッチメニューを作成・再登録する
```bash
./ffworkers-run-richmenu.sh -env ffdev  # 開発環境  
./ffworkers-run-richmenu.sh -env ffprod # 本番環境(一発で変わるから十分注意すること)
```
--- 

## 💡 よくある注意点
- D:/nasubi/... のようなWindows用パスが登場しますが、Macでは /Users/yourname/projectname/... に置き換えてください（ファイル内コメントに明記しています）。
- Cloudflareの環境変数はGUIで「Variables」「Secrets」として登録しておくと、メニュー画面更新以外は.env を直接触らずにすみます。
- 📦 環境変数の管理例（Variables は GUIで登録 / Secrets は GUI またはスクリプトで登録）
    - Variables（例）: GCLOUD_PROJECT=inuichiba-ffworkers-ffprod
    - Secrets（例）  : CHANNEL_ACCESS_TOKEN_FFDEV, CHANNEL_SECRET_FFDEV, SUPABASE_URL_FFDEV / など
- ffdev 環境で十分テストしてから ffprod に切り替えること。

## 💬 その他の注意点
- D:\やC:\などWindows特有のパス表記は一切使わないでください
- Macでは ~/projects/... や /Users/yourname/projectname/... のような絶対パスが基本です
- .sh 実行時に「Permission denied」が出たら以下を実行してください：
```bash
chmod +x ./ffworkers-upload.sh
```       

## ❓質問・トラブル
- プロジェクトが動いたら README-MAC.md に追加したいことがあれば Pull Request をどうぞ！
- わからないことがあれば ChatGPT先生 or 先輩 に聞いてください 🙇

