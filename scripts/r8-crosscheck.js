#!/usr/bin/env node
/**
 * r8-crosscheck.js — 「当方の登録値が公式ページに今も載っているか」の決定論的トリアージ
 *
 * なぜ作ったか（2026-08-01）:
 *   change-detector が7週間ぶりに完走し changed=107件（ユニーク85URL）が出た。
 *   全部を人が目視すると数時間かかるが、大半は文言・レイアウト変更で数値は不変。
 *   「当方JSONの数値が、そのページ本文に今も文字列として存在するか」を機械で判定すれば、
 *   全一致のものを低優先へ落とせる。残った不一致だけを人が見る。
 *
 * 設計思想（r8-watch.js と同じ）:
 *   判定に LLM を使わない。数値の「文字列としての出現」だけを見るので幻覚が起きない。
 *   ★これは検証ではなくトリアージである。
 *     - 全一致 = 「載っている数値が変わっていない可能性が高い」であって「正しい」ではない
 *       （旧年度表が併記されているページでは、古い値も残るので一致してしまう）
 *     - 不一致 = 「人が見るべき」。改定かもしれないし、表記ゆれ（4万7,600円等）かもしれない
 *   採用・修正の判断は従来どおり人／セッションの仕事。
 *
 * ★レポートに外部ページの本文を一切書かない（r8-watch で踏んだ denylist 事故の再発防止）。
 *   出力するのは「当方の値」と「見つかったか否か」だけ。
 *
 * 使い方（kokuho-core ルートから）:
 *   node scripts/r8-crosscheck.js --from-report=docs/change-reports/2026-08-01.md
 *   node scripts/r8-crosscheck.js --slugs=chigasaki,hachioji
 *   node scripts/r8-crosscheck.js --from-report=... --limit=20
 *   node scripts/r8-crosscheck.js --slugs=kyoto --verbose   個別に期待値の内訳を出す
 *
 * 出力:
 *   docs/change-reports/r8-crosscheck-YYYY-MM-DD.md（gitignore 対象）
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const MUNI_DIR = path.join(REPO_ROOT, "data/municipalities");
const REPORTS_DIR = path.join(REPO_ROOT, "docs/change-reports");

// 連絡先はサイトURLのみ（pre-commit が個人メールの混入を弾く。GOVERNANCE.md §C-4）
const USER_AGENT = "kokuho-keisan-crosscheck/1.0 (+https://kokuho-keisan.jp)";
const FETCH_TIMEOUT_MS = 30000;
const DELAY_MS = 900;
const FISCAL_YEAR = 2026;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}
const HAS = (name) => process.argv.includes(`--${name}`);

function todayJST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// ─── 文字コード（r8-watch.js と同じ作法。Shift_JIS の自治体が実在する） ────
function detectCharset(buf, contentType) {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType || "");
  if (fromHeader) return fromHeader[1].toLowerCase();
  const head = Buffer.from(buf.slice(0, 4096)).toString("latin1");
  const m =
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head) ||
    /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head);
  return m ? m[1].toLowerCase() : "utf-8";
}

function decodeHtml(buf, contentType) {
  const cs = detectCharset(buf, contentType);
  const alias = { sjis: "shift_jis", "x-sjis": "shift_jis", "shift-jis": "shift_jis", eucjp: "euc-jp" };
  const label = alias[cs] || cs;
  try {
    return new TextDecoder(label).decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

function stripTags(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// 全角数字・全角カンマ・全角ピリオドを半角へ寄せる（自治体ページに実在する）
function normalizeDigits(s) {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/．/g, ".")
    .replace(/，/g, ",")
    .replace(/％/g, "%");
}

// ─── 期待値の作り方 ───────────────────────────────────────────────
// 1つの「期待値」につき複数の表記候補を持ち、どれか1つでも本文にあれば「見つかった」。
function pctVariants(rate) {
  // 0.0751 -> "7.51" / 0.028 -> "2.8" と "2.80" / 0.0027 -> "0.27"
  const raw = Number((rate * 100).toFixed(6));
  const out = new Set();
  out.add(String(raw));
  for (const d of [1, 2, 3]) out.add(raw.toFixed(d));
  return [...out];
}

function yenVariants(n) {
  const out = new Set([String(n), n.toLocaleString("en-US")]);
  // 限度額は「67万円」表記が主流
  if (n >= 10000 && n % 10000 === 0) out.add(`${n / 10000}万`);
  return [...out];
}

function buildExpectations(data) {
  const exp = [];
  const push = (label, variants) => {
    const v = variants.filter((s) => s && s !== "0");
    if (v.length) exp.push({ label, variants: v });
  };

  const R = data.rate || {};
  const P = data.perCapita || {};
  const H = data.household || {};
  const C = data.caps || {};

  if (R.medical) push("医療 所得割率", pctVariants(R.medical));
  if (R.support) push("支援金 所得割率", pctVariants(R.support));
  if (R.care) push("介護 所得割率", pctVariants(R.care));

  if (P.medical) push("医療 均等割", yenVariants(P.medical));
  if (P.support) push("支援金 均等割", yenVariants(P.support));
  if (P.care) push("介護 均等割", yenVariants(P.care));

  if (H.medical) push("医療 平等割", yenVariants(H.medical));
  if (H.support) push("支援金 平等割", yenVariants(H.support));
  if (H.care) push("介護 平等割", yenVariants(H.care));

  if (C.medical) push("医療 限度額", yenVariants(C.medical));
  if (C.support) push("支援金 限度額", yenVariants(C.support));
  if (C.care) push("介護 限度額", yenVariants(C.care));

  // 子ども・子育て支援金分（R8新設）
  const cc = data.childcareLevy || data.childcare;
  if (cc) {
    if (cc.rate) push("子ども 所得割率", pctVariants(cc.rate));
    // 均等割: perCapitaAdult 分割型の自治体は、ページに「合算値」でなく
    // 「部品」で載ることが多い（★2026-08-01 実測: 静岡市は 1,700円＋18歳以上100円 と
    // 分けて掲載しており、合算 1,800 を探した初版は 30件規模の誤検知を出した）。
    // → 合算値・perCapita 単体のどちらかが本文にあれば「見つかった」とする。
    //   （adult 加算分は 100円/60円 など短すぎて偶然一致するため、単独では照合しない）
    if (cc.perCapitaAdult !== undefined) {
      const combined =
        cc.perCapitaAdultScope === "adults_only"
          ? cc.perCapitaAdult || 0
          : (cc.perCapita || 0) + (cc.perCapitaAdult || 0);
      const variants = [
        ...(combined ? yenVariants(combined) : []),
        ...(cc.perCapita ? yenVariants(cc.perCapita) : []),
      ];
      push("子ども 均等割", [...new Set(variants)]);
    } else if (cc.perCapita) {
      push("子ども 均等割", yenVariants(cc.perCapita));
    }
    if (cc.household) push("子ども 平等割", yenVariants(cc.household));
    if (cc.cap) push("子ども 限度額", yenVariants(cc.cap));
  }
  return exp;
}

// ─── 取得 ─────────────────────────────────────────────────────────
async function fetchText(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Cache-Control": "no-store" },
      cache: "no-store",
      redirect: "follow",
      signal: ctl.signal,
    });
    if (!res.ok) return { ok: false, status: `HTTP ${res.status}` };
    const buf = await res.arrayBuffer();
    const html = decodeHtml(buf, res.headers.get("content-type"));
    return {
      ok: true,
      status: `HTTP ${res.status}`,
      text: normalizeDigits(stripTags(html)),
      lastModified: res.headers.get("last-modified") || null,
    };
  } catch (e) {
    return { ok: false, status: `fetch failed: ${e.name === "AbortError" ? "timeout" : e.message}` };
  } finally {
    clearTimeout(timer);
  }
}

// ─── 対象の決め方 ─────────────────────────────────────────────────
async function slugsFromReport(reportPath) {
  const md = await fs.readFile(path.join(REPO_ROOT, reportPath), "utf8");
  // changed セクション（"## ⚠ 変更検知"）から "- [ ] **slug** (…" を拾う
  const start = md.indexOf("## ⚠");
  const end = md.indexOf("## ❌", start === -1 ? 0 : start);
  const body = md.slice(start === -1 ? 0 : start, end === -1 ? md.length : end);
  const slugs = [...body.matchAll(/^- \[ \] \*\*([a-z0-9-]+)\*\*/gim)].map((m) => m[1]);
  return [...new Set(slugs)];
}

async function loadMuni(slug) {
  const p = path.join(MUNI_DIR, slug, `kokuho-${FISCAL_YEAR}.json`);
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

function sourceUrlsOf(data) {
  const urls = data?.meta?.lifecycle?.sourceUrls || data?.meta?.sourceUrls || [];
  return urls.filter((u) => /^https?:\/\//i.test(u) && !/\.pdf(\?|#|$)/i.test(u));
}

// ─── 本体 ─────────────────────────────────────────────────────────
async function main() {
  const fromReport = arg("from-report");
  const slugsArg = arg("slugs");
  const limit = Number(arg("limit", "0")) || 0;
  const verbose = HAS("verbose");

  let slugs = [];
  if (slugsArg) slugs = slugsArg.split(",").map((s) => s.trim()).filter(Boolean);
  else if (fromReport) slugs = await slugsFromReport(fromReport);
  else {
    console.error("--from-report=<path> か --slugs=a,b,c のどちらかを指定してください。");
    process.exit(1);
  }
  if (limit) slugs = slugs.slice(0, limit);

  console.log(`[crosscheck] 対象 ${slugs.length} 自治体`);

  const results = [];
  let n = 0;
  for (const slug of slugs) {
    n += 1;
    process.stdout.write(`\r[${n}/${slugs.length}] ${slug}                    `);
    const data = await loadMuni(slug);
    if (!data) {
      results.push({ slug, cityName: "(データなし)", state: "no_data" });
      continue;
    }
    const urls = sourceUrlsOf(data);
    if (!urls.length) {
      results.push({ slug, cityName: data.cityName, state: "no_url" });
      continue;
    }
    const exp = buildExpectations(data);
    // 複数URLの本文を連結して照合する（区分ごとにページが分かれている自治体があるため）
    let combined = "";
    const urlStates = [];
    for (const u of urls) {
      const r = await fetchText(u);
      urlStates.push({ url: u, status: r.status, lastModified: r.lastModified || null });
      if (r.ok) combined += " " + r.text;
      await sleep(DELAY_MS);
    }
    const missing = exp.filter((e) => !e.variants.some((v) => combined.includes(v)));
    const fetched = urlStates.some((s) => s.status.startsWith("HTTP 2"));
    results.push({
      slug,
      cityName: data.cityName,
      r8Stage: data?.meta?.lifecycle?.r8Stage || "",
      state: !fetched ? "fetch_error" : missing.length === 0 ? "all_found" : "missing",
      expected: exp.length,
      missing,
      urlStates,
      verbose,
    });
  }
  process.stdout.write("\n");

  // ─── レポート ───────────────────────────────────────────────────
  const today = todayJST();
  const byState = (s) => results.filter((r) => r.state === s);
  const L = [];
  L.push(`# 登録値クロスチェック — ${today}`);
  L.push("");
  L.push(`**対象:** ${results.length} 自治体（${fromReport ? `出典: ${fromReport} の changed` : "--slugs 指定"}）`);
  L.push("");
  L.push("**これはトリアージであって検証ではない。** 当方 JSON の数値が公式ページ本文に");
  L.push("文字列として存在するかだけを機械判定している。全一致でも「旧年度表の併記」で");
  L.push("一致し得るし、不一致でも表記ゆれ（4万7,600円 等）のことがある。採用・修正の");
  L.push("判断は人が行う。");
  L.push("");
  L.push("| 状態 | 件数 |");
  L.push("|---|---|");
  L.push(`| ✅ 全期待値が本文にあり（低優先） | ${byState("all_found").length} |`);
  L.push(`| ⚠ 一部が見つからない（要目視） | ${byState("missing").length} |`);
  L.push(`| ❌ 取得失敗 | ${byState("fetch_error").length} |`);
  L.push(`| ⏭ データ/URLなし | ${byState("no_data").length + byState("no_url").length} |`);
  L.push("");
  L.push("---");
  L.push("");
  L.push(`## ⚠ 要目視 ${byState("missing").length} 件`);
  L.push("");
  for (const r of byState("missing")) {
    L.push(`- [ ] **${r.slug}**（${r.cityName}・${r.r8Stage}）— 期待 ${r.expected} 項目中 ${r.missing.length} 件が本文に見当たらない`);
    for (const m of r.missing) L.push(`  - ${m.label}: 当方の値 \`${m.variants[0]}\``);
    for (const u of r.urlStates) L.push(`  - ${u.status} ${u.url}${u.lastModified ? `（last-modified: ${u.lastModified}）` : ""}`);
  }
  L.push("");
  L.push(`## ❌ 取得失敗 ${byState("fetch_error").length} 件`);
  L.push("");
  for (const r of byState("fetch_error")) {
    L.push(`- **${r.slug}**（${r.cityName}）`);
    for (const u of r.urlStates) L.push(`  - ${u.status} ${u.url}`);
  }
  L.push("");
  L.push(`## ✅ 全期待値が本文にあり ${byState("all_found").length} 件（低優先）`);
  L.push("");
  L.push(byState("all_found").map((r) => `${r.slug}(${r.cityName})`).join("、") || "（なし）");
  L.push("");
  const skipped = [...byState("no_data"), ...byState("no_url")];
  if (skipped.length) {
    L.push(`## ⏭ データ/URLなし ${skipped.length} 件`);
    L.push("");
    L.push(skipped.map((r) => `${r.slug}(${r.cityName})`).join("、"));
    L.push("");
  }

  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const out = path.join(REPORTS_DIR, `r8-crosscheck-${today}.md`);
  await fs.writeFile(out, L.join("\n") + "\n", "utf8");
  console.log(`[crosscheck] レポート: ${out}`);
  console.log(
    `[crosscheck] 全一致=${byState("all_found").length} / 要目視=${byState("missing").length} / 取得失敗=${byState("fetch_error").length} / スキップ=${skipped.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
