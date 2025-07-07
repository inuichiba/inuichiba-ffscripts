// ffimages-compress-images.js
// ローカルで実行する画像変換バッチ(「LINEで確実に表示できる形式」に一括変換)
// ✅ 目的:
// ・PNG → Baseline JPEG (安全重視、場合により強圧縮)
// ・JPEG → 冒険圧縮（LINE互換の範囲で超最適化）
// ・入力: ffimages-compress/input
// ・出力: ffimages-compress/output/YYYYMMDD/
// ・安全・事故ゼロ・高速
// ・すべて自動、上書きなし、ログ強化

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
// node ffimages-compress-images.js	       → 通常モード（normal）で変換
// node ffimages-compress-images.js detail  → 詳細モード（detail）で変換、ファイル名に_detailつく

// ✅ 目的：
// ・ffimages-compress/input にある PNG を Baseline JPEG に変換
// ・ffimages-compress/output/20250515/ に日付フォルダを作って保存
// ・処理ログに元ファイルと変換後のサイズ・圧縮率を表示
// ・元ファイルは一切壊さない、安全設計
// ・すべて自動で、手動コピー不要
// -----------------------------------------

const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

// 🌟 実行モードを判定 (引数で detail 指定があれば高画質モード)
// 例： node ffimages-compress-images.js detail
const args = process.argv.slice(2);
let mode = "normal";

if (args.length > 0) {
  if (args[0] === "detail") {
    mode = "detail";
  } else if (args[0] !== "normal") {
    console.log(`⚠️ 未知のモード "${args[0]}" が指定されました。normalモードで実行します。`);
  }
}
console.log(`🚀 ffimages-compress-images.js 実行モード: ${mode}`);

// 🌟 ディレクトリパス定義
// 処理元 (絶対に安全な元データ保持場所)
const inputDir = path.join(__dirname, "ffimages-compress", "input");

// 処理先 (日付別にフォルダを自動作成)
// 今日の日付を取得 (例：20250515)
const now = new Date();
const yyyymmddhhmmss =
  now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  '-' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

// 出力先は以下のようになる
// ・Windows の場合   D:\nasubi\ffimages-compress\output\20250515-142359\ など
// ・Mac/Linax の場合 /Users/yourname/projectname/ffimages-compress/output/20250515-142359/ など
//   → path.join(__dirname, ...) で OSに応じて自動構成されるので変更不要です。
const outputDir = path.join(__dirname, "ffimages-compress", "output", yyyymmddhhmmss);

// 🌟 入力ディレクトリ存在確認
if (!fs.existsSync(inputDir)) {
  console.error(`❌ 入力ディレクトリが存在しません: ${inputDir}`);
  process.exit(1);
}

// 🌟 出力ディレクトリ作成 (なければ自動作成)
// 安全のため毎日フォルダを分けて保存
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ 出力ディレクトリを作成しました: ${outputDir}`);
}

// 🌟 ファイル取得 (png,jpg,jpegのみを対象)
fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error(`❌ フォルダ読み込みエラー: ${inputDir} - ${err.message}`);
    return;
  }

  files = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
  }).sort();


  // 🌟 ファイルごとに処理開始
  files.forEach((file) => {
    // 入力ファイルのパス
    const inputPath = path.join(inputDir, file);
    // ファイル名から拡張子除去
    const baseName = path.parse(file).name;
    // 出力ファイル名 (modeによって末尾に_detail追加)()
    // 出力ファイル名は常にjpgに変換（pngもjpgも同じ扱い）
    const outputFileName = mode === "detail" ? `${baseName}_detail.jpg` : `${baseName}.jpg`;
    // 出力パス
    const outputPath = path.join(outputDir, outputFileName);

    // 🌟 ここで拡張子判定
    const ext = path.extname(file).toLowerCase();
    const isPng = ext === ".png";
    const isJpeg = ext === ".jpg" || ext === ".jpeg";

    // 🌟 jpegもpngもsharpで読み込んでオブジェクト作成 (jpgmopngも共通で読めるように)
    const baseSharp = sharp(inputPath);

    let processingNote = "";

    // 🌟 モード別設定 (normal or detail)
    if (mode === "normal") {
      if (isPng) {
        // 🌟 PNGは透過を白背景化 (LINEでは必須)
        baseSharp.flatten({ background: { r: 255, g: 255, b: 255 } });

        // pngは安全重視(大容量PNGは65、高速圧縮)
        const inputSizeMB = fs.statSync(inputPath).size / 1024 / 1024;

        if (inputSizeMB > 1) {
          processingNote = `PNG(大容量 ${inputSizeMB.toFixed(2)}MB) → 安全＋強圧縮(65/4:4:4)`;
          baseSharp
				    // 画像のファイルサイズを合わせるときに使うと良い
				    // .resize({ width: 1200, withoutEnlargement: true })  // ★ 横幅を強制的に制限（1920→1200など）
            .resize({ fit: "inside", withoutEnlargement: true })  // オリジナルサイズ以下でリサイズ
            .jpeg({
              quality: 65,
              progressive: false,
              optimizeCoding: true,
              chromaSubsampling: "4:4:4"
            });
        } else {
            // PNG小容量
            processingNote = `PNG(小容量 ${inputSizeMB.toFixed(2)}MB) → 安全優先(85/4:4:4)`;
            baseSharp
              .resize({ fit: "inside", withoutEnlargement: true })
              .jpeg({
                quality: 85,
                progressive: false,
                optimizeCoding: true,
                chromaSubsampling: "4:4:4"
              });
        }

      } else if (isJpeg) {
        // JPEGは冒険圧縮(65/4:2:0)＋trellis等で超最適化
        processingNote = `JPEG → 冒険圧縮(65/4:2:0/trellis等)`;
        baseSharp
          .jpeg({
            quality: 65,
            progressive: false,
            optimizeCoding: true,
            trellisQuantisation: true,
            chromaSubsampling: "4:2:0",
            overshootDeringing: true,
            optimiseScans: true
          });
      }

    } else if (mode === "detail") {
      // 🌟 detailモードは高品質(90/4:4:4)、pngもjpegも同じ
      if (isPng) {
        baseSharp.flatten({ background: { r: 255, g: 255, b: 255 } });
      }

      processingNote = `${isPng ? "PNG" : isJpeg ? "JPEG" : "Unknown"} → 高画質(90/4:4:4/detailモード)`;
      baseSharp
        .resize({ width: 1920, withoutEnlargement: true }) // 横幅1920px固定
        .jpeg({
          quality: 90,
          progressive: false,
          optimizeCoding: true,
          chromaSubsampling: "4:4:4"
        });
    }

    // 🌟 保存とログは共通
    baseSharp
      .toFile(outputPath)
      .then(() => {
        // ファイルサイズを比較してログ表示
        const inputSize = fs.statSync(inputPath).size;
        const outputSize = fs.statSync(outputPath).size;
        const rate = ((outputSize / inputSize) * 100).toFixed(1);
        const sizeKB = (outputSize / 1024).toFixed(1);
        console.log(`✅ ${file} → ${outputFileName}（${sizeKB} KB, 圧縮率 ${rate}%）【${processingNote}】`);
      })
      .catch((err) => {
        console.error(`❌ 変換失敗: ${outputPath} - ${err.message}`);
      });
  });
});


