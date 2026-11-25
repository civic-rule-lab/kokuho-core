/**
 * test-hatarakikata.cjs — 働き方の比較（js/core/hatarakikata.js）の検証
 *
 *   1. 各エンジンを Node から直接呼んだ値と一致する（社会保険料・国保・国民年金・所得税・住民税・個人事業税・年金額）
 *   2. 総額の検算: どの列でも 総額 ＝ 手取り ＋ 社会保険料（会社）＋ 社会保険料（本人）＋ 税 ＋ 自分の積立 ＋ 会社に残る額。
 *      列を順に回して確かめるので、列を足したらその列にも自動でかかる
 *   3. 列の形: 既定の列＝['kaishain','kojin']。その働き方に無い項目は null（0 円と区別）。列の順は引数どおり
 *   4. 揃え方: 額面年収 → 総額 → 逆算 で元に戻る。総額は額面年収に対して減らない。個人事業から入れたときの差は等級 1 段ぶん以内
 *   5. 年齢の境目: 介護保険（40・65）・国民年金（20・60）・対象外（15 未満・75 以上）
 *   6. 家族: 配偶者（被扶養／自分の社会保険）・子（16 歳未満／16〜18 歳／19〜22 歳）
 *   7. 個人事業の条件: 青色申告特別控除・業種・iDeCo・小規模企業共済
 *   8. 不正な入力・制度値の欠落は例外（NaN や 0 円を黙って返さない）
 *   9. 人的控除差の組み立てが、奨学金の結線（shogakukin-bridge.js）の表と食い違っていない
 *  10. 期待値ファイル（scripts/expected/hatarakikata-golden-v1.json）と一致する。
 *      列を足す変更をしても、既定の 2 列の値が変わらないことをここで確かめる
 *
 * 試算の条件はすべて架空のモデル世帯。自治体のデータは、本番のデータ更新で無関係に落ちないよう、
 * 世田谷区の令和8年度のデータ（2026-11-25 時点）を固定の写しとして scripts/expected/ に置いて使う。
 *
 * 実行: node scripts/test-hatarakikata.cjs            検証
 *       node scripts/test-hatarakikata.cjs --update   期待値ファイルを書き直す（計算を意図して変えたときだけ。差分を必ず読む）
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const H = require(path.join(ROOT, 'js/core/hatarakikata.js'));
const Shaho = require(path.join(ROOT, 'js/core/shaho.js'));
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const { calculateJumin, calcSpouseDeductionJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const { calculateKokuho } = require(path.join(ROOT, 'js/core/kokuho.js'));
const { calcSalaryIncome } = require(path.join(ROOT, 'js/core/shared/income.js'));
const NK = require(path.join(ROOT, 'js/core/nenkin-kyufu.js'));
const Z = require(path.join(ROOT, 'js/core/jigyozei.js'));
const Bridge = require(path.join(ROOT, 'js/core/shogakukin-bridge.js'));

const GOLDEN = path.join(ROOT, 'scripts/expected/hatarakikata-golden-v1.json');
const data = {
  config: J('data/national/hatarakikata-2026.json'),
  shaho: { kenpo: J('data/shaho/kenpo-2026.json'), kosei: J('data/shaho/kosei-nenkin.json'), koyo: J('data/shaho/koyo-2026.json'), standard: J('data/shaho/standard-monthly.json'), senpo: null },
  shotokuDb: J('data/national/shotokuzei-2026.json'), haigu: J('data/national/jumin-haigusha-kojo.json'),
  nenkin: J('data/national/kokumin-nenkin-2026.json'), nenkinKyufu: J('data/national/nenkin-kyufu-2026.json'), jigyozei: J('data/national/kojin-jigyozei-2026.json'),
  kokuho: J('scripts/expected/hatarakikata-fixture-kokuho-2026.json'), jumin: J('scripts/expected/hatarakikata-fixture-jumin-2026.json'),
};
const Y = data.config.years;
const engine = Shotoku.createEngineFromDB(Y.shotokuYear, data.shotokuDb);

let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const errOf = (f) => { try { f(); return null; } catch (e) { return e.name; } };
const C = (over) => Object.assign({ age: 35, prefSlug: 'tokyo', kyuchi: 1, spouse: null, kids: {} }, over || {});
const emp = (nenshu, common, extra) => H.compare({ mode: 'kaishain', common: C(common), kaishain: Object.assign({ nenshu }, (extra || {}).kaishain), kojin: (extra || {}).kojin }, data);
const sole = (uriage, keihi, common, kojin) => H.compare({ mode: 'kojin', common: C(common), kojin: Object.assign({ uriage, keihi }, kojin) }, data);
const col = (r, key) => r.columns.find((c) => c.key === key);
const item = (items, key) => { const x = items.find((i) => i.key === key); return x ? x.amount : null; };
const identity = (c) => c.takeHome + (c.siEmployer === null ? 0 : c.siEmployer) + c.siEmployee + c.taxTotal + c.buckets.savings + (c.buckets.retained === null ? 0 : c.buckets.retained) === c.totalUsed;

// ── 1. 各エンジンを直接呼んだ値と一致（単身・35歳・年収 500 万円） ──
{
  const r = emp(5_000_000), k = col(r, 'kaishain'), s = col(r, 'kojin');
  const sh = Shaho.calculateShaho({ monthlySalary: Math.round(5_000_000 / 12), targetMonth: Y.shahoTargetMonth, prefSlug: 'tokyo', age: 35, koyoCategory: 'ippan' }, data.shaho);
  const empSI = sh.employee.socialInsuranceRounded * 12, koyoEmp = Math.round(sh.employee.koyo * 12);
  const full = (sh.health.full + sh.shienkin.full + sh.koseiNenkin.full) * 12;
  A('会社員: 社会保険料（本人）＝ Shaho の本人負担 × 12 ＋ 雇用保険', k.siEmployee === empSI + koyoEmp && item(k.siEmployeeItems, 'kenpoKosei') === empSI && item(k.siEmployeeItems, 'koyo') === koyoEmp);
  A('会社員: 健保・厚年の本人＋会社 ＝ Shaho の保険料の全額 × 12', item(k.siEmployeeItems, 'kenpoKosei') + item(k.siEmployerItems, 'kenpoKosei') === Math.round(full));
  A('会社員: 雇用保険の会社負担 ＝ 月額 × 0.85% × 12 ＝ 42,500', item(k.siEmployerItems, 'koyo') === 42500);
  A('会社員: 子ども・子育て拠出金 ＝ 標準報酬月額 410,000 × 0.36% × 12 ＝ 17,712', item(k.siEmployerItems, 'kyoshutsukin') === 17712);
  A('会社員: 総額 ＝ 額面年収 ＋ 会社負担', r.total === 5_000_000 + k.siEmployer && k.totalUsed === r.total);
  A('会社員: 所得税 ＝ Shotoku を直接呼んだ値', item(k.taxes, 'shotokuzei') === engine.calcShotokuzei({ salary: 5_000_000, socialInsurance: empSI + koyoEmp }).annualTax);
  A('会社員: 住民税 ＝ calculateJumin を直接呼んだ値（令和9年度分・級地 1）', item(k.taxes, 'juminzei') === calculateJumin(data.jumin, { salary: 5_000_000, socialInsurance: empSI + koyoEmp, age: 35, fiscalYear: Y.juminFiscalYear, kyuchi: 1 }).total);
  A('会社員: 手取り ＝ 額面年収 − 社会保険料（本人）− 所得税 − 住民税', k.takeHome === 5_000_000 - k.siEmployee - k.taxTotal);
  A('会社員: 年金 ＝ 基礎 21,183 ＋ 厚生（標準報酬月額 410,000）26,967', k.pension.kiso === 21183 && k.pension.kosei === NK.koseiIncrease(data.nenkinKyufu, 410000) && k.pension.kosei === 26967);

  const profit = r.total, jigyo = profit - 650_000;
  const kk = calculateKokuho({ income: jigyo, members: [{ income: jigyo, careTarget: false }], family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 0, fixedAssetTax: 0 }, data.kokuho).total;
  const nm = data.nenkin.monthly * 12;
  A('個人事業: 売上から経費を引いた額 ＝ 会社員の総額', s.totalUsed === r.total);
  A('個人事業: 事業所得 ＝ 総額 − 青色申告特別控除 65 万円', s.gross === jigyo && s.grossKind === 'jigyoShotoku');
  A('個人事業: 国保 ＝ calculateKokuho を直接呼んだ値', item(s.siEmployeeItems, 'kokuho') === kk);
  A('個人事業: 国民年金 ＝ 月額 17,920 × 12 ＝ 215,040', item(s.siEmployeeItems, 'kokuminNenkin') === nm && nm === 215040);
  A('個人事業: 所得税 ＝ Shotoku を直接呼んだ値', item(s.taxes, 'shotokuzei') === engine.calcShotokuzei({ salary: 0, otherIncome: jigyo, socialInsurance: kk + nm }).annualTax);
  A('個人事業: 住民税 ＝ calculateJumin を直接呼んだ値', item(s.taxes, 'juminzei') === calculateJumin(data.jumin, { salary: 0, otherIncome: jigyo, socialInsurance: kk + nm, age: 35, fiscalYear: Y.juminFiscalYear, kyuchi: 1 }).total);
  A('個人事業: 個人事業税 ＝ Jigyozei を直接呼んだ値（青色申告特別控除を引く前の額にかかる）', item(s.taxes, 'kojinJigyozei') === Z.calc(data.jigyozei, { income: profit, rateKey: 'type1' }).tax);
  A('個人事業: 手取り ＝ 総額 − 国保 − 国民年金 − 所得税 − 住民税 − 個人事業税', s.takeHome === profit - kk - nm - s.taxTotal);
  A('個人事業: 年金 ＝ 基礎 21,183 のみ', s.pension.kiso === 21183 && s.pension.kosei === null);
}

// ── 2. 総額の検算（列を順に回す） ──
const GRID = [];
for (const nenshu of [1_200_000, 2_000_000, 3_000_000, 4_740_000, 5_000_000, 6_500_000, 8_000_000, 12_000_000, 20_000_000])
  for (const common of [{}, { age: 45 }, { age: 62 }, { age: 19 }, { spouse: { age: 35, salary: 0 } }, { age: 45, spouse: { age: 43, salary: 1_000_000 }, kids: { u16: 2, preschool: 1, a1618: 1, a1922: 1 } }, { spouse: { age: 33, salary: 4_000_000 } }])
    GRID.push(emp(nenshu, common), sole(nenshu, Math.round(nenshu * 0.2), common));
A(`総額の検算: ${GRID.length} 件 × 全列で 総額 ＝ 手取り ＋ 社保（会社・本人）＋ 税 ＋ 積立 ＋ 会社に残る額`, GRID.every((r) => r.columns.every(identity)));
A('内訳の合計が各項目と一致（社保の内訳・税の内訳・積立の内訳）', GRID.every((r) => r.columns.every((c) =>
  c.siEmployee === c.siEmployeeItems.reduce((s, x) => s + x.amount, 0) && c.taxTotal === c.taxes.reduce((s, x) => s + x.amount, 0) &&
  c.buckets.savings === c.buckets.savingsItems.reduce((s, x) => s + x.amount, 0) && (c.siEmployer === null || c.siEmployer === c.siEmployerItems.reduce((s, x) => s + x.amount, 0)))));
A('金額はすべて整数（円未満の端数・NaN が無い）', GRID.every((r) => Number.isInteger(r.total) && r.columns.every((c) =>
  [c.totalUsed, c.gross, c.siEmployee, c.taxTotal, c.takeHome, c.buckets.savings].every(Number.isInteger) && c.taxes.every((t) => Number.isInteger(t.amount) && t.amount >= 0))));

// ── 3. 列の形 ──
{
  const r = emp(5_000_000);
  const r2 = H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, data, { columns: ['kaishain', 'kojin'] });
  A('schemaVersion ＝ 1', r.schemaVersion === 1 && H.SCHEMA_VERSION === 1);
  A('列を省いたときの結果 ＝ [kaishain, kojin] を渡したときの結果', JSON.stringify(r) === JSON.stringify(r2));
  A('既定の列は kaishain・kojin の順', r.columns.map((c) => c.key).join() === 'kaishain,kojin' && H.DEFAULT_COLUMNS.join() === 'kaishain,kojin');
  const rev = H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, data, { columns: ['kojin', 'kaishain'] });
  A('列の順は引数どおり。順を変えても各列の中身は同じ', rev.columns.map((c) => c.key).join() === 'kojin,kaishain' && JSON.stringify(col(rev, 'kojin')) === JSON.stringify(col(r, 'kojin')) && JSON.stringify(col(rev, 'kaishain')) === JSON.stringify(col(r, 'kaishain')));
  const one = H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, data, { columns: ['kojin'] });
  A('1 列だけでも作れる（ほかの列の結果を読んでいない）', one.columns.length === 1 && JSON.stringify(one.columns[0]) === JSON.stringify(col(r, 'kojin')));
  const keys = (c) => Object.keys(c).sort().join();
  A('全列でキーの集合が同じ', keys(col(r, 'kaishain')) === keys(col(r, 'kojin')));
  A('個人事業: 社会保険料（会社）は null（0 円ではない）・内訳は空', col(r, 'kojin').siEmployer === null && col(r, 'kojin').siEmployerItems.length === 0);
  A('個人事業: 厚生年金の増え方は null', col(r, 'kojin').pension.kosei === null);
  A('会社に残る額は、会社員・個人事業とも null', r.columns.every((c) => c.buckets.retained === null));
  A('配偶者がいないとき、配偶者の年金は null', r.columns.every((c) => c.pension.spouseKiso === null));
  A('知らない列は RangeError', errOf(() => H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, data, { columns: ['kaishain', 'houjin'] })) === 'RangeError');
  A('列が空の配列は TypeError', errOf(() => H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, data, { columns: [] })) === 'TypeError');
  A('知らない入れ物（input.houjin）があっても結果は変わらない', JSON.stringify(H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 }, houjin: { yakuinHoshu: 3_000_000 } }, data)) === JSON.stringify(r));
  A('前提の表示用の情報: 個人事業に青色申告特別控除と業種（既定を使ったことが分かる）', (() => { const a = col(r, 'kojin').assumptions; const ao = a.find((x) => x.key === 'aoiro'), gy = a.find((x) => x.key === 'gyoshu'); return ao.value === 650000 && ao.defaulted === true && gy.value === 'type1' && gy.defaulted === true; })());
}

// ── 4. 揃え方（総額と逆算） ──
{
  let mono = true, prev = -1, maxJump = 0;
  for (let n = 0; n <= 15_000_000; n += 10_000) { const t = emp(n).total; if (t < prev) mono = false; if (prev >= 0) maxJump = Math.max(maxJump, t - prev - 10_000); prev = t; }
  A('総額は額面年収に対して減らない（0〜1,500 万円を 1 万円刻み）', mono);
  let round = true, gapOk = true, maxGap = 0;
  for (let n = 1_000_000; n <= 14_000_000; n += 137_000) {
    const t = emp(n).total, back = sole(t, 0);
    if (back.align.nenshu !== n || back.align.gap !== 0) round = false;
    const g = sole(n, 0).align.gap; maxGap = Math.max(maxGap, g); if (g < 0 || g >= 80_000) gapOk = false;
  }
  A('額面年収 → 総額 → 個人事業から入れ直す と、元の額面年収に戻る（差 0 円）', round);
  A(`個人事業から入れたときに揃えきれない差は 0 円以上・等級 1 段ぶん未満（最大 ${maxGap.toLocaleString()} 円・段の最大 ${maxJump.toLocaleString()} 円）`, gapOk);
  const r = sole(6_000_000, 0);
  A('個人事業から入れたとき: 個人事業の列は入れた額、会社員の列は逆算した年収の総額で計算', col(r, 'kojin').totalUsed === 6_000_000 && col(r, 'kaishain').totalUsed === r.align.kaishainTotal && r.total === 6_000_000 && r.align.gap === 6_000_000 - r.align.kaishainTotal);
  A('個人事業から入れたとき: 逆算した年収は 1,000 円単位で、もう 1,000 円上げると総額を超える', r.align.nenshu % 1000 === 0 && emp(r.align.nenshu + 1000).total > 6_000_000);
  A('売上と経費: 売上 800 万・経費 200 万 ＝ 売上 600 万・経費 0', JSON.stringify(sole(8_000_000, 2_000_000)) === JSON.stringify(sole(6_000_000, 0)));
  A('総額が小さすぎて額面年収に直せないときは RangeError', errOf(() => sole(100_000, 0)) === 'RangeError');
}

// ── 5. 年齢の境目 ──
{
  const care = (age) => col(emp(5_000_000, { age }), 'kaishain').siEmployee, careK = (age) => item(col(emp(5_000_000, { age }), 'kojin').siEmployeeItems, 'kokuho');
  A('39 歳 → 40 歳で、会社員の社会保険料に介護保険が加わる', care(40) > care(39) && care(39) === care(35));
  A('64 歳 → 65 歳で、会社員の社会保険料から介護保険が外れる', care(64) > care(65) && care(64) === care(40));
  A('39 歳 → 40 歳で、国保に介護分が加わる。65 歳で外れる', careK(40) > careK(39) && careK(65) < careK(64));
  const nk = (age) => item(col(emp(5_000_000, { age }), 'kojin').siEmployeeItems, 'kokuminNenkin');
  A('国民年金: 19 歳は 0・20 歳と 59 歳は 215,040・60 歳は 0', nk(19) === 0 && nk(20) === 215040 && nk(59) === 215040 && nk(60) === 0);
  const pk = (age, key) => col(emp(5_000_000, { age }), key).pension;
  A('基礎年金の増え方: 20〜59 歳だけ（19 歳・60 歳は null）', pk(19, 'kaishain').kiso === null && pk(20, 'kaishain').kiso === 21183 && pk(59, 'kojin').kiso === 21183 && pk(60, 'kojin').kiso === null && pk(60, 'kaishain').kiso === null);
  A('厚生年金の増え方: 60 歳以上の会社員にもある（70 歳未満）', pk(62, 'kaishain').kosei === 26967);
  A('74 歳は計算できる・75 歳は RangeError（後期高齢者医療）', errOf(() => emp(3_000_000, { age: 74 })) === null && errOf(() => emp(3_000_000, { age: 75 })) === 'RangeError');
  A('14 歳は RangeError', errOf(() => emp(3_000_000, { age: 14 })) === 'RangeError');
}

// ── 6. 家族 ──
{
  const base = emp(5_000_000), sp0 = emp(5_000_000, { spouse: { age: 35, salary: 0 } });
  A('配偶者（収入なし）: 会社員の社会保険料は変わらない（被扶養者）', col(sp0, 'kaishain').siEmployee === col(base, 'kaishain').siEmployee && sp0.total === base.total);
  A('配偶者（収入なし）: 会社員の所得税・住民税は下がる（配偶者控除）', col(sp0, 'kaishain').taxTotal < col(base, 'kaishain').taxTotal);
  A('配偶者（収入なし）: 会社員の列で配偶者の基礎年金が増える（保険料 0 円）', col(sp0, 'kaishain').pension.spouseKiso === 21183);
  A('配偶者（収入なし）: 個人事業は国民年金が 2 人分・国保が増える', item(col(sp0, 'kojin').siEmployeeItems, 'kokuminNenkin') === 430080 && item(col(sp0, 'kojin').siEmployeeItems, 'kokuho') > item(col(base, 'kojin').siEmployeeItems, 'kokuho') && col(sp0, 'kojin').pension.spouseKiso === 21183);
  const sdj = calcSpouseDeductionJumin({ selfIncome: calcSalaryIncome(5_000_000, Y.juminFiscalYear), spouseIncome: 0, age70plus: false, fiscalYear: Y.juminFiscalYear, data: data.haigu });
  A('配偶者（収入なし）: 会社員の住民税 ＝ 配偶者控除・人的控除差・非課税判定の人数を入れて直接呼んだ値', item(col(sp0, 'kaishain').taxes, 'juminzei') === calculateJumin(data.jumin, { salary: 5_000_000, socialInsurance: col(sp0, 'kaishain').siEmployee, age: 35, spouseDeduction: sdj.deduction, dependents: 1, humanDeductionDiff: 50_000 + sdj.humanDiffAmount, fiscalYear: Y.juminFiscalYear, kyuchi: 1 }).total && sdj.kind === 'haigu');
  A('配偶者（収入なし）: 会社員の所得税 ＝ 配偶者を入れて直接呼んだ値', item(col(sp0, 'kaishain').taxes, 'shotokuzei') === engine.calcShotokuzei({ salary: 5_000_000, socialInsurance: col(sp0, 'kaishain').siEmployee, spouse: { income: 0, age70plus: false } }).annualTax);
  const sp60 = emp(5_000_000, { spouse: { age: 62, salary: 0 } });
  A('配偶者が 60 歳以上: 国民年金は本人 1 人分・配偶者の基礎年金は増えない', item(col(sp60, 'kojin').siEmployeeItems, 'kokuminNenkin') === 215040 && col(sp60, 'kojin').pension.spouseKiso === null && col(sp60, 'kaishain').pension.spouseKiso === null);
  const spW = emp(5_000_000, { spouse: { age: 35, salary: 4_000_000 } });
  A('配偶者が自分の社会保険（年収 400 万円）: 個人事業の国保・国民年金は単身と同じ・配偶者の年金は null', col(spW, 'kojin').siEmployee === col(base, 'kojin').siEmployee && col(spW, 'kojin').pension.spouseKiso === null && col(spW, 'kaishain').pension.spouseKiso === null);
  A('配偶者の年収 129 万 9,999 円は被扶養・130 万円は自分の社会保険', col(emp(5_000_000, { spouse: { age: 35, salary: 1_299_999 } }), 'kojin').siEmployee > col(base, 'kojin').siEmployee && col(emp(5_000_000, { spouse: { age: 35, salary: 1_300_000 } }), 'kojin').siEmployee === col(base, 'kojin').siEmployee);
  A('ownShaho を明示すると、収入が少なくても自分の社会保険として扱う', col(emp(5_000_000, { spouse: { age: 35, salary: 1_000_000, ownShaho: true } }), 'kojin').siEmployee === col(base, 'kojin').siEmployee);
  const k16 = emp(5_000_000, { kids: { u16: 2 } }), k18 = emp(5_000_000, { kids: { a1618: 1 } }), k22 = emp(5_000_000, { kids: { a1922: 1 } });
  A('子（16 歳未満）2 人: 会社員の社会保険料は同じ・個人事業の国保は増える', col(k16, 'kaishain').siEmployee === col(base, 'kaishain').siEmployee && item(col(k16, 'kojin').siEmployeeItems, 'kokuho') > item(col(base, 'kojin').siEmployeeItems, 'kokuho'));
  A('子（16 歳未満）: 所得税は変わらない（扶養控除なし）', item(col(k16, 'kaishain').taxes, 'shotokuzei') === item(col(base, 'kaishain').taxes, 'shotokuzei'));
  A('子（16〜18 歳）: 所得税・住民税が下がる', item(col(k18, 'kaishain').taxes, 'shotokuzei') < item(col(base, 'kaishain').taxes, 'shotokuzei') && item(col(k18, 'kaishain').taxes, 'juminzei') < item(col(base, 'kaishain').taxes, 'juminzei'));
  A('子（19〜22 歳）: 16〜18 歳より税が下がる（特定扶養）', col(k22, 'kaishain').taxTotal < col(k18, 'kaishain').taxTotal && col(k22, 'kojin').taxTotal < col(k18, 'kojin').taxTotal);
  A('子（16〜18 歳）: 会社員の所得税 ＝ 一般扶養 1 人で直接呼んだ値', item(col(k18, 'kaishain').taxes, 'shotokuzei') === engine.calcShotokuzei({ salary: 5_000_000, socialInsurance: col(k18, 'kaishain').siEmployee, dependents: { general: 1, specific: 0 }, under23Dependent: true }).annualTax);
  // 低い年収: 非課税判定の人数と、住民税の年度（給与所得控除の最低額）が結果を左右する帯
  const low = emp(2_050_000, { kids: { u16: 2 } }), lowK = col(low, 'kaishain');
  const lowDirect = (fy, dependents) => calculateJumin(data.jumin, { salary: 2_050_000, socialInsurance: lowK.siEmployee, age: 35, dependents, under23Dependent: true, fiscalYear: fy, kyuchi: 1 }).total;
  A('年収 205 万円・子（16 歳未満）2 人: 住民税は非課税（16 歳未満も非課税判定の人数に入る）', item(lowK.taxes, 'juminzei') === 0 && lowDirect(Y.juminFiscalYear, 2) === 0 && lowDirect(Y.juminFiscalYear, 0) > 0);
  const y15 = col(emp(1_500_000), 'kaishain');
  const y15Direct = (fy) => calculateJumin(data.jumin, { salary: 1_500_000, socialInsurance: y15.siEmployee, age: 35, fiscalYear: fy, kyuchi: 1 }).total;
  A('年収 150 万円: 住民税は令和9年度分で計算している（令和8年度分で計算した額とは違う）', item(y15.taxes, 'juminzei') === y15Direct(Y.juminFiscalYear) && y15Direct(Y.juminFiscalYear) !== y15Direct(Y.juminFiscalYear - 1));
  A('級地: 3 級地にすると、非課税の限度額が下がり、年収 205 万円・子 2 人でも均等割がかかる', item(col(emp(2_050_000, { kyuchi: 3, kids: { u16: 2 } }), 'kaishain').taxes, 'juminzei') > 0);
  // 配偶者の給与所得も令和9年度分の計算（給与所得控除の最低額が違う）で出す。年収 129 万円は年度で所得が変わる帯
  const spP = emp(5_000_000, { spouse: { age: 35, salary: 1_290_000 } }), spInc = calcSalaryIncome(1_290_000, Y.juminFiscalYear);
  const jigyoP = spP.total - 650_000;
  A('配偶者パート 129 万円: 国保 ＝ 配偶者の給与所得（令和9年度分の計算）を入れて直接呼んだ値', spInc !== calcSalaryIncome(1_290_000, Y.juminFiscalYear - 1) &&
    item(col(spP, 'kojin').siEmployeeItems, 'kokuho') === calculateKokuho({ income: jigyoP + spInc, members: [{ income: jigyoP, careTarget: false }, { income: spInc, careTarget: false }], family: 2, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 }, data.kokuho).total);
  A('未就学児を入れると、国保は同じ人数の 16 歳未満より下がるか同じ（未就学児の均等割の軽減）', item(col(emp(5_000_000, { kids: { u16: 2, preschool: 2 } }), 'kojin').siEmployeeItems, 'kokuho') <= item(col(k16, 'kojin').siEmployeeItems, 'kokuho'));
}

// ── 7. 個人事業の条件 ──
{
  const base = emp(5_000_000);
  const kj = (kojin) => col(emp(5_000_000, {}, { kojin }), 'kojin');
  A('青色申告特別控除 0 円: 事業所得 ＝ 総額。所得税・住民税・国保が増える', kj({ aoiro: 0 }).gross === base.total && kj({ aoiro: 0 }).taxTotal > col(base, 'kojin').taxTotal && kj({ aoiro: 0 }).siEmployee > col(base, 'kojin').siEmployee);
  A('青色申告特別控除を変えても、個人事業税は変わらない', [0, 100000, 550000, 650000].every((a) => item(kj({ aoiro: a }).taxes, 'kojinJigyozei') === item(col(base, 'kojin').taxes, 'kojinJigyozei')));
  A('青色申告特別控除を明示すると defaulted は false', kj({ aoiro: 650000 }).assumptions.find((x) => x.key === 'aoiro').defaulted === false && kj({ aoiro: 650000 }).takeHome === col(base, 'kojin').takeHome);
  A('選べない額の青色申告特別控除（30 万円）は RangeError', errOf(() => kj({ aoiro: 300000 })) === 'RangeError');
  A('青色申告特別控除は事業の所得が限度（総額 50 万円なら控除 50 万円）', (() => { const c = col(sole(500_000, 0), 'kojin'); return c.gross === 0 && c.assumptions.find((x) => x.key === 'aoiro').value === 500000; })());
  A('業種: かからない事業（none）は個人事業税 0 円・手取りがその分だけ多い', item(kj({ gyoshu: 'none' }).taxes, 'kojinJigyozei') === 0 && kj({ gyoshu: 'none' }).takeHome - col(base, 'kojin').takeHome === item(col(base, 'kojin').taxes, 'kojinJigyozei'));
  A('業種: 3% ＜ 4% ＜ 5%', item(kj({ gyoshu: 'type3low' }).taxes, 'kojinJigyozei') < item(kj({ gyoshu: 'type2' }).taxes, 'kojinJigyozei') && item(kj({ gyoshu: 'type2' }).taxes, 'kojinJigyozei') < item(kj({ gyoshu: 'type3' }).taxes, 'kojinJigyozei'));
  A('知らない業種は RangeError', errOf(() => kj({ gyoshu: 'type9' })) === 'RangeError');
  const withK = kj({ ideco: 816000, kyosai: 840000 });
  A('iDeCo・小規模企業共済: 積立に入り、内訳が分かる', withK.buckets.savings === 1656000 && item(withK.buckets.savingsItems, 'ideco') === 816000 && item(withK.buckets.savingsItems, 'kyosai') === 840000);
  A('iDeCo・小規模企業共済: 所得税と住民税が下がる・国保と個人事業税は変わらない', item(withK.taxes, 'shotokuzei') < item(col(base, 'kojin').taxes, 'shotokuzei') && item(withK.taxes, 'juminzei') < item(col(base, 'kojin').taxes, 'juminzei') && withK.siEmployee === col(base, 'kojin').siEmployee && item(withK.taxes, 'kojinJigyozei') === item(col(base, 'kojin').taxes, 'kojinJigyozei'));
  A('iDeCo・小規模企業共済: 手取りの減り方 ＝ 掛金 − 税が下がった額', col(base, 'kojin').takeHome - withK.takeHome === 1656000 - (col(base, 'kojin').taxTotal - withK.taxTotal));
  const kI = col(emp(5_000_000, {}, { kaishain: { ideco: 276000 } }), 'kaishain');
  A('会社員の iDeCo: 積立に入り、税が下がる。社会保険料と総額は変わらない', kI.buckets.savings === 276000 && kI.taxTotal < col(base, 'kaishain').taxTotal && kI.siEmployee === col(base, 'kaishain').siEmployee && kI.totalUsed === base.total);
  A('掛金 0 円のとき、積立の内訳は空', col(base, 'kojin').buckets.savingsItems.length === 0 && col(base, 'kaishain').buckets.savingsItems.length === 0);
}

// ── 8. 不正な入力・制度値の欠落 ──
{
  const call = (input, d) => errOf(() => H.compare(input, d || data));
  A('nenshu "5000000"（文字列）は TypeError', call({ mode: 'kaishain', common: C(), kaishain: { nenshu: '5000000' } }) === 'TypeError');
  A('nenshu NaN・Infinity・負の数は RangeError', [NaN, Infinity, -1].every((v) => call({ mode: 'kaishain', common: C(), kaishain: { nenshu: v } }) === 'RangeError'));
  A('nenshu が無いときは TypeError', call({ mode: 'kaishain', common: C(), kaishain: {} }) === 'TypeError' && call({ mode: 'kaishain', common: C() }) === 'TypeError');
  A('uriage が無いときは TypeError', call({ mode: 'kojin', common: C(), kojin: {} }) === 'TypeError');
  A('経費が売上を上回るときは RangeError', call({ mode: 'kojin', common: C(), kojin: { uriage: 1_000_000, keihi: 2_000_000 } }) === 'RangeError');
  A('知らない mode は RangeError', call({ mode: 'houjin', common: C(), kaishain: { nenshu: 5_000_000 } }) === 'RangeError');
  A('common が無いときは例外', call({ mode: 'kaishain', kaishain: { nenshu: 5_000_000 } }) === 'Error');
  A('age が無い・文字列・小数は例外', call({ mode: 'kaishain', common: C({ age: undefined }), kaishain: { nenshu: 5_000_000 } }) === 'TypeError' && call({ mode: 'kaishain', common: C({ age: '35' }), kaishain: { nenshu: 5_000_000 } }) === 'TypeError' && call({ mode: 'kaishain', common: C({ age: 35.5 }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError');
  A('prefSlug が無いときは TypeError', call({ mode: 'kaishain', common: C({ prefSlug: '' }), kaishain: { nenshu: 5_000_000 } }) === 'TypeError');
  A('知らない都道府県は例外（社会保険料の料率が引けない）', call({ mode: 'kaishain', common: C({ prefSlug: 'atlantis' }), kaishain: { nenshu: 5_000_000 } }) !== null);
  A('kyuchi が 1・2・3 以外は RangeError', call({ mode: 'kaishain', common: C({ kyuchi: 4 }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError' && call({ mode: 'kaishain', common: C({ kyuchi: undefined }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError');
  A('子の人数が負・小数・文字列は例外', call({ mode: 'kaishain', common: C({ kids: { u16: -1 } }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError' && call({ mode: 'kaishain', common: C({ kids: { a1618: 0.5 } }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError' && call({ mode: 'kaishain', common: C({ kids: { a1922: '1' } }), kaishain: { nenshu: 5_000_000 } }) === 'TypeError');
  A('未就学児が 16 歳未満の人数を超えるときは RangeError', call({ mode: 'kaishain', common: C({ kids: { u16: 1, preschool: 2 } }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError');
  A('配偶者の年齢が無い・収入が負は例外', call({ mode: 'kaishain', common: C({ spouse: { salary: 0 } }), kaishain: { nenshu: 5_000_000 } }) === 'TypeError' && call({ mode: 'kaishain', common: C({ spouse: { age: 35, salary: -1 } }), kaishain: { nenshu: 5_000_000 } }) === 'RangeError');
  A('掛金が負・文字列は例外', call({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000, ideco: -1 } }) === 'RangeError' && call({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 }, kojin: { kyosai: '840000' } }) === 'TypeError');
  const without = (k) => { const d = Object.assign({}, data); delete d[k]; return d; };
  A('制度値が欠けていると例外（config・shaho・shotokuDb・haigu・nenkin・nenkinKyufu・kokuho・jigyozei）', ['config', 'shaho', 'shotokuDb', 'haigu', 'nenkin', 'nenkinKyufu', 'kokuho', 'jigyozei'].every((k) => call({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, without(k)) !== null));
  A('年の定めが欠けていると例外（既定の年で計算しない）', call({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, Object.assign({}, data, { config: Object.assign({}, data.config, { years: { shotokuYear: 2026 } }) })) === 'Error');
  A('会社員の列だけなら、国保と個人事業税の制度値が無くても計算できる', errOf(() => H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, without('kokuho'), { columns: ['kaishain'] })) === null);
  const noJ = H.compare({ mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }, Object.assign({}, data, { jumin: null }));
  A('自治体の住民税データが無い（null）ときは、住民税エンジンの既定の税率で計算する', item(col(noJ, 'kaishain').taxes, 'juminzei') === calculateJumin(null, { salary: 5_000_000, socialInsurance: col(noJ, 'kaishain').siEmployee, age: 35, fiscalYear: Y.juminFiscalYear, kyuchi: 1 }).total);
}

// ── 9. 人的控除差の組み立てが、奨学金の結線の表と食い違っていない ──
{
  // hatarakikata.js は 基礎 5万＋配偶者（住民税エンジンの表）＋一般扶養 5万×人数 を自分で足している。同じ条件を奨学金の結線の関数に通し、住民税の額が一致することを確かめる
  let ok = true;
  for (const spouse of [null, { age: 35, salary: 0 }, { age: 72, salary: 0 }])
    for (const a1618 of [0, 1, 2]) for (const a1922 of [0, 1]) for (const u16 of [0, 2]) {
      const r = emp(6_000_000, { spouse, kids: { u16, a1618, a1922 } }), k = col(r, 'kaishain');
      const via = Bridge.supporterFromIncome(data.jumin, { salary: 6_000_000, socialInsurance: k.siEmployee, age: 35, fiscalYear: Y.juminFiscalYear,
        spouseIncome: spouse ? 0 : undefined, spouseAge70plus: !!(spouse && spouse.age >= 70), generalDependents: a1618, youngDependents: u16, specialDependentSalaries: Array(a1922).fill(0), under23Dependent: u16 + a1618 + a1922 > 0 })._jumin.total;
      if (item(k.taxes, 'juminzei') !== via) ok = false;
    }
  A('住民税: 配偶者・子の組み合わせ 36 通りで、奨学金の結線（supporterFromIncome）を通した額と一致', ok);
}

// ── 10. 期待値ファイル ──
{
  const CASES = [
    ['単身35歳・年収300万', { mode: 'kaishain', common: C(), kaishain: { nenshu: 3_000_000 } }],
    ['単身35歳・年収500万', { mode: 'kaishain', common: C(), kaishain: { nenshu: 5_000_000 } }],
    ['単身35歳・年収800万', { mode: 'kaishain', common: C(), kaishain: { nenshu: 8_000_000 } }],
    ['単身35歳・年収1200万', { mode: 'kaishain', common: C(), kaishain: { nenshu: 12_000_000 } }],
    ['単身45歳・年収500万（介護保険あり）', { mode: 'kaishain', common: C({ age: 45 }), kaishain: { nenshu: 5_000_000 } }],
    ['単身62歳・年収400万', { mode: 'kaishain', common: C({ age: 62 }), kaishain: { nenshu: 4_000_000 } }],
    ['夫婦（配偶者は収入なし）・子2人（未就学1・小学生1）・40歳・年収600万', { mode: 'kaishain', common: C({ age: 40, spouse: { age: 38, salary: 0 }, kids: { u16: 2, preschool: 1 } }), kaishain: { nenshu: 6_000_000 } }],
    ['夫婦（配偶者パート100万）・子3人（中学生・高校生・大学生）・48歳・年収700万', { mode: 'kaishain', common: C({ age: 48, spouse: { age: 46, salary: 1_000_000 }, kids: { u16: 1, a1618: 1, a1922: 1 } }), kaishain: { nenshu: 7_000_000 } }],
    ['夫婦（配偶者は年収400万）・35歳・年収500万', { mode: 'kaishain', common: C({ spouse: { age: 33, salary: 4_000_000 } }), kaishain: { nenshu: 5_000_000 } }],
    ['単身35歳・個人事業・売上800万・経費200万', { mode: 'kojin', common: C(), kojin: { uriage: 8_000_000, keihi: 2_000_000 } }],
    ['単身35歳・個人事業・売上400万・経費50万・青色10万・課されない業種', { mode: 'kojin', common: C(), kojin: { uriage: 4_000_000, keihi: 500_000, aoiro: 100000, gyoshu: 'none' } }],
    ['夫婦（配偶者は収入なし）・子1人（高校生）・50歳・個人事業・売上1000万・経費300万・iDeCoと共済', { mode: 'kojin', common: C({ age: 50, spouse: { age: 48, salary: 0 }, kids: { a1618: 1 } }), kojin: { uriage: 10_000_000, keihi: 3_000_000, gyoshu: 'type3', ideco: 816000, kyosai: 840000 } }],
  ];
  const now = { note: '架空のモデル世帯の期待値。自治体のデータは scripts/expected/hatarakikata-fixture-*.json（固定の写し）。計算を意図して変えたときだけ node scripts/test-hatarakikata.cjs --update で書き直す', schemaVersion: H.SCHEMA_VERSION, cases: CASES.map(([label, input]) => ({ label, input, result: H.compare(input, data) })) };
  const text = JSON.stringify(now, null, 1) + '\n';
  if (process.argv.includes('--update')) { fs.writeFileSync(GOLDEN, text); console.log(`期待値ファイルを書き直しました: ${path.relative(ROOT, GOLDEN)}（${CASES.length} 件）`); }
  if (!fs.existsSync(GOLDEN)) { A('期待値ファイルがある', false); }
  else {
    const saved = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
    A(`期待値ファイルの件数 ＝ ${CASES.length}`, saved.cases.length === CASES.length);
    for (let i = 0; i < CASES.length; i++) {
      const s = saved.cases[i];
      A(`期待値と一致: ${CASES[i][0]}`, !!s && s.label === CASES[i][0] && JSON.stringify(s.result) === JSON.stringify(now.cases[i].result));
    }
    A('期待値ファイルの全件で総額の検算が成り立つ', saved.cases.every((c) => c.result.columns.every(identity)));
  }
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
