// check-kv-usage.js
import fetch from "node-fetch";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const ACCOUNT_ID = "39914da7b7f259b59d901f0b57cc17cc";
const NAMESPACES = [
  { name: "ffdev-users_kv", id: "4ebfa42f89f7478888677c5486b6b540" },
  { name: "ffprod-users_kv", id: "9cc8cd1153a34a66a4e1bf313078664c" }
];

const KV_LIMITS = {
  read: 100000,
  write: 1000,
  delete: 1000,
  list: 1000,
  storage: 1073741824, // 1 GB
};

const threshold = 0.8; // 80%

async function getKVUsage(namespaceId) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/usage`, {
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
    },
  });
  const data = await res.json();
  return data.result || {};
}

function isOverLimit(value, limit) {
  return value > limit * threshold;
}

function formatUsage(nsName, usage) {
  const messages = [];
  const { read_operations, write_operations, delete_operations, list_operations, storage_bytes } = usage;

  if (isOverLimit(read_operations, KV_LIMITS.read)) messages.push(`📖 Read: ${read_operations} / ${KV_LIMITS.read}`);
  if (isOverLimit(write_operations, KV_LIMITS.write)) messages.push(`📝 Write: ${write_operations} / ${KV_LIMITS.write}`);
  if (isOverLimit(delete_operations, KV_LIMITS.delete)) messages.push(`❌ Delete: ${delete_operations} / ${KV_LIMITS.delete}`);
  if (isOverLimit(list_operations, KV_LIMITS.list)) messages.push(`📋 List: ${list_operations} / ${KV_LIMITS.list}`);
  if (isOverLimit(storage_bytes, KV_LIMITS.storage)) messages.push(`📦 Storage: ${Math.round(storage_bytes / 1024)} KB / 1 GB`);

  if (messages.length === 0) return null;

  return `⚠️ KV使用量が80%を超えました！\n【${nsName}】\n` + messages.join("\n");
}


(async () => {
  let overLimit = false;
  for (const ns of NAMESPACES) {
    const usage = await getKVUsage(ns.id);
    const msg = formatUsage(ns.name, usage);
    if (msg) {
      overLimit = true;
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg }),
      });
      console.log(`✅ Discord通知済み: ${ns.name}`);
    }
  }

  if (overLimit) {
    console.error("❌ 使用量が閾値を超えました。GitHub Actionsをエラー終了させます。");
    process.exit(1);
  } else {
    console.log("✅ 全て安全です（80%未満）");
  }
})();
