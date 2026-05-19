/**
 * kokuho-keisan API - Cloudflare Worker
 * Phase 1: 認証なし・動作確認用
 *
 * POST /calculate
 * {
 *   "city": "chigasaki",
 *   "income": 3000000,
 *   "family": 3,
 *   "preschool": 0,
 *   "care": 1,
 *   "salaryPensionCount": 1,
 *   "fixedAssetTax": 0
 * }
 */

// アクセスを拒否するパスパターン
const DENY_PATHS = /(\.(env|git|htaccess|htpasswd|config|bak|sql|log|pem|key|secret)|\/wp-|\/admin|\/\.)/i;

const ALLOWED_ORIGINS = [
  'https://kokuho-keisan.jp',
  'https://www.kokuho-keisan.jp',
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// 入力値の上限
const INPUT_LIMITS = {
  income:             { min: 0,   max: 99_999_999 },
  family:             { min: 1,   max: 20 },
  preschool:          { min: 0,   max: 20 },
  care:               { min: 0,   max: 20 },
  salaryPensionCount: { min: 1,   max: 20 },
  fixedAssetTax:      { min: 0,   max: 99_999_999 },
};

const MAX_REQUEST_SIZE = 1024; // 1KB

const DATA_BASE_URL = 'https://kokuho-keisan.jp/data/municipalities';

// ─── 計算ロジック（engine.js と同一） ────────────────────────────

function calculateKokuho(input, data) {
  const { income, family, preschool, care, salaryPensionCount, fixedAssetTax } = input;

  const assetLevyMedical = data.assetLevy ? Math.round(fixedAssetTax * (data.assetLevy.medical || 0)) : 0;
  const assetLevySupport = data.assetLevy ? Math.round(fixedAssetTax * (data.assetLevy.support || 0)) : 0;
  const assetLevyCare    = data.assetLevy ? Math.round(fixedAssetTax * (data.assetLevy.care    || 0)) : 0;

  // 子ども・子育て支援金分（R8新設・0なら無効）
  const childcareRate            = data.childcare?.rate      || 0;
  const childcarePerCapitaUnit   = data.childcare?.perCapita || 0;
  const childcareHouseholdUnit   = data.childcare?.household || 0;

  const baseIncome = Math.max(income - data.basicDeduction, 0);

  const medicalIncome = Math.round(baseIncome * data.rate.medical);
  const supportIncome = Math.round(baseIncome * data.rate.support);
  const careIncome    = care > 0 ? Math.round(baseIncome * data.rate.care) : 0;

  const medicalPerCapita = family * data.perCapita.medical;
  const supportPerCapita = family * data.perCapita.support;
  const carePerCapita    = care  * data.perCapita.care;

  const medicalHousehold = data.household?.medical || 0;
  const supportHousehold = data.household?.support || 0;
  const careHousehold    = care > 0 ? (data.household?.care || 0) : 0;

  const preschoolReductionMedical = Math.round(
    preschool * data.perCapita.medical * (data.preschoolReduction?.medicalPerCapitaRate || 0)
  );
  const preschoolReductionSupport = Math.round(
    preschool * data.perCapita.support * (data.preschoolReduction?.supportPerCapitaRate || 0)
  );
  const preschoolReduction = preschoolReductionMedical + preschoolReductionSupport;

  const B = Math.max(salaryPensionCount, 1);
  const salaryPensionAdd = data.reduction?.salaryPensionAdd || 0;
  const extraForIncomeEarners = salaryPensionAdd * (B - 1);

  const sevenTenthsLimit =
    (data.reduction?.standards?.sevenTenths?.base || 0) +
    ((data.reduction?.standards?.sevenTenths?.perPersonAdd || 0) * family) +
    extraForIncomeEarners;

  const fiveTenthsLimit =
    (data.reduction?.standards?.fiveTenths?.base || 0) +
    ((data.reduction?.standards?.fiveTenths?.perPersonAdd || 0) * family) +
    extraForIncomeEarners;

  const twoTenthsLimit =
    (data.reduction?.standards?.twoTenths?.base || 0) +
    ((data.reduction?.standards?.twoTenths?.perPersonAdd || 0) * family) +
    extraForIncomeEarners;

  let reductionLabel = '軽減なし';
  let reductionRate  = 0;

  if (income <= sevenTenthsLimit) {
    reductionLabel = '7割軽減';
    reductionRate  = data.reduction?.ratios?.sevenTenths || 0;
  } else if (income <= fiveTenthsLimit) {
    reductionLabel = '5割軽減';
    reductionRate  = data.reduction?.ratios?.fiveTenths || 0;
  } else if (income <= twoTenthsLimit) {
    reductionLabel = '2割軽減';
    reductionRate  = data.reduction?.ratios?.twoTenths || 0;
  }

  const childcareIncome        = childcareRate > 0 ? Math.round(baseIncome * childcareRate) : 0;
  const childcarePerCapita     = family * childcarePerCapitaUnit;
  const childcareHousehold     = childcareRate > 0 ? childcareHouseholdUnit : 0;

  const medicalReduction   = Math.round((medicalPerCapita  + medicalHousehold)  * reductionRate);
  const supportReduction   = Math.round((supportPerCapita  + supportHousehold)  * reductionRate);
  const careReduction      = Math.round((carePerCapita     + careHousehold)     * reductionRate);
  const childcareReduction = Math.round((childcarePerCapita + childcareHousehold) * reductionRate);

  let medicalTotal   = medicalIncome   + medicalPerCapita   + medicalHousehold   + assetLevyMedical - preschoolReductionMedical - medicalReduction;
  let supportTotal   = supportIncome   + supportPerCapita   + supportHousehold   + assetLevySupport - preschoolReductionSupport - supportReduction;
  let careTotal      = careIncome      + carePerCapita      + careHousehold      + assetLevyCare    - careReduction;
  let childcareTotal = childcareIncome + childcarePerCapita + childcareHousehold                    - childcareReduction;

  medicalTotal   = Math.min(Math.max(medicalTotal,   0), data.caps.medical);
  supportTotal   = Math.min(Math.max(supportTotal,   0), data.caps.support);
  careTotal      = Math.min(Math.max(careTotal,      0), data.caps.care);
  childcareTotal = Math.min(Math.max(childcareTotal, 0), data.caps.childcare || 30000);

  const total          = medicalTotal + supportTotal + careTotal + childcareTotal;
  const monthly        = Math.round(total / 12);
  const totalReduction = medicalReduction + supportReduction + careReduction + childcareReduction;
  const assetLevyTotal = assetLevyMedical + assetLevySupport + assetLevyCare;

  return {
    medicalTotal, supportTotal, careTotal, childcareTotal,
    total, monthly,
    preschoolReduction, totalReduction,
    reductionLabel, assetLevyTotal,
  };
}

// ─── ハンドラー ───────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';
    const CORS_HEADERS = getCorsHeaders(origin);

    // 機密ファイルへのアクセスを拒否
    if (DENY_PATHS.test(url.pathname)) {
      return new Response('Not Found', { status: 404 });
    }

    // レートリミット（60秒間に60リクエストまで）
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }

    // リクエストサイズ制限（1KB超は拒否）
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_REQUEST_SIZE) {
      return new Response('Payload Too Large', { status: 413 });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ヘルスチェック
    if (url.pathname === '/') {
      return Response.json(
        { status: 'ok', version: '1.0.0', description: 'kokuho-keisan API' },
        { headers: CORS_HEADERS }
      );
    }

    // POST /calculate
    if (url.pathname === '/calculate' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          { error: 'Invalid JSON' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const city = body.city;
      if (!city || !/^[a-z0-9_-]+$/.test(city)) {
        return Response.json(
          { error: 'city は必須です（例: "chigasaki"）' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // 自治体データ取得（2026優先・2025フォールバック）
      let muniData;
      try {
        let res = await fetch(`${DATA_BASE_URL}/${city}/kokuho-2026.json`);
        if (!res.ok) res = await fetch(`${DATA_BASE_URL}/${city}/kokuho-2025.json`);
        if (!res.ok) {
          return Response.json(
            { error: `自治体データが見つかりません: ${city}` },
            { status: 404, headers: CORS_HEADERS }
          );
        }
        muniData = await res.json();
      } catch {
        return Response.json(
          { error: 'データ取得に失敗しました' },
          { status: 502, headers: CORS_HEADERS }
        );
      }

      const rawInputs = {
        income:             Number(body.income)             || 0,
        family:             Number(body.family)             || 1,
        preschool:          Number(body.preschool)          || 0,
        care:               Number(body.care)               || 0,
        salaryPensionCount: Number(body.salaryPensionCount) || 1,
        fixedAssetTax:      Number(body.fixedAssetTax)      || 0,
      };

      // 入力値の範囲チェック
      for (const [key, { min, max }] of Object.entries(INPUT_LIMITS)) {
        if (rawInputs[key] < min || rawInputs[key] > max) {
          return Response.json(
            { error: `${key} の値が範囲外です（${min}〜${max}）` },
            { status: 400, headers: CORS_HEADERS }
          );
        }
      }

      const inputs = rawInputs;

      const result = calculateKokuho(inputs, muniData);

      return Response.json(
        {
          city: muniData.cityName,
          citySlug: muniData.citySlug,
          fiscalYear: muniData.fiscalYear,
          inputs,
          result,
          meta: muniData.meta ?? null,
        },
        { headers: CORS_HEADERS }
      );
    }

    return Response.json(
      { error: 'Not Found' },
      { status: 404, headers: CORS_HEADERS }
    );
  },
};
