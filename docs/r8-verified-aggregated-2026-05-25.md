# R8 verified 自治体 料率集約 — 2026-05-25

**生成元:** `kokuho-core/data/municipalities/<slug>/kokuho-2026.json`
**抽出条件:** `meta.status` が `verified`
**自治体数:** 89 件
  - verified: 89
  - うち `meta.lifecycle.r8Stage = verified_r8`: 52 件
**生成日時:** 2026-05-25T19:24:36
**スキャン JSON 数:** 1721 件

## ⚠ 整合性警告: status=verified だが r8Stage != verified_r8 が 37 件

これらは `meta.status` は `verified` だが `meta.lifecycle.r8Stage` が `verified_r8` ではない。
おそらく lifecycle 構造の retrofit (PR #2 など) が未完。次回 retrofit 対象。

| citySlug | cityName | r8Stage 実値 |
|---|---|---|
| mito | 水戸市 | `NONE` |
| hitachi | 日立市 | `NONE` |
| koga-ibaraki | 古河市 | `NONE` |
| tsukuba | つくば市 | `NONE` |
| hitachinaka | ひたちなか市 | `NONE` |
| oyama | 小山市 | `NONE` |
| takasaki | 高崎市 | `NONE` |
| kiryu | 桐生市 | `NONE` |
| tomioka | 富岡市 | `NONE` |
| saitama | さいたま市 | `NONE` |
| kawagoe | 川越市 | `NONE` |
| kawaguchi | 川口市 | `NONE` |
| koshigaya | 越谷市 | `NONE` |
| shiki | 志木市 | `NONE` |
| hachioji | 八王子市 | `NONE` |
| chofu | 調布市 | `NONE` |
| kokubunji | 国分寺市 | `NONE` |
| sagamihara | 相模原市 | `NONE` |
| hiratsuka | 平塚市 | `NONE` |
| hadano | 秦野市 | `NONE` |
| yamato | 大和市 | `NONE` |
| niigata | 新潟市 | `NONE` |
| nagano | 長野市 | `NONE` |
| hamamatsu | 浜松市 | `NONE` |
| kasugai | 春日井市 | `NONE` |
| kariya | 刈谷市 | `NONE` |
| anjo | 安城市 | `NONE` |
| nishio | 西尾市 | `NONE` |
| komaki | 小牧市 | `NONE` |
| kiyosu | 清須市 | `NONE` |
| kitanagoya | 北名古屋市 | `NONE` |
| kota | 幸田町 | `NONE` |
| kumiyama | 久御山町 | `NONE` |
| matsuyama | 松山市 | `NONE` |
| kumamoto | 熊本市 | `NONE` |
| hiji | 日出町 | `NONE` |
| kirishima | 霧島市 | `NONE` |

---

## 凡例

各料率列 (医療 / 後期支援 / 介護) は次の 4 値を ` / ` 区切りで並べた:

```
所得割率 / 均等割 / 平等割 / 賦課限度額
```

子育て分は cap (限度額) のみ表示。値 `—` は未設定 (household=0 は `0` 表示)。

---

## 京都府 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 26322 | kumiyama | 久御山町 | 10.46% / 38,895 / 24,087 / 670,000 | 3.10% / 11,414 / 7,069 / 260,000 | 3.01% / 12,617 / 6,216 / 170,000 | 30,000 | — | — | — |

## 千葉県 (7 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 12100 | chiba | 千葉市 | 7.21% / 23,280 / 26,640 / 670,000 | 2.85% / 8,880 / 10,320 / 260,000 | 2.57% / 16,560 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 12203 | ichikawa | 市川市 | 7.50% / 12,000 / 20,400 / 670,000 | 1.90% / 8,800 / 0 / 260,000 | 2.05% / 13,600 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 12204 | funabashi | 船橋市 | 7.05% / 39,300 / 0 / 670,000 | 2.74% / 12,700 / 0 / 260,000 | 1.88% / 13,900 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 12207 | matsudo | 松戸市 | 7.62% / 27,000 / 18,000 / 670,000 | 2.86% / 15,000 / 0 / 260,000 | 2.26% / 18,000 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 12217 | kashiwa | 柏市 | 7.20% / 30,000 / 14,340 / 670,000 | 2.68% / 14,520 / 0 / 260,000 | 2.17% / 16,260 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 12222 | abiko | 我孫子市 | 7.08% / 24,400 / 25,100 / 670,000 | 3.38% / 12,200 / 0 / 260,000 | 2.17% / 20,000 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 12226 | futtsu | 富津市 | 7.40% / 41,000 / 0 / 670,000 | 2.50% / 13,800 / 0 / 260,000 | 2.40% / 13,700 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |

## 埼玉県 (6 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 11100 | saitama | さいたま市 | 7.64% / 43,300 / 0 / 670,000 | 2.73% / 14,900 / 0 / 260,000 | 2.37% / 16,100 / 0 / 170,000 | 30,000 | — | — | — |
| 11201 | kawagoe | 川越市 | 7.33% / 44,900 / 0 / 660,000 | 2.73% / 16,500 / 0 / 260,000 | 2.27% / 16,300 / 0 / 170,000 | 30,000 | — | — | — |
| 11202 | kumagaya | 熊谷市 | 7.28% / 40,500 / 0 / 660,000 | 2.58% / 15,500 / 0 / 260,000 | 2.12% / 15,500 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-21 | verified_r8 |
| 11203 | kawaguchi | 川口市 | 7.45% / 44,000 / 0 / 660,000 | 2.78% / 16,000 / 0 / 260,000 | 2.36% / 17,000 / 0 / 170,000 | 30,000 | — | — | — |
| 11222 | koshigaya | 越谷市 | 8.11% / 49,315 / 0 / 660,000 | 2.83% / 17,086 / 0 / 260,000 | 2.44% / 17,325 / 0 / 170,000 | 30,000 | — | — | — |
| 11228 | shiki | 志木市 | 7.67% / 47,200 / 0 / 670,000 | 2.78% / 17,000 / 0 / 260,000 | 2.39% / 17,500 / 0 / 170,000 | 30,000 | — | — | — |

## 大分県 (2 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 44201 | oita | 大分市 | 8.68% / 30,600 / 25,400 / 670,000 | 2.68% / 9,700 / 7,500 / 260,000 | 2.48% / 10,100 / 6,000 / 170,000 | 30,000 | official_rate_page | 2026-05-21 | verified_r8 |
| 44341 | hiji | 日出町 | 8.77% / 28,300 / 23,300 / 670,000 | 3.08% / 9,800 / 8,000 / 260,000 | 2.86% / 10,700 / 6,600 / 170,000 | 30,000 | — | — | — |

## 大阪府 (7 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 27100 | osaka | 大阪市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 27140 | sakai | 堺市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-21 | verified_r8 |
| 27203 | toyonaka | 豊中市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 27205 | suita | 吹田市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 27207 | takatsuki | 高槻市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 27210 | hirakata | 枚方市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 27227 | higashiosaka | 東大阪市 | 9.50% / 34,990 / 33,908 / 660,000 | 3.06% / 11,191 / 10,845 / 260,000 | 2.60% / 18,682 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |

## 愛媛県 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 38201 | matsuyama | 松山市 | 7.60% / 25,200 / 19,920 / 670,000 | 3.20% / 9,600 / 7,800 / 260,000 | 2.70% / 9,660 / 5,880 / 170,000 | 30,000 | — | — | — |

## 愛知県 (8 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 23206 | kasugai | 春日井市 | 7.30% / 31,600 / 22,000 / 660,000 | 2.60% / 11,400 / 9,000 / 260,000 | 2.20% / 12,290 / 6,270 / 170,000 | 30,000 | — | — | — |
| 23210 | kariya | 刈谷市 | 7.97% / 34,000 / 21,800 / 660,000 | 2.87% / 12,100 / 7,800 / 260,000 | 2.44% / 12,200 / 6,000 / 170,000 | 30,000 | — | — | — |
| 23212 | anjo | 安城市 | 7.43% / 31,700 / 20,300 / 670,000 | 2.84% / 12,000 / 7,700 / 260,000 | 2.44% / 12,200 / 6,000 / 170,000 | 30,000 | — | — | — |
| 23213 | nishio | 西尾市 | 7.15% / 30,500 / 19,800 / 670,000 | 2.89% / 12,200 / 7,800 / 260,000 | 2.45% / 12,200 / 6,000 / 170,000 | 30,000 | — | — | — |
| 23219 | komaki | 小牧市 | 6.65% / 31,300 / 20,400 / 670,000 | 2.45% / 11,100 / 7,400 / 260,000 | 2.18% / 11,500 / 6,200 / 170,000 | 30,000 | — | — | — |
| 23233 | kiyosu | 清須市 | 7.93% / 33,857 / 21,734 / 670,000 | 2.80% / 11,887 / 7,631 / 260,000 | 2.41% / 12,117 / 6,000 / 170,000 | 30,000 | — | — | — |
| 23234 | kitanagoya | 北名古屋市 | 7.78% / 27,800 / 21,600 / 670,000 | 2.66% / 9,700 / 7,400 / 260,000 | 2.45% / 10,500 / 6,200 / 170,000 | 30,000 | — | — | — |
| 23501 | kota | 幸田町 | 6.51% / 27,200 / 18,500 / 670,000 | 2.73% / 11,200 / 7,600 / 260,000 | 2.18% / 10,900 / 5,600 / 170,000 | 30,000 | — | — | — |

## 新潟県 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 15100 | niigata | 新潟市 | 7.40% / 14,700 / 19,200 / 670,000 | 3.10% / 7,200 / 9,000 / 260,000 | 2.50% / 14,100 / 0 / 170,000 | 30,000 | — | — | — |

## 東京都 (37 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 13101 | chiyoda | 千代田区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13102 | chuo | 中央区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13103 | minato | 港区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13104 | shinjuku | 新宿区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13105 | bunkyo | 文京区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13106 | taito | 台東区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13107 | sumida | 墨田区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13108 | koto | 江東区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13109 | shinagawa | 品川区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13110 | meguro | 目黒区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13111 | ota | 大田区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13112 | setagaya | 世田谷区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13113 | shibuya | 渋谷区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13114 | nakano-ku | 中野区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13115 | suginami | 杉並区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13116 | toshima | 豊島区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13117 | kita | 北区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13118 | arakawa | 荒川区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13119 | itabashi | 板橋区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13120 | nerima | 練馬区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | — | official_rate_page | 2026-05-18 | verified_r8 |
| 13121 | adachi | 足立区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13122 | katsushika | 葛飾区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13123 | edogawa | 江戸川区 | 7.51% / 47,600 / 0 / 670,000 | 2.80% / 17,600 / 0 / 260,000 | 2.43% / 17,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-18 | verified_r8 |
| 13201 | hachioji | 八王子市 | 7.42% / 42,500 / 0 / 670,000 | 2.85% / 17,800 / 0 / 260,000 | 2.41% / 18,000 / 0 / 170,000 | 30,000 | — | — | — |
| 13202 | tachikawa | 立川市 | 6.85% / 34,200 / 0 / 660,000 | 2.29% / 12,200 / 0 / 250,000 | 1.73% / 14,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-14 | verified_r8 |
| 13203 | musashino | 武蔵野市 | 5.79% / 33,000 / 0 / 660,000 | 2.09% / 12,500 / 0 / 260,000 | 1.84% / 15,000 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-14 | verified_r8 |
| 13204 | mitaka | 三鷹市 | 6.10% / 29,000 / 0 / 660,000 | 2.30% / 11,800 / 0 / 260,000 | 1.60% / 13,400 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-14 | verified_r8 |
| 13205 | ome | 青梅市 | 6.37% / 34,400 / 0 / 670,000 | 2.17% / 12,700 / 0 / 260,000 | 2.03% / 13,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 13206 | fuchu | 府中市 | 5.63% / 28,720 / 0 / 660,000 | 1.92% / 9,640 / 0 / 260,000 | 1.80% / 11,440 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-14 | verified_r8 |
| 13207 | akishima | 昭島市 | 5.90% / 28,000 / 0 / 670,000 | 2.25% / 12,000 / 0 / 260,000 | 1.70% / 15,000 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 13208 | chofu | 調布市 | 5.80% / 30,500 / 0 / 660,000 | 2.08% / 10,900 / 0 / 260,000 | 1.84% / 12,600 / 0 / 170,000 | 30,000 | — | — | — |
| 13210 | koganei | 小金井市 | 6.74% / 31,000 / 0 / 670,000 | 2.25% / 14,000 / 0 / 260,000 | 2.00% / 15,000 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-14 | verified_r8 |
| 13212 | hino | 日野市 | 5.80% / 34,500 / 0 / 670,000 | 2.10% / 12,300 / 0 / 260,000 | 2.10% / 14,700 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 13214 | kokubunji | 国分寺市 | 6.53% / 32,200 / 0 / 670,000 | 2.46% / 14,600 / 0 / 260,000 | 2.27% / 16,300 / 0 / 170,000 | 30,000 | — | — | — |
| 13215 | kunitachi | 国立市 | 5.70% / 23,500 / 0 / 670,000 | 1.95% / 11,200 / 0 / 260,000 | 1.95% / 12,000 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-14 | verified_r8 |
| 13218 | fussa | 福生市 | 5.94% / 33,900 / 0 / 670,000 | 2.40% / 14,200 / 0 / 260,000 | 1.93% / 14,800 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |
| 13229 | nishitokyo | 西東京市 | 5.63% / 33,100 / 0 / 670,000 | 1.81% / 7,600 / 0 / 260,000 | 1.72% / 14,600 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-15 | verified_r8 |

## 栃木県 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 09208 | oyama | 小山市 | 6.10% / 23,800 / 19,500 / 660,000 | 2.80% / 10,000 / 7,500 / 260,000 | 2.40% / 9,500 / 7,500 / 170,000 | 30,000 | — | — | — |

## 熊本県 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 43100 | kumamoto | 熊本市 | 6.34% / 28,400 / 18,100 / 670,000 | 2.98% / 13,300 / 8,500 / 260,000 | 2.94% / 20,300 / 0 / 170,000 | 30,000 | — | — | — |

## 神奈川県 (5 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 14100 | yokohama | 横浜市 | 8.33% / 40,870 / 0 / 670,000 | 2.62% / 13,380 / 0 / 260,000 | 2.84% / 16,200 / 0 / 170,000 | 30,000 | official_rate_page | 2026-05-20 | verified_r8 |
| 14150 | sagamihara | 相模原市 | 6.75% / 29,000 / 18,000 / 670,000 | 2.78% / 11,500 / 7,000 / 260,000 | 2.32% / 12,000 / 6,000 / 170,000 | 30,000 | — | — | — |
| 14203 | hiratsuka | 平塚市 | 7.79% / 30,900 / 19,900 / 670,000 | 2.94% / 11,600 / 7,500 / 260,000 | 2.95% / 12,000 / 5,800 / 170,000 | 30,000 | — | — | — |
| 14211 | hadano | 秦野市 | 7.69% / 26,500 / 23,700 / 670,000 | 3.15% / 10,000 / 8,800 / 260,000 | 3.15% / 11,600 / 6,700 / 170,000 | 30,000 | — | — | — |
| 14213 | yamato | 大和市 | 7.80% / 24,600 / 25,200 / 670,000 | 2.95% / 10,200 / 10,200 / 260,000 | 2.70% / 12,600 / 9,000 / 170,000 | 30,000 | — | — | — |

## 群馬県 (3 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 10202 | takasaki | 高崎市 | 6.80% / 27,400 / 21,400 / 670,000 | 2.50% / 9,700 / 6,900 / 260,000 | 2.10% / 10,600 / 6,100 / 170,000 | 30,000 | — | — | — |
| 10203 | kiryu | 桐生市 | 6.80% / 25,800 / 19,600 / 670,000 | 2.60% / 10,300 / 7,600 / 260,000 | 2.20% / 10,900 / 5,600 / 170,000 | 30,000 | — | — | — |
| 10210 | tomioka | 富岡市 | 6.96% / 26,000 / 25,000 / 670,000 | 2.98% / 11,100 / 9,000 / 260,000 | 2.50% / 10,700 / 6,800 / 170,000 | 30,000 | — | — | — |

## 茨城県 (5 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 08201 | mito | 水戸市 | 7.85% / 31,600 / 0 / 670,000 | 3.50% / 13,700 / 0 / 260,000 | 2.37% / 16,300 / 0 / 170,000 | 30,000 | — | — | — |
| 08202 | hitachi | 日立市 | 7.26% / 27,500 / 0 / 670,000 | 3.24% / 11,900 / 0 / 260,000 | 2.59% / 12,000 / 0 / 170,000 | 30,000 | — | — | — |
| 08204 | koga-ibaraki | 古河市 | 6.70% / 40,400 / 0 / 660,000 | 3.08% / 19,000 / 0 / 260,000 | 2.47% / 18,000 / 0 / 170,000 | 30,000 | — | — | — |
| 08220 | tsukuba | つくば市 | 7.70% / 38,500 / 0 / 670,000 | 3.15% / 15,500 / 0 / 260,000 | 2.50% / 15,500 / 0 / 170,000 | 30,000 | — | — | — |
| 08221 | hitachinaka | ひたちなか市 | 7.23% / 44,000 / 0 / 670,000 | 2.60% / 16,100 / 0 / 260,000 | 2.26% / 15,800 / 0 / 170,000 | 30,000 | — | — | — |

## 長野県 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 20201 | nagano | 長野市 | 8.20% / 17,760 / 19,680 / 670,000 | 2.80% / 6,240 / 7,560 / 260,000 | 2.60% / 8,760 / 7,080 / 170,000 | 30,000 | — | — | — |

## 静岡県 (1 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 22130 | hamamatsu | 浜松市 | 7.20% / 25,000 / 22,000 / 670,000 | 2.35% / 11,000 / 8,000 / 260,000 | 1.90% / 14,500 / 0 / 170,000 | 30,000 | — | — | — |

## 鹿児島県 (2 自治体)

| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |
|---|---|---|---|---|---|---|---|---|---|
| 46201 | kagoshima | 鹿児島市 | 8.26% / 34,600 / 23,000 / 670,000 | 2.94% / 12,200 / 8,100 / 260,000 | 2.47% / 12,000 / 6,100 / 170,000 | 30,000 | official_rate_page | 2026-05-21 | verified_r8 |
| 46218 | kirishima | 霧島市 | 10.00% / 19,900 / 21,600 / 670,000 | 3.30% / 7,500 / 8,000 / 260,000 | 2.60% / 9,000 / 5,300 / 170,000 | 30,000 | — | — | — |

---

## ソース URL 一覧

### 12100 千葉市 (千葉県)
- https://www.city.chiba.jp/hokenfukushi/iryoeisei/hoken/hokenryou-ketteishimashita.html

### 12203 市川市 (千葉県)
- https://www.city.ichikawa.lg.jp/page/4191.html
- https://www.city.ichikawa.lg.jp/pub04/1111000007.html

### 12204 船橋市 (千葉県)
- https://www.city.funabashi.lg.jp/kenkou/kokuho/002/p001880.html

### 12207 松戸市 (千葉県)
- https://www.city.matsudo.chiba.jp/kurashi/hoken_nenkin/kokuho/oshirase/korona_hokenyuuyo.html
- https://www.city.matsudo.chiba.jp/kurashi/hoken_nenkin/kokuho/ryounosantei/ryouhayamihyou.html

### 12217 柏市 (千葉県)
- https://www.city.kashiwa.lg.jp/hokennenkin/kaitei/r8kaitei.html
- https://www.city.kashiwa.lg.jp/hokennenkin/hokennenkin/kokuho/hokenryo/hokenryosante.html

### 12222 我孫子市 (千葉県)
- https://www.city.abiko.chiba.jp/kurashi/kokuho/kokuho_info/abk10003001020.html
- https://www.city.abiko.chiba.jp/kurashi/kokuho/sanshutsu_noufu/calculating/index.html
- https://www.city.abiko.chiba.jp/kurashi/kokuho/sanshutsu_noufu/gengakusochi.html

### 12226 富津市 (千葉県)
- https://www.city.futtsu.lg.jp/0000000227.html
- https://www.city.futtsu.lg.jp/0000007346.html

### 11202 熊谷市 (埼玉県)
- https://www.city.kumagaya.lg.jp/kurashi/kenkohoken/kokuminhoken/kokuhozei2026.html
- https://www.city.kumagaya.lg.jp/kurashi/kenkohoken/kokuminhoken/kodomokosodate.html

### 44201 大分市 (大分県)
- https://www.city.oita.oita.jp/o052/kurashi/kokumin/1193625759256.html

### 27100 大阪市 (大阪府)
- https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html
- https://www.city.osaka.lg.jp/fukushi/page/0000624098.html

### 27140 堺市 (大阪府)
- https://www.city.sakai.lg.jp/kurashi/honen/kokuho/hokenryo/shikumi.html

### 27203 豊中市 (大阪府)
- https://www.city.toyonaka.osaka.jp/kenko/kokuho/topics/hokennryokaiseiten.html
- https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html

### 27205 吹田市 (大阪府)
- https://www.city.suita.osaka.jp/kenko/1018391/1024421/1024423.html
- https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html

### 27207 高槻市 (大阪府)
- https://www.city.takatsuki.osaka.jp/soshiki/31/2366.html
- https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html

### 27210 枚方市 (大阪府)
- https://www.city.hirakata.osaka.jp/0000037140.html
- https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html

### 27227 東大阪市 (大阪府)
- https://www.city.higashiosaka.lg.jp/0000001709.html
- https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html

### 13101 千代田区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13102 中央区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13103 港区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13104 新宿区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13105 文京区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13106 台東区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13107 墨田区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13108 江東区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13109 品川区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13110 目黒区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13111 大田区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13112 世田谷区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13113 渋谷区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13114 中野区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13115 杉並区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13116 豊島区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13117 北区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13118 荒川区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13119 板橋区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13120 練馬区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13121 足立区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13122 葛飾区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13123 江戸川区 (東京都)
- https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html

### 13202 立川市 (東京都)
- https://www.city.tachikawa.lg.jp/kurashi/nenkin/1002478/1002510/1002554/1002560.html

### 13203 武蔵野市 (東京都)
- https://www.city.musashino.lg.jp/kurashi_tetsuzuki/kokuminkenkouhoken_kokuminnenkin/kokuminkenkohoken/1052169/1004710.html

### 13204 三鷹市 (東京都)
- https://www.city.mitaka.lg.jp/c_service/000/000431.html

### 13205 青梅市 (東京都)
- https://www.city.ome.tokyo.jp/soshiki/18/711.html

### 13206 府中市 (東京都)
- https://www.city.fuchu.tokyo.jp/kurashi/hoken/kokuminkenko/hokenze/kokuhosantei.html

### 13207 昭島市 (東京都)
- https://www.city.akishima.lg.jp/kurashi/kokuho/1002176/1002195/1002197.html
- https://www.city.akishima.lg.jp/kurashi/kokuho/1002176/1002195/1002199.html

### 13210 小金井市 (東京都)
- https://www.city.koganei.lg.jp/kurashi/427/kokuhozei/hokenzei_keisan.html

### 13212 日野市 (東京都)
- https://www.city.hino.lg.jp/kurashi/kokuhonenkin/1023198/1023202/1023220.html
- https://www.city.hino.lg.jp/kurashi/kokuhonenkin/1023198/1023199/1028419.html

### 13215 国立市 (東京都)
- https://www.city.kunitachi.tokyo.jp/soshiki/Dept03/Div04/Sec01/gyomu/0116/kokuhozei/1542343600065.html

### 13218 福生市 (東京都)
- https://www.city.fussa.tokyo.jp/life/procedure/insurance/1001872.html
- https://www.city.fussa.tokyo.jp/life/procedure/insurance/1021041.html

### 13229 西東京市 (東京都)
- https://www.city.nishitokyo.lg.jp/kurasi/kokuho/kokuminnkenkouhokeryou/sansyutu_osamekata/sansyutuhouhou.html
- https://www.city.nishitokyo.lg.jp/kurasi/kokuho/kodomokosodate.html

### 14100 横浜市 (神奈川県)
- https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/kokuho/hokenryo/r7hokennryouritu.html
- https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/kokuho/hokenryo/04seidokaisei.html
- https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/kokuho/hokenryo/04hokenryounituite.html

### 46201 鹿児島市 (鹿児島県)
- https://www.city.kagoshima.lg.jp/shimin/shiminbunka/kokuho/kurashi/hoken/hoken/kokuho/ze.html
- https://www.city.kagoshima.lg.jp/shimin/shiminbunka/kokuho/7kaitei.html
