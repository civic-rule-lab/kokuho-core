/**
 * slug 衝突事前チェック（registry/index.json）
 *
 * 新規 slug + cityCode + prefSlug を受け取り、既存 registry との衝突を検出。
 * 衝突時は exit 1 + サフィックス候補（{base}-{prefSlug}）を提案する。
 *
 * 設計原則（POLICIES §9）:
 *   1. 異なる cityCode で同一 slug は ALWAYS REJECT
 *   2. 同一 cityCode で同一 slug は legitimate update（exit 0）
 *   3. registry に未登録の slug は OK（exit 0）
 *
 * 利用形態:
 *   (a) コマンドライン: node scripts/check-slug.js <slug> <cityCode> [<prefSlug>]
 *   (b) import: import { checkSlug } from "./check-slug.js"
 *
 * 終了コード:
 *   0 — 安全（未登録 or 正当な更新）
 *   1 — 衝突あり
 *   2 — 引数不正
 *
 * 例:
 *   node scripts/check-slug.js koga 08204 ibaraki
 *     → ❌ 衝突: koga は 福岡県古賀市 (40221) に既割当。候補: koga-ibaraki
 *     → exit 1
 *
 *   node scripts/check-slug.js koga-ibaraki 08204 ibaraki
 *     → ✅ 安全（未登録）
 *     → exit 0
 *
 *   node scripts/check-slug.js koga 40221 fukuoka
 *     → ✅ 安全（既登録の福岡県古賀市と同一 cityCode・更新扱い）
 *     → exit 0
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");

/**
 * @param {string} slug — 新規追加したい citySlug
 * @param {string} cityCode — 新規追加したい cityCode
 * @param {string} [prefSlug] — 衝突時のサフィックス候補生成用（任意）
 * @returns {{ ok: boolean, reason: string, suggestion?: string, conflict?: object }}
 */
export function checkSlug(slug, cityCode, prefSlug) {
  if (!slug || !cityCode) {
    return { ok: false, reason: "slug と cityCode は必須" };
  }

  const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
  const conflict = registry.municipalities.find(m => m.citySlug === slug);

  // ケース 1: 未登録 → OK
  if (!conflict) {
    return { ok: true, reason: `slug="${slug}" は registry 未登録、安全に追加可能` };
  }

  // ケース 2: 同一 cityCode → 正当な更新
  if (String(conflict.cityCode) === String(cityCode)) {
    return {
      ok: true,
      reason: `slug="${slug}" は ${conflict.prefecture}${conflict.cityName} (${conflict.cityCode}) として既登録・更新扱い`,
    };
  }

  // ケース 3: 異なる cityCode → 衝突
  const suggestion = prefSlug ? `${slug}-${prefSlug}` : null;
  return {
    ok: false,
    reason: `slug="${slug}" は ${conflict.prefecture}${conflict.cityName} (${conflict.cityCode}) に既割当。新規 cityCode=${cityCode} とは異なる`,
    conflict,
    suggestion,
  };
}

// ─── CLI エントリポイント ──────────────────────────────────────
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const [, , slug, cityCode, prefSlug] = process.argv;

  if (!slug || !cityCode) {
    console.error("Usage: node scripts/check-slug.js <slug> <cityCode> [<prefSlug>]");
    console.error("");
    console.error("例: node scripts/check-slug.js koga-ibaraki 08204 ibaraki");
    process.exit(2);
  }

  const result = checkSlug(slug, cityCode, prefSlug);

  if (result.ok) {
    console.log(`✅ ${result.reason}`);
    process.exit(0);
  } else {
    console.error(`❌ slug 衝突検出`);
    console.error(`   ${result.reason}`);
    if (result.conflict) {
      console.error(`   既存: ${result.conflict.prefecture}${result.conflict.cityName} (cityCode=${result.conflict.cityCode}, slug=${result.conflict.citySlug})`);
    }
    if (result.suggestion) {
      console.error(`   推奨サフィックス候補: ${result.suggestion}`);
      console.error(`   命名規約: POLICIES.md §9 を参照（registry 既存例: hokuto-yamanashi / kashima-saga / konan-kochi 等）`);
    } else {
      console.error(`   サフィックス候補生成のため第3引数に prefSlug を渡してください（例: ibaraki, gunma）`);
    }
    process.exit(1);
  }
}
