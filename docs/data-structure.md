# データ構造

## kokuho JSON（標準形式）
```json
{
  "cityCode": "14207",
  "citySlug": "chigasaki",
  "cityName": "茅ヶ崎市",
  "fiscalYear": 2025,
  "system": "kokuho",
  "basicDeduction": 430000,
  "rate": { "medical": 0.0666, "support": 0.0277, "care": 0.0262 },
  "perCapita": { "medical": 44000, "support": 14700, "care": 14000 },
  "household": { "medical": 0, "support": 0, "care": 0 },
  "caps": { "medical": 650000, "support": 240000, "care": 170000 },
  "preschoolReduction": { "enabled": true, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5 },
  "reduction": {
    "enabled": true,
    "standards": {
      "sevenTenths": { "base": 430000, "perPersonAdd": 0 },
      "fiveTenths":  { "base": 430000, "perPersonAdd": 305000 },
      "twoTenths":   { "base": 430000, "perPersonAdd": 560000 }
    },
    "salaryPensionAdd": 100000,
    "ratios": { "sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2 }
  }
}
```

資産割あり（小笠原村等）は `assetLevy: { medical, support, care }` を追加。

## 命名規則
- **slug**: ローマ字小文字（`chigasaki` `fujisawa` `yokohama`）
- **cityCode**: 総務省自治体コード6桁（例：`14207`）
- **prefectureSlug**: ローマ字小文字（`kanagawa` `nagano` `tokyo`）

## 機械向けの入口（カタログとスキーマ）

人が見る計算ページと、機械が読む JSON は同じ来歴を参照する。機械（検索ボット・研究者のスクリプト・AI）が
「どの自治体があり、どの JSON がどこにあり、どこまで確認済みか」を 1 回の取得で知るための入口を置いている。

- **カタログ** `data/index.json`（配信先 `https://kokuho-keisan.jp/data/index.json`）
  - 生成: `node scripts/generate-data-index.js`（`registry/index.json` と `data/municipalities/` を読むだけ。データは書き換えない）
  - 中身: `generatedAt`（索引の中身が最後に変わった日）、`license`（利用条件の URL）、`documentation`（この文書の URL）、
    `schemas`（制度ごとのスキーマの所在）、`systems`（制度ごとの年度・件数・status 別件数）、
    `municipalities[]`（cityCode・citySlug・cityName・prefecture・prefectureSlug・計算ページの `page`・
    台帳で公開対象の `systems`・`files[]`）、`warnings[]`（台帳と実物の不整合の一覧）
  - `files[]` の 1 件 = JSON 1 本: `system`・`fiscalYear`・`url`（相対。`baseUrl` に続ける）・`listed`（台帳の systems に
    含まれ計算ページで使われているか）・`schemaVersion`・`status`・`verifiedAt`・`validFrom`・`validUntil`・`updatedAt`。
    値は各 JSON から読む。無い項目と空文字は `null`。kokuho 以外の制度は `meta` を持たないため検証日・有効期間は `null`
    （取得日は各 JSON の `source.retrievedAt` か `asOf` にある）
  - 並びは cityCode 順（JIS 市区町村コード順）。同じ入力からは同じ bytes が出る（`--check` で最新かを確かめられる）
- **スキーマ** `data/schema/<system>.schema.json`（JSON Schema draft 2020-12。`kokuho` `jumin` `kaigo` `kouki` `hoiku` と、カタログ自身の `index`）
  - 実データ全件の出現キーと型から起こした。料率は JSON の数値（`0.0708` = 7.08%）、金額は円の整数
  - kokuho / jumin / kaigo / kouki はトップレベルと主要な入れ子で未知のキーを許さない（キーを足したらスキーマも直す）。
    hoiku は自治体ごとに階層表の形が違うため、識別項目と来歴だけを定め、表の中身は開けてある
  - 全件がスキーマに通ることは `npm run test:data-schema`（`npm test` の末尾）で検査する
- **利用条件** は `LICENSE.md` を参照（カタログの `license.url` と同じ）。参照・研究・教育・自治体職員の内部検証は無償、
  商用利用・再配布は事前の書面許可が要る
- **来歴**（出典 URL・検証日・検証方法）はカタログでなく各 JSON の `meta`（kokuho）または `source`（その他）にある。
  カタログは「どこにあるか・どの状態か」までで、値そのものは持たない

### 予定: 各 JSON への自己記述の追加

各 JSON のトップレベルに `$schema`（`/data/schema/<system>.schema.json`）・`license`（LICENSE.md の URL）・
`canonical`（`https://kokuho-keisan.jp/data/municipalities/<slug>/<file>`）を持たせる。1,734 自治体 × 5 制度を一括で
書き換えると差分が巨大になり、料率の末尾ゼロ（`0.0030`）を落とす事故の入口にもなるため、一括変換はしない。
代わりに (1) 当面はカタログ `data/index.json` がこれらを持ち、(2) 各制度の生成器（`generate-*-from-spec.js` 等）と
検証昇格の手順が、ファイルを 1 件ずつ更新する時にこの 3 項目を付ける。スキーマ側は既にこの 3 キーを許す
（`additionalProperties: false` の対象外にする）形に先に直してから着手する。
