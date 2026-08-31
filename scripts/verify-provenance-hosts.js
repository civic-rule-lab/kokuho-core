#!/usr/bin/env node
/**
 * verify-provenance-hosts.js — 出典許可リストの独自ドメインが、まだその団体のものか定期確認する
 *
 * なぜ要るか:
 *   generate-official-pages.js の PROVENANCE_HOST_PATTERNS が信頼している .lg.jp / .go.jp は
 *   自治体・国しか取得できないので、放っておいて構わない。しかし PROVENANCE_HOST_EXTRA に
 *   個別登録した独自ドメイン（.jp / .com / .net / .or.jp）はそうではない。自治体がドメインを
 *   手放せば第三者が取得でき、公開ページの「出典」リンクがそこを指し続ける。
 *   2026-06 の civic-exchange.com と 2026-07-28 の civicrulelab.jp が同じ型で乗っ取られている。
 *   許可リストに足すのは「このドメインが当該団体のものであり続ける」に賭けることなので、
 *   賭けたままにせず定期的に見に行く（規範14: 記録は対処ではない・発火する仕掛けにする）。
 *
 * 設計:
 *   - 許可リストの正本は generate-official-pages.js。本スクリプトはそれをテキストとして読むだけで、
 *     リストを複製しない（複製すると必ず片方が古くなる。実際 2026-09-01 に AI が 12 件だけの
 *     不完全なコピーで監査し、6 件を見落とした）。
 *   - 期待値は registry/provenance-host-watch.json。両者を突合し、片方にしか無いホストは ERROR。
 *     「理由を書かずに許可リストへ足した」を検知するのが目的。
 *   - 判定に LLM を使わない。HTTP ステータス・最終URLのドメイン・自己同定文字列の有無・
 *     乗っ取り語句の有無だけで決めるので、幻覚が原理的に起きない（r8-watch.js と同じ思想）。
 *   - Shift_JIS のページが実在するため、必ず charset を見てデコードする。res.text() 固定は使わない
 *     （change-detector.js が古座川で文字化けした実害がある）。
 *
 * 使い方（kokuho-core ルートから）:
 *   node scripts/verify-provenance-hosts.js            全件確認してレポートを書く
 *   node scripts/verify-provenance-hosts.js --host=... 1件だけ試す
 *   node scripts/verify-provenance-hosts.js --quiet    stdout を要約だけにする
 *
 * 終了コード: 0=全件OK / 1=要確認あり / 2=リストの突合不一致など設定上の異常
 *
 * ★初回実行では expect が実際の表記と食い違って FAIL するホストが出る。それは棚卸しであって
 *   異常とは限らない。実物を見て registry 側の expect を直すか、本当に異常なら止血する。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GEN = path.join(ROOT, "scripts", "generate-official-pages.js");
const WATCH = path.join(ROOT, "registry", "provenance-host-watch.json");
const REPORT_DIR = path.join(ROOT, "docs", "change-reports");

// HTTP ヘッダは latin1 しか持てないので ASCII のみで書く（日本語を入れると fetch が投げる）。
const UA =
  "civic-rule-lab provenance-host-watch (+https://kokuho-keisan.jp/)";

// 乗っ取り時に出た語（civic-exchange.com / civicrulelab.jp の実例に基づく）。
// ここに無い語で乗っ取られることは当然あるので、これは「出たら確実に異常」の下限であって上限ではない。
const HIJACK_WORDS = [
  "カジノ", "オンラインカジノ", "ベットカジノ", "ブックメーカー",
  "casino", "betting", "sportsbook", "poker",
  "出会い系", "バイアグラ", "viagra", "cialis",
];

function args() {
  const a = { host: null, quiet: false };
  for (const s of process.argv.slice(2)) {
    if (s.startsWith("--host=")) a.host = s.slice(7).toLowerCase();
    else if (s === "--quiet") a.quiet = true;
  }
  return a;
}

/** 許可リストの正本（generate-official-pages.js）から EXTRA のホストを読む。複製はしない。 */
function readExtraHosts() {
  const src = fs.readFileSync(GEN, "utf8");
  const m = src.match(/const PROVENANCE_HOST_EXTRA = new Set\(\[([\s\S]*?)\]\);/);
  if (!m) {
    throw new Error(
      "PROVENANCE_HOST_EXTRA を読み取れなかった。generate-official-pages.js の書式が変わった可能性がある。" +
        "本スクリプトの正規表現を実物に合わせて直すこと（リストをこちらへ複製してはいけない）。"
    );
  }
  // コメント行を落としてから文字列リテラルだけを拾う
  const body = m[1]
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
  return [...body.matchAll(/"([^"]+)"/g)].map((x) => x[1].toLowerCase());
}

/** Content-Type と meta タグから charset を決めてデコードする（Shift_JIS 対策）。 */
function decode(buf, contentType) {
  const head = Buffer.from(buf).subarray(0, 2048).toString("latin1");
  let cs =
    (contentType && /charset=["']?([\w-]+)/i.exec(contentType)?.[1]) ||
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ||
    "utf-8";
  cs = cs.toLowerCase();
  if (cs === "shift_jis" || cs === "sjis" || cs === "x-sjis" || cs === "windows-31j" || cs === "cp932") {
    cs = "shift_jis";
  }
  try {
    return new TextDecoder(cs, { fatal: false }).decode(buf);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  }
}

/** www. を落とした比較用ドメイン。リダイレクト先が別ドメインへ飛んでいないかを見る。 */
function baseDomain(host) {
  return String(host || "").toLowerCase().replace(/^www\./, "");
}

async function checkHost(host, expectation) {
  const out = { host, owner: expectation.owner, ok: false, problems: [], info: {} };
  let res = null;
  let lastErr = null;
  for (const scheme of ["https", "http"]) {
    try {
      res = await fetch(`${scheme}://${host}/`, {
        redirect: "follow",
        headers: { "User-Agent": UA, "Accept-Language": "ja" },
        signal: AbortSignal.timeout(20000),
      });
      break;
    } catch (e) {
      lastErr = e;
      res = null;
    }
  }
  if (!res) {
    out.problems.push(`接続できない: ${lastErr && lastErr.message ? lastErr.message : "不明"}`);
    return out;
  }

  out.info.status = res.status;
  out.info.finalUrl = res.url;
  if (!res.ok) out.problems.push(`HTTP ${res.status}`);

  let finalHost = "";
  try {
    finalHost = new URL(res.url).hostname.toLowerCase();
  } catch {
    /* noop */
  }
  if (finalHost && baseDomain(finalHost) !== baseDomain(host)) {
    out.problems.push(`別ドメインへリダイレクトしている: ${finalHost}`);
  }

  let text = "";
  try {
    text = decode(await res.arrayBuffer(), res.headers.get("content-type"));
  } catch (e) {
    out.problems.push(`本文を読めない: ${e.message}`);
    return out;
  }
  out.info.bytes = Buffer.byteLength(text, "utf8");

  if (expectation.expect && !text.includes(expectation.expect)) {
    out.problems.push(`自己同定の文字列が見当たらない: "${expectation.expect}"`);
  }

  const lower = text.toLowerCase();
  const hits = HIJACK_WORDS.filter((w) =>
    /[a-z]/.test(w) ? lower.includes(w) : text.includes(w)
  );
  if (hits.length) out.problems.push(`要注意の語が出た: ${hits.join(", ")}`);

  out.ok = out.problems.length === 0;
  return out;
}

/**
 * 既知の状態（known.state）と実測を突き合わせる。
 * 「今は繋がらないと分かっている」ホストを毎回 要確認 に出しても狼少年になるだけなので既知として扱う。
 * ただし状態が変わったとき（繋がるようになった／繋がらなくなった）は必ず知らせる。黙って飲み込まない。
 */
function applyKnownState(r, expectation) {
  const known = expectation.known;
  if (!known || !known.state) return r;
  const actual = r.info.status ? "reachable" : "unreachable";
  if (actual === known.state) {
    r.known = true;
    r.ok = true; // 既知どおりなので落とさない
    r.problems = [`既知の状態のまま（${known.state}）: ${known.reason || ""}`];
    return r;
  }
  r.known = false;
  r.ok = false;
  r.problems.unshift(
    `★既知の状態から変化した: ${known.state} → ${actual}（registry の known を見直すこと）`
  );
  return r;
}

async function main() {
  const a = args();

  const extra = readExtraHosts();
  const watch = JSON.parse(fs.readFileSync(WATCH, "utf8"));
  const expectations = watch.hosts || {};

  // 正本と期待値の突合。片方にしか無いものは設定上の異常として即座に落とす。
  const missingInWatch = extra.filter((h) => !expectations[h]);
  const missingInExtra = Object.keys(expectations).filter((h) => !extra.includes(h));
  if (missingInWatch.length || missingInExtra.length) {
    console.error("設定の不一致があるため確認を中止する。");
    if (missingInWatch.length) {
      console.error(
        `  許可リストにあるが registry/provenance-host-watch.json に無い（追加理由が記録されていない）:\n` +
          missingInWatch.map((h) => `    - ${h}`).join("\n")
      );
    }
    if (missingInExtra.length) {
      console.error(
        `  registry にあるが許可リストに無い（許可リストから消えた）:\n` +
          missingInExtra.map((h) => `    - ${h}`).join("\n")
      );
    }
    process.exit(2);
  }

  const targets = a.host ? extra.filter((h) => h === a.host) : extra;
  if (a.host && targets.length === 0) {
    console.error(`--host=${a.host} は許可リストに無い。`);
    process.exit(2);
  }

  console.log(`出典許可ホスト（独自ドメイン）の定期確認: ${targets.length} 件`);
  const results = [];
  for (const h of targets) {
    const r = applyKnownState(await checkHost(h, expectations[h]), expectations[h]);
    results.push(r);
    if (!a.quiet) {
      const mark = r.known ? "既知" : r.ok ? "OK  " : "要確認";
      const detail = r.problems.length ? "\n        " + r.problems.join("\n        ") : "";
      console.log(`  ${mark} ${h}  (${r.owner})${detail}`);
    }
    await new Promise((rs) => setTimeout(rs, 1500)); // 相手方への間隔
  }

  const bad = results.filter((r) => !r.ok);
  const knownCount = results.filter((r) => r.known).length;
  console.log(
    `\n結果: OK ${results.length - bad.length - knownCount} / 既知 ${knownCount} / 要確認 ${bad.length}`
  );

  // レポート（docs/change-reports/ は gitignore 済み。r8-watch と同じ置き場）
  try {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    // toISOString は UTC になり日本時間と1日ずれる日がある。ローカル日付で書く。
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const file = path.join(REPORT_DIR, `provenance-host-watch-${today}.md`);
    const lines = [
      `# 出典許可ホストの定期確認 ${today}`,
      "",
      `対象 ${results.length} 件 / OK ${results.length - bad.length} / 要確認 ${bad.length}`,
      "",
      "| ホスト | 団体 | 判定 | 内容 |",
      "|---|---|---|---|",
      ...results.map(
        (r) =>
          `| ${r.host} | ${r.owner} | ${r.known ? "既知" : r.ok ? "OK" : "要確認"} | ${
            r.problems.length ? r.problems.join(" / ") : `HTTP ${r.info.status}`
          } |`
      ),
      "",
      "要確認が出たら、まず実物を開いて自分の目で見ること。",
      "表記が変わっただけなら registry/provenance-host-watch.json の expect を直す。",
      "団体のものでなくなっていたら、generate-official-pages.js の PROVENANCE_HOST_EXTRA から外し、",
      "そのホストを出典に使っている自治体データの sourceUrls を差し替える（規範3: 記録で終わらせない）。",
    ];
    fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
    console.log(`レポート: ${path.relative(ROOT, file)}`);
  } catch (e) {
    console.warn(`レポートを書けなかった: ${e.message}`);
  }

  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : String(e));
  process.exit(2);
});
