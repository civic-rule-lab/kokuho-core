/**
 * 介護保険 都道府県スペックから一括生成
 *
 * data/kaigo-specs/{prefSlug}.js に記載した baseAmount 一覧を読み込み、
 * data/municipalities/{slug}/kaigo-{year}.json を生成する。
 *
 * 実行:
 *   node scripts/generate-kaigo-from-spec.js kanagawa          # 特定都道府県
 *   node scripts/generate-kaigo-from-spec.js kanagawa --year=2026
 *   node scripts/generate-kaigo-from-spec.js --all             # 全スペック一括
 *   node scripts/generate-kaigo-from-spec.js --dry-run kanagawa # 書き出し確認のみ
 *
 * スペックファイルの形式（data/kaigo-specs/{prefSlug}.js）:
 *   export const PREF_NAME = "神奈川県";
 *   export const MUNICIPALITIES = [
 *     { cityCode: "14100", citySlug: "yokohama", cityName: "横浜市",
 *       baseAmount: 74000, status: "verified",
 *       source: { url: "https://...", retrievedAt: "2026-04-30" } },
 *     ...
 *   ];
 *   // brackets を省略すると標準9段階（BRACKETS_STANDARD_9）を使う
 *   // export const BRACKETS = [...]; // 都道府県独自の段階定義
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.join(__dirname, "..");
const DATA_DIR    = path.join(ROOT, "data", "municipalities");
const SPECS_DIR   = path.join(ROOT, "data", "kaigo-specs");
const STD_SPEC    = path.join(SPECS_DIR, "brackets-standard-9.js");

const DRY_RUN     = process.argv.includes("--dry-run");
const ALL         = process.argv.includes("--all");
const YEAR_ARG    = process.argv.find(a => a.startsWith("--year="));
const YEAR        = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const PREF_ARGS   = process.argv.slice(2).filter(a => !a.startsWith("--"));

if (!ALL && PREF_ARGS.length === 0) {
  console.error("使い方: node generate-kaigo-from-spec.js <prefSlug> [--year=2026] [--dry-run]");
  console.error("        node generate-kaigo-from-spec.js --all");
  process.exit(1);
}

// ─── 標準段階定義を読み込む ────────────────────────────────────

const { BRACKETS_STANDARD_9 } = await import(pathToFileURL(STD_SPEC).href);

// ─── JSON ビルド ──────────────────────────────────────────────

function buildJson({ cityCode, citySlug, cityName, prefSlug, prefecture,
                     baseAmount, brackets, status, source, planPeriod, fiscalYear }) {
  return {
    cityCode,
    citySlug,
    cityName,
    prefSlug,
    prefecture,
    fiscalYear:    fiscalYear ?? YEAR,
    system:        "kaigo",
    schemaVersion: "1.0",
    planPeriod:    planPeriod ?? "第9期（2024-2026）",
    status:        status     ?? "needs_update",
    baseAmount:    baseAmount ?? null,
    // brackets が省略されていれば標準9段階を埋め込む
    brackets:      brackets   ?? BRACKETS_STANDARD_9,
    fallbackLevel: "5",
    source:        source     ?? { url: null, pageTitle: null, retrievedAt: null },
  };
}

// ─── 都道府県スペック処理 ─────────────────────────────────────

async function processSpec(prefSlug) {
  const specPath = path.join(SPECS_DIR, `${prefSlug}.js`);
  if (!existsSync(specPath)) {
    console.warn(`  ⚠️  スペックファイルが見つかりません: ${specPath}`);
    return { ok: 0, skipped: 0, err: 1 };
  }

  const spec = await import(pathToFileURL(specPath).href);
  const municipalities = spec.MUNICIPALITIES || [];
  const prefBrackets   = spec.BRACKETS || null;       // 都道府県独自の段階定義
  const prefName       = spec.PREF_NAME || prefSlug;
  const prefecture     = prefName;

  let ok = 0, skipped = 0, err = 0;

  for (const m of municipalities) {
    try {
      const dir     = path.join(DATA_DIR, m.citySlug);
      const outPath = path.join(dir, `kaigo-${YEAR}.json`);

      const json = buildJson({
        cityCode:   m.cityCode,
        citySlug:   m.citySlug,
        cityName:   m.cityName,
        prefSlug,
        prefecture,
        baseAmount: m.baseAmount,
        brackets:   m.brackets ?? prefBrackets,   // 自治体 > 都道府県 > 標準9段階
        status:     m.status,
        source:     m.source,
        planPeriod: m.planPeriod,
        fiscalYear: m.fiscalYear,
      });

      if (DRY_RUN) {
        console.log(`  [dry] ${m.citySlug}: baseAmount=${m.baseAmount ?? "null"} brackets=${json.brackets.length}段階`);
        ok++;
        continue;
      }

      mkdirSync(dir, { recursive: true });
      writeFileSync(outPath, JSON.stringify(json, null, 2) + "\n", "utf-8");
      console.log(`  ✅ ${m.citySlug} (${m.cityName}): ¥${(m.baseAmount ?? 0).toLocaleString()}/年`);
      ok++;
    } catch (e) {
      console.error(`  ❌ ${m.citySlug}: ${e.message}`);
      err++;
    }
  }
  return { ok, skipped, err };
}

// ─── 実行 ───────────────────────────────────────────────────

const targets = ALL
  ? readdirSync(SPECS_DIR)
      .filter(f => f.endsWith(".js") && f !== "brackets-standard-9.js")
      .map(f => f.replace(".js", ""))
  : PREF_ARGS;

let totalOk = 0, totalErr = 0;

for (const pref of targets) {
  console.log(`\n== ${pref} ==`);
  const { ok, err } = await processSpec(pref);
  totalOk  += ok;
  totalErr += err;
}

console.log(`\n${"─".repeat(50)}`);
console.log(`生成: ${totalOk} / エラー: ${totalErr}`);
if (DRY_RUN) console.log("（--dry-run モード: ファイルは書き出されていません）");
