# 一次資料リファレンス（cityCode 検証用）

## ファイル

| ファイル | 出所 | 目的 |
|---|---|---|
| `soumu-jichitai-codes.json` | 総務省『都道府県コード及び市区町村コード』 | cityCode の正準ソース |

## ⭐ 重要：一次資料準拠ルール（POLICIES §10）

本プロジェクトの **cityCode は総務省の全国地方公共団体コードのみを一次資料とする**。Wikipedia・NII・eLTAX・J-LIS・自治体公式サイト等の二次資料は禁止。

経緯：2026-05-11 セッションで Cowork が「ota-gunma = 10204」と憶測で記述、後に総務省 PDF を直接照合した結果 **10205** が正解と判明（実際の差は 1）。AI による憶測・二次資料経由の誤りを防ぐため、本ルールを策定。

## 一次資料の所在

総務省『地方行政のデジタル化｜全国地方公共団体コード』ページ：
- https://www.soumu.go.jp/denshijiti/code.html

ダウンロード可能なファイル（令和6年1月1日更新）：
- PDF: https://www.soumu.go.jp/main_content/000925834.pdf
- **Excel (.xls): https://www.soumu.go.jp/main_content/000925835.xls** ← 正式マスタ

改正一覧表（昭和17年4月1日以降）：
- PDF: https://www.soumu.go.jp/main_content/000875487.pdf
- Excel (.xlsx): https://www.soumu.go.jp/main_content/000875488.xlsx

## コード体系

- **6桁コード**：5桁地域コード + 1桁チェックディジット（例：札幌市 = 011002 = "01100" + "2"）
- **5桁コード**：JIS X 0401/0402 規格（都道府県2桁 + 市区町村3桁）。本プロジェクトの registry/index.json の `cityCode` フィールドは **5桁** を使用

## snapshot 更新手順

1. 総務省ページから `.xls` （または `.xlsx` 最新版）を手動ダウンロード
2. `~/Desktop/kokuho-core/data/reference/` に `soumu-jichitai-codes-{YYYY-MM-DD}.xls` として保存
3. `node scripts/parse-soumu-xls.js`（次回実装予定）または `python3 scripts/parse-soumu-xls.py` で JSON に変換
4. `data/reference/soumu-jichitai-codes.json` を上書き
5. `node scripts/validate-citycodes.js` で registry を再検証

## 現在のスナップショット状態

- **partial（部分カバレッジ）**：2026-05-11 時点で web_fetch ベースで取得した北海道〜千葉県袖ケ浦市までの抜粋＋5/11 セッションで触れた自治体を手動 curate
- 鹿児島県霧島市・愛知県幸田町など、partial 範囲外の自治体は **未検証**（registry の値を信用するが、次回 .xls ダウンロード後に再検証）

## validate-citycodes.js の挙動

- snapshot に存在するエントリ：registry の cityCode/cityName と完全照合、不一致は ERROR
- snapshot に存在しないエントリ：partial フラグ true の間は WARNING のみ（block しない）
- snapshot 全カバレッジ達成後は `partialCoverage: false` に切り替えて全エントリ block 化

## 関連
- POLICIES §10「cityCode 一次資料準拠ルール」
- POLICIES §9「slug 衝突拒否ルール」
- `scripts/validate-citycodes.js`
- `scripts/check-slug.js`
