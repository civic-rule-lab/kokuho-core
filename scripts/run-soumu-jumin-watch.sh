#!/bin/bash
# run-soumu-jumin-watch.sh
#
# launchd LaunchAgent から起動されるラッパースクリプト。
# 住民税 市町村分の根拠資料（総務省・data/reference/soumu-jumin-city-rates-r7.json）の
# 新版公表・差し替えを検知する（scripts/watch-soumu-jumin-rates.js）。
#
# なぜ要るか:
#   参照資料は令和7年4月1日現在、データは令和8年度。新版が出たら差し替えて status 昇格を
#   判断すると決めたが、記録だけでは気づけない（規範14）。要対応のときは macOS 通知を出す。
#
# 頻度の目安:
#   総務省の更新は年1〜2回。週1回で足りる。
#   r8-watch (毎日 09:30) / change-detector (毎日 02:01) / provenance-host-watch とは時間帯をずらすこと。
#
# 終了コード: 0=変化なし / 1=要対応 / 2=判定不能（取得失敗など） / 3以上=起動失敗
#
# 備考:
#   - レポート docs/change-reports/soumu-jumin-watch-YYYY-MM-DD.md は gitignore 済み

set -uo pipefail

REPO_ROOT="${REPO_ROOT:-$HOME/Desktop/kokuho-core}"
TODAY="$(date +%Y-%m-%d)"
START_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"

echo "─────────────────────────────────────────────────"
echo "[$START_TS] soumu-jumin-watch 起動"
echo "REPO_ROOT=$REPO_ROOT"

if [[ ! -d "$REPO_ROOT" ]]; then
    echo "ERROR: $REPO_ROOT が存在しません。" >&2
    exit 3
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

node scripts/watch-soumu-jumin-rates.js
EXIT_CODE=$?

END_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "[$END_TS] soumu-jumin-watch 終了 (exit=$EXIT_CODE)"

REPORT="docs/change-reports/soumu-jumin-watch-${TODAY}.md"
if [[ -f "$REPORT" ]]; then
    echo "✅ レポート生成: $REPORT"
else
    echo "⚠ レポート未生成: $REPORT (exit=$EXIT_CODE のため失敗の可能性)"
fi

# 変化なし以外は通知して気づけるようにする（ログを見に行かないと分からない、を避ける）
if [[ $EXIT_CODE -ne 0 ]] && command -v osascript >/dev/null 2>&1; then
    case $EXIT_CODE in
        1) MSG="総務省の住民税税率資料に更新あり。$REPORT を確認" ;;
        2) MSG="総務省の住民税税率資料を取得できず判定不能。$REPORT を確認" ;;
        *) MSG="soumu-jumin-watch が異常終了 (exit=$EXIT_CODE)" ;;
    esac
    osascript -e "display notification \"$MSG\" with title \"kokuho-core 監視\"" || true
fi

exit $EXIT_CODE
