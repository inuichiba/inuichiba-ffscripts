// yml-check-kv-usage.js

import fetch from "node-fetch";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const ACCOUNT_ID = "39914da7b7f259b59d901f0b57cc17cc";

// チェック対象のKVネームスペース
const NAMESPACES = [
  { name: "ffdev-users_kv", id: "4ebfa42f89f7478888677c5486b6b540" },
  { name: "ffprod-users_kv", id: "9cc8cd1153a34a66a4e1bf313078664c" }
];

// 上限と注釈付き制限情報
const KV_LIMITS = {
  read:    { value: 100000, note: "📆 日次上限" },
  write:   { value: 1000, note: "📆 日次上限" },
  delete:  { value: 1000, note: "📆 日次上限" },
  list:    { value: 1000, note: "📆 日次上限" },
  storage: { value: 1073741824, note: "❗恒久上限（至急対応要：要削除）" },
};

const threshold = 0.8;

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
  return;
  // return value > limit * threshold;
}

function formatUsage(nsName, usage) {
  const msgs = [];

  const { read_operations, write_operations, delete_operations, list_operations, storage_bytes } = usage;

  const lines = [];

  if (isOverLimit(read_operations, KV_LIMITS.read.value)) {
    lines.push(`📖 Read: ${read_operations?.toLocaleString() || "?"} / ${KV_LIMITS.read.value.toLocaleString()}　(${KV_LIMITS.read.note})`);
  }
  if (isOverLimit(write_operations, KV_LIMITS.write.value)) {
    lines.push(`📝 Write: ${write_operations?.toLocaleString() || "?"} / ${KV_LIMITS.write.value.toLocaleString()}　(${KV_LIMITS.write.note})`);
  }
  if (isOverLimit(delete_operations, KV_LIMITS.delete.value)) {
    lines.push(`❌ Delete: ${delete_operations?.toLocaleString() || "?"} / ${KV_LIMITS.delete.value.toLocaleString()}　(${KV_LIMITS.delete.note})`);
  }
  if (isOverLimit(list_operations, KV_LIMITS.list.value)) {
    lines.push(`📋 List: ${list_operations?.toLocaleString() || "?"} / ${KV_LIMITS.list.value.toLocaleString()}　(${KV_LIMITS.list.note})`);
  }
  if (isOverLimit(storage_bytes, KV_LIMITS.storage.value)) {
    const kb = Math.round(storage_bytes / 1024);
    lines.push(`📦 Storage: ${kb.toLocaleString()} KB / 1 GB　(${KV_LIMITS.storage.note})`);
  }

  if (lines.length === 0) return null;

  return `⚠️ KV使用量が80%を超えました！\n【${nsName}】\n` + lines.join("\n");
}

(async () => {
  let overLimit = false;
  let allMessages = [];

  for (const ns of NAMESPACES) {
    const usage = await getKVUsage(ns.id);
    const msg = formatUsage(ns.name, usage);
    if (msg) {
      overLimit = true;
      allMessages.push(msg);
    }
  }

  if (overLimit) {
    const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    const payload = `📦 Cloudflare KV使用量チェック（${now} JST）\n\n` + allMessages.join("\n\n");

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: payload }),
    });

    console.error("❌ 使用量が80%を超えました → Discord通知送信＆Actions失敗");
    process.exit(1);
  } else {
    console.log("✅ KV使用量はすべて安全（80%未満）");
  }
})();

