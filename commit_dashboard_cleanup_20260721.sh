#!/bin/zsh
# kokuho-core: 未コミットのダッシュボード改修(.gitignore + scripts/dashboard.js)を片付けるPR。
# これらは PR #372 とは無関係の、作業ツリーに残っていた既存の未コミット変更(2026-07-18頃のダッシュボード改訂)。
# 内容は検証済み（外部通信/トークン/eval/base64なし・node --check OK・7/18改訂に整合）。
# 使い方: kokuho-core のルートで  bash commit_dashboard_cleanup_20260721.sh
# 前提: main は保護ブランチ（PR必須）・gh CLI 認証済み・git 操作は本端末で実行。
set -e
cd "$(dirname "$0")"
[ -f .git/index.lock ] && rm -f .git/index.lock

BR="chore/dashboard-metric-refresh"

echo "=== 0. 対象2ファイルが変更済みか確認 ==="
git status -s -- .gitignore scripts/dashboard.js | grep -E '^ ?M' || { echo "!! 変更が見当たりません（既にコミット済み？）"; exit 1; }

echo "=== 1. 構文チェック ==="
node --check scripts/dashboard.js && echo "  OK: dashboard.js 構文OK"

echo "=== 2. ブランチ作成（main から。未コミット変更は持ち越される）==="
git switch -c "$BR" 2>/dev/null || git switch "$BR"

echo "=== 3. 対象2ファイルだけをステージ（pathspec厳密・『 2』複製は巻き込まない）==="
git add -- .gitignore scripts/dashboard.js
git status -s -- .gitignore scripts/dashboard.js | grep -E '^[AM]'

echo "=== 4. コミット ==="
MSG="$(mktemp)"
cat > "$MSG" <<'MSGEOF'
chore(dashboard): 進捗metricを実データ5制度ベースへ改訂＋整頓チェックのignore

作業ツリーに未コミットで残っていたダッシュボード改修(2026-07-18頃)を確定。
機能変更は scripts/dashboard.js のみ、.gitignore はローカル状態ファイルの除外。

- scripts/dashboard.js: 進捗metricの分母を「実データのある5制度(国保・介護・住民税・
  後期高齢・保育料)×全自治体」に変更。児童手当・第6制度のダミー枠を廃止し、
  ロードマップ/サイト監視/週次整頓/リポジトリ状態の各パネルを整理。
- .gitignore: dashboard/tidy-report.json(週次整頓チェックのローカル結果)を除外。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01V6Pj4sNejNagR1w8Brdtm9
MSGEOF
git commit -F "$MSG"
rm -f "$MSG"

echo "=== 5. push & PR 作成 ==="
git push -u origin "$BR"
gh pr create --base main --head "$BR" \
  --title "chore(dashboard): 進捗metricを実データ5制度ベースへ改訂＋整頓チェックのignore" \
  --body "$(cat <<'PREOF'
## 概要
作業ツリーに未コミットのまま残っていた**ダッシュボードの改修（2026-07-18頃）**を確定するハウスキーピングPR。PR #372（奨学金・高専1〜3年）とは無関係の既存変更で、main への fast-forward 時に持ち越されていたもの。

## 変更（2ファイル）
- `scripts/dashboard.js`: 進捗metricの分母を「実データのある5制度（国保・介護・住民税・後期高齢・保育料）×全自治体」に変更。ダミー枠（児童手当・第6制度）を廃止し、サイト監視 / 週次整頓 / ロードマップ / リポジトリ状態の各パネルを整理。
- `.gitignore`: `dashboard/tidy-report.json`（週次整頓チェックのローカル結果）を除外に追加。

## 検証
- `node --check scripts/dashboard.js` OK。
- 追加行に外部通信・トークン・eval・base64 等なし（git 状態表示の `execsync rev-parse` のみ・読み取り専用）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PREOF
)"

echo "=== DONE ==="
gh pr view --web 2>/dev/null || true
