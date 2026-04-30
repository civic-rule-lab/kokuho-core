function toHalfWidth(str) {
  return String(str)
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[，、,]/g, "");
}

function setupNumericInput(id, options) {
  const el = document.getElementById(id);
  if (!el) return;
  const withCommas = !!(options && options.withCommas);
  let isComposing = false;

  function clean() {
    if (isComposing) return;
    el.value = toHalfWidth(el.value).replace(/[^\d]/g, "");
  }

  function commit() {
    const raw = toHalfWidth(el.value).replace(/[^\d]/g, "");
    if (!raw) { el.value = ""; return; }
    el.value = withCommas ? Number(raw).toLocaleString("ja-JP") : raw;
  }

  el.addEventListener('compositionstart', () => { isComposing = true; });
  el.addEventListener('compositionend', () => {
    isComposing = false;
    setTimeout(commit, 0);
  });
  el.addEventListener('input', clean);
  el.addEventListener('blur', commit);
  el.addEventListener('keydown', (e) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  });
}

// calculateKokuho は js/core/kokuho.js で定義（browser: グローバル、Node: require）

// ─── データ取得（キャッシュ付き） ────────────────────────────────

const _kokuhoDataCache = new Map();

async function loadKokuhoData(city) {
  if (_kokuhoDataCache.has(city)) return _kokuhoDataCache.get(city);
  const promise = (async () => {
    let res = await fetch(`/data/municipalities/${city}/kokuho-2026.json`, { cache: "no-store" });
    if (!res.ok) res = await fetch(`/data/municipalities/${city}/kokuho-2025.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("JSON読み込み失敗");
    return await res.json();
  })();
  _kokuhoDataCache.set(city, promise);
  try {
    return await promise;
  } catch (e) {
    _kokuhoDataCache.delete(city);
    throw e;
  }
}

function getCurrentCity() {
  const params = new URLSearchParams(location.search);
  return (typeof CITY_SLUG !== "undefined" ? CITY_SLUG : null) || params.get("city") || "chigasaki";
}

// ─── DOM アダプター ──────────────────────────────────────────────

async function calc() {
  const result = document.getElementById("result");

  try {
    const inputs = {
      income:             Math.max(0, Number(toHalfWidth(document.getElementById("income").value || "").replace(/[^\d]/g, "")) || 0),
      family:             Math.max(1, Number(toHalfWidth(document.getElementById("family").value || "1")) || 1),
      preschool:          Math.max(0, Number(toHalfWidth(document.getElementById("preschool")?.value || "0")) || 0),
      under18:            Math.max(0, Number(toHalfWidth(document.getElementById("under18")?.value || "0")) || 0),
      care:               Math.max(0, Number(toHalfWidth(document.getElementById("care")?.value || "0")) || 0),
      salaryPensionCount: Math.max(1, Number(toHalfWidth(document.getElementById("salaryPensionCount")?.value || "1")) || 1),
      fixedAssetTax:      Math.max(0, Number(toHalfWidth(document.getElementById("fixedAssetTax")?.value || "0").replace(/[^\d]/g, "")) || 0),
    };

    const city = getCurrentCity();
    const data = await loadKokuhoData(city);

    const r = calculateKokuho(data, inputs);

    // GA4: 計算実行イベント
    if (typeof gtag === 'function') {
      const pathParts = location.pathname.split('/').filter(Boolean);
      gtag('event', 'calculate', {
        prefecture: pathParts[0] || 'unknown',
        city: city,
        calc_type: location.pathname.includes('income') ? 'income' : 'simple'
      });
    }

    result.innerHTML =
      '<div class="result-row"><div class="result-label">医療分</div><div class="amount">' + r.medicalTotal.toLocaleString() + ' 円</div></div>' +
      '<div class="result-row"><div class="result-label">支援分</div><div class="amount">' + r.supportTotal.toLocaleString() + ' 円</div></div>' +
      '<div class="result-row"><div class="result-label">介護分</div><div class="amount">' + r.careTotal.toLocaleString() + ' 円</div></div>' +
      (r.childcareTotal > 0 ? '<div class="result-row"><div class="result-label">子ども・子育て支援金分</div><div class="amount">' + r.childcareTotal.toLocaleString() + ' 円</div></div>' : '') +
      (r.assetLevyTotal > 0 ? '<div class="result-row"><div class="result-label">資産割（内訳）</div><div class="amount">' + r.assetLevyTotal.toLocaleString() + ' 円</div></div>' : '') +
      '<div class="result-row"><div class="result-label">未就学児軽減</div><div class="amount">-' + r.preschoolReduction.toLocaleString() + ' 円</div></div>' +
      '<div class="result-row"><div class="result-label">法定軽減</div><div class="amount">-' + r.totalReduction.toLocaleString() + ' 円</div></div>' +
      '<div class="result-row"><div class="result-label">軽減判定</div><div class="amount">' + r.reductionLabel + '</div></div>' +
      '<div class="result-row"><div class="result-label">年間保険料（概算）</div><div class="amount">約 ' + r.total.toLocaleString() + ' 円</div></div>' +
      '<div class="result-row"><div class="result-label">月額目安</div><div class="amount">約 ' + r.monthly.toLocaleString() + ' 円</div></div>';

  } catch (error) {
    result.innerHTML =
      '<div class="result-label">計算エラー</div>' +
      '<div class="monthly">' + error.message + '</div>';
  }
}

if (typeof window !== 'undefined') {
  window.calc = calc;

  (function() {
    ['income', 'fixedAssetTax'].forEach(id => setupNumericInput(id, { withCommas: true }));
    ['family', 'preschool', 'care', 'salaryPensionCount', 'under18'].forEach(id => setupNumericInput(id));
  })();

  // ページ読み込み時に資産割入力欄を表示制御
  (async function() {
    try {
      const data = await loadKokuhoData(getCurrentCity());
      if (data.assetLevy) {
        const group = document.getElementById("assetLevyGroup");
        if (group) group.style.display = "";
      }
    } catch (e) {}
  })();
}
