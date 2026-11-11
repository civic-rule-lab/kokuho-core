/**
 * js/core/kokuho.js（国保エンジン）の回帰テスト
 * 実行: node scripts/test-kokuho.js
 *
 * 2026-11-04: 未使用だった js/core/household.js を消すのに合わせ、scripts/test-household.js のうち
 * 国保エンジンを直接呼んでいた検査をここへ移した（全方向試算 段8）。household.js を通して作っていた入力は、
 * household.js が作っていた値をそのまま書いている（移す前と同じ入力で同じ検査）。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { load } = require("./lib/core-loader.cjs");
const { calculateKokuho, tokuteiSetaiKubunFromAge } = load("kokuho.js");

const kokuhoOf = (slug, year = 2026) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, `../data/municipalities/${slug}/kokuho-${year}.json`), 'utf-8'));
const saitamaKokuho = kokuhoOf('saitama', 2025);

let passed = 0;
let failed = 0;

function ok(label, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}${detail ? '\n     ' + detail : ''}`); }
}
function eq(label, actual, expected) {
  ok(label, actual === expected, `期待=${JSON.stringify(expected)} 実際=${JSON.stringify(actual)}`);
}

// ═══════════════════════════════════════════════════════════
// 共働き: 基礎控除は1人ずつ引く（2026-10-04・TASKS X170-12）
//   各 給与250万円（所得 1,670,000円）・45歳と38歳 → 所得割の基礎額は 1,240,000 × 2 = 2,480,000円。
//   介護分は45歳の1人の基礎額 1,240,000円 だけに掛かる。
// ═══════════════════════════════════════════════════════════
console.log('\n== 共働き（加入者ごとの基礎控除） ==');
{
  const inputs = {
    income: 3_340_000, reductionJudgmentIncome: 3_340_000,
    members: [{ income: 1_670_000, careTarget: true }, { income: 1_670_000, careTarget: false }],
    family: 2, tokuteiDouitsuCount: 0, giseiSetainushi: false, tokuteiSetaiKubun: null,
    preschool: 0, under18: 0, care: 1, salaryPensionCount: 2, fixedAssetTax: 0,
  };
  const d = saitamaKokuho;
  const r = calculateKokuho(inputs, d);
  const base = 2 * (1_670_000 - d.basicDeduction);
  eq('共働き: 医療分＝基礎額 2,480,000 で旧経路に渡した結果と同じ',
     r.medicalTotal,
     calculateKokuho({ ...inputs, members: undefined, income: base + d.basicDeduction }, d).medicalTotal);
  eq('共働き: 介護分は45歳1人の基礎額 1,240,000 だけ',
     r.careTotal,
     calculateKokuho({ ...inputs, members: undefined, income: 1_670_000 }, d).careTotal);
  ok('共働き: 合算1本で渡すより保険料が低い（基礎控除が2回）',
     r.total < calculateKokuho({ ...inputs, members: undefined }, d).total);
}

// ═══════════════════════════════════════════════════════════
// 軽減判定の年金特別控除（2026-10-24・X221）
//   国民健康保険法施行令 附則第5条: 65歳以上の公的年金所得から15万円を差し引いて軽減判定する（所得割には差し引かない）。
//   70歳・年金185万（所得75万）→ 判定所得 60万
// ═══════════════════════════════════════════════════════════
console.log('\n== 軽減判定の年金特別控除（X221） ==');
{
  const one = {
    income: 750_000, reductionJudgmentIncome: 600_000,
    members: [{ income: 750_000, careTarget: false }],
    family: 1, tokuteiDouitsuCount: 0, giseiSetainushi: false, tokuteiSetaiKubun: null,
    preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0,
  };
  const r1 = calculateKokuho(one, saitamaKokuho);
  const noDed = calculateKokuho({ ...one, reductionJudgmentIncome: 750_000 }, saitamaKokuho);
  ok(`70歳・年金185万: 控除ありの方が軽減が厚い（${r1.reductionLabel} ${r1.total} < ${noDed.reductionLabel} ${noDed.total}）`, r1.total < noDed.total);
}

// ═══════════════════════════════════════════════════════════
// 国保の加入者が 0 人の世帯（2026-10-24）
//   国民健康保険法 第76条第1項: 保険料は「被保険者の属する世帯の世帯主」から徴収する＝被保険者がいなければ 0 円。
//   旧実装は平等割と子ども・子育て支援金の世帯割を課していた。
//   入力は 76歳・年金150万と77歳・年金80万の2人がともに後期の世帯
// ═══════════════════════════════════════════════════════════
console.log('\n== 国保の加入者が 0 人の世帯 ==');
{
  const inputs = {
    income: 0, reductionJudgmentIncome: 250_000, members: [],
    family: 0, tokuteiDouitsuCount: 0, giseiSetainushi: false, tokuteiSetaiKubun: null,
    preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0,
  };
  const r = calculateKokuho(inputs, saitamaKokuho);
  eq('全員が後期: 国保 total = 0', r.total, 0);
  eq('全員が後期: 国保 月額 = 0', r.monthly, 0);
  // 加入者が 1 人いれば従来どおり平等割がかかる
  const one = calculateKokuho({ income: 0, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 }, saitamaKokuho);
  ok(`加入者 1 人・所得 0: 平等割・均等割がかかる（${one.total} 円 > 0）`, one.total > 0);
  // 資産割があっても 0 人なら 0
  eq('family 0・固定資産税あり: total = 0', calculateKokuho({ income: 0, family: 0, fixedAssetTax: 100_000 }, saitamaKokuho).total, 0);
  // saitama（令和7年度）は平等割・子育て支援金の世帯割が無く不具合が表に出ないため、平等割のある大阪市（令和8年度）でも確かめる
  const osaka = kokuhoOf('osaka');
  eq('大阪市・全員が後期: kokuho.total = 0（旧実装は平等割で 13,426 円）', calculateKokuho(inputs, osaka).total, 0);
  const o1 = calculateKokuho({ income: 0, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 }, osaka);
  ok(`大阪市・加入者 1 人・所得 0: 平等割がかかる（${o1.total} 円 > 0）`, o1.total > 0);
}

// ═══════════════════════════════════════════════════════════
// 特定同一世帯所属者（国民健康保険法施行令 第29条の7 第6項第1号・第3号・2026-10-25 全方向試算 B-2）
//   後期高齢者医療へ移り同じ世帯にいる人を、5割・2割の人数にも数える
// ═══════════════════════════════════════════════════════════
console.log('\n== 特定同一世帯所属者 ==');
{
  // 市原市（5割 43万＋31万×人数、2割 43万＋57万×人数）。加入者1人・判定所得 95万
  const ichihara = kokuhoOf('ichihara');
  const base = { income: 600_000, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0, reductionJudgmentIncome: 950_000 };
  eq('特定同一なし: 95万 > 74万（5割）→ 2割軽減', calculateKokuho(base, ichihara).reductionLabel, '2割軽減');
  eq('特定同一 1人: 95万 ≤ 43万＋31万×2 = 105万 → 5割軽減', calculateKokuho({ ...base, tokuteiDouitsuCount: 1 }, ichihara).reductionLabel, '5割軽減');
  const t1 = calculateKokuho({ ...base, tokuteiDouitsuCount: 1 }, ichihara), t0 = calculateKokuho(base, ichihara);
  ok(`特定同一 1人: 5割軽減になり、2割軽減より安い（${t1.total} < ${t0.total}）`, t1.total < t0.total);
}

// ═══════════════════════════════════════════════════════════
// 擬制世帯主も給与所得者等の数に入る（国民健康保険法施行令 第29条の7 第6項第1号・2026-10-25 全方向試算 B-3）
// ═══════════════════════════════════════════════════════════
console.log('\n== 擬制世帯主と給与所得者等の数 ==');
{
  // 市原市。加入者1人・給与所得者等 2人（擬制世帯主＋加入者）・判定所得 48万
  //   7割の基準 = 43万 ＋ 10万×(2−1) = 53万 → 7割軽減。擬制世帯主を数えないと 43万 → 5割軽減
  const ichihara = kokuhoOf('ichihara');
  const base = { income: 430_000, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 2, fixedAssetTax: 0, reductionJudgmentIncome: 480_000 };
  eq('擬制世帯主あり: 7割軽減（53万以下）', calculateKokuho({ ...base, giseiSetainushi: true }, ichihara).reductionLabel, '7割軽減');
  eq('擬制世帯主の指定なし: 従来どおり加入者数で頭打ち → 5割軽減', calculateKokuho(base, ichihara).reductionLabel, '5割軽減');
  eq('上限は世帯主等の人数（給与所得者等 3 と入れても 2 として扱う）',
    calculateKokuho({ ...base, salaryPensionCount: 3, giseiSetainushi: true, reductionJudgmentIncome: 560_000 }, ichihara).reductionLabel, '5割軽減');
}

// ═══════════════════════════════════════════════════════════
// 特定世帯・特定継続世帯の平等割（国民健康保険法施行令 第29条の7 第2項第8号ロ・ハ・2026-10-25 全方向試算 B-6）
// ═══════════════════════════════════════════════════════════
console.log('\n== 特定世帯・特定継続世帯の平等割 ==');
{
  // 愛南町（令和8年度）: 平等割 医療 20,000・支援 6,900・子ども子育て 670・介護 6,200。
  //   条例の特定世帯 10,000／3,450／335、特定継続世帯 15,000／5,170／502（町の公表ページ・データ注記）
  const ainan = kokuhoOf('ainan');
  const b = { income: 5_000_000, family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 };
  const n = calculateKokuho(b, ainan).total;
  // 2026-11-11 から区分ごとに 100 円未満を切り捨てるので、合計の差は切り捨て後の額どうしの差になる（減額そのものは 13,785・6,893 のまま）。
  eq('特定世帯: 平等割が 20,000＋6,900＋670 の半分（13,785）減る（介護分は減らない）→ 切捨て後の合計の差は 13,800', n - calculateKokuho({ ...b, tokuteiSetaiKubun: 'tokutei' }, ainan).total, 13_800);
  // 特定継続世帯: 5,000＋1,725＋168。条例は支援金分を 5,170（10円未満切捨て）としており、1円未満切捨ての本エンジンとは 5円ずれる
  eq('特定継続世帯: 平等割の 1/4（6,893）減る → 切捨て後の合計の差は 6,900', n - calculateKokuho({ ...b, tokuteiSetaiKubun: 'keizoku' }, ainan).total, 6_900);
  eq('加入者 2人なら特定世帯にならない（減額なし）', calculateKokuho({ ...b, family: 2 }, ainan).total - calculateKokuho({ ...b, family: 2, tokuteiSetaiKubun: 'tokutei' }, ainan).total, 0);

  // 後期へ移った人の年齢から区分を決める（75歳到達で移ると見なす: 5年以内＝79歳まで特定世帯、6〜8年目＝82歳まで特定継続世帯）
  eq('76歳（移って5年以内）: 特定世帯', tokuteiSetaiKubunFromAge(76), 'tokutei');
  eq('81歳（6〜8年目）: 特定継続世帯', tokuteiSetaiKubunFromAge(81), 'keizoku');
  eq('85歳（8年超）: どちらでもない', tokuteiSetaiKubunFromAge(85), null);
  eq('74歳（後期の前）: どちらでもない', tokuteiSetaiKubunFromAge(74), null);
}

// ═══════════════════════════════════════════════════════════
// 固定資産税額を省略しても NaN にしない（2026-10-25・全方向試算 B-7）
// ═══════════════════════════════════════════════════════════
console.log('\n== 固定資産税額の省略 ==');
{
  const aguni = kokuhoOf('aguni');
  const b = { income: 2_000_000, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1 };
  const zero = calculateKokuho({ ...b, fixedAssetTax: 0 }, aguni).total;
  eq('粟国村（資産割あり）: 省略すると 0 と同じ', calculateKokuho(b, aguni).total, zero);
  eq('負の値は 0 と同じ', calculateKokuho({ ...b, fixedAssetTax: -5 }, aguni).total, zero);
  eq('数でない値は 0 と同じ', calculateKokuho({ ...b, fixedAssetTax: 'abc' }, aguni).total, zero);
  // 医療分 30%・支援金分 6%（介護分は対象者なし）: 10万 × 36% = 36,000 増える
  eq('10万円なら資産割 36,000 円が加わる', calculateKokuho({ ...b, fixedAssetTax: 100_000 }, aguni).total - zero, 36_000);
  const dir = path.join(__dirname, '../data/municipalities');
  let withAsset = 0, nan = 0;
  for (const slug of fs.readdirSync(dir)) {
    const f = path.join(dir, slug, 'kokuho-2026.json');
    if (!fs.existsSync(f)) continue;
    const d = JSON.parse(fs.readFileSync(f, 'utf-8'));
    if (!d.assetLevy) continue;
    withAsset++;
    if (!Number.isFinite(calculateKokuho({ ...b, care: 1 }, d).total)) nan++;
  }
  ok(`資産割のある ${withAsset} 自治体すべてで、省略しても合計が数になる（NaN ${nan} 件）`, withAsset > 100 && nan === 0);
}

// ═══════════════════════════════════════════════════════════
// 世帯人数を省略しても NaN・「軽減なし」にしない（2026-10-25・全方向試算 B-8）
// ═══════════════════════════════════════════════════════════
console.log('\n== 世帯人数の省略 ==');
{
  const ichihara = kokuhoOf('ichihara');
  const b = { income: 500_000, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 };
  const one = calculateKokuho({ ...b, family: 1 }, ichihara);
  const omitted = calculateKokuho(b, ichihara);
  eq('省略すると 1 人とみなす（合計が family: 1 と同じ）', omitted.total, one.total);
  eq('省略しても軽減区分が付く（5割軽減）', omitted.reductionLabel, '5割軽減');
  eq('数でない値も 1 人とみなす', calculateKokuho({ ...b, family: 'abc' }, ichihara).total, one.total);
  eq('0 は従来どおり加入者 0 人（0 円）', calculateKokuho({ ...b, family: 0 }, ichihara).total, 0);
  const mem = [{ income: 250_000, careTarget: false }, { income: 250_000, careTarget: false }];
  eq('members だけ渡せばその人数（2 人）とみなす', calculateKokuho({ ...b, members: mem }, ichihara).total, calculateKokuho({ ...b, members: mem, family: 2 }, ichihara).total);
}

// ═══════════════════════════════════════════════════════════
// 区分ごとの端数単位（2026-11-11・TASKS X253）
//   既定は 100 円未満切捨て（保険税は地方税法 第20条の4の2 第3項）。データ rounding.componentUnit で 1・10 円。
// ═══════════════════════════════════════════════════════════
console.log('\n■ 区分ごとの端数単位');
{
  const base = kokuhoOf('saitama', 2025);
  const inp = { income: 2_000_000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 };
  const r1   = calculateKokuho(inp, { ...base, rounding: { componentUnit: 1 } });
  const r10  = calculateKokuho(inp, { ...base, rounding: { componentUnit: 10 } });
  const r100 = calculateKokuho(inp, { ...base, rounding: { componentUnit: 100 } });
  const rDef = calculateKokuho(inp, { ...base, rounding: undefined });
  const fl = (v, u) => Math.floor(v / u) * u;
  const parts = r => JSON.stringify([r.medicalTotal, r.supportTotal, r.careTotal, r.childcareTotal]);
  const raw = r => [r.medicalTotal, r.supportTotal, r.careTotal, r.childcareTotal];
  ok('1 円単位では区分の額に 100 円未満の端数が残る（この入力で端数あり）', raw(r1).some(v => v % 100 !== 0), parts(r1));
  eq('10 円単位＝各区分を 10 円未満切捨て', parts(r10), JSON.stringify(raw(r1).map(v => fl(v, 10))));
  eq('100 円単位＝各区分を 100 円未満切捨て', parts(r100), JSON.stringify(raw(r1).map(v => fl(v, 100))));
  eq('rounding が無ければ既定の 100 円', parts(rDef), parts(r100));
  eq('合計は切り捨てた区分の和（合計だけを切り捨てない）', r100.total, raw(r100).reduce((a, v) => a + v, 0));
  let threw = false;
  try { calculateKokuho(inp, { ...base, rounding: { componentUnit: 50 } }); } catch (e) { threw = e && e.name === 'RangeError'; }  // エンジンは vm で読み込むので instanceof は別の realm になる
  ok('許されない単位（50）は RangeError', threw);
  eq('特別区（新宿区）は 1 円単位のデータを持つ', kokuhoOf('shinjuku').rounding?.componentUnit, 1);
  // 合計だけ切り捨てる（長野市 条例17条2項・夕張市 条例15条）
  const rT = calculateKokuho(inp, { ...base, rounding: { componentUnit: 1, totalUnit: 10 } });
  eq('totalUnit 10・componentUnit 1: 区分は切り捨てない', parts(rT), parts(r1));
  eq('totalUnit 10: 合計だけ 10 円未満切捨て', rT.total, fl(raw(r1).reduce((a, v) => a + v, 0), 10));
  // 区分で単位が違う・100 円未満の区分は全額切捨て（千葉市 条例31条2項。子ども分は対象外）
  const rC = calculateKokuho(inp, { ...base, rounding: { componentUnit: { medical: 10, support: 10, care: 10, childcare: 1 }, componentDropBelow: 100 } });
  eq('区分ごとの単位（医療・支援 10 円）', JSON.stringify(raw(rC).slice(0, 2)), JSON.stringify(raw(r1).slice(0, 2).map(v => fl(v, 10))));
  const small = calculateKokuho({ income: 0, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
    { ...base, perCapita: { ...base.perCapita, support: 90 }, household: base.household ? { ...base.household, support: 0 } : base.household,
      rounding: { componentUnit: { medical: 10, support: 10, care: 10, childcare: 1 }, componentDropBelow: 100 } });
  eq('単位で切り捨てる区分が 100 円未満なら 0（支援分 90 円×軽減後 → 0）', small.supportTotal, 0);
  eq('子ども分は componentUnit 1 なので全額切捨ての対象外', calculateKokuho(inp, { ...base, rounding: { componentUnit: { childcare: 1 }, componentDropBelow: 100 } }).childcareTotal, r1.childcareTotal);
  let threwT = false;
  try { calculateKokuho(inp, { ...base, rounding: { totalUnit: 5 } }); } catch (e) { threwT = e && e.name === 'RangeError'; }
  ok('許されない totalUnit（5）は RangeError', threwT);
  eq('長野市は合計だけ 10 円単位', JSON.stringify(kokuhoOf('nagano').rounding && [kokuhoOf('nagano').rounding.componentUnit, kokuhoOf('nagano').rounding.totalUnit]), JSON.stringify([1, 10]));
  eq('夕張市は合計だけ 100 円単位', JSON.stringify([kokuhoOf('yubari').rounding?.componentUnit, kokuhoOf('yubari').rounding?.totalUnit]), JSON.stringify([1, 100]));
  eq('千葉市は医療・支援・介護 10 円・子ども分 1 円・100 円未満は全額切捨て', JSON.stringify(kokuhoOf('chiba').rounding?.componentUnit) + kokuhoOf('chiba').rounding?.componentDropBelow, JSON.stringify({ medical: 10, support: 10, care: 10, childcare: 1 }) + '100');
}

// ═══════════════════════════════════════════════════════════
// 結果
// ═══════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(55)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed}`);
if (failed === 0) console.log('✅ 全テスト通過');
console.log();
if (failed > 0) process.exit(1);
