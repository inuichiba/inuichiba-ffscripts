
# 🍏 Mac環境での開発セットアップ手順（inuichibaプロジェクト共通）

このドキュメントは、Macで `inuichiba-ffworkers` / `inuichiba-ffscripts` / `inuichiba-ffimages` を扱う初心者向けの手順書です。
**Windows向けと混同しないよう、すべてMac専用の記述になっています。**

---

## 1. 事前準備

### VSCodeのインストール
- インストール先は `inuichiba-ffworkers`
```bash
brew install --cask visual-studio-code 
```
 
### code コマンドが有効か確認
```bash
which code
```
-  /usr/local/bin/code のように出ればOK。
- 出ない場合は VSCode の「コマンドパレット」で次のように入力：
```bash
Shell Command: Install 'code' command in PATH
```

---

## 2. 🔌 VSCode に入れるべき拡張機能（全プロジェクト共通）
```bash
# VSCode拡張を一括インストール（コマンドラインから一度に全行実行）
code --install-extension dbaeumer.vscode-eslint \
     --install-extension esbenp.prettier-vscode \
     --install-extension timonwong.shellcheck \
     --install-extension mikestead.dotenv \
     --install-extension eamodio.gitlens \
     --install-extension christian-kohler.path-intellisense \
     --install-extension CoenraadS.bracket-pair-colorizer-2 \
     --install-extension yzhang.markdown-all-in-one \
     --install-extension techer.open-in-browser \
     --install-extension EditorConfig.EditorConfig
```

---

## 3. 🛠️ 各拡張機能の役割（初心者向け）
```text
種類            拡張機能                  主な役割
構文チェック     ESLint / ShellCheck      JSやshのミスを赤線で警告
整形            Prettier / EditorConfig  コードスタイルを統一（自動整形）
環境変数表示    dotenv.env                ファイルのハイライト
Gitサポート     GitLens                   誰が・いつ・なにを変更したか見える
パス補完        Path Intellisense         importやrequireの補完
括弧可視化      Bracket Colorizer         括弧がカラフルに対応表示
Markdown支援   Markdown All in One       README編集に便利
ブラウザ確認    open in browser           HTMLやREADMEをすぐ確認
```

---

## 4. 🗂 プロジェクト構成（フォルダ概要）
```text
  inuichiba-ffworkers/     # Cloudflare Workers の本体コード
  inuichiba-ffscripts/     # デプロイやバッチなどの管理スクリプト
  inuichiba-ffimages/      # Flex Messageやリッチメニュー画像のホスティング
```
- inuichiba-ffimages(極力他のファイルを含めないポリシーのため)以外は、.editorconfig によってインデント・改行コードなどが強制されます。

---

## 5. 📏 コードスタイルの強制 .editorconfig
- プロジェクトルートに .editorconfig が存在しています。

```text
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
```

---

## 6. ✅ 守るべきこと

- インデントは 半角スペース2個
- 改行コードは LF（Mac/Unix形式）
- ファイル末尾は 空行あり
- 不要な空白は 自動で削除
- VSCode + EditorConfig拡張があれば、保存時に自動で修正されます。
- UTF-8(BOMなし)形式厳守 … 自動で修正されないので注意


