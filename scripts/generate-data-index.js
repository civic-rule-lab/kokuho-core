#!/usr/bin/env node
/**
 * generate-data-index.js — 機械向けカタログ data/index.json を生成する
 *
 * なぜ要るか:
 *   kokuho-keisan.jp は /data/municipalities/<slug>/<system>-<year>.json を全自治体ぶん配信しているが、
 *   「どの自治体があり、どの JSON がどこにあるか」を機械が知る入口が無かった（台帳 registry/index.json は
 *   サイトに配信していない）。人向けの表示と機械向けのデータが同じ来歴（各 JSON の meta）を参照できるよう、
 *   所在・年度・status・検証日を 1 ファイルにまとめた索引を置く。
 *
 * 何を読むか（読むだけ。data/ 配下の JSON は一切書き換えない）:
 *   - registry/index.json                  台帳（citySlug / cityCode / cityName / prefecture / systems）
 *   - data/municipalities/<slug>/*.json     実物。status・meta.lifecycle を読む
 *
 * 出力の決まり:
 *   - 決定論的: 同じ入力なら同じ bytes。並びは cityCode 順（JIS 市区町村コード順＝北海道→沖縄）、
 *     同一 cityCode 内は citySlug 順。キー順は本スクリプトの構築順で固定。
 *   - generatedAt は「索引の中身が前回から変わったときだけ」更新する（中身が同じなら前回の値を引き継ぐ）。
 *     実行のたびに diff が出ることを防ぐため（生成物に実行日を入れると毎回 dirty になる）。
 *   - 台帳と実物の不整合（台帳にあるのにファイルが無い／ファイルはあるが台帳の systems に無い 等）は
 *     落とさず warnings に列挙し、stderr にも件数を出す。終了コードは 0（不整合は索引の情報として残す）。
 *
 * 項目の取り方（無い項目は null）:
 *   - status      : meta.status（kokuho）→ 無ければトップレベル status
 *   - verifiedAt  : meta.lifecycle.verifiedAt → 無ければ meta.audit.verifiedAt
 *   - validFrom / validUntil : meta.lifecycle.validFrom / validUntil
 *   - schemaVersion : meta.schemaVersion → 無ければトップレベル schemaVersion
 *   - 空文字 "" は「未記入」の意味で使われているため null に揃える
 *   - 各ファイルのスキーマは schemas[system]（/data/schema/<system>.schema.json）
 *   kokuho 以外の制度は meta を持たないため verifiedAt / validFrom / validUntil は null になる。
 *   それらの取得日は各 JSON の source.retrievedAt（jumin / kaigo / kouki）や asOf（hoiku）にある。
 *
 * 実行: node scripts/generate-data-index.js            → data/index.json を書く
 *       node scripts/generate-data-index.js --check    → 書かずに、現在の data/index.json と中身が同じか確かめる（違えば exit 1）
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const SCHEMA_DIR = path.join(ROOT, "data", "schema");
const OUT = path.join(ROOT, "data", "index.json");

export const BASE_URL = "https://kokuho-keisan.jp";
const REPO_URL = "https://github.com/civic-rule-lab/kokuho-core";
export const SYSTEMS = ["kokuho", "jumin", "kaigo", "kouki", "hoiku"];
const SYSTEM_LABELS = {
  kokuho: "国民健康保険料（税）",
  jumin: "個人住民税",
  kaigo: "介護保険料（第1号被保険者）",
  kouki: "後期高齢者医療保険料",
  hoiku: "保育料（利用者負担額）",
};
const FILE_RE = /^(kokuho|jumin|kaigo|kouki|hoiku)-(\d{4})\.json$/;
const CATALOG_SCHEMA_VERSION = "1.0";

const readJson = (p) => JSON.parse(readFileSync(p, "utf-8"));
// 無い項目・空文字（"" は「未記入」の意味で使われている）は null に揃える
const pick = (obj, ...keys) => {
  let o = obj;
  for (const k of keys) {
    if (o === null || typeof o !== "object" || !(k in o)) return null;
    o = o[k];
  }
  return o === undefined || o === "" ? null : o;
};

/** 索引本体を組み立てる（generatedAt を除く）。 */
export function buildIndexBody() {
  const registry = readJson(REGISTRY).municipalities;
  const warnings = [];
  const warn = (kind, detail) => warnings.push({ kind, ...detail });

  // 台帳の重複・ディレクトリ側との突合
  const bySlug = new Map();
  for (const m of registry) {
    if (bySlug.has(m.citySlug)) warn("duplicate_slug_in_registry", { citySlug: m.citySlug });
    bySlug.set(m.citySlug, m);
  }
  const dirs = existsSync(DATA_DIR)
    ? readdirSync(DATA_DIR).filter((d) => statSync(path.join(DATA_DIR, d)).isDirectory()).sort()
    : [];
  const dirSet = new Set(dirs);
  for (const d of dirs) if (!bySlug.has(d)) warn("directory_not_in_registry", { citySlug: d });

  const sorted = [...registry].sort((a, b) =>
    String(a.cityCode).localeCompare(String(b.cityCode)) || a.citySlug.localeCompare(b.citySlug)
  );

  const fiscalYears = Object.fromEntries(SYSTEMS.map((s) => [s, new Set()]));
  const fileCount = Object.fromEntries(SYSTEMS.map((s) => [s, 0]));
  const statusCount = Object.fromEntries(SYSTEMS.map((s) => [s, {}]));
  const municipalities = [];

  for (const m of sorted) {
    const slug = m.citySlug;
    const dir = path.join(DATA_DIR, slug);
    const entry = {
      cityCode: m.cityCode,
      citySlug: slug,
      cityName: m.cityName,
      prefecture: m.prefecture ?? null,
      prefectureSlug: m.prefectureSlug ?? null,
      page: `/${m.prefectureSlug}/${slug}/`,
      systems: m.systems ?? [],
      files: [],
    };
    if (!dirSet.has(slug)) {
      warn("registry_entry_without_directory", { citySlug: slug, cityCode: m.cityCode });
      municipalities.push(entry);
      continue;
    }
    // 並びは制度の固定順（kokuho→jumin→kaigo→kouki→hoiku）→年度昇順
    const files = readdirSync(dir)
      .filter((f) => FILE_RE.test(f))
      .sort((a, b) => {
        const [, sa, ya] = a.match(FILE_RE);
        const [, sb, yb] = b.match(FILE_RE);
        return SYSTEMS.indexOf(sa) - SYSTEMS.indexOf(sb) || Number(ya) - Number(yb);
      });
    const present = new Set();
    for (const f of files) {
      const [, system, yearStr] = f.match(FILE_RE);
      const fiscalYear = Number(yearStr);
      present.add(system);
      let json;
      try {
        json = readJson(path.join(dir, f));
      } catch (e) {
        warn("unreadable_json", { citySlug: slug, file: f, message: String(e.message) });
        continue;
      }
      if (json.cityCode !== m.cityCode) warn("citycode_mismatch", { citySlug: slug, file: f, registry: m.cityCode, file_value: json.cityCode ?? null });
      if (json.citySlug !== slug) warn("cityslug_mismatch", { citySlug: slug, file: f, file_value: json.citySlug ?? null });
      if (json.fiscalYear !== undefined && json.fiscalYear !== fiscalYear) warn("fiscalyear_mismatch", { citySlug: slug, file: f, file_value: json.fiscalYear });
      const listed = entry.systems.includes(system);
      if (!listed) warn("file_not_in_registry_systems", { citySlug: slug, file: f, system });

      const status = pick(json, "meta", "status") ?? pick(json, "status");
      const rec = {
        system,
        fiscalYear,
        url: `/data/municipalities/${slug}/${f}`,
        listed,
        schemaVersion: pick(json, "meta", "schemaVersion") ?? pick(json, "schemaVersion"),
        status,
        verifiedAt: pick(json, "meta", "lifecycle", "verifiedAt") ?? pick(json, "meta", "audit", "verifiedAt"),
        validFrom: pick(json, "meta", "lifecycle", "validFrom"),
        validUntil: pick(json, "meta", "lifecycle", "validUntil"),
        updatedAt: pick(json, "meta", "lifecycle", "updatedAt"),
      };
      entry.files.push(rec);
      fiscalYears[system].add(fiscalYear);
      fileCount[system]++;
      const key = status === null ? "null" : String(status);
      statusCount[system][key] = (statusCount[system][key] || 0) + 1;
    }
    for (const s of entry.systems) {
      if (!present.has(s)) warn("registry_system_without_file", { citySlug: slug, system: s });
    }
    municipalities.push(entry);
  }

  // 不整合は種類→slug→file の順に並べる（決定論）
  warnings.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const sortedCounts = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

  const schemas = {};
  for (const s of SYSTEMS) schemas[s] = `/data/schema/${s}.schema.json`;

  return {
    $schema: "/data/schema/index.schema.json",
    title: "kokuho-keisan.jp 自治体制度データ カタログ",
    description:
      "kokuho-keisan.jp が配信する自治体ごとの制度データ（JSON）の索引。各ファイルの所在・年度・検証状態を列挙する。" +
      "値の来歴（出典 URL・検証日・検証方法）は各 JSON の meta（kokuho）または source（その他の制度）にある。",
    catalogSchemaVersion: CATALOG_SCHEMA_VERSION,
    canonical: `${BASE_URL}/data/index.json`,
    baseUrl: BASE_URL,
    license: {
      name: "Civic Rule Lab Custom License v1.0",
      url: `${REPO_URL}/blob/main/LICENSE.md`,
      summary: "参照・研究・教育・自治体職員の内部検証は無償。商用利用・再配布・類似サービスの構築は事前の書面許可が要る。",
    },
    documentation: {
      dataStructure: `${REPO_URL}/blob/main/docs/data-structure.md`,
      repository: REPO_URL,
    },
    publisher: { name: "Civic Rule Lab", url: "https://seido-keisan.jp/about/" },
    schemas,
    systems: SYSTEMS.map((s) => ({
      system: s,
      label: SYSTEM_LABELS[s],
      fiscalYears: [...fiscalYears[s]].sort((a, b) => a - b),
      fileCount: fileCount[s],
      statusCount: sortedCounts(statusCount[s]),
    })),
    counts: {
      municipalities: municipalities.length,
      files: Object.values(fileCount).reduce((a, b) => a + b, 0),
      warnings: warnings.length,
      warningsByKind: sortedCounts(warnings.reduce((acc, w) => ((acc[w.kind] = (acc[w.kind] || 0) + 1), acc), {})),
    },
    municipalities,
    warnings,
  };
}

/** 本体に generatedAt を差し込んで最終形にする。中身が前回と同じなら前回の日付を引き継ぐ。 */
export function buildIndex(previous) {
  const body = buildIndexBody();
  const today = new Date().toISOString().slice(0, 10);
  let generatedAt = today;
  if (previous && typeof previous === "object") {
    const { generatedAt: prevDate, ...prevBody } = previous;
    if (prevDate && JSON.stringify(prevBody) === JSON.stringify(body)) generatedAt = prevDate;
  }
  // generatedAt は先頭近く（$schema・title の次）に置く
  const { $schema, title, description, ...rest } = body;
  return { $schema, title, description, generatedAt, ...rest };
}

export function serialize(index) {
  return JSON.stringify(index, null, 2) + "\n";
}

function main() {
  const check = process.argv.includes("--check");
  const previous = existsSync(OUT) ? readJson(OUT) : null;
  const index = buildIndex(previous);
  const text = serialize(index);

  const c = index.counts;
  console.error(`data/index.json: 自治体 ${c.municipalities} / ファイル ${c.files} / 不整合 ${c.warnings}`);
  for (const s of index.systems) {
    console.error(`  ${s.system.padEnd(7)} 年度 ${s.fiscalYears.join(",").padEnd(10)} ${String(s.fileCount).padStart(5)} 件  status: ${JSON.stringify(s.statusCount)}`);
  }
  if (c.warnings > 0) console.error(`  不整合の内訳: ${JSON.stringify(c.warningsByKind)}`);
  if (!existsSync(SCHEMA_DIR)) console.error(`  ⚠ ${path.relative(ROOT, SCHEMA_DIR)} が無い（schemas の参照先が存在しない）`);

  if (check) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf-8") : "";
    if (current === text) {
      console.error("  --check: data/index.json は最新");
      return;
    }
    console.error("  --check: data/index.json が古い。node scripts/generate-data-index.js で再生成する");
    process.exit(1);
  }
  writeFileSync(OUT, text);
  console.error(`  書き込み: ${path.relative(ROOT, OUT)} (${text.length} bytes, generatedAt=${index.generatedAt})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
