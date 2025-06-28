# ffimages-upload.ps1
# ✅ 事前に確認する「石橋叩き」安全確認付き版 手動デプロイ
# 
# ✅ 目的：
# inuichiba-ffimages に入れた画像を GitHub へ登録し、
# Cloudflare Pages で公開・CDNキャッシュを最新に更新する。
#
# ✅ 重要：
# - このスクリプトは git push のあと npx wrangler コマンドによって Cloudflare Pages が再デプロイされます。
# - デプロイが完了すると、Cloudflare のキャッシュ（CDNエッジキャッシュ）も自動で更新されます。
# - そのため **ファイル名を変えなくても最新の画像が反映されます**。
#
# ✅ ポイント：
# - Push時は色付きで進行状況を表示（安心の見える化）
# - Push成功/失敗を色分け（成功=緑、失敗=赤で明確に）
# - git status も表示して現状確認
#
# ✅ 実行方法：
# cd D:\nasubi\inuichiba-ffscripts
# powershell -ExecutionPolicy Bypass -File .\ffimages-upload.ps1
# ---------------------------------------------


# --------------------------------------------
# ✅ 対象リポジトリへ移動（画像とpublicがある場所）
# --------------------------------------------
cd "D:\nasubi\inuichiba-ffimages"

# --------------------------------------------
# ✅ git statusを実行し、60秒間目視確認する
# --------------------------------------------
# ✅ 現在のGitステータスを確認
Write-Host "`n📊 60秒間お待ちします... じっくり内容を確認してください。" -ForegroundColor Cyan
git status

# ✅ 60秒間の確認タイム
for ($i = 60; $i -ge 1; $i--) {
    Write-Host "⏳ 残り $i 秒..." -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}

# ✅ 続行するかどうか確認（Y/N）
Write-Host "`n⚠️ 続けて git add -A → commit → push を実行しますか？ (Y/N)" -ForegroundColor Red
$confirm = Read-Host 

if ($confirm -notmatch '^[Yy]$') {
    Write-Host "🚫 中止しました。安心してやり直してください。" -ForegroundColor Green
    exit
}

# --------------------------------------------
# ✅ すべての変更（追加・更新・削除）をGitのステージに追加
# - 画像追加・更新・削除すべて含む
# - -A を使っているのでディレクトリ全体が対象
# --------------------------------------------
Write-Host "`n📝 すべての変更（追加・更新・削除）をステージに追加します..." -ForegroundColor Cyan
git add -A

# --------------------------------------------
# ✅ コミットすべき差分があるか確認
# - git diff --cached --quiet は「差分がなければ 0 を返す」
# - 差分があれば 1 を返す
# - $LASTEXITCODE でその結果を受け取る
# --------------------------------------------
Write-Host "`n🔍 コミットすべき変更があるか確認しています..." -ForegroundColor Cyan
git diff --cached --quiet
$hasChanges = $LASTEXITCODE

# --------------------------------------------
# ✅ もし差分があればコミット＆Push
# - 差分がなければ何もしない（安全運用）
# --------------------------------------------
if ($hasChanges -ne 0) {
     # コミット用のタイムスタンプを作成（ログで分かりやすくする）
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmm'

    # 変更をコミット（コミットメッセージに日時を記録）
    Write-Host "`n🚀 コミットを実行します: '画像更新: $timestamp'" -ForegroundColor Yellow
    git commit -m "画像更新: $timestamp"

    # リモートリポジトリ（origin main）へPush
    Write-Host "`n🚀 GitリモートリポジトリへPushします（origin main）..." -ForegroundColor Magenta
    # ✅ Pushコマンドを実行し、その出力をリアルタイム表示しつつログにも取る
    $pushResult = @()
    & git push origin main 2>&1 | ForEach-Object {
        Write-Host $_
        $pushResult += $_
    }   

    # ✅ Push結果判定（"To " を含んでいれば成功と判定）
    if ($pushResult -match "To ") {
        Write-Host "✅ Push 成功！Cloudflare Pages に反映されました。" -ForegroundColor Green
        
        # --------------------------------------------
        # ✅ Cloudflare Pages へ wrangler デプロイ（Push成功時のみ）
        # --------------------------------------------
        Write-Host "`n🚀 Cloudflare Pages へ手動デプロイ開始..." -ForegroundColor Cyan
        cd "D:\nasubi\inuichiba-ffscripts"
        npx wrangler pages deploy
    } else {
        Write-Host "❌ Push に失敗しました！" -ForegroundColor Red
        Write-Host "⚠️ 以下のエラーメッセージを確認してください：" -ForegroundColor Red
        $pushResult | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }
} else {
    # 💤 変更が無ければ何もしない（黄色で表示して安心）
    Write-Host "💤 画像に変更がないため、何もpush・デプロイしませんでした。" -ForegroundColor Yellow
}

# --------------------------------------------
# ✅ 最後に確認用のgitステータスを表示（安心させる）
# --------------------------------------------
Write-Host "`n📊 現在のGitステータス確認:" -ForegroundColor Cyan
cd "D:\nasubi\inuichiba-ffimages"
git status
