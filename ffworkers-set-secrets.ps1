# ffworkers-set-secrets.ps1
# .env.secrets.ff*.txt を読み込んで、Cloudflare workers に secretsを登録する
# 事前準備
# npx wrangler login
# 実行方法 
# .\ffworkers-set-secrets.ps1 -envName ffdev
# .\ffworkers-set-secrets.ps1 -envName ffprod

# ==========================
# 🔐 ffworkers-set-secrets.ps1
# Cloudflare Workers に Secrets を登録する
# 使用例:
#   .\ffworkers-set-secrets.ps1 -envName ffdev
#   .\ffworkers-set-secrets.ps1 -envName ffprod
# ==========================

param (
  [Parameter(Mandatory = $true)]
  [ValidateSet("ffdev", "ffprod")]
  [string]$envName
)

# 🌐 Workerプロジェクト名（共通）
$workerProject = "inuichiba-ffworkers"

# 📁 .envファイルパス
$envFilePath = Join-Path -Path $PSScriptRoot -ChildPath "..\$workerProject\src\secrets\.env.secrets.$envName.txt"

if (-not (Test-Path $envFilePath)) {
  Write-Host "❌ .envファイルが見つかりません: $envFilePath" -ForegroundColor Red
  exit 1
}

Write-Host "📦 Secrets を $envName に登録中...（$envFilePath）"

# 🔄 キーと値を読み取って登録
$lines = Get-Content -Encoding UTF8 $envFilePath | Where-Object { $_ -and $_ -notmatch '^\s*#' }

# 🔄 秘密情報を登録
foreach ($line in $lines) {
  $parts = $line -split '=', 2
  if ($parts.Count -ne 2) {
    Write-Host "⚠️ 無効な行をスキップ: $line" -ForegroundColor Yellow
    continue
  }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()

  # ✅ BOM削除 + 制御文字除去
  if ($value.Length -gt 0 -and $value[0] -eq [char]0xFEFF) {
    $value = $value.Substring(1)
  }
  $value = ($value -replace '[\u0000-\u001F]', '').Trim()

  # 🎯 wrangler.toml に env.name があるので、--name は省略可
  Write-Host "🔐 Secret [$key] を登録中...（$envName）" -ForegroundColor Cyan
  $result = $value | wrangler secret put $key --env $envName

# 結果判定
if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ [$key] 登録に成功しました" -ForegroundColor Green
} else {
  Write-Host "❌ [$key] 登録に失敗しました" -ForegroundColor Red
  Write-Host $result
}
}

Write-Host "`n🎉 全ての Secrets 登録が完了しました（$envName）" -ForegroundColor Green
