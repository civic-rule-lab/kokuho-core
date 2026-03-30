/**
 * 千葉県 国保データ一括生成スクリプト
 *
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 * - 既にファイルが存在する場合はスキップ（上書きしない）
 *
 * 実行:          node scripts/generate-chiba-kokuho.js
 * 強制上書き:    node scripts/generate-chiba-kokuho.js --force
 *
 * ▼ 千葉県の構造的特徴
 *   - 全54自治体で資産割なし
 *   - 全54自治体が全国標準上限（医療66万・支援26万・介護17万）
 *   - ほとんどの自治体: 医療分に平等割あり、支援分・介護分は平等割なし
 *   - 千葉市・御宿町: 支援分にも平等割あり
 *   - 八千代市: 支援分に平等割あり
 *
 * ▼ スラグ競合（既存スラグとの重複回避）
 *   旭市   → asahishi  (長野県朝日村が asahi を使用)
 *   栄町   → sakaecho  (長野県栄村が sakae を使用)
 *   大多喜町 → otakicho  (長野県王滝村が otaki を使用)
 *
 * ▼ データ出典
 *   千葉県「県内市町村の令和7年度国民健康保険料(税)率」
 *   https://www.pref.chiba.lg.jp/hoken/kokubo/hokenryouritu.html
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_BASE  = path.join(__dirname, "../data/municipalities");
const FORCE     = process.argv.includes("--force");

// ─────────────────────────────────────────────────────────────────
// 共通軽減基準（2025年度・全国共通）
// ─────────────────────────────────────────────────────────────────
const COMMON_REDUCTION = {
  enabled: true,
  standards: {
    sevenTenths: { base: 430000, perPersonAdd: 0 },
    fiveTenths:  { base: 430000, perPersonAdd: 305000 },
    twoTenths:   { base: 430000, perPersonAdd: 560000 },
  },
  salaryPensionAdd: 100000,
  ratios: { sevenTenths: 0.7, fiveTenths: 0.5, twoTenths: 0.2 },
};

const COMMON_PRESCHOOL = {
  enabled: true,
  medicalPerCapitaRate: 0.5,
  supportPerCapitaRate: 0.5,
};

// 全自治体が全国標準上限
const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 千葉県 全自治体リスト（令和7年度 = 2025年度）
//
// データ出典: 千葉県「県内市町村の令和7年度国民健康保険料(税)率」
// https://www.pref.chiba.lg.jp/hoken/kokubo/hokenryouritu.html
// ─────────────────────────────────────────────────────────────────
const MUNICIPALITIES = [

  // ── 政令市 ────────────────────────────────────────────────────

  {
    cityCode: "12100", citySlug: "chiba", cityName: "千葉市",
    note: "政令市。医療分・支援分・介護分すべてに平等割あり。",
    rates: {
      rate:      { medical: 0.0714, support: 0.0285, care: 0.0236 },
      perCapita: { medical: 21840,  support: 8640,   care: 10680  },
      household: { medical: 25800,  support: 10320,  care: 8040   },
    },
  },

  // ── 市 ───────────────────────────────────────────────────────

  {
    cityCode: "12202", citySlug: "choshi", cityName: "銚子市",
    rates: {
      rate:      { medical: 0.0705, support: 0.0290, care: 0.0230 },
      perCapita: { medical: 27000,  support: 15000,  care: 18000  },
      household: { medical: 25000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12203", citySlug: "ichikawa", cityName: "市川市",
    rates: {
      rate:      { medical: 0.0750, support: 0.0190, care: 0.0205 },
      perCapita: { medical: 12000,  support: 8800,   care: 13600  },
      household: { medical: 20400,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12204", citySlug: "funabashi", cityName: "船橋市",
    rates: {
      rate:      { medical: 0.0667, support: 0.0269, care: 0.0149 },
      perCapita: { medical: 35100,  support: 10700,  care: 11500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12205", citySlug: "tateyama", cityName: "館山市",
    rates: {
      rate:      { medical: 0.0722, support: 0.0292, care: 0.0245 },
      perCapita: { medical: 22200,  support: 15200,  care: 16800  },
      household: { medical: 25200,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12206", citySlug: "kisarazu", cityName: "木更津市",
    rates: {
      rate:      { medical: 0.0810, support: 0.0213, care: 0.0144 },
      perCapita: { medical: 20000,  support: 12000,  care: 14000  },
      household: { medical: 24000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12207", citySlug: "matsudo", cityName: "松戸市",
    rates: {
      rate:      { medical: 0.0762, support: 0.0262, care: 0.0181 },
      perCapita: { medical: 21000,  support: 12000,  care: 15000  },
      household: { medical: 18000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12208", citySlug: "noda", cityName: "野田市",
    rates: {
      rate:      { medical: 0.0555, support: 0.0282, care: 0.0236 },
      perCapita: { medical: 21900,  support: 12900,  care: 12600  },
      household: { medical: 28800,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12210", citySlug: "mobara", cityName: "茂原市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0270, care: 0.0210 },
      perCapita: { medical: 20000,  support: 10000,  care: 16000  },
      household: { medical: 20000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12211", citySlug: "narita", cityName: "成田市",
    rates: {
      rate:      { medical: 0.0681, support: 0.0213, care: 0.0177 },
      perCapita: { medical: 22100,  support: 8700,   care: 15700  },
      household: { medical: 19100,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12212", citySlug: "sakura", cityName: "佐倉市",
    rates: {
      rate:      { medical: 0.0633, support: 0.0265, care: 0.0152 },
      perCapita: { medical: 22200,  support: 7000,   care: 14400  },
      household: { medical: 29200,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12213", citySlug: "togane", cityName: "東金市",
    rates: {
      rate:      { medical: 0.0740, support: 0.0290, care: 0.0220 },
      perCapita: { medical: 19000,  support: 14000,  care: 13000  },
      household: { medical: 27000,  support: 0,      care: 0      },
    },
  },
  {
    // slug競合: 長野県朝日村(asahi)と重複 → asahishi
    cityCode: "12215", citySlug: "asahishi", cityName: "旭市",
    rates: {
      rate:      { medical: 0.0660, support: 0.0230, care: 0.0170 },
      perCapita: { medical: 21000,  support: 12000,  care: 14000  },
      household: { medical: 26000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12216", citySlug: "narashino", cityName: "習志野市",
    rates: {
      rate:      { medical: 0.0810, support: 0.0260, care: 0.0260 },
      perCapita: { medical: 24400,  support: 15400,  care: 15600  },
      household: { medical: 13500,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12217", citySlug: "kashiwa", cityName: "柏市",
    rates: {
      rate:      { medical: 0.0711, support: 0.0264, care: 0.0212 },
      perCapita: { medical: 29340,  support: 14160,  care: 15780  },
      household: { medical: 13740,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12218", citySlug: "katsuura", cityName: "勝浦市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 24000,  support: 15600,  care: 16200  },
      household: { medical: 18000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12219", citySlug: "ichihara", cityName: "市原市",
    rates: {
      rate:      { medical: 0.0759, support: 0.0269, care: 0.0266 },
      perCapita: { medical: 23600,  support: 14400,  care: 15100  },
      household: { medical: 25000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12220", citySlug: "nagareyama", cityName: "流山市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0323, care: 0.0160 },
      perCapita: { medical: 19200,  support: 12700,  care: 12600  },
      household: { medical: 15600,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12221", citySlug: "yachiyo", cityName: "八千代市",
    note: "支援分に平等割8,600円あり。",
    rates: {
      rate:      { medical: 0.0597, support: 0.0216, care: 0.0211 },
      perCapita: { medical: 27100,  support: 8800,   care: 16600  },
      household: { medical: 26300,  support: 8600,   care: 0      },
    },
  },
  {
    cityCode: "12222", citySlug: "abiko", cityName: "我孫子市",
    rates: {
      rate:      { medical: 0.0746, support: 0.0385, care: 0.0204 },
      perCapita: { medical: 24000,  support: 12000,  care: 18100  },
      household: { medical: 25000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12223", citySlug: "kamogawa", cityName: "鴨川市",
    rates: {
      rate:      { medical: 0.0705, support: 0.0284, care: 0.0239 },
      perCapita: { medical: 23400,  support: 14600,  care: 15600  },
      household: { medical: 28600,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12224", citySlug: "kamagaya", cityName: "鎌ケ谷市",
    rates: {
      rate:      { medical: 0.0790, support: 0.0278, care: 0.0174 },
      perCapita: { medical: 18500,  support: 11500,  care: 14900  },
      household: { medical: 21600,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12225", citySlug: "kimitsu", cityName: "君津市",
    rates: {
      rate:      { medical: 0.0743, support: 0.0198, care: 0.0194 },
      perCapita: { medical: 21000,  support: 12000,  care: 10000  },
      household: { medical: 25000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12226", citySlug: "futtsu", cityName: "富津市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0240, care: 0.0240 },
      perCapita: { medical: 39000,  support: 13000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12227", citySlug: "urayasu", cityName: "浦安市",
    rates: {
      rate:      { medical: 0.0666, support: 0.0260, care: 0.0180 },
      perCapita: { medical: 17400,  support: 12000,  care: 16000  },
      household: { medical: 24400,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12228", citySlug: "yotsukaido", cityName: "四街道市",
    rates: {
      rate:      { medical: 0.0806, support: 0.0218, care: 0.0219 },
      perCapita: { medical: 21100,  support: 19000,  care: 17300  },
      household: { medical: 22100,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12229", citySlug: "sodegaura", cityName: "袖ケ浦市",
    rates: {
      rate:      { medical: 0.0750, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 20000,  support: 14000,  care: 16000  },
      household: { medical: 24000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12230", citySlug: "yachimata", cityName: "八街市",
    rates: {
      rate:      { medical: 0.0750, support: 0.0200, care: 0.0150 },
      perCapita: { medical: 23000,  support: 10000,  care: 12000  },
      household: { medical: 32000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12231", citySlug: "inzai", cityName: "印西市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0230, care: 0.0200 },
      perCapita: { medical: 24000,  support: 11500,  care: 14000  },
      household: { medical: 29000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12232", citySlug: "shiroi", cityName: "白井市",
    rates: {
      rate:      { medical: 0.0703, support: 0.0210, care: 0.0142 },
      perCapita: { medical: 26300,  support: 4300,   care: 11400  },
      household: { medical: 30300,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12233", citySlug: "tomisato", cityName: "富里市",
    rates: {
      rate:      { medical: 0.0680, support: 0.0170, care: 0.0150 },
      perCapita: { medical: 18500,  support: 7000,   care: 12000  },
      household: { medical: 30000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12234", citySlug: "minamiboso", cityName: "南房総市",
    rates: {
      rate:      { medical: 0.0717, support: 0.0257, care: 0.0212 },
      perCapita: { medical: 26000,  support: 16000,  care: 15800  },
      household: { medical: 26500,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12235", citySlug: "sosa", cityName: "匝瑳市",
    rates: {
      rate:      { medical: 0.0650, support: 0.0250, care: 0.0130 },
      perCapita: { medical: 20000,  support: 12500,  care: 12500  },
      household: { medical: 25000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12236", citySlug: "katori", cityName: "香取市",
    rates: {
      rate:      { medical: 0.0780, support: 0.0280, care: 0.0220 },
      perCapita: { medical: 24000,  support: 13000,  care: 16000  },
      household: { medical: 28000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12237", citySlug: "sammu", cityName: "山武市",
    rates: {
      rate:      { medical: 0.0629, support: 0.0252, care: 0.0202 },
      perCapita: { medical: 20700,  support: 13100,  care: 15000  },
      household: { medical: 21500,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12238", citySlug: "isumi", cityName: "いすみ市",
    rates: {
      rate:      { medical: 0.0620, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 23000,  support: 13000,  care: 15000  },
      household: { medical: 19000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12239", citySlug: "oamishirasato", cityName: "大網白里市",
    rates: {
      rate:      { medical: 0.0692, support: 0.0260, care: 0.0290 },
      perCapita: { medical: 22200,  support: 14500,  care: 19100  },
      household: { medical: 21900,  support: 0,      care: 0      },
    },
  },

  // ── 町村 ─────────────────────────────────────────────────────

  {
    cityCode: "12322", citySlug: "shisui", cityName: "酒々井町",
    rates: {
      rate:      { medical: 0.0748, support: 0.0269, care: 0.0214 },
      perCapita: { medical: 28100,  support: 16300,  care: 16200  },
      household: { medical: 29700,  support: 0,      care: 0      },
    },
  },
  {
    // slug競合: 長野県栄村(sakae)と重複 → sakaecho
    cityCode: "12329", citySlug: "sakaecho", cityName: "栄町",
    rates: {
      rate:      { medical: 0.0710, support: 0.0214, care: 0.0158 },
      perCapita: { medical: 25500,  support: 8200,   care: 13300  },
      household: { medical: 27500,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12342", citySlug: "kozaki", cityName: "神崎町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 22000,  support: 10000,  care: 14000  },
      household: { medical: 22000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12347", citySlug: "tako", cityName: "多古町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0240, care: 0.0170 },
      perCapita: { medical: 18000,  support: 12000,  care: 15000  },
      household: { medical: 25000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12349", citySlug: "tohnosho", cityName: "東庄町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0150, care: 0.0100 },
      perCapita: { medical: 17000,  support: 11000,  care: 15000  },
      household: { medical: 30000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12403", citySlug: "kujukuri", cityName: "九十九里町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0240, care: 0.0190 },
      perCapita: { medical: 19000,  support: 11000,  care: 13000  },
      household: { medical: 19000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12409", citySlug: "shibayama", cityName: "芝山町",
    rates: {
      rate:      { medical: 0.0750, support: 0.0300, care: 0.0260 },
      perCapita: { medical: 19800,  support: 11900,  care: 11100  },
      household: { medical: 20300,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12410", citySlug: "yokoshibahikari", cityName: "横芝光町",
    rates: {
      rate:      { medical: 0.0690, support: 0.0210, care: 0.0170 },
      perCapita: { medical: 22000,  support: 13600,  care: 14400  },
      household: { medical: 23000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12421", citySlug: "ichinomiya", cityName: "一宮町",
    rates: {
      rate:      { medical: 0.0750, support: 0.0290, care: 0.0210 },
      perCapita: { medical: 21000,  support: 10000,  care: 14000  },
      household: { medical: 20000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12422", citySlug: "mutsuzawa", cityName: "睦沢町",
    rates: {
      rate:      { medical: 0.0990, support: 0.0290, care: 0.0230 },
      perCapita: { medical: 26000,  support: 13000,  care: 15000  },
      household: { medical: 22000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12423", citySlug: "chosei", cityName: "長生村",
    rates: {
      rate:      { medical: 0.0745, support: 0.0260, care: 0.0200 },
      perCapita: { medical: 18000,  support: 10600,  care: 12000  },
      household: { medical: 20000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12424", citySlug: "shirako", cityName: "白子町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 20000,  support: 9000,   care: 13000  },
      household: { medical: 20000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12426", citySlug: "nagara", cityName: "長柄町",
    rates: {
      rate:      { medical: 0.0740, support: 0.0260, care: 0.0200 },
      perCapita: { medical: 25000,  support: 12000,  care: 11000  },
      household: { medical: 20000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12427", citySlug: "chonan", cityName: "長南町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 24000,  support: 13000,  care: 12000  },
      household: { medical: 22000,  support: 0,      care: 0      },
    },
  },
  {
    // slug競合: 長野県王滝村(otaki)と重複 → otakicho
    cityCode: "12441", citySlug: "otakicho", cityName: "大多喜町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0280, care: 0.0290 },
      perCapita: { medical: 23000,  support: 14900,  care: 14700  },
      household: { medical: 26500,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "12443", citySlug: "onjuku", cityName: "御宿町",
    note: "医療分・支援分・介護分すべてに平等割あり。",
    rates: {
      rate:      { medical: 0.0560, support: 0.0240, care: 0.0150 },
      perCapita: { medical: 17000,  support: 9000,   care: 8000   },
      household: { medical: 20000,  support: 8000,   care: 5000   },
    },
  },
  {
    cityCode: "12463", citySlug: "kyonan", cityName: "鋸南町",
    rates: {
      rate:      { medical: 0.0672, support: 0.0233, care: 0.0190 },
      perCapita: { medical: 31300,  support: 16000,  care: 16000  },
      household: { medical: 19600,  support: 0,      care: 0      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// JSON生成
// ─────────────────────────────────────────────────────────────────
function buildJson(m) {
  return {
    cityCode:           m.cityCode,
    citySlug:           m.citySlug,
    cityName:           m.cityName,
    fiscalYear:         2025,
    system:             "kokuho",
    ...(m.note ? { note: m.note } : {}),
    basicDeduction:     430000,
    rate:               m.rates.rate,
    perCapita:          m.rates.perCapita,
    household:          m.rates.household,
    caps:               CAPS,
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
  };
}

// ─────────────────────────────────────────────────────────────────
// 実行
// ─────────────────────────────────────────────────────────────────
let created = 0, skipped = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`千葉県 国保データ一括生成 (令和7年度 / 2025年度)`);
console.log(`${"=".repeat(60)}\n`);

for (const m of MUNICIPALITIES) {
  const dir  = path.join(OUT_BASE, m.citySlug);
  const file = path.join(dir, "kokuho-2025.json");

  if (existsSync(file) && !FORCE) {
    console.log(`⏭  スキップ  ${m.cityName}`);
    skipped++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(buildJson(m), null, 2) + "\n", "utf-8");
  console.log(`✅ 生成完了  ${m.cityName}`);
  created++;
}

console.log(`\n${"─".repeat(60)}`);
console.log(`生成: ${created} 件 / スキップ: ${skipped} 件`);
console.log(`合計: ${MUNICIPALITIES.length} 自治体（料率確認済）`);
console.log();
