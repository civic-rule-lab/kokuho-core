/**
 * scripts/generate-description-full.js
 *
 * prefecture-info.js の description.full が空の県について、
 * テンプレートで自動生成する。
 *
 * 実行: node scripts/generate-description-full.js
 *
 * [TBD: 開始年度] と [TBD: 使途] はこのスクリプト実行後に手動補完。
 * 補完箇所の確認: grep -n "TBD" js/core/prefecture-info.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'js', 'core', 'prefecture-info.js');

const _require = createRequire(import.meta.url);
const { PREFECTURE_INFO } = _require('../js/core/prefecture-info.js');

// 県/府/都/道 の判定
function prefType(name) {
  if (name.endsWith('都')) return '都';
  if (name.endsWith('道')) return '道';
  if (name.endsWith('府')) return '府';
  return '県';
}

// 均等割超過分の表示（例: 500 → "500円"）
function yen(n) { return `${n.toLocaleString('ja-JP')}円`; }

// description.full テンプレート生成
function buildFull(slug, info) {
  const { name, taxName, surcharge } = info;
  const type = prefType(name);
  const pc   = surcharge?.perCapita ?? 0;
  const rate = surcharge?.rate      ?? 0;

  // 超過課税なし（既に fill 済みのはずだが念のため）
  if (!surcharge) {
    return `${name}では個人${type}民税の超過課税はありません。地方税法の標準税率（所得割4%、均等割1,000円）が適用されています。`;
  }

  // 均等割・所得割の両方に超過（神奈川型）
  if (pc > 0 && rate > 0) {
    const ratePct = (rate * 100).toFixed(3).replace(/\.?0+$/, '');
    return `${name}では「${taxName}」として、個人${type}民税に超過課税が上乗せされています。所得割は標準4%に+${ratePct}%、均等割は標準1,000円に+${yen(pc)}が加算されます。[TBD: 開始年度]年度から実施されており、[TBD: 使途]に充てられています。`;
  }

  // 均等割のみ超過（通常パターン）
  return `${name}では「${taxName}」として、個人${type}民税の均等割に${yen(pc)}が上乗せされています。[TBD: 開始年度]年度から実施されており、[TBD: 使途]に充てられています。`;
}

// ─── メイン ───────────────────────────────────────────────────
let src = readFileSync(FILE, 'utf-8');
let filled = 0;
let skipped = 0;

for (const [slug, info] of Object.entries(PREFECTURE_INFO)) {
  if (info.description.full !== '') { skipped++; continue; }

  const full = buildFull(slug, info);

  // JSON 文字列内の "full": "" を置換
  // slug ごとに一意の文字列で特定する
  const pattern = new RegExp(
    `("${slug}":[\\s\\S]*?"short":\\s*"[^"]*",\\s*"full":\\s*)""`
  );

  if (!pattern.test(src)) {
    console.warn(`  ⚠ ${slug}: パターンにマッチしませんでした`);
    continue;
  }

  src = src.replace(pattern, `$1${JSON.stringify(full)}`);
  console.log(`  ✅ ${info.name}`);
  filled++;
}

writeFileSync(FILE, src, 'utf-8');
console.log(`\n${filled}件を自動生成、${skipped}件はスキップ（既存）`);
console.log('\n[TBD] 確認:');
const tbdCount = (src.match(/\[TBD:/g) || []).length;
console.log(`  grep -n "TBD" js/core/prefecture-info.js  → ${tbdCount}箇所`);
