/**
 * cityCode 一次資料準拠検証スクリプト（POLICIES §10）
 *
 * registry/index.json および data/municipalities/{slug}/kokuho-*.json の
 * cityCode を、総務省『全国地方公共団体コード』（data/reference/soumu-jichitai-codes.json）
 * と照合する。
 *
 * 検証ルール:
 *   - snapshot に存在するエントリ: cityCode + cityName 完全照合、不一致は ERROR
 *   - snapshot に存在しないエントリ: partialCoverage:true の間は WARNING のみ
 *   - cityName 不一致だが cityCode が一致: WARNING（旧名・略称・新字旧字の可能性）
 *
 * 利用形態:
 *   (a) 単独実行: node scripts/validate-citycodes.js
 *   (b) import: import { validateCityCode } from "./validate-citycodes.js"
 *
 * 終了コード:
 *   0 — 一次資料との不一致なし（warning は許容）
 *   1 — ERROR レベルの不一致あり
 *   2 — 環境エラー（reference 不在等）
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const REFERENCE = path.join(ROOT, "data", "reference", "soumu-jichitai-codes.json");

if (!existsSync(REFERENCE)) {
  console.error(`❌ 一次資料スナップショット不在: ${REFERENCE}`);
  console.error(`   data/reference/README.md の手順で総務省 .xls を取得・パースしてから再実行してください。`);
  process.exit(2);
}

const refData = JSON.parse(readFileSync(REFERENCE, "utf-8"));
const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

// reference を cityCode → entry のマップ化（5桁 + 6桁両対応）
const refByCode5 = new Map();
const refByCode6 = new Map();
for (const e of refData.entries) {
  if (e.code5) refByCode5.set(String(e.code5), e);
  if (e.code6) refByCode6.set(String(e.code6), e);
}

const partial = refData.partialCoverage === true;

/**
 * 単一エントリの検証
 * @returns {{ level: "OK"|"WARNING"|"ERROR", reason: string, expected?: object, actual?: object }}
 */
export function validateCityCode(cityCode, cityName, prefecture) {
  const codeStr = String(cityCode).padStart(5, "0");
  const ref = refByCode5.get(codeStr) || refByCode5.get(String(cityCode));

  if (!ref) {
    return partial
      ? { level: "WARNING", reason: `cityCode="${cityCode}" は partial snapshot のカバレッジ外、検証スキップ` }
      : { level: "ERROR", reason: `cityCode="${cityCode}" は総務省一次資料に存在しない` };
  }

  // cityName 照合
  if (cityName && ref.cityName && cityName !== ref.cityName) {
    return {
      level: "WARNING",
      reason: `cityCode="${cityCode}" の cityName 不一致: registry="${cityName}" vs 総務省="${ref.cityName}"`,
      expected: ref,
      actual: { cityCode, cityName, prefecture },
    };
  }

  // prefecture 照合（任意）
  if (prefecture && ref.prefecture && prefecture !== ref.prefecture) {
    return {
      level: "WARNING",
      reason: `cityCode="${cityCode}" の prefecture 不一致: registry="${prefecture}" vs 総務省="${ref.prefecture}"`,
      expected: ref,
      actual: { cityCode, cityName, prefecture },
    };
  }

  return { level: "OK", reason: `cityCode="${cityCode}" 一次資料と一致 (${ref.prefecture}${ref.cityName})` };
}

// ─── 全 registry を一括検証 ───────────────────────────────────
let errors = 0;
let warnings = 0;
let oks = 0;
let skipped = 0;

console.log(`一次資料: ${refData.sourceTitle}`);
console.log(`カバレッジ: ${partial ? "⚠️  partial" : "✅ full"}（${refData.entries.length} エントリ）`);
console.log("");

for (const m of registry.municipalities) {
  const r = validateCityCode(m.cityCode, m.cityName, m.prefecture);

  if (r.level === "ERROR") {
    console.log(`❌ ${m.prefecture} ${m.cityName} (${m.cityCode}, slug=${m.citySlug}): ${r.reason}`);
    if (r.expected) {
      console.log(`     一次資料: ${r.expected.prefecture}${r.expected.cityName} (cityCode=${r.expected.code5})`);
    }
    errors++;
  } else if (r.level === "WARNING") {
    if (r.expected) {
      // cityName/prefecture 不一致は表示
      console.log(`⚠️  ${m.prefecture} ${m.cityName} (${m.cityCode}, slug=${m.citySlug}): ${r.reason}`);
      warnings++;
    } else {
      // partial coverage によるスキップ
      skipped++;
    }
  } else {
    oks++;
  }
}

console.log("");
console.log(`━━━ 検証結果 ━━━`);
console.log(`  ✅ 一致:        ${oks}`);
console.log(`  ⚠️  警告:        ${warnings}`);
console.log(`  ⏭️  スキップ:     ${skipped}（partial coverage 外）`);
console.log(`  ❌ ERROR:       ${errors}`);

if (partial) {
  console.log("");
  console.log("📌 partial coverage モード：一次資料が完全でないため block しない警告レベル止まり。");
  console.log("   data/reference/README.md の手順で総務省 .xls 完全版を取得後、validate を再実行してください。");
}

if (errors > 0) {
  process.exit(1);
}
process.exit(0);
