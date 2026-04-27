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
