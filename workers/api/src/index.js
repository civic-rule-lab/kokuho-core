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

// 計算ロジックは正本 js/core/kokuho.js を単一ソースとして共有する（独自複製による乖離を根絶）。
// wrangler/esbuild が相対 import をバンドルする。core の calculateKokuho は document/window を
// 参照しない純粋関数なので Worker 実行環境で安全（esbuild バンドル・E2E一致を検証済み）。
import { calculateKokuho } from '../../../js/core/kokuho.js';

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
  under18:            { min: 0,   max: 20 },
  care:               { min: 0,   max: 20 },
  salaryPensionCount: { min: 1,   max: 20 },
  fixedAssetTax:      { min: 0,   max: 99_999_999 },
};

const MAX_REQUEST_SIZE = 1024; // 1KB

const DATA_BASE_URL = 'https://kokuho-keisan.jp/data/municipalities';

// ─── 計算ロジック ────────────────────────────────────────────────
// calculateKokuho は js/core/kokuho.js（正本）から import 済み。
// 以前ここにあった独自複製は core と乖離していた（childcareLevy 無視・schoolReduction/
// perCapitaAdult/擬制世帯主/clamp 欠落）ため 2026-07-02 に削除し、core 共有へ統合。

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
        under18:            Number(body.under18)            || 0,
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

      // 擬制世帯主: 世帯主所得を軽減判定に加算する場合に指定（任意）。
      // 未指定なら core が income にフォールバック（後方互換）。
      let reductionJudgmentIncome;
      if (body.reductionJudgmentIncome != null) {
        reductionJudgmentIncome = Number(body.reductionJudgmentIncome);
        if (Number.isNaN(reductionJudgmentIncome) ||
            reductionJudgmentIncome < 0 || reductionJudgmentIncome > 99_999_999) {
          return Response.json(
            { error: 'reductionJudgmentIncome の値が範囲外です（0〜99,999,999）' },
            { status: 400, headers: CORS_HEADERS }
          );
        }
      }

      const inputs = { ...rawInputs, reductionJudgmentIncome };

      // 正本 core の計算。自治体データ不備（例: perCapitaAdult があるのに
      // perCapitaAdultScope 未設定）で throw し得るため捕捉して 400 を返す。
      let result;
      try {
        result = calculateKokuho(inputs, muniData);
      } catch (e) {
        return Response.json(
          { error: '計算に失敗しました（自治体データの不備の可能性）', detail: String(e?.message ?? e) },
          { status: 400, headers: CORS_HEADERS }
        );
      }

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
