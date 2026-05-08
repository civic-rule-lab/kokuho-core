# kokuho-core

国民健康保険料計算ツール **[kokuho-keisan.jp](https://kokuho-keisan.jp/)** のソースコード。
全国の自治体ごとの制度を構造化データとして管理し、計算ページを自動生成しています。

> **市民 ↔ 制度** — Civic Rule Lab

---

## このプロジェクトについて

日本の国民健康保険は自治体ごとに料率・賦課方式・軽減基準などが異なります。kokuho-core は、これらを**自治体単位の JSON データ**として記述し、共通の計算エンジン（`engines/kokuho/`）で**全自治体ぶんの計算ページを自動生成**する仕組みです。

```
data/municipalities/{slug}/kokuho-{year}.json
    ↓ normalize    数値表記を統一
    ↓ signature    制度構造の署名を生成
    ↓ classify     同型自治体をグループ化
    ↓ generate     template + override → generated/
    ↓ publish      {pref}/{slug}/ へ配信
```

---

## ライブサイト

**https://kokuho-keisan.jp/**

- 都道府県・自治体を選んで、所得・世帯人数を入力すれば概算が出ます
- 入力情報はサーバーに送信されず、すべてブラウザ内で計算されます

---

## 対応状況（最新）

- **令和7年度（2025）**：全国 1,727 自治体に対応
- **令和8年度（2026）**：1,721 自治体に対応（一部未取得）
- **R8 データ確定目安**：2026年6月

---

## このリポジトリの公開範囲（重要）

このリポジトリには「**計算エンジン本体**」と「**自治体ごとの制度データ**」が含まれています。**透明性の確保**と**第三者によるロジック検証**を目的としています。

公開しているもの：

- 計算エンジン（`js/engine.js`、`engines/kokuho/`、`workers/api/`）
- 自治体マスタ（`registry/index.json`）
- 自治体制度データ（`data/municipalities/`）
- 自動生成スクリプト（`scripts/`）
- 計算ページのテンプレート（`templates/`）
- 設計ドキュメント（`docs/`）

公開していないもの（社内管理）：

- 自治体ごとのデータ収集・抽出ワークフロー
- 年次更新時の運用 SOP
- 公式試算ツールとの突合検証パイプライン
- ベンダー解析メモ

これらは品質・正確性を担保する運用基盤として、Civic Rule Lab 内で継続的に運用しています。

---

## ライセンス

このリポジトリは **Civic Rule Lab Custom License v1.0** で提供されています（OSI 認定の OSS ライセンスではありません）。

### 自由に行えること

- ソースコードの閲覧
- 実装の研究・学習
- リポジトリへのリンク
- 帰属表示付きでの限定的な引用

### 事前許諾が必要なこと

- コードまたはデータの大部分を商用利用すること
- 競合する有料・無料・公開・受託サービスの構築への利用
- 改変版・未改変版の再配布
- 同種の有料・公開・対顧客サービスとして運営すること
- 帰属表示・著作者情報の削除

### 個人・研究・自治体（非商用）の利用

個人での参照・自治体職員による業務理解・研究目的での利用は、上記の自由な行為の範囲で**事前連絡なしに行えます**。

詳細は [`LICENSE.md`](./LICENSE.md) を参照してください。

---

## 商用利用について

法人による商用利用、自治体システムへの組み込み、SIer による顧客提案への活用などをご検討の場合は、別途利用契約が必要です。

**問い合わせ先**：

- メール：[`license@civicrulelab.jp`](mailto:license@civicrulelab.jp)
- GitHub Issue：[New Issue](../../issues/new?labels=licensing&title=Commercial+License+Inquiry) に `licensing` ラベルで起票

問い合わせ時にお知らせいただきたい情報：

- 利用主体（法人名・規模）
- 利用形態（社内利用／顧客提供／SaaS 組込みなど）
- 想定対象自治体・規模
- 想定利用期間

---

## アーキテクチャ概要

```
kokuho-core
├ data        自治体制度データ（自治体ごとに JSON）
├ registry    自治体マスタ
├ engines     計算エンジン（normalize / signature / classify / generate）
├ generated   分類結果・テンプレート・オーバーライド
├ templates   計算ページの HTML テンプレート
├ scripts    生成・バリデーションスクリプト
├ {pref}/{slug}/  自治体ごとの計算ページ（自動生成）
└ docs       設計ドキュメント
```

詳細は [`docs/architecture.md`](./docs/architecture.md) と [`docs/civic-rule-engine-spec.md`](./docs/civic-rule-engine-spec.md) を参照してください。

---

## 開発セットアップ

### 計算エンジンの動作確認

```bash
git clone https://github.com/civic-rule-lab/kokuho-core.git
cd kokuho-core

# Node.js が必要（v18 以上推奨）
node engines/kokuho/generate.js --dry-run
```

### 自治体追加の手順

1. `data/municipalities/{slug}/kokuho-{year}.json` を作成
2. `registry/index.json` に追記
3. `node scripts/generate-official-pages.js` で計算ページ生成
4. `node scripts/generate-selector.js` でポータル更新
5. `node engines/kokuho/generate.js` で分類結果を更新
6. commit / push

JSON のスキーマは [`docs/project-overview.md`](./docs/project-overview.md) のデータ構造セクションを参照。

---

## データソース

各自治体の保険料率データは、公式サイト・公式 PDF・公式試算ツールを一次情報源としています。出典は自治体ごとに `data/municipalities/{slug}/kokuho-{year}.json` の `source` フィールドに記載しています。

国の定める数値（軽減判定係数・賦課限度額など）は厚生労働省通知に基づいています。

---

## 計算結果の正確性について

- 表示される金額は**概算**であり、各自治体が公式に通知する保険料額とは異なる場合があります
- 実際の保険料額は、各自治体からの公式通知でご確認ください
- 計算誤りを発見された場合は GitHub Issue でご報告ください

---

## プロジェクト原則

- **個人データ非保持**：氏名・住所・所得などは一切サーバーに送信されません
- **制度ロジックはコードに埋め込まずデータ化**
- **制度は必ず年度ごとに分離**
- **slug / cityCode は変更不可**（過去のリンクが永続的に有効であるため）

詳細は [`docs/constitution.md`](./docs/constitution.md) を参照してください。

---

## 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| [`docs/project-overview.md`](./docs/project-overview.md) | プロジェクト概要・データ構造・ロードマップ |
| [`docs/architecture.md`](./docs/architecture.md) | アーキテクチャ詳細 |
| [`docs/civic-rule-engine-spec.md`](./docs/civic-rule-engine-spec.md) | 計算エンジン技術仕様 |
| [`docs/constitution.md`](./docs/constitution.md) | 設計原則・運営方針 |

---

## 制作

**Civic Rule Lab**
キャッチコピー：市民 ↔ 制度

---

## 連絡先

- 商用ライセンス：上記「商用利用について」を参照
- バグ報告・データ不一致の指摘：GitHub Issue
- その他のお問い合わせ：GitHub Discussions（準備中）
