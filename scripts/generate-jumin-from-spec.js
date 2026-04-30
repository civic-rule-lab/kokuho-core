/**
 * 住民税 差分JSONファイル 生成スクリプト
 *
 * data/jumin-specs/{prefSlug}.js を読み込み、
 * data/municipalities/{slug}/jumin-{year}.json を生成する。
 *
 * PREF_DEFAULTS が設定されている場合は、都道府県内の全市町村に適用した上で
 * MUNICIPALITIES の自治体個別差分をさらに重ねる。
 *
 * 標準値（JUMIN_DEFAULTS）との差分がゼロな自治体はファイルを生成しない。
 *
 * 実行:
 *   node scripts/generate-jumin-from-spec.js aichi
 *   node scripts/generate-jumin-from-spec.js aichi --year=2026
 *   node scripts/generate-jumin-from-spec.js --all
 *   node scripts/generate-jumin-from-spec.js --all --dry-run
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "..");
const DATA_DIR   = path.join(ROOT, "data", "municipalities");
const SPECS_DIR  = path.join(ROOT, "data", "jumin-specs");

const DRY_RUN   = process.argv.includes("--dry-run");
const ALL       = process.argv.includes("--all");
const YEAR_ARG  = process.argv.find(a => a.startsWith("--year="));
const YEAR      = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const PREF_ARGS = process.argv.slice(2).filter(a => !a.startsWith("--"));

if (!ALL && PREF_ARGS.length === 0) {
  console.error("使い方: node generate-jumin-from-spec.js <prefSlug> [--year=2026] [--dry-run]");
  console.error("        node generate-jumin-from-spec.js --all");
  process.exit(1);
}

// ─── Fix 1: JUMIN_DEFAULTS を jumin.js から直接インポート ────────
// これにより「標準値」の定義が jumin.js の一箇所だけに集約される

const _require = createRequire(import.meta.url);
const { JUMIN_DEFAULTS } = _require("../js/core/jumin.js");

const DIFF_KEYS = Object.keys(JUMIN_DEFAULTS);

// ─── registry から都道府県別の自治体一覧を構築 ───────────────────

const REGISTRY = JSON.parse(readFileSync(path.join(ROOT, "registry/index.json"), "utf-8"));

const JP_TO_SLUG = {
  "北海道":"hokkaido","青森県":"aomori","岩手県":"iwate","宮城県":"miyagi",
  "秋田県":"akita","山形県":"yamagata","福島県":"fukushima","茨城県":"ibaraki",
  "栃木県":"tochigi","群馬県":"gunma","埼玉県":"saitama","千葉県":"chiba",
  "東京都":"tokyo","神奈川県":"kanagawa","新潟県":"niigata","富山県":"toyama",
  "石川県":"ishikawa","福井県":"fukui","山梨県":"yamanashi","長野県":"nagano",
  "静岡県":"shizuoka","愛知県":"aichi","三重県":"mie","滋賀県":"shiga",
  "京都府":"kyoto","大阪府":"osaka","兵庫県":"hyogo","奈良県":"nara",
  "和歌山県":"wakayama","鳥取県":"tottori","島根県":"shimane","岡山県":"okayama",
  "広島県":"hiroshima","山口県":"yamaguchi","徳島県":"tokushima","香川県":"kagawa",
  "愛媛県":"ehime","高知県":"kochi","福岡県":"fukuoka","佐賀県":"saga",
  "長崎県":"nagasaki","熊本県":"kumamoto","大分県":"oita","宮崎県":"miyazaki",
  "鹿児島県":"kagoshima","沖縄県":"okinawa",
};

function resolveSlug(m) {
  return m.prefectureSlug || JP_TO_SLUG[m.prefecture] || null;
}

const municipalitiesByPref = {};
for (const m of REGISTRY.municipalities) {
  const slug = resolveSlug(m);
  if (!slug) continue;
  if (!municipalitiesByPref[slug]) municipalitiesByPref[slug] = [];
  municipalitiesByPref[slug].push(m);
}

// ─── JSON ビルド ──────────────────────────────────────────────

/**
 * 最終的な差分フィールド（JUMIN_DEFAULTS と比べて異なるもの）を計算する。
 * PREF_DEFAULTS → 自治体個別差分 の順で上書きされる。
 */
function computeDiff(prefDefaults, cityOverride) {
  const merged = { ...JUMIN_DEFAULTS, ...prefDefaults, ...cityOverride };
  const diff   = {};
  for (const k of DIFF_KEYS) {
    if (merged[k] !== JUMIN_DEFAULTS[k]) diff[k] = merged[k];
  }
  return diff;
}

function buildJson(prefSlug, municipality, diff, prefDefs, citySpec, prefStatus = "inferred") {
  // 明示指定フィールド = PREF_DEFAULTS + city spec に書かれたフィールド。
  // 標準値と同じであっても「確認済み」の証跡としてJSONに含める。
  const explicit = {};
  for (const k of DIFF_KEYS) {
    if (prefDefs[k] !== undefined) explicit[k] = prefDefs[k];
  }
  if (citySpec) {
    for (const k of DIFF_KEYS) {
      if (citySpec[k] !== undefined) explicit[k] = citySpec[k];
    }
  }

  return {
    cityCode:    municipality.cityCode,
    citySlug:    municipality.citySlug,
    cityName:    municipality.cityName,
    prefSlug,
    fiscalYear:  YEAR,
    system:      "jumin",
    schemaVersion: "1.0",
    status:      citySpec?.status ?? prefStatus,
    // 明示指定フィールド（標準値と同じものも確認済み証跡として含める）
    ...explicit,
    source:      citySpec?.source ?? { url: null, retrievedAt: null },
    ...(citySpec?.notes ? { notes: citySpec.notes } : {}),
  };
}

// ─── 都道府県スペック処理 ─────────────────────────────────────

async function processSpec(prefSlug) {
  const specPath = path.join(SPECS_DIR, `${prefSlug}.js`);
  if (!existsSync(specPath)) {
    console.warn(`  ⚠️  スペックファイルなし: ${specPath}`);
    return { ok: 0, err: 1 };
  }

  const spec      = await import(pathToFileURL(specPath).href);
  const prefDefs  = spec.PREF_DEFAULTS  || {};
  const citySpecs = spec.MUNICIPALITIES || [];
  const prefStatus = spec.PREF_STATUS   || "inferred";  // 個別エントリのない市町村のデフォルト
  const hasPrefDiff = Object.keys(prefDefs).length > 0;

  // citySlug → citySpec の逆引き
  const citySpecBySlug = Object.fromEntries(citySpecs.map(c => [c.citySlug, c]));

  // 処理対象の自治体を決定
  // ・PREF_DEFAULTS がある → 都道府県内の全自治体
  // ・PREF_DEFAULTS がない → MUNICIPALITIES に列挙された自治体のみ
  const targets = hasPrefDiff
    ? (municipalitiesByPref[prefSlug] || [])
    : citySpecs.map(c => ({ cityCode: c.cityCode, citySlug: c.citySlug, cityName: c.cityName }));

  if (targets.length === 0) {
    console.log(`  ℹ️  ${prefSlug}: 非標準自治体なし（全件デフォルト適用）`);
    return { ok: 0, err: 0 };
  }

  let ok = 0, err = 0, skipped = 0;

  for (const m of targets) {
    try {
      const citySpec = citySpecBySlug[m.citySlug] || null;
      const cityOverride = citySpec
        ? Object.fromEntries(DIFF_KEYS.filter(k => citySpec[k] !== undefined).map(k => [k, citySpec[k]]))
        : {};
      const diff = computeDiff(prefDefs, cityOverride);

      // diff が空 = 国の標準値と完全に同じ → ファイル不要
      if (Object.keys(diff).length === 0) { skipped++; continue; }

      const dir     = path.join(DATA_DIR, m.citySlug);
      const outPath = path.join(dir, `jumin-${YEAR}.json`);
      const json    = buildJson(prefSlug, m, diff, prefDefs, citySpec, prefStatus);

      const diffStr = Object.entries(diff).map(([k,v]) => `${k}=${v}`).join(", ");

      if (DRY_RUN) {
        console.log(`  [dry] ${m.citySlug}: ${diffStr}`);
        ok++;
        continue;
      }

      mkdirSync(dir, { recursive: true });
      writeFileSync(outPath, JSON.stringify(json, null, 2) + "\n", "utf-8");
      console.log(`  ✅ ${m.citySlug} (${m.cityName}): ${diffStr}`);
      ok++;
    } catch (e) {
      console.error(`  ❌ ${m.citySlug}: ${e.message}`);
      err++;
    }
  }

  if (skipped > 0) console.log(`  ℹ️  ${skipped}件はPREF_DEFAULTSのみで標準値と一致 → スキップ`);
  return { ok, err };
}

// ─── 実行 ───────────────────────────────────────────────────

const targets = ALL
  ? readdirSync(SPECS_DIR)
      .filter(f => f.endsWith(".js") && !f.startsWith("_"))
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
if (DRY_RUN) console.log("（--dry-run モード）");
