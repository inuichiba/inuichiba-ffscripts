// lib/yml-kv-utils.js
// 📦 Cloudflare KV 使用量チェックユーティリティ
// - KV使用率が80%以上のネームスペースに関して、Discordへ通知
// - JST日時と整形出力に対応

import { getFormattedJST } from "./yml-supabase-utils.js";


/**
 * 📥 Cloudflare APIを使ってKVネームスペースの使用量を取得する
 * @param {string} accountId - CloudflareアカウントID
 * @param {string} namespaceId - KVネームスペースID
 * @param {string} apiToken - Cloudflare API Token
 * @returns {Promise<object>} 使用量オブジェクトまたは null
 */
export async function getKVUsage( namespaceId, accountId, apiToken ) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/usage`;


  // 評価終了後削除！！
  console.log("🔐 apiTokenの先頭:", apiToken?.slice(0, 5));

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare API error (${res.status}): ${err}`);
  }

  return await res.json(); // JSON形式で返す（含まれるのは各種 usage 情報）
}




/**
 * 📊 使用率が80%以上の場合、Discordへ通知を送信
 * @param {object} params
 * @param {object} params.usage - 使用量オブジェクト（Read, Write, Delete, List, Storage）
 * @param {boolean} params.isProd - 本番環境かどうか
 * @param {string} params.kvName - KV名（例: usersKV_ffdev）
 * @param {string} params.DISCORD_WEBHOOK_URL - Discord Webhook URL
 */
export async function notifyIfUsageExceeded({ usage, isProd, kvName, DISCORD_WEBHOOK_URL }) {
  const { read, write, delete: del, list, storage } = usage;
  const percentage = Math.floor((storage.usage / storage.limit) * 100);
  if (percentage < 80) return; // 通知しきい値未満なら無視

  const envLabel = isProd ? "ffprod" : "ffdev";
  const now = getFormattedJST();
  const format = (u) => `${u.usage} / ${u.limit}`;

  const lines = [
    `⚠️ KV使用量が80%を超えました！（${now} JST）`,
    `【${envLabel}-${kvName}】`,
    `📖 Read: ${format(read)}`,
    `📝 Write: ${format(write)}`,
    `🗑️ Delete: ${format(del)}`,
    `📋 List: ${format(list)}`,
    `📦 Storage: ${Math.floor(storage.usage / 1024)} KB / ${Math.floor(storage.limit / 1024 / 1024)} GB`,
  ];

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n") }),
  });
}
