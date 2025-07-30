/**
 * 📊 Cloudflare Workers KV および Supabase の使用状況を監視し、
 * 各しきい値（80% / 90% / 100%）を超えた場合に Discord へ通知します。
 *
 * ✅ KV:
 *    - readCount:{env}:{YYYY-MM-DD} を合算し、日次使用量を監視
 *    - 80%/90%/100% を超えたら1日1回のみ通知（フラグで制御）
 *    - 自環境の KV に混雑フラグ (kv_flag:{env}:YYYY-MM-DD) をセット
 *
 * ✅ Supabase:
 *    - writeCount:{env}:{YYYY-MM} を合算し、月次使用量を監視
 *    - 90% を超えたら1回のみ通知し、ffprod/ffdev 両方の Supabase書き込みを停止
 *
 * 💡 GitHub Actions から ffprod / ffdev それぞれで定期実行されることを想定
 */

import path from "path";
import { pathToFileURL } from "url";
import { fileURLToPath } from "url";

// __dirname を ESMで再定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ kvUtils.js のコピー先（ffscripts配下）
const kvUtilsPath = path.join(__dirname, "./kvUtils.js");
console.log("📁 kvUtilsPath =", kvUtilsPath);

// ESMとしてインポート
const kvUtilsUrl = pathToFileURL(kvUtilsPath).href;
const { addMonthCount, checkKVSum } = await import(kvUtilsUrl);

// 引数から環境を取得（デフォルト: ffprod）
const envName = process.argv[2] || "ffprod";
const env = {
  isProd: envName === "ffprod",
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
  CF_API_TOKEN: envName === "ffprod"
    ? process.env.CF_API_TOKEN_FFPROD
    : process.env.CF_API_TOKEN_FFDEV,
  USERS_KV_NAMESPACE_ID: envName === "ffprod"
    ? process.env.USERS_KV_NAMESPACE_ID_FFPROD
    : process.env.USERS_KV_NAMESPACE_ID_FFDEV,
};

// ✅ env を使うのは定義のあと！KVの合計チェック実行
await checkKVSum(env);
