#!/bin/bash
# Civic Rule Lab — 週次整頓チェック インストーラ（ダブルクリックで実行）
# - launchd エージェントを登録し、毎週金曜 17:50（Mac ローカル時刻 = JST）に
#   scripts/run-weekly-tidy.sh を実行する
# - 旧クラウドトリガー「Session closing tidy reminder」（金18:00）の置き換え
# - 実行直後に一度チェックを走らせてダッシュボードに反映する
set -e

CORE_DIR="$HOME/Desktop/kokuho-core"
LABEL="com.civicrulelab.weekly-tidy"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

echo "▶ 週次整頓チェック（金曜 17:50）をセットアップします"

chmod +x "$CORE_DIR/scripts/run-weekly-tidy.sh" 2>/dev/null || true

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
    <string>/bin/bash</string>
    <string>$CORE_DIR/scripts/run-weekly-tidy.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key><integer>5</integer>
    <key>Hour</key><integer>17</integer>
    <key>Minute</key><integer>50</integer>
  </dict>
  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>$CORE_DIR/dashboard/tidy-launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$CORE_DIR/dashboard/tidy-launchd.err.log</string>
</dict>
</plist>
PLISTEOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "✅ launchd 登録完了: $LABEL（毎週金曜 17:50）"
echo "▶ 初回チェックを実行します…"
/bin/bash "$CORE_DIR/scripts/run-weekly-tidy.sh"
echo "✅ 完了。ダッシュボードの「週次整頓チェック」パネルに結果が表示されます。"
echo "   （このウィンドウは閉じて構いません）"
