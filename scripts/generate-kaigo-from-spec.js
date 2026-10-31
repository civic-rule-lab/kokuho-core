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
 *   // brackets は自治体ごと（m.brackets）か都道府県共通（BRACKETS）で必ず入れる。どちらも無ければその自治体はエラーで止める
 *   //   （2026-10-31 全方向試算 C109。旧は brackets-standard-9.js＝第8期までの9段階形を黙って使い、
 *   //    第9期の標準13段階（介護保険法施行令 第38条）と違う段階表を書き出していた。既存ファイルも status を見ずに上書きする）
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
const FORCE       = process.argv.includes("--force");   // 検証済み・推定のファイルも上書きする
const YEAR_ARG    = process.argv.find(a => a.startsWith("--year="));
const YEAR        = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const PREF_ARGS   = process.argv.slice(2).filter(a => !a.startsWith("--"));

if (!ALL && PREF_ARGS.length === 0) {
  console.error("使い方: node generate-kaigo-from-spec.js <prefSlug> [--year=2026] [--dry-run]");
  console.error("        node generate-kaigo-from-spec.js --all");
  process.exit(1);
}


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
    brackets,
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

      // 検証済み・推定のファイルは上書きしない（自治体の段階表を手で入れたもの。2026-10-31 全方向試算 C109）。
      //   上書きしたいときは --force を付ける
      if (!FORCE && existsSync(outPath)) {
        let cur = null;
        try { cur = JSON.parse(readFileSync(outPath, 'utf-8')); } catch (_) { cur = null; }
        if (cur && (cur.status === 'verified' || cur.status === 'inferred')) { skipped++; continue; }
      }

      const brackets = m.brackets ?? prefBrackets;
      if (!Array.isArray(brackets) || brackets.length === 0) {
        throw new Error('段階表がありません（自治体の条例・公表資料から brackets を入れてください。第8期の9段階の雛形はもう使いません）');
      }
      const json = buildJson({
        cityCode:   m.cityCode,
        citySlug:   m.citySlug,
        cityName:   m.cityName,
        prefSlug,
        prefecture,
        baseAmount: m.baseAmount,
        brackets,                                 // 自治体 > 都道府県（雛形へのフォールバックはしない）
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
