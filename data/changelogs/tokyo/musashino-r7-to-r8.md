# 武蔵野市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.musashino.lg.jp/kurashi_tetsuzuki/kokuminkenkouhoken_kokuminnenkin/kokuminkenkohoken/1052169/1004710.html
- publishedAt: 2026-05-14（公式ページ「令和8年4月1日現在公布されている条例に基づく税率等」と明記、改訂日不明のため checkedAt 同日扱い）
- checkedAt: 2026-05-14

## changed fields

- medical.rate:      0.0562 → 0.0579
- medical.perCapita: 31,000 → 33,000
- medical.cap:       670,000 → 660,000（R8 国標準への合わせ込み）
- support.rate:      0.0195 → 0.0209
- support.perCapita: 11,300 → 12,500
- support.cap:       240,000 → 260,000
- care.rate:         0.0165 → 0.0184
- care.perCapita:    13,600 → 15,000
- care.cap:          170,000（据え置き）
- childcare:         { rate: 0, perCapita: 0, household: 0 }
                  → { rate: 0.003, perCapita: 1,900, household: 0 }
  - 家族全員に均等割 1,900 円が課される構造（under18Reduction なし）

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-14
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

R7 値はすべて template_r7 状態（registry 自動生成時の仮置き値）。今回 R8 公式ページで全項目を verified 化。
公式ページに「令和8年4月1日現在公布されている条例に基づく税率等」との明記があり、議案資料・改定案系ではなく確定資料に該当するため verified_r8 に昇格。
