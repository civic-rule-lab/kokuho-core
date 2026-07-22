#!/bin/bash
# Civic Rule Lab — 週次整頓チェック実行（launchd 用）
# weekly-tidy.js → tidy-report.json 生成 → ダッシュボード即時再生成

CORE_DIR="$HOME/Desktop/kokuho-core"
LOG="$CORE_DIR/dashboard/tidy.log"

find_node() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
  fi
  if command -v node >/dev/null 2>&1; then command -v node; return; fi
  for p in \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    "$HOME/.nvm/versions/node"/*/bin/node \
    /usr/bin/node ; do
    [ -x "$p" ] && { echo "$p"; return; }
  done
}

NODE="$(find_node)"

{
  echo "── $(date '+%Y-%m-%d %H:%M:%S') run-weekly-tidy.sh 実行 ──"
  if [ -z "$NODE" ]; then
    echo "ERROR: node が見つかりません。"
    exit 1
  fi
  "$NODE" "$CORE_DIR/scripts/weekly-tidy.js" || echo "ERROR: 整頓チェック失敗"
  # 結果をすぐダッシュボードへ反映
  /bin/bash "$CORE_DIR/scripts/refresh-dashboard.sh"
} >> "$LOG" 2>&1
