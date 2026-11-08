#!/usr/bin/env node
/**
 * test-data-schema.cjs — data/municipalities/ の全 JSON と data/index.json が data/schema/ のスキーマに通るかを検査する
 *
 * なぜ要るか:
 *   data/schema/*.schema.json は機械向けに「この形で読める」と約束する文書。データ側だけ形が変わって
 *   スキーマが古くなると、約束が嘘になる。全件をスキーマに通すことで、キーの追加・型の変更があれば
 *   ここで止まり、スキーマも一緒に直すことになる（記録でなく発火する仕掛け）。
 *
 * 検査:
 *   S-1 data/schema/ に 5 制度 + index のスキーマがあり、JSON Schema draft 2020-12 を名乗っている
 *   S-2 data/municipalities/<slug>/<system>-<year>.json の全件が、制度ごとのスキーマに通る
 *   S-3 ファイル名が <system>-<year>.json の形でないものが無い
 *   S-4 data/index.json が index.schema.json に通り、municipalities の件数が台帳と一致する
 *   I-1 data/index.json が現在のデータから再生成した中身と一致するか（違えば WARN。生成し直しは
 *       node scripts/generate-data-index.js。データ PR のたびに止めない方針なので ERROR にはしない）
 *
 * 実装: 外部ライブラリを足さず、使っているキーワードだけの小さな検証器を持つ
 *   （type / const / enum / pattern / minimum / maximum / minLength / minItems /
 *     properties / required / additionalProperties / items / anyOf / $ref（#/$defs/… のみ））。
 *   スキーマ側でこれ以外のキーワードを使ったら S-1 で落とす（黙って無視しない）。
 *
 * 実行: node scripts/test-data-schema.cjs            全件
 *       node scripts/test-data-schema.cjs --verbose  違反を全部出す（既定は制度ごとに先頭 10 件）
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const SCHEMA_DIR = path.join(ROOT, "data", "schema");
const INDEX = path.join(ROOT, "data", "index.json");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const SYSTEMS = ["kokuho", "jumin", "kaigo", "kouki", "hoiku"];
const FILE_RE = /^(kokuho|jumin|kaigo|kouki|hoiku)-(\d{4})\.json$/;
const VERBOSE = process.argv.includes("--verbose");

const SUPPORTED = new Set([
  "$schema", "$id", "title", "description", "$defs", "$ref",
  "type", "const", "enum", "pattern", "minimum", "maximum", "minLength", "minItems",
  "properties", "required", "additionalProperties", "items", "anyOf",
]);

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"));

// ───────────────────────── 小さな検証器 ─────────────────────────
function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v; // string / boolean / object
}
function typeMatches(want, actual) {
  if (want === actual) return true;
  if (want === "number" && actual === "integer") return true;
  return false;
}
function resolveRef(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`$ref は #/ で始まる内部参照のみ対応: ${ref}`);
  let node = root;
  for (const seg of ref.slice(2).split("/")) {
    node = node?.[seg.replace(/~1/g, "/").replace(/~0/g, "~")];
    if (node === undefined) throw new Error(`$ref 解決失敗: ${ref}`);
  }
  return node;
}
function unknownKeywords(schema, acc = new Set()) {
  if (Array.isArray(schema)) { schema.forEach((s) => unknownKeywords(s, acc)); return acc; }
  if (!schema || typeof schema !== "object") return acc;
  for (const [k, v] of Object.entries(schema)) {
    if (!SUPPORTED.has(k)) acc.add(k);
    if (k === "properties" || k === "$defs") Object.values(v).forEach((s) => unknownKeywords(s, acc));
    else if (k === "items" || k === "additionalProperties") unknownKeywords(v, acc);
    else if (k === "anyOf") v.forEach((s) => unknownKeywords(s, acc));
  }
  return acc;
}
/** errors に "パス: 理由" を積む。 */
function validate(root, schema, value, where, errors) {
  if (schema === true) return;
  if (schema === false) { errors.push(`${where}: 許可されていない項目`); return; }
  if (schema.$ref) { validate(root, resolveRef(root, schema.$ref), value, where, errors); }
  const actual = typeOf(value);
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(t, actual))) {
      errors.push(`${where}: 型が ${types.join("|")} でなく ${actual}`);
      return; // 型が違えば以下の検査は意味を持たない
    }
  }
  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) errors.push(`${where}: 値が ${JSON.stringify(schema.const)} でなく ${JSON.stringify(value)}`);
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) errors.push(`${where}: ${JSON.stringify(value)} は enum [${schema.enum.join(", ")}] に無い`);
  if (actual === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${where}: "${value}" が pattern ${schema.pattern} に合わない`);
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${where}: 長さ ${value.length} < ${schema.minLength}`);
  }
  if (actual === "number" || actual === "integer") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${where}: ${value} < ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${where}: ${value} > ${schema.maximum}`);
  }
  if (actual === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${where}: 要素数 ${value.length} < ${schema.minItems}`);
    if (schema.items) value.forEach((v, i) => validate(root, schema.items, v, `${where}[${i}]`, errors));
  }
  if (actual === "object") {
    const props = schema.properties || {};
    for (const r of schema.required || []) if (!(r in value)) errors.push(`${where}: 必須 "${r}" が無い`);
    for (const [k, v] of Object.entries(value)) {
      if (k in props) validate(root, props[k], v, `${where}.${k}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${where}.${k}: スキーマに無いキー`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") validate(root, schema.additionalProperties, v, `${where}.${k}`, errors);
    }
  }
  if (schema.anyOf) {
    const ok = schema.anyOf.some((s) => { const e = []; validate(root, s, value, where, e); return e.length === 0; });
    if (!ok) errors.push(`${where}: anyOf のどれにも合わない`);
  }
}

// ───────────────────────── 検査本体 ─────────────────────────
let fails = 0, warns = 0;
const pass = (m) => console.log(`  ✅ ${m}`);
const fail = (m, details = []) => { fails++; console.log(`  ❌ ${m}`); details.forEach((d) => console.log(`       - ${d}`)); };
const warn = (m, details = []) => { warns++; console.log(`  ⚠  ${m}`); details.forEach((d) => console.log(`       - ${d}`)); };
const head = (arr, n = 10) => (VERBOSE ? arr : arr.slice(0, n).concat(arr.length > n ? [`… 他 ${arr.length - n} 件（--verbose で全件）`] : []));

console.log("━".repeat(70));
console.log("  data/schema/ 全件整合テスト");
console.log("━".repeat(70));

// S-1
const schemas = {};
{
  const missing = [], badDraft = [], unknown = [];
  for (const name of [...SYSTEMS, "index"]) {
    const p = path.join(SCHEMA_DIR, `${name}.schema.json`);
    if (!fs.existsSync(p)) { missing.push(`data/schema/${name}.schema.json`); continue; }
    const s = readJson(p);
    schemas[name] = s;
    if (s.$schema !== "https://json-schema.org/draft/2020-12/schema") badDraft.push(`${name}: $schema=${s.$schema}`);
    const u = unknownKeywords(s);
    if (u.size) unknown.push(`${name}: ${[...u].join(", ")}`);
  }
  if (missing.length || badDraft.length || unknown.length) fail("S-1: スキーマの所在・draft・使用キーワード", [...missing, ...badDraft, ...unknown.map((x) => `検証器が対応していないキーワード ${x}`)]);
  else pass(`S-1: data/schema/ に ${Object.keys(schemas).length} 本（${SYSTEMS.join("/")}/index）、すべて draft 2020-12、キーワードは検証器の対応範囲内`);
}

// S-2 / S-3
{
  const perSystem = Object.fromEntries(SYSTEMS.map((s) => [s, { files: 0, bad: [] }]));
  const oddNames = [];
  const dirs = fs.readdirSync(DATA_DIR).filter((d) => fs.statSync(path.join(DATA_DIR, d)).isDirectory()).sort();
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(DATA_DIR, d)).sort()) {
      const m = f.match(FILE_RE);
      if (!m) { oddNames.push(`${d}/${f}`); continue; }
      const system = m[1];
      const schema = schemas[system];
      if (!schema) continue;
      let json;
      try { json = readJson(path.join(DATA_DIR, d, f)); }
      catch (e) { perSystem[system].bad.push(`${d}/${f}: JSON として読めない (${e.message})`); continue; }
      perSystem[system].files++;
      const errors = [];
      validate(schema, schema, json, "$", errors);
      if (errors.length) perSystem[system].bad.push(`${d}/${f}: ${errors.slice(0, 3).join(" / ")}${errors.length > 3 ? ` （他 ${errors.length - 3}）` : ""}`);
    }
  }
  for (const s of SYSTEMS) {
    const { files, bad } = perSystem[s];
    if (!schemas[s]) continue;
    if (bad.length) fail(`S-2 ${s}: ${files} 件中 ${bad.length} 件がスキーマに通らない`, head(bad));
    else pass(`S-2 ${s}: ${files} 件すべてスキーマに通る`);
  }
  if (oddNames.length) fail(`S-3: <system>-<year>.json の形でないファイル ${oddNames.length} 件`, head(oddNames));
  else pass(`S-3: ${dirs.length} ディレクトリのファイル名はすべて <system>-<year>.json の形`);
}

// S-4 / I-1
{
  if (!fs.existsSync(INDEX)) fail("S-4: data/index.json が無い（node scripts/generate-data-index.js で生成する）");
  else if (schemas.index) {
    const idx = readJson(INDEX);
    const errors = [];
    validate(schemas.index, schemas.index, idx, "$", errors);
    const reg = readJson(REGISTRY).municipalities.length;
    if (idx.municipalities && idx.municipalities.length !== reg) errors.push(`$.municipalities: ${idx.municipalities.length} 件だが台帳は ${reg} 件`);
    if (idx.counts && idx.municipalities && idx.counts.municipalities !== idx.municipalities.length) errors.push(`$.counts.municipalities が municipalities の長さと違う`);
    if (errors.length) fail(`S-4: data/index.json が index.schema.json に通らない（${errors.length} 件）`, head(errors));
    else pass(`S-4: data/index.json は index.schema.json に通り、自治体 ${idx.municipalities.length} 件は台帳と一致（ファイル ${idx.counts.files} 件・不整合 ${idx.counts.warnings} 件）`);

    try {
      execFileSync(process.execPath, [path.join(ROOT, "scripts", "generate-data-index.js"), "--check"], { stdio: ["ignore", "ignore", "pipe"] });
      pass("I-1: data/index.json は現在のデータから再生成した中身と一致");
    } catch (e) {
      const msg = String(e.stderr || "").trim().split("\n").slice(-1)[0];
      warn("I-1: data/index.json が現在のデータと食い違う（公開前に node scripts/generate-data-index.js で再生成する）", [msg]);
    }
  }
}

console.log("");
console.log(`  結果: ❌ ${fails} / ⚠ ${warns}`);
process.exit(fails ? 1 : 0);
