/**
 * data/*-specs の自治体の項目を、自治体マスタ（registry/index.json）と照らし合わせる。
 *
 * 生成スクリプトは spec の citySlug・cityCode をそのまま書き込み先と JSON に使う。
 * spec が台帳とずれていると、別の自治体のフォルダに書いたり、誤った cityCode を書いたりする
 * （2026-11-05: 台帳の cityCode 一括訂正（2026-05-11）が spec に反映されておらず、kaigo-specs 524 件・
 *  pref-specs 6 件がずれていた。富山県の立山町は千葉県の館山市の slug を指していた）。
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let bySlug = null;

function registryBySlug() {
  if (!bySlug) {
    const reg = JSON.parse(readFileSync(path.join(ROOT, "registry", "index.json"), "utf-8"));
    bySlug = Object.fromEntries(reg.municipalities.map(m => [m.citySlug, m]));
  }
  return bySlug;
}

/** 台帳と食い違う点を文字列で返す（一致なら null） */
export function specMismatch(entry, prefSlug) {
  const m = registryBySlug()[entry.citySlug];
  if (!m) return `citySlug "${entry.citySlug}" が台帳に無い`;
  const diffs = [];
  if (m.prefectureSlug !== prefSlug) diffs.push(`都道府県 ${prefSlug}（台帳は ${m.prefectureSlug}）`);
  if (entry.cityName !== undefined && m.cityName !== entry.cityName) diffs.push(`cityName ${entry.cityName}（台帳は ${m.cityName}）`);
  if (entry.cityCode !== undefined && m.cityCode !== entry.cityCode) diffs.push(`cityCode ${entry.cityCode}（台帳は ${m.cityCode}）`);
  return diffs.length ? `citySlug "${entry.citySlug}": ${diffs.join("・")}` : null;
}

/** 台帳と食い違えば例外にする（生成スクリプトが書き込む前に呼ぶ） */
export function assertSpecMatchesRegistry(entry, prefSlug) {
  const why = specMismatch(entry, prefSlug);
  if (why) throw new Error(`spec が台帳（registry/index.json）と食い違う: ${why}。spec を台帳に合わせてから生成する`);
}
