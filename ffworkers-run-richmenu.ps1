# -----------------------------------------
# PowerShell スクリプト: ffworkers-run-richmenu.ps1
# -----------------------------------------
# 🧭 リッチメニューの初期化（作成＋画像アップロード）を行う
#
# ✅ 使用目的:
#   - Cloudflare Workers の外（ローカル環境）で richmenu を構築する
#   - Supabase や LINE Messaging API を直接操作
#
# ✅ 実行方法:
#   .\ffworkers-run-richmenu.ps1 -env ffdev    # ← 開発環境（既定値）
#   .\ffworkers-run-richmenu.ps1 -env ffprod   # ← 本番環境
#
# ✅ 注意点:
#   - wrangler.toml の `vars` セクションは使用されません（Node.js スクリプトは toml を読みません）
#   - `GCLOUD_PROJECT` は明示的に PowerShell 側でセットします（env.js の環境判定に必須）
#   - secrets は .env.secrets.ff*.txt 形式のファイルから読み込みます
# -----------------------------------------

param(
  [string]$env = "ffdev"
)

$envPath = "../inuichiba-ffworkers/src/secrets/.env.secrets.$env.txt"
if (-not (Test-Path $envPath)) {
  Write-Host "❌ Secretsファイルが見つかりません: $envPath" -ForegroundColor Red
  exit 1
}

# -----------------------------------------
# 🔐 Secrets ファイルから環境変数を設定（ローカル実行用）
# - 書式: KEY=VALUE（空行・#コメントは無視）
# -----------------------------------------
Write-Host "🔧 Secretsファイルから環境変数をロード中: $envPath"
$lines = Get-Content $envPath -Encoding UTF8
foreach ($line in $lines) {
  if ($line -match "^\s*#" -or $line.Trim() -eq "") { continue }

	$parts = $line -split "=", 2
  if ($parts.Count -ne 2) { continue }

  $keyName = $parts[0].Trim()
  $valueText = $parts[1].Trim()
  [System.Environment]::SetEnvironmentVariable($keyName, $valueText, "Process")
}

# -----------------------------------------
# ✅ GCLOUD_PROJECT を明示的に設定
# - Node.js スクリプト側（env.js）で環境判定に使用される
# - wrangler.toml の vars ではなく、ここで手動設定する必要がある
# -----------------------------------------
$projectIdMap = @{ ffdev = "inuichiba-ffworkers-ffdev"; ffprod = "inuichiba-ffworkers-ffprod" }
[System.Environment]::SetEnvironmentVariable("GCLOUD_PROJECT", $projectIdMap[$env], "Process")

Write-Host "`n🚀 リッチメニュー初期化を開始（環境: $env）..."

# 🔧 必要に応じてスクリプトディレクトリへ移動（今回はコメントアウト）
# Set-Location -Path "$PSScriptRoot"

# 🏁 実行対象: リッチメニュー構築スクリプト
node ../inuichiba-ffworkers/src/richmenu-manager/batchCreateRichMenu.js
