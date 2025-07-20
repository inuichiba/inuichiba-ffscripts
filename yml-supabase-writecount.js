// yml-supabase-writecount.js
// Node.js版 Supabase 書き込み件数チェック


i// yml-supabase-writecount.js

import fetch from "node-fetch";

const CF_API_TOKEN = process.env.CF_API_TOKEN;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const ACCOUNT_ID = "39914da7b7f259b59d901f0b57cc17cc";

// KVネームスペースIDと名前
const NAMESPACES = [
  { name: "ffdev-users_kv", id: "4ebfa42f89f7478888677c5486b6b540" },
  { name: "ffprod-users_kv", id: "9cc8cd1153a34a66a4e1bf313078664c" }
];

const THRESHOLD = 40000; // 5万件の80%

// JST時刻
const nowJST = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
const yyyymm = nowJST.slice(0, 7);

let errorOccurred = false;
let messages = [];

async function checkWriteCount() {
  for (const ns of NAMESPACES) {
    const key = `writeCount:${yyyymm}`;
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${ns.id}/values/${key}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`
      }
    });

    if (!res.ok) {
      // JSONをパースして message を抽出
      let msg = "取得失敗";
      try {
        const errData = await res.json();
        msg = errData?.errors?.[0]?.message || "Unknown error";
      } catch {
        msg = "レスポンスが不正";
      }

      messages.push(`❌ [${ns.name}] キー取得失敗: ${msg}`);
      errorOccurred = true;
      continue;
    }

    const text = await res.text();
    const count = parseInt(text, 10);
    if (isNaN(count)) {
      messages.push(`❌ [${ns.name}] 取得値が数値でありません: ${text}`);
      errorOccurred = true;
      continue;
    }

    if (count > THRESHOLD) {
      messages.push(`⚠️ [${ns.name}] 書き込み件数が多すぎます: ${count}件（閾値: ${THRESHOLD}）`);
      errorOccurred = true;
    } else {
      console.log(`✅ [${ns.name}] 件数正常: ${count}`);
    }
  }

  if (messages.length > 0) {
    const payload = `📊 Supabase 書き込み件数チェック（${nowJST} JST）\n` + messages.join("\n");

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: payload }),
    });

    console.log("🚨 Discord通知送信済み（Supabase件数）");
    process.exit(1); // GitHub Actionsを「失敗」にする（メール通知トリガー）
  } else {
    console.log("✅ Supabase書き込み件数はすべて正常です");
  }
}

checkWriteCount();
