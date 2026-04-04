#!/bin/bash
# deploy.sh
# kokuho-core (private) で生成したファイルを kokuho-keisan (public) へ反映する
#
# 使い方:
#   bash scripts/deploy.sh
#   bash scripts/deploy.sh --push   # 自動で git push まで行う

set -e

CORE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$HOME/Desktop/kokuho-keisan"
PUSH=false
[[ "$1" == "--push" ]] && PUSH=true

echo "=== kokuho-core → kokuho-keisan デプロイ ==="
echo "core:   $CORE_DIR"
echo "public: $PUBLIC_DIR"
echo ""

# 1. 生成スクリプトを実行
echo "▶ generate-pref-kokuho.js (全県)"
node "$CORE_DIR/scripts/generate-pref-kokuho.js" --all

echo "▶ generate-official-pages.js"
node "$CORE_DIR/scripts/generate-official-pages.js"

echo "▶ generate-selector.js"
node "$CORE_DIR/scripts/generate-selector.js"

echo "▶ generate-sitemap.js"
node "$CORE_DIR/scripts/generate-sitemap.js"

# 2. 公開リポジトリへコピー
echo ""
echo "▶ 公開リポジトリへコピー中..."

# 都道府県HTML
PREFS="hokkaido aomori iwate miyagi akita yamagata fukushima ibaraki tochigi gunma \
       saitama chiba tokyo kanagawa niigata toyama ishikawa fukui yamanashi nagano \
       gifu shizuoka aichi mie shiga kyoto osaka hyogo nara wakayama tottori shimane \
       okayama hiroshima yamaguchi tokushima kagawa ehime kochi fukuoka saga nagasaki \
       kumamoto oita miyazaki kagoshima okinawa"

for p in $PREFS; do
  if [ -d "$CORE_DIR/$p" ]; then
    rm -rf "$PUBLIC_DIR/$p"
    cp -r "$CORE_DIR/$p" "$PUBLIC_DIR/"
  fi
done

# 静的ファイル
cp "$CORE_DIR/index.html"   "$PUBLIC_DIR/"
cp "$CORE_DIR/js/selector.js" "$PUBLIC_DIR/js/"
cp "$CORE_DIR/sitemap.xml"  "$PUBLIC_DIR/"
cp "$CORE_DIR/robots.txt"   "$PUBLIC_DIR/"

echo "✅ コピー完了"

# 3. 公開リポジトリにコミット
cd "$PUBLIC_DIR"
git add .
CHANGED=$(git diff --cached --stat | tail -1)
if [ -z "$(git diff --cached)" ]; then
  echo "変更なし。コミットをスキップします。"
else
  DATE=$(date +%Y-%m-%d)
  git commit -m "デプロイ: $DATE"
  echo "✅ コミット完了: $CHANGED"
fi

# 4. push（オプション）
if [ "$PUSH" = true ]; then
  git push
  echo "✅ kokuho-keisan push 完了"
  cd "$CORE_DIR"
  git push
  echo "✅ kokuho-core push 完了"
fi

echo ""
echo "=== デプロイ完了 ==="
