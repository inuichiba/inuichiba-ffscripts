
# 🍏 Mac環境での開発セットアップ手順（inuichibaプロジェクト共通）

このドキュメントは、Macで `inuichiba-ffworkers` / `inuichiba-ffscripts` / `inuichiba-ffimages` を扱う初心者向けの手順書です。
**Windows向けと混同しないよう、すべてMac専用の記述になっています。**

---

## 🔌 VSCode に入れるべき拡張機能（全プロジェクト共通）
<pre>
code --install-extension dbaeumer.vscode-eslint \
     --install-extension esbenp.prettier-vscode \
     --install-extension timonwong.shellcheck \
     --install-extension mikestead.dotenv \
     --install-extension eamodio.gitlens \
     --install-extension christian-kohler.path-intellisense \
     --install-extension CoenraadS.bracket-pair-colorizer-2 \
     --install-extension streetsidesoftware.code-spell-checker \
     --install-extension yzhang.markdown-all-in-one \
     --install-extension techer.open-in-browser \
     --install-extension EditorConfig.EditorConfig
</pre>

## 🛠️ 各拡張機能の役割（初心者向け）
<pre>
種類	          拡張機能	                主な役割
構文チェック	   ESLint / ShellCheck	    JSやshのミスを赤線で警告
整形	          Prettier / EditorConfig	  コードスタイルを統一（自動整形）
環境変数表示	   dotenv	.env              ファイルのハイライト
Gitサポート	    GitLens	                  誰が・いつ・なにを変更したか見える
パス補完	      Path Intellisense	        importやrequireの補完
括弧可視化	    Bracket Colorizer	        括弧がカラフルに対応表示
Markdown支援	  Markdown All in One	      README編集に便利
ブラウザ確認	  open in browser	          HTMLやREADMEをすぐ確認
スペルチェック	Code Spell Checker	      英単語の綴りミスを警告
</pre>

## 🗂 プロジェクト構成（フォルダ概要）
<pre>
  inuichiba-ffworkers/     # Cloudflare Workers の本体コード
  inuichiba-ffscripts/     # デプロイやバッチなどの管理スクリプト
  inuichiba-ffimages/      # Flex Messageやリッチメニュー画像のホスティング

※inuichiba-ffimages(極力他のファイルを含めないポリシーのため)以外は、.editorconfig によってインデント・改行コードなどが強制されます。
</pre>

## 📏 コードスタイルの強制 .editorconfig
<pre>
プロジェクトルートに .editorconfig が存在しています。

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.js]
indent_style = space
indent_size = 2

[*.json]
indent_style = space
indent_size = 2

[*.ps1]
indent_style = space
indent_size = 2

[*.sh]
indent_style = space
indent_size = 2

# Markdown
[*.md]
trim_trailing_whitespace = false
indent_style = space
indent_size = 2

✅ 守るべきこと
</pre>
- インデントは 半角スペース2個
- 改行コードは LF（Mac/Unix形式）
- ファイル末尾は 空行あり
- 不要な空白は 自動で削除
- VSCode + EditorConfig拡張があれば、保存時に自動で修正されます。



