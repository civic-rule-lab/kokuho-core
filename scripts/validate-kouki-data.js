/**
 * 後期高齢者医療 データバリデーション
 *
 * 実行:
 *   node scripts/validate-kouki-data.js                 # 2026年度全件
 *   node scripts/validate-kouki-data.js --slug=yokohama # 特定自治体
 *   node scripts/validate-kouki-data.js --strict        # warning も FAIL 扱い
 *
 * チェック:
 *   [構造] 必須フィールドの存在・型
 *   [数値] 均等割・所得割率の妥当範囲（全国分布から）
 *   [一律] 賦課限度額85万/2.1万・医療7割軽減=7.2割・しきい値31万/57万が全国一律値か
 *   [独自] incomeReduction は null か配列（東京のみ配列）
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const DATA_DIR  = path.join(ROOT, "data", "municipalities");
const YEAR_ARG  = process.argv.find(a => a.startsWith("--year="));
const YEAR      = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const SLUG      = (process.argv.find(a => a.startsWith("--slug=")) || "").replace("--slug=", "") || null;
const STRICT    = process.argv.includes("--strict");

const RANGE = {
  medKin: [45000, 72000], medRate: [0.080, 0.120],
  chiKin: [1280, 1410],   chiRate: [0.0019, 0.0029],
};

let nFiles = 0, nErr = 0, nWarn = 0;
const errs = [], warns = [];

function check(slug, d) {
  const E = m => errs.push(`${slug}: ${m}`);
  const W = m => warns.push(`${slug}: ${m}`);

  for (const f of ["cityCode","citySlug","cityName","prefSlug","prefecture","perCapita","rate","caps","reduction","basicDeduction"])
    if (d[f] === undefined) E(`必須欠落 ${f}`);
  if (d.system !== "kouki") E(`system != kouki (${d.system})`);
  if (d.fiscalYear !== YEAR) W(`fiscalYear=${d.fiscalYear}`);

  if (d.perCapita) {
    if (!(d.perCapita.medical >= RANGE.medKin[0] && d.perCapita.medical <= RANGE.medKin[1])) E(`医療均等割 範囲外 ${d.perCapita.medical}`);
    if (!(d.perCapita.childcare >= RANGE.chiKin[0] && d.perCapita.childcare <= RANGE.chiKin[1])) E(`子均等割 範囲外 ${d.perCapita.childcare}`);
  }
  if (d.rate) {
    if (!(d.rate.medical >= RANGE.medRate[0] && d.rate.medical <= RANGE.medRate[1])) E(`医療所得割 範囲外 ${d.rate.medical}`);
    if (!(d.rate.childcare >= RANGE.chiRate[0] && d.rate.childcare <= RANGE.chiRate[1])) E(`子所得割 範囲外 ${d.rate.childcare}`);
  }
  if (d.caps && (d.caps.medical !== 850000 || d.caps.childcare !== 21000)) E(`賦課限度額が全国一律値でない 医${d.caps?.medical}/子${d.caps?.childcare}`);
  if (d.basicDeduction !== 430000) E(`基礎控除が43万でない ${d.basicDeduction}`);
  if (d.reduction?.ratios?.seven?.medical !== 0.72) E(`医療7割軽減が7.2割でない ${d.reduction?.ratios?.seven?.medical}`);
  if (d.reduction?.ratios?.seven?.childcare !== 0.70) E(`子7割軽減が0.70でない ${d.reduction?.ratios?.seven?.childcare}`);
  if (d.reduction && (d.reduction.fivePerInsured !== 310000 || d.reduction.twoPerInsured !== 570000)) E(`軽減しきい値が31万/57万でない`);
  if (!(d.incomeReduction === null || Array.isArray(d.incomeReduction))) E(`incomeReduction は null か配列のみ`);
  if (Array.isArray(d.incomeReduction) && d.prefSlug !== "tokyo") W(`東京以外で所得割独自軽減あり（要確認）`);
  if (d.status && !["verified","needs_update"].includes(d.status)) W(`status=${d.status}`);
}

const slugs = SLUG ? [SLUG] : readdirSync(DATA_DIR).filter(s => existsSync(path.join(DATA_DIR, s, `kouki-${YEAR}.json`)));
for (const slug of slugs) {
  const fp = path.join(DATA_DIR, slug, `kouki-${YEAR}.json`);
  if (!existsSync(fp)) continue;
  nFiles++;
  try { check(slug, JSON.parse(readFileSync(fp, "utf-8"))); }
  catch (e) { errs.push(`${slug}: JSON parse失敗 ${e.message}`); }
}
nErr = errs.length; nWarn = warns.length;

console.log(`後期高齢者医療 データ検証: ${nFiles}件 (R${YEAR - 2018 + 0 /*参考*/}=令和8)`);
if (errs.length) { console.log(`\n❌ エラー ${errs.length}件:`); errs.slice(0,50).forEach(e => console.log("  - " + e)); }
if (warns.length) { console.log(`\n⚠️  警告 ${warns.length}件:`); warns.slice(0,50).forEach(w => console.log("  - " + w)); }
const fail = nErr > 0 || (STRICT && nWarn > 0);
console.log(`\n${fail ? "❌ FAIL" : "✅ PASS"}  files=${nFiles} errors=${nErr} warnings=${nWarn}`);
process.exit(fail ? 1 : 0);
