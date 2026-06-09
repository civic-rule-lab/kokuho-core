#!/bin/bash
# deploy-seido.sh  ★草案（infra 整備後に有効）
# kokuho-core で生成した「住民税＋家計簿シミュレーター」を
# 新アンブレラ seido-keisan（public）へ反映する。
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
echo "✅ バリデーション通過"
echo ""

# ── 1. 生成（registry の systems に "jumin" を含む自治体のみ） ──────
if [ "$SYNC_ONLY" = false ]; then
  echo "▶ generate-jumin-pages.js"
  node "$CORE_DIR/scripts/generate-jumin-pages.js"
  echo "▶ generate-seido-index.js"
  node "$CORE_DIR/scripts/generate-seido-index.js"
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
# jumin ページを持つ {pref}/{slug} を検出し、jumin/ と kakeibo/ サブディレクトリだけ同期
SLUG_DIRS=$(find "$CORE_DIR" -path '*/jumin/index.html' | sed "s#/jumin/index.html##" | sed "s#$CORE_DIR/##" | sort -u)

if [ "$DRY_RUN" = false ]; then
  if [ ! -d "$PUBLIC_DIR" ]; then
    echo "❌ $PUBLIC_DIR がありません。先に seido-keisan リポを clone してください。"
    exit 1
  fi
  echo "▶ 住民税ページを同期中..."
  for d in $SLUG_DIRS; do
    mkdir -p "$PUBLIC_DIR/$d/jumin" "$PUBLIC_DIR/$d/kakeibo"
    rsync -a --delete "$CORE_DIR/$d/jumin/"   "$PUBLIC_DIR/$d/jumin/"
    rsync -a --delete "$CORE_DIR/$d/kakeibo/" "$PUBLIC_DIR/$d/kakeibo/"
  done

  # データ（住民税＝jumin、家計簿が参照する国保・介護も含めて同期）
  echo "▶ data/municipalities/ を同期中..."
  mkdir -p "$PUBLIC_DIR/data/municipalities"
  rsync -a --delete "$CORE_DIR/data/municipalities/" "$PUBLIC_DIR/data/municipalities/"

  # 計算エンジン（住民税＋家計簿が使う全制度＋共通）
  mkdir -p "$PUBLIC_DIR/js/core/shared" "$PUBLIC_DIR/css"
  cp "$CORE_DIR/js/core/shared/income.js" "$PUBLIC_DIR/js/core/shared/"
  cp "$CORE_DIR/js/core/jumin.js"         "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/kokuho.js"        "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/js/core/kaigo.js"         "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/css/common.css"           "$PUBLIC_DIR/css/"

  # アンブレラ・ランディング → 公開リポの index.html
  cp "$CORE_DIR/seido-index.html"         "$PUBLIC_DIR/index.html"

  echo "✅ 同期完了"
else
  echo "（dry-run: 同期スキップ）"
  echo "  対象 slug:"; echo "$SLUG_DIRS" | sed 's/^/    /'
fi

# ── 4. 件数検証 ──────────────────────────────────────────────────
CORE_JUMIN=$(find "$CORE_DIR" -path '*/jumin/index.html' | wc -l | tr -d ' ')
echo ""
echo "▶ 件数: jumin ページ $CORE_JUMIN 自治体分"

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
