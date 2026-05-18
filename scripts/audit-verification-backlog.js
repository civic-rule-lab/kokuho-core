/**
 * 国保データの verification backlog 監査
 *
 * 全自治体の kokuho-{year}.json について、status / source / audit の整備状況を
 * 集計する。「公式値で検証済み」かどうかの追跡用ツール。
 *
 * 背景 (issue #35 検出経緯):
 *   一宮町 R7 JSON が公式値と乖離していたケースを契機に、status=unverified で
 *   audit.verifiedBy が空のまま放置されている自治体がどれだけあるか把握するため
 *   作成。caps だけ一致して残りはテンプレ値の懸念がある retrofit 候補を洗い出す。
 *
 * 実行:
 *   node scripts/audit-verification-backlog.js              # R7 (2025) を監査
 *   node scripts/audit-verification-backlog.js --year=2026  # R8 (2026)
 *   node scripts/audit-verification-backlog.js --prefecture=chiba  # 県絞り込み
 *   node scripts/audit-verification-backlog.js --verbose    # 全自治体リスト出力
 *
 * 出力: Markdown 形式で stdout
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const REGISTRY_PATH = path.join(ROOT, "registry", "index.json");

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const yearArg = args.find(a => a.startsWith("--year="));
const YEAR = yearArg ? parseInt(yearArg.split("=")[1]) : 2025;
const prefArg = args.find(a => a.startsWith("--prefecture="));
const PREF_FILTER = prefArg ? prefArg.split("=")[1] : null;

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
const slugToPref = new Map();
for (const m of registry.municipalities) {
  slugToPref.set(m.citySlug, { prefecture: m.prefecture, prefSlug: m.prefectureSlug, cityName: m.cityName });
}

const slugs = readdirSync(DATA_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const records = [];

for (const slug of slugs) {
  const p = path.join(DATA_DIR, slug, `kokuho-${YEAR}.json`);
  if (!existsSync(p)) continue;
  const info = slugToPref.get(slug);
  if (!info) continue;
  if (PREF_FILTER && info.prefSlug !== PREF_FILTER) continue;

  let data;
  try {
    data = JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    continue;
  }
  const meta = data.meta ?? {};
  const audit = meta.audit ?? {};
  const source = meta.source ?? {};
  const lifecycle = meta.lifecycle ?? {};

  records.push({
    slug,
    cityName: info.cityName,
    prefecture: info.prefecture,
    prefSlug: info.prefSlug,
    status: meta.status ?? "(none)",
    auditEmpty: !audit.verifiedBy,
    sourceUrlEmpty: !source.url,
    sourceType: source.type ?? "(none)",
    r8Stage: lifecycle.r8Stage ?? null,
    caps: data.caps ?? {},
  });
}

const total = records.length;

if (total === 0) {
  console.log(`# 国保データ verification backlog 監査 (R${YEAR - 2018}, kokuho-${YEAR}.json)`);
  console.log("");
  console.log(`対象データなし${PREF_FILTER ? ` (prefecture=${PREF_FILTER} 絞り込み)` : ""}`);
  process.exit(0);
}

// --- 集計 ---
const statusCount = new Map();
const sourceTypeCount = new Map();
let auditEmpty = 0;
let sourceUrlEmpty = 0;
let unverifiedNeverAudited = 0;
const perPrefUnverified = new Map();
const capsPatternCount = new Map();

for (const r of records) {
  statusCount.set(r.status, (statusCount.get(r.status) ?? 0) + 1);
  sourceTypeCount.set(r.sourceType, (sourceTypeCount.get(r.sourceType) ?? 0) + 1);
  if (r.auditEmpty) auditEmpty++;
  if (r.sourceUrlEmpty) sourceUrlEmpty++;
  if (r.status === "unverified" && r.auditEmpty && r.sourceUrlEmpty) {
    unverifiedNeverAudited++;
    perPrefUnverified.set(r.prefecture, (perPrefUnverified.get(r.prefecture) ?? 0) + 1);
  }
  const capsKey = `${r.caps.medical ?? "?"}/${r.caps.support ?? "?"}/${r.caps.care ?? "?"}`;
  capsPatternCount.set(capsKey, (capsPatternCount.get(capsKey) ?? 0) + 1);
}

const yearLabel = `R${YEAR - 2018}`;

// --- 出力 ---
console.log(`# 国保データ verification backlog 監査 (${yearLabel}, kokuho-${YEAR}.json)`);
console.log("");
console.log(`生成日時: ${new Date().toISOString()}`);
console.log(`対象: ${total} 自治体${PREF_FILTER ? ` (prefecture=${PREF_FILTER} 絞り込み)` : ""}`);
console.log("");

console.log(`## status 分布`);
console.log("");
console.log(`| status | 件数 | 割合 |`);
console.log(`|---|---:|---:|`);
const sortedStatus = [...statusCount.entries()].sort((a, b) => b[1] - a[1]);
for (const [s, c] of sortedStatus) {
  console.log(`| ${s} | ${c} | ${(100 * c / total).toFixed(1)}% |`);
}
console.log("");

console.log(`## source / audit の整備状況`);
console.log("");
console.log(`- audit.verifiedBy 空: **${auditEmpty} / ${total}** (${(100 * auditEmpty / total).toFixed(1)}%)`);
console.log(`- source.url 空:        **${sourceUrlEmpty} / ${total}** (${(100 * sourceUrlEmpty / total).toFixed(1)}%)`);
console.log(`- **unverified + audit 空 + source.url 空 (ichinomiya-chiba パターン)**: **${unverifiedNeverAudited} / ${total}** (${(100 * unverifiedNeverAudited / total).toFixed(1)}%)`);
console.log("");

console.log(`## source.type 分布`);
console.log("");
console.log(`| source.type | 件数 |`);
console.log(`|---|---:|`);
for (const [t, c] of [...sourceTypeCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`| ${t} | ${c} |`);
}
console.log("");

console.log(`## caps 値の分布 (medical/support/care, 上位 10)`);
console.log("");
console.log(`| caps (med/sup/care) | 件数 |`);
console.log(`|---|---:|`);
for (const [k, c] of [...capsPatternCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`| ${k} | ${c} |`);
}
console.log("");

console.log(`## 都道府県別 unverified 件数 (top 15)`);
console.log("");
console.log(`| prefecture | unverified |`);
console.log(`|---|---:|`);
for (const [p, c] of [...perPrefUnverified.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`| ${p} | ${c} |`);
}
console.log("");

if (verbose) {
  console.log(`## 全 ichinomiya-chiba パターン自治体（unverified + audit/source 空）`);
  console.log("");
  console.log(`| prefecture | cityName | slug | caps (med/sup/care) |`);
  console.log(`|---|---|---|---|`);
  for (const r of records.filter(r => r.status === "unverified" && r.auditEmpty && r.sourceUrlEmpty)) {
    const capsStr = `${r.caps.medical ?? "?"}/${r.caps.support ?? "?"}/${r.caps.care ?? "?"}`;
    console.log(`| ${r.prefecture} | ${r.cityName} | ${r.slug} | ${capsStr} |`);
  }
  console.log("");
}

console.log(`---`);
console.log("");
console.log(`生成: \`node scripts/audit-verification-backlog.js${yearArg ? " " + yearArg : ""}${prefArg ? " " + prefArg : ""}${verbose ? " --verbose" : ""}\``);
