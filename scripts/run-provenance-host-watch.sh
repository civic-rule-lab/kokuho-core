#!/bin/bash
# run-provenance-host-watch.sh
#
# launchd LaunchAgent から起動されるラッパースクリプト。
# 出典許可リスト（generate-official-pages.js の PROVENANCE_HOST_EXTRA）に個別登録した
# 独自ドメインが、まだその団体のものであり続けているかを定期確認する。
#
# なぜ要るか:
#   .lg.jp / .go.jp は自治体・国しか取得できないので放っておいてよい。しかし EXTRA に
#   足した独自ドメイン（.jp / .com / .net / .or.jp）は、自治体が手放せば第三者が取得でき、
#   公開ページの「出典」リンクがそこを指し続ける。2026-06 civic-exchange.com と
#   2026-07-28 civicrulelab.jp が同じ型で乗っ取られている。
#   許可リストに足すのは賭けなので、賭けたままにしない（規範14）。
#
# 頻度の目安:
#   自治体のドメイン変更は年に数回あるかどうかなので、毎日回す必要はない。月1回で足りる。
#   r8-watch (毎日 09:30) / change-detector (毎日 02:01) とは時間帯をずらすこと。
#
# 役割:
#   1. kokuho-core ディレクトリへ cd
#   2. node scripts/verify-provenance-hosts.js を実行
#   3. 終了コードを保存し、簡易サマリを stdout に出す（launchd のログに残る）
#
# 終了コード: 0=全件OK / 1=要確認あり / 2=設定上の異常（許可リストと registry の不一致など）
#
# 備考:
#   - レポート docs/change-reports/provenance-host-watch-YYYY-MM-DD.md は gitignore 済み
#   - 期待値は registry/provenance-host-watch.json（追跡対象）。許可リストの正本は
#     scripts/generate-official-pages.js 側であり、このスクリプトは複製しない

set -uo pipefail

REPO_ROOT="$HOME/Desktop/kokuho-core"
TODAY="$(date +%Y-%m-%d)"
START_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"

echo "─────────────────────────────────────────────────"
echo "[$START_TS] provenance-host-watch 起動"
echo "REPO_ROOT=$REPO_ROOT"

if [[ ! -d "$REPO_ROOT" ]]; then
    echo "ERROR: $REPO_ROOT が存在しません。" >&2
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

node scripts/verify-provenance-hosts.js
EXIT_CODE=$?

END_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "[$END_TS] provenance-host-watch 終了 (exit=$EXIT_CODE)"

REPORT="docs/change-reports/provenance-host-watch-${TODAY}.md"
if [[ -f "$REPORT" ]]; then
    echo "✅ レポート生成: $REPORT"
    echo "--- レポート全文 ---"
    cat "$REPORT"
else
    echo "⚠ レポート未生成: $REPORT (exit=$EXIT_CODE のため失敗の可能性)"
fi

if [[ $EXIT_CODE -ne 0 ]]; then
    echo ""
    echo "★要対応: 実物を自分の目で開いて確認すること。"
    echo "  表記が変わっただけ            → registry/provenance-host-watch.json の expect を直す"
    echo "  既知の状態が変わった          → 同ファイルの known を見直す"
    echo "  団体のものでなくなっていた    → PROVENANCE_HOST_EXTRA から外し、"
    echo "                                  該当自治体データの sourceUrls を差し替える"
fi

exit $EXIT_CODE
