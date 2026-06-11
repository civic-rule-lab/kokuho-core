#!/bin/bash
# deploy.sh
# kokuho-core (private) で生成したファイルを kokuho-keisan (public) へ反映する
#
# 使い方:
#   bash scripts/deploy.sh               # バリデーション → 生成 → 同期 → コミット
#   bash scripts/deploy.sh --push        # 上記 + git push（両リポジトリ）+ wrangler deploy
#   bash scripts/deploy.sh --sync-only   # 生成スキップ、同期のみ
#   bash scripts/deploy.sh --dry-run     # 変更内容の確認のみ（実行しない）
#   bash scripts/deploy.sh --force       # untracked が working tree に残っていても deploy 強行
#                                         (2026-05-20 横浜 deploy 後の *2.html 本番混入事案で追加)

set -e

CORE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$HOME/Desktop/kokuho-keisan"
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

echo "=== kokuho-core → kokuho-keisan デプロイ ==="
echo "core:   $CORE_DIR"
echo "public: $PUBLIC_DIR"
echo "push:   $PUSH / sync-only: $SYNC_ONLY / dry-run: $DRY_RUN / force: $FORCE_DEPLOY"
echo ""

# ── 0. バリデーション ────────────────────────────────────────────
if true; then
  echo "▶ validate-kokuho-data.js"
  VALIDATE_OUTPUT=$(node "$CORE_DIR/scripts/validate-kokuho-data.js" 2>&1)
  echo "$VALIDATE_OUTPUT" | tail -5
  if echo "$VALIDATE_OUTPUT" | grep -q "❌ ERROR: [^0]"; then
    echo ""
    if [ "$DRY_RUN" = true ]; then
      echo "⚠️  バリデーションエラーがあります（dry-runのため続行）。"
    else
      echo "❌ バリデーションエラーがあります。デプロイを中断します。"
      echo "   node scripts/validate-kokuho-data.js で詳細を確認してください。"
      exit 1
    fi
  fi
  echo "✅ バリデーション通過"
  echo ""
fi

# ── 1. 生成スクリプトを実行 ──────────────────────────────────────
if [ "$SYNC_ONLY" = false ] && [ "$DRY_RUN" = false ]; then
  echo "▶ generate-selector.js"
  node "$CORE_DIR/scripts/generate-selector.js"

  echo "▶ generate-sitemap.js"
  node "$CORE_DIR/scripts/generate-sitemap.js"

  echo "▶ generate-official-pages.js"
  node "$CORE_DIR/scripts/generate-official-pages.js"

  echo "▶ generate-articles.js"
  node "$CORE_DIR/scripts/generate-articles.js"
fi

# ── 1.5 テンプレートスタンプ検証 ─────────────────────────────────
STAMP_FILE="$CORE_DIR/.build-stamp"
if [ -f "$STAMP_FILE" ]; then
  STAMP_HASH=$(cat "$STAMP_FILE")
  CURRENT_HASH=$(cat \
    "$CORE_DIR/templates/kokuho-simple.html" \
    "$CORE_DIR/templates/kokuho-income.html" \
    "$CORE_DIR/templates/prefecture-page.html" \
    | shasum -a 256 | awk '{print $1}' | cut -c1-8)
  if [ "$STAMP_HASH" != "$CURRENT_HASH" ]; then
    echo ""
    echo "❌ テンプレートが変更されていますが再生成されていません。"
    echo "   先に node scripts/generate-official-pages.js を実行してください。"
    exit 1
  fi
  echo "✅ テンプレートスタンプ一致"
else
  if [ "$SYNC_ONLY" = true ]; then
    echo "⚠️  .build-stamp が見つかりません。先に node scripts/generate-official-pages.js を実行してください。"
    exit 1
  fi
fi

# ── 2. 公開リポジトリへ同期 ──────────────────────────────────────
echo ""
echo "▶ 公開リポジトリへ同期中..."

# 都道府県ディレクトリを動的に検出（income.htmlが生成済みのもの）
PREFS=$(find "$CORE_DIR" -mindepth 3 -maxdepth 3 -name "income.html" \
  | awk -F/ '{print $(NF-2)}' | sort -u | tr '\n' ' ')

# 運用ログ（verify-reports / change-reports / url-hashes）は記録用の生成物なので
# 自動コミット（untracked 検査で deploy が止まるのを防ぐ。2026-06-11 追加）
if [ "$DRY_RUN" = false ]; then
  LOG_PATHS="docs/verify-reports docs/change-reports data/url-hashes"
  LOG_CHANGES=$(git -C "$CORE_DIR" status --porcelain -- $LOG_PATHS | wc -l | tr -d ' ')
  if [ "$LOG_CHANGES" -gt 0 ]; then
    git -C "$CORE_DIR" add -- $LOG_PATHS
    git -C "$CORE_DIR" commit -m "chore: 運用ログ自動コミット ($(date +%Y-%m-%d))" -- $LOG_PATHS
    echo "✅ 運用ログを自動コミットしました（$LOG_CHANGES 件）"
  fi
fi

# untracked ファイルが working tree に残っていると rsync で本番に流れ込む事故が
# 2026-05-20 横浜 deploy 後に発生 (PR #47 → "* 2.html" 残骸 → cleanup PR f0389d711a)。
# default で禁止、--force で override 可。dry-run でも検査する (早期発見が目的)。
if [ "$FORCE_DEPLOY" = false ]; then
  UNTRACKED_COUNT=$(git -C "$CORE_DIR" ls-files --others --exclude-standard | wc -l | tr -d ' ')
  if [ "$UNTRACKED_COUNT" -gt 0 ]; then
    echo "❌ untracked file が $UNTRACKED_COUNT 件 working tree に残っています。"
    echo "   そのまま rsync すると本番に流れ込みます (2026-05-20 横浜事案と同型)。"
    echo "   先頭 20 件:"
    git -C "$CORE_DIR" ls-files --others --exclude-standard | head -20 | sed 's/^/     /'
    echo ""
    echo "   対処:"
    echo "     - 不要なら git clean -fd / rm で削除"
    echo "     - 必要なら git add → commit"
    echo "     - どうしても deploy 強行したい場合は bash scripts/deploy.sh --force"
    exit 1
  fi
fi

if [ "$DRY_RUN" = false ]; then
  # 都道府県HTMLを rsync で同期（削除リスクを最小化）
  for p in $PREFS; do
    if [ -d "$CORE_DIR/$p" ]; then
      rsync -a --delete "$CORE_DIR/$p/" "$PUBLIC_DIR/$p/"
    fi
  done

  # 自治体JSONデータを rsync で同期
  echo "▶ data/municipalities/ を同期中..."
  mkdir -p "$PUBLIC_DIR/data/municipalities"
  rsync -a --delete "$CORE_DIR/data/municipalities/" "$PUBLIC_DIR/data/municipalities/"

  # 静的ファイル
  cp "$CORE_DIR/index.html"          "$PUBLIC_DIR/"
  cp "$CORE_DIR/js/selector.js"      "$PUBLIC_DIR/js/"
  cp "$CORE_DIR/js/engine.js"        "$PUBLIC_DIR/js/"
  cp "$CORE_DIR/js/core/kokuho.js"   "$PUBLIC_DIR/js/core/"
  cp "$CORE_DIR/css/common.css"      "$PUBLIC_DIR/css/"
  cp "$CORE_DIR/css/article.css"     "$PUBLIC_DIR/css/"
  cp "$CORE_DIR/sitemap.xml"         "$PUBLIC_DIR/"
  cp "$CORE_DIR/robots.txt"          "$PUBLIC_DIR/"

  # 記事ページ（/chigasaki/, /keigen/ 等）
  for art_dir in "$CORE_DIR"/chigasaki "$CORE_DIR"/keigen; do
    if [ -d "$art_dir" ]; then
      slug=$(basename "$art_dir")
      mkdir -p "$PUBLIC_DIR/$slug"
      rsync -a --delete "$art_dir/" "$PUBLIC_DIR/$slug/"
    fi
  done

  echo "✅ 同期完了"
else
  echo "（dry-run: 実際のコピーはスキップ）"
fi

# ── 3. 件数検証 ──────────────────────────────────────────────────
# 自治体ディレクトリ数（R7・R8 両年度を対象）
CORE_MUNI=$(find "$CORE_DIR/data/municipalities" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
PUBLIC_MUNI=$(find "$PUBLIC_DIR/data/municipalities" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
# JSONファイル総数（R7+R8）
CORE_JSON=$(find "$CORE_DIR/data/municipalities" -name "kokuho-*.json" | wc -l | tr -d ' ')
PUBLIC_JSON=$(find "$PUBLIC_DIR/data/municipalities" -name "kokuho-*.json" | wc -l | tr -d ' ')
# HTMLファイル総数（index.html + income.html）
CORE_HTML=$(find "$CORE_DIR" \( -name "index.html" -o -name "income.html" \) \
  -not -path "*/\.*" -not -path "*/dashboard/*" | grep -v "^$CORE_DIR/index.html" | wc -l | tr -d ' ')
PUBLIC_HTML=$(find "$PUBLIC_DIR" \( -name "index.html" -o -name "income.html" \) \
  -not -path "*/\.*" | grep -v "^$PUBLIC_DIR/index.html" | wc -l | tr -d ' ')

echo ""
echo "▶ 件数検証:"
echo "  自治体  core=$CORE_MUNI  public=$PUBLIC_MUNI  $([ "$CORE_MUNI" = "$PUBLIC_MUNI" ] && echo '✅ 一致' || echo '⚠️  不一致')"
echo "  JSON    core=$CORE_JSON  public=$PUBLIC_JSON  $([ "$CORE_JSON" = "$PUBLIC_JSON" ] && echo '✅ 一致' || echo '⚠️  不一致')"
echo "  HTML    core=$CORE_HTML  public=$PUBLIC_HTML  $([ "$CORE_HTML" = "$PUBLIC_HTML" ] && echo '✅ 一致' || echo '⚠️  不一致')"

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "=== dry-run 完了（変更なし）==="
  exit 0
fi

# ── 4. 公開リポジトリにコミット ───────────────────────────────────
cd "$PUBLIC_DIR"
git add .
if [ -z "$(git diff --cached)" ]; then
  echo ""
  echo "変更なし。コミットをスキップします。"
else
  DATE=$(date +%Y-%m-%d)
  STAT=$(git diff --cached --shortstat)
  git commit -m "$(cat <<COMMIT
デプロイ: $DATE

$STAT

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
COMMIT
)"
  echo "✅ コミット完了"
fi

# ── 5. push（オプション） ─────────────────────────────────────────
if [ "$PUSH" = true ]; then
  git push
  echo "✅ kokuho-keisan push 完了"
  cd "$CORE_DIR"
  git push
  echo "✅ kokuho-core push 完了"

  # ── 6. Cloudflare Worker デプロイ ──────────────────────────────
  # NOTE: 旧実装 `npx wrangler deploy | tail -5` は set -e でも tail の
  # 終了コードしか見ないため、wrangler 失敗が ✅ 表示で握りつぶされていた
  # (2026-06-10 CLOUDFLARE_API_TOKEN 未設定事案)。exit code を明示検査する。
  echo ""
  echo "▶ wrangler deploy"
  cd "$CORE_DIR/workers/api"
  WRANGLER_OUTPUT=$(npx wrangler deploy 2>&1) && WRANGLER_RC=0 || WRANGLER_RC=$?
  echo "$WRANGLER_OUTPUT" | tail -5
  if [ "$WRANGLER_RC" -ne 0 ]; then
    echo ""
    echo "❌ wrangler deploy 失敗 (exit code: $WRANGLER_RC)。デプロイを中断します。"
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
      echo "   CLOUDFLARE_API_TOKEN が未設定です。"
      echo "   export CLOUDFLARE_API_TOKEN=... を設定して再実行してください。"
    fi
    exit 1
  fi
  echo "✅ Worker デプロイ完了"

  # ── 7. 本番疎通テスト（curl smoke test） ──────────────────────
  echo ""
  echo "▶ 本番疎通テスト（最大5分 retry）"
  BASE_URL="https://kokuho-keisan.jp"
  # expected: "<URL>|<期待HTTPコード>"
  SMOKE_CHECKS=(
    "/|200"
    "/index.html|200"
    "/kanagawa/yokohama/|200"
    "/tokyo/ota/income.html|200"
    "/hokkaido/tomari/|200"
    "/hokkaido/tomari-kunashir/|200"
  )
  SMOKE_FAIL=0
  END=$((SECONDS+300))
  for check in "${SMOKE_CHECKS[@]}"; do
    url="${check%|*}"
    expected="${check#*|}"
    actual=""
    while [ $SECONDS -lt $END ]; do
      actual=$(curl -sI -o /dev/null -w "%{http_code}" "${BASE_URL}${url}")
      [ "$actual" = "$expected" ] && break
      sleep 15
    done
    if [ "$actual" = "$expected" ]; then
      echo "  ✅ ${url} → HTTP ${actual}"
    else
      echo "  ❌ ${url} → HTTP ${actual} (期待値: ${expected})"
      SMOKE_FAIL=$((SMOKE_FAIL+1))
    fi
  done
  if [ $SMOKE_FAIL -eq 0 ]; then
    echo "✅ 本番疎通テスト 全件 OK"
  else
    echo "❌ 本番疎通テスト ${SMOKE_FAIL} 件失敗（反映遅延の可能性・要手動確認）"
    exit 1
  fi
fi

echo ""
echo "=== デプロイ完了 ==="
