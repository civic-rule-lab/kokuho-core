/**
 * 自治体ごとの未確定項目一覧（照会前チェック）
 *
 * 自治体へ電話・照会する前に通す。1 自治体について全制度
 * （kokuho / kaigo / kouki / jumin / hoiku）の未確定項目をまとめて出し、
 * 制度ごとに別々に電話することを防ぐ。
 *
 * 実行:
 *   node scripts/list-open-questions.js <citySlug> [<citySlug> ...]
 *   node scripts/list-open-questions.js <citySlug> --json
 *   node scripts/list-open-questions.js --summary        # 全自治体の集計
 *   node scripts/list-open-questions.js --summary --json
 *
 * 判定（data/municipalities/{slug}/{system}-{YEAR}.json の status から機械的に決める）:
 *   確定   : status が verified。hoiku の free（東京都 第1子無償化で 0 円。
 *            js/core/hoiku.js が free を 0 円として返す）も確定として扱う。
 *   未確定 : それ以外の status（provisional / inferred / needs_update など）。
 *   ファイルなし:
 *     - jumin: generate-jumin-from-spec.js は「標準値と差分ゼロ」の自治体のファイルを
 *       生成しない。生成されていれば status は PREF_STATUS 既定の inferred になるため、
 *       市町村分（超過課税の有無）は未確認として未確定に数える。
 *     - それ以外: registry の systems に載っていなければ「未収録」として数えない。
 *       載っているのにファイルが無ければ未確定に数える。
 *   notes 内の「未確認」等の記述は status と別に拾う（確定済みの制度にも残っていることがある）。
 *
 * 読むだけで、何も書き換えない。
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const REGISTRY_PATH = path.join(ROOT, "registry", "index.json");

const YEAR = 2026;
const SYSTEMS = ["kokuho", "kaigo", "kouki", "jumin", "hoiku"];
const SYSTEM_LABEL = {
  kokuho: "国保",
  kaigo: "介護",
  kouki: "後期",
  jumin: "住民税",
  hoiku: "保育",
};
const NOTE_MARKERS = /未確認|要照会|照会要|要確認|確認推奨|電話確認|not_found/;
const PHONE = /0\d{1,4}-\d{1,4}-\d{3,4}/g;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const summary = args.includes("--summary");
const slugs = args.filter((a) => !a.startsWith("--"));

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8")).municipalities;
const bySlug = new Map(registry.map((m) => [m.citySlug, m]));

function readJson(slug, system) {
  const p = path.join(DATA_DIR, slug, `${system}-${YEAR}.json`);
  if (!existsSync(p)) return null;
  return { path: path.relative(ROOT, p), data: JSON.parse(readFileSync(p, "utf-8")) };
}

const statusOf = (d) => d.status ?? d.meta?.status ?? "(status なし)";
const notesOf = (d) => [d.notes, d.meta?.notes].filter((n) => typeof n === "string").join(" / ");

function noteFlags(notes) {
  if (!notes) return [];
  return notes
    .split(/(?<=。)|\s\/\s|\n|★/)
    .map((s) => s.trim())
    .filter((s) => NOTE_MARKERS.test(s))
    .map((s) => (s.length > 160 ? s.slice(0, 160) + "…" : s));
}

function sourceUrls(d) {
  const out = new Set();
  const add = (u) => typeof u === "string" && u.startsWith("http") && out.add(u);
  const walk = (v) => {
    if (!v) return;
    if (typeof v === "string") return add(v);
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v === "object") for (const k of ["url", "rates", "kansho"]) walk(v[k]);
  };
  walk(d.source);
  walk(d.meta?.source);
  (d.meta?.lifecycle?.watchUrls || []).forEach(add);
  return [...out];
}

/** 制度ごとの「何を確かめるか」と現在値。電話口で読み上げられる粒度にする。 */
function describe(system, d) {
  switch (system) {
    case "kokuho": {
      const l = d.meta?.lifecycle || {};
      const cc = d.childcareLevy;
      return {
        ask: "令和8年度の国保税（料）率: 医療・支援・介護・子ども分の所得割／均等割／平等割、賦課限度額、子ども分の18歳以上均等割",
        basis: [l.r8Stage, l.sourceStatus, l.verificationLevel].filter(Boolean).join(" / "),
        current: {
          rate: d.rate, perCapita: d.perCapita, household: d.household, caps: d.caps,
          ...(cc ? { childcareLevy: cc } : {}),
        },
      };
    }
    case "kaigo":
      return {
        ask: "第1号介護保険料: 基準額と所得段階表（段階数・乗率・年額・境界）",
        basis: d.planPeriod || "",
        current: { baseAmount: d.baseAmount, brackets: Array.isArray(d.brackets) ? d.brackets.length : null },
      };
    case "kouki":
      return {
        ask: "後期高齢者医療保険料（広域連合）: 均等割・所得割・限度額・独自軽減",
        basis: "",
        current: { rate: d.rate, perCapita: d.perCapita, caps: d.caps },
      };
    case "jumin":
      return {
        ask: "市町村民税の超過課税（所得割・均等割）の有無と額",
        basis: "県分は spec で確認済み。市町村分 cityRate / cityPerCapita は未収録",
        current: Object.fromEntries(
          ["prefRate", "prefPerCapita", "cityRate", "cityPerCapita"].filter((k) => k in d).map((k) => [k, d[k]])
        ),
      };
    case "hoiku":
      return {
        ask: "保育料（利用者負担額）基準額表",
        basis: d.status === "free" ? `無償化 ${d.freePolicy?.since || ""}〜（第1子から）` : "",
        current: {},
      };
  }
}

function inspect(slug) {
  const reg = bySlug.get(slug);
  const regSystems = reg?.systems || [];
  const rows = [];
  const phones = new Set();
  const warnings = [];

  for (const system of SYSTEMS) {
    const f = readJson(slug, system);
    if (!f) {
      if (system === "jumin") {
        rows.push({
          system, state: "open", status: "(ファイルなし)", path: null,
          reason: "標準値と差分ゼロのため未生成（生成時の既定 status は inferred）。市町村分は未確認",
          ...describe("jumin", {}), flags: [], urls: [],
        });
      } else if (regSystems.includes(system)) {
        rows.push({ system, state: "open", status: "(ファイルなし)", path: null,
          reason: "registry の systems にあるのにデータファイルが無い", flags: [], urls: [] });
      } else {
        rows.push({ system, state: "absent", status: "(未収録)", path: null, flags: [], urls: [] });
      }
      continue;
    }
    const d = f.data;
    const status = statusOf(d);
    const confirmed = status === "verified" || (system === "hoiku" && status === "free");
    const notes = notesOf(d);
    for (const m of notes.match(PHONE) || []) phones.add(`${m}（${SYSTEM_LABEL[system]} notes）`);
    if (confirmed && !regSystems.includes(system)) {
      warnings.push(`${system}: ${status} だが registry の systems に ${system} が無い`);
    }
    rows.push({
      system,
      state: confirmed ? "confirmed" : "open",
      status,
      path: f.path,
      ...(confirmed ? {} : describe(system, d)),
      ...(system === "hoiku" && status === "free" ? { basis: describe("hoiku", d).basis } : {}),
      flags: noteFlags(notes),
      urls: confirmed ? [] : sourceUrls(d),
    });
  }

  return {
    citySlug: slug,
    cityCode: reg?.cityCode ?? null,
    cityName: reg?.cityName ?? null,
    prefecture: reg?.prefecture ?? null,
    registrySystems: regSystems,
    openSystems: rows.filter((r) => r.state === "open").map((r) => r.system),
    rows,
    phones: [...phones],
    warnings,
  };
}

function printReport(r) {
  const L = [];
  L.push(`# ${r.cityName ?? "(registry に無し)"}（${r.prefecture ?? "?"}） slug=${r.citySlug} cityCode=${r.cityCode ?? "?"}`);
  L.push(`未確定 ${r.openSystems.length} 制度: ${r.openSystems.map((s) => SYSTEM_LABEL[s]).join("・") || "なし"}`);
  L.push("");
  for (const row of r.rows) {
    const mark = row.state === "open" ? "[未確定]" : row.state === "confirmed" ? "[確定]  " : "[未収録]";
    L.push(`## ${mark} ${SYSTEM_LABEL[row.system]}(${row.system})  status=${row.status}${row.path ? `  ${row.path}` : ""}`);
    if (row.state === "open") {
      if (row.reason) L.push(`  理由: ${row.reason}`);
      if (row.ask) L.push(`  確認事項: ${row.ask}`);
      if (row.basis) L.push(`  現在値の根拠: ${row.basis}`);
      if (row.current && Object.keys(row.current).length) L.push(`  現在値: ${JSON.stringify(row.current)}`);
      for (const u of row.urls) L.push(`  出典/監視: ${u}`);
    } else if (row.basis) {
      L.push(`  ${row.basis}`);
    }
    for (const fl of row.flags) L.push(`  notes: ${fl}`);
  }
  if (r.phones.length) {
    L.push("");
    L.push("## notes に記載の電話番号（照会先の正否は各自確認）");
    for (const p of r.phones) L.push(`  ${p}`);
  }
  if (r.warnings.length) {
    L.push("");
    L.push("## 台帳の不整合");
    for (const w of r.warnings) L.push(`  ${w}`);
  }
  L.push("");
  L.push("※ データに記録されていない保留（例: 電話確認待ちの論点）は表示されない。照会前に作業記録も確認すること。");
  console.log(L.join("\n"));
}

function suggest(q) {
  return registry
    .filter((m) => m.citySlug.includes(q) || m.cityName.includes(q) || m.cityCode === q)
    .slice(0, 10)
    .map((m) => `${m.citySlug}（${m.prefecture}${m.cityName} ${m.cityCode}）`);
}

if (summary) {
  const dirs = readdirSync(DATA_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const all = dirs.map(inspect);
  const bySystem = Object.fromEntries(SYSTEMS.map((s) => [s, {}]));
  for (const r of all) for (const row of r.rows) {
    const k = `${row.state}:${row.status}`;
    bySystem[row.system][k] = (bySystem[row.system][k] || 0) + 1;
  }
  const count = (list) => {
    const hist = {};
    for (const n of list) hist[n] = (hist[n] || 0) + 1;
    return { withOpen: list.filter((n) => n >= 1).length, twoOrMore: list.filter((n) => n >= 2).length, histogram: hist };
  };
  const out = {
    fiscalYear: YEAR,
    municipalities: all.length,
    bySystem,
    all: count(all.map((r) => r.openSystems.length)),
    excludingJuminNoFile: count(all.map((r) =>
      r.rows.filter((x) => x.state === "open" && !(x.system === "jumin" && x.path === null)).length)),
    registryWarnings: all.flatMap((r) => r.warnings.map((w) => `${r.citySlug}: ${w}`)),
  };
  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`# 未確定項目の集計（${YEAR}年度・${out.municipalities}自治体）\n`);
    for (const s of SYSTEMS) {
      console.log(`${SYSTEM_LABEL[s]}(${s}): ` + Object.entries(out.bySystem[s]).map(([k, v]) => `${k}=${v}`).join("  "));
    }
    console.log("");
    console.log(`未確定を抱える自治体: ${out.all.withOpen}（2制度以上 ${out.all.twoOrMore}）  内訳 ${JSON.stringify(out.all.histogram)}`);
    console.log(`  住民税ファイルなしを除くと: ${out.excludingJuminNoFile.withOpen}（2制度以上 ${out.excludingJuminNoFile.twoOrMore}）  内訳 ${JSON.stringify(out.excludingJuminNoFile.histogram)}`);
    if (out.registryWarnings.length) {
      console.log("\n台帳の不整合:");
      for (const w of out.registryWarnings) console.log(`  ${w}`);
    }
  }
  process.exit(0);
}

if (slugs.length === 0) {
  console.error("使い方: node scripts/list-open-questions.js <citySlug> [...] [--json]");
  console.error("        node scripts/list-open-questions.js --summary [--json]");
  process.exit(1);
}

let failed = false;
const results = [];
for (const slug of slugs) {
  if (!bySlug.has(slug) || !existsSync(path.join(DATA_DIR, slug))) {
    failed = true;
    const s = suggest(slug);
    console.error(`slug "${slug}" は registry/index.json に無い。` + (s.length ? `候補: ${s.join(", ")}` : ""));
    continue;
  }
  results.push(inspect(slug));
}
if (asJson) console.log(JSON.stringify(results, null, 2));
else results.forEach((r, i) => { if (i) console.log("\n" + "-".repeat(60) + "\n"); printReport(r); });
process.exit(failed ? 1 : 0);
