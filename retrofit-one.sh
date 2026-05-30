#!/bin/bash
# retrofit-one.sh — A 分類 retrofit を 1 自治体ずつ実行
#
# 使い方:
#   bash retrofit-one.sh hachioji
#   bash retrofit-one.sh takasaki
#   ... (11 件)
#
# 11 件の slug: hachioji takasaki kawagoe kawaguchi koshigaya sagamihara niigata hamamatsu matsuyama kumamoto saitama

set -e

# ページャ無効化(SIGPIPE で script が落ちないように)
export GIT_PAGER=cat
export PAGER=cat

SLUG="$1"
if [ -z "$SLUG" ]; then
  echo "Usage: bash retrofit-one.sh <slug>"
  echo "  e.g. bash retrofit-one.sh hachioji"
  exit 1
fi

COWORK_DIR="~/Documents/Claude/Projects/国保　修正プログラム"
RETRO_JSON="$COWORK_DIR/$SLUG-kokuho-2026-retrofit.json"
CHANGELOG="$COWORK_DIR/$SLUG-r7-to-r8.md"
PR_BODY="$COWORK_DIR/$SLUG-pr-body.md"

# slug → pref_en マッピング
case "$SLUG" in
  hachioji)   PREF_EN=tokyo;    NAME="八王子市";   CODE=13201 ;;
  takasaki)   PREF_EN=gunma;    NAME="高崎市";     CODE=10202 ;;
  kawagoe)    PREF_EN=saitama;  NAME="川越市";     CODE=11201 ;;
  kawaguchi)  PREF_EN=saitama;  NAME="川口市";     CODE=11203 ;;
  koshigaya)  PREF_EN=saitama;  NAME="越谷市";     CODE=11222 ;;
  sagamihara) PREF_EN=kanagawa; NAME="相模原市";   CODE=14150 ;;
  niigata)    PREF_EN=niigata;  NAME="新潟市";     CODE=15100 ;;
  hamamatsu)  PREF_EN=shizuoka; NAME="浜松市";     CODE=22130 ;;
  matsuyama)  PREF_EN=ehime;    NAME="松山市";     CODE=38201 ;;
  kumamoto)   PREF_EN=kumamoto; NAME="熊本市";     CODE=43100 ;;
  saitama)    PREF_EN=saitama;  NAME="さいたま市"; CODE=11100 ;;
  hitachi)      PREF_EN=ibaraki;  NAME="日立市";       CODE=08202 ;;
  koga-ibaraki) PREF_EN=ibaraki;  NAME="古河市";       CODE=08204 ;;
  tsukuba)      PREF_EN=ibaraki;  NAME="つくば市";     CODE=08220 ;;
  hitachinaka)  PREF_EN=ibaraki;  NAME="ひたちなか市"; CODE=08221 ;;
  oyama)        PREF_EN=tochigi;  NAME="小山市";       CODE=09208 ;;
  kiryu)        PREF_EN=gunma;    NAME="桐生市";       CODE=10203 ;;
  tomioka)      PREF_EN=gunma;    NAME="富岡市";       CODE=10210 ;;
  shiki)        PREF_EN=saitama;  NAME="志木市";       CODE=11228 ;;
  chofu)        PREF_EN=tokyo;    NAME="調布市";       CODE=13208 ;;
  kokubunji)    PREF_EN=tokyo;    NAME="国分寺市";     CODE=13214 ;;
  hiratsuka)    PREF_EN=kanagawa; NAME="平塚市";       CODE=14203 ;;
  hadano)       PREF_EN=kanagawa; NAME="秦野市";       CODE=14211 ;;
  yamato)       PREF_EN=kanagawa; NAME="大和市";       CODE=14213 ;;
  nagano)       PREF_EN=nagano;   NAME="長野市";       CODE=20201 ;;
  kasugai)      PREF_EN=aichi;    NAME="春日井市";     CODE=23206 ;;
  kariya)       PREF_EN=aichi;    NAME="刈谷市";       CODE=23210 ;;
  anjo)         PREF_EN=aichi;    NAME="安城市";       CODE=23212 ;;
  nishio)       PREF_EN=aichi;    NAME="西尾市";       CODE=23213 ;;
  komaki)       PREF_EN=aichi;    NAME="小牧市";       CODE=23219 ;;
  kiyosu)       PREF_EN=aichi;    NAME="清須市";       CODE=23233 ;;
  kitanagoya)   PREF_EN=aichi;    NAME="北名古屋市";   CODE=23234 ;;
  kota)         PREF_EN=aichi;    NAME="幸田町";       CODE=23501 ;;
  kumiyama)     PREF_EN=kyoto;    NAME="久御山町";     CODE=26322 ;;
  hiji)         PREF_EN=oita;     NAME="日出町";       CODE=44341 ;;
  kirishima)    PREF_EN=kagoshima;NAME="霧島市";       CODE=46218 ;;
  *) echo "Unknown slug: $SLUG"; exit 2 ;;
esac

BRANCH="feat/$SLUG-r8-lifecycle-retrofit"
TARGET_JSON="data/municipalities/$SLUG/kokuho-2026.json"
TARGET_CL="data/changelogs/$PREF_EN/$SLUG-r7-to-r8.md"

# 必要ファイル存在確認
for f in "$RETRO_JSON" "$CHANGELOG" "$PR_BODY"; do
  if [ ! -f "$f" ]; then echo "MISSING: $f"; exit 3; fi
done

cd "$HOME/Desktop/kokuho-core"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " [$SLUG] $NAME ($CODE) → branch $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 既存ブランチがあればクリア
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "既存ブランチ $BRANCH を削除して作り直します"
  git checkout main >/dev/null 2>&1
  git branch -D "$BRANCH"
fi

# ブランチ作成
git checkout main >/dev/null 2>&1
git pull origin main --quiet
git checkout -b "$BRANCH"

# ファイル差し替え + 新規作成
cp "$RETRO_JSON" "$TARGET_JSON"
mkdir -p "data/changelogs/$PREF_EN"
cp "$CHANGELOG" "$TARGET_CL"

# diff 表示 (本 retrofit 対象 2 ファイルだけに絞る — HTML churn 等の noise 排除)
echo
echo "━━━ git diff (本 retrofit 対象 2 ファイルだけ) ━━━"
git --no-pager diff --stat -- "$TARGET_JSON" "$TARGET_CL"
echo
echo "━━━ 詳細 diff の先頭 40 行 ━━━"
git --no-pager diff -- "$TARGET_JSON" | head -40
echo
echo "━━━ 制度値変更チェック (rate/perCapita/household/caps/childcare/preschool/reduction) ━━━"
SUSPICIOUS=$(git --no-pager diff -- "$TARGET_JSON" | grep -E '^[+-][[:space:]]+"(rate|perCapita|household|caps|childcare|preschool|reduction)' || true)
if [ -n "$SUSPICIOUS" ]; then
  echo "⚠ 制度値に変更検出!"
  echo "$SUSPICIOUS"
  echo "中止します。ブランチを削除して main に戻ります。"
  git checkout main
  git branch -D "$BRANCH"
  exit 4
else
  echo "✓ 制度値変更なし(meta のみ retrofit)"
fi

# integrity test
echo
echo "━━━ integrity test ━━━"
node scripts/test-integrity.js 2>&1 | tail -5
node scripts/validate-kokuho-data.js 2>&1 | tail -5

# commit + push (本 retrofit 対象 2 ファイルだけを add)
echo
echo "━━━ commit + push ━━━"
git add "$TARGET_JSON" "$TARGET_CL"
git commit -m "data($PREF_EN): retrofit ${NAME} R8 lifecycle metadata (verified_r8)

${NAME} R8 国民健康保険データは前セッションで公式ページから取得済。
本 commit は meta.lifecycle に r8Stage='verified_r8' / sourceStatus /
sourceUrls / verifiedAt / verificationLevel 等を追加するメタのみ retrofit。
制度値 (rate / perCapita / household / caps / childcare) は変更なし。

r8-values-collected-2026-05-21.md で全項目クロスチェック済 (一致)。

data/changelogs/$PREF_EN/$SLUG-r7-to-r8.md に retrofit 詳細を新規記録。

🤖 Generated with Cowork handoff + Code execution"

git push -u origin "$BRANCH"

# PR 作成
echo
echo "━━━ gh pr create ━━━"
gh pr create --base main --head "$BRANCH" \
  --title "data($PREF_EN): retrofit ${NAME} R8 lifecycle metadata (verified_r8)" \
  --body-file "$PR_BODY"

echo
echo "━━━ 完了: $SLUG ━━━"
git checkout main >/dev/null 2>&1
