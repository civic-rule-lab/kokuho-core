'use strict';
const L=require('./load-shogakukin.cjs');
const { calcShogakukin } = L.shogakukin();
const spec = L.spec();


let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (ok ? '' : `\n   got=${JSON.stringify(got)}\n   want=${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
}
const stu = (o) => Object.assign({ schoolType: '私立', attendance: '自宅外', level: '大学' }, o);

// 1) 課税標準0 → 第Ⅰ区分・満額（私立大学自宅外=75,800 / 減免 授業70万・入学26万）
let r = calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 1 });
check('第Ⅰ kubunCode', r.kubunCode, '1');
check('第Ⅰ 給付月額(私立大学自宅外満額)', r.grantMonthly, 75800);
check('第Ⅰ 減免上限', r.reductionCap, { tuition: 700000, admission: 260000 });

// 2) 基準額の式: taxable=600,000 → floor(36000)-1500=34,500 → 第Ⅲ（実額25,300）
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 600000 }], student: stu(), childrenCount: 1 });
check('第Ⅲ kijungaku', r.kijungaku, 34500);
check('第Ⅲ 給付月額(実額)', r.grantMonthly, 25300);
// [M1] 第Ⅲ減免 = 700000×1/3 を100円切上 = 233,400 / 260000×1/3=86,700
check('第Ⅲ 減免(1/3・100円切上)', r.reductionCap, { tuition: 233400, admission: 86700 });

// 3) 第Ⅱ区分: taxable=250,000 → 13,500 → 第Ⅱ（実額50,600）
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 250000 }], student: stu(), childrenCount: 1 });
check('第Ⅱ kubunCode', r.kubunCode, '2');
check('第Ⅱ 給付月額(実額)', r.grantMonthly, 50600);
// [M1] 700000×2/3=466,666.67→466,700 / 260000×2/3=173,333.3→173,400（100円切上）
check('第Ⅱ 減免(2/3・100円切上)', r.reductionCap, { tuition: 466700, admission: 173400 });

// 4) 第Ⅳレンジ非多子・非理工農 → 対象外
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: stu(), childrenCount: 1 });
check('第Ⅳレンジ非多子 kijungaku', r.kijungaku, 70500);
check('第Ⅳレンジ非多子 対象外', r.kubunCode, null);
check('第Ⅳレンジ非多子 給付0', r.grantMonthly, 0);
check('第Ⅳレンジ非多子 減免0', r.reductionCap, { tuition: 0, admission: 0 });

// 5) 多子(子3人) → 減免満額・給付は第Ⅳ実額(私立大学自宅外19,000)
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: stu(), childrenCount: 3 });
check('多子 第Ⅳ kubunCode', r.kubunCode, '4');
check('多子 減免満額', r.reductionCap, { tuition: 700000, admission: 260000 });
check('多子 給付(第Ⅳ実額)', r.grantMonthly, 19000);
check('多子 category', r.category, 'tashi');

// 6) [M2是正] 政令市補正は自前合成の標準3%経路では効かない → 非政令市と同値
const nd = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: stu(), childrenCount: 3 });
const dc = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000, designatedCity: true }], student: stu(), childrenCount: 3 });
check('政令市(自前3%合成) 非政令市と同値', dc.kijungaku, nd.kijungaku);
// 課税証明書の実額入力経路でのみ×3/4: cityAdjustActual=6000(=base15万×4%相当) → 政令市 floor(6000×3/4)=4500
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000, designatedCity: true, cityAdjustActual: 6000 }], student: stu(), childrenCount: 3 });
check('政令市 実額入力×3/4', r.kijungaku, Math.floor((Math.floor(1200000*0.06) - Math.floor(6000*0.75)) / 100) * 100);

// 7) 生計維持者2人合算: 父1,000,000(58,500)+母500,000(28,500)=87,000
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 1000000 }, { taxableIncome: 500000 }], student: stu(), childrenCount: 1 });
check('2人合算 kijungaku', r.kijungaku, 87000);

// 8) 国公立大学自宅 第Ⅰ → 29,200 / 減免 授業53.58万・入学28.2万
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu({ schoolType: '国公立', attendance: '自宅' }), childrenCount: 1 });
check('国公立自宅 給付満額', r.grantMonthly, 29200);
check('国公立 減免上限', r.reductionCap, { tuition: 535800, admission: 282000 });

// 9) [B4] 高専 第Ⅱ 自宅・生活保護特例 → 17,200（実額。フォールバックではない）
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 250000 }], student: { schoolType: '国公立', attendance: '自宅', level: '高等専門学校', specialCare: true }, childrenCount: 1 });
check('高専第Ⅱ自宅特例(実額17,200)', r.grantMonthly, 17200);
// 私立高専 第Ⅳ 自宅特例 → 8,800
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: { schoolType: '私立', attendance: '自宅', level: '高等専門学校', specialCare: true }, childrenCount: 3 });
check('私立高専第Ⅳ自宅特例(実額8,800)', r.grantMonthly, 8800);

// 10) [B1] 私立理工農系 第Ⅳ(非多子) → 給付0・減免=授業料は式で確定(700,000/3=233,400)・入学金はnull(要確認)
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: stu({ attendance: '自宅' }), childrenCount: 1, rikoNoPrivate: true });
check('理工農第Ⅳ kubunCode', r.kubunCode, '4');
check('理工農第Ⅳ 給付0', r.grantMonthly, 0);
check('理工農第Ⅳ category', r.category, 'riko');
check('理工農(大学)第Ⅳ 減免(授業料=式で確定・入学金null)', r.reductionCap, { tuition: 233400, admission: 86700 });
check('理工農第Ⅳ 授業料は確定(推計false)', r.reductionEstimated, false);
check('理工農第Ⅳ 入学金は確認済', r.reductionAdmissionUnverified, false);

// 10b) 理工農 短大=620,000/4=155,000 / 専門=590,000/4=147,500（割り切れ・厳密）
let rr = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: stu({ level: '短期大学', attendance: '自宅' }), childrenCount: 1, rikoNoPrivate: true });
check('理工農(短大) 授業料155,000', rr.reductionCap.tuition, 155000);
rr = calcShogakukin(spec, { supporters: [{ taxableIncome: 1200000 }], student: stu({ level: '専門学校', attendance: '自宅' }), childrenCount: 1, rikoNoPrivate: true });
check('理工農(専門) 授業料147,500', rr.reductionCap.tuition, 147500);

// 11) [B5] 私立通信 第Ⅰ → 減免 授業13万・入学3万 / 給付は年額51,000
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: { schoolType: '私立', level: '通信' }, childrenCount: 1 });
check('通信 減免(私立13万/3万)', r.reductionCap, { tuition: 130000, admission: 30000 });
check('通信 給付年額', r.grantMonthly, 51000);
check('通信 grantIsAnnual', r.grantIsAnnual, true);

// 12) [B2] 所得割非課税の生計維持者 → 課税標準>0でも基準額0＝第Ⅰ満額
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 535000, shotokuwariTaxable: false }], student: stu(), childrenCount: 2 });
check('所得割非課税 基準額0', r.kijungaku, 0);
check('所得割非課税 第Ⅰ満額', r.grantMonthly, 75800);

// 13) [B3] 資産2値: 一般=5,000万未満/多子=給付5,000万・減免3億
check('一般 資産4999万→給付減免OK', calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 1, assets: 49999999 }).assetOk, { grant: true, reduction: true });
check('一般 資産5000万→両方NG', calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 1, assets: 50000000 }).assetOk, { grant: false, reduction: false });
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 3, assets: 100000000 }); // 多子・1億
check('多子 資産1億 給付0', r.grantMonthly, 0);
check('多子 資産1億 減免は満額維持', r.reductionCap, { tuition: 700000, admission: 260000 });
check('多子 資産1億 assetOk', r.assetOk, { grant: false, reduction: true });
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 3, assets: 300000000 }); // 多子・3億
check('多子 資産3億 両方NG', r.assetOk, { grant: false, reduction: false });
check('多子 資産3億 減免も0', r.reductionCap, { tuition: 0, admission: 0 });

// 14) 境界: kijungaku=25,600ちょうど→第Ⅲ / 51,300→第Ⅳ / 154,500→対象外
const mk = (t, cc) => calcShogakukin(spec, { supporters: [{ taxableIncome: t }], student: stu(), childrenCount: cc || 3 });
check('境界 25,500→第Ⅱ', mk(451600).kijungaku === 25500 && mk(451600).kubunCode === '2', true);
check('境界 25,600→第Ⅲ', mk(451700).kijungaku === 25600 && mk(451700).kubunCode === '3', true);
check('境界 51,300→第Ⅳ', mk(880000).kijungaku === 51300 && mk(880000).kubunCode === '4', true);
check('境界 154,500→対象外', mk(2600000, 1).kijungaku === 154500 && mk(2600000, 1).kubunCode === null, true);

// 15) 頑健性: 空/負値
check('空supporters→第Ⅰ', calcShogakukin(spec, { supporters: [], student: stu(), childrenCount: 1 }).kubunCode, '1');
check('負のtaxable→0扱い', calcShogakukin(spec, { supporters: [{ taxableIncome: -500000 }], student: stu(), childrenCount: 1 }).kijungaku, 0);
check('資産未申告→null', calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 1 }).assetOk, null);

// 16) m1相当: 返り値に loan と ratioLabel が両方ある
r = calcShogakukin(spec, { supporters: [{ taxableIncome: 0 }], student: stu(), childrenCount: 1 });
check('返り値 loan/ratioLabel 両方', ('loan' in r) && ('ratioLabel' in r), true);

console.log(`\n${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
