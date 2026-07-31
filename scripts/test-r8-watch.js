// r8-watch.js の純関数を、実在ページを模したフィクスチャで検証する
import { extractSignals, extractRateTables, decodeHtml, detectCharset, isMunicipalUrl } from "./r8-watch.js";

let pass = 0, fail = 0;
const t = (name, cond, got) => { if (cond) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name} → got: ${JSON.stringify(got)}`); } };

// ① 日高川町の実表（07-30に確認した内容を再現）＝ WebFetch が「令和7年度・記載なし」と誤読したページ
const hidakagawa = `<html><head><meta charset="utf-8"></head><body>
<h1>国民健康保険税</h1>
<table><tr><th></th><th>令和8年度　税率</th></tr>
<tr><th>基礎課税分</th><th>介護納付金分</th><th>後期高齢者支援金分</th><th>子ども・子育て支援金分</th></tr>
<tr><td>所得割額</td><td>8.30％</td><td>2.70％</td><td>2.70％</td><td>0.3％</td></tr>
<tr><td>均等割額</td><td>30,000円</td><td>10,000円</td><td>9,000円</td><td>1,123円</td></tr>
<tr><td>18歳以上被保険者均等割額</td><td>ー</td><td>ー</td><td>ー</td><td>68円</td></tr>
<tr><td>平等割額</td><td>25,000円</td><td>6,000円</td><td>8,300円</td><td>766円</td></tr>
<tr><td>課税限度額（最高額）</td><td>660,000円</td><td>170,000円</td><td>260,000円</td><td>30,000円</td></tr></table>
</body></html>`;
console.log("① 日高川町(R8・4区分)");
const s1 = extractSignals(hidakagawa);
t("verdict=r8_table", s1.verdict === "r8_table", s1.verdict);
t("第4区分を検知", s1.hasChildcare === true, s1);
t("令和8年度を検知", s1.hasR8Year === true, s1);
const tb1 = extractRateTables(hidakagawa);
t("表を抽出できる", tb1.length === 1 && tb1[0].some(r => r.includes("1,123円")), tb1);
t("限度額ヒスト", s1.capHint.some(x => x.includes("660,000")), s1.capHint);

// ② 古座川町(R7・3区分・Shift_JIS) ＝ WebFetch が存在しないR8表を捏造したページ
const kozagawaText = `<html><head><meta http-equiv="Content-Type" content="text/html; charset=Shift_JIS"></head><body>
<h2>税率・賦課限度額</h2><p>令和７年度分の税率及び賦課限度額は下記のとおりです。</p>
<table><tr><th>区　分</th><th>医 療 分</th><th>後　期　分</th><th>介　護　分</th></tr>
<tr><td>所得割</td><td>6.3％</td><td>1.95％</td><td>1.92％</td></tr>
<tr><td>均等割</td><td>20,000円</td><td>6,600円</td><td>6,000円</td></tr>
<tr><td>平等割</td><td>30,000円</td><td>8,000円</td><td>6,000円</td></tr>
<tr><td>賦課限度額</td><td>660,000円</td><td>260,000円</td><td>170,000円</td></tr></table>
</body></html>`;
console.log("② 古座川町(R7・3区分)");
const s2 = extractSignals(kozagawaText);
t("第4区分は検知しない", s2.hasChildcare === false, s2);
t("令和8年度は検知しない", s2.hasR8Year === false, s2);
t("令和7年度を検知", s2.hasR7Year === true, s2);
t("verdict=rate_only(R8ではない)", s2.verdict === "rate_only", s2.verdict);

// ③ 文字コード判定
console.log("③ 文字コード");
t("meta http-equiv から Shift_JIS を検出",
  detectCharset(Buffer.from(kozagawaText, "latin1"), "") === "shift_jis",
  detectCharset(Buffer.from(kozagawaText, "latin1"), ""));
t("Content-Type ヘッダ優先", detectCharset(Buffer.from("<html>"), "text/html; charset=EUC-JP") === "euc-jp");
t("既定は utf-8", detectCharset(Buffer.from("<html><body>あ</body></html>"), "text/html") === "utf-8");

// ④ 税率ページでないページ
console.log("④ 無関係ページ");
const noRate = `<html><body><h1>広報たいじ</h1><p>クジラの歯みがき、磯のいきもの観察会</p></body></html>`;
t("verdict=no_signal", extractSignals(noRate).verdict === "no_signal", extractSignals(noRate).verdict);

// ⑤ 県URLを除外できるか（standard_r8のsourceUrlsは県PDF）
console.log("⑤ URLフィルタ");
t("県サイトを除外", isMunicipalUrl("https://www.pref.wakayama.lg.jp/prefg/050600/x.pdf") === false);
t("町サイトを採用", isMunicipalUrl("https://www.town.hidakagawa.lg.jp/kurashi/zeikin/kokuho/zei_kokuho.html") === true);
t("市サイトを採用", isMunicipalUrl("https://www.city.ichinomiya.aichi.jp/x.html") === true);

// ⑥ 「子ども・子育て支援納付金分」表記ゆれ（寝屋川市の実表記）
console.log("⑥ 表記ゆれ");
const neyagawa = `<html><body><p>子ども・子育て支援納付金分</p><p>所得割 均等割 1,733円</p></body></html>`;
t("納付金分も検知", extractSignals(neyagawa).hasChildcare === true, extractSignals(neyagawa));

// ⑦ 県/都/国/PDF の除外（2026-07-30: 590件の誤検知源）
console.log("⑦ 広域サイトの除外");
t("pref.oita.jp(lg.jpなし)を除外", isMunicipalUrl("https://www.pref.oita.jp/uploaded/life/2336427_4716213_misc.pdf") === false);
t("pref.ibaraki.jp を除外", isMunicipalUrl("https://www.pref.ibaraki.jp/hokenfukushi/koso/kokumin/koso/guide/hokenryouritsu.html") === false);
t("東京都(metro.tokyo)を除外", isMunicipalUrl("https://www.hokeniryo.metro.tokyo.lg.jp/documents/d/hokeniryo/r8hyouzyunhokenryouritsu") === false);
t("厚労省を除外", isMunicipalUrl("https://www.mhlw.go.jp/content/12303500/001253798.pdf") === false);
t("PDFを除外", isMunicipalUrl("https://www.town.yuasa.wakayama.jp/uploaded/attachment/10238.pdf") === false);
t("市サイトHTMLは採用", isMunicipalUrl("https://www.city.dazaifu.lg.jp/site/navi/3397.html") === true);
t("lg.jpでない市町村サイトも採用", isMunicipalUrl("https://www.fuji-oyama.jp/page/1594.html") === true);
console.log(`\n最終結果: PASS ${pass} / FAIL ${fail}`);
process.exit(fail ? 1 : 0);
