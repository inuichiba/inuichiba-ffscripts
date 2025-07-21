// yml-monitor-kvsb-usage.js
// 📊 KV & Supabase 使用量統合モニタリング（現状はKVのみ有効）

import { getKVUsage, notifyIfUsageExceeded } from "./lib/yml-kv-utils.js";
// import { getSupabaseCountAndNotify } from "./lib/yml-supabase-utils.js"; ← 一時停止

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// 🔐 KVネームスペースの構成（ffdev / ffprod）
const KV_CONFIGS = [
  {
    kvNamespaceId: "4ebfa42f89f7478888677c5486b6b540",
    isProd: false,
    name: "usersKV_ffdev",
    apiToken: process.env.KV_API_TOKEN_FFDEV,
  },
  {
    kvNamespaceId: "9cc8cd1153a34a66a4e1bf313078664c",
    isProd: true,
    name: "usersKV_ffprod",
    apiToken: process.env.KV_API_TOKEN_FFPROD,
  },
];

// ✅ KV使用状況をチェックして通知（Supabaseは現在オフ）
async function main() {
  for (const config of KV_CONFIGS) {
    const { kvNamespaceId, apiToken, isProd, name } = config;
    let usage;

    try {
      usage = await getKVUsage(kvNamespaceId, CF_ACCOUNT_ID, apiToken);
    } catch (err) {
      console.error(`❌ ${name} のKV使用量取得に失敗:`, err.message);
      continue; // 次のネームスペースへ
    }

    // 通知判定・送信
    await notifyIfUsageExceeded({
      usage,
      isProd,
      kvName: name,
      DISCORD_WEBHOOK_URL,
    });
  }

  // ✅ Supabase部分は後日再開
  /*
  try {
    await getSupabaseCountAndNotify();
  } catch (err) {
    console.error("❌ Supabaseカウント取得に失敗:", err.message);
  }
  */
}

main();
