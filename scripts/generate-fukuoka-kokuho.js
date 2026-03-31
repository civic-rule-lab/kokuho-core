/**
 * 福岡県 国保データ一括生成スクリプト
 *
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 * - 既にファイルが存在する場合はスキップ（上書きしない）
 *
 * 実行:          node scripts/generate-fukuoka-kokuho.js
 * 強制上書き:    node scripts/generate-fukuoka-kokuho.js --force
 *
 * ▼ 福岡県の構造的特徴
 *   - 令和7年度時点: 各市町村が独自料率で運営（未統一）
 *   - 令和7年度より段階的保険料水準統一開始（令和11年度までに医療費指数反映を半減）
 *   - 大半が3方式（所得割+均等割+平等割）、介護分のみ2方式（平等割なし）の自治体多数
 *   - 資産割あり: 宮若市（医療・介護）、赤村（医療・支援・介護）の2自治体のみ
 *   - 賦課限度額: 全自治体とも全国標準（医療66万・支援26万・介護17万）
 *
 * ▼ スラグ競合
 *   那珂川市 → nakagawashi (長野県中川村が nakagawa を使用)
 *   川崎町   → kawasakimachi (神奈川県川崎市が kawasaki を使用)
 *
 * ▼ データ出典
 *   福岡県「令和7年度市町村標準保険料率及び都道府県標準保険料率について」
 *   https://www.pref.fukuoka.lg.jp/contents/hokenryo2025.html
 *   比較表: https://www.pref.fukuoka.lg.jp/uploaded/life/780060_62570639_misc.pdf
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_BASE  = path.join(__dirname, "../data/municipalities");
const FORCE     = process.argv.includes("--force");

// ─────────────────────────────────────────────────────────────────
// 共通設定
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

// 全国標準賦課限度額（令和7年度: 医療66万・支援26万・介護17万）
const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 自治体リスト
// 各自治体のrates: { rate, perCapita, household, [assetLevy] }
// ─────────────────────────────────────────────────────────────────
const MUNICIPALITIES = [

  // ── 政令市 ────────────────────────────────────────────────────
  {
    cityCode: "40100", citySlug: "kitakyushu", cityName: "北九州市",
    rates: {
      rate:      { medical: 0.0831, support: 0.0340, care: 0.0290 },
      perCapita: { medical: 23550,  support:  9590,  care:  9620  },
      household: { medical: 27160,  support: 11060,  care:  8290  },
    },
  },
  {
    cityCode: "40130", citySlug: "fukuoka", cityName: "福岡市",
    rates: {
      rate:      { medical: 0.0596, support: 0.0328, care: 0.0281 },
      perCapita: { medical: 19980,  support: 10334,  care: 10386  },
      household: { medical: 18863,  support:  9757,  care:  7912  },
    },
  },

  // ── 市 ───────────────────────────────────────────────────────
  {
    cityCode: "40202", citySlug: "omuta", cityName: "大牟田市",
    rates: {
      rate:      { medical: 0.0930, support: 0.0295, care: 0.0315 },
      perCapita: { medical: 19900,  support:  6200,  care: 14200  },
      household: { medical: 22400,  support:  7000,  care:     0  },
    },
  },
  {
    cityCode: "40203", citySlug: "kurume", cityName: "久留米市",
    rates: {
      rate:      { medical: 0.0937, support: 0.0266, care: 0.0211 },
      perCapita: { medical: 27200,  support:  7500,  care: 14700  },
      household: { medical: 22200,  support:  6400,  care:     0  },
    },
  },
  {
    cityCode: "40204", citySlug: "nogata", cityName: "直方市",
    rates: {
      rate:      { medical: 0.0945, support: 0.0330, care: 0.0330 },
      perCapita: { medical: 22500,  support:  7700,  care: 15300  },
      household: { medical: 23300,  support:  8000,  care:     0  },
    },
  },
  {
    cityCode: "40205", citySlug: "iizuka", cityName: "飯塚市",
    rates: {
      rate:      { medical: 0.0680, support: 0.0280, care: 0.0260 },
      perCapita: { medical: 21000,  support:  8100,  care:  9100  },
      household: { medical: 23000,  support:  8800,  care:  6700  },
    },
  },
  {
    cityCode: "40206", citySlug: "tagawa", cityName: "田川市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0297, care: 0.0260 },
      perCapita: { medical: 21600,  support: 10270,  care: 10800  },
      household: { medical: 18800,  support:  9000,  care:  7400  },
    },
  },
  {
    cityCode: "40207", citySlug: "yanagawa", cityName: "柳川市",
    rates: {
      rate:      { medical: 0.0850, support: 0.0257, care: 0.0238 },
      perCapita: { medical: 29000,  support:  9067,  care: 10789  },
      household: { medical: 31000,  support:  9711,  care:  8446  },
    },
  },
  {
    cityCode: "40208", citySlug: "yame", cityName: "八女市",
    rates: {
      rate:      { medical: 0.0850, support: 0.0300, care: 0.0230 },
      perCapita: { medical: 28000,  support:  9000,  care:  9000  },
      household: { medical: 28000,  support:  9000,  care:  7000  },
    },
  },
  {
    cityCode: "40209", citySlug: "chikugo", cityName: "筑後市",
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 29000,  support:  8000,  care: 10000  },
      household: { medical: 31000,  support:  9000,  care:  7000  },
    },
  },
  {
    cityCode: "40210", citySlug: "okawa", cityName: "大川市",
    rates: {
      rate:      { medical: 0.0890, support: 0.0256, care: 0.0227 },
      perCapita: { medical: 29000,  support:  9000,  care: 10000  },
      household: { medical: 32000,  support: 10000,  care:  9000  },
    },
  },
  {
    cityCode: "40211", citySlug: "yukuhashi", cityName: "行橋市",
    rates: {
      rate:      { medical: 0.0858, support: 0.0289, care: 0.0235 },
      perCapita: { medical: 28600,  support: 10700,  care: 10700  },
      household: { medical: 28700,  support: 10800,  care:  8200  },
    },
  },
  {
    cityCode: "40212", citySlug: "buzen", cityName: "豊前市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0310, care: 0.0210 },
      perCapita: { medical: 21000,  support:  8000,  care:  9000  },
      household: { medical: 28000,  support: 10000,  care:  8000  },
    },
  },
  {
    cityCode: "40213", citySlug: "nakama", cityName: "中間市",
    rates: {
      rate:      { medical: 0.0850, support: 0.0300, care: 0.0220 },
      perCapita: { medical: 24500,  support:  8800,  care:  7000  },
      household: { medical: 25000,  support:  6300,  care:  4500  },
    },
  },
  {
    cityCode: "40214", citySlug: "ogori", cityName: "小郡市",
    rates: {
      rate:      { medical: 0.0810, support: 0.0263, care: 0.0240 },
      perCapita: { medical: 25500,  support:  8400,  care: 10000  },
      household: { medical: 27000,  support:  9000,  care:  8000  },
    },
  },
  {
    cityCode: "40215", citySlug: "chikushino", cityName: "筑紫野市",
    rates: {
      rate:      { medical: 0.0683, support: 0.0280, care: 0.0243 },
      perCapita: { medical: 28100,  support: 12300,  care: 18000  },
      household: { medical: 25900,  support: 10700,  care:     0  },
    },
  },
  {
    cityCode: "40216", citySlug: "kasuga", cityName: "春日市",
    rates: {
      rate:      { medical: 0.0652, support: 0.0294, care: 0.0246 },
      perCapita: { medical: 27700,  support: 11800,  care: 19100  },
      household: { medical: 25300,  support: 10700,  care:     0  },
    },
  },
  {
    cityCode: "40217", citySlug: "onojo", cityName: "大野城市",
    rates: {
      rate:      { medical: 0.0754, support: 0.0309, care: 0.0253 },
      perCapita: { medical: 28000,  support: 11000,  care: 19000  },
      household: { medical: 28000,  support: 11000,  care:     0  },
    },
  },
  {
    cityCode: "40218", citySlug: "munakata", cityName: "宗像市",
    rates: {
      rate:      { medical: 0.0740, support: 0.0280, care: 0.0270 },
      perCapita: { medical: 24900,  support:  8800,  care: 15400  },
      household: { medical: 24900,  support:  8800,  care:     0  },
    },
  },
  {
    cityCode: "40219", citySlug: "dazaifu", cityName: "太宰府市",
    rates: {
      rate:      { medical: 0.0737, support: 0.0247, care: 0.0210 },
      perCapita: { medical: 26500,  support:  8300,  care: 16200  },
      household: { medical: 28000,  support:  9200,  care:     0  },
    },
  },
  {
    cityCode: "40221", citySlug: "koga", cityName: "古賀市",
    rates: {
      rate:      { medical: 0.0840, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 23800,  support: 10100,  care: 16600  },
      household: { medical: 26200,  support: 10900,  care:     0  },
    },
  },
  {
    cityCode: "40222", citySlug: "fukutsu", cityName: "福津市",
    rates: {
      rate:      { medical: 0.0780, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 25000,  support:  9000,  care: 13500  },
      household: { medical: 25000,  support:  9000,  care:     0  },
    },
  },
  {
    cityCode: "40223", citySlug: "ukiha", cityName: "うきは市",
    rates: {
      rate:      { medical: 0.1000, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 27000,  support:  8000,  care: 12000  },
      household: { medical: 24000,  support:  6000,  care:     0  },
    },
  },
  {
    // 資産割あり: 医療15% / 介護3.19%（支援分は資産割なし）
    cityCode: "40224", citySlug: "miyawaka", cityName: "宮若市",
    rates: {
      rate:      { medical: 0.0920, support: 0.0300, care: 0.0300 },
      perCapita: { medical: 22000,  support:  7800,  care:  7900  },
      household: { medical: 23500,  support:  6500,  care:  5600  },
      assetLevy: { medical: 0.15,                    care: 0.0319 },
    },
  },
  {
    cityCode: "40225", citySlug: "kama", cityName: "嘉麻市",
    rates: {
      rate:      { medical: 0.0850, support: 0.0350, care: 0.0150 },
      perCapita: { medical: 23000,  support:  7500,  care: 12000  },
      household: { medical: 26500,  support:  7500,  care:     0  },
    },
  },
  {
    cityCode: "40226", citySlug: "asakura", cityName: "朝倉市",
    rates: {
      rate:      { medical: 0.0860, support: 0.0290, care: 0.0200 },
      perCapita: { medical: 28000,  support:  8000,  care: 10000  },
      household: { medical: 26000,  support:  9000,  care: 15000  },
    },
  },
  {
    cityCode: "40227", citySlug: "miyama", cityName: "みやま市",
    rates: {
      rate:      { medical: 0.0774, support: 0.0283, care: 0.0235 },
      perCapita: { medical: 29194,  support: 10563,  care: 10750  },
      household: { medical: 29293,  support: 10599,  care:  8236  },
    },
  },
  {
    cityCode: "40228", citySlug: "itoshima", cityName: "糸島市",
    rates: {
      rate:      { medical: 0.0800, support: 0.0240, care: 0.0220 },
      perCapita: { medical: 24700,  support:  7500,  care: 12700  },
      household: { medical: 20500,  support:  6200,  care:     0  },
    },
  },
  {
    // slug競合: 長野県中川村(nakagawa)と重複 → nakagawashi
    cityCode: "40229", citySlug: "nakagawashi", cityName: "那珂川市",
    rates: {
      rate:      { medical: 0.0639, support: 0.0235, care: 0.0167 },
      perCapita: { medical: 31200,  support: 12200,  care: 22100  },
      household: { medical: 29500,  support: 11600,  care:     0  },
    },
  },

  // ── 粕屋郡 ───────────────────────────────────────────────────
  {
    cityCode: "40341", citySlug: "umi", cityName: "宇美町",
    rates: {
      rate:      { medical: 0.0905, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 28000,  support:  8000,  care: 10000  },
      household: { medical: 29000,  support:  9000,  care:  7000  },
    },
  },
  {
    cityCode: "40342", citySlug: "sasaguri", cityName: "篠栗町",
    rates: {
      rate:      { medical: 0.0780, support: 0.0250, care: 0.0230 },
      perCapita: { medical: 28000,  support:  8800,  care: 10600  },
      household: { medical: 30000,  support:  9400,  care:  8300  },
    },
  },
  {
    cityCode: "40343", citySlug: "shime", cityName: "志免町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 25000,  support: 10000,  care: 10000  },
      household: { medical: 26500,  support: 10000,  care:  8000  },
    },
  },
  {
    cityCode: "40344", citySlug: "sue", cityName: "須恵町",
    rates: {
      rate:      { medical: 0.0840, support: 0.0240, care: 0.0210 },
      perCapita: { medical: 27000,  support:  8000,  care:  8000  },
      household: { medical: 28000,  support:  9000,  care:  7000  },
    },
  },
  {
    cityCode: "40345", citySlug: "shingu", cityName: "新宮町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0290, care: 0.0220 },
      perCapita: { medical: 28000,  support: 10000,  care: 10000  },
      household: { medical: 30000,  support: 10000,  care:  8000  },
    },
  },
  {
    cityCode: "40348", citySlug: "hisayama", cityName: "久山町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 30500,  support:  9000,  care: 10500  },
      household: { medical: 17400,  support:  6000,  care:  7000  },
    },
  },
  {
    cityCode: "40349", citySlug: "kasuya", cityName: "粕屋町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0320, care: 0.0250 },
      perCapita: { medical: 31000,  support: 11000,  care: 11000  },
      household: { medical: 32000,  support: 12000,  care:  9000  },
    },
  },

  // ── 遠賀郡 ───────────────────────────────────────────────────
  {
    cityCode: "40401", citySlug: "ashiya", cityName: "芦屋町",
    rates: {
      rate:      { medical: 0.0740, support: 0.0230, care: 0.0160 },
      perCapita: { medical: 21200,  support:  6700,  care:  6800  },
      household: { medical: 23600,  support:  7500,  care:  5100  },
    },
  },
  {
    cityCode: "40402", citySlug: "mizumaki", cityName: "水巻町",
    rates: {
      rate:      { medical: 0.0740, support: 0.0260, care: 0.0210 },
      perCapita: { medical: 23000,  support:  8000,  care: 10000  },
      household: { medical: 26500,  support: 10500,  care:  8000  },
    },
  },
  {
    cityCode: "40403", citySlug: "okagaki", cityName: "岡垣町",
    rates: {
      rate:      { medical: 0.0670, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 25100,  support:  9400,  care:  9700  },
      household: { medical: 27000,  support: 10200,  care:  7600  },
    },
  },
  {
    cityCode: "40404", citySlug: "onga", cityName: "遠賀町",
    rates: {
      rate:      { medical: 0.0717, support: 0.0253, care: 0.0223 },
      perCapita: { medical: 27308,  support: 10749,  care: 11267  },
      household: { medical: 26968,  support: 10778,  care:  7447  },
    },
  },

  // ── 鞍手郡 ───────────────────────────────────────────────────
  {
    cityCode: "40421", citySlug: "kotake", cityName: "小竹町",
    rates: {
      rate:      { medical: 0.0970, support: 0.0330, care: 0.0260 },
      perCapita: { medical: 27000,  support:  9500,  care:  8300  },
      household: { medical: 25000,  support:  6000,  care:  5600  },
    },
  },
  {
    cityCode: "40422", citySlug: "kurate", cityName: "鞍手町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0290, care: 0.0210 },
      perCapita: { medical: 21000,  support:  7600,  care:  7000  },
      household: { medical: 23100,  support:  8600,  care:  5400  },
    },
  },

  // ── 嘉穂郡 ───────────────────────────────────────────────────
  {
    cityCode: "40425", citySlug: "keisen", cityName: "桂川町",
    rates: {
      rate:      { medical: 0.0780, support: 0.0380, care: 0.0105 },
      perCapita: { medical: 25000,  support:  6000,  care:  6600  },
      household: { medical: 25000,  support:  5000,  care:  3700  },
    },
  },

  // ── 朝倉郡 ───────────────────────────────────────────────────
  {
    cityCode: "40431", citySlug: "chikuzen", cityName: "筑前町",
    rates: {
      rate:      { medical: 0.0800, support: 0.0270, care: 0.0210 },
      perCapita: { medical: 27000,  support:  8000,  care:  9000  },
      household: { medical: 27000,  support:  9000,  care:  4000  },
    },
  },
  {
    cityCode: "40433", citySlug: "toho", cityName: "東峰村",
    rates: {
      rate:      { medical: 0.0780, support: 0.0240, care: 0.0200 },
      perCapita: { medical: 23000,  support:  8000,  care: 11000  },
      household: { medical: 24000,  support: 11000,  care:  5000  },
    },
  },

  // ── 三井郡 ───────────────────────────────────────────────────
  {
    cityCode: "40442", citySlug: "tachiarai", cityName: "大刀洗町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0220, care: 0.0180 },
      perCapita: { medical: 25000,  support:  7000,  care: 14000  },
      household: { medical: 25000,  support:  7000,  care:     0  },
    },
  },

  // ── 三潴郡 ───────────────────────────────────────────────────
  {
    cityCode: "40443", citySlug: "oki", cityName: "大木町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0290, care: 0.0230 },
      perCapita: { medical: 31000,  support: 10000,  care: 11000  },
      household: { medical: 32000,  support: 11000,  care:  9000  },
    },
  },

  // ── 八女郡 ───────────────────────────────────────────────────
  {
    cityCode: "40444", citySlug: "hirokawa", cityName: "広川町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0300, care: 0.0230 },
      perCapita: { medical: 28000,  support:  9000,  care: 11000  },
      household: { medical: 30000,  support: 10000,  care:  8000  },
    },
  },

  // ── 田川郡 ───────────────────────────────────────────────────
  {
    cityCode: "40501", citySlug: "kawara", cityName: "香春町",
    rates: {
      rate:      { medical: 0.0730, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 27400,  support: 10200,  care: 10500  },
      household: { medical: 27500,  support: 10300,  care:  8100  },
    },
  },
  {
    cityCode: "40502", citySlug: "soeda", cityName: "添田町",
    rates: {
      rate:      { medical: 0.0750, support: 0.0250, care: 0.0250 },
      perCapita: { medical: 24900,  support: 10900,  care: 10400  },
      household: { medical: 28300,  support: 10100,  care:  8500  },
    },
  },
  {
    cityCode: "40504", citySlug: "itoda", cityName: "糸田町",
    rates: {
      rate:      { medical: 0.0800, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 26900,  support:  9700,  care:  9200  },
      household: { medical: 26200,  support:  9600,  care:  8200  },
    },
  },
  {
    // slug競合: 神奈川県川崎市(kawasaki)と重複 → kawasakimachi
    cityCode: "40505", citySlug: "kawasakimachi", cityName: "川崎町",
    rates: {
      rate:      { medical: 0.1000, support: 0.0180, care: 0.0160 },
      perCapita: { medical: 23000,  support:  7000,  care:  6000  },
      household: { medical: 24000,  support: 11000,  care:  4000  },
    },
  },
  {
    cityCode: "40506", citySlug: "oto", cityName: "大任町",
    rates: {
      rate:      { medical: 0.1050, support: 0.0240, care: 0.0210 },
      perCapita: { medical: 24000,  support:  9000,  care:  8000  },
      household: { medical: 27000,  support:  7000,  care:  6000  },
    },
  },
  {
    // 資産割あり: 医療20% / 支援2% / 介護3%（全3分野）
    cityCode: "40507", citySlug: "akamura", cityName: "赤村",
    rates: {
      rate:      { medical: 0.0850, support: 0.0300, care: 0.0300 },
      perCapita: { medical: 19500,  support:  6000,  care:  8200  },
      household: { medical: 22500,  support:  7000,  care:  6000  },
      assetLevy: { medical: 0.20,   support: 0.02,   care: 0.03   },
    },
  },

  // ── 京都郡 ───────────────────────────────────────────────────
  {
    cityCode: "40521", citySlug: "kanda", cityName: "苅田町",
    rates: {
      rate:      { medical: 0.0769, support: 0.0310, care: 0.0245 },
      perCapita: { medical: 27500,  support: 11000,  care: 11000  },
      household: { medical: 28000,  support: 10000,  care:  8500  },
    },
  },
  {
    cityCode: "40522", citySlug: "miyako", cityName: "みやこ町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0260, care: 0.0260 },
      perCapita: { medical: 25000,  support:  9000,  care: 11000  },
      household: { medical: 25000,  support:  8000,  care:  7000  },
    },
  },
  {
    cityCode: "40523", citySlug: "fukuchi", cityName: "福智町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0263, care: 0.0252 },
      perCapita: { medical: 24000,  support:  9000,  care:  9000  },
      household: { medical: 26000,  support: 10000,  care:  7000  },
    },
  },

  // ── 築上郡 ───────────────────────────────────────────────────
  {
    cityCode: "40524", citySlug: "chikujo", cityName: "築上町",
    rates: {
      rate:      { medical: 0.0900, support: 0.0320, care: 0.0330 },
      perCapita: { medical: 21000,  support:  6000,  care:  9500  },
      household: { medical: 22000,  support:  7000,  care:  4500  },
    },
  },
  {
    cityCode: "40525", citySlug: "yoshitomi", cityName: "吉富町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0310, care: 0.0230 },
      perCapita: { medical: 20000,  support:  8000,  care:  8000  },
      household: { medical: 24000,  support:  7000,  care:  6000  },
    },
  },
  {
    cityCode: "40526", citySlug: "koge", cityName: "上毛町",
    rates: {
      rate:      { medical: 0.0710, support: 0.0290, care: 0.0200 },
      perCapita: { medical: 18500,  support:  7100,  care:  7400  },
      household: { medical: 17400,  support:  8300,  care:  5300  },
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// JSON生成
// ─────────────────────────────────────────────────────────────────
function buildJson(m) {
  const obj = {
    cityCode:           m.cityCode,
    citySlug:           m.citySlug,
    cityName:           m.cityName,
    fiscalYear:         2025,
    system:             "kokuho",
    basicDeduction:     430000,
    rate:               m.rates.rate,
    perCapita:          m.rates.perCapita,
    household:          m.rates.household,
    caps:               CAPS,
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
  };
  if (m.rates.assetLevy) obj.assetLevy = m.rates.assetLevy;
  return obj;
}

// ─────────────────────────────────────────────────────────────────
// 実行
// ─────────────────────────────────────────────────────────────────
let created = 0, skipped = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`福岡県 国保データ一括生成 (令和7年度 / 2025年度)`);
console.log(`60市町村 / 全国標準上限（医療66万・支援26万・介護17万）`);
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
console.log(`合計: ${MUNICIPALITIES.length} 自治体`);
console.log();
