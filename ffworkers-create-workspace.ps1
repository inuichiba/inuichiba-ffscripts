# create-workspace.ps1
# 指定した src フォルダを VSCode ワークスペースとして登録するスクリプト

# --- 設定（必要に応じて変更可）---
$projectRoot = "D:\nasubi\inuichiba-ffworkers"
$workspaceFile = Join-Path $projectRoot "inuichiba-ffworkers.code-workspace"
$srcPath = "D:/nasubi/inuichiba-ffworkers/src"  # 「/」で統一（VSCode用）

# --- JSONの中身を作成 ---
$workspaceJson = @"
{
  "folders": [
    {
      "path": "$srcPath"
    }
  ],
  "settings": {
    "search.useGlobalIgnoreFiles": true
  }
}
"@

# --- ファイルに書き出し ---
$workspaceJson | Set-Content -Encoding UTF8 -Path $workspaceFile

# --- 結果表示 ---
Write-Host "✅ ワークスペースファイルを作成しました:"
Write-Host "$workspaceFile"
