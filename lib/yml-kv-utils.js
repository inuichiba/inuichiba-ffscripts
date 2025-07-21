// lib/yml-kv-utils.js
// 📊 GitHub Actions用：Cloudflare KV使用量を取得し、80%以上ならDiscord通知するユーティリティ

import { getFormattedJST } from "./yml-supabase-utils.js";

/**
 * 📥 Cloudflare APIを使ってKVネームスペースの使用量を取得する
 * @param {string} accountId - CloudflareアカウントID
 * @param {string} namespaceId - KVネームスペースID
 * @param {string} apiToken - Cloudflare API Token
 * @returns {Promise<object>} 使用量オブジェクトまたは null
 */
export async function getKVUsage(accountId, namespaceId, apiToken) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/usage`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    return json?.result || null;
  } catch (err) {
    console.error(`❌ KV使用量取得失敗:`, err.message);
    return null;
  }
}



/**
 * 使用量が80%を超えていた場合にDiscord通知を送信
 * @param {object} params
 * @param {object} params.usage - KV使用量データ
 * @param {string} params.kvName - KV名（例: usersKV_ffprod）
 * @param {boolean} params.isProd - 本番環境かどうか
 * @param {string} params.DISCORD_WEBHOOK_URL - Discord通知先
 */
export async function notifyKVUsageIfNeeded({ usage, kvName, isProd, DISCORD_WEBHOOK_URL }) {
  const limit = {
    read: 100000,
    write: 1000,
    delete: 1000,
    list: 1000,
    storageKB: 1024 * 1, // 1GB
  };

  const percent = {
    read: Math.floor((usage?.read || 0) / limit.read * 100),
    write: Math.floor((usage?.write || 0) / limit.write * 100),
    delete: Math.floor((usage?.delete || 0) / limit.delete * 100),
    list: Math.floor((usage?.list || 0) / limit.list * 100),
    storageKB: Math.floor((usage?.storage || 0) / limit.storageKB * 100),
  };

  const over80 = Object.values(percent).some((p) => p >= 80);
  if (!over80) return;

  const envLabel = isProd ? "ffprod" : "ffdev";
  const now = getFormattedJST();

  const msg = [
    `⚠️ KV使用量が80%を超えました！（${now} JST）`,
    `【${envLabel}-${kvName}】`,
    `📖 Read: ${usage.read} / ${limit.read}　(${percent.read}%)`,
    `📝 Write: ${usage.write} / ${limit.write}　(${percent.write}%)`,
    `🗑️ Delete: ${usage.delete} / ${limit.delete}　(${percent.delete}%)`,
    `📋 List: ${usage.list} / ${limit.list}　(${percent.list}%)`,
    `📦 Storage: ${usage.storage} KB / 1 GB　(${percent.storageKB}%)`,
  ].join("\n");

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg }),
  });
}
