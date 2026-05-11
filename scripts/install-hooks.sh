#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# git hooks インストールスクリプト
#
# scripts/git-hooks/ のマスタ版を .git/hooks/ にコピーし、
# 実行権限を付与する。
#
# 実行: bash scripts/install-hooks.sh
# ─────────────────────────────────────────────────────────────────
set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "❌ git リポジトリ内で実行してください"
  exit 1
fi

cd "$REPO_ROOT"

SRC_DIR="scripts/git-hooks"
DST_DIR=".git/hooks"

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ $SRC_DIR が存在しません"
  exit 1
fi

installed=0
for hook in "$SRC_DIR"/*; do
  name="$(basename "$hook")"
  dst="$DST_DIR/$name"
  cp "$hook" "$dst"
  chmod +x "$dst"
  echo "✅ インストール: $name"
  installed=$((installed + 1))
done

echo ""
echo "完了: $installed 個の hook をインストールしました"
echo ""
echo "確認:"
echo "  ls -la .git/hooks/ | grep -v sample"
