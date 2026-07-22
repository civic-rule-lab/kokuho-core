#!/bin/zsh
# kokuho-core: ひとり親控除の金額テストを test-bridge.cjs へ追加するPR（README §7 フォローアップ）。
# 変更は scripts/test-bridge.cjs のみ（テスト追加・本体無改変）。
# 使い方: kokuho-core のルートで  bash PR_test_bridge_hitorioya_20260721.sh
# 前提: main は保護ブランチ（PR必須）・gh 認証済み・git 操作は本端末で実行。
set -e
cd "$(dirname "$0")"
[ -f .git/index.lock ] && rm -f .git/index.lock

BR="test/test-bridge-hitorioya"

echo "=== 0. main を最新化してからブランチを切る ==="
git switch main
git pull --ff-only
git switch -c "$BR" 2>/dev/null || git switch "$BR"

echo "=== 1. test-bridge.cjs の変更が乗っているか & 緑確認 ==="
git status -s -- scripts/test-bridge.cjs | grep -E '^ ?M|^M' || { echo "!! scripts/test-bridge.cjs に変更がありません"; exit 1; }
node scripts/test-bridge.cjs | tail -1   # 期待: 33 passed / 0 failed

echo "=== 2. 対象1ファイルだけステージ ==="
git add -- scripts/test-bridge.cjs
git status -s -- scripts/test-bridge.cjs | grep -E '^[AM]'

echo "=== 3. コミット ==="
MSG="$(mktemp)"
cat > "$MSG" <<'MSGEOF'
test(bridge): ひとり親控除の金額正当性テストを追加(結線のみ→金額照合)

kokuho-core は従来ひとり親控除を結線チェックのみで金額未検証だった(PR #364
で予告のフォローアップ)。draft verify-kijun の期待値を income 経路で再現し固定。

- supporter内訳: ひとり親控除30万で課税標準が下がる(565,000 vs 865,000)、
  人的控除差が母10万/父6万/無し5万に分岐(基礎5万+ひとり親 母5万/父1万)
- 合計所得135万以下→所得割非課税(母 給与200万→基準額0・第Ⅰ / OFFなら第Ⅲ33,900)
- 課税域(給与250万)で母5万/父1万差が基準額に出る(母30,900 / 父32,100 / 無し50,400)
- test-bridge.cjs 21→33 passed。本体(bridge/jumin/core)は無改変。

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01V6Pj4sNejNagR1w8Brdtm9
MSGEOF
git commit -F "$MSG"
rm -f "$MSG"

echo "=== 4. push & PR ==="
git push -u origin "$BR"
gh pr create --base main --head "$BR" \
  --title "test(bridge): ひとり親控除の金額正当性テストを追加" \
  --body "$(cat <<'PREOF'
## 概要
kokuho-core は従来、ひとり親控除を**結線チェックのみ**で金額未検証だった（PR #364 本文で予告したフォローアップ・引き継ぎREADME §7）。draft `verify-kijun` の期待値を income 経路で再現して `scripts/test-bridge.cjs` に固定する。**本体（bridge/jumin/core）は無改変**、テスト追加のみ。

## 追加内容（test-bridge.cjs 21→33 passed）
- **supporter内訳**: ひとり親控除30万で課税標準が下がる（565,000 vs 865,000）。人的控除差が母10万/父6万/無し5万に分岐（基礎5万＋ひとり親 母5万/父1万）。
- **135万非課税**: 合計所得135万以下は所得割非課税（母 給与200万→合計所得132万→基準額0・第Ⅰ／ひとり親OFFなら第Ⅲ・33,900）。
- **母5万/父1万差**: 課税域（給与250万）で調整控除の差が基準額に出る（母30,900／父32,100／無し50,400。差1,200円＝4万×3%）。

## 出典
住民税30万・母5万/父1万＝[確認済 姫路市・諏訪市]、135万非課税＝[確認済 大阪市 地方税法295条相当]（いずれも2026-07-12確認）。

## テスト
`test-shogakukin 61 / test-bridge 33 / verify-loan-primary 188 / verify-loan-oracle 153`（CI相当4本緑）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PREOF
)"
echo "=== DONE ==="
gh pr view --web 2>/dev/null || true
