# ffscriptsに置いて、ffscripts/ffworkers それぞれのファイル競合を解決する
# 「ローカル採用版」と「削除採用版」について、競合解決→rebase終了→pushまでワンストップでやる統合スクリプト

<#
✨ffscripts から、ffworkers を処理
cd D:\nasubi\inuichiba-ffscripts
.\git-resolve-xrepo.ps1 -RepoPath "..\inuichiba-ffworkers" -FilePath ".github/workflows/deploy.yml" -Mode keep

✨今いるリポ（ffscripts でも ffworkers でも）を処理
.\git-resolve-xrepo.ps1 -RepoPath "." -FilePath ".github/workflows/ping-supabase.yml" -Mode delete

★注意
・「復活させたい」＝ -Mode keep（rebase 中は --theirs が“自分のコミット側”です）
・「削除に合わせたい」＝ -Mode delete
・pushが怖いときは -AutoPush を付けずに実行。履歴を見て、y を押したら push されます。
#>


param(
    # 対象リポジトリのパス。既定は「今いる場所」（ffscripts/ffworkers どちらでもOK）
    [string]$RepoPath = ".",
    # 競合中/対象のファイル（対象リポのルートからの相対パス）
    [string]$FilePath = ".github/workflows/ping-supabase.yml",
    # 復活させる=keep / 削除を採用=delete
    [ValidateSet("keep","delete")] [string]$Mode = "keep",
    # ブランチ＆リモート
    [string]$Branch = "main",
    [string]$Remote = "origin",
    # 確認なしで自動 push
    [switch]$AutoPush
)

function InRebase {
    return (Test-Path ".git/rebase-merge") -or (Test-Path ".git/rebase-apply")
}

$start = Get-Location
try {
    # 対象リポへ移動
    try {
        $target = Resolve-Path $RepoPath -ErrorAction Stop
    } catch {
        Write-Host "❌ RepoPath が見つかりません：$RepoPath"  -ForegroundColor Red
        exit 1
    }
    Push-Location $target

    if (!(Test-Path ".git")) {
      Write-Host "❌ ここは Git リポジトリではありません：$target"  -ForegroundColor Red
      exit 1
    }

    Write-Host "📂 作業リポジトリ: $((Get-Location).Path)"
    git status | Out-Host

    # rebase 未開始なら取得＆rebase を開始（競合があればここで発生）
    if (-not (InRebase)) {
        Write-Host "⬇️ 取得＆rebase: $Remote/$Branch" -ForegroundColor Cyan
        git fetch $Remote | Out-Host
        git pull --rebase $Remote $Branch | Out-Host
    }

    # keep のときは念のためバックアップ
    if ($Mode -eq "keep" -and (Test-Path $FilePath)) {
        try { Copy-Item $FilePath "$FilePath.bak" -Force } catch {}
    }

    # === 競合解決 ===
    if ($Mode -eq "keep") {
        Write-Host "📌 競合解決: ローカル版を採用（rebase中は --theirs）→ $FilePath"  -ForegroundColor Cyan
        git checkout --theirs $FilePath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ --theirs が使えないため、現在のワークツリー内容をそのまま採用します。" -ForegroundColor Yellow
        }
        git add $FilePath
    } else {
        Write-Host "🗑️ 競合解決: 削除を採用 → $FilePath"  -ForegroundColor Cyan
        git rm -f $FilePath
    }

    # rebase 続行（必要に応じて繰り返す）
    git rebase --continue | Out-Host
    $guard = 0
    while (InRebase) {
        $guard++
        if ($guard -gt 10) {
          Write-Host "⚠️ rebase が長引いています。手動で解決してください。"  -ForegroundColor Yellow
          break
        }
        $p = git status --porcelain
        if ($p -match '^(UU|AA|DD|DU|UD|UA|AU)\s') {
            Write-Host "⚠️ 他の競合が残っています。該当ファイルを直し、git add → git rebase --continue を実行してください。"  -ForegroundColor Red
            $p | Out-Host
            break
        }
        git rebase --continue | Out-Host
    }

    Write-Host "`n✅ 現在の状態："  -ForegroundColor Cyan
    git status | Out-Host

    # ★ push前に直近履歴を必ず表示（覚えるコマンド）
    Write-Host "`n🧭 直近の履歴（$Branch）：" -ForegroundColor Cyan
    git log --oneline --graph -n 10 | Out-Host

    # push（確認つき）
    if (-not (InRebase)) {
        if ($AutoPush) {
            Write-Host "🚀 自動 push: $Remote $Branch" -ForegroundColor Red
            git push $Remote $Branch
        } else {
            $ans = Read-Host "🚀 $Remote/$Branch へ push しますか？ (y/N)"
            if ($ans -match '^(y|Y)') {
                git push $Remote $Branch
            } else {
                Write-Host "ℹ️ push をスキップしました。必要なら後で  git push $Remote $Branch  を実行してください。"  -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "⚠️ まだ rebase 中の可能性があります。表示された指示に従って手動で解決してください。"  -ForegroundColor Yellow
    }

} finally {
    Pop-Location
    Write-Host "↩️ 元の場所へ戻りました：$($start.Path)"  -ForegroundColor Cyan
}
