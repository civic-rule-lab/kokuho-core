/**
 * 後期高齢者医療 都道府県スペックから一括生成
 *
 * data/kouki-specs/{prefSlug}.js の料率（都道府県均一）を読み込み、
 * registry/index.json の全自治体に対して
 * data/municipalities/{slug}/kouki-{year}.json を生成する。
 *
 * 後期高齢者医療は広域連合（都道府県）単位で料率が均一なので、
 * 介護(generate-kaigo-from-spec.js)と違い自治体ごとの値は持たず、
 * 県スペックの料率を当該県の全自治体へ展開する（registry 駆動）。
 *
 * 実行:
 *   node scripts/generate-kouki-from-spec.js hokkaido           # 特定都道府県
 *   node scripts/generate-kouki-from-spec.js --all              # 全県一括
 *   node scripts/generate-kouki-from-spec.js --all --dry-run    # 書き出し確認のみ
 *   node scripts/generate-kouki-from-spec.js --all --year=2026
 *
 * スペック形式（data/kouki-specs/{prefSlug}.js）:
 *   export const PREF_NAME, PREF_SLUG, STATUS, SOURCE;
 *   export const KOUKI = { perCapita:{medical,childcare}, rate:{medical,childcare}, incomeReduction };
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const DATA_DIR  = path.join(ROOT, "data", "municipalities");
const SPECS_DIR = path.join(ROOT, "data", "kouki-specs");
const REGISTRY  = path.join(ROOT, "registry", "index.json");

const DRY_RUN  = process.argv.includes("--dry-run");
const ALL      = process.argv.includes("--all");
const YEAR_ARG = process.argv.find(a => a.startsWith("--year="));
const YEAR     = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const PREF_ARGS= process.argv.slice(2).filter(a => !a.startsWith("--"));

if (!ALL && PREF_ARGS.length === 0) {
  console.error("使い方: node generate-kouki-from-spec.js <prefSlug> [--year=2026] [--dry-run]");
  console.error("        node generate-kouki-from-spec.js --all");
  process.exit(1);
}

// 全国一律パラメータ（令和8・9年度。全47広域連合で同値）
//   医療7割軽減=7.2割(0.72)・子7割(0.70)、5割/2割の被保険者数加算31万/57万、
//   給与年金所得者2人以上で10万×(n-1)加算、賦課限度額 医療85万/子2.1万、基礎控除43万。
const NATIONAL_UNIFORM = {
  basicDeduction: 430000,
  caps: { medical: 850000, childcare: 21000 },
  reduction: {
    base: 430000, perEarnerAdd: 100000, fivePerInsured: 310000, twoPerInsured: 570000,
    ratios: {
      seven: { medical: 0.72, childcare: 0.70 },
      five:  { medical: 0.50, childcare: 0.50 },
      two:   { medical: 0.20, childcare: 0.20 },
    },
  },
};

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
// prefectureSlug → 自治体配列
const byPref = {};
for (const m of registry.municipalities) {
  const ps = m.prefectureSlug;
  (byPref[ps] = byPref[ps] || []).push(m);
}

function buildJson(m, spec, prefSlug) {
  return {
    cityCode:      m.cityCode,
    citySlug:      m.citySlug,
    cityName:      m.cityName,
    prefSlug,
    prefecture:    spec.PREF_NAME,
    fiscalYear:    YEAR,
    system:        "kouki",
    schemaVersion: "1.0",
    status:        spec.STATUS ?? "needs_update",
    basicDeduction: NATIONAL_UNIFORM.basicDeduction,
    perCapita:     spec.KOUKI.perCapita,
    rate:          spec.KOUKI.rate,
    caps:          NATIONAL_UNIFORM.caps,
    reduction:     NATIONAL_UNIFORM.reduction,
    incomeReduction: spec.KOUKI.incomeReduction ?? null,
    publicNote:    spec.PUBLIC_NOTE ?? null,
    source:        spec.SOURCE,
    notes:         "医療分・子ども分の均等割/所得割は厚労省公式PDF(全47一覧)から。7.2割軽減・限度額85万/2.1万・しきい値31万/57万は全国一律。所得割独自軽減は東京のみ、不均一賦課は全国なし。",
  };
}

async function processPref(prefSlug) {
  const specPath = path.join(SPECS_DIR, `${prefSlug}.js`);
  if (!existsSync(specPath)) {
    console.warn(`  ⚠️  スペックなし: ${specPath}`);
    return { ok: 0, err: 1 };
  }
  const spec = await import(pathToFileURL(specPath).href);
  const munis = byPref[prefSlug] || [];
  if (munis.length === 0) console.warn(`  ⚠️  registryに ${prefSlug} の自治体なし`);

  let ok = 0, err = 0;
  for (const m of munis) {
    try {
      const dir = path.join(DATA_DIR, m.citySlug);
      const json = buildJson(m, spec, prefSlug);
      if (DRY_RUN) { ok++; continue; }
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, `kouki-${YEAR}.json`), JSON.stringify(json, null, 2) + "\n", "utf-8");
      ok++;
    } catch (e) { console.error(`  ❌ ${m.citySlug}: ${e.message}`); err++; }
  }
  console.log(`  ${prefSlug} (${spec.PREF_NAME}): ${ok}件${DRY_RUN ? " [dry]" : "生成"}  医療均等割¥${spec.KOUKI.perCapita.medical.toLocaleString()}/所得割${(spec.KOUKI.rate.medical*100).toFixed(2)}%`);
  return { ok, err };
}

const targets = ALL
  ? readdirSync(SPECS_DIR).filter(f => f.endsWith(".js")).map(f => f.replace(".js", ""))
  : PREF_ARGS;

let totalOk = 0, totalErr = 0;
for (const pref of targets) {
  const { ok, err } = await processPref(pref);
  totalOk += ok; totalErr += err;
}
console.log(`\n合計: ${totalOk}件生成 / エラー${totalErr}${DRY_RUN ? "（dry-run）" : ""}`);
