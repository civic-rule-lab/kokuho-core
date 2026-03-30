/**
 * signature.js — kokuho 制度構造署名生成モジュール
 *
 * 役割:
 *   - 正規化済み kokuho JSON から「制度構造の署名」を生成する
 *   - 同じ署名を持つ自治体は「同型」= テンプレートを共有できる
 *
 * 署名フォーマット:
 *   {calcType}|{caps}|{reduction}|{special}
 *
 *   calcType:
 *     "2h"         所得割 + 均等割 のみ（平等割・資産割なし）
 *     "3h"         所得割 + 均等割 + 平等割
 *     "2h+asset"   所得割 + 資産割 + 均等割（平等割なし）
 *     "4h"         所得割 + 資産割 + 均等割 + 平等割
 *     ※ 後ろに [msc] 等の資産割適用区分を付加（一部区分のみの場合）
 *
 *   caps: "nat" (全国標準 660/260/170) または "650-240-170" 等
 *
 *   reduction: "R7std" (R7国標準 7-5-2) または "custom"
 *
 *   special: "pre" (未就学児軽減) | "none"
 *
 * 使用例:
 *   import { generateSignature, describeSignature } from './signature.js';
 *   const sig = generateSignature(normalizedData);
 *   // → "2h|nat|R7std|pre"
 */

// R7 全国標準の軽減基準値
const R7_FIVE_TENTHS_PER_PERSON  = 305000;
const R7_TWO_TENTHS_PER_PERSON   = 560000;
const R7_SALARY_PENSION_ADD      = 100000;
const NAT_CAPS = { medical: 660000, support: 260000, care: 170000 };

/**
 * 正規化済み kokuho JSON から署名を生成する。
 * @param {object} data - normalize() 済みのデータ
 * @returns {string}    - 署名文字列
 */
export function generateSignature(data) {
  // ─ 1. 計算方式 ────────────────────────────────────────────────
  const hasHousehold =
    (data.household?.medical || 0) > 0 ||
    (data.household?.support || 0) > 0 ||
    (data.household?.care    || 0) > 0;
  const assetLevy = data.assetLevy;
  const hasAsset  = !!assetLevy && Object.keys(assetLevy).length > 0;

  let calcType;
  if      (hasAsset && hasHousehold) calcType = "4h";
  else if (hasAsset)                 calcType = "2h+asset";
  else if (hasHousehold)             calcType = "3h";
  else                               calcType = "2h";

  // 資産割の対象区分（一部区分のみの場合に付加）
  if (hasAsset) {
    const sections = [
      assetLevy.medical != null ? "m" : "",
      assetLevy.support != null ? "s" : "",
      assetLevy.care    != null ? "c" : "",
    ].filter(Boolean).join("");
    // 全3区分でない場合は区分を明示
    if (sections !== "msc") calcType += `[${sections}]`;
  }

  // ─ 2. 賦課限度額 ─────────────────────────────────────────────
  const { medical: capM, support: capS, care: capC } = data.caps;
  const capsKey =
    capM === NAT_CAPS.medical && capS === NAT_CAPS.support && capC === NAT_CAPS.care
      ? "nat"
      : `${capM / 1000}-${capS / 1000}-${capC / 1000}`;

  // ─ 3. 軽減基準 ────────────────────────────────────────────────
  const std = data.reduction?.standards;
  const isR7Std =
    std &&
    std.fiveTenths?.perPersonAdd  === R7_FIVE_TENTHS_PER_PERSON &&
    std.twoTenths?.perPersonAdd   === R7_TWO_TENTHS_PER_PERSON  &&
    data.reduction?.salaryPensionAdd === R7_SALARY_PENSION_ADD;
  const reductionKey = isR7Std ? "R7std" : "custom";

  // ─ 4. 特例ルール ─────────────────────────────────────────────
  const specials = [];
  if (data.preschoolReduction?.enabled) specials.push("pre");
  const specialKey = specials.length ? specials.join("+") : "none";

  return `${calcType}|${capsKey}|${reductionKey}|${specialKey}`;
}

/**
 * 署名を人間が読みやすい形で説明する。
 * @param {string} sig - generateSignature() が返す署名文字列
 * @returns {object}   - 説明オブジェクト
 */
export function describeSignature(sig) {
  const [calcType, caps, reduction, special] = sig.split("|");

  const calcDesc = {
    "2h":          "2方式（所得割+均等割）",
    "3h":          "3方式（所得割+均等割+平等割）",
    "2h+asset":    "3方式（所得割+資産割+均等割）",
    "4h":          "4方式（所得割+資産割+均等割+平等割）",
  };

  // 部分的な資産割（例: "4h[ms]"）に対応
  const baseCalcType = calcType.replace(/\[.*\]/, "");
  const assetSections = (calcType.match(/\[([msc]+)\]/) || [])[1] || null;

  return {
    signature:    sig,
    calcType:     calcDesc[baseCalcType] ?? calcType,
    assetSections: assetSections
      ? `資産割対象区分: ${assetSections.split("").map(c => ({ m: "医療", s: "支援", c: "介護" }[c])).join("+")}のみ`
      : null,
    caps:         caps === "nat" ? "全国標準上限（660/260/170万）" : `独自上限（${caps}万）`,
    reduction:    reduction === "R7std" ? "R7全国標準（7-5-2）" : "独自軽減基準",
    special:      special === "none" ? "特例なし" : special.split("+").map(s => ({ pre: "未就学児軽減" }[s] ?? s)).join("、"),
  };
}
