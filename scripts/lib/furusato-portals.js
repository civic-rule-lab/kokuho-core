/**
 * furusato-portals.js — ふるさと納税ページ共通の「寄附の申込み先（ポータルサイト）」枠を組み立てる
 *
 * 入力: data/national/furusato-portals-2026.json
 * 使い方: generate-seido-*.js から renderPortalBox('furusato-simple') を呼び、テンプレートの __PORTALS__ に差し込む。
 *
 * 固定ルール（収益化設計 §3。テスト scripts/test-furusato-portals.cjs が生成物で検査する）
 *   - 並びは kana の五十音順。JSON の並び順や報酬額で並べない
 *   - program が none 以外（成果報酬リンク）が 1 件でもあれば、見出しに「（広告）」を同じ文字サイズで付ける
 *   - 成果報酬リンクは rel="sponsored noopener"、それ以外は rel="noopener"。どちらも新しいタブ
 *   - URL に計算結果（金額・自治体）を載せない。クリック計測（GA4 portal_click）もポータル名と calc_type だけを送る
 *   - 返礼品・還元率・比較の語を書かない（meta.forbiddenWords）
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(ROOT, 'data', 'national', 'furusato-portals-2026.json');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function loadPortals() {
  const db = JSON.parse(readFileSync(DATA, 'utf-8'));
  const portals = (db.portals || []).filter((p) => p.enabled !== false);
  for (const p of portals) {
    if (!p.id || !p.name || !p.kana || !p.url || !p.program) throw new Error(`furusato-portals-2026.json: 項目が足りない（${JSON.stringify(p)}）`);
    if (!/^https:\/\/[^\s?#]+\/?$/.test(p.url)) throw new Error(`furusato-portals-2026.json: URL は https の公式トップのみ（クエリ・フラグメント不可）: ${p.url}`);
    if (!['none', 'rakuten', 'a8', 'vc', 'at'].includes(p.program)) throw new Error(`furusato-portals-2026.json: program が不明: ${p.program}`);
  }
  portals.sort((a, b) => a.kana.localeCompare(b.kana, 'ja'));
  const words = db.meta && db.meta.forbiddenWords ? db.meta.forbiddenWords : [];
  return { portals, forbiddenWords: words };
}

/**
 * @param {string} calcType  GA4 の calc_type（既存の calculate イベントと同じ値。例 'furusato-simple'）
 * @returns {string} HTML（自己完結の style と、クリック計測の小さな script を含む）
 */
export function renderPortalBox(calcType) {
  if (!/^[a-z0-9-]+$/.test(calcType)) throw new Error('calcType は英小文字・数字・ハイフンのみ: ' + calcType);
  const { portals, forbiddenWords } = loadPortals();
  const sponsored = portals.some((p) => p.program !== 'none');
  const heading = sponsored ? '寄附の申込み先（広告）' : '寄附の申込み先（例）';

  const items = portals.map((p) => {
    const rel = p.program === 'none' ? 'noopener' : 'sponsored noopener';
    return `      <li><a href="${esc(p.url)}" target="_blank" rel="${rel}" data-portal="${esc(p.id)}">${esc(p.name)}<span class="pb-ext" aria-hidden="true">↗</span></a></li>`;
  }).join('\n');

  const html = `  <!-- 寄附の申込み先（ポータルサイト）: data/national/furusato-portals-2026.json から生成。五十音順。 -->
  <section class="portal-box" data-calc-type="${esc(calcType)}" aria-labelledby="portalBoxTitle">
    <style>
      .portal-box{margin-top:22px;padding:14px 16px 12px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;}
      .portal-box .pb-title{font-size:14px;font-weight:700;color:#111827;margin:0 0 6px;}
      .portal-box .pb-lead{font-size:13px;line-height:1.8;color:#374151;margin:0 0 8px;}
      .portal-box ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .portal-box li a{display:block;text-align:center;padding:10px 8px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#1d4ed8;font-size:14px;font-weight:600;text-decoration:none;}
      .portal-box li a:hover{background:#eff6ff;border-color:#93c5fd;}
      .portal-box .pb-ext{font-size:11px;margin-left:3px;color:#64748b;}
      .portal-box .pb-note{font-size:12px;line-height:1.8;color:#6b7280;margin:8px 0 0;}
      @media (max-width:420px){.portal-box ul{grid-template-columns:1fr;}}
    </style>
    <p class="pb-title" id="portalBoxTitle">${heading}</p>
    <p class="pb-lead">寄附は、各ポータルサイトや自治体の窓口から申し込めます。五十音順。</p>
    <ul>
${items}
    </ul>
    <p class="pb-note">この計算は寄附先（自治体）を勧めるものではありません。${sponsored ? '上のリンクは広告（成果報酬型）で、クリックや寄附によって当サイトに報酬が入ることがあります。入力した金額や計算結果はリンク先に送られません。' : '上のリンクは各社の公式ページで、当サイトに報酬は入りません。入力した金額や計算結果はリンク先に送られません。'}<a href="/about/">運営者情報・広告の方針</a></p>
    <script>
    (function(){
      var box=document.currentScript&&document.currentScript.parentNode; if(!box) return;
      var ct=box.getAttribute("data-calc-type")||"unknown";
      box.addEventListener("click",function(e){
        var a=e.target&&e.target.closest?e.target.closest("a[data-portal]"):null; if(!a) return;
        if(typeof gtag==="function"){ gtag("event","portal_click",{portal:a.getAttribute("data-portal"),calc_type:ct}); }
      });
    })();
    </script>
  </section>
`;
  const text = html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/, '').replace(/<[^>]+>/g, '');
  for (const wd of forbiddenWords) if (text.includes(wd)) throw new Error(`ポータル枠に禁止語「${wd}」が含まれている`);
  return html;
}
