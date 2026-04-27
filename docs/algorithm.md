# 署名・分類・生成アルゴリズム

## パイプライン
```
自治体JSON
↓ normalize    数値表記を統一（7.3% → 0.073）
↓ signature    制度構造の署名を生成
↓ classify     同型自治体をグループ化
↓ generate     template + override → HTML生成
↓ publish      {pref}/{slug}/ へ配信
```

## 署名フォーマット
```
{calcType}|{caps}|{reduction}|{special}
```
- `calcType`: `2h`（所得割+均等割）/ `3h`（+平等割）/ `2h+asset`（+資産割）/ `4h`（全4方式）
- `caps`: `nat`（全国標準660/260/170万）/ `650-240-170` 等
- `reduction`: `R7std`（R7全国標準）/ `custom`
- `special`: `pre`（未就学児軽減）/ `none`

## 分類結果（R7・1727自治体）
| 署名 | 件数 |
|------|------|
| `3h\|nat\|R7std\|pre` | 最多 |
| `2h\|nat\|R7std\|pre` | 次点 |
| `4h\|nat\|R7std\|pre` | 少数 |
| その他 | 数件 |
