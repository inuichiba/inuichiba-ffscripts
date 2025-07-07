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

## 📁 推奨ファイル構成（例）
<pre>
inuichiba-ffscripts/
  ffimages-compress-images.js # ping(jpeg)をファイルサイズを圧縮したjpegに変換
  ffimages-compress           # 変換ファイルのI/Oが入るディレクトリ
     input                    # 圧縮したいファイルを入れる
     output                   # 日付時間のディレクトリに変換後のファイルが格納される
     ： 
  ffimages-upload-deploy.ps1  # inuichiba-ffimages をGit登録し、画像ファイルをデプロイ(再キャッシュ)
  ffscripts-upload.ps1        # inuichiba-ffscripts をGit登録する
  ffworkers-upload.ps1        # inuichiba-ffworkers をGit登録する(デプロイは手動で実施)
  ffworkers-set-secrets.ps1   # inuichiba-ffworkers の Secret を .env.secrets.ff*.txt を元に一括登録
     :
  .github
     workflows
       ping-supabase.yml      # Supabaseに5日に1回自動でpingするyaml。エラー時メールとDiscordに通知
     :
  .git                        # Git が使用するファイル群一式 
  .gitignore                  # Git に含めないファイルを記述(秘匿ファイルやログなど不必要なファイル) 
  .gitattributes              # このリポジトリ内のファイルを、Git がどう扱うかを指定する設定ファイル 
     :
  wrangler.toml               # Cloudflare Pages(inuichiba-ffimages) 向け構成ファイル
  README.md                   # このファイル(このディレクトリの説明を書いたファイル)

  ※yaml … Git Push すると GitHub の Actions へ登録され、そこで(自動/手動)実行するファイル
</pre> 


