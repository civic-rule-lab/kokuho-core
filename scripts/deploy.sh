#!/bin/bash
# deploy.sh
# kokuho-core (private) で生成したファイルを kokuho-keisan (public) へ反映する
#
# 使い方:
#   bash scripts/deploy.sh               # バリデーション → 生成 → 同期 → コミット
#   bash scripts/deploy.sh --push        # 上記 + git push（両リポジトリ）+ wrangler deploy
#   bash scripts/deploy.sh --sync-only   # 生成スキップ、同期のみ
#   bash scripts/deploy.sh --dry-run     # 変更内容の確認のみ（実行しない）

set -e

CORE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$HOME/Desktop/kokuho-keisan"
PUSH=false
SYNC_ONLY=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --push)      PUSH=true ;;
    --sync-only) SYNC_ONLY=true ;;
    --dry-run)   DRY_RUN=true ;;
  esac
done

echo "=== kokuho-core → kokuho-keisan デプロイ ==="
echo "core:   $CORE_DIR"
echo "public: $PUBLIC_DIR"
echo "push:   $PUSH / sync-only: $SYNC_ONLY / dry-run: $DRY_RUN"
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
fi

# ── 2. 公開リポジトリへ同期 ──────────────────────────────────────
echo ""
echo "▶ 公開リポジトリへ同期中..."

PREFS="hokkaido aomori iwate miyagi akita yamagata fukushima ibaraki tochigi gunma \
       saitama chiba tokyo kanagawa niigata toyama ishikawa fukui yamanashi nagano \
       gifu shizuoka aichi mie shiga kyoto osaka hyogo nara wakayama tottori shimane \
       okayama hiroshima yamaguchi tokushima kagawa ehime kochi fukuoka saga nagasaki \
       kumamoto oita miyazaki kagoshima okinawa"

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
  cp "$CORE_DIR/index.html"     "$PUBLIC_DIR/"
  cp "$CORE_DIR/js/selector.js" "$PUBLIC_DIR/js/"
  cp "$CORE_DIR/js/engine.js"   "$PUBLIC_DIR/js/"
  cp "$CORE_DIR/sitemap.xml"    "$PUBLIC_DIR/"
  cp "$CORE_DIR/robots.txt"     "$PUBLIC_DIR/"

  echo "✅ 同期完了"
else
  echo "（dry-run: 実際のコピーはスキップ）"
fi

# ── 3. 件数検証 ──────────────────────────────────────────────────
CORE_JSON=$(find "$CORE_DIR/data/municipalities" -name "kokuho-2025.json" | wc -l | tr -d ' ')
PUBLIC_JSON=$(find "$PUBLIC_DIR/data/municipalities" -name "kokuho-2025.json" | wc -l | tr -d ' ')
CORE_HTML=$(find "$CORE_DIR" -name "index.html" -not -path "*/\.*" -not -path "*/dashboard/*" | grep -v "^$CORE_DIR/index.html" | wc -l | tr -d ' ')
PUBLIC_HTML=$(find "$PUBLIC_DIR" -name "index.html" -not -path "*/\.*" | grep -v "^$PUBLIC_DIR/index.html" | wc -l | tr -d ' ')

echo ""
echo "▶ 件数検証:"
echo "  JSON  core=$CORE_JSON  public=$PUBLIC_JSON  $([ "$CORE_JSON" = "$PUBLIC_JSON" ] && echo '✅ 一致' || echo '⚠️  不一致')"
echo "  HTML  core=$CORE_HTML  public=$PUBLIC_HTML  $([ "$CORE_HTML" = "$PUBLIC_HTML" ] && echo '✅ 一致' || echo '⚠️  不一致')"

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
  echo ""
  echo "▶ wrangler deploy"
  cd "$CORE_DIR/workers/api"
  npx wrangler deploy 2>&1 | tail -5
  echo "✅ Worker デプロイ完了"
fi

echo ""
echo "=== デプロイ完了 ==="
