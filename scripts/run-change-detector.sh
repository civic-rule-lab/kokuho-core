#!/bin/bash
# run-change-detector.sh
#
# launchd LaunchAgent (com.user.kokuho-change-detector) から起動される
# ラッパースクリプト。
#
# 役割:
#   1. kokuho-core ディレクトリへ cd
#   2. node scripts/change-detector.js を実行
#   3. 終了コードを保存し、簡易サマリを stdout に出す (launchd のログに残る)
#
# 配置先:
#   ~/Desktop/kokuho-core/scripts/run-change-detector.sh
#
# 権限:
#   chmod +x ~/Desktop/kokuho-core/scripts/run-change-detector.sh

set -uo pipefail

REPO_ROOT="$HOME/Desktop/kokuho-core"
LOG_DIR="$HOME/Library/Logs"
TODAY="$(date +%Y-%m-%d)"
START_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"

echo "─────────────────────────────────────────────────"
echo "[$START_TS] kokuho-change-detector 起動"
echo "REPO_ROOT=$REPO_ROOT"
echo "PATH=$PATH"
echo "node: $(command -v node 2>/dev/null || echo 'NOT FOUND')"
echo "node version: $(node --version 2>/dev/null || echo 'NOT AVAILABLE')"

# kokuho-core が存在することを確認
if [[ ! -d "$REPO_ROOT" ]]; then
    echo "ERROR: $REPO_ROOT が存在しません。launchd 経由でも到達不能の可能性。" >&2
    exit 2
fi

cd "$REPO_ROOT" || {
    echo "ERROR: cd $REPO_ROOT に失敗" >&2
    exit 3
}

# node が PATH に無い場合のフォールバック (brew Apple Silicon / Intel)
if ! command -v node >/dev/null 2>&1; then
    for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
        if [[ -x "$candidate" ]]; then
            export PATH="$(dirname "$candidate"):$PATH"
            echo "fallback PATH 追加: $(dirname "$candidate")"
            break
        fi
    done
fi

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: node が見つかりません。plist の PATH または本スクリプトを修正してください。" >&2
    exit 4
fi

# 本番実行
node scripts/change-detector.js
EXIT_CODE=$?

END_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "[$END_TS] change-detector 終了 (exit=$EXIT_CODE)"

# 当日レポートが生成されたか確認
REPORT="docs/change-reports/${TODAY}.md"
if [[ -f "$REPORT" ]]; then
    echo "✅ レポート生成: $REPORT"
    # 最初の 20 行だけサマリ出力 (詳細はファイル本体を参照)
    echo "--- レポート抜粋 (先頭 20 行) ---"
    head -20 "$REPORT"
    echo "--- (以下省略) ---"
else
    echo "⚠ レポート未生成: $REPORT (exit=$EXIT_CODE のため失敗の可能性)"
fi

exit $EXIT_CODE
