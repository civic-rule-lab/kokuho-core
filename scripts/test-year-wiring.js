#!/usr/bin/env node
/**
 * 年度配線（PUBLISH_YEAR）の回帰テスト
 *
 * 背景: 2026-06-11 に発覚したバグ（PR #185）の再発防止。
 *   ページ側の `const PUBLISH_YEAR = 2026` はトップレベル const のため
 *   window のプロパティにならず、engine.js が `window.PUBLISH_YEAR || 2025`
 *   で参照していた結果、全市ページが R8 の料率表を表示しながら
 *   計算は R7 データ（kokuho-2025.json）で行われていた。
 *
 * 検証方法: 実際の生成済みページから <script>const CITY_SLUG=...; const
 *   PUBLISH_YEAR=...;</script> 宣言を抽出し、ブラウザと同じ条件
 *   （トップレベル const → グローバル字句スコープ、window には付かない）
 *   を node:vm で再現して engine.js を読み込み、fetch される JSON の
 *   年度がページ宣言と一致することを確認する。
 *
 * 実行: node scripts/test-year-wiring.js
 */
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiInputSrc = fs.readFileSync(path.join(ROOT, "js/core/shared/ui-input.js"), "utf8"); // engine.js が前提にする共通入力 UI
const engineSrc = fs.readFileSync(path.join(ROOT, "js/engine.js"), "utf8");

// ─── 生成済みページから実際の宣言を抽出（generator 側の配線も同時に検証） ───
const SAMPLE_PAGES = ["tokyo/nerima/index.html", "saitama/koshigaya/index.html"];
const samples = [];
for (const rel of SAMPLE_PAGES) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, "utf8");
  const m = html.match(/<script>(const CITY_SLUG = "[^"]+"; const PUBLISH_YEAR = (\d+);)<\/script>/);
  if (!m) {
    console.error(`❌ ${rel}: CITY_SLUG / PUBLISH_YEAR の宣言 <script> が見つかりません`);
    process.exit(1);
  }
  samples.push({ page: rel, snippet: m[1], year: Number(m[2]) });
}
if (samples.length === 0) {
  console.error("❌ 検証対象ページが存在しません（生成前？）");
  process.exit(1);
}

// ─── ブラウザ相当の vm コンテキストで engine.js を読み込む ───
function loadEngine(pageSnippet) {
  const fetched = [];
  const sandbox = {
    console,
    URLSearchParams,
    setTimeout,
    location: { search: "", pathname: "/tokyo/nerima/" },
    document: { getElementById: () => null, addEventListener: () => {} },
    fetch: async (url) => {
      fetched.push(String(url));
      return { ok: true, json: async () => ({}) };
    },
  };
  sandbox.window = sandbox; // window.location 等。const 宣言は window に付かない（ブラウザと同じ）
  vm.createContext(sandbox);
  if (pageSnippet) vm.runInContext(pageSnippet, sandbox, { filename: "page-inline.js" });
  vm.runInContext(uiInputSrc, sandbox, { filename: "ui-input.js" });
  vm.runInContext(engineSrc, sandbox, { filename: "engine.js" });
  return fetched;
}

(async () => {
  let failed = 0;

  // ケース1: 実ページの宣言どおりの年度 JSON を取得すること（PR #185 回帰）
  for (const s of samples) {
    const fetched = loadEngine(s.snippet);
    await new Promise((r) => setTimeout(r, 20)); // engine.js 読み込み時の async IIFE を待つ
    const expect = `kokuho-${s.year}.json`;
    if (fetched.some((u) => u.includes(expect))) {
      console.log(`✅ ${s.page}: PUBLISH_YEAR=${s.year} → ${expect} を取得`);
    } else {
      console.error(`❌ ${s.page}: ${expect} が取得されていません。実際: ${fetched.join(", ") || "(なし)"}`);
      console.error("   → engine.js の年度参照が window.PUBLISH_YEAR 等に退行していないか確認（PR #185）");
      failed++;
    }
  }

  // ケース2: 宣言が無いページは fail loud（暗黙の年度フォールバックをしない）
  // 旧仕様は `|| 2025` で kokuho-2025.json に静かにフォールバックしていたが、
  // 宣言漏れのまま旧年度で計算する事故（PR #185 と同型）を許すため廃止。
  // 期待動作: PUBLISH_YEAR 未宣言 → loadKokuhoData が throw → JSON を一切取得しない。
  {
    const fetched = loadEngine(null);
    await new Promise((r) => setTimeout(r, 20));
    const kokuhoFetches = fetched.filter((u) => u.includes("kokuho-"));
    if (kokuhoFetches.length === 0) {
      console.log("✅ 宣言なし → JSON を取得せずエラー（暗黙フォールバック廃止を確認）");
    } else {
      console.error(`❌ 宣言なしで JSON が取得されています（暗黙フォールバックが復活？）: ${kokuhoFetches.join(", ")}`);
      failed++;
    }
  }

  // ケース3: 介護ページ（{pref}/{slug}/kaigo/index.html）は JSON を fetch せず KAIGO_DATA を埋め込む。
  //   埋め込んだデータの fiscalYear・citySlug が、同じページの PUBLISH_YEAR・CITY_SLUG と一致すること
  //   （年度を自治体ごとに切り替える介護 R9 の配線・2026-11-10 D1。ページは R9 表示なのに中身は R8、の PR #185 型を防ぐ）
  {
    const RE = /<script>const KAIGO_DATA = (\{[\s\S]*?\}); const CITY_SLUG = "([^"]+)"; const PUBLISH_YEAR = (\d+);/;
    let checked = 0;
    const bad = [];
    for (const pref of fs.readdirSync(ROOT)) {
      const pdir = path.join(ROOT, pref);
      if (pref.startsWith(".") || pref === "node_modules" || !fs.statSync(pdir).isDirectory()) continue;
      for (const slug of fs.readdirSync(pdir)) {
        const page = path.join(pdir, slug, "kaigo", "index.html");
        if (!fs.existsSync(page)) continue;
        checked++;
        const m = fs.readFileSync(page, "utf8").match(RE);
        if (!m) { bad.push(`${pref}/${slug}: KAIGO_DATA / CITY_SLUG / PUBLISH_YEAR の宣言が見つからない`); continue; }
        let d;
        try { d = JSON.parse(m[1]); } catch (e) { bad.push(`${pref}/${slug}: KAIGO_DATA が JSON として読めない`); continue; }
        if (d.fiscalYear !== Number(m[3])) bad.push(`${pref}/${slug}: PUBLISH_YEAR=${m[3]} / KAIGO_DATA.fiscalYear=${d.fiscalYear}`);
        if (d.citySlug !== m[2]) bad.push(`${pref}/${slug}: CITY_SLUG=${m[2]} / KAIGO_DATA.citySlug=${d.citySlug}`);
      }
    }
    if (checked === 0) { console.error("❌ 介護ページが 1 枚もありません（生成前？）"); failed++; }
    else if (bad.length === 0) console.log(`✅ 介護ページ ${checked} 枚: 埋め込みデータの年度・自治体がページの宣言と一致`);
    else { console.error(`❌ 介護ページの年度・自治体の食い違い ${bad.length} 枚`); for (const b of bad.slice(0, 20)) console.error(`   ${b}`); failed++; }
  }

  if (failed) {
    console.error(`\n❌ 年度配線テスト失敗: ${failed} 件`);
    process.exit(1);
  }
  console.log("\n✅ 年度配線テスト全件通過");
})();
