// yml-supabase-writecount.js
import { getSupabaseCountAndNotify } from "./lib/yml-supabase-utils.js";

const main = async () => {
  const results = [];

  // ✅ ffdev
  const resDev = await getSupabaseCountAndNotify({
    isProd: false,
    kvName: "usersKV_ffdev",
  });
  results.push(resDev);

  // ✅ ffprod
  const resProd = await getSupabaseCountAndNotify({
    isProd: true,
    kvName: "usersKV_ffprod",
  });
  results.push(resProd);

  const hasFailures = results.some((r) => r.status === "error");
  if (hasFailures) {
    console.error("❌ エラーが発生しました。exit 1で異常終了します。");
    process.exit(1);
  }

  console.log("✅ Supabase件数チェックは正常に終了しました");
};

main();
