/**
 * test-haito.cjs — 配当の課税方式 損得判定エンジン（js/core/haito.js）の検査
 *   手計算の不変条件: 申告不要＝分離（税額同じ）、総合は累進当て直し − 配当控除（10%／1,000万超 5%、住民税 2.8%／1.4%）、
 *   配当控除が他の所得の税を減らす（5%帯で所得税が戻る）、閾値またぎ、0 円。
 * 実行: node scripts/test-haito.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const { judgeHaito } = require(path.join(ROOT, 'js/core/haito.js'));
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/haito-2026.json'), 'utf8'));
const P = Shotoku.loadParams(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8')));
let pass = 0, fail = 0;
const A = (l, c) => { console.log(`${c ? '✓' : '✗'} ${l}`); c ? pass++ : fail++; };
const ann = (tax) => Math.floor(tax * 1.021 / 100) * 100;

// 1) 配当 50 万・所得税課税所得 200 万（10% 帯）・住民税課税所得 200 万
let r = judgeHaito({ dividend: 500000, shotokuTaxable: 2000000, juminTaxable: 2000000 }, data, P);
A('申告不要: 所得税 = floor(50万 × 15% × 1.021) = 76,575、住民税 = 25,000', r.none.shotokuTax === 76575 && r.none.juminTax === 25000 && r.none.incomeAdd === 0 && r.none.levyAdd === 0);
A('分離: 税額は申告不要と同じ、所得に 50 万・所得割の基礎に 25,000 が加わる', r.separate.shotokuTax === 76575 && r.separate.juminTax === 25000 && r.separate.incomeAdd === 500000 && r.separate.levyAdd === 25000);
// 総合: T0 = 200万×10% − 97,500 = 102,500 → 年税 104,600。T1 = 250万×10% − 97,500 = 152,500、配当控除 50,000 → 102,500 → 104,600。差 0
A('総合（10% 帯）: 所得税の増減 0（10% − 配当控除 10%）、配当控除 50,000', r.sogo.shotokuTax === ann(102500) - ann(102500) && r.sogo.shotokuTax === 0 && r.sogo.haitoKojoShotoku === 50000);
A('総合: 住民税 = 50万 × 10% − 配当控除 2.8%（14,000）= 36,000、所得に 50 万・所得割の基礎に 50,000', r.sogo.juminTax === 36000 && r.sogo.haitoKojoJumin === 14000 && r.sogo.incomeAdd === 500000 && r.sogo.levyAdd === 50000 && r.sogo.taxableAdd === 500000);
A('総合の税の合計（36,000）は申告不要（101,575）より小さい＝税だけなら総合が得', r.sogo.total === 36000 && r.none.total === 101575 && r.sogo.total < r.none.total);

// 2) 5% 帯（所得税課税所得 100 万）: 配当控除が既存の税も減らす → 所得税が戻る
r = judgeHaito({ dividend: 500000, shotokuTaxable: 1000000, juminTaxable: 1000000 }, data, P);
// T0 = 50,000 → 51,000。T1 = 75,000 − 50,000 = 25,000 → 25,500。差 −25,500
A('総合（5% 帯）: 所得税が 25,500 円戻る（負の値）', r.sogo.shotokuTax === ann(25000) - ann(50000) && r.sogo.shotokuTax === -25500);

// 3) 閾値またぎ: 所得税課税所得 980 万 ＋ 配当 50 万 → 1,000 万超の 30 万は 5%
r = judgeHaito({ dividend: 500000, shotokuTaxable: 9800000, juminTaxable: 9800000 }, data, P);
A('総合（閾値またぎ）: 配当控除 = 20万×10% ＋ 30万×5% = 35,000（所得税）、住民税 = 20万×2.8% ＋ 30万×1.4% = 9,800', r.sogo.haitoKojoShotoku === 35000 && r.sogo.haitoKojoJumin === 9800);
// 所得税: T0 = 980万×33% − 1,536,000 = 1,698,000。T1 = 1,030万×33% − 1,536,000 = 1,863,000 − 35,000 = 1,828,000。差 = ann(1,828,000) − ann(1,698,000)
A('総合（33% 帯）: 所得税の増加 = ann(1,828,000) − ann(1,698,000)', r.sogo.shotokuTax === ann(1828000) - ann(1698000) && r.sogo.shotokuTax > r.none.shotokuTax);

// 4) 配当 0
r = judgeHaito({ dividend: 0, shotokuTaxable: 3000000, juminTaxable: 3000000 }, data, P);
A('配当 0: すべて 0', [r.none, r.separate, r.sogo].every(m => m.shotokuTax === 0 && m.juminTax === 0 && m.total === 0 && m.incomeAdd === 0 && m.levyAdd === 0));

// 5) 課税所得 0（所得割なし）の人が総合で申告: 配当だけに 5% − 10% ＝ 所得税 0（下限）、住民税 10% − 2.8%
r = judgeHaito({ dividend: 300000, shotokuTaxable: 0, juminTaxable: 0 }, data, P);
A('課税所得 0・総合: 所得税 0（配当控除で打ち消し・税額 0 が下限）、住民税 21,600', r.sogo.shotokuTax === 0 && r.sogo.juminTax === 21600);

// 6) 浮動小数点の端数（2026-10-24 追加・X222／全方向試算 HAITO-1・HAITO-2・shotoku F1）
//   期待値は BigInt の整数計算: 源泉所得税 = floor(配当 × 15315 / 100000)（15%×1.021・租特法 8条の5・復興財確法 13条）、
//   累進の年税額 = floor((課税所得 × 税率% / 100 − 控除額) × 1021 / 1000 を 100 円未満切捨て)。
{
  const { shotokuAnnualTax } = require(path.join(ROOT, 'js/core/haito.js'));
  let bad = 0, first = null;
  for (let v = 0; v <= 1_000_000; v++) {
    const got = judgeHaito({ dividend: v, shotokuTaxable: 0, juminTaxable: 0 }, data, P).none.shotokuTax;
    const exp = Number(BigInt(v) * 15315n / 100000n);
    if (got !== exp) { bad++; if (!first) first = [v, got, exp]; }
  }
  A(`申告不要の所得税: 配当 0〜100万円（1円刻み）が整数計算と全件一致（不一致 ${bad}件${first ? ' 初回=' + first : ''}）`, bad === 0);
  bad = 0; first = null;
  for (let k = 0; k <= 45_000_000; k += 1000) {
    const row = P.taxTable.find(t => t[0] == null || k <= t[0]);
    let t = BigInt(k) * BigInt(Math.round(row[1] * 100)) / 100n - BigInt(row[2]); if (t < 0n) t = 0n;
    const exp = Number(t * 1021n / 1000n / 100n * 100n), got = shotokuAnnualTax(k, P).annual;
    if (got !== exp) { bad++; if (!first) first = [k, got, exp]; }
  }
  A(`累進の年税額: 課税所得 0〜4,500万（1,000円刻み）が整数計算と全件一致（不一致 ${bad}件${first ? ' 初回=' + first : ''}）`, bad === 0);
  A('例: 課税所得 1,975,000 の年税額 102,100（浮動小数点だと 102,000）', shotokuAnnualTax(1975000, P).annual === 102100);
  const big = judgeHaito({ dividend: 50_000_000_000, shotokuTaxable: 0, juminTaxable: 0 }, data, P).none.shotokuTax;
  A(`配当 500億円でも桁あふれしない（${big} ＝ 7,657,500,000）`, big === 7657500000);
  // 所得税エンジン（js/core/shotoku.js）も同じ整数計算
  const eng = Shotoku.createEngineFromDB(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8')));
  A('所得税エンジン: 給与 5,316,000・社保 797,400 の年税額 102,100', eng.calcShotokuzei({ salary: 5316000, socialInsurance: 797400 }).annualTax === 102100);
}

// ── 2026-10-31 全方向試算 C166・C167: 住民税の課税総所得金額は1,000円未満切捨て（地方税法 第20条の4の2第1項）[確認済 e-Gov] ──
{
  // C166: 課税総所得 9,999,500＋配当 1,000＝10,000,500 → 切捨て 10,000,000 は1,000万円以下 → 配当控除は全額 2.8%＝28（旧は500円分を1.4%にして21）
  const c166 = judgeHaito({ dividend: 1000, shotokuTaxable: 0, juminTaxable: 9999500 }, data, P).sogo;
  A(`[C166] 課税総所得の切捨て後で1,000万円の判定: 住民税の配当控除 28 → 実際 ${c166.haitoKojoJumin}`, c166.haitoKojoJumin === 28);
  // C167: 課税総所得 3,000,000＋配当 999 → 切捨て後も 3,000,000 → 所得割の増分 0（旧は 99）。配当 1,000 → 100
  const a = judgeHaito({ dividend: 999, shotokuTaxable: 0, juminTaxable: 3000000 }, data, P).sogo;
  const b = judgeHaito({ dividend: 1000, shotokuTaxable: 0, juminTaxable: 3000000 }, data, P).sogo;
  A(`[C167] 配当 999 → 所得割の増分 0 → 実際 ${a.levyAdd}`, a.levyAdd === 0);
  A(`[C167] 配当 1,000 → 所得割の増分 100 → 実際 ${b.levyAdd}`, b.levyAdd === 100);
  // 課税総所得 3,000,500＋配当 500 → 3,001,000 − 3,000,000 ＝ 1,000 → 増分 100（旧は配当×10%＝50）
  const c = judgeHaito({ dividend: 500, shotokuTaxable: 0, juminTaxable: 3000500 }, data, P).sogo;
  A(`[C167] 課税総所得 3,000,500＋配当 500 → 増分 100 → 実際 ${c.levyAdd}`, c.levyAdd === 100);
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
