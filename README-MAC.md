# 🚀 inuichiba開発環境セットアップガイド for Macユーザー

このガイドは **inuichiba-ffworkers / inuichiba-ffscripts / inuichiba-ffimages** を使って開発・デプロイを行う **Macユーザーの初心者** 向けに書かれています。Windowsとの違いや注意点も説明します。

---

## 1. ターミナルを使う（Launchpad → "ターミナル"）
> このプロジェクトを使うには、まず最初に GitHub 上のリポジトリを自分のPCに複製（clone）する必要があります。

### A. ターミナルを開く
- Finder → アプリケーション → ユーティリティ → Terminal
> または
- potlight（⌘ Cmd + Space）で Terminal

### B. スクリプトがあるディレクトリに移動
```bash
cd ~/projectname/inuichiba-ffscripts/sh
```

### C. スクリプトに実行権限を付与（初回だけ）
```text
./ffworkers-upload.sh
```

### D. Node.js / npx が必要です。入っていない場合は次のように Homebrew で入れます：
```bash
brew install node
```

### E. 管理者権限(=sudo)が必要なとき（通常は不必要）

```text
状況                                 管理者権限 (sudo) の必要性
/usr/local/bin にソフトをインストール ✅ 必要（例: Homebrew）
npmやnpxをグローバルに入れる          ✅ 場合によって必要
CloudflareやGitHub操作               ❌ 不要（ログイン済みなら）
```

---

## 2. # 📦 開発環境セットアップ手順（概要。詳細は後述だが熟読のこと）

### A. ✅ 前提条件

> この手順は **公式リポジトリ（inuichiba）から直接 clone する前提**です。  
> **絶対に GitHub 上で「Fork」ボタンを押さずに進めてください。**

---

### B. Homebrew で必要なツールをインストール

```bash
brew install git
brew install node
npm install -g wrangler
```

### C. リポジトリを clone（公式から直接）

> 下記の3つを順に clone してください。別々のフォルダに配置されますが、それでOKです。

```bash
git clone https://github.com/inuichiba/inuichiba-ffworkers.git
git clone https://github.com/inuichiba/inuichiba-ffscripts.git
git clone https://github.com/inuichiba/inuichiba-ffimages.git
```
- すべてのリモート（origin）は inuichiba 所有の本番リポジトリになります。

### D. Workersプロジェクトに移動してログイン

```bash
cd inuichiba-ffworkers
wrangler login
```

### E. ✅ 補足：間違った clone を防ぐために

- 絶対に GitHub 上で「Fork」ボタンを押さないこと
- clone コマンドは必ず https://github.com/inuichiba/... を使うこと
- git remote -v で origin のURLを確認可能

### F. 🔍 git remote URL の確認コマンド（間違っていたら修正）

```bash
git remote -v
```

期待される出力（例）：

```bash
origin  https://github.com/inuichiba/inuichiba-ffworkers.git (fetch)
origin  https://github.com/inuichiba/inuichiba-ffworkers.git (push)
```

### G. ✅ 問題があったときの対処（origin のURL修正）

```bash
git remote set-url origin https://github.com/inuichiba/inuichiba-ffworkers.git
```
- ffscripts や ffimages も同様です。

---

## 3. Git pull/push の基本

```bash
git pull origin main
git status
git add .
git commit -m "変更内容を記述"
git push origin main
```
- 実際は**コマンドでは行いません。**
- `git pull` は `git-pull-main.sh` を使います。
- `git add → commit → push` は `ffimages-upload-deploy.sh` / `ffworkers-upload.sh` / `ffscripts-upload.sh` を使います。

---

## 4. pull の詳細

### A. いつ pull するか
- 以下のようなタイミングで pull を実行するのがよいです：
```text
タイミング                              理由
作業を始める前                          最新のリモート状態を取り込むため（最重要）
他の人がpushしたと聞いた時               リモートが更新されたから
uploadスクリプトで差分ありと警告された時  pushできないので先にpullが必要
```


### B. 最新の変更を取り込む
- 基本について、`git pull origin main` とは 「リモート（origin）のmainブランチをローカルに取り込む」 という意味です。
- 今のブランチが main なのでこれで問題ありません。
- 他の人が何か変更したかもしれないので、まずはリモートの内容を取り込みます。
- このプロジェクトでは `git pull origin main` を手動で行う必要は **ありません**。
- コマンドではなく、pull 専用スクリプト `git-pull-main.sh` を使ってください。安心できます。
- 💡 push 前には必ず `git-pull-main.sh` を実行して、他の人の変更を取り込みましょう。
- ❌ pull を忘れると push が失敗し、**競合** が発生することがあります。


### C. pull 専用スクリプト(git-pull-main.sh)
- 💡 各Gitリポジトリの最新状態を取得するには、`inuichiba-ffscripts/sh` 配下にある `git-pull-main.sh` を使ってください：
- ⚠️ **競合** が発生することがあります。pushの前に必ず実行してください。

```bash
cd ~/inuichiba-ffscripts/sh
chmod +x ./git-pull-main.sh
./git-pull-main.sh -target ffscripts
./git-pull-main.sh -target ffimages
./git-pull-main.sh -target ffworkers
```

---

### 5. add, commit, push の詳細

### A. 自分の変更を反映する（add → commit → push）
- コマンドの意味は次の通りです。
- 実際は ffimages-upload-deploy.sh / ffworkers-upload.sh / ffscripts-upload.sh を使ってください。
```text
git status            # 変更点を確認
git add -A            # すべての変更をステージに追加
git commit -m "変更内容を簡潔にわかりやすく書く"
git push origin main  # リモート（GitHub）へ送信
```


### B. 🧠 補足：この作業がなぜ必要か？
```text
操作        目的
pull        他の人の変更を自分に反映（競合防止）
push        自分の変更をGitHubに反映（バックアップ・共有）
add/commit  ローカルでの作業履歴の記録（Gitの基本）
```


### C. 🔄 作業後のGit反映について

- このプロジェクトでは `git push` を手動で行う必要は **ありません**。
- 代わりに、次の安全なスクリプトを使ってください：
```text
./ffimages-upload-deploy.sh   # ffimages の変更をGitHubに反映、画像変更があるとデプロイする
./ffworkers-upload.sh         # ffworkers の変更をGitHubに反映
./ffscripts-upload.sh         # ffscripts の変更をGitHubに反映
```
- これらのスクリプトは以下を安全に自動実行します：
    - 現在のブランチを確認
    - 差分があるかチェック
    - 差分があれば add → commit → push
    - 差分がなければ何もしない（安全）


### D. 📌 注意点
- pull せずに push すると **競合** が起きることがあります。
- 変更がないと push しても「何も起きません」。
- .env.secrets.*.txt など秘匿ファイルはGit管理に含めていないので、**共有しないでください**（.gitignoreに含まれている）。
- コマンドで直接実行する必要はありません。競合やミスを防ぐため、必ずスクリプトを使ってください。
- これらのスクリプトは、リモートとの差分がある場合、pushをブロックします。
- 他の人の変更がリモートにある場合は、git pull 用スクリプトを実行して競合を解決してから、再度このスクリプトを使ってください。
- GitHubのアクセス権限が必要です（エラーが出たら相談してください）。
- クローン後に cd inuichiba-ffworkers などで各プロジェクトに入って作業します（ソースコードは src 配下にあります）。
- 作業後は必ず pull → push の操作が必要です。


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
```text
このガイドは、macOS に Node.js（および npm / npx）をインストールし、Cloudflare Workers などの開発環境を構築するための手順をまとめたものです。
```

### A. 📌 前提条件
- Mac（Intel または Apple Silicon 両対応）
- ターミナル（Terminal.app）を使用可能であること
- Homebrew（Mac用パッケージマネージャ）がインストール済であること  
    - → 未導入の方は [Homebrew公式](https://brew.sh/index_ja) を参照
- インストール先
    - git … 3つともすべて
    - VSCode … `inuichiba-ffworkers`
    - それ以外 … `inuichiba-ffscripts` および `inuichiba-ffworkers`


### B. Node.js を Homebrew 経由でインストール
```bash
brew install node
```
- このコマンドで以下がインストールされます：
    - node（JavaScriptランタイム）
    - npm（Node.jsパッケージマネージャ）
    - npx（CLIツール実行用）

### C. インストール確認    
```bash
node -v
npm -v
npx -v
```

### D. グローバルnpmパスが通っているか確認（任意）
```bash
npm config get prefix
```
- 出力が /opt/homebrew や /usr/local であれば OK
- .bashrc や .zshrc に以下を追記することで PATH を補完できます：
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

### E. wrangler CLI をインストール（Cloudflare 用）
```bash
npm install -g wrangler
```
- またはプロジェクト単位で npx wrangler を使っても OK

### F. 補足
```text
内容                          コマンド/説明
Node.js をアンインストール      brew uninstall node
npm パッケージのアップデート    npm update -g <package>
wrangler のバージョン確認      wrangler --version
CLI トラブル時の再インストール  npm uninstall -g wrangler && npm install -g wrangler
```

### E. 簡単な動作確認
```bash
npx wrangler --version
```
- 正常に動作すれば wrangler 3.x.x や 4.x.x のように表示されます。

### F. よく使う npm コマンド（参考）
```text
npm install パッケージ名        # ローカルにパッケージをインストール
npm install -g パッケージ名     # グローバルにパッケージをインストール
npm uninstall パッケージ名      # アンインストール
npm update                     # アップデート
```

---

## 3. Git（通常は最初から入っています）
```bash
git --version
```

---

## 4. wrangler（Cloudflare用CLIツール）
```text
ここでは、Cloudflare Workers 開発を行うための CLI ツール「Wrangler」のセットアップ手順を説明します。
```

### A. 📌 前提条件
- macOS（Intel or Apple Silicon）
- Node.js と npm がインストール済み  
    - 未導入の方は [Node.js セットアップ手順](./README.md) を参照

### B. グローバルインストール(推奨)
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

### C. 🗂️ リポジトリ構成（3つ。ディレクトリ構成は並列に並べること）
```text
ディレクトリ名	     内容説明
inuichiba-ffworkers	LINE Bot の Cloudflare Workers 実装
inuichiba-ffscripts	Git 操作・ファイル圧縮などの補助スクリプト
inuichiba-ffimages	Clouodflare Pages に登録する Flex Message 画像やQRコードなどの管理

projectname/
├── inuichiba-ffimages/
│   └── README.md（必要最小限のファイルしか入れないポリシーの明記。画像アップロード方法など）
│
├── inuichiba-ffscripts/
│   ├── README-MAC.md（←このファイル）
│   ├── README-MAC-VSCode.md（VSCodeで最低限入れておくべき拡張ファイルの一覧）
│   └── git-pull-main.ps1 などのWindows向けスクリプト
│       └── sh
│           └── git-pull-main.sh などのMac向けスクリプト
│
└── inuichiba-ffworkers/
    ├── README.md（運用ポリシー、ファイル構成、Workers デプロイ手順など）
    └── src/ （ソースファイル）
```

### D. ログイン（Cloudflareアカウント連携）
```bash
npx wrangler login
```
- ブラウザが開き、Cloudflare にログインします
- 完了後、自動的に CLI に戻りログイン状態になります

### E. 🔁 Wrangler のアップデート（定期推奨）
```bash
npm update -g wrangler
```

### F. ✅ 補足
```text
コマンド例                        機能
npx wrangler dev                 # 開発用サーバー起動(今のところ未使用) 
npx wrangler deploy --env ffdev  # 開発環境指定付きデプロイ   
npx wrangler deploy --env ffprod # 本番環境指定付きデプロイ
```

---

## 5. Cloudflare Workers プロジェクトの構築と運用の準備
```text
Cloudflare Workers プロジェクトの新規作成手順を説明します。
```

### A. 📁 新しいプロジェクトの作成
```bash
wrangler init inuichiba-ffworkers
```
- inuichiba-ffworkers ディレクトリが作成されます
- wrangler.toml, src/index.js などが自動生成されます


### B. 🔍 プロジェクト構成（例）
```text
inuichiba-ffworkers/
├── wrangler.toml          # 設定ファイル
├── package.json           # 任意（npm init後）
├── src/
│   └── index.js           # エントリポイント
```
- wrangler.toml
    - cloudflare Workers … cloudflare Workers のルートに置く
    - Cloudflare Pages … **Cloudflare Scripts** のルートに置く


### D. ⚙️ LINE の Messaging API の Webhook URL(仮)

```text
ffdev ：https://inuichiba-ffworkers-ffdev.maltese-melody0655.workers.dev
ffprod：https://inuichiba-ffworkers-ffprod.maltese-melody0655.workers.dev
```
- `Webhook の利用` は**オン**にすること 
- 新しい公式 LINE アカウントを使用するときはその URL にあわせること
    - URLはデプロイすると表示される(または Cloudflare の GUI の Workers & Pages の Settings タブに inuichiba-ffworkers-ffdev.nasubi810.workers.dev のように表示される)
    - シークレットファイルの CHANNEL_ACCESS_TOKEN と CHANNEL_SECRETS も書き換え、ffworkers-set-secrets.sh で登録し直すこと(または Cloudflare の GUI の Workers & Pages の Settings タブで手動で登録し直すこと)
    - Workers & Pages は https://dash.cloudflare.com/ の左メニュー Compute(Workers) にある


### E. 🧪 ローカル開発（devモード）
```bash
npx wrangler dev
```
- http://localhost:8787 でローカル実行
- 本番と同じ動作環境でテスト可能
- いまのところ未使用


### F. 🚀 デプロイ 
```bash
npx wrangler deploy --env ffdev
```
- wrangler.toml に定義された ffdev 環境へデプロイ
- --env を省略すると production 扱いになります


### G. 📦 本番環境へデプロイ
```bash
npx wrangler deploy --env ffprod
```
- env.ffprod の設定に従って Cloudflare に本番公開されます


### H. 📝 その他よく使うコマンド
```text
コマンド                           説明
wrangler init                     # 新規プロジェクト作成
wrangler dev                      # ローカル実行
wrangler deploy                   # デプロイ（デフォルト環境）
wrangler deploy --env ffdev       # 開発環境にデプロイ
wrangler secret put <KEY>         # Secret 登録
wrangler secret list --env ffdev  # Secret 一覧表示
wrangler tail --env ffdev         # ログのリアルタイム表示
```

---

## 6. 🔐 シークレットファイルの準備
- Cloudflare Workersとタブ付きリッチメニュー作成に使う秘匿情報（APIキーなど）は .env.secrets.ff*.txt にまとめてあり一括登録もできます。秘匿ファイルですので詳細は先輩に聞いてください。
- 実行には inuichiba-ffworkers と inuichiba-ffscripts が隣のディレクトリにある必要があります。

---

## 7. 🧰 推奨エディタ（必須に近いです）

初心者には **Visual Studio Code（VSCode）** の使用を強くおすすめします。
また、インストール先は **inuichiba-ffworkers だけでいいです** 。

### ✅ 理由：
- JavaScript / Shell / Markdown に対応した**構文チェックや色分け**
- **Git操作が画面からできる**
- **ターミナル統合**ですぐにコマンドが実行できる
- `.sh` や `.env` ファイルの扱いも簡単

### 💻 インストール方法（Mac）
```bash
brew install --cask visual-studio-code
```
- または 公式サイト(https://code.visualstudio.com/)から直接ダウンロード
- メモ: Windows の NotePad++ や テキストエディタ は非推奨です。拡張子や文字コードの扱いが不安定で、設定ミスによるトラブルが発生しやすいためです。
- inuichibaプロジェクト開発に必要なプレインストールは、**README-MAC-VSCode.md** を参照してください。

---

## 8. 🏗️ 主に修正するファイル
```text
ファイルパス                                                 内容
inuichiba-ffworkers/src/handlers/event.js                   # LINEメッセージの応答処理ロジック
inuichiba-ffworkers/src/richmenu-manager/richMenuHandler.js # リッチメニューの構成や画像の設定
inuichiba-ffworkers/src/richmenu-manager/data/messages.js   # 表示するメッセージ定義やpostbackの定義
inuichiba-ffworkers/src/lib/env.js                          # 環境変数やSecretsの取得（参照/呼び出しのみで極力修正しない事）
```

---

## 9. 🚀 Git登録（Git pull → Git add → Git commit → Git Push）/デプロイ方法
- Git は main ひとつだけでffprod/ffdev両方を管理しています。
- ffprod/ffdevは、functions/lib/env.js 内の isProd フラグが true/false によって環境を自動判別し、Supabase/LINE設定などが切り替わる仕組みです。

### 🚩 Cloudflare Pages：画像をGit登録し、Cloudflare Pagesにアップロード、デプロイ（同時にCDNキャッシュも更新）
- git登録 → 画像デプロイ(CDNキャッシュも再生成される)
```bash
inuichiba-ffscripts/sh
./ffimages-upload-deploy.sh
```


### 🚩 Cloudflare Workers：LINE BotのソースコードをGit登録し、Cloudflare Workersをデプロイ、ログを取りながら評価
- git登録
```bash
cd inuichiba-ffscripts/sh
./ffworkers-upload.sh
```

- デプロイ（手動）
```text
npx wrangler deploy --env ffdev  # 開発環境（wrangler.tomlに[env.ffdev]  定義済であること）
npx wrangler deploy --env ffprod # 本番環境（wrangler.tomlに[env.ffprod] 定義済であること）
```

- 評価（ログをとる）
  - 以下のコマンドを実行してから LINE Bot を動かしましょう。ログが取れます。
  - 本番環境は殆どログが出ないので見ると少し悲しいです。
```bash
npx wrangler tail --env ffdev   # 開発環境
npx wrangler tail --env ffprod  # 本番環境
```


## 🚩 リッチメニューを作成・再登録する
```text
./ffworkers-run-richmenu.sh -env ffdev  # 開発環境  
./ffworkers-run-richmenu.sh -env ffprod # 本番環境(一発で変わるから十分注意すること)
```

--- 

## 10. 💡 注意点
- D:/nasubi/... のようなWindows用パスが登場しますが、Macでは /Users/yourname/projectname/... に置き換えてください（ファイル内コメントに明記しています）。
- Cloudflareの環境変数はGUIで「Variables」「Secrets」として登録しておくと、メニュー画面更新以外は.env を直接触らずにすみます。まあメニュー画面更新では.envファイルを更新しなくちゃいけませんから一緒と言えば一緒。
- 📦 環境変数の管理例（Variables は GUIで登録 / Secrets は GUI またはスクリプトで登録）
    - Variables（例）: GCLOUD_PROJECT=inuichiba-ffworkers-ffprod
    - Secrets（例）  : CHANNEL_ACCESS_TOKEN_FFDEV, CHANNEL_SECRET_FFDEV, SUPABASE_URL_FFDEV / など
- ffdev 環境で十分テストしてから ffprod に切り替えること。
- D:\やC:\などWindows特有のパス表記は一切使わないでください
- Macでは ~/projects/... や /Users/yourname/projectname/... のような絶対パスが基本です
- .sh 実行時に「Permission denied」が出たら以下を実行してください：
```bash
chmod +x ./ffworkers-upload.sh
```       

---

## 11. ❓質問・トラブル
- プロジェクトが動いたら README-MAC.md に追加したいことがあれば Pull Request をどうぞ！
- わからないことがあれば ChatGPT先生 or 先輩 に聞いてください 🙇

