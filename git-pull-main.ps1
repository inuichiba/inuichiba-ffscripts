# git-pull-main.ps1
# ===============================================
# 🔄 指定されたGitリポジトリで git pull origin main を実行
#
# 実行方法
# cd d:\nasubi\inuichiba-ffscripts
# .\git-pull-main.ps1 -target ffscripts
# .\git-pull-main.ps1 -target ffimages
# .\git-pull-main.ps1 -target ffworkers
# ===============================================
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("ffscripts", "ffimages", "ffworkers")]
    [string]$target
)

# ✅ ディレクトリマップ
$targetRepoMap = @{
    ffscripts = "..\inuichiba-ffscripts"
    ffimages  = "..\inuichiba-ffimages"
    ffworkers = "..\inuichiba-ffworkers"
}

$targetPath = $targetRepoMap[$target]

Write-Host "`n📂 Git操作対象のディレクトリ: $targetPath" -ForegroundColor Cyan
Set-Location $targetPath

Write-Host "🔄 git pull origin main を実行します..." -ForegroundColor Cyan
Write-Host "⚠️ 本当に pull しますか？（競合の可能性あり） Y/N" -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "🚫 中止しました。" -ForegroundColor Cyan
    exit 0
}

# ✅ pull 実行
git pull origin main

# ✅ 結果確認
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pull に成功しました！" -ForegroundColor Green
} else {
    Write-Host "❌ pull に失敗しました。競合またはエラーの可能性があります。" -ForegroundColor Red
}

# ✅ 元のディレクトリに戻る
Set-Location $PSScriptRoot
