# 🚀 inuichiba 開発セットアップガイド for Macユーザー

このガイドは、以下3つのリポジトリを使って Cloudflare Workers / Pages 開発を行う **Mac初心者** 向けに作成されています。

- `inuichiba-ffworkers`：LINE Bot本体
- `inuichiba-ffimages`：Flex画像やQRコード管理
- `inuichiba-ffscripts`：GitやCloudflare操作スクリプト

```text
<<リポジトリ構成>>

projectname/
├── inuichiba-ffimages/
│   ├── README.md（必要最小限のファイルしか入れないポリシーの明記。画像アップロード方法など）
│   └── PUBLIC/ ⭐画像ファイル
│
├── inuichiba-ffscripts/
│   ├── README-MAC.md（←このファイル）
│   ├── README-MAC-VSCode.md（VSCodeで最低限入れておくべき拡張ファイルの一覧）
│   └── git-pull-main.ps1 など⭐Windows向けスクリプト
│       └── sh
│           └── git-pull-main.sh など⭐Mac向けスクリプト
│
└── inuichiba-ffworkers/
    ├── README.md（運用ポリシー、ファイル構成、Workers デプロイ手順など）
    └── src/ ⭐ソースファイル
```

---

## 1. 必要なツールのインストール

すべて **Homebrew でインストール可能**です：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"  # Homebrew
brew install git
brew install node
npm install -g wrangler
brew install --cask visual-studio-code
```

💡 インストール確認：

```bash
node -v && npm -v && npx -v
wrangler --version
git --version
```

---

## 2. リポジトリのクローン

### クローン

```bash
git clone https://github.com/inuichiba/inuichiba-ffworkers.git
git clone https://github.com/inuichiba/inuichiba-ffscripts.git
git clone https://github.com/inuichiba/inuichiba-ffimages.git
```
- 注意：
  - 🚫 GitHub上で「Fork」は **絶対に押さないでください**。
  - ✅ git remote -v で origin が inuichiba になっていることを確認。

### git remote URL の確認コマンド

```bash
git remote -v
```

期待される出力（例）：

```bash
origin  https://github.com/inuichiba/inuichiba-ffworkers.git (fetch)
origin  https://github.com/inuichiba/inuichiba-ffworkers.git (push)
```

### 問題があったときの対処（origin のURL修正）

```bash
git remote set-url origin https://github.com/inuichiba/inuichiba-ffworkers.git
```
- ffscripts や ffimages も同様です。

---

## 3. Cloudflare ログイン

```bash
cd inuichiba-ffworkers
wrangler login
```

- 🌐 ブラウザでCloudflareにログイン → 自動でCLIに戻ります。

---

## 4. スクリプト実行準備

```bash
cd ~/yourpath/inuichiba-ffscripts/sh
chmod +x *.sh  # 初回だけでOK
```

- 以降、全Git操作・デプロイはスクリプトを使います。
- *.sh は /sh フォルダにまとまっています。

---

## 5. Git操作：Pull → Push の流れ

### Pull（他の人の変更を取り込む）

```bash
./git-pull-main.sh -target ffworkers
./git-pull-main.sh -target ffimages
./git-pull-main.sh -target ffscripts
```

#### A. いつ pull するか
- 以下のようなタイミングで pull を実行するのがよいです：
```text
タイミング                              理由
作業を始める前                          最新のリモート状態を取り込むため（最重要）
他の人がpushしたと聞いた時               リモートが更新されたから
uploadスクリプトで差分ありと警告された時  pushできないので先にpullが必要
```

#### B. 最新の変更を取り込む
- 基本について、`git pull origin main` とは 「リモート（origin）のmainブランチをローカルに取り込む」 という意味です。
- 今のブランチが main なのでこれで問題ありません。
- 他の人が何か変更したかもしれないので、まずはリモートの内容を取り込みます。
- このプロジェクトでは `git pull origin main` を手動で行う必要は **ありません**。
- コマンドではなく、pull 専用スクリプト `git-pull-main.sh` を使ってください。安心できます。
- 💡 push 前には必ず `git-pull-main.sh` を実行して、他の人の変更を取り込みましょう。
- ❌ pull を忘れると push が失敗し、**競合** が発生することがあります。


### Push（自分の変更を反映）

```bash
./ffworkers-upload.sh        # Workers のコード更新(Git 登録)
./ffimages-upload-deploy.sh  # 画像更新(Git 登録)＋Cloudflare Pagesへ反映
./ffscripts-upload.sh        # スクリプトの更新 (Git 登録)
```

#### A. 自分の変更を反映する（add → commit → push）

- コマンドの意味は次の通りです。
- 実際は ffimages-upload-deploy.sh / ffworkers-upload.sh / ffscripts-upload.sh を使ってください。
```text
git status            # 変更点を確認
git add -A            # すべての変更をステージに追加
git commit -m "変更内容を簡潔にわかりやすく書く"
git push origin main  # リモート（GitHub）へ送信
```

#### B. 🧠 補足：この作業がなぜ必要か？

```text
操作        目的
pull        他の人の変更を自分に反映（競合防止）
push        自分の変更をGitHubに反映（バックアップ・共有）
add/commit  ローカルでの作業履歴の記録（Gitの基本）
```

---


## 5.5 Wrangler 初期化と構成の注意点（Cloudflare Workers / Pages）

- このプロジェクトでは、Cloudflare 向けに `wrangler.toml` を使用していますが、**使い方と初期化場所には注意が必要です。**

### ✅ inuichiba-ffworkers（Workers本体）

- このリポジトリは Cloudflare Workers を用いた LINE Bot の本体です。
- コマンド実行前に package.json を退避してください（あれば。詳細後述）。

```bash
wrangler init inuichiba-ffworkers
```

- 初期化により以下が自動生成されます：
    - wrangler.toml
    - src/index.js（または src/handlers/event.js など）
    - package.json (なければ) 

- package.json がある場合は、内容を守るために、あらかじめ次の処置を行っておいてください。
 
```bash
cp package.json package.json.bak  # バックアップを取ってから wrangler init
```

- init 中に "Overwrite? (y/n)" と聞かれる場合は "n" を選択して上書きされないよう気を付けてください。
- npm install -g wrangler 等のグローバルパッケージは影響ありません。

- デプロイ前(動作させる前)には必ず wrangler.toml 等の設定ファイルや src/index.js などのソースファイルの最新版を Git から取得してください。これらのコードは Git で管理されています。
  
```bash
cd ~/inuichiba-ffscripts/sh
./git-pull-main.sh -target ffworkers
```

### ✅ inuichiba-ffscripts（スクリプト集 + Cloudflare Pagesデプロイ）

#### このリポジトリは Workers を実行するわけではありませんが、`Cloudflare Pages 用に wrangler を使っています。`

```bash
wrangler init inuichiba-ffscripts
```

#### 💡 背景と構成方針：
- inuichiba-ffimages は .git と public/ のみを持つ **最小構成リポジトリ** です。
- そのため、Pages のデプロイ処理や wrangler.toml は **ffscripts 側に集約** しています。
- 実際の画像デプロイは以下で行います：

```bash
./ffimages-upload-deploy.sh  # ffscripts/sh 配下に配置
```

#### 📁 wrangler init による自動生成ファイルと取扱

```test
🔍 wrangler init によって自動生成される主なファイルと対応
ファイル/ディレクトリ 用途                       inuichiba-ffscripts では
wrangler.toml	      Pagesデプロイ設定ファイル    ✅ 必要（Gitから最新版を PULL すること）
package.json       	npm依存管理、sharpなどで使用 ✅ 必要（ffscripts で使用。削除禁止）
src/index.js        Workers エントリーポイント   ❌ 不要 → 削除OK
tsconfig.json	      TypeScript用               ❌ 不要 → 削除OK
test/index.test.js  単体テスト用テンプレート     ❌ 不要 → 削除OK
```

- 🔐 package.json の備考
    - inuichiba-ffscripts/package.json には以下が定義されています（2025年7月現在）：

```json
{
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "sharp": "^0.34.1"
  }
}
```
    - type: "module" 指定により、ESM形式の import/export を使用しています。
    - "node": ">=18.0.0" 指定しています。Node.js のバージョンは 18.0以上が必要です。

### ✅ package.json について

- pullした場合、最新の packge.json と置き換わります。
- そのため、最新の packge.json と同じ内容にするために、次を実行してください。

```bash
# inuichiba-ffworkers
cd ~/inuichiba-ffworkers
./git-pull-main.sh -target ffworkers
npm install  # ← これだけですべて自動的に復元されます

# inuichiba-ffscripts
cd ~/inuichiba-ffscrtips
./git-pull-main.sh -target ffscripts
npm install  # ← これだけですべて自動的に復元されます
```

- これによって、dependencies と devDependencies の両方が自動的に入ります。
- sharp, vitest, zod, wrangler などすべての開発・本番依存が自動的にインストールされます。

- ただし、Node.js バージョンが極端に古いと失敗することがあるため、Node.js は 18 以上である必要があります。
- エラーが出る場合は、Node.js のバージョンが古すぎないか確認してください。

```bash
# inuichiba-ffworkers
cd ~/inuichiba-ffworkers
node -v   # → v18.XX.X 以上であること

# inuichiba-ffscripts
cd ~/inuichiba-ffscrtips
node -v   # → v18.XX.X 以上であること
```

- Node.js が古い場合、次のようにインストールしてください。

```bash
# inuichiba-ffworkers
cd ~/inuichiba-ffworkers
brew install node

# inuichiba-ffscripts
cd ~/inuichiba-ffscrtips
brew install node
```

### 📌 運用まとめ

```text
リポジトリ           wrangler init	用途                       備考
inuichiba-ffworkers ✅ 必要        Cloudflare Workers 用      LINE Bot 本体、Webhook処理、Supabase通信など
inuichiba-ffscripts ✅ 必要        Cloudflare Pages 用の設定  ffimages/public を安全にデプロイするため
inuichiba-ffimages  ❌ 不要        画像のみ（最小構成）        .gitとpublic/ と最小限の設定ファイルで構成
```

---

## 6. Cloudflare Workers のデプロイ

### 🔍 デプロイ(修正が LINE Bot へ反映される)：

```bash
npx wrangler deploy --env ffdev   # 開発環境
npx wrangler deploy --env ffprod  # 本番環境(慎重に！)
```

- 必ず ffdev でデプロイし、動作確認してから ffprod をデプロイすること。
- 知らないうちに仕様変更が行われていて、デプロイしたとたん動かなくなることが多々あります。

### 🔍 ログ確認（Bot応答確認に便利）：

```bash
npx wrangler tail --env ffdev
```

### 🔗 Webhook URLの登録（LINE Developers）

- LINE Developersで設定するWebhook URLは以下です：

```text
環境   Webhook URL                                        
ffdev  https://inuichiba-ffworkers-ffdev.○○○.workers.dev  
ffprod https://inuichiba-ffworkers-ffprod.○○○.workers.dev 
```

- デプロイ後にURLが表示されます
- UTL を GUI から見つける方法
    - https://dash.cloudflare.com/ から自分の Account Home -> Compute(Workers) -> Workers & Pages へ行く
    - 開発なら inuichiba-ffworkers-ffdev をクリックし、Setting タブをクリック
    - Domains & Routes に表示されている workers.dev に表示されている値の最初に `https://` をつけて LINE Bot へ登録
- LINE Bot の `Webhook利用` を `ON` にしてください。
- LINE Bot の `応答メッセージ` を `有効` にしてください。
- Secrets（チャネルアクセストークンやチャネルシークレットなど）の登録も忘れずに行ってください。
    - Variables も Secrets も改行や空白や"などを付けて登録してはいけません 。
- Secrets を GUI から登録する方法
    - 上記 Settings の Variables and Secrets にある
    - GCLOUD_PROJECT はプレーンテキストなので必ず GUI で登録すること(スクリプトだと全て Secret で登録してしまうため)

---

## 7. リッチメニューの再登録

### メニュー画像の BASE64 変換 & JSファイル化

```bash
cd ~/inuichiba-ffscripts/
node compress-images.js base64         # 通常モードで変換後、Base64に変換して画像名.jsで格納する
node compress-images.js detail base64  # 詳細モードで変換後、base64に変換して画像名.jsにして格納する
```

- WindowsもMacも同じスクリプトが使えるため、`/Users/yourname/projectname/` 配下にあることに注意してください
- Sharp が必要など、いくつかインストール作業が必要。詳細は compress-images.js を参照してください
- もともとは inuichiba-ffimages で使う画像ファイルの横幅を変更したり、ファイルサイズを圧縮したりするために使っています

### メニューの反映

```bash
./ffworkers-run-richmenu.sh -env ffdev   # 開発環境で確認
./ffworkers-run-richmenu.sh -env ffprod  # 本番適用（慎重に！）
```

---

## 8. VSCode 推奨理由と導入

```bash
brew install --cask visual-studio-code
```

- VSCode は、構文補完、Git連携、ターミナル統合など Mac初心者に最適な開発環境です。
- 詳細は `README-MAC-VSCode.md` を参照してください。

---

## 9. よく触るファイル（編集対象）

```bash
ffworkers/src/handlers/event.js                   # 応答処理の中心
ffworkers/src/richmenu-manager/*.js               # メニュー構成や表示データ
ffworkers/src/richmenu-manager/data/messages.js   # 表示するメッセージ定義やpostbackの定義
ffworkers/src/lib/env.js                          # 環境設定（参照のみ、変更は要注意）
```

---

## 10. よくあるエラー・注意点

```text
エラー内容           対処法
Permission          denied chmod +x script.sh で実行権限を付ける
pushできない         git-pull-main.sh で最新化してから再実行
Secretsが未登録     .env.secrets.ff*.txt を読み込み登録する
Windowsパスが登場    Macでは /Users/... 形式で書き換えること
Pushしたが変化なし   差分がないと何も起きません（正常）
```
---

## 11. シークレット設定（環境変数）

```bash
# ffdev環境に登録
./ffworkers-set-secrets.sh -env ffdev

# ffprod環境に登録
./ffworkers-set-secrets.sh -env ffprod
```

- Secretsは src/secrets/.env.secrets.ff*.txt にまとめてあります。
- これを実行すると,env.secrets.ff*.txtに定義してある内容が全て書き換えられます。
- ただし、secretsファイルは秘匿ファイルなのでGitに登録してはいけません(他にばれたらいけないファイルで .gitignore 対象)。
- なので、必要になった(自分の LINE Bot の Official Account の値を登録する)時点で前任者に相談してください。
- GUIから登録することも可能です（https://dash.cloudflare.com → Workers & Pages）。
- `package.json / pasckage-lock.json` は `inuichiba-ffscripts / inuichiba-ffworkers` のどちらも Node.js の依存関係を含むため、Git に含めなければなりません。他の開発者も同じ環境でスクリプトを実行できるようにするため、**.gitignore に含めてはいけません。**

---

## 12. 開発と本番の切り替え

- Gitは main ブランチ1本で運用
- Supabase や LINE Bot 設定は isProd フラグで自動判別（ffdev / ffprod）
- メニューは isProd で切り替わるが、注意して切り替えること

---

## 13. 困ったときは
- ChatGPT や前任者に相談してください。
- READMEに改善案があれば Pull Request を歓迎します 🙌






