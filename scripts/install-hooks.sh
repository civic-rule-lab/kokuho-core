#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# git hooks の設定スクリプト（clone ごとに1回・何度実行してもよい）
#
# scripts/git-hooks/ を唯一の正本とし、git に直接使わせる（core.hooksPath）。
# .git/hooks/ へのコピーはしない（旧方式はコピーが正本とずれ、再実行で
# 設置済みのガードを上書きして消す欠陥があった）。
#
# 行うこと:
#   1. core.hooksPath を本体チェックアウトの scripts/git-hooks（絶対パス）に設定
#      （worktree も共有する。相対パスだと各 worktree の古いブランチ版が使われる）
#   2. 内部文書ガードの場所を civic.guard に設定（VCS 外。公開リポに場所を書かない）
#   3. 実際に止まるかを確かめる（一時インデックスに禁止文字列を入れて pre-commit を実行
#      → 拒否されれば合格。コミットも作業ツリーの変更もしない）
#
# 実行: bash scripts/install-hooks.sh
#       ガードが既定の場所に無い場合: CIVIC_GUARD=/path/to/repo-guard.sh bash scripts/install-hooks.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

COMMON="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || { echo "❌ git リポジトリ内で実行してください"; exit 1; }
MAIN_ROOT="$(dirname "$COMMON")"
HOOKS="$MAIN_ROOT/scripts/git-hooks"
[ -d "$HOOKS" ] || { echo "❌ $HOOKS が存在しません"; exit 1; }
chmod +x "$HOOKS"/*

GUARD="${CIVIC_GUARD:-$HOME/Desktop/_governance/tools/repo-guard.sh}"
[ -x "$GUARD" ] || { echo "❌ 内部文書ガードが見つかりません: $GUARD（CIVIC_GUARD で指定）"; exit 1; }

git config core.hooksPath "$HOOKS"
git config civic.guard "$GUARD"
echo "✅ core.hooksPath = $(git config --get core.hooksPath)"
echo "✅ civic.guard     = $(git config --get civic.guard)"

# 旧方式の .git/hooks/ のコピーは core.hooksPath 設定後は使われない。消さずに名前を変えて残す。
for h in pre-commit pre-push; do
  if [ -f "$COMMON/hooks/$h" ]; then
    mv "$COMMON/hooks/$h" "$COMMON/hooks/$h.unused-$(date +%Y%m%d)"
    echo "ℹ️  旧コピー $COMMON/hooks/$h → $h.unused-$(date +%Y%m%d)（使われない）"
  fi
done

# ─── 動作確認: 禁止文字列を一時インデックスに入れて pre-commit が拒否するか ───
TMPIDX="$(mktemp)"; trap 'rm -f "$TMPIDX"' EXIT
cp "$COMMON/index" "$TMPIDX" 2>/dev/null || GIT_INDEX_FILE="$TMPIDX" git read-tree HEAD
# 文字列はこのファイル自体が検査に掛からないよう実行時に組み立てる
PROBE="$(printf '%s %s %s' '-----BEGIN' 'OPENSSH PRIVATE' 'KEY-----')"
BLOB="$(printf '%s\n' "$PROBE" | git hash-object -w --stdin)"
GIT_INDEX_FILE="$TMPIDX" git update-index --add --cacheinfo 100644 "$BLOB" "hook-selftest-probe.txt"
if GIT_INDEX_FILE="$TMPIDX" "$HOOKS/pre-commit" >/dev/null 2>&1; then
  echo "❌ 動作確認に失敗: 秘密鍵の見出しを含むファイルを pre-commit が通した。設定を見直すこと"
  exit 1
fi
echo "✅ 動作確認: 秘密鍵の見出しを含む差分を pre-commit が拒否した"
echo ""
echo "完了。git は $HOOKS のフックを直接使います（.git/hooks へのコピー不要）"
