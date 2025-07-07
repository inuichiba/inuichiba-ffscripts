<#
# ffworkers-set-secrets.ps1
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
# 🔸使い方（PowerShell ターミナルから）:
#
#   PS> .\ffworkers-set-secrets.ps1 -env ffdev
#   PS> .\ffworkers-set-secrets.ps1 -env ffprod
#
# 🔸出力:
#   - 登録処理の進行状況（キー名）と結果（成功/失敗）
#   - 最終的な成功件数 / 失敗件数のサマリを色付きで表示
#
# 🔸補足:
#   - 同名キーが既に存在していた場合は **警告なしで上書き** されます。
#   - スクリプト終了後は自動的に呼び出し元のディレクトリへ戻ります。
#   - .env.secrets.ff*.txt の値はすべて Secretsとして登録します。
#     Variables(プレーンテキスト) として登録したい場合はGUI(Workers & Pages)を使用してください。
#
# -----------------------------------------------
#>


param (
  [string]$env = "ffdev"    # ✅ 環境名（ffdev または ffprod）
)


# ------------------------------
# ✅ ベース設定
# ------------------------------
$baseDir          = $PSScriptRoot
$workersDir       = "inuichiba-ffworkers"
$workersName      = "$workersDir-$env"
$secretsFilePath  = Join-Path -Path "$baseDir\..\$workersDir\src\secrets" -ChildPath ".env.secrets.$env.txt"

Write-Host ""
Write-Host "$workersName にて実行" -ForegroundColor Cyan
Write-Host ""

# ------------------------------
# ✅ Secretsファイルの存在確認
# ------------------------------
Write-Host "`n🔐 Secretsファイルを読み込み中:"

# === 存在確認 ===
if (-not (Test-Path $secretsFilePath)) {
  Write-Host "❌ Secretsファイルが存在しません: $secretsFilePath" -ForegroundColor Red

  # 元のディレクトリ(ffscripts)へ戻る
  Set-Location $PSScriptRoot
  exit 1
}

$secretsFilePath = (Resolve-Path $secretsFilePath).Path
Write-Host "📄 実ファイル存在確認: True" -ForegroundColor Green
Write-Host ""

# ------------------------------
# ✅ BOM除去＋制御文字除去
# ------------------------------
# ✅ BOM検出（ファイルをバイナリで読み込み、先頭バイトがEF BB BFのときのみ）
$bytes = [System.IO.File]::ReadAllBytes($secretsFilePath)
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
  Write-Host "⚠️ BOMを検出したため削除します" -ForegroundColor Yellow
  $content = [System.Text.Encoding]::UTF8.GetString($bytes[3..($bytes.Length - 1)])
  Set-Content -Path $secretsFilePath -Value $content -NoNewline -Encoding UTF8
} else {
  $content = [System.Text.Encoding]::UTF8.GetString($bytes)
}

# 制御文字除去（CRLFとTAB除く）
$content = ($content -replace '[\x00-\x08\x0B\x0C\x0E-\x1F\u3000]', '')


# ------------------------------
# ✅ npx のパス検出
# ------------------------------
$npxPath = Get-Command npx -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $npxPath) {
  Write-Host "❌ 'npx' コマンドが見つかりません。Node.js/npm がインストールされていないか、PATH が通っていません。" -ForegroundColor Red

  # 元のディレクトリ(ffscripts)へ戻る
  Set-Location $PSScriptRoot
  exit 1
}


# ------------------------------
# ✅ Secrets登録処理
# ------------------------------
Write-Host "`n🔐 Secretsの登録を開始します。`n" -ForegroundColor Cyan
$lines = Get-Content $secretsFilePath -Encoding UTF8
$successCount = 0
$failCount = 0

foreach ($line in $lines) {

  # 空行またはスペースのみの行をスキップ(ログ出力なし)
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  $trimmed = $line.Trim()

  # コメント行をスキップ(ログ出力なし)
  if ($trimmed.StartsWith("#")) {
    continue
  }

  # ✅ 厳格に key=value 形式（スペース無し、=が1つ）をチェック
  $pair = $line -split "=", 2

  if ($pair.Count -ne 2 -or
      [string]::IsNullOrWhiteSpace($pair[0]) -or
      [string]::IsNullOrWhiteSpace($pair[1])) {
    Write-Host "⚠️ 無効な形式のためスキップ: $line" -ForegroundColor Yellow
    continue
  }

  $key   = $pair[0].Trim()
  $value = $pair[1].Trim()

  # ✅ シークレット登録用 startInfo 準備（WorkingDirectoryを正しく設定）
  try {
    $escapedValue = $value -replace '"', '\"'  # 引用符をエスケープ
    $command = "echo $escapedValue | npx wrangler secret put $key --env $env --config ../$workersDir/wrangler.toml"

    Write-Host "🛠 実行: $command"

    Invoke-Expression $command

    Write-Host "✅ $key を登録しました。" -ForegroundColor Green
    $successCount++
  } catch {
    Write-Host "❌ $key の登録に失敗しました。: $_" -ForegroundColor Red
    $failureCount++
  }
}


# ------------------------------
# ✅ 結果まとめ
# ------------------------------
Write-Host ""
Write-Host "`n✅ 登録完了: 成功 $successCount 件 / 失敗 $failCount 件`n" -ForegroundColor Magenta
Write-Host "`n📋 現在登録されている Secrets 一覧($workersName):" -ForegroundColor Cyan
Write-Host "🛠 npx wrangler secret list 実行中..." -ForegroundColor Cyan
npx wrangler secret list --env $env --config ../$workersDir/wrangler.toml

# 元のディレクトリ(ffscripts)へ戻る
Set-Location $PSScriptRoot
