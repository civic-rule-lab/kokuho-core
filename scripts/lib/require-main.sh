#!/bin/bash
# require-main.sh — deploy を「merge 済みの main そのもの」からしか実行させない判定（deploy.sh・deploy-seido.sh が source する）
#
# なぜ: 作業フォルダはオーナーと AI が共用しており、feature ブランチのまま deploy すると
#       未レビュー・未 merge のデータが本番に出る。2026-09-29〜30 にはターミナルで直前のコマンドが
#       勝手に再実行される現象が5回起きた（TASKS X169-13）。
#
# 判定（どれか1つでも外れたら止める・生成や同期の前に呼ぶ）:
#   1. 今のブランチが main
#   2. 手元の main が origin/main と同一（直前に fetch。古い main での deploy＝本番の巻き戻しも防ぐ）
#   3. 追跡ファイルに未コミットの変更が無い
# --dry-run（本番に出さない）のときだけ、警告を出して通す。--force では外せない。
#
# 使い方: CORE_DIR と DRY_RUN を設定してから
#   source "$CORE_DIR/scripts/lib/require-main.sh"
#   require_main_for_deploy || exit 1
#
# 再確認（2026-10-20 追加・2026-10-18 事故の再発防止②）:
#   冒頭の確認から同期・コミットまでは生成に数分かかる。その間に同じフォルダでブランチ切替や
#   ファイル書換が起きると、未 merge の値が本番に出る（2026-10-18 13:46 seido-keisan で約 8 分露出）。
#   同期の直前とコミットの直前に require_main_recheck "<段階名>" を呼び、
#   「ブランチが main のまま／HEAD が最初の確認時と同じ／追跡ファイルに未コミットの変更なし」を
#   もう一度確かめる。外れていたら止める（fail-closed）。--dry-run のときだけ警告して通す。
#   deploy.sh は同期前に運用ログを main へ自動コミットするので、その直後に REQUIRE_MAIN_HEAD を
#   取り直してから再確認する（基準の更新はその 1 箇所だけ）。
#   require_main_recheck "同期直前" || exit 1

require_main_for_deploy() {
  local br head remote dirty reason=""
  br="$(git -C "$CORE_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  if [ "$br" != "main" ]; then
    reason="今のブランチが main ではありません（${br}）"
  elif ! git -C "$CORE_DIR" fetch -q origin main 2>/dev/null; then
    reason="origin/main を取得できません（ネットワーク等）。確かめられないため止めます"
  else
    head="$(git -C "$CORE_DIR" rev-parse HEAD)"
    remote="$(git -C "$CORE_DIR" rev-parse origin/main)"
    if [ "$head" != "$remote" ]; then
      reason="手元の main（${head:0:10}）が origin/main（${remote:0:10}）と違います。git pull してから実行してください"
    else
      dirty="$(git -C "$CORE_DIR" status --porcelain --untracked-files=no)"
      if [ -n "$dirty" ]; then
        reason="追跡ファイルに未コミットの変更があります（$(printf '%s\n' "$dirty" | wc -l | tr -d ' ') 件）"
      fi
    fi
  fi

  if [ -z "$reason" ]; then
    echo "✅ main 確認: origin/main と同一（${head:0:10}）・未コミット変更なし"
    REQUIRE_MAIN_HEAD="$head"   # 以後の再確認（require_main_recheck）の基準
    return 0
  fi
  if [ "${DRY_RUN:-false}" = true ]; then
    echo "⚠️  ${reason}（--dry-run のため続行。本番には出ません）"
    REQUIRE_MAIN_HEAD="$(git -C "$CORE_DIR" rev-parse HEAD 2>/dev/null || echo '')"
    return 0
  fi
  echo "❌ deploy を中止しました: ${reason}"
  echo "   deploy は merge 済みの main からだけ実行します（git switch main && git pull）"
  return 1
}

require_main_recheck() {
  local stage="${1:-再確認}" br head dirty reason=""
  br="$(git -C "$CORE_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  head="$(git -C "$CORE_DIR" rev-parse HEAD 2>/dev/null || echo '?')"
  if [ "$br" != "main" ]; then
    reason="ブランチが main から ${br} に変わっています"
  elif [ -n "${REQUIRE_MAIN_HEAD:-}" ] && [ "$head" != "$REQUIRE_MAIN_HEAD" ]; then
    reason="HEAD が最初の確認時（${REQUIRE_MAIN_HEAD:0:10}）から ${head:0:10} に変わっています"
  else
    dirty="$(git -C "$CORE_DIR" status --porcelain --untracked-files=no)"
    if [ -n "$dirty" ]; then
      reason="追跡ファイルに未コミットの変更があります（$(printf '%s\n' "$dirty" | wc -l | tr -d ' ') 件）"
    fi
  fi

  if [ -z "$reason" ]; then
    echo "✅ main 再確認（${stage}）: 変更なし（${head:0:10}）"
    return 0
  fi
  if [ "${DRY_RUN:-false}" = true ]; then
    echo "⚠️  main 再確認（${stage}）: ${reason}（--dry-run のため続行。本番には出ません）"
    return 0
  fi
  echo "❌ deploy を中止しました（${stage}の再確認）: ${reason}"
  echo "   冒頭の確認のあとで作業フォルダが変わりました。deploy 中は ${CORE_DIR} を触らないでください（ブランチ作業は git worktree で）。"
  echo "   公開リポの作業ツリーに同期済みの差分が残っていても未コミットで、本番には出ていません。main を整えて deploy をやり直せば上書きされます。"
  return 1
}
