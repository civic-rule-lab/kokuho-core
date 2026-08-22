/**
 * 全自治体 kokuho-2025.json バリデーションスクリプト
 *
 * チェック内容:
 *   [構造] 必須フィールドの存在
 *   [数値] 所得割率・均等割・平等割・上限額の範囲
 *   [整合] registry に登録されているがJSONが存在しない
 *   [感覚] 所得割・均等割が都道府県内の中央値から大きく外れていないか
 *   [R8 lifecycle] meta.lifecycle.* の型/enum 認識（cross-field rule は test-integrity 側）
 *   [schoolReduction] schoolReduction.* の型認識（昭島市等の独自減免）
 *   [R8 全体] kokuho-2026.json にも同じ構造・数値範囲チェックを適用（軽減基準・上限は年度で切替）
 *   [逆転] 医療分 < 支援分 の逆転を WARN で可視化（範囲チェックでは検出できない取り違え）
 *   [既知例外] registry/known-value-exceptions.json に登録済みの値は WARN へ降格
 *
 * 実行: node scripts/validate-kokuho-data.js
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const REGISTRY_PATH = path.join(ROOT, "registry", "index.json");

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));

// ─── 既知例外リスト（ERROR → WARN 降格）───────────────────────
// 値は書き換えず、既知の値だけを降格する allowlist。
// 記録した値と現在値が一致する場合のみ降格する（値が動いたら再び ERROR）。
const EXCEPTIONS_PATH = path.join(ROOT, "registry", "known-value-exceptions.json");
const exceptionMap = new Map();
const exceptionUsed = new Set();
if (existsSync(EXCEPTIONS_PATH)) {
  try {
    const ex = JSON.parse(readFileSync(EXCEPTIONS_PATH, "utf-8"));
    for (const e of ex.exceptions || []) {
      exceptionMap.set(`${e.citySlug}|${e.year}|${e.field}`, e);
    }
  } catch (e) {
    console.log(`  ⚠️  known-value-exceptions.json の読込に失敗: ${e.message}`);
  }
}

// 医療分 < 支援分 の逆転を全国集計するためのバッファ
const crossFieldHits = [];

function getPath(obj, key) {
  return key.split(".").reduce((o, k) => o?.[k], obj);
}

// issues のうち、既知例外に一致するものを WARN へ降格する
function applyExceptions(slug, year, data, issues) {
  return issues.map((i) => {
    if (!i.field) return i;
    if (i.level !== "ERROR") return i;
    const e = exceptionMap.get(`${slug}|${year}|${i.field}`);
    if (!e) return i;
    const actual = getPath(data, i.field);
    const matches =
      e.value === null || e.value === undefined
        ? actual === undefined || actual === null
        : actual === e.value;
    if (!matches) return i;
    exceptionUsed.add(`${slug}|${year}|${i.field}`);
    return { level: "WARN", field: i.field, msg: `[既知例外] ${i.msg} — ${e.reason}` };
  });
}

let errors = 0;
let warnings = 0;
const results = [];

// ─── 都道府県別に分類 ───────────────────────────────────────────
const byPref = {};
for (const m of registry.municipalities) {
  const pref = m.prefecture || "不明";
  if (!byPref[pref]) byPref[pref] = [];
  byPref[pref].push(m);
}

// ─── バリデーション関数 ────────────────────────────────────────
function check(slug, data, pref, year = 2025) {
  const issues = [];

  // 必須フィールド
  const required = [
    "cityCode", "citySlug", "cityName", "fiscalYear", "system",
    "basicDeduction",
    "rate.medical", "rate.support", "rate.care",
    "perCapita.medical", "perCapita.support", "perCapita.care",
    "household.medical", "household.support", "household.care",
    "caps.medical", "caps.support", "caps.care",
    "preschoolReduction.medicalPerCapitaRate",
    "preschoolReduction.supportPerCapitaRate",
    "reduction.standards.sevenTenths.base",
    "reduction.standards.fiveTenths.perPersonAdd",
    "reduction.standards.twoTenths.perPersonAdd",
    "reduction.salaryPensionAdd",
  ];
  for (const key of required) {
    const val = key.split(".").reduce((o, k) => o?.[k], data);
    if (val === undefined || val === null) {
      issues.push({ level: "ERROR", field: key, msg: `必須フィールド不足: ${key}` });
    }
  }

  // 数値範囲チェック
  const r = data.rate || {};
  const p = data.perCapita || {};
  const h = data.household || {};
  const c = data.caps || {};

  // 所得割率（%換算で確認）
  if (r.medical !== undefined) {
    if (r.medical < 0.02 || r.medical > 0.15)
      issues.push({ level: "ERROR", field: "rate.medical", msg: `medical所得割 異常値: ${(r.medical*100).toFixed(2)}%` });
    else if (r.medical < 0.04 || r.medical > 0.12)
      issues.push({ level: "WARN",  field: "rate.medical", msg: `medical所得割 要確認: ${(r.medical*100).toFixed(2)}%` });
  }
  if (r.support !== undefined) {
    if (r.support < 0.005 || r.support > 0.06)
      issues.push({ level: "ERROR", field: "rate.support", msg: `support所得割 異常値: ${(r.support*100).toFixed(2)}%` });
    else if (r.support < 0.01 || r.support > 0.04)
      issues.push({ level: "WARN",  field: "rate.support", msg: `support所得割 要確認: ${(r.support*100).toFixed(2)}%` });
  }
  if (r.care !== undefined && r.care > 0) {
    if (r.care < 0.002 || r.care > 0.04)
      issues.push({ level: "ERROR", field: "rate.care", msg: `care所得割 異常値: ${(r.care*100).toFixed(2)}%` });
    else if (r.care < 0.005)
      issues.push({ level: "WARN",  field: "rate.care", msg: `care所得割 低値・要確認: ${(r.care*100).toFixed(2)}%` });
  }

  // ─── 医療分 < 支援分 の逆転 ──────────────────────────────────
  // 医療給付費分は後期高齢者支援金分より大きいのが通例で、逆転は全国の
  // 1%未満しか存在しない。値が範囲内に収まっていても取り違えていれば
  // 範囲チェックでは検出できないため、別の軸として持つ。
  for (const [group, label] of [["rate", "所得割"], ["perCapita", "均等割"], ["household", "平等割"]]) {
    const g = data[group] || {};
    if (typeof g.medical !== "number" || typeof g.support !== "number") continue;
    if (g.support <= 0) continue;
    if (g.medical < g.support) {
      const fmt = (v) => (group === "rate" ? `${(v * 100).toFixed(2)}%` : `${v.toLocaleString()}円`);
      issues.push({ level: "WARN", field: `${group}.medical`, msg: `医療分 < 支援分（${label}）: 医療 ${fmt(g.medical)} < 支援 ${fmt(g.support)}` });
      crossFieldHits.push(`${year} ${pref} ${data.cityName || slug}(${slug}) ${label}: 医療 ${fmt(g.medical)} < 支援 ${fmt(g.support)}`);
    }
  }

  // 均等割（perCapita）
  if (p.medical !== undefined && (p.medical < 0 || p.medical > 80000))
    issues.push({ level: "ERROR", msg: `medical均等割 異常値: ${p.medical.toLocaleString()}円` });
  if (p.support !== undefined && (p.support < 0 || p.support > 30000))
    issues.push({ level: "ERROR", msg: `support均等割 異常値: ${p.support.toLocaleString()}円` });
  if (p.care !== undefined && p.care > 0 && (p.care < 1000 || p.care > 30000))
    issues.push({ level: "WARN",  msg: `care均等割 要確認: ${p.care.toLocaleString()}円` });

  // 平等割（household）— 0は正常
  if (h.medical !== undefined && h.medical > 50000)
    issues.push({ level: "WARN", msg: `medical平等割 大きい: ${h.medical.toLocaleString()}円` });

  // 上限額
  // 賦課限度額（医療給付費分）の許容域は年度で異なる。
  // R7 = 58万〜66万 / R8 = 66万〜68万（R8データの実分布: 670,000が1,508件・660,000が223件）
  const CAP_MED_MIN = year >= 2026 ? 660000 : 580000;
  const CAP_MED_MAX = year >= 2026 ? 680000 : 660000;
  if (c.medical !== undefined && (c.medical < CAP_MED_MIN || c.medical > CAP_MED_MAX))
    issues.push({ level: "WARN", field: "caps.medical", msg: `medical上限 要確認: ${c.medical.toLocaleString()}円（許容 ${CAP_MED_MIN.toLocaleString()}〜${CAP_MED_MAX.toLocaleString()}）` });
  if (c.support !== undefined && (c.support < 190000 || c.support > 260000))
    issues.push({ level: "WARN", msg: `support上限 要確認: ${c.support.toLocaleString()}円` });
  if (c.care !== undefined && c.care !== 170000)
    issues.push({ level: "WARN", msg: `care上限 要確認: ${c.care.toLocaleString()}円` });

  // basicDeduction
  if (data.basicDeduction !== 430000)
    issues.push({ level: "WARN", msg: `basicDeduction 非標準: ${data.basicDeduction?.toLocaleString()}円` });

  // citySlug 整合
  if (data.citySlug !== slug)
    issues.push({ level: "ERROR", msg: `citySlug 不一致: JSON="${data.citySlug}" vs dir="${slug}"` });

  // 軽減基準（R7標準値との照合）
  // 軽減判定の国基準は年度で異なる（R7: 305,000/560,000 → R8: 310,000/570,000）
  const std = data.reduction?.standards;
  const FIVE_BASE = year >= 2026 ? 310000 : 305000;
  const TWO_BASE  = year >= 2026 ? 570000 : 560000;
  if (std) {
    if (std.fiveTenths?.perPersonAdd !== FIVE_BASE)
      issues.push({ level: "WARN", msg: `5割軽減perPersonAdd 非標準: ${std.fiveTenths?.perPersonAdd?.toLocaleString()}（期待 ${FIVE_BASE.toLocaleString()}）` });
    if (std.twoTenths?.perPersonAdd !== TWO_BASE)
      issues.push({ level: "WARN", msg: `2割軽減perPersonAdd 非標準: ${std.twoTenths?.perPersonAdd?.toLocaleString()}（期待 ${TWO_BASE.toLocaleString()}）` });
  }
  if (data.reduction?.salaryPensionAdd !== 100000)
    issues.push({ level: "WARN", msg: `salaryPensionAdd 非標準: ${data.reduction?.salaryPensionAdd?.toLocaleString()}` });

  // ─── schoolReduction の型認識（未就学児を除く 18 歳未満の医療・支援均等割減免） ─
  // 例: 昭島市の独自減免「未就学児を除く 18 歳未満の医療分・支援分均等割を 5割減額」
  // 既存 preschoolReduction（未就学児）と並列、対象人数は school = under18 - preschool。
  const schoolRed = data.schoolReduction;
  if (schoolRed !== undefined) {
    if (typeof schoolRed !== "object" || Array.isArray(schoolRed) || schoolRed === null) {
      issues.push({ level: "ERROR", msg: `schoolReduction は object 必須: ${typeof schoolRed}` });
    } else {
      if (schoolRed.enabled !== undefined && typeof schoolRed.enabled !== "boolean") {
        issues.push({ level: "ERROR", msg: `schoolReduction.enabled は boolean 必須: ${typeof schoolRed.enabled}` });
      }
      if (schoolRed.medicalPerCapitaRate !== undefined) {
        if (typeof schoolRed.medicalPerCapitaRate !== "number" || schoolRed.medicalPerCapitaRate < 0 || schoolRed.medicalPerCapitaRate > 1) {
          issues.push({ level: "ERROR", msg: `schoolReduction.medicalPerCapitaRate は 0〜1 の number 必須: ${schoolRed.medicalPerCapitaRate}` });
        }
      }
      if (schoolRed.supportPerCapitaRate !== undefined) {
        if (typeof schoolRed.supportPerCapitaRate !== "number" || schoolRed.supportPerCapitaRate < 0 || schoolRed.supportPerCapitaRate > 1) {
          issues.push({ level: "ERROR", msg: `schoolReduction.supportPerCapitaRate は 0〜1 の number 必須: ${schoolRed.supportPerCapitaRate}` });
        }
      }

      // cross-field rule (issue #14): enabled=true なら rate 必須化
      // engine 側は `|| 0` フォールバックで silent 0 減額になるため、
      // data 入力ミスを ERROR で検出する。enabled !== true なら何も検査しない（後方互換）。
      if (schoolRed.enabled === true) {
        if (schoolRed.medicalPerCapitaRate === undefined || schoolRed.medicalPerCapitaRate === null) {
          issues.push({ level: "ERROR", msg: `schoolReduction.enabled=true の場合 medicalPerCapitaRate は必須（未定義だと engine 側で || 0 により silent 0 減額になる）` });
        }
        if (schoolRed.supportPerCapitaRate === undefined || schoolRed.supportPerCapitaRate === null) {
          issues.push({ level: "ERROR", msg: `schoolReduction.enabled=true の場合 supportPerCapitaRate は必須（未定義だと engine 側で || 0 により silent 0 減額になる）` });
        }
      }
    }
  }

  // ─── R8 検証ライフサイクル メタフィールドの型/enum 認識 ──────────
  // 意味的な cross-field rule（必須組合せ・verified_r8 条件等）は scripts/test-integrity.js 側で検証
  const lifecycle = data.meta?.lifecycle;
  if (lifecycle !== undefined) {
    if (typeof lifecycle !== "object" || Array.isArray(lifecycle) || lifecycle === null) {
      issues.push({ level: "ERROR", msg: `meta.lifecycle は object 必須: ${typeof lifecycle}` });
    } else {
      // "standard_r8" = 県標準保険料率をそのまま採用した段階。
      // generate-official-pages.js / change-detector.js / r8-watch.js /
      // test-integrity.js が参照する正規値。
      const R8_STAGE_ENUM = ["template_r7", "source_found_r8", "extracted_r8", "standard_r8", "tested_r8", "verified_r8"];
      const SOURCE_STATUS_ENUM = [
        "official_rate_page", "official_rate_pdf", "ordinance_after_revision", "official_final_notice",
        "council_bill", "proposal_pdf", "draft_revision", "budget_material", "press_release",
        "no_r8_source", "secondary_source", "unclear_source",
        // 県標準保険料率の採用形態（apply-*-standard-r8.py / generate-*-kokuho.js 由来）
        "prefecture_standard_municipal_list", "prefecture_standard_p3",
        "prefecture_standard_municipal_method", "prefecture_standard_municipal_basis",
        "prefecture_standard_unified", "previous_year_carryover",
      ];

      if (lifecycle.r8Stage !== undefined && !R8_STAGE_ENUM.includes(lifecycle.r8Stage)) {
        issues.push({ level: "ERROR", msg: `meta.lifecycle.r8Stage 不正値: "${lifecycle.r8Stage}"（許可: ${R8_STAGE_ENUM.join(", ")}）` });
      }
      if (lifecycle.sourceStatus !== undefined && !SOURCE_STATUS_ENUM.includes(lifecycle.sourceStatus)) {
        issues.push({ level: "ERROR", msg: `meta.lifecycle.sourceStatus 不正値: "${lifecycle.sourceStatus}"` });
      }
      if (lifecycle.sourceUrls !== undefined) {
        if (!Array.isArray(lifecycle.sourceUrls)) {
          issues.push({ level: "ERROR", msg: `meta.lifecycle.sourceUrls は array 必須: ${typeof lifecycle.sourceUrls}` });
        } else {
          for (const [idx, url] of lifecycle.sourceUrls.entries()) {
            if (typeof url !== "string") {
              issues.push({ level: "ERROR", msg: `meta.lifecycle.sourceUrls[${idx}] は string 必須: ${typeof url}` });
            }
          }
        }
      }
      if (lifecycle.verifiedAt !== undefined && lifecycle.verifiedAt !== null && typeof lifecycle.verifiedAt !== "string") {
        issues.push({ level: "ERROR", msg: `meta.lifecycle.verifiedAt は string|null 必須: ${typeof lifecycle.verifiedAt}` });
      }
      if (lifecycle.r8Updated !== undefined && typeof lifecycle.r8Updated !== "boolean") {
        issues.push({ level: "ERROR", msg: `meta.lifecycle.r8Updated は boolean 必須: ${typeof lifecycle.r8Updated}` });
      }
      if (lifecycle.previousYearTemplate !== undefined && typeof lifecycle.previousYearTemplate !== "boolean") {
        issues.push({ level: "ERROR", msg: `meta.lifecycle.previousYearTemplate は boolean 必須: ${typeof lifecycle.previousYearTemplate}` });
      }
      if (lifecycle.verificationLevel !== undefined && typeof lifecycle.verificationLevel !== "string") {
        issues.push({ level: "ERROR", msg: `meta.lifecycle.verificationLevel は string 必須: ${typeof lifecycle.verificationLevel}` });
      }
    }
  }

  return issues;
}

// ─── メイン処理 ────────────────────────────────────────────────
console.log("\n" + "=".repeat(70));
console.log("kokuho-2025.json / kokuho-2026.json バリデーション");
console.log("=".repeat(70));

for (const [pref, municipalities] of Object.entries(byPref)) {
  const prefErrors = [];

  for (const m of municipalities) {
    const slug = m.citySlug;

    // systems に kokuho が含まれない entry は kokuho データ不要として skip
    if (!Array.isArray(m.systems) || !m.systems.includes("kokuho")) {
      continue;
    }

    const jsonPath = path.join(DATA_DIR, slug, "kokuho-2025.json");

    // ファイル存在確認
    if (!existsSync(jsonPath)) {
      prefErrors.push({ slug, name: m.cityName, issues: [{ level: "ERROR", msg: "kokuho-2025.json が存在しない" }] });
      errors++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(readFileSync(jsonPath, "utf-8"));
    } catch (e) {
      prefErrors.push({ slug, name: m.cityName, issues: [{ level: "ERROR", msg: `JSON parse error: ${e.message}` }] });
      errors++;
      continue;
    }

    const issues = applyExceptions(slug, 2025, data, check(slug, data, pref, 2025));
    if (issues.length > 0) {
      prefErrors.push({ slug, name: m.cityName, issues });
      for (const i of issues) {
        if (i.level === "ERROR") errors++;
        else warnings++;
      }
    }

    // ─── R8 (kokuho-2026.json) にも同じ検査を適用 ───────────────
    // ファイル不在の自治体は skip（R8 データ未作成）。
    const r8Path = path.join(DATA_DIR, slug, "kokuho-2026.json");
    if (existsSync(r8Path)) {
      let r8data = null;
      try {
        r8data = JSON.parse(readFileSync(r8Path, "utf-8"));
      } catch (e) {
        prefErrors.push({ slug, name: `${m.cityName} [R8]`, issues: [{ level: "ERROR", msg: `JSON parse error: ${e.message}` }] });
        errors++;
      }
      if (r8data) {
        const r8issues = applyExceptions(slug, 2026, r8data, check(slug, r8data, pref, 2026))
          .map((i) => ({ level: i.level, field: i.field, msg: `[R8] ${i.msg}` }));
        if (r8issues.length > 0) {
          prefErrors.push({ slug, name: `${m.cityName} [R8]`, issues: r8issues });
          for (const i of r8issues) {
            if (i.level === "ERROR") errors++;
            else warnings++;
          }
        }
      }
    }
  }

  if (prefErrors.length > 0) {
    console.log(`\n【${pref}】`);
    for (const { slug, name, issues } of prefErrors) {
      console.log(`  ${name} (${slug})`);
      for (const { level, msg } of issues) {
        const icon = level === "ERROR" ? "  ❌" : "  ⚠️ ";
        console.log(`${icon} ${msg}`);
      }
    }
  }
}

// ─── 重複スラグ検出（POLICIES §9・allowlist 対応） ─────────────
// allowlist (registry/legacy-slug-collisions.json) に登録された衝突は WARNING、
// 未登録の新規衝突は ERROR とする。これにより legacy データの存在で deploy が
// 全停止することを防ぎつつ、新規衝突は確実に block する。
const slugMap = {};
for (const m of registry.municipalities) {
  if (!slugMap[m.citySlug]) slugMap[m.citySlug] = [];
  slugMap[m.citySlug].push({
    cityCode: m.cityCode,
    label: `${m.prefecture} ${m.cityName} (${m.cityCode})`,
  });
}
const duplicates = Object.entries(slugMap).filter(([, v]) => v.length > 1);

// allowlist 読込（任意・ファイル不在なら空とみなす）
const LEGACY_PATH = path.join(ROOT, "registry", "legacy-slug-collisions.json");
const legacyAllowed = new Set();
if (existsSync(LEGACY_PATH)) {
  try {
    const legacy = JSON.parse(readFileSync(LEGACY_PATH, "utf-8"));
    for (const c of legacy.collisions || []) {
      legacyAllowed.add(c.slug);
    }
  } catch (e) {
    console.log(`  ⚠️  legacy-slug-collisions.json の読込に失敗: ${e.message}`);
  }
}

if (duplicates.length > 0) {
  console.log("\n【重複スラグ検出（POLICIES §9）】");
  for (const [slug, cities] of duplicates) {
    const isLegacy = legacyAllowed.has(slug);
    const icon = isLegacy ? "⚠️ " : "❌";
    const tag = isLegacy ? "[legacy・grandfather]" : "[新規違反]";
    console.log(`  ${icon} "${slug}" ${tag} が ${cities.length} 件の異なる自治体に割当中:`);
    for (const c of cities) {
      console.log(`     - ${c.label}`);
    }
    if (isLegacy) {
      console.log(`     → registry/legacy-slug-collisions.json に登録済、別 PR で URL 移行予定`);
      warnings++;
    } else {
      console.log(`     → 対処: 遅れて登録された側を {base}-{prefSlug} 形式に変更（例: ${slug}-{prefSlug}）`);
      console.log(`     → 既存 legacy として認める場合は registry/legacy-slug-collisions.json に追記`);
      errors++;
    }
  }
}

// ─── JSON存在・HTML存在の照合 ───────────────────────────────────
const jsonDirs = new Set(readdirSync(DATA_DIR));
// systems が空（または kokuho 未含）の entry は kokuho データ不要として除外
const registrySlugs = new Set(
  registry.municipalities
    .filter(m => Array.isArray(m.systems) && m.systems.includes("kokuho"))
    .map(m => m.citySlug)
);

// registryにあるがJSONディレクトリがないスラグ（重複含む除外）
const missingJson = [...registrySlugs].filter(s => !jsonDirs.has(s));
if (missingJson.length > 0) {
  console.log("\n【JSONファイルなし（registry登録済み）】");
  for (const slug of missingJson) {
    console.log(`  ❌ ${slug}`);
    errors++;
  }
}

// JSONディレクトリがあるがregistryにないスラグ
const unregistered = [...jsonDirs].filter(
  s => !registrySlugs.has(s) && !s.includes("-")
);
if (unregistered.length > 0) {
  console.log("\n【registry未登録のJSONディレクトリ】");
  for (const slug of unregistered) {
    console.log(`  ⚠️  ${slug}`);
    warnings++;
  }
}

// ─── (旧) R8 軽減基準の個別チェックは check(..., 2026) に統合済み ────────

// ─── 医療分 < 支援分 の逆転 全国集計 ──────────────────────────
// ここに載る自治体は一次資料との照合対象。
if (crossFieldHits.length > 0) {
  console.log("\n【医療分 < 支援分 の逆転】");
  crossFieldHits.forEach((h) => console.log(`  ⚠️  ${h}`));
  console.log(`  → 計 ${crossFieldHits.length} 件。一次資料と照合すること。`);
}

// ─── 使われなかった既知例外（解消済みの可能性・削除候補）─────────
const staleExceptions = [...exceptionMap.keys()].filter((k) => !exceptionUsed.has(k));
if (staleExceptions.length > 0) {
  console.log("\n【既知例外リストの棚卸し（もう一致しない＝解消済みの可能性）】");
  staleExceptions.forEach((k) => console.log(`  ⚠️  ${k} → registry/known-value-exceptions.json から削除を検討`));
  warnings += staleExceptions.length;
}

// ─── 集計 ──────────────────────────────────────────────────────
console.log("\n" + "=".repeat(70));
console.log(`対象: ${registry.municipalities.length}自治体`);
if (errors === 0 && warnings === 0) {
  console.log("✅ 問題なし");
} else {
  if (errors > 0)   console.log(`❌ ERROR: ${errors}件`);
  if (warnings > 0) console.log(`⚠️  WARN:  ${warnings}件`);
}
if (exceptionUsed.size > 0) {
  console.log(`（既知例外リストにより ${exceptionUsed.size} 件を WARN へ降格: registry/known-value-exceptions.json）`);
}
console.log("=".repeat(70) + "\n");

// 終了コード: ERROR があれば 1 を返す（CI のゲートに使うため）。
// deploy.sh 側は出力 grep で判定しているため `|| true` で従来動作を保つ。
process.exit(errors > 0 ? 1 : 0);
