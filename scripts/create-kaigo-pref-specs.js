/**
 * 介護保険 都道府県スペックファイル 一括生成スクリプト
 *
 * registry/index.json を元に、data/kaigo-specs/{prefSlug}.js を
 * 全都道府県分（まだ存在しないもの）生成する。
 *
 * 生成したファイルは全自治体が needs_update / baseAmount: null の状態。
 * 公式サイトで baseAmount を確認してから記入する。
 *
 * 実行:
 *   node scripts/create-kaigo-pref-specs.js           # 未作成のみ
 *   node scripts/create-kaigo-pref-specs.js --force   # 既存も上書き
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.join(__dirname, "..");
const SPECS_DIR   = path.join(ROOT, "data", "kaigo-specs");
const REGISTRY    = JSON.parse(readFileSync(path.join(ROOT, "registry/index.json"), "utf-8"));
const FORCE       = process.argv.includes("--force");

// ─── 都道府県名（slug → 日本語）───────────────────────────────

const PREF_NAMES = {
  hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県",
  akita: "秋田県", yamagata: "山形県", fukushima: "福島県", ibaraki: "茨城県",
  tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県",
  tokyo: "東京都", kanagawa: "神奈川県", niigata: "新潟県", toyama: "富山県",
  ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県",
  shizuoka: "静岡県", aichi: "愛知県", mie: "三重県", shiga: "滋賀県",
  kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県", nara: "奈良県",
  wakayama: "和歌山県", tottori: "鳥取県", shimane: "島根県", okayama: "岡山県",
  hiroshima: "広島県", yamaguchi: "山口県", tokushima: "徳島県", kagawa: "香川県",
  ehime: "愛媛県", kochi: "高知県", fukuoka: "福岡県", saga: "佐賀県",
  nagasaki: "長崎県", kumamoto: "熊本県", oita: "大分県", miyazaki: "宮崎県",
  kagoshima: "鹿児島県", okinawa: "沖縄県",
};

// ─── 日本語県名 → slug の補完マップ ────────────────────────────

const JP_TO_SLUG = {
  "北海道": "hokkaido", "青森県": "aomori",   "岩手県": "iwate",
  "宮城県": "miyagi",   "秋田県": "akita",    "山形県": "yamagata",
  "福島県": "fukushima","茨城県": "ibaraki",  "栃木県": "tochigi",
  "群馬県": "gunma",    "埼玉県": "saitama",  "千葉県": "chiba",
  "東京都": "tokyo",    "神奈川県":"kanagawa", "新潟県": "niigata",
  "富山県": "toyama",   "石川県": "ishikawa", "福井県": "fukui",
  "山梨県": "yamanashi","長野県": "nagano",   "静岡県": "shizuoka",
  "愛知県": "aichi",    "三重県": "mie",      "滋賀県": "shiga",
  "京都府": "kyoto",    "大阪府": "osaka",    "兵庫県": "hyogo",
  "奈良県": "nara",     "和歌山県":"wakayama", "鳥取県": "tottori",
  "島根県": "shimane",  "岡山県": "okayama",  "広島県": "hiroshima",
  "山口県": "yamaguchi","徳島県": "tokushima","香川県": "kagawa",
  "愛媛県": "ehime",    "高知県": "kochi",    "福岡県": "fukuoka",
  "佐賀県": "saga",     "長崎県": "nagasaki", "熊本県": "kumamoto",
  "大分県": "oita",     "宮崎県": "miyazaki", "鹿児島県":"kagoshima",
  "沖縄県": "okinawa",
};

function resolveSlug(m) {
  if (m.prefectureSlug) return m.prefectureSlug;
  return JP_TO_SLUG[m.prefecture] || null;
}

// ─── 都道府県別に自治体をグループ化 ─────────────────────────────

const byPref = {};
for (const m of REGISTRY.municipalities) {
  const slug = resolveSlug(m);
  if (!slug) { console.warn(`  ⚠️  prefectureSlug 不明: ${m.citySlug} (${m.prefecture})`); continue; }
  if (!byPref[slug]) byPref[slug] = [];
  byPref[slug].push(m);
}

// ─── スペックファイル生成 ────────────────────────────────────────

let created = 0, skipped = 0;

for (const [prefSlug, municipalities] of Object.entries(byPref)) {
  const outPath = path.join(SPECS_DIR, `${prefSlug}.js`);

  if (!FORCE && existsSync(outPath)) { skipped++; continue; }

  const prefName = PREF_NAMES[prefSlug] || municipalities[0]?.prefecture || prefSlug;

  const lines = [
    `/**`,
    ` * ${prefName} 介護保険料スペック（第9期 2024-2026）`,
    ` *`,
    ` * 収集状況: 全${municipalities.length}自治体 未収集（needs_update）`,
    ` * 更新: ${new Date().toISOString().slice(0,10)}`,
    ` *`,
    ` * 記入方法:`,
    ` *   各自治体の公式サイトで baseAmount（基準額・円/年）を確認し記入する。`,
    ` *   status を "needs_update" → "verified" に変更し source.url を記入。`,
    ` *   段階が標準9段階と異なる場合は brackets を記入（省略時は標準9段階）。`,
    ` */`,
    ``,
    `export const PREF_NAME = "${prefName}";`,
    `export const PREF_SLUG = "${prefSlug}";`,
    ``,
    `// 都道府県共通の brackets 定義（null = 標準9段階を使用）`,
    `export const BRACKETS = null;`,
    ``,
    `export const MUNICIPALITIES = [`,
  ];

  for (const m of municipalities) {
    lines.push(
      `  {`,
      `    cityCode:   "${m.cityCode}",`,
      `    citySlug:   "${m.citySlug}",`,
      `    cityName:   "${m.cityName}",`,
      `    baseAmount: null,   // TODO: 公式サイトで確認`,
      `    status:     "needs_update",`,
      `    source: { url: null, retrievedAt: null },`,
      `  },`,
    );
  }

  lines.push(`];`);

  writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
  console.log(`  ✅ ${prefSlug} (${municipalities.length}自治体)`);
  created++;
}

console.log(`\n生成: ${created} / スキップ: ${skipped}`);
console.log(`\n次: node scripts/generate-kaigo-from-spec.js --all --dry-run`);
