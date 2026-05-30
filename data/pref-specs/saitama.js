/**
 * 埼玉県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 埼玉県「令和7年度 保険税率等の状況」
 * https://www.pref.saitama.lg.jp/a0702/fukahoushiki.html
 *
 * 使用: node scripts/generate-pref-kokuho.js saitama
 */

export const PREF_NAME = "埼玉県";

// 賦課限度額プリセット
// ─────────────────────────────────────────────────────────────────
export const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 };  // 全国標準
export const CAPS_650 = { medical: 650000, support: 240000, care: 170000 };  // 独自上限

// ─────────────────────────────────────────────────────────────────
// 埼玉県 全自治体リスト（令和7年度 = 2025年度）
//
// データ出典: 埼玉県「令和7年度 保険税率等の状況」
// https://www.pref.saitama.lg.jp/a0702/fukahoushiki.html
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 政令市 ────────────────────────────────────────────────────

  {
    cityCode: "11100", citySlug: "saitama", cityName: "さいたま市",
    note: "政令市。区ごとに窓口が異なるが保険料率は市全体で統一。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0713, support: 0.0260, care: 0.0224 },
      perCapita: { medical: 38300,  support: 13500,  care: 14600  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },

  // ── 市 ───────────────────────────────────────────────────────

  {
    cityCode: "11201", citySlug: "kawagoe", cityName: "川越市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0725, support: 0.0270, care: 0.0220 },
      perCapita: { medical: 36300,  support: 14100,  care: 15000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11202", citySlug: "kumagaya", cityName: "熊谷市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0704, support: 0.0248, care: 0.0202 },
      perCapita: { medical: 35500,  support: 14500,  care: 14500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11203", citySlug: "kawaguchi", cityName: "川口市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0745, support: 0.0250, care: 0.0130 },
      perCapita: { medical: 28000,  support: 9000,   care: 13000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11206", citySlug: "gyoda", cityName: "行田市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0760, support: 0.0260, care: 0.0250 },
      perCapita: { medical: 36000,  support: 14500,  care: 15000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11207", citySlug: "chichibu", cityName: "秩父市",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率15%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.15 },
    rates: {
      rate:      { medical: 0.0620, support: 0.0230, care: 0.0200 },
      perCapita: { medical: 21000,  support: 11000,  care: 10500  },
      household: { medical: 10000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11208", citySlug: "tokorozawa", cityName: "所沢市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0696, support: 0.0267, care: 0.0241 },
      perCapita: { medical: 41300,  support: 16000,  care: 17000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11209", citySlug: "hanno", cityName: "飯能市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0680, support: 0.0240, care: 0.0200 },
      perCapita: { medical: 34000,  support: 14000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11210", citySlug: "kazo", cityName: "加須市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0750, support: 0.0230, care: 0.0240 },
      perCapita: { medical: 40700,  support: 10500,  care: 11000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11211", citySlug: "honjo", cityName: "本庄市",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率20%。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.20 },
    rates: {
      rate:      { medical: 0.0690, support: 0.0290, care: 0.0270 },
      perCapita: { medical: 19500,  support: 9900,   care: 12400  },
      household: { medical: 16000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11212", citySlug: "higashimatsuyama", cityName: "東松山市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0744, support: 0.0265, care: 0.0231 },
      perCapita: { medical: 30600,  support: 14000,  care: 15400  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11214", citySlug: "kasukabe", cityName: "春日部市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0765, support: 0.0253, care: 0.0211 },
      perCapita: { medical: 39400,  support: 14500,  care: 14900  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11215", citySlug: "sayama", cityName: "狭山市",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率10%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.10 },
    rates: {
      rate:      { medical: 0.0679, support: 0.0272, care: 0.0236 },
      perCapita: { medical: 22700,  support: 15900,  care: 17100  },
      household: { medical: 5000,   support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11216", citySlug: "hanyu", cityName: "羽生市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0720, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 32500,  support: 15500,  care: 15500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11217", citySlug: "konosu", cityName: "鴻巣市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0692, support: 0.0276, care: 0.0230 },
      perCapita: { medical: 35500,  support: 16000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11218", citySlug: "fukaya", cityName: "深谷市",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率9%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.09 },
    rates: {
      rate:      { medical: 0.0680, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 33000,  support: 16000,  care: 16000  },
      household: { medical: 4500,   support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11219", citySlug: "ageo", cityName: "上尾市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0720, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 38000,  support: 15000,  care: 17000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11221", citySlug: "soka", cityName: "草加市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0787, support: 0.0263, care: 0.0223 },
      perCapita: { medical: 37000,  support: 11600,  care: 13500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11222", citySlug: "koshigaya", cityName: "越谷市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0750, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 31900,  support: 11500,  care: 12000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11223", citySlug: "warabi", cityName: "蕨市",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率10%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.10 },
    rates: {
      rate:      { medical: 0.0640, support: 0.0220, care: 0.0220 },
      perCapita: { medical: 33000,  support: 14000,  care: 12000  },
      household: { medical: 3000,   support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11224", citySlug: "toda", cityName: "戸田市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0800, support: 0.0160, care: 0.0142 },
      perCapita: { medical: 31800,  support: 9500,   care: 12500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11225", citySlug: "iruma", cityName: "入間市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0650, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 35000,  support: 16000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11227", citySlug: "asaka", cityName: "朝霞市",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率20%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.20 },
    rates: {
      rate:      { medical: 0.0760, support: 0.0230, care: 0.0200 },
      perCapita: { medical: 22000,  support: 12000,  care: 12000  },
      household: { medical: 7000,   support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11228", citySlug: "shiki", cityName: "志木市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0735, support: 0.0240, care: 0.0220 },
      perCapita: { medical: 32800,  support: 13300,  care: 14100  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11229", citySlug: "wako", cityName: "和光市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0730, support: 0.0230, care: 0.0180 },
      perCapita: { medical: 24000,  support: 12000,  care: 12000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11230", citySlug: "niiza", cityName: "新座市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0730, support: 0.0232, care: 0.0222 },
      perCapita: { medical: 32000,  support: 14000,  care: 15000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11231", citySlug: "okegawa", cityName: "桶川市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0720, support: 0.0220, care: 0.0180 },
      perCapita: { medical: 26400,  support: 9900,   care: 12000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11232", citySlug: "kuki", cityName: "久喜市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0781, support: 0.0309, care: 0.0287 },
      perCapita: { medical: 39000,  support: 16600,  care: 16200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11233", citySlug: "kitamoto", cityName: "北本市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0730, support: 0.0280, care: 0.0220 },
      perCapita: { medical: 38900,  support: 13500,  care: 16100  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11234", citySlug: "yashio", cityName: "八潮市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0780, support: 0.0250, care: 0.0230 },
      perCapita: { medical: 35000,  support: 15000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    // slug競合: 長野県富士見町(fujimi)と重複 → fujimishi
    cityCode: "11235", citySlug: "fujimishi", cityName: "富士見市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0749, support: 0.0242, care: 0.0194 },
      perCapita: { medical: 34300,  support: 11500,  care: 14900  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11237", citySlug: "misato", cityName: "三郷市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0720, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 32800,  support: 11600,  care: 13700  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11238", citySlug: "hasuda", cityName: "蓮田市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0715, support: 0.0250, care: 0.0185 },
      perCapita: { medical: 30000,  support: 11000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11239", citySlug: "sakado", cityName: "坂戸市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0784, support: 0.0233, care: 0.0198 },
      perCapita: { medical: 32200,  support: 10100,  care: 13700  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11240", citySlug: "satte", cityName: "幸手市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0760, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 42000,  support: 15000,  care: 15000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11241", citySlug: "tsurugashima", cityName: "鶴ヶ島市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0730, support: 0.0240, care: 0.0230 },
      perCapita: { medical: 36000,  support: 13000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11242", citySlug: "hidaka", cityName: "日高市",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0790, support: 0.0290, care: 0.0250 },
      perCapita: { medical: 42200,  support: 15600,  care: 17900  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11243", citySlug: "yoshikawa", cityName: "吉川市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0690, support: 0.0250, care: 0.0230 },
      perCapita: { medical: 37000,  support: 11000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11245", citySlug: "fujimino", cityName: "ふじみ野市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0756, support: 0.0218, care: 0.0214 },
      perCapita: { medical: 30800,  support: 11800,  care: 13700  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11246", citySlug: "shiraoka", cityName: "白岡市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0715, support: 0.0254, care: 0.0225 },
      perCapita: { medical: 33600,  support: 15200,  care: 15800  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },

  // ── 町村 ─────────────────────────────────────────────────────

  {
    // slug競合: 長野県伊那市(ina)と重複 → inacho
    cityCode: "11301", citySlug: "inacho", cityName: "伊奈町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0740, support: 0.0270, care: 0.0200 },
      perCapita: { medical: 38000,  support: 16000,  care: 13000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11324", citySlug: "miyoshicho", cityName: "三芳町",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0797, support: 0.0324, care: 0.0239 },
      perCapita: { medical: 34300,  support: 11100,  care: 14800  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11326", citySlug: "moroyama", cityName: "毛呂山町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0690, support: 0.0271, care: 0.0226 },
      perCapita: { medical: 42300,  support: 16300,  care: 16200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11327", citySlug: "ogose", cityName: "越生町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0740, support: 0.0200, care: 0.0190 },
      perCapita: { medical: 30800,  support: 11100,  care: 14800  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11341", citySlug: "namegawa", cityName: "滑川町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0760, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 38000,  support: 15000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11342", citySlug: "ranzan", cityName: "嵐山町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0760, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 40000,  support: 15000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    // slug競合: 長野県小川村(ogawa)と重複 → ogawacho
    cityCode: "11343", citySlug: "ogawacho", cityName: "小川町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0720, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 43600,  support: 15400,  care: 16200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11346", citySlug: "kawajima", cityName: "川島町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0620, support: 0.0240, care: 0.0190 },
      perCapita: { medical: 31000,  support: 13500,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11347", citySlug: "yoshimi", cityName: "吉見町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0750, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 31500,  support: 14000,  care: 14500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11348", citySlug: "hatoyama", cityName: "鳩山町",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0680, support: 0.0160, care: 0.0140 },
      perCapita: { medical: 30000,  support: 12000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11349", citySlug: "tokigawa", cityName: "ときがわ町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0770, support: 0.0200, care: 0.0190 },
      perCapita: { medical: 38100,  support: 13300,  care: 14600  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11361", citySlug: "yokoze", cityName: "横瀬町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0620, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 31000,  support: 16000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11362", citySlug: "minano", cityName: "皆野町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0685, support: 0.0280, care: 0.0255 },
      perCapita: { medical: 37800,  support: 16400,  care: 16200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11363", citySlug: "nagatoro", cityName: "長瀞町",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率16%。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.16 },
    rates: {
      rate:      { medical: 0.0652, support: 0.0206, care: 0.0191 },
      perCapita: { medical: 26100,  support: 11300,  care: 11900  },
      household: { medical: 5300,   support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11365", citySlug: "ogano", cityName: "小鹿野町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0620, support: 0.0273, care: 0.0236 },
      perCapita: { medical: 32000,  support: 16100,  care: 17300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11369", citySlug: "higashichichibu", cityName: "東秩父村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0509, support: 0.0260, care: 0.0233 },
      perCapita: { medical: 29300,  support: 14700,  care: 16600  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    // slug競合: 埼玉県三郷市(misato)と重複 → misatomachi
    cityCode: "11381", citySlug: "misatomachi", cityName: "美里町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0680, support: 0.0240, care: 0.0190 },
      perCapita: { medical: 39000,  support: 14000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11383", citySlug: "kamikawa", cityName: "神川町",
    note: "医療分のみ平等割・資産割あり（4h[m]構造）。資産割率15%。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.15 },
    rates: {
      rate:      { medical: 0.0630, support: 0.0240, care: 0.0230 },
      perCapita: { medical: 25000,  support: 10000,  care: 15000  },
      household: { medical: 8000,   support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11385", citySlug: "kamisato", cityName: "上里町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0665, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 36000,  support: 16000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11408", citySlug: "yorii", cityName: "寄居町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0650, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 40000,  support: 16000,  care: 17000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11442", citySlug: "miyashiro", cityName: "宮代町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0738, support: 0.0254, care: 0.0224 },
      perCapita: { medical: 40000,  support: 14400,  care: 15700  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11464", citySlug: "sugito", cityName: "杉戸町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0670, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 34000,  support: 12000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11465", citySlug: "matsubushi", cityName: "松伏町",
    caps: CAPS_650,
    rates: {
      rate:      { medical: 0.0780, support: 0.0200, care: 0.0160 },
      perCapita: { medical: 37400,  support: 10400,  care: 12300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────
