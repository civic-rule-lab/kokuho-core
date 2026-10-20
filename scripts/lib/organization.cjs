/**
 * organization.cjs — 運営者（Organization）の構造化データと関連サイト一覧の定数
 *
 * 兄弟サイト（kokuho-keisan.jp / seido-keisan.jp / shaho-keisan.jp / shogakukin-keisan.jp）が
 * 同じ運営者であることを検索エンジンに伝えるため、全サイトの JSON-LD で同じ @id を参照する。
 *
 *   - ORGANIZATION     … Organization 本体。運営者情報ページ（seido-keisan.jp/about/）と各サイトのトップに置く
 *   - ORGANIZATION_REF … 他の JSON-LD（WebSite / WebPage / Article の publisher など）から参照する形
 *   - SISTER_SITES     … フッターの「関連サイト」行に使う。自サイトは除いて出す
 *
 * 方針: sameAs・contactPoint は置かない（連絡先の実体を構造化データに入れない）。
 * 文言に年度を入れない（年度更新のたびに全ページ修正になる）。
 *
 * CommonJS で書く理由: package.json が "type":"module" のため、ESM の生成器からは
 * `import organization from './lib/organization.cjs'` で、.cjs のテストからは require で読める。
 */
'use strict';

const ORGANIZATION_ID = 'https://seido-keisan.jp/about/#organization';
const ABOUT_URL = 'https://seido-keisan.jp/about/';

const ORGANIZATION = Object.freeze({
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Civic Rule Lab',
  alternateName: 'Civic Systems',
  url: ABOUT_URL,
});

const ORGANIZATION_REF = Object.freeze({ '@id': ORGANIZATION_ID });

const SISTER_SITES = Object.freeze([
  Object.freeze({ host: 'kokuho-keisan.jp',     name: '国保計算',           url: 'https://kokuho-keisan.jp/' }),
  Object.freeze({ host: 'seido-keisan.jp',      name: '制度計算',           url: 'https://seido-keisan.jp/' }),
  Object.freeze({ host: 'shaho-keisan.jp',      name: '社会保険の計算',     url: 'https://shaho-keisan.jp/' }),
  Object.freeze({ host: 'shogakukin-keisan.jp', name: '奨学金かんたん計算', url: 'https://shogakukin-keisan.jp/' }),
]);

/** JSON-LD を <script> に埋める。`<` は \u003c にして </script> の混入を防ぐ */
function jsonLdScript(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

/**
 * フッターの運営者行と関連サイト行（2 段）。selfHost を除いた兄弟サイトへ通常の <a href>（nofollow・target なし）。
 * 見た目は X211 で各テンプレートに入れた /about/ 導線の <p> と同じ。
 */
function operatorFooterHtml(selfHost) {
  const links = SISTER_SITES.filter((s) => s.host !== selfHost)
    .map((s) => `<a href="${s.url}" style="color:#6b7280;">${s.name}</a>`)
    .join(' ／ ');
  return [
    `<p style="margin-top:14px;font-size:12px;text-align:center;color:#6b7280;">運営：${ORGANIZATION.name}（${ORGANIZATION.alternateName}）｜ <a href="${ABOUT_URL}" style="color:#6b7280;">運営者情報・免責</a></p>`,
    `<p style="margin-top:6px;font-size:12px;text-align:center;color:#6b7280;">関連サイト： ${links}</p>`,
  ].join('\n');
}

module.exports = { ORGANIZATION_ID, ABOUT_URL, ORGANIZATION, ORGANIZATION_REF, SISTER_SITES, jsonLdScript, operatorFooterHtml };
