#!/bin/bash
# Civic Rule Lab — R8公表検知 (r8-watch) 日次化インストーラ（ダブルクリックで実行）
# - launchd エージェントを登録し、毎日 03:30（Mac ローカル時刻 = JST）に
#   scripts/run-r8-watch.sh を実行する
# - change-detector (02:01) と時間をずらしてある
# - 実行直後に一度走らせて当日レポートを確認する
set -e

CORE_DIR="$HOME/Desktop/kokuho-core"
LABEL="com.civicrulelab.r8-watch"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

echo "▶ r8-watch 日次実行（毎日 03:30）をセットアップします"

chmod +x "$CORE_DIR/scripts/run-r8-watch.sh" 2>/dev/null || true

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>$CORE_DIR/scripts/run-r8-watch.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>3</integer>
    <key>Minute</key><integer>30</integer>
  </dict>
  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>$CORE_DIR/dashboard/r8-watch-launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$CORE_DIR/dashboard/r8-watch-launchd.err.log</string>
</dict>
</plist>
PLISTEOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "✅ launchd 登録完了: $LABEL（毎日 03:30）"
echo "▶ 初回チェックを実行します…"
/bin/zsh "$CORE_DIR/scripts/run-r8-watch.sh" || true
echo "✅ 完了。レポートは docs/change-reports/r8-watch-$(date +%Y-%m-%d).md を参照。"
echo "   （このウィンドウは閉じて構いません）"
