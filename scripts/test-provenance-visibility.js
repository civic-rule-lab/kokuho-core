#!/usr/bin/env node
/**
 * test-provenance-visibility.js — 「確認済みと表示しているのに根拠を示していない」ページを検出する
 *
 * なぜ要るか:
 *   2026-09-09 に、深川市・松野町・津和野町の3ページが本番で
 *   「✓ 令和8年度 公式データ確認済み」と表示しながら、出典を1件も出していないことが判明した。
 *   読者は確認したという主張だけを受け取り、確かめる手段を持たない状態が数日続いていた。
 *
 *   原因は、バッジ（buildTrustBadge）が meta.status だけを見て ✓ を出す一方、
 *   根拠節（buildProvenance）は許可ホストの出典URLが無いと節ごと落ちる、という
 *   ずれだった。両者は今は pickPublicSourceUrl() を共有しているが、片方だけ触れば
 *   同じずれが再発する。
 *
 *   そして気づけなかった理由は、これを見る仕掛けが無かったこと。生成器は警告を出すが、
 *   その生成器は CI で走らない。手元で生成した人が警告を見落とせば、それで終わる。
 *   （規範14: 記録は対処ではない。発火する仕掛けにする）
 *
 * 設計:
 *   - データやロジックではなく「生成された HTML そのもの」を見る。判定側を誰かが壊しても
 *     出力に現れるため検出できる。許可リストや判定関数を複製しないので、片方が古くなる事故が
 *     起きない（verify-provenance-hosts.js と同じ思想）。
 *   - 判定は文字列の有無だけ。LLM も推論も使わないので幻覚が起きない。
 *
 * 検査:
 *   E-1 「公式データ確認済み」バッジがあるのに根拠節が無い          → ERROR
 *   E-2 「一次資料照合中」バッジ（◔）なのに根拠節がある            → ERROR（◔ の定義と矛盾）
 *   E-3 県ページが ✓（全件確認済み）なのに未確認の自治体がある      → ERROR
 *   E-4 県ページが「参考値」カードなのに確認済みの自治体がある      → ERROR
 *   E-5 県ページが表示している実数がデータと合っていない（再生成漏れ）→ ERROR
 *   E-6 県ページのリンク先の自治体ページが存在しない（404になる）   → ERROR
 *   E-7 トップが無条件に「令和8年度の公式値」と書いている           → ERROR
 *   I-1 ◔ の件数と対象自治体を出力（経過観察用・増減を CI ログで追う）
 *   I-2 県ページ47本の3状態の内訳を出力
 *
 * 2026-09-10 追記（E-3〜E-6）:
 *   市区町村ページだけを見ていたため、その上の2階層を見落としていた。実測で、
 *   県ページ47本すべてが無条件に「令和8年度（2026年度）公式データ確認済み」を
 *   出しており、うち40県は事実と一致していなかった（沖縄・山梨・高知は確認済みが
 *   0件のまま ✓ を出していた）。トップも publishYear を数えて「令和8年度の公式値を
 *   使用しています」と書いていた。県ページは deploy の生成4本に含まれず、
 *   2026-05-13 から4か月ドリフトしていた。
 *
 * 使い方: node scripts/test-provenance-visibility.js [--quiet]
 * 終了コード: 0=OK / 1=ERROR あり
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QUIET = process.argv.includes("--quiet");

const BADGE_VERIFIED = "公式データ確認済み";
const BADGE_QUARTER  = "一次資料照合中";
const PROVENANCE     = 'class="provenance"';

// {pref}/{slug}/*.html を集める。深さ2固定なので再帰しない（生成物の構造がそうなっている）。
function collectPages() {
  const out = [];
  for (const pref of readdirSync(ROOT)) {
    if (pref.startsWith(".") || pref.startsWith("_")) continue;
    const prefPath = path.join(ROOT, pref);
    let st;
    try { st = statSync(prefPath); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const slug of readdirSync(prefPath)) {
      const dir = path.join(prefPath, slug);
      try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
      for (const f of ["index.html", "income.html"]) {
        const p = path.join(dir, f);
        try { statSync(p); } catch { continue; }
        out.push(path.relative(ROOT, p));
      }
    }
  }
  return out.sort();
}

const pages = collectPages();
const verifiedNoProv = [];
const quarterWithProv = [];
const quarter = new Set();
let verifiedCount = 0;

for (const rel of pages) {
  const html = readFileSync(path.join(ROOT, rel), "utf-8");
  const hasProv = html.includes(PROVENANCE);
  // ◔ のラベルは「一次資料照合中」。「一次資料確認済み / 一部照合中」(◐) と
  // 部分一致しないよう、◐ のラベルを先に除いてから判定する。
  const isQuarter = html.replace(/一次資料確認済み \/ 一部照合中/g, "").includes(BADGE_QUARTER);
  const isVerified = html.includes(BADGE_VERIFIED);

  if (isVerified) verifiedCount++;
  if (isVerified && !hasProv) verifiedNoProv.push(rel);
  if (isQuarter) {
    quarter.add(path.dirname(rel));
    if (hasProv) quarterWithProv.push(rel);
  }
}

const line = (s) => { if (!QUIET) console.log(s); };

line("");
line("═".repeat(70));
line("  出典表示の整合性チェック");
line("═".repeat(70));
line(`  対象ページ: ${pages.length}`);
line(`  「${BADGE_VERIFIED}」を表示: ${verifiedCount}`);
line(`  「${BADGE_QUARTER}」を表示: ${quarter.size} 自治体`);
for (const d of [...quarter].sort()) line(`      ${d}`);
line("");

let failed = 0;

if (verifiedNoProv.length === 0) {
  line(`  ✅ E-1: 「${BADGE_VERIFIED}」と表示しているページは全て根拠節を持つ`);
} else {
  failed++;
  console.error(`  ❌ E-1: 「${BADGE_VERIFIED}」と表示しているのに根拠節が無い ${verifiedNoProv.length} 件`);
  for (const p of verifiedNoProv.slice(0, 20)) console.error(`      ${p}`);
  if (verifiedNoProv.length > 20) console.error(`      … 他 ${verifiedNoProv.length - 20} 件`);
  console.error(`      確認したと主張しながら根拠を示していない状態です。`);
  console.error(`      出典URLが許可ホスト外なら、バッジは ◔「${BADGE_QUARTER}」になるはずです。`);
}

if (quarterWithProv.length === 0) {
  line(`  ✅ E-2: 「${BADGE_QUARTER}」のページは根拠節を持たない（定義どおり）`);
} else {
  failed++;
  console.error(`  ❌ E-2: 「${BADGE_QUARTER}」なのに根拠節がある ${quarterWithProv.length} 件`);
  for (const p of quarterWithProv) console.error(`      ${p}`);
  console.error(`      根拠節を出せるなら ✓ か ◐ が正しい表示です。`);
}

// ─── E-3〜E-6: 県ページとトップ ───────────────────────────────────
// 県ページは県内の集合なので、状態はデータから導出しないと検証できない。
// ここで読むのは lifecycle という一次の事実であり、判定ロジックの複製ではない。
const PREF_BADGE_FULL     = '<span class="pref-page-badge">';
const PREF_BADGE_PARTIAL  = 'pref-page-badge pref-page-badge--partial';
const PREF_NOTE_STANDARD  = '<div class="pref-standard-note">';
const TOP_UNCONDITIONAL   = "料率は令和8年度の公式値を使用しています";

function loadRegistry() {
  try {
    return JSON.parse(readFileSync(path.join(ROOT, "registry", "index.json"), "utf-8"));
  } catch { return null; }
}

const registry = loadRegistry();
const prefFullNotAll = [];
const prefNoteButVerified = [];
const prefDeadLinks = [];
const prefCountStale = [];
let prefFull = 0, prefPartial = 0, prefNone = 0, prefChecked = 0;
let topUnconditional = false;
let statsTotal = 0, statsVerified = 0;

if (registry) {
  const byPref = {};
  for (const m of registry.municipalities) {
    if (!m.systems?.includes("kokuho")) continue;
    const ps = m.prefectureSlug;
    if (!ps) continue;
    (byPref[ps] = byPref[ps] || []).push(m);
  }
  for (const [ps, munis] of Object.entries(byPref)) {
    const prefIndex = path.join(ROOT, ps, "index.html");
    let html;
    try { html = readFileSync(prefIndex, "utf-8"); } catch { continue; }
    if (!html.includes("pref-jumin-box")) continue; // 県ページのテンプレ由来でなければ対象外
    prefChecked++;

    let verified = 0, total = 0;
    for (const m of munis) {
      const f = path.join(ROOT, "data", "municipalities", m.citySlug, "kokuho-2026.json");
      let j;
      try { j = JSON.parse(readFileSync(f, "utf-8")); } catch { continue; }
      total++;
      if (j?.meta?.lifecycle?.r8Stage === "verified_r8") verified++;
    }
    statsTotal += total; statsVerified += verified;

    const isNote    = html.includes(PREF_NOTE_STANDARD);
    const isPartial = html.includes(PREF_BADGE_PARTIAL);
    const isFull    = !isNote && !isPartial && html.includes(PREF_BADGE_FULL);
    if (isNote) prefNone++; else if (isPartial) prefPartial++; else if (isFull) prefFull++;

    if (isFull && verified !== total) prefFullNotAll.push(`${ps} (${verified}/${total})`);
    if (isNote && verified > 0)       prefNoteButVerified.push(`${ps} (${verified}/${total})`);

    // 表示している実数が古くないか。これが無いと、昇格しても県ページを再生成し忘れた
    // ときに「18/19自治体」のような古い数字が残り続ける（E-3/E-4 は一部表示のままなので
    // 鳴らない）。県ページが2026-05-13から4か月ドリフトしていた原因がこれ。
    if (isPartial) {
      const shown = html.match(/(\d+)\/(\d+)自治体が公式データ確認済み/);
      if (!shown) {
        prefCountStale.push(`${ps} (数字を読み取れない)`);
      } else if (Number(shown[1]) !== verified || Number(shown[2]) !== total) {
        prefCountStale.push(`${ps} 表示 ${shown[1]}/${shown[2]} → 実データ ${verified}/${total}`);
      }
    }

    // リンク先の実体があるか（県ページから 404 へ飛ばさない）
    for (const mm of html.matchAll(new RegExp(`href="/${ps}/([a-z0-9-]+)/"`, "g"))) {
      const target = path.join(ROOT, ps, mm[1], "index.html");
      try { statSync(target); } catch { prefDeadLinks.push(`${ps}/${mm[1]}`); }
    }
  }

  try {
    const top = readFileSync(path.join(ROOT, "index.html"), "utf-8");
    topUnconditional = top.includes(TOP_UNCONDITIONAL) && statsVerified !== statsTotal;
  } catch { /* トップが無ければ検査しない */ }
}

line("");
line(`  県ページ: ${prefChecked} 本 — 全件確認済み ${prefFull} / 一部 ${prefPartial} / 参考値のみ ${prefNone}`);
line("");

if (prefFullNotAll.length === 0) {
  line("  ✅ E-3: ✓ を出している県ページは県内全件が確認済み");
} else {
  failed++;
  console.error(`  ❌ E-3: ✓ を出しているのに未確認の自治体がある県 ${prefFullNotAll.length} 件`);
  for (const x of prefFullNotAll) console.error(`      ${x}`);
  console.error("      県内に未確認が残るなら、実数を出すバッジになるはずです。");
}

if (prefNoteButVerified.length === 0) {
  line("  ✅ E-4: 「参考値」カードの県は確認済みが0件");
} else {
  failed++;
  console.error(`  ❌ E-4: 「参考値」カードなのに確認済みがある県 ${prefNoteButVerified.length} 件`);
  for (const x of prefNoteButVerified) console.error(`      ${x}`);
}

if (prefCountStale.length === 0) {
  line("  ✅ E-5: 県ページが表示している実数はデータと一致");
} else {
  failed++;
  console.error(`  ❌ E-5: 県ページの数字が古い ${prefCountStale.length} 件`);
  for (const x of prefCountStale) console.error(`      ${x}`);
  console.error("      node scripts/generate-prefecture-pages.js を実行してください。");
}

if (prefDeadLinks.length === 0) {
  line("  ✅ E-6: 県ページのリンク先は全て実体がある");
} else {
  failed++;
  console.error(`  ❌ E-6: リンク先の自治体ページが無い ${prefDeadLinks.length} 件（本番で 404 になります）`);
  for (const x of prefDeadLinks.slice(0, 20)) console.error(`      ${x}`);
  console.error("      generate-prefecture-pages.js の kokuho フィルタを確認してください。");
}

if (!topUnconditional) {
  line("  ✅ E-7: トップの注記は検証状態と矛盾しない");
} else {
  failed++;
  console.error("  ❌ E-7: トップが「令和8年度の公式値を使用しています」と書いているが、");
  console.error(`      実際の確認済みは ${statsVerified}/${statsTotal} 自治体です。`);
}

line("");
if (failed === 0) {
  line("  🎉 整合性チェック合格");
  line("");
  process.exit(0);
}
console.error(`\n  ${failed} 件の不整合があります\n`);
process.exit(1);
