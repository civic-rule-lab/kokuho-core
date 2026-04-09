# 年度更新フロー

毎年4月に行う国保料率の更新手順。

最終更新: 2026-04-09

---

## スケジュール

| 時期 | 作業 |
|------|------|
| 4月上旬 | 移行スクリプト実行・needs_update ファイル一括生成 |
| 4月〜5月 | 各自治体の公式料率を随時確認・更新 |
| 6月目安 | ほぼ全件出揃い・一斉更新 |
| 7月以降 | 遅れた自治体・修正公表への対応 |

---

## Step 1: 移行スクリプト実行（4月上旬）

前年度データを新年度へ一括コピーし、全件を `needs_update` に設定する。

```bash
node scripts/migrate-2025-to-2026.js
```

主な自動変更内容（年度ごとに異なる）:
- 医療分賦課限度額の更新
- 子ども・子育て支援金分の新設・変更
- fiscalYear の更新

---

## Step 2: フロントサイトに注記を表示

移行後は全ページに「令和○年度データ使用中」の注記を表示する。
テンプレートに追加済み（`templates/kokuho-simple.html` / `kokuho-income.html`）。

---

## Step 3: 公式料率の確認・更新（4月〜6月）

各自治体の公式ページ・広報誌から料率を確認し、JSONを更新する。

### 更新手順（1自治体あたり）

1. `data/municipalities/{slug}/kokuho-{year}.json` を開く
2. 公式料率に基づき数値を修正
3. `meta.status` を `"needs_update"` → `"verified"` に変更
4. `meta.source` に公式資料のURL・タイトル・公表日を記入
5. `meta.audit.verifiedAt` に確認日を記入

```json
"meta": {
  "status": "verified",
  "source": {
    "type": "official",
    "title": "令和8年度 国民健康保険料率のお知らせ",
    "url": "https://www.city.example.lg.jp/...",
    "publishedAt": "2026-04-01"
  },
  "audit": {
    "verifiedBy": "civic-rule-lab",
    "verifiedAt": "2026-04-09",
    "method": "official-document"
  }
}
```

---

## Step 4: バリデーション実行

```bash
node scripts/validate-kokuho-data.js
```

ERROR・WARNINGがないことを確認する。

---

## Step 5: 全ページ再生成

```bash
node scripts/generate-official-pages.js
node scripts/generate-selector.js
```

---

## Step 6: 動作確認・デプロイ

```bash
# 計算照合テスト
node scripts/test-calc-verify.js

# Cloudflare Worker デプロイ
cd workers/api && npx wrangler deploy

# git コミット・プッシュ
git add -u
git commit -m "令和○年度 国保料率 全件更新"
git push
```

---

## Step 7: フロントサイトの切り替え

`kokuho-keisan/js/engine.js` のデータ参照先を新年度に変更する。

```js
// 変更前
const response = await fetch(`/data/municipalities/${city}/kokuho-2025.json`);

// 変更後
const response = await fetch(`/data/municipalities/${city}/kokuho-2026.json`);
```

変更後、`generate-official-pages.js` を再実行して全ページ反映。

---

## 注意事項

- `needs_update` のまま発信・PRしない（信用が大事）
- 全件 `verified` になるまで注記（※令和○年度データ表示中）を表示し続ける
- 自治体によっては公表が7月以降になる場合がある → 判明次第随時更新
