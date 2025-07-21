// yml-monitor-kvsb-usage.js
// 📊 GitHub ActionsからCloudflare KVとSupabaseの使用状況を監視して通知

import {
  getSupabaseCountAndNotify,
} from "./lib/yml-supabase-utils.js";

import {
  getKVUsage,
  notifyIfUsageExceeded,
} from "./lib/yml-kv-utils.js";

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

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

// 評価終了後削除！！
console.log("🔐 FFDEV  Tokenの先頭:", process.env.KV_API_TOKEN_FFDEV?.slice(0, 5));
console.log("🔐 FFPROD Tokenの先頭:", process.env.KV_API_TOKEN_FFPROD?.slice(0, 5));


(async () => {
  for (const config of KV_CONFIGS) {
    const { kvNamespaceId, isProd, name, apiToken } = config;

    const usage = await getKVUsage(CF_ACCOUNT_ID, kvNamespaceId, apiToken);
    if (!usage) {
      console.error(`❌ [${name}] 使用量取得失敗`);
      continue;
    }

    await notifyIfUsageExceeded({
      usage,
      kvName: name,
      isProd,
      DISCORD_WEBHOOK_URL,
    });

    const result = await getSupabaseCountAndNotify({ isProd, kvName: name });
    if (result.status !== "ok") {
      console.error(`❌ [${name}] Supabase件数取得失敗: ${result.error}`);
    }
  }
})();
