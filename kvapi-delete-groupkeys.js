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

const kvApiUrl = process.env.KV_API_URL_FFPROD;
const token = process.env.KV_API_TOKEN_FFPROD;

if (!kvApiUrl || !token) {
  console.error("❌ KV_API_URL_FFPROD または KV_API_TOKEN_FFPROD が未設定です");
  process.exit(1);
}

// ✅ 対象のgroupIdプレフィックス（変更可能）
// const groupPrefixes = ["C"];       // ← グループ用
// const groupPrefixes = ["R"];       // ← ルーム用
// const groupPrefixes = ["default"]; // ← 1対1（default_Uxxxxx）
const groupPrefixes = ["C"];

const MAX_DELETE = 500;

(async () => {
  try {
    let deleted = 0;

    for (const prefix of groupPrefixes) {
      const payload = {
        kind: "del",
        groupId: prefix,
        limit: MAX_DELETE,
      };

      const res = await fetch(kvApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error(`❌ APIエラー: ${res.status} - ${text}`);
        throw new Error("API request failed");
      }

      const result = JSON.parse(text);
      deleted += result.deleted || 0;
    }

    console.log(`✅ 合計 ${deleted} 件のKVキーを削除しました`);
  } catch (err) {
    console.error("❌ エラー:", err.message || err);
    process.exit(1);
  }
})();
