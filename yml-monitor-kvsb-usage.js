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
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 修正：2階層上の inuichiba-ffworkers を参照
const kvUtilsPath = path.join(__dirname, "../../../inuichiba-ffworkers/src/lib/kvUtils.js");
console.log("📁 kvUtilsPath = ", kvUtilsPath); // ← 確認用ログ

const kvUtilsUrl = pathToFileURL(kvUtilsPath).href;

// ✅ file:// URL指定でインポート
const { addMonthCount, checkKVSum } = await import(kvUtilsUrl);


const envName = process.argv[2] || "ffprod"; // デフォルトはffprod

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

await checkKVSum(env);
