/**
 * 正式版ページ生成スクリプト
 *
 * registry/index.json に登録された全自治体の正式版HTMLページを
 * {prefSlug}/{citySlug}/ 以下に生成する。
 *
 * 生成されるファイル（自治体ごと）:
 *   {prefSlug}/{citySlug}/index.html    かんたん計算ページ
 *   {prefSlug}/{citySlug}/income.html   所得ベース計算ページ
 *
 * URL例:
 *   kokuho-keisan.jp/kanagawa/chigasaki/
 *   kokuho-keisan.jp/tokyo/shinjuku/income.html
 *
 * テンプレート:
 *   templates/kokuho-simple.html
 *   templates/kokuho-income.html
 *
 * 実行:
 *   node scripts/generate-official-pages.js
 *   node scripts/generate-official-pages.js chigasaki  （特定自治体のみ）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const TMPL_DIR  = path.join(ROOT, "templates");
const REGISTRY  = path.join(ROOT, "registry", "index.json");

// 都道府県名 → スラグ
const PREF_SLUG = {
  "北海道":   "hokkaido",
  "青森県":   "aomori",
  "岩手県":   "iwate",
  "宮城県":   "miyagi",
  "秋田県":   "akita",
  "山形県":   "yamagata",
  "福島県":   "fukushima",
  "茨城県":   "ibaraki",
  "栃木県":   "tochigi",
  "群馬県":   "gunma",
  "埼玉県":   "saitama",
  "千葉県":   "chiba",
  "東京都":   "tokyo",
  "神奈川県": "kanagawa",
  "新潟県":   "niigata",
  "富山県":   "toyama",
  "石川県":   "ishikawa",
  "福井県":   "fukui",
  "山梨県":   "yamanashi",
  "長野県":   "nagano",
  "岐阜県":   "gifu",
  "静岡県":   "shizuoka",
  "愛知県":   "aichi",
  "三重県":   "mie",
  "滋賀県":   "shiga",
  "京都府":   "kyoto",
  "大阪府":   "osaka",
  "兵庫県":   "hyogo",
  "奈良県":   "nara",
  "和歌山県": "wakayama",
  "鳥取県":   "tottori",
  "島根県":   "shimane",
  "岡山県":   "okayama",
  "広島県":   "hiroshima",
  "山口県":   "yamaguchi",
  "徳島県":   "tokushima",
  "香川県":   "kagawa",
  "愛媛県":   "ehime",
  "高知県":   "kochi",
  "福岡県":   "fukuoka",
  "佐賀県":   "saga",
  "長崎県":   "nagasaki",
  "熊本県":   "kumamoto",
  "大分県":   "oita",
  "宮崎県":   "miyazaki",
  "鹿児島県": "kagoshima",
  "沖縄県":   "okinawa",
};

// テンプレート読み込み
const tmplSimple = readFileSync(path.join(TMPL_DIR, "kokuho-simple.html"), "utf-8");
const tmplIncome = readFileSync(path.join(TMPL_DIR, "kokuho-income.html"), "utf-8");

function render(template, { citySlug, cityName }) {
  return template
    .replaceAll("__CITY_SLUG__", citySlug)
    .replaceAll("__CITY_NAME__", cityName);
}

// 対象自治体
const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const targetSlug = process.argv[2] || null;

const targets = targetSlug
  ? registry.municipalities.filter(m => m.citySlug === targetSlug)
  : registry.municipalities;

if (targets.length === 0) {
  console.error(`❌ スラグが見つかりません: ${targetSlug}`);
  process.exit(1);
}

let generated = 0;
const skipped = [];

for (const m of targets) {
  const prefSlug = PREF_SLUG[m.prefecture];
  if (!prefSlug) {
    skipped.push(`${m.cityName}: 都道府県スラグ未定義 (${m.prefecture})`);
    continue;
  }

  const dir = path.join(ROOT, prefSlug, m.citySlug);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    path.join(dir, "index.html"),
    render(tmplSimple, { citySlug: m.citySlug, cityName: m.cityName }),
    "utf-8"
  );
  writeFileSync(
    path.join(dir, "income.html"),
    render(tmplIncome, { citySlug: m.citySlug, cityName: m.cityName }),
    "utf-8"
  );

  generated++;
}

console.log(`\n✅ ${generated}自治体の正式版ページを生成しました`);
console.log(`   出力先: {都道府県スラグ}/{自治体スラグ}/index.html & income.html`);

if (skipped.length > 0) {
  console.warn(`\n⚠️  スキップ:`);
  skipped.forEach(s => console.warn("  ", s));
}

console.log();
