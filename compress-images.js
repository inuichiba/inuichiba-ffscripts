// compress-images.js (新: compress-images.js 拡張版)
// ✅ 画像圧縮(Cloudflare Pages向け) + Base64 JSファイル生成（Cloudflare Workers 向け）
// ローカルで実行する画像変換バッチ
// → 「LINEで確実に表示できる形式」に一括変換
// → その後、パラメータbase64があれば画像をBase64に変換する(メニュー画像用)

// ✅ 目的:
// ・PNG → Baseline JPEG (安全重視、場合により強圧縮)
// ・JPEG → 冒険圧縮（LINE互換の範囲で超最適化）
// ・入力: ffimages-compress/input
// ・出力: ffimages-compress/output/YYYYMMDD/
// ・安全・事故ゼロ・高速
// ・すべて自動、上書きなし、ログ強化
// ・変換終了後、Baseパラメータがあれば、画像をBase64に変換して画像名.jsに格納する

//   - pngを、Cloudinary 等と同等のLINE上表示体系JPEGに変換
//   - 全ファイルBaseline JPEG/最小メタ/RGBに
//   - ffimages-compress/input → ffimages-compress/output へ格納
//   - 注意：必ずinputとoutputは分ける。間違えて混ぜると事故になる
//   = jpegをinputに入れると、冒険大圧縮をして格納してくれる

// ✅ 画像変換の主な仕様（CDN級）
//  progressive: false ＝ Baseline JPEG（LINE互換）
//  chromaSubsampling: "4:4:4" ＝ 高品質維持
//  optimizeCoding: true ＝ 効率的なエンコーディング
//  flatten で透過PNG → 白背景に変換

// ✅ 前提の前提(Node.jsのバージョンを確認：最低14以上、できれば16以上)
// node -v
//
// ✅ 前提(sharpをインストールする)
// npm install sharp
//
// 確認方法
// node -e "require('sharp'); console.log('✅ sharp 読み込み成功！')"
//
// 💻 macOSユーザー向け補足
// sharpのインストールにはXcodeのCommand Line Toolsが必要な場合があります:
// xcode-select --install
//
// ※sharp の動作はMac/Linuxでも基本的に同じです。
// ただし libvips が正しく組み込まれていないと失敗することがあります。
// その場合、エラーメッセージが出るので以下で対応できます。
// npm rebuild sharp


// ✅ 実行方法
// node compress-images.js	              → 通常(高圧縮)モード（normal）で変換
// node compress-images.js detail         → 詳細モード（detail）で変換、ファイル名に_detailつく
// node compress-images.js base64         → 通常モードで変換後、Base64に変換して画像名.jsで格納する
// node compress-images.js detail base64  → 詳細モードで変換後、base64に変換して画像名.jsにして格納する

// ✅ 目的：
// ・compress/input にある PNG を Baseline JPEG に変換
// ・compress/output/20250515/ に日付フォルダを作って保存
// ・処理ログに元ファイルと変換後のサイズ・圧縮率を表示
// ・元ファイルは一切壊さない、安全設計
// ・すべて自動で、手動コピー不要
// ・画像をBase64に変換して.jsに格納する

// ✅ 画像の配置
// input: compress/input/ 変換したい画像を入れる
// output: compress/output/YYYYMMDD-HHmmss/ 変換した画像が入る
// base64: compress/base64/menuImageX.js 変換した画像を更にbase64 jsに変換して格納する
// -----------------------------------------

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

// 📍 __dirname をESMで再現するための処理（Node.js標準では __dirname は使えない）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌟 モード判定（引数に "detail" や "base64" が含まれていれば各モードに）
const args = process.argv.slice(2);
let mode = "normal";
if (args.includes("detail")) mode = "detail";
const generateBase64 = args.includes("base64");

console.log(`\n🚀 compress-images.js 実行モード: ${mode} / base64: ${generateBase64}\n`);

// 🌟 入出力パス定義
const inputDir = path.join(__dirname, "compress", "input");     // 処理元(入力画像ディレクトリ)
const base64Dir = path.join(__dirname, "compress", "base64");   // Base64 JS出力先
const timestamp = new Date().toISOString().replace(/[-T:]/g, "").slice(0, 13); // 例: 20250708-1030

// 出力先は以下のようになる
// ・Windows の場合   D:\nasubi\inuichiba-ffscripts\compress\output\20250515-142359\ など
// ・Mac/Linax の場合 /Users/yourname/projectname/inuichiba-ffscripts/compress/output/20250515-142359/ など
//   → path.join(__dirname, ...) で OSに応じて自動構成されるので変更不要です。
const outputDir = path.join(__dirname, "compress", "output", timestamp);

// 🌟 出力ディレクトリ作成 (なければ自動作成)
// 安全のため毎日フォルダを分けて保存
[outputDir].concat(generateBase64 ? [base64Dir] : []).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 ディレクトリ作成: ${dir}`);
  }
});

// 📄 入力ディレクトリからPNG/JPGファイルを抽出
const files = fs.readdirSync(inputDir).filter(f => /\.(png|jpe?g)$/i.test(f)).sort();


// 🌟 ファイルごとに処理開始
for (const file of files) {
    // 入力ファイルの絶対パス
    const inputPath = path.join(inputDir, file);
    // ファイル名から拡張子除去
    const baseName = path.parse(file).name;
    // 出力ファイル名 (modeによって末尾に_detail追加)()
    // 出力ファイル名は常にjpgに変換（pngもjpgも同じ扱い）
    const outputFileName = mode === "detail" ? `${baseName}_detail.jpg` : `${baseName}.jpg`;
    // 出力パス
    const outputPath = path.join(outputDir, outputFileName);    // 出力画像ファイルの保存先
    const base64Path = path.join(base64Dir, `${baseName}.js`);  // 主強くBase64コードJSファイルの保存先

    // 🌟 ここで拡張子判定
    const ext = path.extname(file).toLowerCase();   // 拡張子(小文字)
    const isPng = ext === ".png";                   // png判定

    // 🌟 jpegもpngもsharpで読み込んでオブジェクト作成 (jpgもpngも共通で読めるように)
    const baseSharp = sharp(inputPath);
    // 🌟 PNGは透過を白背景化 (LINEでは必須)
    if (isPng) baseSharp.flatten({ background: { r: 255, g: 255, b: 255 } });


  // 🎨 画質・圧縮オプションの設定（mode と 拡張子によって分岐）
  baseSharp
  // ★重要：コメント消さない！画像のファイルサイズを合わせるときに使うと良い
	//.resize({ width: 1200, withoutEnlargement: true })             // ★重要：横幅を強制的に制限（1920→1200などLINEに使いやすい幅）
  //.resize({ fit: "inside", withoutEnlargement: true })           // 原寸以下でリサイズ（オーバー時無拡大）
    .jpeg({
      quality: mode === "detail" ? 80 : isPng ? 50 : 65,            // detailなら高画質、pngは安全重視、jpgは冒険圧縮
      progressive: false,                                           // Baseline JPEG に限定（LINE互換）
      optimizeCoding: true,                                         // JPEGコーディング最適化
      chromaSubsampling: mode === "detail" ? "4:4:4" : isPng ? "4:4:4" : "4:2:0", // 色差サブサンプリング設定
      trellisQuantisation: !isPng && mode === "normal",            // JPEG専用: 圧縮最適化（Normal時のみ）
      overshootDeringing: !isPng && mode === "normal",             // JPEG専用: シャープ処理後の調整（Normal時のみ）
      optimiseScans: !isPng && mode === "normal"                    // JPEG専用: スキャン順序の最適化（Normal時のみ）
    })
    .toBuffer()                                                     // 🔄 バッファに出力（ファイル保存とBase64兼用）
    .then(buffer => {
      // 💾 出力画像ファイルとして保存
      fs.writeFileSync(outputPath, buffer);

      // 🔤 Base64文字列に変換してJS形式に出力（--base64指定時のみ）
      if (generateBase64) {
        const base64 = buffer.toString("base64");
        const exportJs = `// ${baseName}.js\nexport const imageBuffer = Buffer.from(\"${base64}\", \"base64\");\n`;
        fs.writeFileSync(base64Path, exportJs);
      }

      // 📊 圧縮率ログ表示
      const inputSize = fs.statSync(inputPath).size;
      const outputSize = buffer.length;
      const rate = ((outputSize / inputSize) * 100).toFixed(1);
      console.log(`✅ ${file} → ${outputFileName} (${(outputSize / 1024).toFixed(1)} KB, 圧縮率 ${rate}%)`);
    })
    .catch(err => {
      // ⚠️ エラーハンドリング
      console.error(`❌ 変換失敗: ${file} - ${err.message}`);
    });
}

