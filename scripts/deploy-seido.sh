#!/bin/bash
# deploy-seido.sh  ★草案（infra 整備後に有効）
# kokuho-core で生成した「住民税・家計簿・後期高齢者医療・介護」ページを
# 新アンブレラ seido-keisan（public）へ反映する。
# （2026-06-28 後期/介護の個別ページ同期に対応：sync ループ・kouki.js・検証・smoke を追加）
#
# 前提（未整備＝この script を実行する前に必要）:
#   1. seido-keisan.jp ドメイン取得 + Cloudflare DNS/proxy + GitHub Pages(origin) 設定
#   2. 公開リポ seido-keisan 作成（~/Desktop/seido-keisan に clone）
#   3. アンブレラのトップページ(/) と /{pref}/{slug}/ ルート（家計簿の「国保だけ詳しく」リンク先）
#      ※当面は kakeibo の __LINK_KOKUHO__ を kokuho-keisan.jp 側へ向ける運用も可
#
# 使い方:
#   bash scripts/deploy-seido.sh --dry-run   # 生成＋件数確認のみ（同期しない）
#   bash scripts/deploy-seido.sh             # 検証→生成→同期→コミット
#   bash scripts/deploy-seido.sh --push      # 上記 + git push（GitHub Pages auto-deploy）
#
# 国保 deploy.sh（kokuho-keisan 向け）とは独立。住民税のみを扱う。

set -e

CORE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$HOME/Desktop/seido-keisan"      # ★ 未作成。infra 整備後に clone
BASE_URL="https://seido-keisan.jp"
PUSH=false
SYNC_ONLY=false
DRY_RUN=false
FORCE_DEPLOY=false

for arg in "$@"; do
  case $arg in
    --push)      PUSH=true ;;
    --sync-only) SYNC_ONLY=true ;;
    --dry-run)   DRY_RUN=true ;;
    --force)     FORCE_DEPLOY=true ;;
  esac
done

echo "=== kokuho-core → seido-keisan（住民税）デプロイ ==="
echo "core:   $CORE_DIR"
echo "public: $PUBLIC_DIR"
echo "push:   $PUSH / sync-only: $SYNC_ONLY / dry-run: $DRY_RUN / force: $FORCE_DEPLOY"
echo ""

# ── 0. バリデーション ────────────────────────────────────────────
echo "▶ validate-jumin-data.js"
VALIDATE_OUTPUT=$(node "$CORE_DIR/scripts/validate-jumin-data.js" 2>&1)
echo "$VALIDATE_OUTPUT" | tail -8
if echo "$VALIDATE_OUTPUT" | grep -qE "❌|エラー: [1-9]"; then
  if [ "$DRY_RUN" = true ]; then
    echo "⚠️  バリデーションエラー（dry-runのため続行）"
  else
    echo "❌ バリデーションエラー。デプロイを中断します。"
    exit 1
  fi
fi
echo "✅ 住民税バリデーション通過"

echo "▶ validate-kouki-data.js"
KOUKI_VALIDATE=$(node "$CORE_DIR/scripts/validate-kouki-data.js" 2>&1)
echo "$KOUKI_VALIDATE" | tail -4
if echo "$KOUKI_VALIDATE" | grep -qE "❌|errors=[1-9]"; then
  if [ "$DRY_RUN" = true ]; then
    echo "⚠️  後期バリデーションエラー（dry-runのため続行）"
  else
    echo "❌ 後期高齢者医療バリデーションエラー。デプロイを中断します。"
    exit 1
  fi
fi
echo "✅ 後期バリデーション通過"

# ── 0b. 保育料バリデーション(hoiku) ─────────────────────────────
echo "▶ validate-hoiku-data.cjs"
HOIKU_VALIDATE=$(node "$CORE_DIR/scripts/validate-hoiku-data.cjs" 2>&1)
echo "$HOIKU_VALIDATE" | tail -4
if echo "$HOIKU_VALIDATE" | grep -qE "❌|NG|失敗"; then
  if [ "$DRY_RUN" = true ]; then echo "⚠️  保育料バリデーションエラー（dry-run続行）"; else
    echo "❌ 保育料バリデーションエラー。デプロイを中断します。"; exit 1; fi
fi
node "$CORE_DIR/scripts/test-hoiku-verify.cjs" >/dev/null 2>&1 || { if [ "$DRY_RUN" = false ]; then echo "❌ 保育料 公式表照合 失敗"; exit 1; fi; }
JUMIN_PATH="$CORE_DIR/js/core/jumin.js" node "$CORE_DIR/scripts/test-hoiku-wiring.cjs" >/dev/null 2>&1 || true
node "$CORE_DIR/scripts/test-hoiku-selftest.cjs" >/dev/null 2>&1 || { if [ "$DRY_RUN" = false ]; then echo "❌ 保育料 自己テスト 失敗"; exit 1; fi; }
echo "✅ 保育料バリデーション通過"
echo ""

# ── 1. 生成（registry の systems に "jumin" を含む自治体のみ） ──────
if [ "$SYNC_ONLY" = false ]; then
  echo "▶ generate-jumin-pages.js"
  node "$CORE_DIR/scripts/generate-jumin-pages.js"
  echo "▶ generate-hoiku-pages.js"
  node "$CORE_DIR/scripts/generate-hoiku-pages.js"
  echo "▶ generate-seido-index.js"
  node "$CORE_DIR/scripts/generate-seido-index.js"
  echo "▶ generate-seido-sitemap.js"
  node "$CORE_DIR/scripts/generate-seido-sitemap.js"
fi

# ── 2. untracked 混入ガード（2026-05-20 横浜事案と同型の防止） ─────
if [ "$FORCE_DEPLOY" = false ]; then
  UNTRACKED_COUNT=$(git -C "$CORE_DIR" ls-files --others --exclude-standard | wc -l | tr -d ' ')
  if [ "$UNTRACKED_COUNT" -gt 0 ]; then
    echo "❌ untracked file が $UNTRACKED_COUNT 件あります。rsync で本番に流れ込む恐れ。"
    git -C "$CORE_DIR" ls-files --others --exclude-standard | head -20 | sed 's/^/     /'
    echo "   git add/commit するか git clean、または --force で強行。"
    exit 1
  fi
fi

# ── 3. 同期（住民税ページ＋依存ファイルのみ） ───────────────────
# kakeibo / jumin / kouki / kaigo いずれかの公開ページを持つ {pref}/{slug} を検出。
# 制度ごとに「存在する自治体だけ」同期する（kouki は kakeibo 非公開の自治体も含むため
# kakeibo だけを基準にすると一部の後期ページが取りこぼされる）。
SLUG_DIRS=$(find "$CORE_DIR" \( -path '*/kakeibo/index.html' -o -path '*/jumin/index.html' -o -path '*/kouki/index.html' -o -path '*/kaigo/index.html' -o -path '*/hoiku/index.html' \) | sed -E "s#/(kakeibo|jumin|kouki|kaigo|hoiku)/index.html##" | sed "s#$CORE_DIR/##" | sort -u)

if [ "$DRY_RUN" = false ]; then
  if [ ! -d "$PUBLIC_DIR" ]; then
    echo "❌ $PUBLIC_DIR がありません。先に seido-keisan リポを clone してください。"
    exit 1
  fi
  echo "▶ 住民税・家計簿・後期・介護ページを同期中..."
  for d in $SLUG_DIRS; do
    for sys in kakeibo jumin kouki kaigo hoiku; do
      if [ -d "$CORE_DIR/$d/$sys" ]; then
        mkdir -p "$PUBLIC_DIR/$d/$sys"
        rsync -a --delete "$CORE_DIR/$d/$sys/" "$PUBLIC_DIR/$d/$sys/"
      fi
    done
  done

  # データ（住民税＝jumin、家計簿が参照する国保・介護も含めて同期）
  echo "▶ data/municipalities/ を同期中..."
  mkdir -p "$PUBLIC_DIR/data/municipalities"
  rsync -a --delete "$CORE_DIR/data/municipalities/" "$PUBLIC_DIR/data/municipalities/"

  # 全国共通データ（家計簿の社会保険＝data/shaho、所得税＝data/national）。自治体別ではないので別建てで同期。
  echo "▶ data/shaho/ ・ data/national/ を同期中..."
  mkdir -p "$PUBLIC_DIR/data/shaho" "$PUBLIC_DIR/data/national"
  rsync -a --delete "$CORE_DIR/data/shaho/"    "$PUBLIC_DIR/data/shaho/"
  rsync -a --delete "$CORE_DIR/data/national/" "$PUBLIC_DIR/data/national/"

  # 計算エンジン（住民税＋家計簿が使う全制度＋共通）
  mkdir -p "$PUBLIC_DIR/js/core/shared" "$PUBLIC_DIR/css"
  cp "$CORE_DIR/js/core/shared/income.js" "$PUBLIC_DIR/js/core/shared/"
  cp "$CORE_DIR/js/core/jumin.js"         "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/kokuho.js"        "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/kaigo.js"         "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/kouki.js"         "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/hoiku.js"         "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/shaho.js"         "$PUBLIC_DIR/js/core/"   # 家計簿の社会保険（会社員）＝vendored（正本 shaho-keisan）
  cp "$CORE_DIR/js/core/shotoku.js"       "$PUBLIC_DIR/js/core/"   # 家計簿の所得税＝vendored（正本 shotoku-keisan）
  cp "$CORE_DIR/js/core/shogakukin.js"        "$PUBLIC_DIR/js/core/"   # 家計簿の奨学金結線（給付＋減免コア）
  cp "$CORE_DIR/js/core/shogakukin-bridge.js" "$PUBLIC_DIR/js/core/"   # 同上（年収→jumin→supporter ブリッジ）
  cp "$CORE_DIR/js/core/shogakukin-2026.json" "$PUBLIC_DIR/js/core/"   # 同上（全国共通スペック。家計簿が fetch する）
  cp "$CORE_DIR/css/common.css"           "$PUBLIC_DIR/css/"

  # アンブレラ・ランディング → 公開リポの index.html
  cp "$CORE_DIR/seido-index.html"         "$PUBLIC_DIR/index.html"

  # サイトマップ（seido-keisan 専用。旧 kokuho 用 sitemap.xml とは別物）
  cp "$CORE_DIR/seido-sitemap.xml"        "$PUBLIC_DIR/sitemap.xml"

  # robots.txt（seido-keisan 自身の sitemap.xml を告知。旧 kokuho を指す core の robots.txt とは別）
  cp "$CORE_DIR/seido-robots.txt"         "$PUBLIC_DIR/robots.txt"

  echo "✅ 同期完了"
else
  echo "（dry-run: 同期スキップ）"
  echo "  対象 slug:"; echo "$SLUG_DIRS" | sed 's/^/    /'
fi

# ── 4. 件数検証 ──────────────────────────────────────────────────
CORE_JUMIN=$(find "$CORE_DIR" -path '*/jumin/index.html' | wc -l | tr -d ' ')
CORE_KAKEIBO=$(find "$CORE_DIR" -path '*/kakeibo/index.html' | wc -l | tr -d ' ')
CORE_KOUKI=$(find "$CORE_DIR" -path '*/kouki/index.html' | wc -l | tr -d ' ')
CORE_KAIGO=$(find "$CORE_DIR" -path '*/kaigo/index.html' | wc -l | tr -d ' ')
CORE_HOIKU=$(find "$CORE_DIR" -path '*/hoiku/index.html' | wc -l | tr -d ' ')
echo ""
echo "▶ 件数: 家計簿 $CORE_KAKEIBO / 住民税 $CORE_JUMIN / 後期 $CORE_KOUKI / 介護 $CORE_KAIGO / 保育料 $CORE_HOIKU 自治体分"

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "=== dry-run 完了 ==="
  exit 0
fi

# ── 5. コミット ──────────────────────────────────────────────────
cd "$PUBLIC_DIR"
git add .
if [ -z "$(git diff --cached)" ]; then
  echo "変更なし。コミットをスキップ。"
else
  DATE=$(date +%Y-%m-%d)
  STAT=$(git diff --cached --shortstat)
  git commit -m "住民税デプロイ: $DATE

$STAT"
  echo "✅ コミット完了"
fi

# ── 6. push（オプション・GitHub Pages auto-deploy） ──────────────
if [ "$PUSH" = true ]; then
  # GitHub が custom domain 設定時に CNAME を自動コミットするとリモートが先行する。
  # push 前に pull/merge して非fast-forward拒否を回避（2026-06-09 事案対策）。
  git pull --no-rebase --no-edit origin main || true
  git push
  echo "✅ seido-keisan push 完了"
  cd "$CORE_DIR"; git push; echo "✅ kokuho-core push 完了"

  # ── 7. 本番 smoke test（試験公開6市） ──
  echo ""
  echo "▶ 本番疎通テスト"
  SMOKE_CHECKS=(
    "/aichi/nagoya/jumin/|200"
    "/aichi/nagoya/jumin/income.html|200"
    "/aichi/nagoya/kakeibo/|200"
    "/kanagawa/yokohama/jumin/|200"
    "/osaka/osaka/kakeibo/|200"
    "/tokyo/shinjuku/kouki/|200"
    "/tokyo/shinjuku/kouki/income.html|200"
    "/tokyo/kouki/|200"
    "/tokyo/kouki/income.html|200"
    "/tokyo/shinjuku/kaigo/|200"
    "/kanagawa/yokohama/hoiku/|200"
    "/robots.txt|200"
    "/sitemap.xml|200"
  )
  END=$((SECONDS+300)); FAIL=0
  for check in "${SMOKE_CHECKS[@]}"; do
    url="${check%|*}"; expected="${check#*|}"; actual=""
    while [ $SECONDS -lt $END ]; do
      actual=$(curl -sI -o /dev/null -w "%{http_code}" "${BASE_URL}${url}")
      [ "$actual" = "$expected" ] && break; sleep 15
    done
    [ "$actual" = "$expected" ] && echo "  ✅ ${url} → ${actual}" || { echo "  ❌ ${url} → ${actual}"; FAIL=$((FAIL+1)); }
  done
  [ $FAIL -eq 0 ] && echo "✅ smoke test 全件OK" || echo "⚠️  smoke test ${FAIL}件失敗"
fi

echo ""
echo "=== 完了 ==="
