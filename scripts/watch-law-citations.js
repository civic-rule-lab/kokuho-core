#!/usr/bin/env node
/**
 * watch-law-citations.js — エンジンが根拠にしている条文の改正を e-Gov で検知する
 *
 * なぜ要るか:
 *   値（料率など）は公式値と照合できるが、規則（条文→コード）は条文の改正を知らないと古いまま動く。
 *   エンジンのコメントに条文番号を書いても、改正されたことには誰も気づかない（規範14: 記録は対処ではない）。
 *   そこで、根拠の条文ごとに「どの版の、どの号の本文を読んで実装したか」を data/reference/law-citations.json に
 *   記録し、e-Gov 法令API v2 の現在の版・未施行の改正版と突き合わせる。
 *
 * 見るもの（記録した条文ごと）:
 *   1. 現在施行中の版（CurrentEnforced）が記録した版から変わったか。変わっていれば、その号の本文ハッシュも比べる
 *   2. 記録した版より新しい未施行の版（UnEnforced）で、その号の本文が変わるものがあるか（施行日を予告として出す）
 *   本文ハッシュは、号の XML からタグと空白を除いた文字列の sha256。
 *
 * 設計:
 *   - 判定に LLM を使わない。版 ID・施行日・本文ハッシュの一致だけで決める（watch-soumu-jumin-rates.js と同じ思想）
 *   - 号だけを取る（elm パラメータ）。法令全体（地方税法は約 16MB）は取らない
 *   - 期待値は law-citations.json から導く。本スクリプトに条文の値を複製しない
 *
 * 使い方（kokuho-core ルートから）:
 *   node scripts/watch-law-citations.js            確認してレポートを書く
 *   node scripts/watch-law-citations.js --json     結果を JSON で stdout に出す（レポートも書く）
 *   node scripts/watch-law-citations.js --record   現在施行中の版と本文ハッシュを law-citations.json に記録する
 *                                                  （条文を読み直してコードを直した後に、人が実行する）
 *
 * 終了コード: 0=変化なし / 1=要対応（本文の改正、または本文が変わる未施行の改正版を検知） / 2=取得失敗などで判定できない
 *
 * レポート: docs/change-reports/law-citations-watch-YYYY-MM-DD.md（docs/change-reports/ は gitignore 済み）
 * 定期実行（launchd 等）は設定していない。設定するかはオーナーが決める。
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CIT_PATH = path.join(ROOT, "data", "reference", "law-citations.json");
const REPORT_DIR = path.join(ROOT, "docs", "change-reports");
const API = "https://laws.e-gov.go.jp/api/2";
const UA = "kokuho-core law-citations-watch (+https://github.com/civic-rule-lab/kokuho-core)";
const asJson = process.argv.includes("--json");
const doRecord = process.argv.includes("--record");

const sha256 = (s) => crypto.createHash("sha256").update(s, "utf-8").digest("hex");
const normalize = (xml) => xml.replace(/<[^>]+>/g, "").replace(/\s+/g, "");

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) { const e = new Error(`HTTP ${res.status} ${url}`); e.status = res.status; throw e; }
  return res.json();
}

async function fetchElementText(revisionId, elm) {
  const url = `${API}/law_data/${revisionId}?elm=${encodeURIComponent(elm)}&law_full_text_format=xml&response_format=json`;
  const d = await getJson(url);
  const x = d.law_full_text;
  const xml = typeof x === "string" ? Buffer.from(x, "base64").toString("utf-8") : JSON.stringify(x);
  const text = normalize(xml);
  if (!text) throw new Error(`本文が空: ${revisionId} ${elm}`);
  return text;
}

const cit = JSON.parse(fs.readFileSync(CIT_PATH, "utf-8"));
const results = [];
let anyChange = false, anyFail = false;

for (const c of cit.citations) {
  const r = { id: c.id, label: c.label, recorded: c.lawRevisionId, findings: [], errors: [] };
  try {
    const revs = (await getJson(`${API}/law_revisions/${c.lawId}`)).revisions || [];
    const current = revs.find((v) => v.current_revision_status === "CurrentEnforced");
    if (!current) throw new Error("現在施行中の版が見つからない");
    r.current = current.law_revision_id;
    const recordedDate = (revs.find((v) => v.law_revision_id === c.lawRevisionId) || {}).amendment_enforcement_date
      || c.enforcementDate;

    if (!doRecord && !c.textSha256) {
      anyFail = true;
      r.findings.push("未記録: 条文の版と本文ハッシュがまだ記録されていない。安定した回線で `node scripts/watch-law-citations.js --record` を実行する");
      results.push(r);
      continue;
    }
    if (doRecord) {
      const text = await fetchElementText(current.law_revision_id, c.elm);
      c.lawRevisionId = current.law_revision_id;
      c.enforcementDate = current.amendment_enforcement_date;
      c.textSha256 = sha256(text);
      c.textHead = text.slice(0, 60);
      c.checkedAt = new Date().toISOString().slice(0, 10);
      r.findings.push(`記録を更新: ${c.lawRevisionId}（施行 ${c.enforcementDate}）sha256 ${c.textSha256.slice(0, 12)}…`);
    } else {
      // 1. 現在施行中の版
      if (current.law_revision_id !== c.lawRevisionId) {
        const text = await fetchElementText(current.law_revision_id, c.elm);
        if (sha256(text) !== c.textSha256) {
          anyChange = true;
          r.findings.push(`【要対応】施行中の版が ${current.law_revision_id}（施行 ${current.amendment_enforcement_date}）に変わり、${c.elm} の本文が記録と違う`);
        } else {
          r.findings.push(`施行中の版は ${current.law_revision_id} に変わったが、${c.elm} の本文は記録と同じ（--record で版を更新してよい）`);
        }
      }
      // 2. 記録した版より新しい未施行の版
      const future = revs.filter((v) => v.current_revision_status === "UnEnforced"
        && (!recordedDate || v.amendment_enforcement_date > recordedDate))
        .sort((a, b) => a.amendment_enforcement_date.localeCompare(b.amendment_enforcement_date));
      r.futureChecked = future.length;
      for (const v of future) {
        try {
          const text = await fetchElementText(v.law_revision_id, c.elm);
          if (sha256(text) !== c.textSha256) {
            anyChange = true;
            r.findings.push(`【要対応・予告】未施行の版 ${v.law_revision_id}（施行予定 ${v.amendment_enforcement_date}・公布 ${v.amendment_promulgate_date}）で ${c.elm} の本文が変わる`);
          }
        } catch (e) {
          if (e.status === 404) r.findings.push(`未施行の版 ${v.law_revision_id} に ${c.elm} が無い（号の削除・移動の可能性。要確認）`), anyChange = true;
          else r.errors.push(`未施行の版 ${v.law_revision_id}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    anyFail = true; r.errors.push(e.message);
  }
  results.push(r);
}

if (doRecord) {
  fs.writeFileSync(CIT_PATH, JSON.stringify(cit, null, 2) + "\n", "utf-8");
}

const today = new Date().toISOString().slice(0, 10);
const lines = [`# 条文の改正検知（${today}）`, "", `記録: data/reference/law-citations.json（${cit.citations.length} 件）`, ""];
for (const r of results) {
  lines.push(`## ${r.id} — ${r.label}`, `- 記録した版: ${r.recorded}`, `- 施行中の版: ${r.current ?? "（取得失敗）"}`);
  if (r.futureChecked != null) lines.push(`- 確認した未施行の版: ${r.futureChecked} 件`);
  for (const f of r.findings) lines.push(`- ${f}`);
  for (const e of r.errors) lines.push(`- 取得失敗: ${e}`);
  if (!r.findings.length && !r.errors.length) lines.push("- 変化なし");
  lines.push("");
}
const exitCode = anyChange ? 1 : anyFail ? 2 : 0;
lines.push(`判定: ${["変化なし", "要対応", "判定不能"][exitCode]}`);
fs.mkdirSync(REPORT_DIR, { recursive: true });
const reportPath = path.join(REPORT_DIR, `law-citations-watch-${today}.md`);
if (!doRecord) fs.writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
if (asJson) console.log(JSON.stringify({ exitCode, results }, null, 2));
else console.log(lines.join("\n"));
process.exit(doRecord ? (anyFail ? 2 : 0) : exitCode);
