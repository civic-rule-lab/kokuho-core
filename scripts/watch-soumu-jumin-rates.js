#!/usr/bin/env node
/**
 * watch-soumu-jumin-rates.js — 住民税 市町村分の根拠資料（総務省）の更新を検知する
 *
 * なぜ要るか:
 *   住民税データの市町村分は data/reference/soumu-jumin-city-rates-r7.json（総務省・令和7年4月1日現在）
 *   で裏付けているが、データは令和8年度。令和8年4月1日現在の版が出たら差し替えて status 昇格を
 *   判断する、と決めた。記録しただけでは誰も気づかないので、公表を検知して知らせる（規範14）。
 *
 * 見るもの（どれか1つでも該当すれば「要対応」）:
 *   1. 参照ファイルの sources[] の PDF が同じ URL のまま差し替えられていないか（sha256 比較）
 *   2. 「超過課税の状況」ページに次の基準日（例: 令和8年4月1日現在）の表記が出たか
 *   3. 「地方税に関する参考計数資料」の次の版の表13 PDF が公開されたか
 *
 * 設計:
 *   - 判定に LLM を使わない。HTTP ステータス・sha256・固定文字列の有無だけで決める（r8-watch.js と同じ思想）
 *   - 期待値は参照ファイルから導く（asOf・sources の URL と sha256）。本スクリプトに値を複製しない
 *   - Shift_JIS のページがあるため charset を見てデコードする
 *   - 全角数字を半角に揃えてから探す（総務省の PDF・ページは「令和７年４月１日」のように全角が混ざる）
 *
 * 使い方（kokuho-core ルートから）:
 *   node scripts/watch-soumu-jumin-rates.js           確認してレポートを書く
 *   node scripts/watch-soumu-jumin-rates.js --json    結果を JSON で stdout に出す（レポートも書く）
 *
 * 終了コード: 0=変化なし / 1=要対応（新版の公表・差し替えを検知） / 2=取得失敗などで判定できない
 *
 * レポート: docs/change-reports/soumu-jumin-watch-YYYY-MM-DD.md（docs/change-reports/ は gitignore 済み）
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF_PATH = path.join(ROOT, "data", "reference", "soumu-jumin-city-rates-r7.json");
const REPORT_DIR = path.join(ROOT, "docs", "change-reports");
const UA = "kokuho-core soumu-jumin-watch (+https://github.com/civic-rule-lab/kokuho-core)";
const asJson = process.argv.includes("--json");

const CHOUKA_PAGE = "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/149767_25.html";
const ICHIRAN_BASE = "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/pdf";

const ref = JSON.parse(fs.readFileSync(REF_PATH, "utf-8"));
const asOfYear = Number(ref.asOf.slice(0, 4));
const currentReiwa = asOfYear - 2018; // 2025 → 令和7
const nextReiwa = currentReiwa + 1;
const currentMarker = `令和${currentReiwa}年4月1日現在`;
const nextMarker = `令和${nextReiwa}年4月1日現在`;

// 参照中の参考計数資料の版（ichiran06_r08 → 8）。次の版の表13 を探す。
const ichiranSrc = ref.sources.find((s) => /ichiran06_r(\d+)_13\.pdf$/.test(s.url));
const currentEdition = ichiranSrc ? Number(/ichiran06_r(\d+)_13\.pdf$/.exec(ichiranSrc.url)[1]) : null;
const nextEdition = currentEdition === null ? null : currentEdition + 1;
const pad2 = (n) => String(n).padStart(2, "0");
const nextIchiranUrl =
  nextEdition === null ? null : `${ICHIRAN_BASE}/ichiran06_r${pad2(nextEdition)}/ichiran06_r${pad2(nextEdition)}_13.pdf`;

const toHalfWidthDigits = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

function decode(buf, contentType) {
  const head = Buffer.from(buf).subarray(0, 2048).toString("latin1");
  let cs =
    (contentType && /charset=["']?([\w-]+)/i.exec(contentType)?.[1]) ||
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ||
    "utf-8";
  cs = cs.toLowerCase();
  if (["shift_jis", "sjis", "x-sjis", "windows-31j", "cp932"].includes(cs)) cs = "shift_jis";
  try {
    return new TextDecoder(cs, { fatal: false }).decode(buf);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  }
}

async function get(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": UA, "Accept-Language": "ja" },
    signal: AbortSignal.timeout(30000),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, ok: res.ok, finalUrl: res.url, contentType: res.headers.get("content-type") || "", buf };
}

const isPdf = (buf) => buf.subarray(0, 5).toString("latin1") === "%PDF-";

const results = []; // { check, state: "ok" | "changed" | "error", detail }

// 1. 参照中の PDF が差し替えられていないか
for (const s of ref.sources) {
  const check = `出典の差し替え: ${s.title}`;
  try {
    const r = await get(s.url);
    if (!r.ok) {
      results.push({ check, state: "error", detail: `HTTP ${r.status} ${s.url}` });
    } else if (!isPdf(r.buf)) {
      results.push({ check, state: "error", detail: `PDF でない応答（${r.contentType}）${s.url}` });
    } else {
      const h = sha256(r.buf);
      results.push(
        h === s.sha256
          ? { check, state: "ok", detail: `sha256 一致 ${s.url}` }
          : { check, state: "changed", detail: `sha256 が変わった（記録 ${s.sha256.slice(0, 12)}… → 現在 ${h.slice(0, 12)}…）${s.url}` }
      );
    }
  } catch (e) {
    results.push({ check, state: "error", detail: `取得失敗: ${e.message} ${s.url}` });
  }
}

// 2. 「超過課税の状況」ページの基準日
{
  const check = `超過課税の状況ページに「${nextMarker}」が出たか`;
  try {
    const r = await get(CHOUKA_PAGE);
    if (!r.ok) {
      results.push({ check, state: "error", detail: `HTTP ${r.status} ${CHOUKA_PAGE}` });
    } else {
      const text = toHalfWidthDigits(decode(r.buf, r.contentType)).replace(/\s+/g, "");
      if (text.includes(nextMarker)) {
        results.push({ check, state: "changed", detail: `「${nextMarker}」の表記あり ${CHOUKA_PAGE}` });
      } else if (!text.includes(currentMarker)) {
        results.push({
          check,
          state: "changed",
          detail: `「${currentMarker}」も「${nextMarker}」も見当たらない（ページ構成が変わった可能性）${CHOUKA_PAGE}`,
        });
      } else {
        results.push({ check, state: "ok", detail: `「${currentMarker}」のまま ${CHOUKA_PAGE}` });
      }
    }
  } catch (e) {
    results.push({ check, state: "error", detail: `取得失敗: ${e.message} ${CHOUKA_PAGE}` });
  }
}

// 3. 参考計数資料の次の版
if (nextIchiranUrl) {
  const check = `地方税に関する参考計数資料 令和${nextEdition}年度版 表13 の公開`;
  try {
    const r = await get(nextIchiranUrl);
    if (r.ok && isPdf(r.buf)) {
      results.push({ check, state: "changed", detail: `公開を確認（sha256 ${sha256(r.buf)}）${nextIchiranUrl}` });
    } else if (r.status === 404 || (r.ok && !isPdf(r.buf))) {
      results.push({ check, state: "ok", detail: `未公開（HTTP ${r.status}）${nextIchiranUrl}` });
    } else {
      results.push({ check, state: "error", detail: `HTTP ${r.status} ${nextIchiranUrl}` });
    }
  } catch (e) {
    results.push({ check, state: "error", detail: `取得失敗: ${e.message} ${nextIchiranUrl}` });
  }
} else {
  results.push({ check: "参考計数資料の次の版", state: "error", detail: "参照ファイルの sources に ichiran06_rNN_13.pdf が無い" });
}

const changed = results.filter((r) => r.state === "changed");
const errors = results.filter((r) => r.state === "error");
const exitCode = changed.length ? 1 : errors.length ? 2 : 0;
const verdict = changed.length ? "要対応" : errors.length ? "判定不能" : "変化なし";

const today = new Date().toISOString().slice(0, 10);
const mark = { ok: "OK", changed: "要対応", error: "取得失敗" };
const report = [
  `# 総務省 住民税税率資料の更新監視 ${today}`,
  "",
  `結果: **${verdict}**（参照: ${path.relative(ROOT, REF_PATH)}・${ref.asOf} 現在）`,
  "",
  "| 確認 | 判定 | 詳細 |",
  "|---|---|---|",
  ...results.map((r) => `| ${r.check} | ${mark[r.state]} | ${r.detail.replace(/\|/g, "\\|")} |`),
  "",
  ...(changed.length
    ? [
        "## 次にやること",
        "",
        `1. 新しい資料を読み、標準税率と異なる市町村（超過・未満）を ${path.relative(ROOT, REF_PATH)} の exceptions と照合する`,
        "2. 新しい基準日の参照ファイルを作り、scripts/list-open-questions.js の参照先を差し替える",
        `3. 住民税データ（inferred）の status 昇格を判断する`,
        "",
      ]
    : []),
].join("\n");

fs.mkdirSync(REPORT_DIR, { recursive: true });
const reportPath = path.join(REPORT_DIR, `soumu-jumin-watch-${today}.md`);
fs.writeFileSync(reportPath, report + "\n", "utf-8");

if (asJson) {
  console.log(JSON.stringify({ date: today, verdict, exitCode, asOf: ref.asOf, results, report: path.relative(ROOT, reportPath) }, null, 2));
} else {
  console.log(report);
  console.log(`レポート: ${path.relative(ROOT, reportPath)}`);
}
process.exit(exitCode);
