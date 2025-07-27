// kvapi-delete-groupkeys.js
//
// 📌 このスクリプトは GitHub Actions から自動実行される前提で作られています。
//     通常は手動で実行する必要はありません。
//     Secrets（KV_API_URL_FFPROD, KV_API_TOKEN_FFPROD）は GitHub Actions 内で設定されるため、
//     .env ファイルへの登録は不要です。
//
// 🔒 対象: Cloudflare Workers の KV から groupId が特定文字で始まるキー（例: C）を削除します。
// 🧹 主に Supabase に退避済のグループデータ（C~）に対応したクリーンアップ用途です。
// 🛠️ メンテナンス性向上のため、対応 groupId の条件（C / R / default）にはコメントを明記。
// 🚫 手動実行時は自己責任で環境変数を設定してください（推奨しません）。


import fetch from "node-fetch";

// ✅ Cで始まるKVキー（グループ用）を最大500件削除します
// 🔒 対象は ffprod 環境の KV_API を使用
const apiUrl = process.env.KV_API_URL_FFPROD;
const token = process.env.KV_API_TOKEN_FFPROD;

if (!apiUrl || !token) {
  console.error("❌ KV_API_URL_FFPROD または KV_API_TOKEN_FFPROD が未設定です");
  process.exit(1);
}

// 🔄 削除対象のgroupId（先頭文字）を必要に応じて変更可能
// const groupPrefixes = ["C"]; // ← グループ（例: Cabcdef...）
// const groupPrefixes = ["R"]; // ← ルーム（例: Rabcdef...）
// const groupPrefixes = ["default"]; // ← 1対1のデフォルトグループ（例: default_Uxxxx...）
const groupPrefixes = ["C"]; // 他に "R" や "default" にも対応可能（※下記コメント参照）

// ✅ 最大件数（1日あたり）を設定（GitHub Actions想定）
const MAX_DELETE = 500;

(async () => {
  try {
    let deleted = 0;
    for (const prefix of groupPrefixes) {
      const groupId = prefix; // 例: "C" → groupIdが "C" で始まる(グループラインのこと)

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          kind: "del",
          groupId,  // C, R, default などに対応（API側でfilter）
          ttl: 0,
          limit: MAX_DELETE
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error(`❌ APIエラー: ${res.status} - ${text}`);
        throw new Error("API request failed");
      }
    }

    console.log(`✅ 合計 ${deleted} 件のKVキーを削除しました`);

  } catch (err) {
    console.error("❌ エラー:", err.message || err);
    process.exit(1);
  }
})();
