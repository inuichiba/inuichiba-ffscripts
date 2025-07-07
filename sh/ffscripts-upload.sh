#!/bin/bash
# ffscripts-upload.sh
# ffscripts 用リポジトリの git push を安全に実行するスクリプト（Mac/Linux 版）
# ✅ 実行方法:
#   cd ~/nasubi/inuichiba-ffscripts/sh/
#   chmod +x ffscripts-upload.sh    ← 初回のみ
#   ./ffscripts-upload.sh

set -e

# 🎯 Git 操作対象ディレクトリ（このスクリプトが配置された親ディレクトリを想定）
cd "$(dirname "$0")/.."
target_dir="$(pwd)"
echo -e "\n📂 Git操作対象のディレクトリに移動中: $target_dir"

# 📍 現在のブランチを確認
branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "\n🔍 現在のブランチ: $branch"
if [ "$branch" != "main" ]; then
  echo -e "\n⚠️ 現在のブランチは 'main' ではありません → '$branch'"
  echo "🚫 push を中止します。"
  exit 1
fi

# 🔄 リモートとの差分を確認（fetch + log）
echo -e "\n🔄 リモートと差分をチェック（fetch + log）..."
git fetch origin
remote_diff=$(git log HEAD..origin/$branch --oneline)
if [ -n "$remote_diff" ]; then
  echo -e "⚠️ ローカルとリモートに差分があります。"
  echo -e "🛑 push すると競合の可能性があります。pull または rebase してから再実行してください。"
  exit 1
fi

# 📦 git status の確認
echo -e "\n📦 git status を確認します..."
git status

# 🗂 差分ファイル一覧を表示
echo -e "\n🗂 変更されたファイル一覧（新規含む）:"
diff_files=$(git status --porcelain)
if [ -z "$diff_files" ]; then
  echo "⚠️ 差分はありません。"
  echo -e "\n✅ 変更がないため、コミット・pushはスキップしました。"
  exit 0
else
  echo "$diff_files"
fi

# ⏳ 内容確認タイム（60秒）
echo -e "\n⏳ 60秒間お待ちします... じっくり内容を確認してください。"
for i in {60..1}; do
  echo -ne "⏳ 残り $i 秒...\r"
  sleep 1
done
echo

# 🔸 コミットメッセージの入力
read -rp $'\n🔸 コミットメッセージを入力してください: ' commit_message

# ⚠️ 実行確認
read -rp $'\n⚠️ git add → commit → push を実行しますか？（Y/N）: ' confirm
if [[ "$confirm" != [Yy] ]]; then
  echo -e "\n🚫 中止しました。安心してやり直してください。"
  exit 0
fi

# 📥 git add -A → commit
echo -e "\n📥 git add -A を実行中..."
git add -A

echo "📝 git commit を実行中..."
git commit -m "$commit_message"

# 🚀 git push を実行しつつログ表示
echo -e "\n🚀 GitリモートリポジトリへPushします（git push origin main）..."
push_output=$(git push origin main 2>&1 | tee /dev/tty)

# ✅ 成功判定
if echo "$push_output" | grep -q "To "; then
  echo -e "\n✅ Push に成功しました！"
else
  echo -e "\n❌ Push に失敗しました！"
  echo -e "⚠️ 以下のエラーメッセージを確認してください：\n"
  echo "$push_output"
fi

# 📊 最後にGitステータス確認
echo -e "\n📊 現在のGitステータス確認:"
git status
