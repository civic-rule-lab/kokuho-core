/**
 * sitemap.xml 生成スクリプト
 *
 * registry/index.json から全自治体のURLを収集し、
 * ルートに sitemap.xml を出力する。
 *
 * 実行: node scripts/generate-sitemap.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const BASE_URL  = "https://kokuho-keisan.jp";

const PREF_SLUG = {
  "北海道": "hokkaido", "青森県": "aomori", "岩手県": "iwate", "宮城県": "miyagi",
  "秋田県": "akita", "山形県": "yamagata", "福島県": "fukushima", "茨城県": "ibaraki",
  "栃木県": "tochigi", "群馬県": "gunma", "埼玉県": "saitama", "千葉県": "chiba",
  "東京都": "tokyo", "神奈川県": "kanagawa", "新潟県": "niigata", "富山県": "toyama",
  "石川県": "ishikawa", "福井県": "fukui", "山梨県": "yamanashi", "長野県": "nagano",
  "岐阜県": "gifu", "静岡県": "shizuoka", "愛知県": "aichi", "三重県": "mie",
  "滋賀県": "shiga", "京都府": "kyoto", "大阪府": "osaka", "兵庫県": "hyogo",
  "奈良県": "nara", "和歌山県": "wakayama", "鳥取県": "tottori", "島根県": "shimane",
  "岡山県": "okayama", "広島県": "hiroshima", "山口県": "yamaguchi", "徳島県": "tokushima",
  "香川県": "kagawa", "愛媛県": "ehime", "高知県": "kochi", "福岡県": "fukuoka",
  "佐賀県": "saga", "長崎県": "nagasaki", "熊本県": "kumamoto", "大分県": "oita",
  "宮崎県": "miyazaki", "鹿児島県": "kagoshima", "沖縄県": "okinawa",
};

const registry = JSON.parse(readFileSync(path.join(ROOT, "registry", "index.json"), "utf-8"));
const today    = new Date().toISOString().slice(0, 10);

const ALL_PREF_SLUGS = [
  'hokkaido','aomori','iwate','miyagi','akita','yamagata','fukushima',
  'ibaraki','tochigi','gunma','saitama','chiba','tokyo','kanagawa',
  'niigata','toyama','ishikawa','fukui','yamanashi','nagano','gifu',
  'shizuoka','aichi','mie','shiga','kyoto','osaka','hyogo','nara',
  'wakayama','tottori','shimane','okayama','hiroshima','yamaguchi',
  'tokushima','kagawa','ehime','kochi','fukuoka','saga','nagasaki',
  'kumamoto','oita','miyazaki','kagoshima','okinawa',
];

const urls = [
  // トップページ
  { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "monthly" },
];

// 47都道府県ページ（priority高め・canonical 正規版として機能）
for (const slug of ALL_PREF_SLUGS) {
  urls.push({ loc: `${BASE_URL}/${slug}/`, priority: "0.9", changefreq: "monthly" });
}

// 市区町村：income.html を正規版として優先（index.html は canonical で income.html を指定済み）
for (const m of registry.municipalities) {
  const prefSlug = m.prefectureSlug ?? PREF_SLUG[m.prefecture];
  if (!prefSlug) continue;
  if (!(m.systems || []).includes("kokuho")) continue;
  const base = `${BASE_URL}/${prefSlug}/${m.citySlug}/`;
  urls.push({ loc: `${base}income.html`,  priority: "0.8", changefreq: "yearly" });
  urls.push({ loc: base,                  priority: "0.5", changefreq: "yearly" });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf-8");
console.log(`✅ sitemap.xml 生成完了 (${urls.length} URL)`);
