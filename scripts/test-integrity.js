/**
 * 5/12 修復作業の整合性テスト（Phase 1〜3 の検証）
 *
 * 検証項目（6 セクション）:
 *   A. cityCode 一次資料整合性（registry × 総務省 snapshot）
 *   B. slug 衝突の解消（registry 内に重複なし・data dir に重複 base なし）
 *   C. registry.citySlug ↔ data/municipalities/{slug}/ 整合
 *   D. data dir 内 JSON の cityCode 統一（混在なし）
 *   E. 公開 HTML（{pref}/{slug}/index.html）の自治体名整合
 *   F. 自動防衛線の動作（validator・hook・script の各機構）
 *
 * 利用:
 *   node scripts/test-integrity.js           # 全 6 セクション実行
 *   node scripts/test-integrity.js --section A  # 個別セクション
 *
 * 終了コード:
 *   0 — 全合格
 *   1 — 1 件以上の不整合
 *   2 — 環境エラー
 */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const REFERENCE = path.join(ROOT, "data", "reference", "soumu-jichitai-codes.json");
const LEGACY = path.join(ROOT, "registry", "legacy-slug-collisions.json");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

const argv = process.argv.slice(2);
const SECTION_IDX = argv.indexOf("--section");
const ONLY_SECTION = SECTION_IDX >= 0 ? argv[SECTION_IDX + 1] : null;

const reg = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const ref = existsSync(REFERENCE) ? JSON.parse(readFileSync(REFERENCE, "utf-8")) : null;
const legacy = existsSync(LEGACY) ? JSON.parse(readFileSync(LEGACY, "utf-8")) : null;

let totalPass = 0;
let totalFail = 0;
const failures = [];

function header(label) {
  console.log("");
  console.log("━".repeat(70));
  console.log(`  ${label}`);
  console.log("━".repeat(70));
}

function passLine(msg) {
  console.log(`  ✅ ${msg}`);
  totalPass++;
}

function failLine(section, msg, detail) {
  console.log(`  ❌ ${msg}`);
  if (detail) {
    if (Array.isArray(detail)) {
      detail.slice(0, 10).forEach(d => console.log(`     - ${d}`));
      if (detail.length > 10) console.log(`     ... (${detail.length - 10} 件追加省略)`);
    } else {
      console.log(`     ${detail}`);
    }
  }
  totalFail++;
  failures.push({ section, msg, detail });
}

function shouldRun(section) {
  return !ONLY_SECTION || ONLY_SECTION === section;
}

// ═══════════════════════════════════════════════════════════════════
// A. cityCode 一次資料整合性
// ═══════════════════════════════════════════════════════════════════
if (shouldRun("A")) {
  header("A. cityCode 一次資料整合性（registry × 総務省 snapshot）");

  if (!ref) {
    failLine("A", "総務省 snapshot ファイル不在", REFERENCE);
  } else {
    const refByNamePref = new Map();
    for (const e of ref.entries) {
      if (e.isPrefecture) continue;
      const key = `${e.prefecture}|${e.cityName}`;
      if (!refByNamePref.has(key)) refByNamePref.set(key, []);
      refByNamePref.get(key).push(e);
    }

    const partial = ref.partialCoverage === true;
    let aMatch = 0, aMismatch = 0, aSkip = 0, aAmbiguous = 0;
    const mismatches = [];
    const ambiguous = [];

    // registry を 同名同県 で groupBy（曖昧性解消判定用）
    const regByNamePref = new Map();
    for (const m of reg.municipalities) {
      const key = `${m.prefecture}|${m.cityName}`;
      if (!regByNamePref.has(key)) regByNamePref.set(key, []);
      regByNamePref.get(key).push(m);
    }

    for (const m of reg.municipalities) {
      const key = `${m.prefecture}|${m.cityName}`;
      const candidates = refByNamePref.get(key);
      if (!candidates || candidates.length === 0) {
        aSkip++;
        continue;
      }
      if (candidates.length > 1) {
        // 曖昧性解消済み判定: registry に同名同県の entry が candidates と同数あり、
        // かつ cityCode の集合が candidates の集合と一致する場合は ✅
        const regEntries = regByNamePref.get(key) || [];
        const candCodes = new Set(candidates.map(c => c.code5));
        const regCodes = new Set(regEntries.map(e => String(e.cityCode).padStart(5, "0")));
        const allCovered = regEntries.length === candidates.length
          && [...candCodes].every(c => regCodes.has(c));
        if (allCovered) {
          // 個別 entry の cityCode が candidates 内に存在することを確認
          const regCode = String(m.cityCode).padStart(5, "0");
          if (candCodes.has(regCode)) {
            aMatch++;
            continue;
          }
        }
        aAmbiguous++;
        ambiguous.push(`${m.prefecture}${m.cityName} (registry=${m.cityCode}) candidates=${candidates.map(c=>c.code5).join(",")}`);
        continue;
      }
      const refCode = candidates[0].code5;
      const regCode = String(m.cityCode).padStart(5, "0");
      if (refCode === regCode) {
        aMatch++;
      } else {
        aMismatch++;
        mismatches.push(`${m.prefecture}${m.cityName} (slug=${m.citySlug}): registry=${regCode} vs 総務省=${refCode}`);
      }
    }

    console.log(`  カバレッジ: ${partial ? "⚠️ partial" : "✅ full"}（${ref.entries.length} エントリ）`);
    console.log(`  合致: ${aMatch} / 不一致: ${aMismatch} / カバレッジ外: ${aSkip} / 同名複数: ${aAmbiguous}`);

    if (aMismatch === 0) passLine(`A-1: registry × 一次資料 cityCode 不一致なし`);
    else failLine("A", `A-1: registry × 一次資料 cityCode 不一致 ${aMismatch} 件`, mismatches);

    if (aAmbiguous === 0) passLine(`A-2: 同名複数（手動確認案件）なし`);
    else failLine("A", `A-2: 同名複数 ${aAmbiguous} 件`, ambiguous);

    if (partial) {
      console.log(`  ℹ️  partial coverage: ${aSkip} 件は未検証。完全 .xls 取得後に再実行推奨`);
    } else {
      if (aSkip === 0) passLine(`A-3: 全 registry が一次資料でカバー（full）`);
      else failLine("A", `A-3: 一次資料カバレッジ外 ${aSkip} 件（full なのに）`, []);
    }
  }

  // A-4: registry 内 cityCode 重複チェック
  // 同一 cityCode が複数の slug に紐づく場合 = 旧スラグ未削除 or データ誤り
  {
    const codeRegistry = new Map();
    for (const m of reg.municipalities) {
      if (!m.cityCode) continue;
      const code = String(m.cityCode).padStart(5, "0");
      if (!codeRegistry.has(code)) codeRegistry.set(code, []);
      codeRegistry.get(code).push(`${m.citySlug} (${m.prefecture}${m.cityName})`);
    }
    const codeConflicts = [...codeRegistry.entries()]
      .filter(([, entries]) => entries.length > 1)
      .map(([code, entries]) => `cityCode=${code}: ${entries.join(" / ")}`);

    if (codeConflicts.length === 0) {
      passLine(`A-4: registry 内 cityCode 重複なし`);
    } else {
      failLine("A", `A-4: registry 内 cityCode 重複 ${codeConflicts.length} 件（旧スラグ未削除の可能性）`, codeConflicts);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// B. slug 衝突の解消
// ═══════════════════════════════════════════════════════════════════
if (shouldRun("B")) {
  header("B. slug 衝突の解消（registry 重複・data dir 重複）");

  const slugMap = new Map();
  for (const m of reg.municipalities) {
    if (!slugMap.has(m.citySlug)) slugMap.set(m.citySlug, []);
    slugMap.get(m.citySlug).push(`${m.prefecture}${m.cityName} (${m.cityCode})`);
  }

  const allowlist = new Set();
  if (legacy?.collisions) {
    for (const c of legacy.collisions) allowlist.add(c.slug);
  }

  const dupes = [...slugMap.entries()].filter(([, v]) => v.length > 1);
  const dupesNotInAllowlist = dupes.filter(([s]) => !allowlist.has(s));
  const dupesInAllowlist = dupes.filter(([s]) => allowlist.has(s));

  if (dupesNotInAllowlist.length === 0) {
    passLine(`B-1: registry 内に「allowlist 外の重複 slug」なし`);
  } else {
    failLine("B", `B-1: allowlist 外の重複 slug ${dupesNotInAllowlist.length} 種類`,
      dupesNotInAllowlist.map(([s, v]) => `${s}: ${v.join(" / ")}`));
  }

  if (dupesInAllowlist.length === 0) {
    passLine(`B-2: legacy allowlist 内の衝突も 0 件（完全解消）`);
  } else {
    console.log(`  ⚠️  B-2: legacy allowlist 内に未解消の衝突 ${dupesInAllowlist.length} 種類（grandfather 期間中なら許容）`);
    dupesInAllowlist.forEach(([s, v]) => console.log(`       - ${s}: ${v.join(" / ")}`));
  }

  // data dir の base slug 残存検証
  // 各 base slug について、「base 取得側自治体が registry に居れば dir が残るのが正解」
  const dirs = readdirSync(DATA_DIR).filter(d => {
    try { return statSync(path.join(DATA_DIR, d)).isDirectory(); } catch { return false; }
  });
  const decisions = legacy?.namingConvention?.appliedDecisions || {};
  const unexpectedResidual = [];
  for (const [baseSlug, decision] of Object.entries(decisions)) {
    const baseKeepsName = decision.base?.newSlug === baseSlug;
    const dirExists = dirs.includes(baseSlug);
    const baseInRegistry = reg.municipalities.some(m =>
      m.citySlug === baseSlug &&
      m.cityName === decision.base?.cityName &&
      m.prefecture === decision.base?.prefecture
    );

    if (dirExists && (!baseKeepsName || !baseInRegistry)) {
      // base 取得が別 slug なのに dir が残っている、もしくは base 自治体が registry にない
      unexpectedResidual.push(`${baseSlug}: base取得=${decision.base?.newSlug} registry存在=${baseInRegistry}`);
    }
  }

  if (unexpectedResidual.length === 0) {
    passLine(`B-3: 6 件 base slug dir は base 取得自治体のために正しく残存している`);
  } else {
    failLine("B", `B-3: 想定外の base slug dir 残存`, unexpectedResidual);
  }
}

// ═══════════════════════════════════════════════════════════════════
// C. registry.citySlug ↔ data dir 整合
// ═══════════════════════════════════════════════════════════════════
if (shouldRun("C")) {
  header("C. registry.citySlug ↔ data/municipalities/{slug}/ 整合");

  // systems が空の entry は「制度データなし・ページのみ存在」として data dir 不要と扱う
  const regSlugs = new Set(
    reg.municipalities
      .filter(m => Array.isArray(m.systems) && m.systems.length > 0)
      .map(m => m.citySlug)
  );
  const dirs = readdirSync(DATA_DIR).filter(d => {
    try { return statSync(path.join(DATA_DIR, d)).isDirectory(); } catch { return false; }
  });
  const dirSet = new Set(dirs);

  const inRegNotInDir = [...regSlugs].filter(s => !dirSet.has(s));
  const inDirNotInReg = dirs.filter(d => !regSlugs.has(d));

  if (inRegNotInDir.length === 0) {
    passLine(`C-1: registry の全 citySlug に対応する data dir が存在`);
  } else {
    failLine("C", `C-1: registry にあるが data dir がない slug ${inRegNotInDir.length} 件`, inRegNotInDir);
  }

  if (inDirNotInReg.length === 0) {
    passLine(`C-2: 孤立 data dir なし（全 dir が registry 登録済）`);
  } else {
    // 孤立 dir は legacy・古い命名等で許容できる場合あり
    console.log(`  ⚠️  C-2: registry にない data dir ${inDirNotInReg.length} 件（古い命名・退役 dir の可能性）`);
    inDirNotInReg.slice(0, 15).forEach(d => console.log(`       - ${d}`));
    if (inDirNotInReg.length > 15) console.log(`       ... (${inDirNotInReg.length - 15} 件省略)`);
  }

  // C-3: data dir 内 JSON の cityCode が registry の別 slug に紐付いていないか
  // （旧スラグ残留パターン：移行後に古いディレクトリが削除されずに残存）
  {
    // registry の cityCode → slug[] マップ
    const codeToSlugs = new Map();
    for (const m of reg.municipalities) {
      const code = String(m.cityCode || "").padStart(5, "0");
      if (!code || code === "00000") continue;
      if (!codeToSlugs.has(code)) codeToSlugs.set(code, []);
      codeToSlugs.get(code).push(m.citySlug);
    }

    const staleSlugDirs = [];

    for (const dir of dirs) {
      const dirPath = path.join(DATA_DIR, dir);
      // kokuho-*.json を優先、なければ jumin-*.json、kaigo-*.json の順で cityCode を取得
      let jsonFiles;
      try {
        jsonFiles = readdirSync(dirPath).filter(f => /^(kokuho|jumin|kaigo)-\d{4}\.json$/.test(f));
      } catch { continue; }
      if (jsonFiles.length === 0) continue;

      let cityCode;
      for (const f of jsonFiles) {
        try {
          const data = JSON.parse(readFileSync(path.join(dirPath, f), "utf-8"));
          if (data.cityCode) { cityCode = String(data.cityCode).padStart(5, "0"); break; }
        } catch { continue; }
      }
      if (!cityCode || cityCode === "00000") continue;

      const registrySlugs = codeToSlugs.get(cityCode);
      if (!registrySlugs) continue; // registry 未登録（C-2 で検出済み）

      // dir名が registry の slug として登録されていない → 旧スラグ残留
      if (!registrySlugs.includes(dir)) {
        staleSlugDirs.push({
          dir,
          cityCode,
          registrySlug: registrySlugs.join(" / "),
        });
      }
    }

    if (staleSlugDirs.length === 0) {
      passLine(`C-3: 旧スラグ残留なし（全 data dir の cityCode が registry slug と一致）`);
    } else {
      failLine(
        "C",
        `C-3: 旧スラグ残留 ${staleSlugDirs.length} 件（移行後の旧 dir 削除漏れ）`,
        staleSlugDirs.map(s => `${s.dir}  cityCode=${s.cityCode}  →  現 registry slug: ${s.registrySlug}`)
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// D. data dir 内 JSON の cityCode 統一（混在なし）
// ═══════════════════════════════════════════════════════════════════
if (shouldRun("D")) {
  header("D. data/municipalities/{slug}/*.json の cityCode 統一");

  const dirs = readdirSync(DATA_DIR).filter(d => {
    try { return statSync(path.join(DATA_DIR, d)).isDirectory(); } catch { return false; }
  });
  const mixed = [];

  for (const d of dirs) {
    const dp = path.join(DATA_DIR, d);
    const codes = new Set();
    const files = readdirSync(dp).filter(f => f.endsWith(".json"));
    for (const f of files) {
      try {
        const j = JSON.parse(readFileSync(path.join(dp, f), "utf-8"));
        if (j.cityCode) codes.add(String(j.cityCode).padStart(5, "0"));
      } catch { }
    }
    if (codes.size > 1) {
      mixed.push(`${d}: cityCode 混在 [${[...codes].join(", ")}]`);
    }
  }

  if (mixed.length === 0) {
    passLine(`D-1: 全 data dir で cityCode 統一（ichinomiya/kaigo 混在問題解消）`);
  } else {
    failLine("D", `D-1: cityCode 混在 ${mixed.length} dir`, mixed);
  }

  // citySlug の整合
  const slugMismatch = [];
  for (const d of dirs) {
    const dp = path.join(DATA_DIR, d);
    const files = readdirSync(dp).filter(f => f.endsWith(".json"));
    for (const f of files) {
      try {
        const j = JSON.parse(readFileSync(path.join(dp, f), "utf-8"));
        if (j.citySlug && j.citySlug !== d) {
          slugMismatch.push(`${d}/${f}: dir 名=${d} vs JSON.citySlug=${j.citySlug}`);
        }
      } catch { }
    }
  }

  if (slugMismatch.length === 0) {
    passLine(`D-2: 全 JSON で citySlug = dir 名（同期されている）`);
  } else {
    failLine("D", `D-2: citySlug と dir 名の不一致 ${slugMismatch.length} 件`, slugMismatch);
  }
}

// ═══════════════════════════════════════════════════════════════════
// E. 公開 HTML の自治体名整合
// ═══════════════════════════════════════════════════════════════════
if (shouldRun("E")) {
  header("E. 公開 HTML の自治体名整合（{pref}/{slug}/index.html）");

  let eCheck = 0, ePass = 0, eFail = 0;
  const htmlFails = [];

  let noPrefSlug = 0;
  for (const m of reg.municipalities) {
    if (!m.prefectureSlug || !m.citySlug) { noPrefSlug++; continue; }
    const htmlPath = path.join(ROOT, m.prefectureSlug, m.citySlug, "index.html");
    if (!existsSync(htmlPath)) continue;
    eCheck++;
    try {
      const html = readFileSync(htmlPath, "utf-8");
      if (html.includes(m.cityName)) {
        ePass++;
      } else {
        eFail++;
        htmlFails.push(`${m.prefectureSlug}/${m.citySlug}/index.html: "${m.cityName}" が見つからない`);
      }
    } catch (e) {
      eFail++;
      htmlFails.push(`${m.prefectureSlug}/${m.citySlug}/: 読込エラー (${e.message})`);
    }
  }

  console.log(`  チェック対象: ${eCheck} / 合格: ${ePass} / 不合格: ${eFail}${noPrefSlug ? ` / prefectureSlug 欠落 skip: ${noPrefSlug}` : ""}`);
  if (eFail === 0) {
    passLine(`E-1: 全 HTML で cityName が正しく埋め込まれている`);
  } else {
    failLine("E", `E-1: HTML 内 cityName 不整合 ${eFail} 件`, htmlFails);
  }

  // 旧 URL（衝突 base slug）の HTML が削除 or redirect-only に置換済か
  // GitHub Pages 配信のため _redirects は無効。旧 URL に meta refresh HTML を残して
  // client-side redirect する運用を許容（実データが残るのは NG）。
  if (legacy?.collisions) {
    const oldHtmlBad = [];
    for (const c of legacy.collisions) {
      const oldSlug = c.slug;
      for (const e of c.entries) {
        if (!e.prefectureSlug) continue;
        // base 側（registry citySlug 維持の方）はそのまま残るので skip
        const isBase = legacy.namingConvention?.appliedDecisions?.[oldSlug]?.base?.newSlug === oldSlug;
        const matchesBase = legacy.namingConvention?.appliedDecisions?.[oldSlug]?.base?.prefecture === e.prefecture;
        if (isBase && matchesBase) continue;
        const oldPath = path.join(ROOT, e.prefectureSlug, oldSlug, "index.html");
        if (!existsSync(oldPath)) continue;
        const html = readFileSync(oldPath, "utf-8");
        const isRedirectOnly = /<meta\s+http-equiv=["']refresh["']/i.test(html)
          && /<link\s+rel=["']canonical["']/i.test(html);
        if (!isRedirectOnly) {
          oldHtmlBad.push(`${e.prefectureSlug}/${oldSlug}/index.html（${e.prefecture}${e.cityName}の旧 URL に実データ残存）`);
        }
      }
    }
    if (oldHtmlBad.length === 0) {
      passLine(`E-2: 衝突解消 6 件の旧 URL HTML がすべて削除 or redirect-only`);
    } else {
      failLine("E", `E-2: 旧 URL に実データが残存 ${oldHtmlBad.length} 件`, oldHtmlBad);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// F. 自動防衛線の動作確認
// ═══════════════════════════════════════════════════════════════════
if (shouldRun("F")) {
  header("F. 自動防衛線（validator / hook / script）の動作確認");

  // F-1: check-slug.js が機能するか
  const scriptsExist = [
    "scripts/check-slug.js",
    "scripts/check-slug-precommit.js",
    "scripts/check-citycode-precommit.js",
    "scripts/validate-citycodes.js",
    "scripts/validate-kokuho-data.js",
    "scripts/fix-citycodes.js",
    "scripts/fix-slug-collisions.js",
    "scripts/git-hooks/pre-commit",
  ];
  const missingScripts = scriptsExist.filter(s => !existsSync(path.join(ROOT, s)));
  if (missingScripts.length === 0) {
    passLine(`F-1: 4 段防衛のスクリプト一式が揃っている`);
  } else {
    failLine("F", `F-1: 不在スクリプト ${missingScripts.length} 件`, missingScripts);
  }

  // F-2: legacy-slug-collisions.json が存在し allowlist として機能
  if (legacy && legacy.collisions && Array.isArray(legacy.collisions)) {
    passLine(`F-2: registry/legacy-slug-collisions.json が存在し ${legacy.collisions.length} 件登録済`);
  } else {
    failLine("F", `F-2: legacy-slug-collisions.json が空 or 不正`);
  }

  // F-3: data/reference/soumu-jichitai-codes.json が存在
  if (ref) {
    passLine(`F-3: 総務省 snapshot 存在（${ref.entries?.length || 0} エントリ）`);
  } else {
    failLine("F", `F-3: 総務省 snapshot 不在`);
  }

  // F-4: pre-commit hook がインストールされているか（.git/hooks/pre-commit）
  // ※ .git/hooks/ は VCS 管理外のため CI 環境では存在しないのが正常 → CI では skip
  if (process.env.CI === "true") {
    console.log(`  ⏭️  F-4: pre-commit hook チェックは CI 環境では skip（.git/hooks/ は VCS 管理外）`);
  } else {
    const hookPath = path.join(ROOT, ".git", "hooks", "pre-commit");
    if (existsSync(hookPath)) {
      const hookContent = readFileSync(hookPath, "utf-8");
      if (hookContent.includes("check-slug-precommit") || hookContent.includes("check-citycode-precommit")) {
        passLine(`F-4: .git/hooks/pre-commit に slug/cityCode 検証が組込み済`);
      } else {
        failLine("F", `F-4: .git/hooks/pre-commit に検証フックが組込まれていない`);
      }
    } else {
      failLine("F", `F-4: .git/hooks/pre-commit 不在（bash scripts/install-hooks.sh 未実行）`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 結果サマリ
// ═══════════════════════════════════════════════════════════════════
console.log("");
console.log("═".repeat(70));
console.log("  テスト結果サマリ");
console.log("═".repeat(70));
console.log(`  ✅ 合格: ${totalPass}`);
console.log(`  ❌ 不合格: ${totalFail}`);
console.log("");

if (totalFail === 0) {
  console.log("  🎉 全テスト合格。5/12 修復作業は正しく完了している。");
  process.exit(0);
} else {
  console.log("  ⚠️  不合格項目あり。failures セクションを確認してください。");
  process.exit(1);
}
