#!/usr/bin/env node
// verify-queue-kokuho-r8.json を data/municipalities/*/kokuho-2026.json の実態から再同期する。
//
// 1) 既存エントリの queueStatus / dataStatus / r8Stage を実 status から更新
//    verified → done / それ以外 → pending
// 2) キューに載っていない自治体を registry/index.json を正として補完する
//    （2026-06-10 生成時のキューは 1610 件しかなく、既 verified の 123 件が構造的に欠けていた。
//      母数が実態とずれた台帳は進捗率を過小に見せるため、以後は毎回ここで補完する）
// 3) total / summary / syncedAt を再計算
//
// tier の付与（補完分のみ。既存エントリの tier は触らない）:
//   tier2 = registry の systems に jumin を持つ市（既存キュー 12/12 と一致する機械ルール）
//   tier5 = 町村 / tier4 = その他の市区
//   tier1（生成時 needs_update）と tier3（中核市・県庁所在地級）は、リポジトリ内に
//   判定を再現できる一次資料が無いため新規付与しない。補完分は全て verified 済みで
//   残作業の順序に影響しないため、実害はない。
//
// 冪等。実行: node scripts/sync-verify-queue.cjs [--dry-run]
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const QUEUE = path.join(ROOT, "data", "verify-queue-kokuho-r8.json");
const MUNI = path.join(ROOT, "data", "municipalities");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const dry = process.argv.includes("--dry-run");

const q = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
const registry = new Map(
  JSON.parse(fs.readFileSync(REGISTRY, "utf8")).municipalities.map((m) => [m.citySlug, m])
);

const readMuni = (slug) => {
  const p = path.join(MUNI, slug, "kokuho-2026.json");
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
};
const statusOf = (d) => (d.meta && d.meta.status) || d.status || "unknown";
const stageOf  = (d) => (d.meta && d.meta.lifecycle && d.meta.lifecycle.r8Stage) || null;

// --- 台帳との突合（抜け・被りを作業内で確認する: 共通ルール data-rules.md §1） ---
const seen = new Set();
const dupes = [];
const orphans = [];
for (const e of q.queue) {
  if (seen.has(e.slug)) dupes.push(e.slug);
  seen.add(e.slug);
  if (!registry.has(e.slug)) orphans.push(e.slug);
}
if (dupes.length)   throw new Error(`キューに slug の重複: ${dupes.join(", ")}`);
if (orphans.length) throw new Error(`キューに registry 未登録の slug: ${orphans.join(", ")}`);

// --- 1) 既存エントリの同期 ---
let changed = 0, missing = 0;
for (const e of q.queue) {
  const d = readMuni(e.slug);
  if (!d) { missing++; continue; }
  const status = statusOf(d);
  const r8Stage = stageOf(d);
  const newQueueStatus = status === "verified" ? "done" : "pending";
  if (e.queueStatus !== newQueueStatus || e.dataStatus !== status || e.r8Stage !== r8Stage) {
    e.queueStatus = newQueueStatus;
    e.dataStatus = status;
    e.r8Stage = r8Stage;
    changed++;
  }
}

// --- 2) 欠けている自治体を補完 ---
const tierOf = (m) => {
  if ((m.systems || []).includes("jumin")) return 2;
  return /[町村]$/.test(m.cityName) ? 5 : 4;
};
const added = [];
const unregistered = [];
for (const slug of fs.readdirSync(MUNI).sort()) {
  if (seen.has(slug)) continue;
  const d = readMuni(slug);
  if (!d) continue;
  const m = registry.get(slug);
  if (!m) { unregistered.push(slug); continue; }
  added.push({
    slug,
    cityName: m.cityName,
    pref: m.prefecture,
    prefSlug: m.prefectureSlug,
    cityCode: m.cityCode, // registry が正。string・先頭ゼロ保持（data-rules.md §1）
    tier: tierOf(m),
    dataStatus: statusOf(d),
    r8Stage: stageOf(d),
    queueStatus: statusOf(d) === "verified" ? "done" : "pending",
  });
}
if (unregistered.length) {
  throw new Error(`kokuho-2026.json はあるが registry 未登録: ${unregistered.join(", ")}`);
}
added.sort((a, b) => a.cityCode.localeCompare(b.cityCode));
q.queue.push(...added);

// --- 3) description / 集計 ---
// description はこのスクリプトが正。手で書き換えても次回の実行で戻る。
q.description = [
  "国保R8実値検証キュー。",
  "この台帳は scripts/sync-verify-queue.cjs が data/municipalities/*/kokuho-2026.json と ",
  "registry/index.json から導出する生成物であり、手で編集しない（編集しても次回実行で戻る）。",
  "データPRの後に `node scripts/sync-verify-queue.cjs` を実行して同期する。",
  "tier1=needs_update（最優先・既知の要更新）, tier2=住民税公開市（高トラフィック）, ",
  "tier3=中核市/県庁所在地級, tier4=その他の市区, tier5=町村。",
  "tier1 と tier3 は 2026-06-10 のキュー生成時の判断で、リポジトリ内に再現できる一次資料が",
  "無いため、以後に補完されたエントリには付与されない（補完分の tier は jumin 保有→2 / ",
  "町村→5 / その他→4 の機械ルール）。",
  "verified化すると change-detector の監視対象に自動編入される。",
].join("");


let done = 0, pending = 0;
for (const e of q.queue) (e.queueStatus === "done" ? done++ : pending++);
q.total = q.queue.length;
q.syncedAt = new Date().toISOString().slice(0, 10);
q.summary = { done, pending, missing };

const msg = `done=${done} pending=${pending} total=${q.total} changed=${changed} added=${added.length} missing=${missing}`;
if (dry) {
  console.log(`[dry-run] ${msg}`);
  if (added.length) console.log(`[dry-run] 補完対象: ${added.map((e) => e.slug).join(", ")}`);
} else {
  fs.writeFileSync(QUEUE, JSON.stringify(q, null, 1) + "\n");
  console.log(`synced: ${msg}`);
}
