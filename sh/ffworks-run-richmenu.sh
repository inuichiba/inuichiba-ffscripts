#!/bin/bash
# -----------------------------------------
# ✅ Cloudflare Workers 用：リッチメニュー再作成スクリプト（Mac/Linux用）
#
# 実行権限：
#    chmod +x ffworkers-run-richmenu.sh
#
# 使用方法:
#   ./ffworkers-run-richmenu.sh ffdev   ← 開発環境用（省略時はこちら）
#   ./ffworkers-run-richmenu.sh ffprod  ← 本番環境用
#
# 前提:
#   secrets/.env.secrets.ff*.txt が存在していること
# -----------------------------------------


# ✅ 環境引数の取得（省略時は ffdev）
env="${1:-ffdev}"

# ✅ secretsファイルのパス（拡張子に注意）
secrets_path="../inuichiba-ffworkers/src/secrets/.env.secrets.${env}.txt"

if [[ ! -f "$secrets_path" ]]; then
  echo "❌ Secretsファイルが見つかりません: $secrets_path"
  exit 1
fi

# ✅ GCLOUD_PROJECT を自動設定（env.jsが利用する）
if [[ "$env" == "ffdev" ]]; then
  export GCLOUD_PROJECT="inuichiba-ffworkers-ffdev"
elif [[ "$env" == "ffprod" ]]; then
  export GCLOUD_PROJECT="inuichiba-ffworkers-ffprod"
else
  echo "❌ 未知の環境名: $env"
  exit 1
fi

echo "🔐 secretsファイルを読み込み中: $secrets_path"

# ✅ secretsファイルの内容を export（コメント・空行除外）
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^\s*# ]] && continue
  [[ -z "$line" ]] && continue
  if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    export "$key"="$value"
  fi
done < "$secrets_path"

echo -e "\n🚀 リッチメニュー初期化を開始（環境: $env）..."

# ✅ Node.js 実行（process.env に export が反映される）
node ../inuichiba-ffworkers/src/richmenu-manager/batchCreateRichMenu.js
