# PowerShell スクリプト: ffworkers-run-richmenu.ps1
# -----------------------------------------
# 環境を指定してリッチメニューを再作成する（ffdev / ffprod）
# 実行例:
#   .\ffworkers-run-richmenu.ps1 -env ffdev(既定値)	--- 開発環境用
#   .\ffworkers-run-richmenu.ps1 -env ffprod			 --- 本番環境用
# -----------------------------------------

param(
  [string]$env = "ffdev"
)

$envPath = "../inuichiba-ffworkers/src/secrets/.env.secrets.$env.txt"
if (-not (Test-Path $envPath)) {
  Write-Host "❌ Secretsファイルが見つかりません: $envPath" -ForegroundColor Red
  exit 1
}

# Secrets ファイルから環境変数を設定
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

# GCLOUD_PROJECT もここで追加設定（env.js 判定用）
$projectIdMap = @{ ffdev = "inuichiba-ffworkers-ffdev"; ffprod = "inuichiba-ffworkers-ffprod" }
[System.Environment]::SetEnvironmentVariable("GCLOUD_PROJECT", $projectIdMap[$env], "Process")

Write-Host "`n🚀 リッチメニュー初期化を開始（環境: $env）..."

# 🔧 実行前にカレントディレクトリをスクリプトのある場所に移動（パス解釈を安定させる）
# Set-Location -Path "$PSScriptRoot"

node ../inuichiba-ffworkers/src/richmenu-manager/batchCreateRichMenu.js
