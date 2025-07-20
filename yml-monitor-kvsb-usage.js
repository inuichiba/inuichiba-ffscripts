import fetch from "node-fetch";

// 評価終了時削除！
console.log("🔐 CFW_API_TOKEN 長さ:", (process.env.CFW_API_TOKEN || "").length);

// 🔐 Secrets from GitHub Actions
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CFW_API_TOKEN = process.env.CFW_API_TOKEN;

// 🧩 Cloudflare アカウント・KV情報
const ACCOUNT_ID = "39914da7b7f259b59d901f0b57cc17cc";
const KV_NAMESPACES = [
  { name: "ffdev-users_kv", id: "4ebfa42f89f7478888677c5486b6b540" },
  { name: "ffprod-users_kv", id: "9cc8cd1153a34a66a4e1bf313078664c" }
];

// 📊 KV制限値
const KV_LIMITS = {
  read:    { value: 100000, note: "📆 日次上限" },
  write:   { value: 1000, note: "📆 日次上限" },
  delete:  { value: 1000, note: "📆 日次上限" },
  list:    { value: 1000, note: "📆 日次上限" },
  storage: { value: 1073741824, note: "❗恒久上限（至急対応要：要削除）" },
};
const KV_THRESHOLD = 0.8;

// 📊 Supabase writeCount用
const SUPABASE_THRESHOLD = 40000;
const nowJST = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
const yyyymm = nowJST.slice(0, 7);

// 🔧 共通ユーティリティ
function isOverLimit(value, limit) {
  return typeof value === "number" && !isNaN(value) && value > limit * KV_THRESHOLD;
}

// ✅ KVチェック処理
async function checkKVUsage() {
  let error = false;
  const results = [];

  for (const ns of KV_NAMESPACES) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${ns.id}/usage`, {
      headers: { Authorization: `Bearer ${CFW_API_TOKEN}` }
    });

    const data = await res.json();
    if (!res.ok || !data?.result) {
      results.push(`❌ [${ns.name}] 使用量取得失敗`);
      error = true;
      continue;
    }

    const u = data.result;
    const {
      read_operations, write_operations, delete_operations,
      list_operations, storage_bytes
    } = u;

    // 判定は個別、出力は全部
    const overAny = [
      isOverLimit(read_operations, KV_LIMITS.read.value),
      isOverLimit(write_operations, KV_LIMITS.write.value),
      isOverLimit(delete_operations, KV_LIMITS.delete.value),
      isOverLimit(list_operations, KV_LIMITS.list.value),
      isOverLimit(storage_bytes, KV_LIMITS.storage.value),
    ].some(Boolean);

    if (overAny) {
      const lines = [
        `📖 Read: ${read_operations.toLocaleString()} / ${KV_LIMITS.read.value.toLocaleString()}　(${KV_LIMITS.read.note})`,
        `📝 Write: ${write_operations.toLocaleString()} / ${KV_LIMITS.write.value.toLocaleString()}　(${KV_LIMITS.write.note})`,
        `🗑️ ゴミ箱 Delete: ${delete_operations.toLocaleString()} / ${KV_LIMITS.delete.value.toLocaleString()}　(${KV_LIMITS.delete.note})`,
        `📋 List: ${list_operations.toLocaleString()} / ${KV_LIMITS.list.value.toLocaleString()}　(${KV_LIMITS.list.note})`,
        `📦 Storage: ${Math.round(storage_bytes / 1024).toLocaleString()} KB / 1 GB　(${KV_LIMITS.storage.note})`
      ];

      results.push(`⚠️ Cloudflare Workers KV使用量が80%を超えました！\n【${ns.name}】\n` + lines.join("\n"));
      error = true;
    }
  }

  return { error, message: results.join("\n\n") };
}

// ✅ Supabase writeCountチェック処理
async function checkSupabaseUsage() {
  let error = false;
  const results = [];

  for (const ns of KV_NAMESPACES) {
    const key = `writeCount:${yyyymm}`;
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${ns.id}/values/${key}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${CFW_API_TOKEN}` }
    });

    const status = res.status;
    const text = await res.text();

    if (status === 404) {
      results.push(`❌ [${ns.name}] Supabase件数取得失敗: キーが見つかりません（404）`);
      error = true;
      continue;
    }

    if (!res.ok) {
      let reason = "取得失敗";
      try {
        const err = JSON.parse(text);
        reason = err?.errors?.[0]?.message || res.statusText;
      } catch {
        reason = res.statusText;
      }
      results.push(`❌ [${ns.name}] Supabase件数取得失敗: ${reason}`);
      error = true;
      continue;
    }

    const count = parseInt(text, 10);
    if (isNaN(count)) {
      results.push(`❌ [${ns.name}] 件数が数値ではありません: ${text}`);
      error = true;
    } else if (count > SUPABASE_THRESHOLD) {
      results.push(`⚠️ 【${ns.name}】 書き込み件数が多すぎます: ${count} / 50000 件`);
      error = true;
    }
  }

  if (results.length > 0) {
    return {
      error: true,
      message: `⚠️ Supabase書き込み件数 警告（${nowJST} JST）\n` + results.join("\n")
    };
  } else {
    return { error: false };
  }
}


// ✅ メイン処理
(async () => {
  const [kvResult, supabaseResult] = await Promise.all([
    checkKVUsage(),
    checkSupabaseUsage()
  ]);

  const messages = [];
  if (kvResult.error) messages.push(kvResult.message);
  if (supabaseResult.error) messages.push(supabaseResult.message);

  if (messages.length > 0) {
    const content = `🚨 使用状況チェック 警告（${nowJST} JST）\n\n` + messages.join("\n\n");

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });

    console.error("❌ 使用状況チェックでエラーあり → Discord通知送信＆Actions失敗");
    process.exit(1);
  } else {
    console.log("✅ KV & Supabase 使用量はすべて正常（80%未満）");
  }
})();
