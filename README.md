# inuichiba-ffscripts

このリポジトリは、`inuichiba-ffimages` や `inuichiba-ffworkers` のような複数プロジェクトで共通して使用される、**CLIスクリプト群の保管場所**です。  
Node.js・PowerShellベースの作業用スクリプトを主に収録しています。

末尾に「保守運用中の私へ」を載せました。GitHub や Supabase から**警告メール**が来たら、焦らずここを参照してその手順を実行してください。

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
  compress-images.js          # ffimagesでの画像ファイルの圧縮、ffworkersでのメニュー画像のBase64 JS化 
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
  .editorconfig               # VSCodeでどう動くかを定義した設定ファイル
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
    - `node-fetch`（必要に応じて）
    - `@cloudflare/kv-asset-handler` など
- `type: "module"` が指定されているため、**ESM形式で記述されています**。


### 2. ping-supabase.yml（GitHub Actions）-- 末尾参照のこと
- yamlとは、Git Push すると GitHub の Actions へ登録され、そこで(自動/手動)実行するファイルのこと。
- Supabase が稼働し続けることを確認するための **定期Ping処理**。
- **隔日** 実行。
- Cloudflare Workers の `/ping` エンドポイントを呼び出します。
- 失敗時は Discord およびメールに通知され、内容がログに残ります。
- Supabase はテーブルに7日間アクセスがないとメールで警告を送り、1ヶ月半でそのテーブルを削除します。この定期pingは削除されないための方策です。詳細は末尾の「保守運用中の私へ」を参照。


### 3. .gitignore（Git管理除外ファイル）
- `node_modules/` や `.env*` など、**開発に不要または秘匿ファイルをGitに含めないようにする設定ファイル**。
- 秘匿ファイルは `inuichiba-ffworkers/scr/secrets/` 配下にしか今はない。
- GitHubにいたらないものを登録しないよう、ファイルの中身には十分な配慮が必要。
- 主な除外対象：
    - `node_modules/`（依存パッケージ）
    - `*.log`（ログファイル）
    - `src/secrets/`（秘匿 `Secrets` ファイル） … inuichiba-ffworkersにのみある
    - `.backup/`（バックアップ系ログや設定） … inuichiba-ffworkersにのみある


---

## 🛠 保守運用中の私へ（超重要）

このプロジェクトは **Supabase（無料プラン）** を使っています。  
Supabase には以下の仕様があります。

---

### ❗ そもそも論：なぜ ping が必要か

Supabase の **無料プラン**では、

- **7日間、アクセスが一切ないプロジェクトは**
- **自動的に「一時停止（pause）」される**

という仕様があります。

一時停止されると：
- DB / API / Auth が使えなくなる
- Dashboard からは見える
- 90日以内なら復帰可能だが、止まるのは困る

👉 **止めないためには「定期的にアクセスがある」状態を作る必要があります。**

---

### ✅ 対策：Supabase に ping を送る仕組み

そのために、このリポジトリでは：

- **GitHub Actions** を使って
- **Supabase に定期的に ping（軽いアクセス）**を送っています

#### GitHub Actions とは？
GitHub 上で  
「決まった時間に自動で処理を実行してくれる仕組み」です。

---

### 📄 ping 用の設定ファイル（重要）

Supabase に ping する設定は、以下のファイルにあります。
 inuichiba-ffscripts/.github/workflows/ping-supabase.yml


- この `ping-supabase.yml` が **自動実行の心臓部**
- 現在は **隔日（2日に1回）** 実行される設定

---

### ⏰ cron（クロン）とは？
`ping-supabase.yml` の中にある

```yml
schedule:
  - cron: '5 3 */2 * *'
```

これが cron。（cron = 「いつ実行するか」を決める書式）
GitHub Actions の cron は UTC基準
この設定は、隔日・JST 12:05 頃に実行される
👉 これで Supabase は「使われている」と判断される。

⚠️ もう一つ超重要な罠（GitHub 側の仕様）
GitHub Actions には、もう一つ落とし穴があります。

---

### ❗ GitHub の仕様
60日間、Actions の実行履歴がない workflow は schedule（自動実行）が止まる

※ GitHub の仕様として、
60日以上 Actions の実行履歴がない workflow は、GitHub 側で「不要」と判断され、
- schedule（cron）が自動的に止められる
- 警告メールでは「削除」や「disable」と表現されることがある
ただし、workflow の yml ファイル自体がリポジトリから消えるわけではない。

一度でも手動実行すれば、再び cron は動き出す。

だからここで重要なのは：
❌ コードを push しただけではダメ
❌ README を直しただけでもダメ
⭕ **Actions が「実際に1回実行」**される必要がある

🛠 だから必要な作業（60日ルール対策）
もし以下のような状況になったら：
・Supabase から「pause するよ」メールが来た
・GitHub から「60日変更なし」警告が来た
・Actions が止まっている気がする
やることはこれだけ👇

---

## ① yml をちょっと変更する（変更することが GitHub からの停止回避に必要なため）

例：
  コメントを1文字追加
対象ファイル：
  inuichiba-ffscripts/.github/workflows/ping-supabase.yml

## ② push する（超重要）

push は 手動でやらない。必ずこのスクリプトを使う👇
  inuichiba-ffscripts/ffscripts-upload.ps1

👉 このスクリプトは：
・add / commit / push を全部まとめてやってくれる
・手順ミス防止用
・未来の自分を救う神スクリプト

## ③ GitHub Actions で「手動実行」する

- GitHub にログインする。https://github.com/
- Google でログインを選び、maltese.melody0655@gmail.com でログインする。
- inuichiba を選び、inuichiba-ffscripts を選ぶ。

- GitHub の画面で：
  1.Actions タブを開く
  2.「Supabase user-tables Ping(every other day)」 を選ぶ
  3.Run workflow を押し、緑の「Run workflow」ボタンを押す
  4.結果が数分で返ってくる。実行結果の左端が丸い緑のチェックマークであればOK

表示される
  This workflow has a workflow_dispatch event trigger.
は エラーではない。「手動実行できますよ」という意味。
👉 1回でも実行されれば OK

✅ これでどうなる？
・GitHub は「この workflow は使われている」と判断
・以降 60日間は削除されない
・cron が復活
・隔日で自動 ping が走り続ける
・Supabase は pause されない

## ④ Supabase から警告メールが来ていれば、Supabaseも確認しておく
##   （GitHub はまだ閉じちゃ駄目）

- Supabase にログインする。https://supabase.com/dashboard/projects/
- GitHub の ID でそのままログインする
  GitHub を閉じてたら、Google のログインから maltese.melody0655@gmail.com でログイン
- Projects の下に表示される「inuichiba」が正常表示されていればまず第一段階クリア
- inuichiba をクリックし、Database をクリックし、各テーブルが表示され、各テーブルをクリックしたら中身が見えれば OK

### Supabase が止まっていないか確実に確認する方法

- 左端のメニューの「SQL Editor」で以下を実行する：
  select 1;

- 上記を書いて、右下の緑の「Run CTRL」をクリック
- 下側に、?column? の枠に 1 が返れば、Supabase は稼働中

- なぜこのチェックが最強か
  select 1; は：
  ・テーブルに依存しない
  ・権限にもほぼ依存しない
  ・最小コスト
  ・成功 / 失敗が即わかる
  👉 保守運用の最終確認として最適


## 🎯 最後に（未来の私へ）

・手順を覚えなくていい
・思い出せなくていい
・README とスクリプトを信じていい

困ったら：
  1.この章を読む
  2.yml をちょっと直す
  3.ffscripts-upload.ps1 を実行
  4.inuichiba-ffscripts で Actions の Supabase user-tables Ping を手動実行
それだけ。
この仕組みを作った過去の自分は、ちゃんと正しい。

