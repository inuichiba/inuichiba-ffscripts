// lib/kvUtils.js
import { getEnv } from "./env.js";
import { getFormattedJST } from "./saveUserInfo.js";


/**
 * ✅ UTC基準の日付文字列を "YYYY-MM-DD" で返す
 */
export function getUTCDateString() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // 例: 2025-07-24
}

/**
 * ✅ UTC基準のタイムスタンプを "YYYY-MM-DD HH:mm:ss" 形式で返す
 */
export function getUTCTimestamp() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}



/**
 * 📈 Supabase月次件数を加算し、しきい値を超えたらSupabase月次フラグと通知を設定(UTC基準）
 * @param {object} env - 環境変数
*/
export async function addMonthCount(env) {
  const { isProd, usersKV } = getEnv(env);
  // Supabase月次件数   → writeCount:ffprod:2025-07 形式(日時はUTC)
  const monthKey  = `writeCount:${isProd ? "ffprod" : "ffdev"}:${getUTCDateString().slice(0, 7)}`;
  // Supabase月次フラグ → supabase_flag:ffprod:2025-07 形式(日時はUTC)
  const sbFlagKey = `supabase_flag:${isProd ? "ffprod" : "ffdev"}:${getUTCDateString().slice(0, 7)}`;

  try {
    const currentValue = await usersKV.get(monthKey);
    const current = parseInt(currentValue || "0", 10);
    if (!isProd) console.log(`📈 KVのSupabase月次件数 取得: 件数=${current}, monthKey=${monthKey}`);
    const newCount = current + 1;
    await usersKV.put(monthKey, newCount.toString());
    if (isProd) {
      await usersKV.put(monthKey, newCount.toString());  // ffprodは永続保存
    } else {
      await usersKV.put(monthKey, newCount.toString(), { expirationTtl: 60 * 60 * 24 * 92 });  // ffdevは3ヶ月（92日間）保存
      console.log(`🔄 KVのSupabase月次件数 加算: 件数=${newCount}, monthKey=${monthKey}`);
    }
    // ✅ しきい値チェック（90,000件以上）
    if (newCount >= 90000 && current < 90000) { // ← しきい値（100,000件中90%）
      await usersKV.put(sbFlagKey, "threshold", { expirationTtl: 60 * 60 * 24 * 92 });  // 3ヶ月(92日間)保存
      // ffprodで出ることを案じているのでログは出す
      const envName = isProd ? "ffprod" : "ffdev";
      console.warn(`🚨 Supabase月次件数がしきい値を超えました → ${envName}のSupabase書き込みを停止します`);

      const message = `🚨 Supabase月次件数が90%を超過！\n件数=${newCount}, monthKey=${monthKey}\n📛 Supabase書き込みを停止します。`;
      notifyDiscord(env, message);  // Discordに通知する
    }

  } catch(err) {
    if (!isProd) console.warn(`⚠️ KVのSupabase月次件数 or しきい値 更新失敗: monthKey=${monthKey}`, err);
  }
}



/**
 * 📝 Supabase月次件数（ffprod + ffdev）を合算して90%超過したら
 *    ログと Discord に1回だけ通知する（100%通知なし）
 *    また、書き込み停止フラグを ffprod / ffdev 両方にセットする
 * @param {object} env - 環境変数
 */
export async function checkSbSum(env) {
  const { usersKV } = getEnv(env);
  const month = getUTCDateString().slice(0, 7);  // → "2025-07"
  const keyProd = `writeCount:ffprod:${month}`;
  const keyDev  = `writeCount:ffdev:${month}`;
  // Supabase月次フラグ → supabase_flag:ffprod:2025-07 形式(日時はUTC)
  const sbFlagKey_ffprod = `supabase_flag:ffprod:${month}`;
  const sbFlagKey_ffdev  = `supabase_flag:ffdev:${month}`;
  // この関数内で通知済かどうかを判断するのに使う
  const notifyFlag90 = `supabase_notify_sent:total90:${month}`;
  // SENTINEL：自分は存在するよの意味
  const KV_SENTINEL = "1";

  try {
    const prodvalue = await usersKV.get(keyProd);
    const prod = parseInt(prodvalue || "0", 10);
    const devvalue  = await usersKV.get(keyDev);
    const dev  = parseInt(devvalue || "0", 10);
    const total = prod + dev;

    if (total >= 90000) {
      const notified = await usersKV.get(notifyFlag90);
      if (!notified) {
        // ✅ 通知済フラグをセット（90日）
        await usersKV.put(notifyFlag90, KV_SENTINEL, { expirationTtl: 60 * 60 * 24 * 92 }); // 3ヶ月保存
        // ✅ 書き込み停止フラグもセット（同様に3ヶ月）
        await usersKV.put(sbFlagKey_ffprod, "threshold", { expirationTtl: 60 * 60 * 24 * 92 });
        await usersKV.put(sbFlagKey_ffdev,  "threshold", { expirationTtl: 60 * 60 * 24 * 92 });

        console.warn("🚨 Supabase月次件数が90%を超えました → 課金回避のためffprod/ffdev両方の書き込みを停止します。");
        const msg = `🚨 Supabase月次件数が90%を超過しました！\n` +
          `📝 ffprod: ${prod} 件  📝 ffdev: ${dev} 件\n` +
          `🔥 合計: ${total} / 100,000 件（月間上限）\n` +
          `✋ ffprod/ffdev 両方の書き込みを停止します（課金回避のため）。`;
        await notifyDiscord(env, msg, "total");
      }
    }

  } catch (err) {
    console.warn("⚠️ Supabase月次件数合算チェックに失敗", err);
  }
}




/**
 * 📌 KV日次読み取り件数をカウントし、しきい値(80%, 90%, 100%)でDiscord通知する
 * @param {object} env - 環境変数
*/
export async function incrementKVReadCount(env) {
  const { isProd, usersKV } = getEnv(env);
  // SENTINEL：自分は存在するよの意味
  const KV_SENTINEL = "1";

  const UTCDate = getUTCDateString(); // 例: "2025-07-29"
  // KV日次件数   → readCount:ffprod:2025-07-24 形式(日時はUTC)
  const todayKey = `readCount:${isProd ? "ffprod" : "ffdev"}:${UTCDate}`;

  // KV日次フラグ → kv_flag:ffprod:2025-07-24 形式(日時はUTC)
  const flagProd = `kv_flag:ffprod:${UTCDate}`;
  const flagDev  = `kv_flag:ffdev:${UTCDate}`;

  // この関数内でだけ内部的に使うフラグ
  const notifyFlag80  = `kv_notify_sent:total80:${UTCDate}`;
  const notifyFlag90  = `kv_notify_sent:total90:${UTCDate}`;
  const notifyFlag100 = `kv_notify_sent:total100:${UTCDate}`;

  const KV_DAILY_THRESHOLD = 80000;  // しきい値は 8万件（課金寸前）
  const KV_DAILY_EMERGENCY = 90000;  // 緊急事態は 9万件（無料枠は10万件）
  const KV_DAILY_LIMIT     = 100000; // 手遅れ（かっきーん）10万件以上

  try {
    // ✅ KV日次件数取得と計算(KV日次件数キーがなかったら0とする)
    const currentValue = await usersKV.get(todayKey);
    const current = parseInt(currentValue || "0", 10);
    if (!isProd) console.log(`📖 KV日次件数 取得: 件数=${current}, todaykey=${todayKey}`);

    // ✅ 加算した値を保存（TTLは3日間）
    const newCount = current + 1;
    await usersKV.put(todayKey, newCount.toString(), { expirationTtl: 60 * 60 * 24 * 3 }); // 3日間保存
    if (!isProd) console.log(`📚 KV日次件数 加算: 件数=${newCount}, todaykey=${todayKey}`);


    // 🚧 100%（手遅れ）→ 💸
    if (newCount >= KV_DAILY_LIMIT) {
      const notified = await usersKV.get(notifyFlag100);
      if (!notified) {
        await usersKV.put(notifyFlag100, KV_SENTINEL, { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagProd,      "threshold", { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagDev,       "threshold", { expirationTtl: 60 * 60 * 24 * 3 });

        // ffProdで出ることを案じているので、ログは出す
        console.warn(`🚨 KV日次件数が100%を超過しました → ${isProd ? "ffprod" : "ffdev"}課金フェーズです`);
        const message = `🚨 KV日次件数が100%を超過しました！\n💸 件数=${newCount}  🗝️ todayKey=${todayKey}\n` +
        `💸 2025年7月時点での課金額の例（Cloudflare Workers KV）：\n` +
        `   💸 Read 超過 … $0.50 / 百万件\n` +
        `   💸 Write 超過 … $5.00 / 百万件\n` +
        `   💸 Storage 超過 … $0.50 / GB・月\n` +
        `   💡 例）\n` +
        `      ・Read が10万件超過 → 約 $0.05 / 日\n` +
        `      ・Write が1,000件超過 → 約 $0.005 / 日\n` +
        `💸 従量課金制のため、超過数が増えるほど請求額も比例して増えていきます。`;      notifyDiscord(env, message);  // Discordに通知する
        await notifyDiscord(env, message);  // Discordに通知する
      }
      return; // 10万件を見てるんだから9万件を見る必要はない
    }


    // ✅ もう一度Discord通知：緊急フェーズ(90,000件/100,000件 /日)
    if (newCount >= KV_DAILY_EMERGENCY) {
      const notified = await usersKV.get(notifyFlag90);
      if (!notified) {
        await usersKV.put(notifyFlag90, KV_SENTINEL, { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagProd,     "threshold", { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagDev,      "threshold", { expirationTtl: 60 * 60 * 24 * 3 });

        // ffProdで出ることを案じているので、ログは出す
        console.warn(`🚨 KV日次件数が90%を超えました → ${isProd ? "ffprod" : "ffdev"}緊急フェーズです`);
        const message = `🚨 KV日次件数が90%を超過しました！\n🔥 件数=${newCount}  🗝️ todayKey=${todayKey}\n` +
              `🔥 このままではKV Reads上限（100,000件）に達して、Cloudflare Workersに課金が発生します。\n` +
              `🔥 最終手段として、LINE Developers の Webhook を手動で「OFF」にして通知そのものを止めることも検討できます。\n` +
              `🔥 ただしこの対応を行うと、メニュータップなどに一切応答しなくなります。\n` +
              `🔥 通常はおすすめしませんが、無課金維持を最優先する場合の緊急手段として検討してください。`;
        notifyDiscord(env, message);  // Discordに通知する
      }
      return; // 9万件を超えてるんだから8万件を見る必要はない
    }


    // ✅ もう一度Discord通知：警戒フェーズ(80,000件/100,000件 /日)
    if (newCount >= KV_DAILY_THRESHOLD) {
      const notified = await usersKV.get(notifyFlag80);
      if (!notified) {
        await usersKV.put(notifyFlag80, KV_SENTINEL, { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagProd,     "threshold", { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagDev,      "threshold", { expirationTtl: 60 * 60 * 24 * 3 });

        // ffProdで出ることを案じているので、ログは出す
        console.warn(`🚨 KV日次件数が80%を超過しました → ${isProd ? "ffprod" : "ffdev"}警戒フェーズです。congestedメッセージ表示モードに切り替えます`);
        const message = `🚨 KV日次件数が100%を超過しました！\n🟡 件数=${newCount}  🗝️ todayKey=${todayKey}\n` +
              `📈 Cloudflare Workers混雑モードを開始します。\n` +
              `📈 LINE Official Managerの「応答メッセージ」設定にあるQRコードメッセージの「利用」スイッチを、手動で「OFF」にしてください。`;
        notifyDiscord(env, message);  // Discordに通知する
      }
    }

  } catch (err) {
    if (!isProd) console.warn(`⚠️ KV日次Read加算 or しきい値 更新失敗: todayKey=${todayKey}`, err);
  }
}



/**
 * 📊 KV日次件数（Read）を ffprod + ffdev 合算でチェックし、
 * 80% / 90% を超えたら1日1回だけ通知し、両環境のフラグに "threshold" をセットする
 * 通知済みの判定には関数内だけで使う内部フラグ（"kv_notify_sent:total80/90:YYYY-MM-DD"）を使う
 *
 * @param {object} env - 環境変数（usersKV などを含む）
 */
export async function checkKVSum(env) {
  const { usersKV } = getEnv(env);
  const today = getUTCDateString();
  const keyProd = `readCount:ffprod:${today}`;
  const keyDev  = `readCount:ffdev:${today}`;
  // ✅ フラグを立てる対象（見る側は isProd に応じて自分の環境のものだけ確認すればOK）
  const flagProd = `kv_flag:ffprod:${today}`;
  const flagDev  = `kv_flag:ffdev:${today}`;

  // ✅ 通知済み確認用の内部フラグ（値は "1" で十分）
  const notifyFlag80 = `kv_notify_sent:total80:${today}`;
  const notifyFlag90 = `kv_notify_sent:total90:${today}`;
  // SENTINEL：自分は存在するよの意味
  const KV_SENTINEL = "1";

  try {
    const prodvalue = await usersKV.get(keyProd);
    const prod  = parseInt(prodvalue || "0", 10);
    const devvalue  = await usersKV.get(keyDev);
    const dev   = parseInt(devvalue  || "0", 10);
    const total = prod + dev;

    // 🚨 90%超えの確認が先（初回のみ通知）
    if (total >= 90000) {
      const notified = await usersKV.get(notifyFlag90);
      if (!notified) {
        await usersKV.put(notifyFlag90,   KV_SENTINEL, { expirationTtl: 60 * 60 * 24 * 3 });

        // ffProdで出ることを案じているので、ログは出す
        console.warn("🚨 KV日次件数(Read)のffprodとffdevとの合算が90%を超過しました → 禁忌フェーズです。Webhookの停止による完全遮断も検討してください");
        const msg = `🚨 KV日次件数(Read)のffprodとffdevとの合算が90%を超過しました！（要対応）\n` +
          `📦 ffprod: ${prod} 件  📦 ffdev: ${dev} 件\n` +
          `🔥 合計: ${total} / 100,000 件（上限）\n` +
          `🔥 このままだとKVが停止される(その上で課金される)可能性があります。\n` +
          `🔥 LINE Developers の Webhook を手動で「OFF」にするなどの対策も検討してください。\n` +
          `🔥 ただしこの対応を行うと、メニュータップなどに一切応答しなくなります。`;
        await notifyDiscord(env, msg, "total");
      }
      return; // ✅ 90%超過してたら80%通知はもう意味がないので終了
    }

    // 🚨 80%超え（初回のみ通知）
    if (total >= 80000) {
      const notified = await usersKV.get(notifyFlag80);
      if (!notified) {
        await usersKV.put(notifyFlag80, KV_SENTINEL, { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagProd,     "threshold", { expirationTtl: 60 * 60 * 24 * 3 });
        await usersKV.put(flagDev,      "threshold", { expirationTtl: 60 * 60 * 24 * 3 });

        // ffProdで出ることを案じているので、ログは出す
        console.warn("🚨 KV日次件数(Read)のffprodとffdevとの合算が80%を超過しました → 警戒フェーズです。congestedメッセージ表示モードに切り替えます");
        const msg = `🚨 KV日次件数(Read)のffprodとffdevとの合算が80%を超過しました！\n` +
          `📦 ffprod: ${prod} 件  📦 ffdev: ${dev} 件\n` +
          `📊 合計: ${total} / 100,000 件（上限）`;
          `📊 Cloudflare Workers混雑モードを開始します。\n` +
          `📊 LINE Official Managerの「応答メッセージ」設定にあるQRコードメッセージの「利用」スイッチを、手動で「OFF」にしてください。`;
        await notifyDiscord(env, msg, "total");
      }
    }

  } catch (err) {
    console.warn("⚠️ 合算KV日次件数チェックに失敗", err);
  }
}




/**
 * ✅ Discord通知を行う（UTC＋JSTタイムスタンプ付き）
 * @param {object} env
 * @param {string} message
 */
export async function notifyDiscord(env, message, label = null) {
  const { isProd, discordWebhookUrl } = getEnv(env);

  if (!discordWebhookUrl) {
    if (!isProd) console.warn("⚠️ DISCORD_WEBHOOK_URL が未設定です");
    return;
  }

  const title =
    label === "total" ? "⚠️ 【ffprod/ffdev合算】" :
      isProd ? "⚠️ 【inuichiba-ffworkers-ffprod】" : "⚠️ 【inuichiba-ffworkers-ffdev】";

  const utc = getUTCTimestamp();
  const jst = getFormattedJST();
  const fullMessage = `${title}\n🕒 UTC: ${utc}\n🕘 JST: ${jst}\n${message}`;

  try {
    const payload = { content: fullMessage };
    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!isProd) console.log("✅ Discord通知送信成功");

  } catch (err) {
    if (!isProd) console.warn("⚠️ Discord通知失敗:", err);
  }
}




/**
 * 🚦 混雑状態かどうかをチェックして、混雑なら true、混雑してないなら false を返す
 * @param {Object} env - 環境変数（KVなどを含む）
 * @returns {boolean} - 混雑中なら true、通常時は false
 */
export async function isCongested(env) {
  const { isProd, usersKV } = getEnv(env);
  const today = getUTCDateString();
  const kvFlagKey    = `kv_flag:${isProd ? "ffprod" : "ffdev"}:${today}`;  // KV日次フラグ

  try {
    const kvFlag   = await usersKV.get(kvFlagKey);
    // getしたけどindex.jsで加算するからここではKV日次件数を加算しない

    // フラグがない or あっても値が threshold 以外 であれば混雑していない
    return kvFlag === "threshold";

  } catch(err) {
    if (!isProd) console.warn("⚠️ KV日次フラグの読み込みに失敗しました", err);
    return true; // エラー時は「混雑中」とみなす
  }
}

