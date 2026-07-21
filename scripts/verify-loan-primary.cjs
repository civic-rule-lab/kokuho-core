// verify-loan-primary.js — 貸与型の一次資料の実額を「ハードコード」してJSONと全数照合する。
//   JSONの転記ミス（入替・桁）を検出する層（verify-primary と同方針）。
//   出典は各ブロックのコメント。値は 2026-07-12〜16 に JASSO 公式で確認。
'use strict';
const SPEC = require('./load-shogakukin.cjs').spec();
const L = SPEC.loan;
let pass = 0, fail = 0;
function eq(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  ✗ ${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

// ── 家計基準の閾値・控除 [確認済 kakei/zaigaku/daigaku.html] ──
eq('閾値 第一種', L.thresholds.univ_college_senmon.type1, 189400);
eq('閾値 第二種', L.thresholds.univ_college_senmon.type2, 381500);
eq('閾値 併用',   L.thresholds.univ_college_senmon.heiyo, 164600);
eq('多子控除/人', L.kijunFormula.deductions.tashiPerChild, 40000);
eq('多子控除 無料人数', L.kijunFormula.deductions.tashiFreeChildren, 2);
eq('ひとり親控除', L.kijunFormula.deductions.singleParent, 40000);
eq('私立自宅外控除', L.kijunFormula.deductions.privateAway, 22000);
eq('式: 調整額を引かない', L.kijunFormula.includeAdjustmentAmount, false);
eq('課税標準率 6%', L.kijunFormula.rate, 0.06);
eq('政令市係数 3/4', L.kijunFormula.designatedCityFactor, 0.75);

// ── 第一種 月額（全16行）[確認済 taiyo_1shu/kingaku/2018ikou.html] ──
const T1 = L.type1Monthly;
eq('第一種 大学国公立自宅 max', T1['大学']['国公立']['自宅'].max, 45000);
eq('第一種 大学国公立自宅 others', T1['大学']['国公立']['自宅'].others, [20000, 30000]);
eq('第一種 大学国公立自宅外 max', T1['大学']['国公立']['自宅外'].max, 51000);
eq('第一種 大学国公立自宅外 others', T1['大学']['国公立']['自宅外'].others, [20000, 30000, 40000]);
eq('第一種 大学私立自宅 max', T1['大学']['私立']['自宅'].max, 54000);
eq('第一種 大学私立自宅 others', T1['大学']['私立']['自宅'].others, [20000, 30000, 40000]);
eq('第一種 大学私立自宅外 max', T1['大学']['私立']['自宅外'].max, 64000);
eq('第一種 大学私立自宅外 others', T1['大学']['私立']['自宅外'].others, [20000, 30000, 40000, 50000]);
eq('第一種 短大私立自宅 max', T1['短期大学']['私立']['自宅'].max, 53000);
eq('第一種 短大私立自宅外 max', T1['短期大学']['私立']['自宅外'].max, 60000);
eq('第一種 短大国公立自宅 max', T1['短期大学']['国公立']['自宅'].max, 45000);
eq('第一種 短大国公立自宅外 max', T1['短期大学']['国公立']['自宅外'].max, 51000);
eq('第一種 専門私立自宅 max', T1['専門学校']['私立']['自宅'].max, 53000);
eq('第一種 専門私立自宅外 max', T1['専門学校']['私立']['自宅外'].max, 60000);
eq('第一種 高専(4-5年)私立自宅 max', T1['高等専門学校']['私立']['自宅'].max, 53000);
eq('第一種 高専(4-5年)国公立自宅外 max', T1['高等専門学校']['国公立']['自宅外'].max, 51000);
eq('第一種 高専1-3年 国公立自宅 max', T1['高専1-3年']['国公立']['自宅'].max, 21000);
eq('第一種 高専1-3年 国公立自宅外 max', T1['高専1-3年']['国公立']['自宅外'].max, 22500);
eq('第一種 高専1-3年 私立自宅 max', T1['高専1-3年']['私立']['自宅'].max, 32000);
eq('第一種 高専1-3年 私立自宅外 max', T1['高専1-3年']['私立']['自宅外'].max, 35000);
eq('第一種 高専1-3年 others', T1['高専1-3年']['私立']['自宅'].others, [10000]);

// ── 高専1〜3年の可否フラグ [確認済 2026-07-20 高専冊子p6/p8/p12目視] ──
//   p6月額表: 1〜3年生行は「月額の種類」区分なし（斜線）＝最高月額の家計制限(併用164,600)が係らない。
//   2018ikou注記も「本科4,5年生及び専攻科においては」と学年限定。
//   p6種類表・p8(3): 入学時特別増額は「4・5年次編入学時及び専攻科入学時のみ」＝1年入学時は対象外。
eq('高専1-3 最高月額の家計制限なし', L.thresholds.kosen13.maxMonthlyUnrestricted, true);

// ── 第二種 月額・増額 [確認済 taiyo_2shu/kingaku.html] ──
eq('第二種 min', L.type2Monthly.min, 20000);
eq('第二種 max', L.type2Monthly.max, 120000);
eq('第二種 step', L.type2Monthly.step, 10000);
eq('第二種 高専1-3不可', L.type2Monthly.kosen13Eligible, false);
eq('第二種 医歯増額', L.type2Monthly.zougaku['医歯_私立大学'].add, 40000);
eq('第二種 医歯 要120000', L.type2Monthly.zougaku['医歯_私立大学'].requiresBase, 120000);
eq('第二種 薬獣医増額', L.type2Monthly.zougaku['薬獣医_私立大学'].add, 20000);

// ── 入学時特別増額 [確認済 nyuzo/kingaku.html, joken.html, R8チラシ] ──
eq('入学時増額 金額', L.nyugakuZougaku.amounts, [100000, 200000, 300000, 400000, 500000]);
eq('入学時増額 直接可 基準額75000以下', L.nyugakuZougaku.directKijunLe, 75000);
eq('公庫上限 子1人', L.nyugakuZougaku.kokoIncomeCaps['1'], 7900000);
eq('公庫上限 子2人', L.nyugakuZougaku.kokoIncomeCaps['2'], 8900000);
eq('公庫上限 子3人', L.nyugakuZougaku.kokoIncomeCaps['3'], 9900000);

// ── 返還: 割賦金の基礎額表（全16行）[確認済 henkan_kikan/index.html] ──
const KT = L.repayment.kisogakuTable;
const wantKT = [
  [200000, 30000], [400000, 40000], [500000, 50000], [600000, 60000], [700000, 70000],
  [900000, 80000], [1100000, 90000], [1300000, 100000], [1500000, 110000], [1700000, 120000],
  [1900000, 130000], [2100000, 140000], [2300000, 150000], [2500000, 160000], [3400000, 170000],
];
wantKT.forEach((w, i) => eq(`基礎額表[${i}] le=${w[0]}`, [KT[i].le, KT[i].base], w));
eq('基礎額表 最終行 over', KT[15].over, 3400000);
eq('基礎額表 最終行 divisor', KT[15].divisor, 20);

// ── 所得連動・利率 [確認済 shotokurendo/santei.html, riritsu] ──
eq('所得連動 率9%', L.repayment.shotokuRendo.rate, 0.09);
eq('所得連動 子控除33万', L.repayment.shotokuRendo.childDeduction, 330000);
eq('所得連動 下限2000', L.repayment.shotokuRendo.minMonthly, 2000);
eq('第二種 利率上限3%', L.repayment.interest.cap, 0.03);
eq('増額 利率上限3.1%', L.repayment.interest.zougakuCap, 0.031);
eq('利率プリセット 2026-06 固定', L.repayment.interest.presets['2026-06'].fixed, 0.02922);
// [確認済 貸与利率一覧(R8年度6月)・一次資料_貸与利率_2026-07-17.md]
eq('利率プリセット 2026-06 見直し', L.repayment.interest.presets['2026-06'].revisable, 0.019);
eq('利率プリセット 2026-06 増額固定', L.repayment.interest.presets['2026-06'].zougakuFixed, 0.031);
eq('利率プリセット 2026-06 増額見直し', L.repayment.interest.presets['2026-06'].zougakuRevisable, 0.021);
eq('第二種 据置日数近似 179(公式20点較正)', L.repayment.interest.graceDaysApprox, 179);
eq('返還開始 7か月目', L.repayment.startMonthOffset, 7);
eq('口座振替日 27', L.repayment.transferDay, 27);

// ── 併給調整（大学）[確認済 2019ikou.html 2026-07-16再確認] ──
const HN = L.heikyuChosei['大学'].normal;
eq('併給 第1区分', HN['1'], { '国公立自宅': 0, '国公立自宅外': 0, '私立自宅': 0, '私立自宅外': 0 });
eq('併給 第2区分', HN['2'], { '国公立自宅': 0, '国公立自宅外': 0, '私立自宅': 0, '私立自宅外': 0 });
eq('併給 第3区分 国公立自宅', HN['3']['国公立自宅'], { amounts: [20300], special: [25000] });
eq('併給 第3区分 国公立自宅外', HN['3']['国公立自宅外'], { amounts: [13800] });
eq('併給 第3区分 私立自宅', HN['3']['私立自宅'], { amounts: [21700], special: [20000, 30300] });
eq('併給 第3区分 私立自宅外', HN['3']['私立自宅外'], { amounts: [19200] });
eq('併給 第4多子', HN['4tashi'], { '国公立自宅': 0, '国公立自宅外': 0, '私立自宅': 0, '私立自宅外': 0 });
eq('併給 第4理工農 私立自宅', HN['4riko']['私立自宅'], { amounts: [20000, 34500], special: [20000, 30000, 44500] });
eq('併給 第4理工農 私立自宅外', HN['4riko']['私立自宅外'], { amounts: [20000, 30000, 44500] });
eq('併給 第4理工農 国公立自宅=調整なし', HN['4riko']['国公立自宅'], '調整なし');
const HT = L.heikyuChosei['大学'].tashiKakudai;
const Z4 = { '国公立自宅': 0, '国公立自宅外': 0, '私立自宅': 0, '私立自宅外': 0 };
['1', '2', '3', '4'].forEach(k => eq(`併給拡充 大学 区分${k}内多子=0`, HT.kubun[k], Z4));
eq('併給拡充 区分外 国公立自宅', HT.over['国公立自宅'], { amounts: [300], special: [6300] });
eq('併給拡充 区分外 国公立自宅外', HT.over['国公立自宅外'], { amounts: [6300] });
eq('併給拡充 区分外 私立自宅', HT.over['私立自宅'], { amounts: [0], special: [5600] });
eq('併給拡充 区分外 私立自宅外', HT.over['私立自宅外'], { amounts: [5600] });

// ── 併給調整（短大・専門・高専）[確認済 2019ikou.html 2026-07-17転記・大学表で抽出器照合後に取得] ──
//   セル形式: 0=併給不可 / {amounts,special}=選択可月額(specialは生保同居・社会的養護) / '調整なし'。
function row(kk, aa) { const o = {}; ['国公立自宅', '国公立自宅外', '私立自宅', '私立自宅外'].forEach((c, i) => o[c] = aa[i]); return o; }
{
  const S = L.heikyuChosei['短期大学'];
  eq('併給 短大 第1区分', S.normal['1'], Z4);
  eq('併給 短大 第2区分', S.normal['2'], row(0, [{ amounts: [3800], special: [7100] }, 0, 0, 0]));
  eq('併給 短大 第3区分', S.normal['3'], row(0, [{ amounts: [24300], special: [29000] }, { amounts: [17800] }, { amounts: [22900], special: [28500] }, { amounts: [17400] }]));
  eq('併給 短大 第4多子', S.normal['4tashi'], row(0, [{ amounts: [5200], special: [10100] }, { amounts: [1800] }, 0, 0]));
  eq('併給 短大 第4理工農', S.normal['4riko'], row(0, ['調整なし', '調整なし', { amounts: [20000, 30000, 40000], special: [20000, 30000, 47000] }, { amounts: [20000, 30000, 47000] }]));
  eq('併給拡充 短大 区分1', S.tashiKakudai.kubun['1'], Z4);
  eq('併給拡充 短大 区分2', S.tashiKakudai.kubun['2'], Z4);
  eq('併給拡充 短大 区分3', S.tashiKakudai.kubun['3'], row(0, [{ amounts: [2700], special: [7400] }, 0, 0, 0]));
  eq('併給拡充 短大 区分4', S.tashiKakudai.kubun['4'], row(0, [{ amounts: [5200], special: [10100] }, { amounts: [1800] }, 0, 0]));
  eq('併給拡充 短大 区分外', S.tashiKakudai.over, row(0, [{ amounts: [12500], special: [18500] }, { amounts: [18500] }, { amounts: [1300], special: [8300] }, { amounts: [8300] }]));
}
{
  const S = L.heikyuChosei['専門学校'];
  eq('併給 専門 第1区分', S.normal['1'], row(0, [{ amounts: [1900], special: [3800] }, 0, 0, 0]));
  eq('併給 専門 第2区分', S.normal['2'], row(0, [{ amounts: [16200], special: [19500] }, 0, 0, 0]));
  eq('併給 専門 第3区分', S.normal['3'], row(0, [{ amounts: [20000, 30500], special: [20000, 35200] }, { amounts: [24000] }, { amounts: [23800], special: [29400] }, { amounts: [18300] }]));
  eq('併給 専門 第4多子', S.normal['4tashi'], row(0, [{ amounts: [23800], special: [28700] }, { amounts: [20400] }, { amounts: [0], special: [100] }, 0]));
  eq('併給 専門 第4理工農', S.normal['4riko'], row(0, ['調整なし', '調整なし', { amounts: [20000, 30000, 40700], special: [20000, 30000, 47700] }, { amounts: [20000, 30000, 47700] }]));
  eq('併給拡充 専門 区分1', S.tashiKakudai.kubun['1'], row(0, [{ amounts: [1900], special: [3800] }, 0, 0, 0]));
  eq('併給拡充 専門 区分2', S.tashiKakudai.kubun['2'], row(0, [{ amounts: [11600], special: [14900] }, 0, 0, 0]));
  eq('併給拡充 専門 区分3', S.tashiKakudai.kubun['3'], row(0, [{ amounts: [21300], special: [26000] }, { amounts: [14800] }, 0, 0]));
  eq('併給拡充 専門 区分4', S.tashiKakudai.kubun['4'], row(0, [{ amounts: [23800], special: [28700] }, { amounts: [20400] }, { amounts: [0], special: [100] }, 0]));
  eq('併給拡充 専門 区分外', S.tashiKakudai.over, row(0, [{ amounts: [20000, 31100], special: [20000, 37100] }, { amounts: [20000, 37100] }, { amounts: [3800], special: [10800] }, { amounts: [10800] }]));
}
{
  const S = L.heikyuChosei['高等専門学校'];
  eq('併給 高専 第1区分', S.normal['1'], row(0, [{ amounts: [7900], special: [5600] }, 0, 0, 0]));
  eq('併給 高専 第2区分', S.normal['2'], row(0, [{ amounts: [20200], special: [20700] }, { amounts: [15100] }, 0, 0]));
  eq('併給 高専 第3区分', S.normal['3'], row(0, [{ amounts: [20000, 32500], special: [20000, 35800] }, { amounts: [20000, 33000] }, { amounts: [24600], special: [28800] }, { amounts: [26000] }]));
  eq('併給 高専 第4多子', S.normal['4tashi'], row(0, [{ amounts: [21000], special: [24900] }, { amounts: [22800] }, 0, 0]));
  eq('併給 高専 第4理工農', S.normal['4riko'], row(0, ['調整なし', '調整なし', { amounts: [20000, 33500], special: [20000, 30000, 40500] }, { amounts: [20000, 30000, 40500] }]));
  eq('併給拡充 高専 区分1', S.tashiKakudai.kubun['1'], row(0, [{ amounts: [7900], special: [5600] }, 0, 0, 0]));
  eq('併給拡充 高専 区分2', S.tashiKakudai.kubun['2'], row(0, [{ amounts: [13700], special: [14200] }, { amounts: [8600] }, 0, 0]));
  eq('併給拡充 高専 区分3', S.tashiKakudai.kubun['3'], row(0, [{ amounts: [19500], special: [22800] }, { amounts: [20000] }, 0, 0]));
  eq('併給拡充 高専 区分4', S.tashiKakudai.kubun['4'], row(0, [{ amounts: [21000], special: [24900] }, { amounts: [22800] }, 0, 0]));
  eq('併給拡充 高専 区分外', S.tashiKakudai.over, row(0, [{ amounts: [25400], special: [20000, 31400] }, { amounts: [20000, 31400] }, { amounts: [0], special: [1600] }, { amounts: [1600] }]));
}


// ── 機関保証の保証料（2026年度採用者・目安表）[確認済 2026-04-01決定・一次資料/保証料2026/ PDF5本] ──
//   期待値は各PDFの p1（＋増額は 一種p2/二種p9）から手転記（パーサ出力からの転記ではない＝独立照合）。
{
  const HO = L.hoshoryo;
  const t1 = HO.type1;
  // 大学 48か月（8セル全数）
  const D48 = { '20000':500,'30000':947,'40000':1262,'45000':1515,'50000':1786,'51000':1821,'54000':1928,'64000':2666 };
  Object.keys(D48).forEach(m => eq(`保証料 大学48/${m}`, t1['大学']['48'][m], D48[m]));
  // 大学 72か月（8セル全数）
  const D72 = { '20000':612,'30000':979,'40000':1464,'45000':1901,'50000':2203,'51000':2247,'54000':2379,'64000':2820 };
  Object.keys(D72).forEach(m => eq(`保証料 大学72/${m}`, t1['大学']['72'][m], D72[m]));
  // 大学 12か月（通信通年・専攻科）スポット
  eq('保証料 大学12/20000', t1['大学']['12']['20000'], 328);
  eq('保証料 大学12/51000(96回帯で50000より安い)', t1['大学']['12']['51000'], 1091);
  eq('保証料 大学12/64000', t1['大学']['12']['64000'], 1524);
  // 短期大学 24か月（8セル全数）
  const T24 = { '20000':469,'30000':703,'40000':1032,'45000':1365,'50000':1517,'51000':1547,'53000':1608,'60000':1952 };
  Object.keys(T24).forEach(m => eq(`保証料 短大24/${m}`, t1['短期大学']['24'][m], T24[m]));
  // 短期大学 36か月 スポット
  eq('保証料 短大36/20000', t1['短期大学']['36']['20000'], 462);
  eq('保証料 短大36/45000', t1['短期大学']['36']['45000'], 1442);
  eq('保証料 短大36/53000', t1['短期大学']['36']['53000'], 1698);
  eq('保証料 短大36/60000', t1['短期大学']['36']['60000'], 2050);
  // 専門学校＝短期大学と同一表（PDF同士の全文一致を機械確認済み・ここでは構造一致を固定）
  eq('保証料 専門==短大', JSON.stringify(t1['専門学校']), JSON.stringify(t1['短期大学']));
  // 高等専門学校（継続貸与合算前提の専用表・全数）
  const K13 = { '10000':246,'21000':608,'22500':652,'32000':994,'35000':1231 };
  Object.keys(K13).forEach(m => eq(`保証料 高専1-3/${m}`, t1['高等専門学校'].g13[m], K13[m]));
  const K45 = { '20000':579,'30000':932,'40000':1407,'45000':1583,'50000':1956,'51000':2092,'53000':2174,'60000':2685 };
  Object.keys(K45).forEach(m => eq(`保証料 高専4-5/${m}`, t1['高等専門学校'].g45[m], K45[m]));
  // 第二種 48か月（13セル全数・注3=140k/160kは医歯薬獣医の増額時のみ）
  const N48 = { '20000':611,'30000':1168,'40000':1558,'50000':2218,'60000':2821,'70000':3835,'80000':4585,
                '90000':5158,'100000':5732,'110000':6305,'120000':6878,'140000':8030,'160000':9182 };
  Object.keys(N48).forEach(m => eq(`保証料 二種48/${m}`, HO.type2['48'][m], N48[m]));
  // 第二種 スポット（端の期間）
  eq('保証料 二種12/20000', HO.type2['12']['20000'], 395);
  eq('保証料 二種24/50000', HO.type2['24']['50000'], 1865);
  eq('保証料 二種60/100000', HO.type2['60']['100000'], 5644);
  eq('保証料 二種72/160000', HO.type2['72']['160000'], 8905);
  // 入学時(留学時)特別増額の保証料（1回払い・5セル全数。一種p2と二種p9の表一致も機械確認済み）
  const ZG = { '100000':1035,'200000':4016,'300000':6975,'400000':13012,'500000':16265 };
  Object.keys(ZG).forEach(a => eq(`保証料 入学時増額/${a}`, HO.nyugakuZougakuFee[a], ZG[a]));
}

console.log(`==== 貸与 一次資料照合: ${pass} pass / ${fail} fail ====`);
process.exit(fail ? 1 : 0);
