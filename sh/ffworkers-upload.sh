#!/bin/bash
# --------------------------------------------
# ffworkers-upload.sh
# Cloudflare Workers 用のリポジトリを安全に git push するシェルスクリプト（Mac/Linux 用）
# main ブランチ限定・競合チェック・変更内容確認・安全 push
#
# 初回実行
# cd ~/nasubi/inuichiba-ffscripts/sh/
# chmod +x ffworkers-upload.sh
#
# 実行方法
# cd ~/nasubi/inuichiba-ffscripts/sh/
# ./ffworkers-upload.sh
# --------------------------------------------

set -e  # エラーが出たら即終了
cd "$(dirname "$0")/.." || exit 1

# ✅ 対象ディレクトリ（相対パス）
TARGET_REPO="../inuichiba-ffworkers"

# ✅ 処理ディレクトリに移動
echo -e "\n📂 Git操作対象のディレクトリに移動中: $TARGET_REPO"
cd "$TARGET_REPO" || exit 1

# ✅ ブランチ確認
echo -e "\n🔍 現在のブランチを確認中..."
branch=$(git rev-parse --abbrev-ref HEAD)
echo "📍 現在のブランチ: $branch"

if [ "$branch" != "main" ]; then
  echo -e "\n⚠️ 現在のブランチは 'main' ではありません → '$branch'"
  echo "🚫 push を中止します。"
  cd ../inuichiba-ffscripts || exit 1
  exit 1
fi

# ✅ リモート差分チェック
echo -e "\n🔄 リモートと差分をチェック（fetch + log）..."
git fetch origin
remote_diff=$(git log HEAD..origin/$branch --oneline)

if [ -n "$remote_diff" ]; then
  echo "⚠️ ローカルとリモートに差分があります。"
  echo "🛑 push すると競合の可能性があります。pull または rebase してから再実行してください。"
  cd ../inuichiba-ffscripts || exit 1
  exit 1
fi

# ✅ ステータス表示
echo -e "\n📦 git status を確認します..."
git status

# ✅ 差分ファイル表示
echo -e "\n🗂 変更されたファイル一覧（新規含む）:"
diff_files=$(git status --porcelain)
if [ -z "$diff_files" ]; then
  echo "⚠️ 差分はありません。"
  echo -e "\n✅ 変更がないため、コミット・pushはスキップしました。"
  cd ../inuichiba-ffscripts || exit 0
else
  echo "$diff_files"
fi

# ✅ 60秒間の確認時間
echo -e "\n⏳ 60秒間お待ちします... じっくり内容を確認してください。"
for i in $(seq 60 -1 1); do
  echo -ne "⏳ 残り $i 秒...\r"
  sleep 1
done
echo ""

# ✅ コミットメッセージ
echo -e "\n🔸 コミットメッセージを入力してください："
read -r commit_message

# ✅ 実行確認
echo -e "\n⚠️ git add → commit → push を実行しますか？（Y/N）"
read -r confirm

if [[ "$confirm" == "Y" || "$confirm" == "y" ]]; then
  echo -e "\n📥 git add -A を実行中..."
  git add -A

  echo "📝 git commit を実行中..."
  git commit -m "$commit_message"

  echo -e "\n🚀 GitリモートリポジトリへPushします（git push origin main）..."
  push_output=$(git push origin main 2>&1 | tee /dev/tty)

  if echo "$push_output" | grep -q "To "; then
    echo "✅ Push に成功しました！"
  else
    echo "❌ Push に失敗しました！"
    echo "⚠️ 以下のエラーメッセージを確認してください："
    echo "$push_output"
  fi
else
  echo -e "\n🚫 中止しました。安心してやり直してください。"
fi

# ✅ 最後の git status 確認
echo -e "\n📊 現在のGitステータス確認:"
git status

# ✅ ffscripts に戻る
cd ../inuichiba-ffscripts || exit 0
