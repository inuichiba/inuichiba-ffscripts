// lib/yml-supabase-utils.js

import fetch from "node-fetch";
import { getFormattedJST } from "./getFormattedJST.js";


const getFormattedJST = () => {
  const jst = new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Tokyo",
    hour12: false,
  });
  return jst.replace(" ", " ⏰ ");
};


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
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const year = jst.getFullYear();
  const month = (jst.getMonth() + 1).toString().padStart(2, "0");
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
 */
export async function getSupabaseWriteCount({ accountId, kvNamespaceId, apiToken, yyyymm }) {
  const key = `writeCount:${yyyymm || getCurrentMonthKeyJST()}`;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/${key}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  });

  const status = res.status;
  const text = await res.text();

  if (status === 404) {
    return { ok: false, error: "キーが見つかりません（404）" };
  }

  if (!res.ok) {
    try {
      const err = JSON.parse(text);
      return { ok: false, error: err?.errors?.[0]?.message || res.statusText };
    } catch {
      return { ok: false, error: res.statusText };
    }
  }

  const count = parseInt(text, 10);
  if (isNaN(count)) {
    return { ok: false, error: "値が数値ではありません" };
  }

  return { ok: true, count };
}



// ✅ Supabaseの月次書き込み件数を確認し、80%を超えた場合Discordに通知する
// ※ KVキー名は writeCount:YYYY-MM 形式で保存されている前提
/**
 * Supabaseの月次書き込み件数を取得し、80%超過ならDiscordに通知する
 * @param {object} options
 * @param {boolean} options.isProd - 本番環境かどうか
 * @param {string} options.kvName - KV名（通知表示用）
 * @returns {Promise<{status: 'ok', count?: number} | {status: 'error', error: string}>}
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
