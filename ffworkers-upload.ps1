# ffworkers-upload.ps1
# Cloudflare Workers 用リポジトリの git push を安全に実行する
# mainブランチのみ許可・競合チェック・内容確認タイムあり

Write-Host "`n🔍 現在のブランチを確認中..." -ForegroundColor Yellow
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 現在のブランチ: $branch" -ForegroundColor Cyan

# ⛔️ main 以外は中止
if ($branch -ne "main") {
    Write-Host "`n⚠️ 現在のブランチは 'main' ではありません → '$branch'" -ForegroundColor Red
    Write-Host "🚫 push を中止します。" -ForegroundColor Red
    exit 1
}

# 🔄 リモートと差分チェック
Write-Host "`n🔄 リモートと差分をチェック（fetch + log）..." -ForegroundColor Yellow
git fetch origin
$remoteDiff = git log HEAD..origin/$branch --oneline

if ($remoteDiff) {
    Write-Host "⚠️ ローカルとリモートに差分があります。" -ForegroundColor Yellow
    Write-Host "🛑 push すると競合の可能性があります。pull または rebase してから再実行してください。" -ForegroundColor Red
    exit 1
}

# 🧾 ステータス表示
Write-Host "`n📦 git status を確認します..." -ForegroundColor Yellow
git status

# 🗂 差分ファイル一覧
Write-Host "`n🗂 変更されたファイル一覧（git diff --name-only）:" -ForegroundColor Yellow
$diffFiles = git diff --name-only
if ($diffFiles) {
    foreach ($file in $diffFiles) {
        Write-Host "  - $file" -ForegroundColor White
    }
} else {
    Write-Host "⚠️ 差分はありません。" -ForegroundColor DarkGray
}

# ⏳ 内容確認タイム
Write-Host "`n⏳ 60秒間、変更内容をご確認ください..." -ForegroundColor DarkGray
for ($i = 60; $i -ge 1; $i--) {
    Write-Host "⏳ 残り $i 秒..." -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}

# 📝 コミットメッセージ
Write-Host "`n🔸 コミットメッセージを入力してください：" -ForegroundColor Cyan
$commitMessage = Read-Host

# ✅ 実行確認
Write-Host "`n⚠️ git add → commit → push を実行しますか？（Y/N）" -ForegroundColor Red
$confirm = Read-Host

if ($confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host "`n📥 git add -A を実行中..." -ForegroundColor Cyan
    git add -A

    Write-Host "📝 git commit を実行中..." -ForegroundColor Cyan
    git commit -m $commitMessage

    Write-Host "🚀 git push origin main を実行中..." -ForegroundColor Cyan
    git push origin $branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ push に成功しました！" -ForegroundColor Green
    } else {
        Write-Host "`n❌ push に失敗しました。" -ForegroundColor Red
    }
} else {
    Write-Host "`n🚫 中止しました。安心してやり直してください。" -ForegroundColor Cyan
}
