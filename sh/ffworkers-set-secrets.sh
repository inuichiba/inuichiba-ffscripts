#!/bin/bash
# ffworkers-set-secrets.sh
# -----------------------------------------------
# ✅ Cloudflare Workers 用 Secrets 一括登録スクリプト
#
# 🔸目的:
#   - `src/secrets/.env.secrets.ff*.txt` に定義された key=value 形式の環境変数を
#     Cloudflare Workers の Secrets に一括で登録します。
#   - 空行、コメント行、形式不正な行は自動スキップされます。
#   - BOM や制御文字も除去し、安全に登録されます。
#
# 🔸対象環境（引数）:
#   - `ffdev` または `ffprod` を指定します。
#
# 🔸事前条件:
#   - `wrangler` CLI（v2+）がインストールされていること（`npx wrangler`）
#   - `src/secrets/.env.secrets.ffdev.txt` または `.env.secrets.ffprod.txt` が存在すること
#
# 🔸使い方（シェルから）:
#
#   $  chmod +x ffworkers-set-secrets.sh
#   $ ./ffworkers-set-secrets.sh ffdev
#   $ ./ffworkers-set-secrets.sh ffprod
#
# 🔸出力:
#   - 登録処理の進行状況（キー名）と結果（成功/失敗）
#   - 最終的な成功件数 / 失敗件数のサマリを色付きで表示
#
# 🔸補足:
#   - 同名キーが既に存在していた場合は **警告なしで上書き** されます。
#   - .env.secrets.ff*.txt の値はすべて Secretsとして登録します。
#     Variables(プレーンテキスト) として登録したい場合はGUI(Workers & Pages)を使用してください。
#
# -----------------------------------------------

# ✅ 環境名（ffdev または ffprod）を引数から取得
ENV_NAME="$1"
if [[ -z "$ENV_NAME" ]]; then
  echo "❌ 環境名が指定されていません。例: ffdev / ffprod"
  exit 1
fi

# ✅ ディレクトリ設定
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKERS_DIR="inuichiba-ffworkers"
WORKERS_NAME="${WORKERS_DIR}-${ENV_NAME}"
SECRETS_FILE_PATH="${BASE_DIR}/../${WORKERS_DIR}/src/secrets/.env.secrets.${ENV_NAME}.txt"
WRANGLER_TOML="${BASE_DIR}/../${WORKERS_DIR}/wrangler.toml"

echo ""
echo -e "\033[36m${WORKERS_NAME} にて実行\033[0m"
echo ""

# ✅ Secretsファイルの存在確認
echo -e "\n🔐 Secretsファイルを読み込み中:"
if [[ ! -f "$SECRETS_FILE_PATH" ]]; then
  echo -e "❌ Secretsファイルが存在しません: $SECRETS_FILE_PATH" >&2
  exit 1
fi
echo -e "📄 実ファイル存在確認: \033[32mTrue\033[0m"
echo ""

# ✅ BOM除去 + 制御文字除去
CONTENT=$(<"$SECRETS_FILE_PATH")
# BOM削除
CONTENT=$(echo "$CONTENT" | sed '1s/^\xEF\xBB\xBF//')
# 制御文字除去（CRLFとTAB以外）
CONTENT=$(echo "$CONTENT" | tr -d '\000-\010\013\014\016-\037\302\240')

# ✅ npx コマンド確認
if ! command -v npx >/dev/null 2>&1; then
  echo -e "❌ 'npx' コマンドが見つかりません。Node.js/npm がインストールされていますか？" >&2
  exit 1
fi

# ✅ Secrets登録処理
echo -e "\n🔐 Secretsの登録を開始します。\n"
SUCCESS_COUNT=0
FAIL_COUNT=0

while IFS= read -r line; do
  # 空行・コメント行スキップ
  [[ -z "$line" || "$line" =~ ^[[:space:]]*$ || "$line" =~ ^# ]] && continue

  # key=value形式チェック
  if [[ "$line" != *=* ]]; then
    echo -e "⚠️ 無効な形式のためスキップ: $line"
    continue
  fi

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  KEY=$(echo "$KEY" | xargs)     # trim
  VALUE=$(echo "$VALUE" | xargs) # trim

  if [[ -z "$KEY" || -z "$VALUE" ]]; then
    echo -e "⚠️ 無効な形式のためスキップ: $line"
    continue
  fi

  # Secrets登録
  echo "🛠 実行: echo <value> | npx wrangler secret put $KEY --env $ENV_NAME --config $WRANGLER_TOML"
  echo "$VALUE" | npx wrangler secret put "$KEY" --env "$ENV_NAME" --config "$WRANGLER_TOML"
  if [[ $? -eq 0 ]]; then
    echo -e "✅ $KEY を登録しました。\n"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo -e "❌ $KEY の登録に失敗しました。\n"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

done <<< "$CONTENT"

# ✅ 結果まとめ
echo ""
echo -e "\033[35m\n✅ 登録完了: 成功 ${SUCCESS_COUNT} 件 / 失敗 ${FAIL_COUNT} 件\033[0m"
echo -e "\033[36m\n📋 現在登録されている Secrets 一覧（$WORKERS_NAME）:\033[0m"
echo -e "\033[36m🛠 npx wrangler secret list --env $ENV_NAME --config $WRANGLER_TOML\033[0m"
npx wrangler secret list --env "$ENV_NAME" --config "$WRANGLER_TOML"
