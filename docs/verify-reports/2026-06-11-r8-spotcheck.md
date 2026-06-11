# R8実値検証レポート — 2026-06-11（10件スポットチェック）

**ソース:** docs/change-reports/2026-06-10.md の未処理 changed 項目から選定
**結果:** 10/10 件 **一致** — データ更新不要。ページ変更は更新日変更・レイアウト変更等で料率と無関係。

## 判定サマリ

| # | 市 | slug | 判定 | 確認URL | 備考 |
|---|---|---|---|---|---|
| 1 | 東京23区一律 | nerima 代表 | 一致 | [大田区](https://www.city.ota.tokyo.jp/seikatsu/kokunen/kokuho/hokenryou/keisan.html)・[新宿区](https://www.city.shinjuku.lg.jp/hoken/hoken01_001028.html) | 練馬URLはフェッチキャッシュが古くR6版しか取れず。23区統一料率のため大田・新宿のR8公式ページ（2026-04-01更新）で突合し全項目一致。練馬ページ本文の目視1回推奨 |
| 2 | 我孫子市 | abiko | 一致 | [改正告知](https://www.city.abiko.chiba.jp/kurashi/kokuho/kokuho_info/abk10003001020.html)・[軽減](https://www.city.abiko.chiba.jp/kurashi/kokuho/sanshutsu_noufu/gengakusochi.html) | R7→R8対比表で全区分一致。子育て分18歳以上100円も一致 |
| 3 | 府中市（東京） | fuchu | 一致 | [R8税率見直し](https://www.city.fuchu.tokyo.jp/kurashi/hoken/kokuminkenko/hokenze/zeiritutounominaoshi290401.html) | 指定URLはキャッシュ古（R5）。同市の見直しページ（2026-04-09更新）で市告示値を確認、全項目一致。医療限度額66万（国基準67万不採用）も一致。R10改定予告あり（所得割計10.67%/均等割計60,600円） |
| 4 | 枚方市 | hirakata | 一致 | [R8保険料](https://www.city.hirakata.osaka.jp/0000037140.html) | 大阪府統一料率。子ども分1,745+96=1,841円の2段構造も整合 |
| 5 | 日立市 | hitachi | 一致 | [保険料率](https://www.city.hitachi.lg.jp/kurashi_tetsuzuki/kokuho_nenkin/1001939/1001957/1001958.html) | 全項目一致。JSON notesの「支援分上限R7 24万→26万引上げ」は公式の「R7と同額」と食い違い（実値260,000は一致、メモのみ要修正候補） |
| 6 | 柏市 | kashiwa | 一致 | [R8改定](https://www.city.kashiwa.lg.jp/hokennenkin/kaitei/r8kaitei.html)・[算定](https://www.city.kashiwa.lg.jp/hokennenkin/hokennenkin/kokuho/hokenryo/hokenryosante.html) | 県標準料率と別掲の市独自料率で確認。18歳以上均等割84円（perCapitaAdult）も一致 |
| 7 | 川口市 | kawaguchi | 一致 | [課税方式・税率](https://www.city.kawaguchi.lg.jp/soshiki/01090/030/kokuminkenkouhokenzei/3336.html)・[R8改正](https://www.city.kawaguchi.lg.jp/soshiki/01090/030/kokuminkenkouhokenzei/50549.html) | 2方式・保険税。改定表本体は画像だがテキスト記載の限度額と数値表で確認 |
| 8 | 越谷市 | koshigaya | 一致 | [R8税率改定](https://www.city.koshigaya.saitama.jp/kurashi_shisei/fukushi/kokuho/kokuhokanyudattai/r8zeiritsuhenko.html) | ページ更新日2026-06-10だが値は同一。18歳以上均等割151円はnotesに記載済みで整合 |
| 9 | 松山市 | matsuyama | 一致 | [R8国保料](https://www.city.matsuyama.ehime.jp/kurashi/tetsuzuki/kokuho/kokuhoryokinn/r8kokuhoryou.html) | 4方式全区分＋軽減基準（5割+31万/2割+57万）一致 |
| 10 | 相模原市 | sagamihara | 一致 | [R8税率等](https://www.city.sagamihara.kanagawa.jp/kurashi/1026448/kokuho/1007820/1007822.html) | 全項目一致。公式注記の「18歳以上均等割60円」はJSON未収録（notes追記候補） |

## 乖離項目

なし（10/10一致）。

## フォローアップ候補（データ修正ではなくメモ/スキーマ）

1. **hitachi**: meta.notes の「支援分上限引上げ」記述が公式と食い違い → notes修正候補
2. **sagamihara**: 子育て分「18歳以上均等割60円」未収録 → notes追記候補
3. **横断**: 「18歳以上均等割」（柏84円・越谷151円・相模原60円・我孫子/府中100円）の扱いが市によりperCapitaAdult収録/notesのみ/未収録と不統一 → スキーマ整理候補
4. **nerima/fuchu**: 監視対象URLがフェッチで古いキャッシュを返す → change-detectorの誤検知/見逃し要因になり得る。目視1回＋baseline更新推奨

## 未処理のまま残した項目

ユーザー確認前のため、change-report のチェックボックスは未更新（全件一致のため、上記10件は確認後に - [x] 化してよい）。対象 changed 項目: 23区関連約20件（共通URL1本）＋ abiko×2, fuchu, hirakata, hitachi, kashiwa×2, kawaguchi×2, koshigaya, matsuyama, sagamihara。

残りの未処理 changed: hitachinaka, ichikawa×2, kariya, kasugai, kumiyama, kunitachi, matsudo×2, mitaka, musashino, nagano, nishinomiya, nishio, nishitokyo, ome, sakai, shiki, takamatsu, takatsuki ＋ 取得失敗7件（higashimurayama, hiroshima, hyuga, sano, shika, utsunomiya, yura）

生成: scheduled task kokuho-r8-daily-verify / 2026-06-11
