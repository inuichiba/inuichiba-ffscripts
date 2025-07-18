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

### 2-1. クローン

```bash
git clone https://github.com/inuichiba/inuichiba-ffworkers.git
git clone https://github.com/inuichiba/inuichiba-ffscripts.git
git clone https://github.com/inuichiba/inuichiba-ffimages.git
```
- 注意：
  - 🚫 GitHub上で「Fork」は **絶対に押さないでください**。
  - ✅ git remote -v で origin が inuichiba になっていることを確認。

### 2-2. git remote URL の確認コマンド

```bash
git remote -v
```

期待される出力（例）：

```bash
origin  https://github.com/inuichiba/inuichiba-ffworkers.git (fetch)
origin  https://github.com/inuichiba/inuichiba-ffworkers.git (push)
```

### 2-3. 問題があったときの対処（origin のURL修正）

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

### 5-1. Pull（他の人の変更を取り込む）

```bash
./git-pull-main.sh -target ffworkers  # inuichiba-ffworkers の変更を取り込む
./git-pull-main.sh -target ffimages   # inuichiba-ffimages  の変更を取り込む
./git-pull-main.sh -target ffscripts  # iniuchiba-ffscripts の変更を取り込む
```

#### 5-1-1. いつ pull するか
- 以下のようなタイミングで pull を実行するのがよいです：
```text
タイミング                              理由
作業を始める前                          最新のリモート状態を取り込むため（最重要）
他の人がpushしたと聞いた時               リモートが更新されたから
uploadスクリプトで差分ありと警告された時  pushできないので先にpullが必要
```

#### 5-1-2. 最新の変更を取り込む
- 基本について、`git pull origin main` とは 「リモート（origin）のmainブランチをローカルに取り込む」 という意味です。
- 今のブランチが main なのでこれで問題ありません。
- 他の人が何か変更したかもしれないので、まずはリモートの内容を取り込みます。
- このプロジェクトでは `git pull origin main` を手動で行う必要は **ありません**。
- コマンドではなく、pull 専用スクリプト `git-pull-main.sh` を使ってください。安心できます。
- 💡 push 前には必ず `git-pull-main.sh` を実行して、他の人の変更を取り込みましょう。
- ❌ pull を忘れると push が失敗し、**競合** が発生することがあります。


### 5-2. Push（自分の変更を反映）

```bash
./ffworkers-upload.sh        # Workers のコード更新(Git 登録)
./ffimages-upload-deploy.sh  # 画像更新(Git 登録)＋Cloudflare Pagesへ反映
./ffscripts-upload.sh        # スクリプトの更新 (Git 登録)
```

#### 5-2-1. 自分の変更を反映する（add → commit → push）

- コマンドの意味は次の通りです。
- 実際は ffimages-upload-deploy.sh / ffworkers-upload.sh / ffscripts-upload.sh を使ってください。
```bash
git status                      # 変更点を確認
git add -A                      # 追加/削除/変更のすべてをステージに追加
git commit -m "変更内容を簡潔に"  # 変更内容を短いメッセージで記録（-m:message の略）
git push origin main            # リモート（GitHub）へ送信
```

### 5-3. 🧠 補足：この作業がなぜ必要か？

```bash
# 操作      # 目的
pull        # 他の人の変更を自分に反映（競合防止）
push        # 自分の変更をGitHubに反映（バックアップ・共有）
add/commit  # ローカルでの作業履歴の記録（Gitの基本）
```

---

## 6 Wrangler 初期化と構成の注意点（Cloudflare Workers / Pages）

- このプロジェクトでは、Cloudflare 向けに `wrangler.toml` を使用していますが、**使い方と初期化場所には注意が必要です。**

### ✅ 6-1. inuichiba-ffworkers（Workers本体）

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

### ✅ 6-2.  inuichiba-ffscripts（スクリプト集 + Cloudflare Pagesデプロイ）

#### 6-2-1. このリポジトリは Workers を実行するわけではありませんが、`Cloudflare Pages 用に wrangler を使っています。`

```bash
wrangler init inuichiba-ffscripts
```

#### 6-2-2. 背景と構成方針：
- inuichiba-ffimages は .git と public/ のみを持つ **最小構成リポジトリ** です。
- そのため、Pages のデプロイ処理や wrangler.toml は **ffscripts 側に集約** しています。
- 実際の画像デプロイは以下で行います：

```bash
./ffimages-upload-deploy.sh  # ffscripts/sh 配下に配置
```

#### 6-2-3. wrangler init による自動生成ファイルと取扱

```test
🔍 wrangler init によって自動生成される主なファイルと対応
ファイル/ディレクトリ 用途                       inuichiba-ffscripts では
wrangler.toml       Pagesデプロイ設定ファイル    ✅ 必要（Gitから最新版を PULL すること）
package.json        npm依存管理、sharpなどで使用 ✅ 必要（ffscripts で使用。削除禁止）
src/index.js        Workers エントリーポイント   ❌ 不要 → 削除OK
tsconfig.json       TypeScript用               ❌ 不要 → 削除OK
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
    - "node": ">=18.0.0" 指定により、Node.js のバージョンは 18.0以上が必要です。

### ✅ 6-3. package.json について

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
- エラーが出る場合は、Node.js のバージョンが古すぎないか確認してください(私はv22よ)。

```bash
# inuichiba-ffworkers
cd ~/inuichiba-ffworkersvvvv
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

### 📌 6-4. 運用まとめ

```text
リポジトリ           wrangler init	用途                       備考
inuichiba-ffworkers ✅ 必要        Cloudflare Workers 用      LINE Bot 本体、Webhook処理、Supabase通信など
inuichiba-ffscripts ✅ 必要        Cloudflare Pages 用の設定  ffimages/public を安全にデプロイするため
inuichiba-ffimages  ❌ 不要        画像のみ（最小構成）        .gitとpublic/ と最小限の設定ファイルで構成
```

---

## 7. Cloudflare Workers のデプロイ

### 🔍 7-1. デプロイ(修正が LINE Bot へ反映される)：

```bash
npx wrangler deploy --env ffdev   # 開発環境
npx wrangler deploy --env ffprod  # 本番環境(慎重に！)
```

- 必ず ffdev でデプロイし、動作確認してから ffprod をデプロイすること。
- 知らないうちに仕様変更が行われていて、**デプロイしたとたん動かなくなる** ことが多々あります。

### 🔍 7-2. ログ確認（Bot応答確認に便利）：

```bash
npx wrangler tail --env ffdev
```

### 🔍 7-3. LINE Bot の設定

#### 7-3-1. LINE Developers で設定する Webhook URL は以下です：

```text
環境   Webhook URL
ffdev  https://inuichiba-ffworkers-ffdev.○○○.workers.dev  
ffprod https://inuichiba-ffworkers-ffprod.○○○.workers.dev 
```

- 最初に私の公式LINEをそのまま使う場合は次のURLを使ってください。

```text
環境   Webhook URL
ffdev  https://inuichiba-ffworkers-ffdev.maltese-melody0655.workers.dev
ffprod https://inuichiba-ffworkers-ffprod.maltese-melody0655.workers.dev 
```
  
- デプロイ後にURLが表示されます(○○○を埋めてください。多分nasubi810だとは思うけど) 。
- UTL を GUI から見つける方法
    - https://dash.cloudflare.com/ から自分の Account Home -> Compute(Workers) -> Workers & Pages へ行きます
    - 開発なら inuichiba-ffworkers-ffdev をクリックし、Setting タブをクリック
    - Domains & Routes に表示されている workers.dev に表示されている値の最初に `https://` をつけて LINE Bot へ登録
- LINE Bot の LINE Developers の `Webhook利用` を `ON` にしてください。
- Secrets（チャネルアクセストークンやチャネルシークレットなど）の登録も忘れずに行ってください。
    - Variables も Secrets も改行や空白や"などを付けて登録してはいけません。
- Secrets を GUI から登録する方法
    - 上記 Settings の Variables and Secrets にあります
    - GCLOUD_PROJECT はプレーンテキストなので必ず GUI で登録すること(スクリプトだと全て Secret で登録してしまうため)

#### 7-3-2. LINE Developers（ffdev/ffprod 両方とも定義）

- `Webhook の利用` ON
- `グループトーク・複数人トークへの参加を許可する` 有効
- `応答メッセージ` 有効

#### 7-3-3. LINE Official Account Mananger（ffdev/ffprod 両方とも定義）

- `チャット` OFF
- `あいさつメッセージ` OFF
- `Webhook` ON

- `応答メッセージ` ON
    - タイトル `QRコード自体はBotで出す`
    - キーワード応答 `QRコード` , `友だち登録`
    - オプション指定 `OFF`
    - 対応するメッセージは次のとおり（変更したければ好きにしてくれて構いません）
```text
{友達の表示名}さん、「{アカウント名}」の友だち追加用のQRコードです。  
どうぞお使いくださいね。
```
- 応答メッセージは、 `QRコードを付けて` 表示されます（messages.jsで実行）

#### 7.3.4 Webhook URL の検証ボタン

- 準備が正しく整っていたら **検証** ボタンを押すと「成功」が返ります（内部的には 200 が返ります）。
- それ以外が返った場合はデバッグの腕の見せ所です。ChatGPT や前任者に頼って解決してください。
- 検証ボタンで「成功」が返らない場合や、LINE の X-Line-Signature でのエラーの場合、解決まで比較的時間がかかります。
- スクリプトの正しさを見抜く目と、定義を正しく行うことがとても重要です。

- その他になりますが、公式LINEには最低限チャネルアイコン（写真）、チャネル説明などは定義してください。何も定義がないと、ブロックされているとみなされ、Supabase書き込みなどに失敗します。
- 公式LINE は `Messageing API`、アプリタイプは `ボット` など、正しく設定してください。

---

## 8. リッチメニューの再登録

### 8-1. メニュー画像の BASE64 変換 & JSファイル化

```bash
cd ~/inuichiba-ffscripts/
node compress-images.js base64         # 通常モードで変換後、Base64に変換して画像名.jsで格納する
node compress-images.js detail base64  # 詳細モードで変換後、base64に変換して画像名.jsにして格納する
```

- WindowsもMacも同じスクリプトが使えるため、`/Users/yourname/projectname/inuichiba-ffscripts/` 配下にあることに注意してください。
- Sharp が必要など、いくつかインストール作業が必要。詳細は上記や compress-images.js を参照してください。
- もともとは inuichiba-ffimages で使う画像ファイルの横幅を変更したり、ファイルサイズを圧縮したりするために使っています。

### 8-2. メニューの反映

```bash
./ffworkers-run-richmenu.sh -env ffdev   # 開発環境で確認
./ffworkers-run-richmenu.sh -env ffprod  # 本番適用（慎重に！）
```

- 必ず ffdev で再作成し、動作確認してから ffprod を再作成してください。
- 知らないうちに仕様変更が行われていて、再作成したとたん動かなくなることが多々あります。

---

## 9. VSCode 推奨理由と導入

```bash
brew install --cask visual-studio-code
```

- VSCode は、構文補完、Git連携、ターミナル統合など Mac初心者に最適な開発環境です。
- 詳細は `README-MAC-VSCode.md` を参照してください。

---

## 10. よく触るファイル（編集対象）

```bash
ffworkers/src/handlers/event.js                   # 応答処理の中心
ffworkers/src/richmenu-manager/*.js               # メニュー構成や表示データ
ffworkers/src/richmenu-manager/data/messages.js   # 表示するメッセージ定義やpostbackの定義
ffworkers/src/lib/env.js                          # 環境設定（参照のみ、変更は要注意）
```

---

## 11. よくあるエラー・注意点

```text
エラー内容           対処法
Permission          denied chmod +x script.sh で実行権限を付ける
pushできない         git-pull-main.sh で最新化してから再実行
Secretsが未登録     .env.secrets.ff*.txt を読み込み登録する
Windowsパスが登場    Macでは /Users/... 形式で書き換えること
Pushしたが変化なし   差分がないと何も起きません（正常）
```

---

## 12. シークレット設定（環境変数）

```bash
# ffdev環境に登録
./ffworkers-set-secrets.sh -env ffdev

# ffprod環境に登録
./ffworkers-set-secrets.sh -env ffprod
```

- Secretsは src/secrets/.env.secrets.ff*.txt にまとめてください。
- これを実行すると,env.secrets.ff*.txtに定義してある内容が全て書き換えられます。
- ただし、secretsファイルは秘匿ファイルなのでGitに登録してはいけません(他にばれたらいけないファイルで .gitignore 対象)。
- なので、必要になった(自分の LINE Bot の Official Account の値を登録する)時点で前任者に相談してください。
- GUIから登録することも可能です（https://dash.cloudflare.com → Workers & Pages）。
- `package.json / pasckage-lock.json` は `inuichiba-ffscripts / inuichiba-ffworkers` のどちらも Node.js の依存関係を含むため、Git に含めなければなりません。他の開発者も同じ環境でスクリプトを実行できるようにするため、**.gitignore に含めてはいけません。**

---

## 13. 開発と本番の切り替え

- Gitは main ブランチ1本で運用
- Supabase や LINE Bot 設定は isProd フラグで自動判別（ffdev / ffprod）
- メニューは isProd で切り替わるが、何か所かにあるので注意して切り替えること

---

## 14. 困ったときは
- ChatGPT や前任者に相談してください。
- /sh配下のスクリプトは評価されていません。問題が発生する可能性は高いので（一度で通らないのが普通）、しっかり証拠（画面に出たログやどうしたかったかやスクリプト内容など）を添えて、ChatGPT に問い合わせてください。
- README に改善案があれば Pull Request を歓迎します 🙌






