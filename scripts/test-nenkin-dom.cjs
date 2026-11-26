/**
 * test-nenkin-dom.cjs — 国民年金の保険料と免除（生成物 seido-nenkin.html）を jsdom で検証
 *
 *  0. 生成物が最新（テンプレートと制度値から作り直しても同じ）・2 回実行して差分なし・未置換のプレースホルダなし。
 *     配信スクリプトとサイトマップに結線されている。ページが読む JS は配信の一覧に全部ある
 *  1. 画面の年額・月額・前納・区分・承認されたときの月額・反映・基準額が、js/core/nenkin.js を Node から直接呼んだ値と一致する
 *  2. Enter の順と終了マーク。非表示の欄（配偶者・世帯主）を飛ばす。日本語入力の確定の Enter を無視。全角を半角に
 *  3. 年齢・本人の金額・（いるときの）配偶者と世帯主の金額が未入力なら結果を出さない（0 円と区別）。
 *     扶養の内訳の矛盾・対象外の年齢は案内だけ
 *  4. 注記文（目安・結果の末尾の 1 文・端末の中だけで計算・計算の前提）と、使わない語が画面に無いこと
 *  5. 制度値の埋め込み: NENKIN_DB が JSON と文字列一致、fetch しない。説明の表と文中の数字が制度値から描かれる
 *  6. 本人の状況: 障害者を選ぶと、障害者控除の額（other.shogai）と本人が障害者であること（other.selfShogai）の両方が計算に渡る
 *
 * 試算の条件はすべて架空のモデル世帯。
 * 実行: node scripts/test-nenkin-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const N = require(path.join(ROOT, 'js/core/nenkin.js'));
const { calcSalaryIncome } = require(path.join(ROOT, 'js/core/shared/income.js'));
const dbText = fs.readFileSync(path.join(ROOT, 'data/national/kokumin-nenkin-2026.json'), 'utf8');
const db = JSON.parse(dbText);
const E = db.exemption;
const FY = db.meta.fiscalYear;
const fuyoLimit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/jumin-haigusha-kojo.json'), 'utf8')).fuyoIncomeLimit[String(FY)];
const yen = (n) => n.toLocaleString('ja-JP') + ' 円';
const man = (n) => (n / 10000).toLocaleString('ja-JP') + '万円';

let pass = 0, fail = 0;
const A = (label, cond, extra) => { console.log(`${cond ? '✓' : '✗'} ${label}${!cond && extra ? '  → ' + extra : ''}`); cond ? pass++ : fail++; };

// ── 0. 生成物 ──
const OUT = path.join(ROOT, 'seido-nenkin.html');
const GEN = path.join(ROOT, 'scripts/generate-seido-nenkin.js');
{
  const committed = fs.readFileSync(OUT, 'utf8');
  execFileSync(process.execPath, [GEN], { stdio: 'pipe' });
  const first = fs.readFileSync(OUT, 'utf8');
  execFileSync(process.execPath, [GEN], { stdio: 'pipe' });
  const second = fs.readFileSync(OUT, 'utf8');
  A('生成物が最新（作り直しても同じ）', committed === first);
  A('生成器を 2 回実行して差分なし', first === second);
  const embed = 'const NENKIN_DB = ' + dbText.trim() + ';';
  A('埋め込んだ制度値は data/national/kokumin-nenkin-2026.json と文字列一致（1 か所）', first.split(embed).length === 2);
  A('未置換のプレースホルダが無い（埋め込んだ制度値の外）', !/__[A-Z_]+__/.test(first.replace(embed, '')));
}

const SCRIPTS = ['shared/ui-input', 'shared/income', 'nenkin'];
let html = fs.readFileSync(OUT, 'utf8');
for (const f of SCRIPTS) {
  const re = new RegExp(`<script src="/js/core/${f}\\.js\\?v=[0-9a-f]+"></script>`);
  A(`ページが /js/core/${f}.js を読む`, re.test(html));
  html = html.replace(re, () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
}
A('ほかの外部 JS（/js/…）を読んでいない', !/<script src="\/js\//.test(html));
{
  const deploy = fs.readFileSync(path.join(ROOT, 'scripts/deploy-seido.sh'), 'utf8');
  const missing = SCRIPTS.filter((f) => !deploy.includes(`cp "$CORE_DIR/js/core/${f}.js"`));
  A('ページが読む JS は、配信スクリプトのコピーの一覧に全部ある', missing.length === 0, missing.join(' '));
  A('配信スクリプトが、このページを生成して nenkin/index.html へコピーする', deploy.includes('node "$CORE_DIR/scripts/generate-seido-nenkin.js"') && /cp "\$CORE_DIR\/seido-nenkin\.html"\s+"\$PUBLIC_DIR\/nenkin\/index\.html"/.test(deploy) && deploy.includes('mkdir -p "$PUBLIC_DIR/nenkin"'));
  A('サイトマップに /nenkin/ がある（生成器と生成物）', fs.readFileSync(path.join(ROOT, 'scripts/generate-seido-sitemap.js'), 'utf8').includes('${BASE_URL}/nenkin/') && fs.readFileSync(path.join(ROOT, 'seido-sitemap.xml'), 'utf8').includes('<loc>https://seido-keisan.jp/nenkin/</loc>'));
  A('canonical は /nenkin/', html.includes('<link rel="canonical" href="https://seido-keisan.jp/nenkin/">'));
  A('説明文（meta description）の月額は制度値と同じ', html.includes(`国民年金保険料（月額${db.monthly.toLocaleString('ja-JP')}円）`));
  A('ページは /data/ を fetch しない', !/fetch\(/.test(html.replace(/<script>[\s\S]*?<\/script>/g, (s) => (s.includes('calcNenkin') ? s : ''))));
}
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
const fetched = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/nenkin/',
  beforeParse(w) { w.fetch = (u) => { fetched.push(String(u)); return Promise.reject(new Error('このページは fetch しない')); }; } });
const w = dom.window, d = w.document;
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
const $ = (id) => d.getElementById(id);
const set = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
const sel = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const enter = (id, opt) => { const el = $(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: 'Enter', bubbles: true, cancelable: true }, opt))); return d.activeElement.id; };
const res = () => $('result').textContent.replace(/\s+/g, ' ');
const amt = (id) => { const e = $(id); if (!e) return undefined; const m = e.textContent.trim().match(/^([0-9,]+) 円$/); return m ? Number(m[1].replace(/,/g, '')) : NaN; };
const verdict = () => { const e = $('res-verdict'); return e ? e.textContent.trim() : null; };
const hasResult = () => !!$('res-annual');
const calc = () => w.calcNenkin();
const NUMS = ['age', 'selfAmount', 'selfDeps', 'selfDeps16', 'selfDeps70', 'selfDed', 'spouseAmount', 'spouseDeps', 'spouseDed', 'hhAmount', 'hhDeps', 'hhDed'];
const clearAll = () => { NUMS.forEach((id) => set(id, '')); sel('method', 'kouza'); sel('student', 'no'); sel('selfKind', 'salary'); sel('selfStatus', 'none'); sel('spouse', 'none'); sel('spouseKind', 'salary'); sel('householder', 'self'); sel('hhKind', 'salary'); sel('tsuka', 'no'); };
const NAME = { full: '全額免除', threeQuarters: '4分の3免除', half: '半額免除', quarter: '4分の1免除', yuyo: '納付猶予', student: '学生納付特例', none: '免除・納付猶予に当てはまりません' };
const P = (income, dependents, other) => ({ income, dependents: dependents || { general: 0, age16to22: 0, elderly: 0 }, other: Object.assign({ socialInsurance: 0 }, other) });

// 画面を、直接呼んだ結果と突き合わせる。input・tsuka・method はテストの側で手で組み立てる（画面の読み取りを使い回さない）
function sameAsEngine(label, input, opt) {
  const o = Object.assign({ tsuka: false, method: 'kouza' }, opt);
  const pr = N.calcPremium(db, { tsuka: o.tsuka }), ex = N.judgeExemption(db, input), pp = pr.prepay[o.method];
  const bad = [];
  const eq = (what, got, want) => { if (got !== want) bad.push(`${what}: 画面 ${got} ／ 計算 ${want}`); };
  eq('年額', amt('res-annual'), pr.annual); eq('月額', amt('res-monthly'), pr.monthly);
  const cells = [...$('res-prepay').querySelectorAll('td')].map((e) => Number(e.textContent.replace(/[^0-9]/g, '')));
  const want = [pp.m6.amount, pp.m6.discount, pp.y1.amount, pp.y1.discount, pp.y2.amount, pp.y2.discount].concat(pp.hayawari ? [pp.hayawari.monthly, pp.hayawari.discount] : []);
  eq('前納の表', cells.join(','), want.join(','));
  eq('区分', verdict(), NAME[ex.level]);
  if (ex.level === 'none') { eq('承認されたときの月額の行', $('res-after'), null); }
  else { eq('承認されたときの月額', amt('res-after'), ex.monthlyAfter); eq('反映', $('res-reflect').textContent.trim(), ex.pensionReflection === '0' ? '反映なし' : ex.pensionReflection); }
  // 内訳: 人ごとの所得と基準額
  const detail = $('res-detail').textContent.replace(/\s+/g, ' ');
  const who = { self: '本人', spouse: '配偶者', householder: '世帯主' };
  for (const k of (input.isStudent ? ['self'] : Object.keys(ex.detail))) {
    const t = ex.detail[k];
    if (!detail.includes(`${who[k]}：前年の所得 ${yen(input[k].income)}`)) bad.push(`内訳に${who[k]}の所得 ${input[k].income} が無い`);
    if (t.localTaxNonTaxable) continue;
    for (const v of (input.isStudent ? [t.student] : [t.full, t.threeQuarters, t.half, t.quarter])) if (!detail.includes(yen(v))) bad.push(`内訳に${who[k]}の基準 ${v} が無い`);
  }
  A(`${label} → ${NAME[ex.level]}`, bad.length === 0, bad.slice(0, 3).join(' ｜ '));
  return ex;
}

(async () => {
  if (d.readyState === 'loading') await new Promise((r) => d.addEventListener('DOMContentLoaded', r));

  // ── 5. 埋め込みと、制度値から描く表・数字 ──
  A('制度値 NENKIN_DB が埋め込まれている（月額が JSON と同じ）', w.eval('NENKIN_DB.monthly') === db.monthly);
  const kijun = $('kijunTable').textContent, hannei = $('hanneiTable').textContent;
  A('基準の表: 全額・一部免除・学生の額が制度値から出る', [man(E.full.perPerson), man(E.full.base), man(E.partial.threeQuarters), man(E.partial.half), man(E.partial.quarter), man(E.student.base)].every((s) => kijun.includes(s)));
  A('基準の表: 扶養の加算（1 人・16〜22 歳・70 歳以上）と、障害者・寡婦・ひとり親の額が制度値から出る', kijun.includes(`1 人につき ${man(E.dependentDeduction.general)}`) && kijun.includes(`16〜22歳は ${man(E.dependentDeduction.age16to22)}`) && kijun.includes(`70歳以上は ${man(E.dependentDeduction.elderly)}`) && kijun.includes(man(E.localTaxNonTaxable.incomeMax)));
  A('反映の表: 区分ごとの月額と反映が制度値から出る', ['threeQuarters', 'half', 'quarter'].every((k) => hannei.includes(yen(Math.round(db.monthly * E.payFraction[k]))) && hannei.includes(E.pensionReflection[k])) && hannei.includes('反映なし'));
  A('文中の数字（付加保険料・翌年度の月額・追納の年数・扶養の所得の上限）が制度値から入る', $('tsuka').parentElement.textContent.includes(`月${db.additionalMonthly}円`) && d.body.textContent.includes(`令和9年度の月額 ${db.nextYearMonthly.toLocaleString('ja-JP')}円`) && d.body.textContent.includes(`承認から${E.tsuinoYears}年以内`) && d.body.textContent.includes(`所得${man(fuyoLimit)}以下`));
  A('入力欄はすべて label に結線されている', [...d.querySelectorAll('input[type="text"], select')].every((e) => e.id && d.querySelector(`label[for="${e.id}"]`)));
  A('数字の欄は inputmode="numeric" で、type="number" を使わない', NUMS.every((id) => $(id).getAttribute('inputmode') === 'numeric' && $(id).type === 'text'));

  // ── 3. 未入力（0 円と区別）──
  clearAll(); calc();
  A('年齢が未入力なら結果を出さない', !hasResult() && res().includes('年齢を入れて') && !res().includes('円'));
  set('age', '30'); calc();
  A('本人の金額が未入力なら結果を出さない（0 円の結果にしない）', !hasResult() && res().includes('本人の金額を入れて'));
  set('selfAmount', '0'); calc();
  A('本人の金額に 0 を入れたら結果を出す（未入力と区別）', hasResult() && verdict() === NAME.full);
  sel('spouse', 'yes'); calc();
  A('配偶者「いる」で金額が未入力なら結果を出さない', !hasResult() && res().includes('配偶者の金額を入れて'));
  set('spouseAmount', '0'); sel('householder', 'other'); calc();
  A('世帯主「別の人」で金額が未入力なら結果を出さない', !hasResult() && res().includes('世帯主の金額を入れて'));
  set('hhAmount', '0'); calc();
  A('配偶者・世帯主とも 0 を入れたら結果を出す', hasResult());
  set('selfDeps', '1'); set('selfDeps16', '1'); set('selfDeps70', '1'); calc();
  A('扶養の内訳の合計が人数を超えたら結果を出さない', !hasResult() && res().includes('扶養親族等の数以下'));
  clearAll(); set('selfAmount', '0');
  for (const a of ['19', '60']) { set('age', a); calc(); A(`${a} 歳: 案内だけで、金額を出さない`, !hasResult() && !!$('res-age') && !/[0-9] 円/.test(res())); }

  // ── 2. Enter・入力欄 ──
  clearAll();
  A('全角の数字は半角になり、金額欄は欄を離れるとカンマが付く', (set('selfAmount', '１５０００００'), $('selfAmount').value === '1,500,000'));
  A('年齢・人数の欄にはカンマが付かない', (set('age', '３０'), $('age').value === '30') && (set('selfDeps', '1000'), $('selfDeps').value === '1000'));
  set('selfDeps', '');
  A('Enter: 納付方法 → 年齢 → 学生 → 収入の種類 → 金額 → 扶養 3 欄 → 控除 → 本人の状況',
    enter('method') === 'age' && enter('age') === 'student' && enter('student') === 'selfKind' && enter('selfKind') === 'selfAmount' && enter('selfAmount') === 'selfDeps' && enter('selfDeps') === 'selfDeps16' && enter('selfDeps16') === 'selfDeps70' && enter('selfDeps70') === 'selfDed' && enter('selfDed') === 'selfStatus');
  A('Enter: 本人の状況 → 配偶者（いない）→ 世帯主（本人）→ 付加保険料（配偶者・世帯主の欄を飛ばす）', enter('selfStatus') === 'spouse' && enter('spouse') === 'householder' && enter('householder') === 'tsuka');
  A('Enter: 付加保険料は終了マーク（動かない）。終了マークは 1 つ', enter('tsuka') === 'tsuka' && d.querySelectorAll('[data-step-end]').length === 1);
  A('日本語入力の確定の Enter では動かない', enter('selfAmount', { isComposing: true }) === 'selfAmount' && enter('selfAmount', { keyCode: 229 }) === 'selfAmount');
  sel('spouse', 'yes'); sel('householder', 'other');
  A('配偶者「いる」・世帯主「別の人」で欄が出る', $('spouseBox').style.display === '' && $('hhBox').style.display === '');
  A('Enter: 配偶者 → 種類 → 金額 → 扶養 → 控除 → 世帯主 → 種類 → 金額 → 扶養 → 控除 → 付加保険料',
    enter('spouse') === 'spouseKind' && enter('spouseKind') === 'spouseAmount' && enter('spouseAmount') === 'spouseDeps' && enter('spouseDeps') === 'spouseDed' && enter('spouseDed') === 'householder' && enter('householder') === 'hhKind' && enter('hhKind') === 'hhAmount' && enter('hhAmount') === 'hhDeps' && enter('hhDeps') === 'hhDed' && enter('hhDed') === 'tsuka');
  sel('spouse', 'none'); sel('householder', 'self');
  A('戻すと欄が消える', $('spouseBox').style.display === 'none' && $('hhBox').style.display === 'none');
  {
    // data-step は段（数字）＋横枠（a, b, c…）で、画面の並びと同じ順
    const steps = [...d.querySelectorAll('[data-step]')].map((e) => e.getAttribute('data-step'));
    const key = (s) => { const m = s.match(/^(\d+)([a-z]?)$/); return m ? Number(m[1]) * 100 + (m[2] ? m[2].charCodeAt(0) - 96 : 0) : NaN; };
    A('data-step は段と横枠の形で、画面の並びのとおり昇順・重複なし', steps.every((s) => !Number.isNaN(key(s))) && steps.every((s, i) => i === 0 || key(steps[i - 1]) < key(s)));
  }

  // ── 1. 値の一致 ──
  clearAll(); set('age', '30'); set('selfAmount', '0'); calc();
  sameAsEngine('単身 30 歳・収入 0・口座振替', { age: 30, isStudent: false, self: P(0), spouse: null, householder: null });
  A('年額は 月額×12（制度値）', amt('res-annual') === db.monthly * 12);
  sel('method', 'nofusho'); calc();
  sameAsEngine('同・納付書・クレジットカード（早割の行が無い）', { age: 30, isStudent: false, self: P(0), spouse: null, householder: null }, { method: 'nofusho' });
  A('納付方法を変えると前納の表が変わる', res().includes(yen(db.prepay.nofusho.y1.amount)) && !res().includes(yen(db.prepay.kouza.y1.amount)) && !res().includes('早割（月額）'));
  sel('method', 'kouza'); sel('tsuka', 'yes'); calc();
  sameAsEngine('同・付加保険料を納める', { age: 30, isStudent: false, self: P(0), spouse: null, householder: null }, { tsuka: true });
  A('付加保険料は月額と年額に入り、前納の表には入らない', amt('res-monthly') === db.monthly + db.additionalMonthly && amt('res-annual') === (db.monthly + db.additionalMonthly) * 12 && res().includes(yen(db.prepay.kouza.y1.amount)) && res().includes('前納の額に付加保険料は入っていません'));
  sel('tsuka', 'no');

  // 給与収入 → 所得（住民税の給与所得控除・同じ年度）
  for (const sal of [1_500_000, 2_000_000, 2_600_000, 3_200_000]) {
    set('selfAmount', String(sal)); calc();
    sameAsEngine(`単身 30 歳・給与収入 ${sal.toLocaleString('ja-JP')} 円（所得 ${calcSalaryIncome(sal, FY).toLocaleString('ja-JP')} 円）`, { age: 30, isStudent: false, self: P(calcSalaryIncome(sal, FY)), spouse: null, householder: null });
  }
  A('給与収入は給与所得控除を引いた額で判定する（収入そのままではない）', calcSalaryIncome(1_500_000, FY) < 1_500_000 && $('res-detail').textContent.includes('本人：前年の所得'));
  // 所得を直接。区分の境目（基準ちょうど／＋1 円）
  sel('selfKind', 'income');
  const th0 = N.thresholds(P(0), E);
  for (const [lv, v] of [['full', th0.full], ['threeQuarters', th0.threeQuarters], ['half', th0.half], ['quarter', th0.quarter]]) {
    set('age', '50'); set('selfAmount', String(v)); calc();
    const a = sameAsEngine(`単身 50 歳・所得 ${v.toLocaleString('ja-JP')} 円（${NAME[lv]}の基準ちょうど）`, { age: 50, isStudent: false, self: P(v), spouse: null, householder: null });
    set('selfAmount', String(v + 1)); calc();
    const b = sameAsEngine(`同 ＋1 円`, { age: 50, isStudent: false, self: P(v + 1), spouse: null, householder: null });
    A(`${NAME[lv]}の境目で区分が変わる`, a.level === lv && b.level !== lv);
  }
  A('どの基準も超えたら、月額と反映の行を出さず、超えた人を書く', !$('res-after') && !$('res-reflect') && $('res-none').textContent.includes('本人の前年の所得が基準を超えています') && $('res-none').textContent.includes(yen(db.monthly)));

  // 扶養（本人）: 16 歳未満も 1 人 38 万円、16〜22 歳 63 万円、70 歳以上 48 万円
  clearAll(); set('age', '45'); sel('selfKind', 'income'); set('selfAmount', '2400000'); set('selfDeps', '4'); set('selfDeps16', '1'); set('selfDeps70', '1'); set('selfDed', '300000'); calc();
  {
    const inp = { age: 45, isStudent: false, self: P(2_400_000, { general: 2, age16to22: 1, elderly: 1 }, { socialInsurance: 300_000 }), spouse: null, householder: null };
    const ex = sameAsEngine('45 歳・所得 240 万円・扶養 4 人（16〜22 歳 1・70 歳以上 1）・控除 30 万円', inp);
    const want = E.partial.half + 2 * E.dependentDeduction.general + E.dependentDeduction.age16to22 + E.dependentDeduction.elderly + 300_000;
    A('半額免除の基準 ＝ 128万＋38万×2＋63万＋48万＋控除 30万', ex.detail.self.half === want && $('res-detail').textContent.includes(yen(want)));
  }
  // 配偶者・世帯主
  clearAll(); set('age', '30'); sel('selfKind', 'income'); set('selfAmount', '500000');
  sel('spouse', 'yes'); set('spouseAmount', '1500000'); set('spouseDeps', '1'); set('spouseDed', '200000');
  sel('householder', 'other'); sel('hhKind', 'income'); set('hhAmount', '3000000'); set('hhDeps', '2'); calc();
  {
    const inp = { age: 30, isStudent: false, self: P(500_000), spouse: P(calcSalaryIncome(1_500_000, FY), { general: 1 }, { socialInsurance: 200_000 }), householder: P(3_000_000, { general: 2 }) };
    const ex = sameAsEngine('30 歳・本人 50 万・配偶者（給与 150 万・扶養 1・控除 20 万）・世帯主（所得 300 万・扶養 2）', inp);
    A('世帯主が基準を超えても、50 歳未満なら納付猶予（本人と配偶者で審査）', ex.level === 'yuyo' && $('res-reflect').textContent.trim() === '反映なし' && amt('res-after') === 0);
    set('age', '55'); calc();
    const ex2 = sameAsEngine('同・55 歳（納付猶予の対象外）', Object.assign({}, inp, { age: 55 }));
    A('超えた人（世帯主）を書く', ex2.level === 'none' && $('res-none').textContent.includes('世帯主の前年の所得が基準を超えています'));
  }
  // 学生
  clearAll(); set('age', '21'); sel('student', 'yes'); sel('selfKind', 'income'); set('selfAmount', String(E.student.base));
  sel('householder', 'other'); sel('hhKind', 'income'); set('hhAmount', '6000000'); calc();
  {
    const inp = { age: 21, isStudent: true, self: P(E.student.base), spouse: null, householder: P(6_000_000) };
    const ex = sameAsEngine('学生 21 歳・所得 128 万円・世帯主 600 万円', inp);
    A('学生は本人だけで審査し、内訳に世帯主を出さない', ex.level === 'student' && !$('res-detail').textContent.includes('世帯主：') && $('res-detail').textContent.includes('学生納付特例の基準'));
    set('selfAmount', String(E.student.base + 1)); calc();
    const ex2 = sameAsEngine('同 ＋1 円', Object.assign({}, inp, { self: P(E.student.base + 1) }));
    A('学生で基準を超えたら、学生納付特例の基準を超えたと書く', ex2.level === 'none' && $('res-none').textContent.includes('学生納付特例の基準を超えています'));
  }

  // ── 6. 本人の状況 ──
  clearAll(); set('age', '52'); sel('selfKind', 'income'); set('selfAmount', '1000000'); calc();
  A('52 歳・所得 100 万円・該当なし → 全額免除にならない（式どおりの区分）', verdict() === NAME[N.judgeExemption(db, { age: 52, self: P(1_000_000) }).level] && verdict() !== NAME.full);
  for (const [st, other] of [['shogai', { shogai: 1, selfShogai: true }], ['shogaiSpecial', { shogaiSpecial: 1, selfShogai: true }], ['hitorioya', { hitorioya: true }], ['kafu', { kafu: true }]]) {
    sel('selfStatus', st); set('selfAmount', '1000000'); calc();
    const got = w.nenkinReadInput().input.self.other;
    A(`本人の状況 ${st}: 計算に渡る形が ${JSON.stringify(other)}`, Object.keys(other).every((k) => got[k] === other[k]) && ['shogai', 'shogaiSpecial', 'selfShogai', 'hitorioya', 'kafu'].every((k) => (k in other) || !got[k]));
    const ex = sameAsEngine(`52 歳・所得 100 万円・${st}`, { age: 52, isStudent: false, self: P(1_000_000, null, other), spouse: null, householder: null });
    A(`${st}・所得 ${man(E.localTaxNonTaxable.incomeMax)}以下 → 全額免除と出て、理由を内訳に書く`, ex.level === 'full' && $('res-detail').textContent.includes(`前年の所得が ${man(E.localTaxNonTaxable.incomeMax)}以下のため`));
    const over = E.localTaxNonTaxable.incomeMax + 1;
    set('selfAmount', String(over)); calc();
    const ex2 = sameAsEngine(`同・所得 ${over.toLocaleString('ja-JP')} 円（特例の外。控除額を基準に足す）`, { age: 52, isStudent: false, self: P(over, null, other), spouse: null, householder: null });
    const add = st === 'shogai' ? E.otherDeduction.shogai : st === 'shogaiSpecial' ? E.otherDeduction.shogaiSpecial : st === 'hitorioya' ? E.otherDeduction.hitorioya : E.otherDeduction.kafu;
    A(`${st}: 一部免除の基準に ${man(add)} が足される`, ex2.detail.self.half === E.partial.half + add && $('res-detail').textContent.includes(yen(E.partial.half + add)));
  }

  // ── 4. 注記・語 ──
  const body = () => d.body.textContent.replace(/const NENKIN_DB[\s\S]*/, '').replace(/\s+/g, ' ');
  clearAll(); set('age', '30'); set('selfAmount', '0'); calc();
  A('結果の末尾の 1 文', $('res-closing').textContent === 'この結果は、入力した前提での目安です。実際の承認は、年金事務所または市区町村の窓口での審査によります。');
  A('「目安です。」の箇条書き（申請して承認・特例は入れていない・産前産後と法定免除）', (() => { const t = d.querySelector('.warn').textContent; return t.includes('目安です。') && t.includes('申請して承認されたとき') && t.includes('失業・災害などの特例') && t.includes('産前産後の免除と法定免除'); })());
  A('「この端末の中だけで計算」の文', body().includes('入力は端末の中だけで計算し、送信・保存しません。'));
  A('節の順: 計算のしかた → 免除・納付猶予と年金額 → あわせて使う → 計算の前提 → 出典', (() => { const h = [...d.querySelectorAll('h2')].map((e) => e.textContent); return h.join('|') === '計算のしかた|免除・納付猶予と年金額|あわせて使う|計算の前提|出典'; })());
  A('「※…」の段落が無い', !/※[^<]*<br>/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')));
  A('審査の順を書いている（全額免除 → 納付猶予 → 4分の3免除 → 半額免除 → 4分の1免除）', body().includes('全額免除 → 納付猶予 → 4分の3免除 → 半額免除 → 4分の1免除'));
  const banned = ['お得', '節税', '最適', 'おすすめ', '有利', '対策'].filter((x) => body().includes(x) || res().includes(x));
  A('使わない語（お得・節税・最適・おすすめ・有利・対策）が画面に無い', banned.length === 0, banned.join(' '));
  A('他サイトへの導線は「説明＋ボタン」で、ボタンの末尾に ↗', [...d.querySelectorAll('.cta-item')].length >= 2 && [...d.querySelectorAll('.cta-item')].every((e) => e.querySelector('.cta-desc') && e.querySelector('a .cta-ext')));
  A('fetch を 1 度も呼んでいない', fetched.length === 0);

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
