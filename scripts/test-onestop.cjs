#!/usr/bin/env node
/**
 * test-onestop.cjs — ふるさと納税ワンストップ特例の判定（js/core/onestop.js）の検証
 *
 * 期待値は地方税法 附則第7条の条文から手で決めたもの。エンジンの出力を期待値に使わない。
 * 実行: node scripts/test-onestop.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const data = require(path.join(ROOT, 'data/national/furusato-onestop-2026.json'));
const { judgeOnestop } = require(path.join(ROOT, 'js/core/onestop.js'));
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };

// データの整合（制度値）
A('上限は 5 団体（附則第7条第2項）', data.maxMunicipalities === 5);
A('変更届の期限は翌年1月10日（第4項）', /1月10日/.test(data.changeNoticeDeadline.text));
A('通知書の期限は翌年1月31日（第5項）', /1月31日/.test(data.noticeDeadline.text));
A('無効になる条件は 3 種（確定申告・5超・住所地相違）', data.invalidatedWhen.map(x => x.key).join(',') === 'shinkoku,over5,movedCity');
A('出典のスナップショットに sha256 がある', data.meta.snapshots.every(s => /^[0-9a-f]{64}$/.test(s.sha256)));

// 判定
A('申告しない・3団体 → ワンストップ', judgeOnestop({ shinkoku: 'no', municipalities: 3 }, data).verdict === 'onestop');
A('申告しない・5団体 → ワンストップ（5以下）', judgeOnestop({ shinkoku: 'no', municipalities: 5 }, data).verdict === 'onestop');
A('申告しない・6団体 → 5団体超（第6項第3号）', judgeOnestop({ shinkoku: 'no', municipalities: 6 }, data).verdict === 'over5');
A('申告する・1団体 → 確定申告（第6項第1号・第2号）', judgeOnestop({ shinkoku: 'yes', municipalities: 1 }, data).verdict === 'shinkoku');
A('申告する・団体数未入力 → 確定申告（団体数は不要）', judgeOnestop({ shinkoku: 'yes' }, data).verdict === 'shinkoku');
A('申告しない・団体数未入力 → 入力を求める', judgeOnestop({ shinkoku: 'no' }, data).verdict === 'need-input');
A('わからない・医療費控除あり・2団体 → 確定申告', judgeOnestop({ shinkoku: 'unknown', municipalities: 2, reasons: { refundDeductions: true } }, data).verdict === 'shinkoku');
const u = judgeOnestop({ shinkoku: 'unknown', municipalities: 2, reasons: {} }, data);
A('わからない・該当なし・2団体 → ワンストップ（チェックからの推定と明示）', u.verdict === 'onestop' && u.estimatedFromChecklist === true);
A('わからない・副業20万超・6団体 → 確定申告（理由に副業が載る）', (() => { const r = judgeOnestop({ shinkoku: 'unknown', municipalities: 6, reasons: { otherIncomeOver200k: true } }, data); return r.verdict === 'shinkoku' && r.reasons.some(t => /20万円/.test(t)); })());
A('寄附額は判定に影響しない', judgeOnestop({ shinkoku: 'no', municipalities: 2, donation: 9999999 }, data).verdict === 'onestop');
A('寄附額は戻り値に数値で入る', judgeOnestop({ shinkoku: 'no', municipalities: 2, donation: '50000' }, data).donation === 50000);
A('戻り値に期限 3 種が入る', (() => { const r = judgeOnestop({ shinkoku: 'no', municipalities: 2 }, data); return r.deadlines.application && r.deadlines.changeNotice && r.deadlines.notice; })());

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
