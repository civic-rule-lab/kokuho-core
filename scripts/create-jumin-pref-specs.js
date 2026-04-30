/**
 * 住民税 都道府県スペックファイル 一括生成
 *
 * 各都道府県の「独自環境税・超過課税」情報を元に
 * data/jumin-specs/{prefSlug}.js を生成する。
 *
 * 実行:
 *   node scripts/create-jumin-pref-specs.js           # 未作成のみ
 *   node scripts/create-jumin-pref-specs.js --force   # 既存も上書き
 *
 * 令和6年度（2024年）改正:
 *   東日本大震災復興特例（均等割 +1,000円）が令和5年度で終了。
 *   代わりに国の森林環境税（1,000円）が令和6年度から課税開始。
 *   JUMIN_DEFAULTS.prefPerCapita = 1,000円（令和6年度以降の標準値）。
 *   都道府県独自の超過課税はこれとは独立して継続している場合がある。
 *
 * データ出典: https://a-agent.co.jp/municipal-tax-list/ (2026年4月最新版)
 */

import { writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const SPECS_DIR  = path.join(__dirname, "..", "data", "jumin-specs");
const FORCE      = process.argv.includes("--force");

// ─── 都道府県別 均等割超過額（令和6年度以降の標準 1,000円 からの上乗せ額） ──
//
// prefPerCapitaAdd = 0  → 超過課税なし → スペックファイル不要
// prefPerCapitaAdd > 0  → 超過課税あり → PREF_DEFAULTS に設定
//
// データ出典: https://a-agent.co.jp/municipal-tax-list/ (2026年4月最新版)
// status は "inferred"（公式サイトでの目視確認を推奨）

const PREF_SURCHARGES = [
  // ─── 北海道・東北 ───────────────────────────────────────────────
  { slug: "hokkaido", name: "北海道",   prefPerCapitaAdd:    0 },
  { slug: "aomori",   name: "青森県",   prefPerCapitaAdd:    0 },
  { slug: "iwate",    name: "岩手県",   prefPerCapitaAdd: 1000, taxName: "いわての森林づくり県民税" },
  { slug: "miyagi",   name: "宮城県",   prefPerCapitaAdd: 1200, taxName: "みやぎ環境税" },
  { slug: "akita",    name: "秋田県",   prefPerCapitaAdd:  800, taxName: "秋田県水と緑の森づくり税" },
  { slug: "yamagata", name: "山形県",   prefPerCapitaAdd: 1000, taxName: "やまがた緑環境税" },
  { slug: "fukushima",name: "福島県",   prefPerCapitaAdd: 1000, taxName: "ふくしま森林づくり県民税" },

  // ─── 関東 ────────────────────────────────────────────────────────
  { slug: "ibaraki",  name: "茨城県",   prefPerCapitaAdd: 1000, taxName: "森林湖沼環境税" },
  { slug: "tochigi",  name: "栃木県",   prefPerCapitaAdd:  700, taxName: "とちぎの元気な森づくり県民税" },
  { slug: "gunma",    name: "群馬県",   prefPerCapitaAdd:  700, taxName: "ぐんま緑の県民税" },
  { slug: "saitama",  name: "埼玉県",   prefPerCapitaAdd:    0 },  // 公式確認済み: 超過課税なし
  { slug: "chiba",    name: "千葉県",   prefPerCapitaAdd:    0 },  // 公式確認済み: 超過課税なし
  { slug: "tokyo",    name: "東京都",   prefPerCapitaAdd:    0 },  // 確認済み: 超過課税なし
  // kanagawa: 個別スペック（prefRate も超過）で管理済み → スキップ

  // ─── 甲信越・北陸 ────────────────────────────────────────────────
  { slug: "niigata",  name: "新潟県",   prefPerCapitaAdd:    0 },
  { slug: "toyama",   name: "富山県",   prefPerCapitaAdd:  500, taxName: "水と緑の森づくり税" },
  { slug: "ishikawa", name: "石川県",   prefPerCapitaAdd:  500, taxName: "いしかわ森林環境税" },
  { slug: "fukui",    name: "福井県",   prefPerCapitaAdd:    0 },
  { slug: "yamanashi",name: "山梨県",   prefPerCapitaAdd:  500, taxName: "森林環境税（山梨）" },
  { slug: "nagano",   name: "長野県",   prefPerCapitaAdd:  500, taxName: "森林づくり県民税" },

  // ─── 東海 ─────────────────────────────────────────────────────────
  // aichi: 個別スペック（市民税減税 + 森林税両方）で管理済み → スキップ
  { slug: "shizuoka", name: "静岡県",   prefPerCapitaAdd:  400, taxName: "森林（もり）づくり県民税" },
  { slug: "gifu",     name: "岐阜県",   prefPerCapitaAdd: 1000, taxName: "清流の国ぎふ森林・環境税" },
  { slug: "mie",      name: "三重県",   prefPerCapitaAdd: 1000, taxName: "みえ森と緑の県民税" },

  // ─── 近畿 ─────────────────────────────────────────────────────────
  { slug: "shiga",    name: "滋賀県",   prefPerCapitaAdd:  800, taxName: "琵琶湖森林づくり県民税" },
  { slug: "kyoto",    name: "京都府",   prefPerCapitaAdd:  600, taxName: "豊かな森を育てる府民税" },
  { slug: "osaka",    name: "大阪府",   prefPerCapitaAdd:  300, taxName: "森林環境税（大阪）" },
  { slug: "hyogo",    name: "兵庫県",   prefPerCapitaAdd:  800, taxName: "県民緑税" },
  { slug: "nara",     name: "奈良県",   prefPerCapitaAdd:  500, taxName: "森林環境税（奈良）" },
  { slug: "wakayama", name: "和歌山県", prefPerCapitaAdd:  500, taxName: "紀の国森づくり税" },

  // ─── 中国・四国 ───────────────────────────────────────────────────
  { slug: "tottori",  name: "鳥取県",   prefPerCapitaAdd:  500, taxName: "豊かな森づくり協働税" },
  { slug: "shimane",  name: "島根県",   prefPerCapitaAdd:  500, taxName: "水と緑の森づくり税" },
  { slug: "okayama",  name: "岡山県",   prefPerCapitaAdd:  500, taxName: "おかやま森づくり県民税" },
  { slug: "hiroshima",name: "広島県",   prefPerCapitaAdd:  500, taxName: "ひろしまの森づくり県民税" },
  { slug: "yamaguchi",name: "山口県",   prefPerCapitaAdd:  500, taxName: "やまぐち森林づくり県民税" },
  { slug: "tokushima",name: "徳島県",   prefPerCapitaAdd:    0 },
  { slug: "kagawa",   name: "香川県",   prefPerCapitaAdd:    0 },
  { slug: "ehime",    name: "愛媛県",   prefPerCapitaAdd:  700, taxName: "森林環境税（愛媛）" },
  { slug: "kochi",    name: "高知県",   prefPerCapitaAdd:  500, taxName: "森林環境税（高知）" },

  // ─── 九州・沖縄 ───────────────────────────────────────────────────
  { slug: "fukuoka",  name: "福岡県",   prefPerCapitaAdd:  500, taxName: "森林環境税（福岡）" },
  { slug: "saga",     name: "佐賀県",   prefPerCapitaAdd:  500, taxName: "森林環境税（佐賀）" },
  { slug: "nagasaki", name: "長崎県",   prefPerCapitaAdd:  500, taxName: "ながさき森林環境税" },
  { slug: "kumamoto", name: "熊本県",   prefPerCapitaAdd:  500, taxName: "水とみどりの森づくり税" },
  { slug: "oita",     name: "大分県",   prefPerCapitaAdd:  500, taxName: "森林環境税（大分）" },
  { slug: "miyazaki", name: "宮崎県",   prefPerCapitaAdd:  500, taxName: "森林環境税（宮崎）" },
  { slug: "kagoshima",name: "鹿児島県", prefPerCapitaAdd:  500, taxName: "みんなの森づくり県民税" },
  { slug: "okinawa",  name: "沖縄県",   prefPerCapitaAdd:    0 },  // 確認済み: 超過課税なし
];

// ─── スクリプト本体 ─────────────────────────────────────────────

const SKIPPED_SLUGS = new Set(["kanagawa", "aichi"]);  // 個別スペックで管理済み

let created = 0, skipped = 0;

for (const pref of PREF_SURCHARGES) {
  if (SKIPPED_SLUGS.has(pref.slug)) {
    console.log(`  ⏭️  ${pref.slug}: 個別スペックで管理済み → スキップ`);
    continue;
  }
  if (pref.prefPerCapitaAdd === 0) {
    console.log(`  ℹ️  ${pref.slug}: 超過なし → スペック不要`);
    continue;
  }

  const outPath = path.join(SPECS_DIR, `${pref.slug}.js`);
  if (!FORCE && existsSync(outPath)) {
    skipped++;
    console.log(`  ⏭️  ${pref.slug}: 既存スキップ（--force で上書き）`);
    continue;
  }

  // 令和6年度以降の標準値 1,000円 に上乗せ
  const prefPerCapita = 1_000 + pref.prefPerCapitaAdd;

  const content = `/**
 * ${pref.name} 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → ${prefPerCapita}円（+${pref.prefPerCapitaAdd}円）★
 *   税名: ${pref.taxName || ""}
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://a-agent.co.jp/municipal-tax-list/ (2026年4月)
 */

export const PREF_NAME = "${pref.name}";
export const PREF_SLUG = "${pref.slug}";

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: ${prefPerCapita},     // ${pref.taxName || ""}: 標準1,000 + ${pref.prefPerCapitaAdd}円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
];
`;

  writeFileSync(outPath, content, "utf-8");
  console.log(`  ✅ ${pref.slug} (${pref.name}): prefPerCapita=${prefPerCapita} (+${pref.prefPerCapitaAdd})`);
  created++;
}

console.log(`\n生成: ${created} / スキップ: ${skipped}`);
console.log(`\n次: node scripts/generate-jumin-from-spec.js --all --force`);
