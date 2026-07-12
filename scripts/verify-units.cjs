'use strict';
// 純粋関数の独立検算（詳細モード・年金等で効く部品）。
const L=require('./load-shogakukin.cjs');
const inc = L.income();
const jum = L.jumin();

let pass=0, fail=0;
const eq=(name,got,exp)=>{ if(got===exp){pass++;/*console.log('✓',name);*/} else {fail++;console.log('✗ '+name+'  got='+got+' exp='+exp);} };

// 独立式: 給与所得控除(令和8年度・最低保障65万)
function salInc(S){ if(!(S>0))return 0; let d;
  if(S<=3600000)d=Math.max(650000,S*0.3+80000); else if(S<=6600000)d=S*0.2+440000;
  else if(S<=8500000)d=S*0.1+1100000; else d=1950000; return Math.max(0,Math.floor(S-d)); }
console.log('— 給与所得控除 —');
[550000, 1000000, 1500000, 1625000, 1900000, 2000000, 3600000, 5000000, 6600000, 8500000, 12000000].forEach(S=>{
  eq('salary '+S, inc.calcSalaryIncome(S), salInc(S));
});

// 独立式: 公的年金等控除後の年金所得
function penInc(p,age){ if(!(p>0))return 0; const senior=Number.isFinite(age)&&age>=65; let d;
  if(senior){ if(p<=3300000)d=1100000; else if(p<=4100000)d=p*0.25+275000; else if(p<=7700000)d=p*0.15+685000; else if(p<=10000000)d=p*0.05+1455000; else d=1955000; }
  else { if(p<=1300000)d=600000; else if(p<=4100000)d=p*0.25+275000; else if(p<=7700000)d=p*0.15+685000; else if(p<=10000000)d=p*0.05+1455000; else d=1955000; }
  return Math.max(0,Math.floor(p-d)); }
console.log('— 公的年金等控除（65歳未満/以上） —');
[[1000000,60],[1300000,60],[2000000,60],[3300000,70],[3300000,60],[4100000,70],[5000000,68],[8000000,70],[11000000,66]].forEach(([p,a])=>{
  eq('pension '+p+'/'+a, inc.calcPensionIncome(p,a), penInc(p,a));
});

// 独立式: 特定親族特別控除（住民税・所得ベース）
function tokutei(x){ if(!(x>580000)||x>1230000)return 0;
  const b=[[950000,450000],[1000000,410000],[1050000,310000],[1100000,210000],[1150000,110000],[1200000,60000],[1230000,30000]];
  for(const [cap,d] of b){ if(x<=cap)return d; } return 0; }
console.log('— 特定親族特別控除 —');
[500000,580000,600000,950000,951000,1000000,1050000,1100000,1150000,1200000,1230000,1230001,1500000].forEach(x=>{
  eq('tokutei '+x, jum.calcTokuteiShinzokuDeduction(x), tokutei(x));
});

console.log('\n==== 純粋関数: '+pass+' pass / '+fail+' fail ====');
process.exitCode=fail?1:0;
