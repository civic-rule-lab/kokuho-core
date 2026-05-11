/**
 * cityCode 一次資料準拠の一括訂正スクリプト（POLICIES §10）
 *
 * registry/index.json と data/municipalities/{slug}/kokuho-*.json の
 * cityCode を、総務省一次資料スナップショットに合わせて訂正する。
 *
 * マッチングロジック（安全側）:
 *   1. (prefecture, cityName) で一次資料を逆引き
 *   2. 一致候補が **唯一** で、registry の cityCode と異なる場合 → 訂正候補
 *   3. 一致候補が複数（kamikawa: 神川 vs 上川 等の異字同読み等）→ 手動確認案件として記録
 *   4. 一致候補なし → 一次資料カバレッジ外 or registry に誤名称（要調査）
 *
 * 利用:
 *   node scripts/fix-citycodes.js                  # dry-run（デフォルト）
 *   node scripts/fix-citycodes.js --apply          # 実際に適用
 *   node scripts/fix-citycodes.js --report out.md  # markdown レポート保存
 *
 * 終了コード:
 *   0 — 完了（適用 or dry-run）
 *   1 — 致命エラー（一次資料不在等）
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const REFERENCE = path.join(ROOT, "data", "reference", "soumu-jichitai-codes.json");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const REPORT_IDX = argv.indexOf("--report");
const REPORT_PATH = REPORT_IDX >= 0 ? argv[REPORT_IDX + 1] : null;

if (!existsSync(REFERENCE)) {
  console.error(`❌ 一次資料 snapshot 不在: ${REFERENCE}`);
  process.exit(1);
}

const ref = JSON.parse(readFileSync(REFERENCE, "utf-8"));
const reg = JSON.parse(readFileSync(REGISTRY, "utf-8"));

// 一次資料: (prefecture, cityName) → code5 の逆引きマップ（多値対応）
const refByNamePref = new Map();
for (const e of ref.entries) {
  if (e.isPrefecture) continue;
  const key = `${e.prefecture}|${e.cityName}`;
  if (!refByNamePref.has(key)) refByNamePref.set(key, []);
  refByNamePref.get(key).push(e);
}

// 一次資料: code5 → entry
const refByCode = new Map();
for (const e of ref.entries) {
  if (!e.isPrefecture) refByCode.set(e.code5, e);
}

const partial = ref.partialCoverage === true;
const corrections = [];   // 機械的訂正候補
const ambiguous = [];     // 同名候補が複数（要手動）
const notFound = [];      // 一次資料カバレッジ外 or registry に誤名称
const fileUpdates = [];   // data/municipalities/{slug}/*.json も訂正必要なリスト

for (const m of reg.municipalities) {
  const code5 = String(m.cityCode).padStart(5, "0");
  const key = `${m.prefecture}|${m.cityName}`;
  const candidates = refByNamePref.get(key) || [];

  if (candidates.length === 0) {
    // 一次資料に存在しない（partial coverage 外 or cityName 不一致）
    notFound.push({ slug: m.citySlug, prefecture: m.prefecture, cityName: m.cityName, registryCode: code5 });
    continue;
  }

  if (candidates.length > 1) {
    // 同名・同県（合併分割等の異常）
    ambiguous.push({ slug: m.citySlug, prefecture: m.prefecture, cityName: m.cityName, registryCode: code5, candidates: candidates.map(c => c.code5) });
    continue;
  }

  const c = candidates[0];
  if (c.code5 !== code5) {
    // cityCode 不整合（訂正候補）
    corrections.push({
      slug: m.citySlug,
      prefecture: m.prefecture,
      cityName: m.cityName,
      oldCode: code5,
      newCode: c.code5,
      newCode6: c.code6,
    });
  }
}

// data/municipalities/{slug}/kokuho-*.json の cityCode 同期チェック
for (const cor of corrections) {
  // data/municipalities/ には slug 名のディレクトリがある（registry citySlug ベース）
  const dataDir = path.join(DATA_DIR, cor.slug);
  if (!existsSync(dataDir)) continue;
  for (const fn of readdirSync(dataDir)) {
    if (!fn.endsWith(".json")) continue;
    const fp = path.join(dataDir, fn);
    let d;
    try {
      d = JSON.parse(readFileSync(fp, "utf-8"));
    } catch { continue; }
    if (String(d.cityCode).padStart(5, "0") === cor.oldCode) {
      fileUpdates.push({ file: fp, oldCode: cor.oldCode, newCode: cor.newCode });
    }
  }
}

// ─── 出力 ────────────────────────────────────────────────────
const lines = [];
lines.push(`# cityCode 訂正レポート (POLICIES §10)`);
lines.push(``);
lines.push(`生成日時: ${new Date().toISOString()}`);
lines.push(`一次資料: ${ref.sourceTitle}`);
lines.push(`カバレッジ: ${partial ? `⚠️ partial (${ref.entries.length} エントリ)` : `✅ full (${ref.entries.length} エントリ)`}`);
lines.push(`モード: ${APPLY ? "🔧 APPLY（実適用）" : "🔍 DRY-RUN（プレビューのみ）"}`);
lines.push(``);
lines.push(`## サマリ`);
lines.push(``);
lines.push(`- 訂正候補（一意・自動適用可）: **${corrections.length} 件**`);
lines.push(`- 同名複数（手動確認）: ${ambiguous.length} 件`);
lines.push(`- 一次資料カバレッジ外: ${notFound.length} 件`);
lines.push(`- 訂正に伴う data file 更新: ${fileUpdates.length} 件`);
lines.push(``);
lines.push(`## 自動訂正候補（${corrections.length} 件）`);
lines.push(``);
lines.push(`| slug | 自治体 | 旧 cityCode | 新 cityCode | 6桁コード |`);
lines.push(`|---|---|---:|---:|---:|`);
for (const c of corrections) {
  lines.push(`| \`${c.slug}\` | ${c.prefecture}${c.cityName} | ${c.oldCode} | **${c.newCode}** | ${c.newCode6} |`);
}
lines.push(``);
if (ambiguous.length > 0) {
  lines.push(`## ⚠️ 同名複数（手動確認・自動適用しない）`);
  lines.push(``);
  for (const a of ambiguous) {
    lines.push(`- \`${a.slug}\` ${a.prefecture}${a.cityName} registry=${a.registryCode} candidates=${a.candidates.join(",")}`);
  }
  lines.push(``);
}
if (notFound.length > 0) {
  lines.push(`## ⏭️ 一次資料カバレッジ外（partial 中はスキップ）`);
  lines.push(``);
  lines.push(`計 ${notFound.length} 件（partial coverage モードでは正常）`);
  lines.push(``);
}
const report = lines.join("\n");

if (REPORT_PATH) {
  writeFileSync(REPORT_PATH, report, "utf-8");
  console.log(`レポート保存: ${REPORT_PATH}`);
}
console.log(report);

// ─── 適用 ────────────────────────────────────────────────────
if (APPLY) {
  if (corrections.length === 0) {
    console.log("✅ 適用すべき訂正なし。終了。");
    process.exit(0);
  }
  console.log("");
  console.log(`🔧 ${corrections.length} 件の registry 訂正 + ${fileUpdates.length} 件の data file 更新を適用中...`);

  // registry 更新
  const corMap = new Map(corrections.map(c => [`${c.prefecture}|${c.cityName}`, c.newCode]));
  let regUpdated = 0;
  for (const m of reg.municipalities) {
    const key = `${m.prefecture}|${m.cityName}`;
    const newCode = corMap.get(key);
    if (newCode && String(m.cityCode).padStart(5, "0") !== newCode) {
      m.cityCode = newCode;
      regUpdated++;
    }
  }
  writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + "\n", "utf-8");
  console.log(`  ✅ registry 訂正: ${regUpdated} 件`);

  // data file 更新
  let fileUpdated = 0;
  for (const u of fileUpdates) {
    const d = JSON.parse(readFileSync(u.file, "utf-8"));
    d.cityCode = u.newCode;
    writeFileSync(u.file, JSON.stringify(d, null, 2) + "\n", "utf-8");
    fileUpdated++;
  }
  console.log(`  ✅ data file 訂正: ${fileUpdated} 件`);
  console.log("");
  console.log("適用完了。validate-citycodes.js を再実行して確認してください。");
}
