// check-kv-usage.js
/**
 * GitHubのActionsから "kv-usage-monitor.yml" が毎日実行します
 * このワークフローは以下を目的としています：
 *
 * 項目 監視対象  上限値   警告閾値             上限値  警告閾値  単位
 * 📖  Read Operations   KV読み取り回数       100,000 80,00回  1日あたり
 * 📝  Write Operations  KV書き込み回数       1,000   800回    1日あたり
 * ❌  Delete Operations KV削除回数           1,000   800回    1日あたり
 * 📋  List Operations   KVリスト取得         1,000   800回    1日あたり
 * 📦  Storage           KVの合計保存バイト数  1GB     800MB    ⭐恒久(超えると新規書き込みはできない)
 *
 * ⭐放置厳禁。手動で削除 or namespaceを分割するしかない
 * ※"1日あたり"の場合、「毎日午前0時（UTC）」にリセットされる（JSTでは朝9時）
 *
 */


import fetch from "node-fetch";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const ACCOUNT_ID = "39914da7b7f259b59d901f0b57cc17cc";
const NAMESPACES = [
  { name: "ffdev-users_kv", id: "4ebfa42f89f7478888677c5486b6b540" },
  { name: "ffprod-users_kv", id: "9cc8cd1153a34a66a4e1bf313078664c" }
];

const KV_LIMITS = {
  read: { value: 100000, note: "📆 日次上限" },
  write: { value: 1000, note: "📆 日次上限" },
  delete: { value: 1000, note: "📆 日次上限" },
  list: { value: 1000, note: "📆 日次上限" },
  storage: { value: 1073741824, note: "❗恒久上限（即刻対応要！要削除）" }, // 1 GB
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
  const {
    read_operations,
    write_operations,
    delete_operations,
    list_operations,
    storage_bytes
  } = usage;

  const limits = KV_LIMITS;

  if (isOverLimit(read_operations, limits.read.value)) {
    messages.push(`📖 Read: ${read_operations} / ${limits.read.value}　(${limits.read.note})`);
  }

  if (isOverLimit(write_operations, limits.write.value)) {
    messages.push(`📝 Write: ${write_operations} / ${limits.write.value}　(${limits.write.note})`);
  }

  if (isOverLimit(delete_operations, limits.delete.value)) {
    messages.push(`❌ Delete: ${delete_operations} / ${limits.delete.value}　(${limits.delete.note})`);
  }

  if (isOverLimit(list_operations, limits.list.value)) {
    messages.push(`📋 List: ${list_operations} / ${limits.list.value}　(${limits.list.note})`);
  }

  if (isOverLimit(storage_bytes, limits.storage.value)) {
    const usedKB = Math.round(storage_bytes / 1024);
    messages.push(`📦 Storage: ${usedKB} KB / 1 GB　(${limits.storage.note})`);
  }

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
