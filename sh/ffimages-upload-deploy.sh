#!/bin/bash
# ffscripts/sh/ffimages-upload-deploy.sh
# ✅ 画像を GitHub に push し、Cloudflare Pages に手動デプロイする安全確認付きスクリプト
#
# ✅ 目的：
# inuichiba-ffimages に入れた画像を GitHub へ登録し、
# Cloudflare Pages で公開・CDNキャッシュを最新に更新する。
#
# ✅ 重要：
# - このスクリプトは git push のあと npx wrangler コマンドによって Cloudflare Pages が再デプロイされます。
# - デプロイが完了すると、Cloudflare のキャッシュ（CDNエッジキャッシュ）も自動で更新されます。
# - そのため **ファイル名を変えなくても最新の画像が反映されます**。
# - 画像変更なしの場合、GitHubへのPushは行いますが Cloudflare Pages へのデプロイはスキップします。
# - デプロイ実行は手動確認による「画像あり (Y)」回答に基づくフラグ制御で判定されます。
#
# ✅ ポイント：
# - Push時は色付きで進行状況を表示（安心の見える化）
# - Push成功/失敗を色分け（成功=緑、失敗=赤で明確に）
# - git status も表示して現状確認
# - npx wrangler login 済であること
#
# ✅ 1. Macユーザー用セットアップ手順
#
# ▼ スクリプト配置（Gitで取得したフォルダ構成）:
# inuichiba-ffscripts/
# ├─ sh/
# │  └─ ffimages-upload-deploy.sh
#
# ▼ 実行権限の付与（初回のみ）
# cd ~/nasubi/inuichiba-ffscripts/sh/
# chmod +x ffimages-upload-deploy.sh
#
# ▼ 実行コマンド
# cd ~/nasubi/inuichiba-ffimages
# ../inuichiba-ffscripts/sh/ffimages-upload-deploy.sh


set -e

# --------------------------------------------
# ✅ 初期設定
# --------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../../inuichiba-ffimages"
DEPLOY_ENABLED=false

# --------------------------------------------
# ✅ リポジトリ移動
# --------------------------------------------
echo -e "\n📂 Git操作対象のディレクトリに移動中: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# --------------------------------------------
# ✅ ディレクトリ移動（この中でgit操作）
# --------------------------------------------
echo "\n📂 Git操作対象のディレクトリに移動中: ../inuichiba-ffimages"
cd ../inuichiba-ffimages || exit 1

# --------------------------------------------
# ✅ ブランチ確認
# --------------------------------------------
branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "\n📍 現在のブランチ: $branch"
if [[ "$branch" != "main" ]]; then
  echo "🚫 pushはmainブランチでのみ許可されています。"
  cd "$SCRIPT_DIR/.."
  exit 1
fi

# --------------------------------------------
# 🔄 差分確認
# --------------------------------------------
echo -e "\n🔄 リモートとの差分チェック..."
git fetch origin
remote_diff=$(git log HEAD..origin/main --oneline)
if [[ -n "$remote_diff" ]]; then
  echo "⚠️ ローカルとリモートに差分があります。pull/rebaseしてから再実行してください。"
  cd "$SCRIPT_DIR/.."
  exit 1
fi

# --------------------------------------------
# ✅ git status の確認（60秒間の確認タイム）
# --------------------------------------------
# 📦 変更があるかチェック（変更がなければ終了）
if git diff --quiet && git diff --cached --quiet; then
  echo "⚠️ 変更がないため、git およびデプロイはスキップされました。"
  cd ../inuichiba-ffscripts || exit 1
fi

echo "\n📊 30秒間お待ちします... 特に画像に変更がないかじっくり確認してください。"
git status
for i in $(seq 30 -1 1); do
  echo -ne "⏳ 残り $i 秒...\r"
  sleep 1
done

# --------------------------------------------
# ✅ 画像変更の有無を確認
# ここで"Y/y"を入力したときのみ後でデプロイする
# --------------------------------------------
read -p $'\n🖼 画像に変更はありますか？ (Y/N): ' confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  DEPLOY_ENABLED=true
fi

# --------------------------------------------
# ✅ コミットメッセージの入力
# --------------------------------------------
echo "\n🔸 コミットメッセージを入力してください："
echo "   (画像更新だけなら『画像更新』でも構いません)"
read -p "> " commit_msg

# --------------------------------------------
# ✅ git add → commit → push の確認
# --------------------------------------------
read -p $'\n⚠️ 続けて git add -A → commit → push を実行しますか？ (Y/N): ' confirm2
echo
if [[ ! "$confirm2" =~ ^[Yy]$ ]]; then
  echo "🚫 中止しました。安心してやり直してください。"
  cd ../inuichiba-ffscripts || exit 0
fi

# --------------------------------------------
# ✅ git add, commit, push
# --------------------------------------------
echo "📝 すべての追加・変更をステージに反映(ステージング)します..."
echo -e "📥 git add -A 実行中..."
git add -A

timestamp=$(date "+%Y%m%d-%H%M")
echo "🚀 コミットを実行します: '$commit_msg : $timestamp'"
git commit -m "$commit_msg : $timestamp"

echo -e "\n🚀 git push origin main 実行中..."
push_output=$(git push origin main 2>&1 | tee /dev/tty)

if echo "$push_output" | grep -q "To "; then
  echo "✅ Push 成功！"

  if $DEPLOY_ENABLED; then
    echo -e "\n🚀 Cloudflare Pages へ手動デプロイ開始..."
    cd "$SCRIPT_DIR/.."
    npx wrangler pages deploy
  else
    echo "💤 画像に変更がないため、デプロイは行いませんでした。"
  fi

else
  echo "❌ Push に失敗しました"
  echo "💬 エラー内容:"
  echo "$push_output"
  cd ../inuichiba-ffscripts || exit 1
fi

# --------------------------------------------
# ✅ 最後にgit status表示
# --------------------------------------------
echo -e "\n📊 現在のGitステータス:"
git status

cd "$SCRIPT_DIR/.."

