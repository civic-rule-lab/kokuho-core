/**
 * scripts/generate-prefecture-pages.js
 *
 * 47都道府県のトップページ（/{prefSlug}/index.html）を生成する。
 *
 * 実行:
 *   node scripts/generate-prefecture-pages.js          （全47県）
 *   node scripts/generate-prefecture-pages.js kanagawa （1県のみ）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const BASE_URL  = "https://kokuho-keisan.jp";

const _require  = createRequire(import.meta.url);
const { PREFECTURE_INFO } = _require("../js/core/prefecture-info.js");

function fileHash(...filePaths) {
  const h = createHash("sha256");
  for (const p of filePaths) h.update(readFileSync(p));
  return h.digest("hex").slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, "css", "common.css"));

const registry  = JSON.parse(readFileSync(path.join(ROOT, "registry", "index.json"), "utf-8"));
const template  = readFileSync(path.join(ROOT, "templates", "prefecture-page.html"), "utf-8");

const targetSlug = process.argv[2] || null;

// ─── 政令市スラグを jumin-specs から取得 ──────────────────────────
async function getDesignatedCities(prefSlug) {
  try {
    const mod = await import(`file://${ROOT}/data/jumin-specs/${prefSlug}.js`);
    return new Set((mod.MUNICIPALITIES || []).map(m => m.citySlug));
  } catch {
    return new Set();
  }
}

// ─── 県内の検証状況（データから導出）─────────────────────────────
// 判定はフラグを持たせず data の lifecycle から毎回導出する。別フラグを置くと
// 昇格させたときに更新漏れでずれるため（市区町村ページの buildTrustBadge と同じ方針）。
const PUBLISH_FY   = 2026;
const PUBLISH_LABEL = "令和8年度（2026年度）";

function countVerified(municipalities) {
  let verified = 0, total = 0;
  for (const m of municipalities) {
    const f = path.join(ROOT, "data", "municipalities", m.citySlug, `kokuho-${PUBLISH_FY}.json`);
    if (!existsSync(f)) continue;
    total++;
    let j;
    try { j = JSON.parse(readFileSync(f, "utf-8")); } catch { continue; }
    if (j?.meta?.lifecycle?.r8Stage === "verified_r8") verified++;
  }
  return { verified, total };
}

// ─── 確認済みバッジ ───────────────────────────────────────────────
// 県ページは県内の市区町村の集合なので、状態は必ず「混在」しうる。
// 無条件に ✓ を出すと事実に反する（2026-09-10 実測: 47県中40県が該当し、
// うち沖縄・山梨・高知は verified が0件のまま ✓ を出していた）。
function buildTrustBadge(prefName, { verified, total }) {
  if (!total) return "";

  // 全件が公式データ確認済み。市区町村ページの ✓ と同じ文言・同じ色。
  if (verified === total) {
    return `  <span class="pref-page-badge">
    <span style="color:#16a34a;font-weight:700;">✓</span>${PUBLISH_LABEL} 公式データ確認済み
  </span>`;
  }

  // 1件も確認済みが無い県。市区町村ページが standard_r8 でバッジを出さず
  // 青枠カードで「参考値」と説明するのと同じ扱いに揃える。
  if (verified === 0) {
    return `  <div class="pref-standard-note">
    <p class="pref-standard-note__title">【ご注意】${PUBLISH_LABEL}の料率について</p>
    <p class="pref-standard-note__body">${prefName}内の市区町村ページで表示している${PUBLISH_LABEL}の保険料率は、現時点ではすべて${prefName}が公表した<strong>標準保険料率（参考値）</strong>です。各市区町村が実際に決定・告示する保険料率とは異なる場合があります。標準保険料率は、各市区町村の法定外繰入等を行わない前提で県が算定した理論上の値です。確定した料率は各市区町村の公式案内をご確認ください。</p>
  </div>`;
  }

  // 一部のみ確認済み。記号は付けない（✓ / ◐ / ◔ は市区町村ページで
  // それぞれ別の意味に割り当て済みで、県ページに流用すると意味が薄れる）。
  return `  <span class="pref-page-badge pref-page-badge--partial">
    ${PUBLISH_LABEL} ${verified}/${total}自治体が公式データ確認済み
  </span>`;
}

// ─── SEO ─────────────────────────────────────────────────────────
// 末尾の検証状況の一文。バッジと同じ判定から作る（片方だけ古くなるのを防ぐ）。
function buildStatusSentence({ verified, total }) {
  if (!total)              return `${PUBLISH_LABEL}に対応。`;
  if (verified === total)  return `${PUBLISH_LABEL}公式データ確認済み。`;
  if (verified === 0)      return `${PUBLISH_LABEL}は県が公表した標準保険料率（参考値）を表示しています。`;
  return `${PUBLISH_LABEL}は${total}自治体中${verified}自治体で公式データを確認済みです。`;
}

function buildMetaDesc(prefName, info, muniCount, counts) {
  const countStr = `県内${muniCount}市区町村`;
  const status   = buildStatusSentence(counts);
  if (info?.surcharge) {
    const amt = info.surcharge.perCapita ?? 0;
    return `${prefName}の国民健康保険料を${countStr}別に計算。${prefName}では「${info.taxName}」として均等割に${amt.toLocaleString('ja-JP')}円が上乗せされています。${status}`;
  }
  return `${prefName}の国民健康保険料を${countStr}別に計算。${status}${prefName}では住民税の超過課税はありません。`;
}

function buildJsonLd(prefName, prefSlug, desc) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "国保計算ポータル", "item": `${BASE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": prefName,           "item": `${BASE_URL}/${prefSlug}/` },
        ],
      },
      {
        "@type": "WebPage",
        "name": `${prefName}の住民税・国保料計算`,
        "description": desc,
        "url": `${BASE_URL}/${prefSlug}/`,
        "inLanguage": "ja",
      },
    ],
  });
}

// ─── 住民税セクション ─────────────────────────────────────────────
function buildJuminSection(info) {
  if (!info) {
    return `  <div class="pref-jumin-box"><p class="pref-jumin-box__desc">住民税情報を準備中です。</p></div>`;
  }
  const linkHtml = info.sourceUrl
    ? `\n    <a class="pref-jumin-box__link" href="${info.sourceUrl}" target="_blank" rel="noopener">公式サイトで確認 ↗</a>`
    : '';
  return `  <div class="pref-jumin-box">
    <p class="pref-jumin-box__desc">${info.description.full}</p>${linkHtml}
  </div>`;
}

// ─── 市区町村リスト ───────────────────────────────────────────────
function buildMunicipalityList(municipalities, designatedSlugs, prefSlug) {
  const designated = municipalities.filter(m => designatedSlugs.has(m.citySlug));
  const wards      = municipalities.filter(m => m.cityName.endsWith('区'));
  const cities     = municipalities.filter(m =>
    !designatedSlugs.has(m.citySlug) && m.cityName.endsWith('市')
  );
  const towns      = municipalities.filter(m =>
    m.cityName.endsWith('町') || m.cityName.endsWith('村')
  );

  function renderGroup(label, items, isDesignated = false) {
    if (!items.length) return '';
    const links = items.map(m =>
      `      <a class="muni-link${isDesignated ? ' muni-link--designated' : ''}" href="/${prefSlug}/${m.citySlug}/">${m.cityName}</a>`
    ).join('\n');
    return `  <div class="muni-section">
    <h3>${label}</h3>
    <div class="muni-grid">
${links}
    </div>
  </div>`;
  }

  return [
    designated.length ? renderGroup('政令指定都市', designated, true) : '',
    wards.length      ? renderGroup('特別区', wards)                   : '',
    cities.length     ? renderGroup('市', cities)                      : '',
    towns.length      ? renderGroup('町・村', towns)                   : '',
  ].filter(Boolean).join('\n\n');
}

// ─── FAQ ─────────────────────────────────────────────────────────
function buildFaq(prefName, info, designatedNames = []) {
  const type = prefName.endsWith('都') ? '都民税'
             : prefName.endsWith('道') ? '道民税'
             : prefName.endsWith('府') ? '府民税'
             : '県民税';

  const toFaqHtml = (faqs) => faqs.map(f => `  <details class="faq-item">
    <summary>${f.q}</summary>
    <p>${f.a}</p>
  </details>`).join('\n\n');

  if (info?.surcharge) {
    const pc   = info.surcharge.perCapita ?? 0;
    const rate = info.surcharge.rate      ?? 0;
    const tax  = info.taxName ?? '独自課税';
    const yearMatch = info.description.full.match(/(\d{4})年度から/);
    const year = yearMatch ? yearMatch[1] : '';
    const rateNote = rate > 0
      ? `また、所得割も標準4%に+${(rate * 100).toFixed(3).replace(/\.?0+$/, '')}%の超過課税があります。`
      : '';
    const designatedNote = designatedNames.length
      ? `なお、政令指定都市（${designatedNames.join('・')}）では税源移譲により${type}の所得割が2%となります。`
      : '';

    return toFaqHtml([
      {
        q: `なぜ${prefName}の住民税（均等割）は全国標準より高いのですか？`,
        a: `${prefName}では「${tax}」として、個人${type}の均等割に${pc.toLocaleString('ja-JP')}円が上乗せされています。${year ? year + '年度から実施されており、' : ''}森林整備・水源保全などの財源に充てられています。${rateNote}`,
      },
      {
        q: `「${tax}」はいつまで継続されますか？`,
        a: `現在も継続実施中です。${prefName}では条例に基づき概ね5年ごとに効果を検証しながら延長されています。最新の課税期間については<a href="${info.sourceUrl || '#'}" target="_blank" rel="noopener">${prefName}公式サイト ↗</a>でご確認ください。`,
      },
      {
        q: `${prefName}内の市区町村で住民税の金額は違いますか？`,
        a: `「${tax}」は${prefName}全域に等しく適用されます。${designatedNote}市区町村民税（市民税・区民税）部分は各自治体が独自に設定するため、市区町村によって異なる場合があります。`,
      },
    ]);
  }

  const designatedNote = designatedNames.length
    ? `ただし政令指定都市（${designatedNames.join('・')}）では税源移譲により${type}の所得割が2%となります。`
    : '';

  return toFaqHtml([
    {
      q: `${prefName}の住民税（${type}）は全国標準ですか？`,
      a: `はい。${prefName}では都道府県独自の超過課税はなく、地方税法の標準税率（所得割4%、均等割1,000円）が適用されています。${designatedNote}`,
    },
    {
      q: `${prefName}内の市区町村で住民税の金額は違いますか？`,
      a: `${type}部分（所得割4%・均等割1,000円）は全市区町村で統一されています。市区町村民税は各自治体の設定によります。${designatedNote}`,
    },
    {
      q: `${prefName}の国民健康保険料はどこで確認できますか？`,
      a: `このページに掲載している各市区町村の計算ページから試算できます。正式な保険料は各自治体の窓口や通知書でご確認ください。`,
    },
  ]);
}

// ─── 都道府県名マスタ（registry未登録県のフォールバック用）──────────
const PREF_NAMES = {
  hokkaido:'北海道', aomori:'青森県', iwate:'岩手県', miyagi:'宮城県',
  akita:'秋田県', yamagata:'山形県', fukushima:'福島県', ibaraki:'茨城県',
  tochigi:'栃木県', gunma:'群馬県', saitama:'埼玉県', chiba:'千葉県',
  tokyo:'東京都', kanagawa:'神奈川県', niigata:'新潟県', toyama:'富山県',
  ishikawa:'石川県', fukui:'福井県', yamanashi:'山梨県', nagano:'長野県',
  gifu:'岐阜県', shizuoka:'静岡県', aichi:'愛知県', mie:'三重県',
  shiga:'滋賀県', kyoto:'京都府', osaka:'大阪府', hyogo:'兵庫県',
  nara:'奈良県', wakayama:'和歌山県', tottori:'鳥取県', shimane:'島根県',
  okayama:'岡山県', hiroshima:'広島県', yamaguchi:'山口県', tokushima:'徳島県',
  kagawa:'香川県', ehime:'愛媛県', kochi:'高知県', fukuoka:'福岡県',
  saga:'佐賀県', nagasaki:'長崎県', kumamoto:'熊本県', oita:'大分県',
  miyazaki:'宮崎県', kagoshima:'鹿児島県', okinawa:'沖縄県',
};

// ─── メイン ───────────────────────────────────────────────────────
// registry から市区町村データを収集
const prefMap = {};
for (const m of registry.municipalities) {
  const slug = m.prefectureSlug;
  if (!slug) continue;
  // 国保対象でない自治体を県ページに並べない。並べるとページ実体が無いため
  // 本番で 404 になる（2026-09-10 実測: 北海道の泊村 tomari-kunashir が該当。
  // 県ページからのリンクが HTTP 404 を返していた）。
  if (!m.systems?.includes("kokuho")) continue;
  if (!prefMap[slug]) prefMap[slug] = { name: m.prefecture, municipalities: [] };
  prefMap[slug].municipalities.push(m);
}

// PREF_NAMES の全47県を対象に（registry未登録県は市区町村リスト空）
const all47 = Object.keys(PREF_NAMES);
const targetSlugs = targetSlug
  ? (all47.includes(targetSlug) ? [targetSlug] : [])
  : all47;

if (targetSlug && !all47.includes(targetSlug)) {
  console.error(`❌ 都道府県スラグが見つかりません: ${targetSlug}`);
  process.exit(1);
}

let generated = 0;
const noMuni = [];

for (const prefSlug of targetSlugs) {
  const prefName     = prefMap[prefSlug]?.name ?? PREF_NAMES[prefSlug];
  const municipalities = prefMap[prefSlug]?.municipalities ?? [];
  const info         = PREFECTURE_INFO[prefSlug] ?? null;
  const designated   = await getDesignatedCities(prefSlug);

  const designatedNames = municipalities
    .filter(m => designated.has(m.citySlug))
    .map(m => m.cityName);

  // 市区町村なし県は「準備中」メッセージ
  const muniSection = municipalities.length > 0
    ? buildMunicipalityList(municipalities, designated, prefSlug)
    : `  <div style="padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;color:#6b7280;font-size:14px;">
    ${prefName}の市区町村ページは順次追加予定です。
  </div>`;

  const counts   = countVerified(municipalities);
  const metaDesc = buildMetaDesc(prefName, info, municipalities.length, counts);
  const html = template
    .replaceAll("__PREF_NAME__",         prefName)
    .replaceAll("__PREF_SLUG__",         prefSlug)
    .replaceAll("__META_DESC__",         metaDesc)
    .replaceAll("__CANONICAL_URL__",     `${BASE_URL}/${prefSlug}/`)
    .replaceAll("__JSON_LD__",           buildJsonLd(prefName, prefSlug, metaDesc))
    .replaceAll("__JUMIN_SECTION__",     buildJuminSection(info))
    .replaceAll("__MUNICIPALITY_LIST__", muniSection)
    .replaceAll("__FAQ_SECTION__",       buildFaq(prefName, info, designatedNames))
    .replaceAll("__TRUST_BADGE__",       buildTrustBadge(prefName, counts))
    .replaceAll("__CSS_V__",             CSS_V);

  mkdirSync(path.join(ROOT, prefSlug), { recursive: true });
  writeFileSync(path.join(ROOT, prefSlug, "index.html"), html, "utf-8");
  generated++;
  if (!municipalities.length) noMuni.push(prefName);
}

console.log(`✅ ${generated}都道府県のページを生成しました`);
console.log(`   出力先: {都道府県スラグ}/index.html`);
if (noMuni.length) {
  console.log(`\n⚠ 市区町村データ未登録（準備中表示）: ${noMuni.join('・')}`);
}
