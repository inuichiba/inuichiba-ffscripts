// 📄 yml-monitor-kvsb-usage.js
// Cloudflare KV（ffprod / ffdev）の使用量を監視し、
// 80%を超えた場合は Discord へ通知して GitHub Actions を異常終了させます（GitHubが自動でメール通知してくれる）。
// 実行元は GitHub Actions の monitor-kvsb-usage.yml（毎日 JST 09:30 実行）です。

import fetch from 'node-fetch';

// ====================== 🟦 Supabase関連 ======================

function getCurrentMonthKeyJST() {
  const date = new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `writeCount:${year}-${month}`;
}

async function getSupabaseWriteCount(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/get_kv_count`;
  const headers = {
    apikey: env.SUPABASE_KEY,
    Authorization: `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  const key = getCurrentMonthKeyJST();
  const body = JSON.stringify({ key });

  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    const json = await res.json();

    if (res.status === 404 || json?.count == null) {
      console.log(`ℹ️ Supabaseキー未存在 (${key}) → 今月まだ0件 → 正常終了扱い`);
      return null;
    }

    const count = parseInt(json?.count ?? 0);
    const max = 10000;
    const percent = Math.round((count / max) * 100);

    return {
      type: 'supabase',
      key,
      count,
      max,
      percent
    };
  } catch (e) {
    console.warn(`❌ Supabase取得失敗:`, e.message);
    return null;
  }
}


// ====================== 🟥 KV関連 ======================

/**
 * Cloudflare KVネームスペースの使用状況を取得します。
 * @param {string} name - 環境名（ffdev / ffprod）
 * @param {string} namespaceId - 対象KVネームスペースのID
 * @param {string} token - Cloudflare APIトークン
 * @param {object} env - 環境変数（CF_ACCOUNT_ID を含む）
 * @returns {object|null} 使用量情報（成功時）または null（失敗時）
 */
async function fetchKVUsage(name, namespaceId, token, env) {
  const accountId = env.CF_ACCOUNT_ID;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/usage`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (!json.success) {
      console.warn(`⚠️ KV(${name}) 取得失敗`, json.errors);
      return null;
    }

    const usage = json.result;
    const percent = Math.round((usage.storage.list_usage / 1048576) / 1024 * 100); // KB→GB→%

    return {
      type: 'kv',
      name,
      percent,
      usage
    };
  } catch (e) {
    console.warn(`⚠️ KV(${name}) 取得エラー:`, e.message);
    return null;
  }
}

// ====================== 📢 通知関連 ======================


/**
 * Discord Webhook へメッセージを送信します。
 * @param {string} webhookUrl - Webhook URL
 * @param {string} message - 通知メッセージ本文
 */
async function sendDiscordNotification(webhookUrl, message) {
  const payload = { content: message };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.warn(`⚠️ Discord通知失敗: ${res.status}`);
  }
}

/**
 * 通知用の整形済みメッセージを作成します。
 * @param {Array} results - 使用率が80%を超えたKV一覧
 * @param {string} time - JSTフォーマット済み時刻
 */
async function sendDiscordNotification(webhookUrl, message) {
  const payload = { content: message };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.warn(`⚠️ Discord通知失敗: ${res.status}`);
  }
}

function createAlertMessage(results, time) {
  let msg = `⚠️ 使用量が80%を超えました！（${time} JST）\n`;

  for (const r of results) {
    if (r.type === 'supabase') {
      msg += `\n🟦 Supabase\n📝 書き込み件数: ${r.count} / ${r.max}（${r.percent}%）\n📦 Key: ${r.key}\n`;
    } else if (r.type === 'kv') {
      const u = r.usage;
      msg += `\n🟥 KV: ${r.name}\n📖 Read: ${u.reads} / ${u.reads_limit}\n` +
             `📝 Write: ${u.writes} / ${u.writes_limit}\n` +
             `🗑️ Delete: ${u.deletes} / ${u.deletes_limit}\n` +
             `📋 List: ${u.list} / ${u.list_limit}\n` +
             `📦 Storage: ${Math.round(u.storage.list_usage / 1024)} KB / 1 GB（${r.percent}%）\n`;
    }
  }

  return msg;
}
// ====================== 🕒 JST時間ヘルパー ======================

/**
 * JST（日本時間）で現在の時刻を「YYYY/MM/DD H:mm:ss」形式で返します。
 * 時（H）は先頭ゼロなし。
 */
function getFormattedJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, '0');
  const dd = String(jst.getDate()).padStart(2, '0');
  const h = jst.getHours(); // ← 先頭0なし
  const mi = String(jst.getMinutes()).padStart(2, '0');
  const ss = String(jst.getSeconds()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${h}:${mi}:${ss}`;
}

// ====================== 🚀 メイン処理 ======================

const env = process.env;
const results = [];

// ✅ ログ出力（トークンやIDの先頭のみ）
console.log("✅ CF_ACCOUNT_ID:", env.CF_ACCOUNT_ID?.slice(0, 6));
console.log("✅ KV_API_TOKEN_FFDEV:", env.KV_API_TOKEN_FFDEV?.slice(0, 6));
console.log("✅ KV_API_TOKEN_FFPROD:", env.KV_API_TOKEN_FFPROD?.slice(0, 6));

// ✅ KV一覧（ffdev / ffprod）を順にチェック
const kvTargets = [
  { name: 'ffdev', namespaceId: '4ebfa42f89f7478888677c5486b6b540', token: env.KV_API_TOKEN_FFDEV },
  { name: 'ffprod', namespaceId: '9cc8cd1153a34a66a4e1bf313078664c', token: env.KV_API_TOKEN_FFPROD }
];

const run = async () => {
  for (const { name, namespaceId, token } of kvTargets) {
    const usage = await fetchKVUsage(name, namespaceId, token, env);
    if (usage) {
      if (usage.percent >= 80) results.push(usage);
    } else {
      console.warn(`⚠️ KV(${name}) 使用量取得失敗`);
    }
  }

  const supa = await getSupabaseWriteCount(env);
  if (supa) {
    if (supa.percent >= 80) results.push(supa);
  }

  if (results.length > 0) {
    const time = getFormattedJST();
    const message = createAlertMessage(results, time);
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, message);

    // ✅ 最後に1回だけ異常終了
    throw new Error("❌ 使用量が80%を超えたため異常終了");
  } else {
    console.log("✅ 全使用量は正常範囲です（<80%）");
  }
};

run();

