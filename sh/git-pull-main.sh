#!/bin/bash
# =============================================
# 🔄 Git リポジトリの pull 処理（main ブランチ）
# 前提
# chmod +x ./git-pull-main.sh
#
# 実行方法
# cd ~/inuichiba-ffscripts/sh
# ./git-pull-main.sh -target ffscripts
# ./git-pull-main.sh -target ffimages
# ./git-pull-main.sh -target ffworkers
 =============================================

set -e

# 対象チェック
if [ "$1" != "ffscripts" ] && [ "$1" != "ffimages" ] && [ "$1" != "ffworkers" ]; then
  echo "❌ 無効な引数です: $1"
  echo "使用方法: ./git-pull-main.sh [ffscripts|ffimages|ffworkers]"
  exit 1
fi

TARGET="$1"

# 対応する相対パス
case "$TARGET" in
  ffscripts)
    TARGET_PATH="../inuichiba-ffscripts"
    ;;
  ffimages)
    TARGET_PATH="../inuichiba-ffimages"
    ;;
  ffworkers)
    TARGET_PATH="../inuichiba-ffworkers"
    ;;
esac

echo ""
echo "📂 Git操作対象のディレクトリ: $TARGET_PATH"
cd "$TARGET_PATH"

echo "🔄 git pull origin main を実行します"
read -p "⚠️ 本当に pull しますか？（競合の可能性あり） [y/N]: " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "🚫 中止しました"
  exit 0
fi

# 実行
git pull origin main

# 結果確認
if [ $? -eq 0 ]; then
  echo "✅ pull に成功しました！"
else
  echo "❌ pull に失敗しました。競合またはエラーの可能性があります。"
  exit 1
fi
