// lib/yml-supabase-utils.js

import fetch from "node-fetch";


// ✅ 日本時間のタイムスタンプ（先頭0なしのH形式）
// 例）2025/05/09 6:16:53
export function getFormattedJST() {
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




/**
 * 📊 Supabaseの月次書き込み件数(writeCount:YYYY-MM)を取得し、
 * 使用率が80%以上ならDiscordに警告通知を送信する
 * 件数はSupabaseのkv_itemsテーブルからREST API経由で取得している
 * writeCount:YYYY-MM の形式で保存されているカウント値を元に通知
 *
 * @param {Object} param0 - 実行環境とKV名の情報
 * @param {boolean} param0.isProd - trueならffprod、falseならffdev
 * @param {string} param0.kvName - KV名（例: usersKV_ffdev）
 * @returns {Promise<{status: string, count?: number, error?: string}>}
 */
export async function getSupabaseCountAndNotify({ isProd, kvName }) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  const month = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).replace("/", "-").replace(",", "");

  const key = `writeCount:${month}`;
  const url = `${SUPABASE_URL}/rest/v1/kv_items?select=value&key=eq.${key}`;

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const count = parseInt(json?.[0]?.value || "0", 10);
    const limit = 10000;
    const percentage = Math.floor((count / limit) * 100);

    if (percentage >= 80) {
      const envLabel = isProd ? "ffprod" : "ffdev";
      const now = getFormattedJST();
      const message = [
        `⚠️ Supabase書き込み件数が80%を超えました！（${now} JST）`,
        `【${envLabel}-${kvName}】`,
        `📊 件数: ${count} / ${limit}（${percentage}%）`,
      ].join("\n");

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
    }

    return { status: "ok", count };
  } catch (err) {
    console.error(`❌ [${kvName}] Supabase件数取得失敗:`, err.message);
    return { status: "error", error: err.message };
  }
}




/**
 * 📌 JSTの "YYYY-MM" を取得
 * @returns {string} e.g. "2025-07"
 */
export function getCurrentMonthKeyJST() {
  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const year = jstNow.getFullYear();
  const month = (jstNow.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}



/**
 * 📌 書き込み件数（writeCount:YYYY-MM）を取得
 * @param {Object} params
 * @param {string} params.accountId - Cloudflare アカウントID
 * @param {string} params.kvNamespaceId - KVネームスペースID
 * @param {string} params.apiToken - 認証トークン
 * @param {string} params.yyyymm - "YYYY-MM" 形式（指定しない場合はJST現在月）
 * @returns {Promise<{ ok: true, count: number } | { ok: false, error: string }>}
 *
 * 当関数は次のような用途を想定して「将来の再利用のために」用意されている補助関数
 * 手動 or 別のスクリプトから特定月の書き込み件数を確認したい場合
 *  ex. 今が7月として1か月前のデータがほしいとき、80%未満でも件数がほしいとき
 * const { ok, count, error } = await getSupabaseWriteCount("2025-06");
 * if (!ok) {
 *   console.error("件数取得失敗:", error);
 * } else {
 *   console.log("件数:", count);
 * }
 *
 */
export async function getSupabaseWriteCount(yyyymm) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const key = `writeCount:${yyyymm}`;
  const url = `${SUPABASE_URL}/rest/v1/kv_items?select=value&key=eq.${key}`;

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const count = parseInt(json?.[0]?.value || "0", 10);
    return { ok: true, count }; // ✅ 成功時はオブジェクトで返す

  } catch (err) {
    console.error(`❌ Supabase件数取得エラー（${yyyymm}）:`, err.message);
    return { ok: false, error: err.message }; // ✅ 失敗時もオブジェクトで返す
  }
}


