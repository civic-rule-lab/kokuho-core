#!/bin/zsh
# kokuho-core: 高専本科1〜3年の貸与ロジック同期PR。
# 使い方: kokuho-core のルートで  bash PR_kosen13_20260720.sh
# 前提: gh CLI 認証済み・main は保護ブランチ（PR必須）。git 操作は本端末で実行（ブリッジは .git 書込不可）。
set -e
cd "$(dirname "$0")"
[ -f .git/index.lock ] && rm -f .git/index.lock

BR="feat/shogakukin-kosen13"

echo "=== 0. 現在地・変更5ファイルの存在確認 ==="
git rev-parse --abbrev-ref HEAD
for f in js/core/shogakukin-loan.js js/core/shogakukin-2026.json js/core/shogakukin-bridge.js \
         scripts/verify-loan-oracle.cjs scripts/verify-loan-primary.cjs; do
  [ -f "$f" ] || { echo "!! $f が見つかりません"; exit 1; }
done

echo "=== 1. 変更4テスト（CI相当）を先に緑確認 ==="
for t in test-shogakukin test-bridge verify-loan-primary verify-loan-oracle; do
  echo "--- $t ---"; node "scripts/$t.cjs" | tail -1
done
# 期待: 61 / 21 / 188 / 153（全て 0 fail）

echo "=== 2. ブランチ作成（main から） ==="
git switch -c "$BR" 2>/dev/null || git switch "$BR"

echo "=== 3. 対象5ファイルだけをステージ（untracked『 2』複製を巻き込まない・pathspec厳密） ==="
git add -- \
  js/core/shogakukin-loan.js \
  js/core/shogakukin-2026.json \
  js/core/shogakukin-bridge.js \
  scripts/verify-loan-oracle.cjs \
  scripts/verify-loan-primary.cjs
echo "--- ステージ内容 ---"; git status -s -- js/core scripts | grep -E '^[AM]'

echo "=== 4. コミット ==="
MSG="$(mktemp)"
cat > "$MSG" <<'MSGEOF'
feat(shogakukin-loan): 高専本科1〜3年の貸与ロジックを同期(第一種のみ)

draft側で実装・検証した高専1〜3年対応(引き継ぎREADME 23章)をエンジン正本へ反映。
UI(ui-shell.html)は本リポジトリ対象外のため含めない(UI正本はdraft)。

- shogakukin-loan.js: _isKosen13()追加。高専1〜3年は第一種のみ=第二種/併用/
  入学時特別増額は unavailable:'kosen13'(本科4年生から[確認済 冊子p6/p8])、
  給付併給調整スキップ、最高月額の家計制限なし
  (thresholds.kosen13.maxMonthlyUnrestricted・p6表の学年限定表現)、
  type1.monthlyOptions45(4年進級後の選択肢・進級後最高月額は併用基準以下のみ)
- shogakukin-2026.json: loan.thresholds.kosen13 追加(出典_desc付き)
- shogakukin-bridge.js: calcLoanFromIncome が kosen13 では給付を計算せず grant:null
- verify-loan-oracle.cjs: kosen13境界・制度対象外・進級後選択肢・併給スキップ +8(145->153)
- verify-loan-primary.cjs: kosen13フラグの一次照合 +1(187->188)
- 給付コア(shogakukin.js)・jumin.js・shared/income.js は無改変(バイト一致で確認)
- CI4本緑: test-shogakukin 61 / test-bridge 21 / verify-loan-primary 188 / verify-loan-oracle 153

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01V6Pj4sNejNagR1w8Brdtm9
MSGEOF
git commit -F "$MSG"
rm -f "$MSG"

echo "=== 5. push & PR 作成 ==="
git push -u origin "$BR"
gh pr create --base main --head "$BR" \
  --title "feat(shogakukin-loan): 高専本科1〜3年の貸与ロジックを同期(第一種のみ)" \
  --body "$(cat <<'PREOF'
## 概要
draft側で実装・検証した**高専本科1〜3年**対応（引き継ぎREADME 23章・設計は `claude/高専1-3年UI入口設計_2026-07-20.md`）をエンジン正本へ同期する。高専1〜3年は**第一種（無利子）のみ**が対象で、給付・第二種・併用・入学時特別増額は本科4年生からである点を一次資料（2026年度 高専用 貸与奨学金案内 p6/p8/p12・目視）で確認済み。

## 変更（engine 3 + tests 2 の計5ファイル）
- `js/core/shogakukin-loan.js`: `_isKosen13()` 追加。第二種/併用/入学時特別増額を `unavailable:'kosen13'`、給付併給調整スキップ、最高月額の家計制限なし（`thresholds.kosen13.maxMonthlyUnrestricted`）、4年進級後の選択肢 `type1.monthlyOptions45`
- `js/core/shogakukin-2026.json`: `loan.thresholds.kosen13`（出典 _desc 付き）
- `js/core/shogakukin-bridge.js`: `calcLoanFromIncome` が kosen13 では給付を計算せず `grant:null`
- `scripts/verify-loan-oracle.cjs`: +8（145→153）
- `scripts/verify-loan-primary.cjs`: +1（187→188）

## 一次資料の要点（すべて目視確認）
- 家計基準の閾値・式は大学等と同一（冊子p12）。**1〜3年生に最高月額の家計制限はない**（p6月額表で1〜3年生行は「月額の種類」欄が斜線＝区分なし・2018ikou注記も「本科4,5年生及び専攻科においては」と学年限定）。
- 第二種・併用・入学時特別増額は本科4年生から（p6種類表・p8(3)）。

## 退行ゼロの確認
- 給付コア `shogakukin.js`・`jumin.js`・`shared/income.js` は**無改変（バイト一致）**。
- エンジン3ファイルは反映前の kokuho-core とバイト一致を確認した上に kosen13 差分のみを適用。

## テスト（CI相当4本・全緑）
`test-shogakukin 61 / test-bridge 21 / verify-loan-primary 188 / verify-loan-oracle 153`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PREOF
)"

echo "=== DONE ==="
gh pr view --web 2>/dev/null || true
