// 📄 yml-monitor-kvsb-usage.js
// GitHub Actions (monitor-kvsb-usage.yml) により、毎日 JST 09:30（= UTC 00:30）に実行されます。
// Cloudflare Workers の KV 使用量（ffdev / ffprod）および Supabase の月次書き込み件数を監視。
// いずれかが 80% を超えた場合は Discord に通知し、ジョブを異常終了させます。

import fetch from "node-fetch";

// ====================== 🔷 Supabase関連処理 ======================

/**
 * 現在の日本時間を基に Supabase のカウントキーを生成（形式：writeCount:YYYY-MM）
 */
function getCurrentMonthKeyJST() {
  const date = new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `writeCount:${year}-${month}`;
}

/**
 * Supabase の月次書き込み件数を取得し、使用率を計算
 * @param {object} env - 環境変数（SUPABASE_URL, SUPABASE_KEY）
 * @returns {object} 結果 { type, count, max, percent, key }
 */
async function getSupabaseWriteCount(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/get_kv_count`;
  const headers = {
    apikey: env.SUPABASE_KEY,
    Authorization: `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  const key = getCurrentMonthKeyJST();

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ key })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`❌ Supabase取得失敗: ${res.status} - ${err}`);
  }

  const json = await res.json();
  const count = parseInt(json?.count ?? 0);
  const max = 10000;
  const percent = Math.round((count / max) * 100);

  return { type: 'supabase', count, max, percent, key };
}

// ====================== 🔴 Cloudflare KV関連 ======================

/**
 * Cloudflare KV使用量を取得し、使用率を計算（Storage容量ベース）
 * @param {string} name - ffdev または ffprod
 * @param {string} namespaceId - 対象のKVネームスペースID
 * @param {string} token - Cloudflare APIトークン
 * @param {object} env - 環境変数（CF_ACCOUNT_ID）
 */
async function fetchKVUsage(name, namespaceId, token, env) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/usage`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, { headers });
  const json = await res.json();

  if (!json.success) {
    console.warn(`⚠️ KV(${name}) 使用量取得失敗`, json.errors);
    return null;
  }

  const u = json.result;
  const percent = Math.round((u.storage?.list_usage ?? 0) / 1048576 / 1024 * 100); // KB → GB → %

  return {
    type: 'kv',
    name,
    percent,
    usage: u
  };
}

// ====================== 📢 共通処理（今はDiscord通知関連とタイムスタンプ作成） ======================

/**
 * Discord Webhookに整形済みメッセージを送信
 * @param {string} webhookUrl - Webhook URL
 * @param {string} message - 本文
 */
async function sendDiscordNotification(webhookUrl, message) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  });

  if (!res.ok) {
    console.warn(`⚠️ Discord通知失敗: ${res.status}`);
  }
}

/**
 * アラート内容をDiscord投稿用に成形
 * @param {Array} results - 使用率超過した項目の一覧
 * @param {string} time - JST時刻文字列
 */
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
             `📦 Storage: ${Math.round((u.storage?.list_usage ?? 0) / 1024)} KB / 1 GB（${r.percent}%）\n`;
    }
  }

  return msg;
}

/**
 * JST（日本時間）で現在の時刻を「YYYY/MM/DD H:mm:ss」形式で返す
 * 例: 2025/07/21 6:10:15
 */
function getFormattedJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, '0');
  const dd = String(jst.getDate()).padStart(2, '0');
  const h = jst.getHours();
  const mi = String(jst.getMinutes()).padStart(2, '0');
  const ss = String(jst.getSeconds()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${h}:${mi}:${ss}`;
}

// ====================== 🚀 メイン処理 ======================

const env = process.env;
const results = [];

const kvTargets = [
  { name: 'ffdev', namespaceId: '4ebfa42f89f7478888677c5486b6b540', token: env.KV_API_TOKEN_FFDEV },
  { name: 'ffprod', namespaceId: '9cc8cd1153a34a66a4e1bf313078664c', token: env.KV_API_TOKEN_FFPROD }
];

const run = async () => {
  for (const { name, namespaceId, token } of kvTargets) {
    const usage = await fetchKVUsage(name, namespaceId, token, env);
    if (usage?.percent >= 80) results.push(usage);
  }

  try {
    const supa = await getSupabaseWriteCount(env);
    if (supa.percent >= 80) results.push(supa);
  } catch (err) {
    console.warn("⚠️ Supabase 取得失敗:", err.message);
  }

  if (results.length > 0) {
    const time = getFormattedJST();
    const msg = createAlertMessage(results, time);
    await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, msg);
    throw new Error("❌ 使用量が80%を超えたため異常終了");
  } else {
    console.log("✅ 全使用量は正常範囲です（<80%）");
  }
};

run();
