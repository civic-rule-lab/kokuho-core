#!/usr/bin/env node
// verify-queue-kokuho-r8.json の queueStatus を各自治体 kokuho-2026.json の実status から同期する。
// 対応: verified → done / needs_update → pending(tier1相当・dataStatus更新) / それ以外 → pending(dataStatus更新)
// 冪等。実行: node scripts/sync-verify-queue.cjs [--dry-run]
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const QUEUE = path.join(ROOT, "data", "verify-queue-kokuho-r8.json");
const MUNI = path.join(ROOT, "data", "municipalities");
const dry = process.argv.includes("--dry-run");

const q = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
let done = 0, pending = 0, changed = 0, missing = 0;
for (const e of q.queue) {
  const p = path.join(MUNI, e.slug, "kokuho-2026.json");
  if (!fs.existsSync(p)) { missing++; continue; }
  let d;
  try { d = JSON.parse(fs.readFileSync(p, "utf8")); } catch { missing++; continue; }
  const status = (d.meta && d.meta.status) || d.status || "unknown";
  const r8Stage = (d.meta && d.meta.lifecycle && d.meta.lifecycle.r8Stage) || null;
  const newQueueStatus = status === "verified" ? "done" : "pending";
  if (e.queueStatus !== newQueueStatus || e.dataStatus !== status || e.r8Stage !== r8Stage) {
    e.queueStatus = newQueueStatus;
    e.dataStatus = status;
    e.r8Stage = r8Stage;
    changed++;
  }
  if (newQueueStatus === "done") done++; else pending++;
}
q.syncedAt = new Date().toISOString().slice(0, 10);
q.summary = { done, pending, missing };
if (dry) {
  console.log(`[dry-run] done=${done} pending=${pending} changed=${changed} missing=${missing}`);
} else {
  fs.writeFileSync(QUEUE, JSON.stringify(q, null, 1) + "\n");
  console.log(`synced: done=${done} pending=${pending} changed=${changed} missing=${missing}`);
}
