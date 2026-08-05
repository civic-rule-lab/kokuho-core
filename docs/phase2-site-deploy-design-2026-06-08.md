# Phase 2 サイト構成・デプロイ方針 設計書（住民税ローンチ）

**作成日**: 2026-06-08
**対象**: Civic Rule Lab — 横展開 Phase 2（住民税 → 介護保険）
**ステータス**: 設計確定（ドメイン文字列の最終確認待ち）
**前提資料**: `docs/multi-system-architecture.md`（4/27 Opus設計）/ `docs/roadmap.md` / `CLAUDE.md`

---

## 0. 確定した方針

| 論点 | 決定 | 根拠 |
|------|------|------|
| 最初にローンチする制度 | **住民税**（→その後 介護保険） | 計算が単純・検証が軽い・インフラ完成度が高い。型の確立に最適 |
| 「個別サイト」の実体 | **独立ドメインではなくパス名前空間** | 最終ゴールが自治体ごとの統合サイト。独立ドメインはCORS・ブランド分断・インフラ4重で集約に逆行 |
| アンブレラ方針 | **B: 中立アンブレラを今確立** | 売却予定の civic-exchange（＝旧「市民サービス」ブランド）を手放すため、消費者ポータルのブランドを選び直す必要がある |
| アンブレラ・ドメイン | **seido-keisan.jp（採用・空き確認待ち）** | 「制度計算」＝本プロジェクトの自己定義「制度コンパイラ」に一致。全制度を中立にカバー・日本語で意味が通る。civic-exchange売却で「civic-◯◯」消費者ブランドから離れる方向とも整合 |
| サイト構造 | **2層**（制度別SEOページ ＋ 自治体統合ページ） | SEO入口で流入を取り、統合ページで「人生の意思決定」需要に応える |

### 売却予定ドメイン（アンブレラ候補から除外）
- civic-exchange.com / civic-exchange.jp / civicexchange.jp

### 保有・継続ドメイン
- kokuho-keisan.jp（稼働中・SEO資産あり）
- civicsystems.jp（コーポレート）/ civicrulelab.jp / civicrulelab.com（研究ラボ）

---

## 1. サイト構造（2層モデル）

```
{umbrella}/                          ポータルトップ（全制度横断の入口）
{umbrella}/jumin/                    住民税トップ（制度別SEO入口）
{umbrella}/kokuho/                   国保トップ
{umbrella}/kaigo/                    介護保険トップ

{umbrella}/{pref}/{slug}/            ★ 自治体統合ページ（最終ゴール・集約先）
{umbrella}/{pref}/{slug}/jumin/      ○○市 住民税 計算（SEOランディング）
{umbrella}/{pref}/{slug}/income.html ○○市 国保 所得ベース計算（既存踏襲）
{umbrella}/{pref}/{slug}/kaigo/      ○○市 介護保険 計算
```

- **制度別ページ**（`/{slug}/jumin/` 等）= SEOの入口。「○○市 住民税 計算」で流入を取る。
- **自治体統合ページ**（`/{slug}/`）= 最終ゴール。引っ越し・退職・年金開始で全負担を一括試算。

### 同一オリジンであることの意味
データは `data/municipalities/{slug}/{system}-2026.json` に制度別JSONで揃う。
統合ページは同一オリジンの3ファイルを `fetch` するだけで合算できる（`multi-system-architecture.md` の `Promise.allSettled` 設計）。
データ未整備の制度は自動スキップ＝段階リリース可能。
**独立ドメインだとここがクロスオリジンになりCORS設定が必要になる → 統合の足かせ。これが「分けない」最大の理由。**

---

## 2. ドメイン戦略の判断記録

### なぜ独立ドメインにしないか
独立ドメイン（juminzei-keisan.jp 等）が効くのは「各サイトが永続的に別物」のとき。
本プロジェクトの最終ゴールは**自治体ごとの統合サイトへの集約**であり、独立ドメインは毎回その目的に逆行する（CORS・ブランド分断・インフラ4重化）。

### EMD（完全一致ドメイン）SEOの誤解
「juminzei-keisan.jp の方が"住民税 計算"で有利」は、2012年Google EMDアップデート以降ほぼ無効化済み。
今は `{umbrella}/{市}/jumin/` のパスとページ内容で十分上位を狙える。ドメイン名は弱いシグナル。

### A案（kokuho-keisanに乗せる）を採らなかった理由
A案は既存ドメイン権威を継承でき**最速**だが、
(1) ドメイン名が「国保」なのに全制度を載せるブランド不整合、
(2) コンテンツが増えてから中立ポータルへ301移行するコスト増、
の2点で長期的に不利。今は売却予定ブランド（civic-exchange）の置き換えタイミングでもあり、**正しい器を最初に作るB案**を採用。

### A案を採らないことのトレードオフ（認識済み）
中立アンブレラは**SEO権威ゼロから**スタートするため、住民税ページの上位化は kokuho-keisan.jp 配下より遅い。
→ 緩和策は §6（kokuho-keisan.jp の扱い）。

---

## 3. デプロイ方式（2リポ構成・国保SOPの汎用化）

### 3-1. 国保の現行デプロイ（流用元）
`scripts/deploy.sh` は以下を国保にハードコード:
- validate-kokuho-data.js / generate-selector.js / generate-sitemap.js / generate-official-pages.js / generate-articles.js
- テンプレ: kokuho-simple.html / kokuho-income.html / prefecture-page.html
- 同期先: `~/Desktop/kokuho-keisan`（公開リポ）→ GitHub Pages 配信、Cloudflare は DNS/proxy 前段
- コピー対象: js/core/kokuho.js 等
- 本番 smoke test: 国保URL

### 3-2. 新アンブレラの2リポ構成（国保パターンを踏襲）
```
kokuho-core      （作業場所・コアOSS）         ← 全制度のソース・データ・生成スクリプト
seido-keisan     （公開・生成物）              ← GitHub Pages がここを配信
seido-keisan.jp  → Cloudflare（DNS/proxy 前段）→ GitHub Pages（origin）
```
> 注: `_redirects`（Cloudflare Pages固有）は GitHub Pages では効かない（CLAUDE.md）。
> 301が要る場合は Cloudflare Redirect Rules / Workers / meta refresh のいずれか。

### 3-3. deploy.sh の汎用化（必要作業）
国保専用 → 制度横断に拡張する。具体的には:

1. **生成ステップを制度横断に**
   - `generate-official-pages.js` を制度パラメータ化（`--system=jumin` で住民税テンプレを使う）、または `generate-jumin-pages.js` を新設
   - selector / sitemap は全制度ページを含むよう拡張

2. **同期先を変数化**
   - `PUBLIC_DIR` を `~/Desktop/seido-keisan` に
   - コピー対象に js/core/jumin.js・jumin用CSS等を追加

3. **バリデーションを制度横断に**
   - `validate-jumin-data.js`（既存）を deploy 前チェックに組み込む

4. **smoke test を新URLに**
   - `/`, `/jumin/`, `/{pref}/{slug}/jumin/`, `/{pref}/{slug}/`（統合）の200確認

5. **untracked混入ガード（横浜事案対策）はそのまま流用**

### 3-4. デプロイ手順
- 生成 → commit → PR → deploy.sh 実行（`git push` だけでは本番反映されない）

---

### 3-5. ドメイン保有・リダイレクト方針
アンブレラは **2本取得**（ブランド保護の最小構成）:

| ドメイン | 役割 |
|---------|------|
| **seido-keisan.jp** | 本体（GitHub Pages origin・Cloudflare DNS/proxy） |
| **seido-keisan.com** | 防衛取得。`.jp` へ301リダイレクト（スクワッター・混同防止） |

- ハイフン無し（seidokeisan.jp/.com）は今回**取得しない**（混同リスク中・必須でない）。必要になれば後追い。
- `.com → .jp` の301は Cloudflare Redirect Rules で設定（`_redirects`はGH Pages不可）。
- 取得時期: 2026-06-08 に空きを確認済み。**取得推奨（早めに確保）**。

---

## 4. ページ生成（住民税）— 不足分

| 要素 | 国保 | 住民税 | 必要作業 |
|------|------|--------|---------|
| エンジン | kokuho.js | **jumin.js ✅実装済** | なし |
| データ | kokuho-2026.json | **jumin-2026.json ✅1,215件** | 検証のみ |
| 検証スクリプト | test-integrity 等 | **verify-jumin.js ✅** | なし |
| ページテンプレート | kokuho-simple/income.html | **未作成** | `templates/jumin-simple.html` 新設 |
| ページ生成スクリプト | generate-official-pages.js | **未作成** | 住民税対応の生成器 |
| 統合ページ | — | **未作成** | `/{pref}/{slug}/` テンプレ＋生成器 |

住民税ローンチに新規で要るのは主に **テンプレート2種（制度別・統合）＋生成スクリプト** のみ。エンジン・データ・検証基盤は流用可。

---

## 5. 公開基準（検証ステージのゲーティング）

`verify-jumin.js` は既に `verified / inferred` ステージを持つ。registry の `systems` 配列・`publishYear.{system}` で公開を制御する（国保と同型）。

### 推奨ゲート（住民税）
| ステージ | 意味 | 公開 |
|---------|------|------|
| verified | 公式で税率・均等割確認＋給与500万/1,000万で公式シミュレーター一致 | ✅ 公開（"確認済み"表示） |
| inferred | 県標準/超過課税スペックから生成（未照合） | △ 公開可だが"推計"明示。または非公開で段階的に昇格 |
| （ファイルなし）| 全国標準値そのまま | ✅ エンジンがフォールバック、計算は正確 |

> 判断ポイント: 初回ローンチで inferred を公開するか、verified のみ先行公開するか。
> 国保は実績を積んでから拡大した。住民税も**主要自治体を verified 化してから公開**を推奨。

---

## 6. kokuho-keisan.jp の扱い（移行計画）

中立アンブレラ採用後も、kokuho-keisan.jp の既存SEO資産は活かす。

### 推奨ステップ
1. **当面は併存**: kokuho-keisan.jp はそのまま稼働継続（国保の権威を維持）。
2. **新アンブレラで住民税を新規公開**: seido-keisan.jp/jumin/ から立ち上げ。
3. **十分な制度が揃ったら国保を移行**: seido-keisan.jp/kokuho/ にコンテンツを展開し、
   kokuho-keisan.jp → seido-keisan.jp/kokuho/ を **Cloudflare Redirect Rules で301**（`_redirects`はGH Pagesで不可）。
4. 301は適切に張れば権威の大半（一般に9割前後）を引き継げる。**急がない**（ドメインは2027/03まで自動更新）。

> 代替判断: 移行リスクを嫌うなら、国保は kokuho-keisan.jp に残し、
> 新制度のみ seido-keisan.jp に置き、統合ページからは両ドメインを案内する“緩い連邦”も可。
> ただし統合計算のCORS問題が残るため、長期的には単一オリジン集約が本筋。

---

## 7. 次セッションの着手ステップ（推奨順）

1. **ドメイン取得**: seido-keisan.jp ＋ seido-keisan.com を取得（空き確認済 2026-06-08）。`.com → .jp` 301を Cloudflare Redirect Rules で設定。
2. **住民税の検証**: 代表自治体（東京特別区/政令市/標準市）を公式シミュレーター（給与500万/1,000万）と照合し verified 昇格（`verify-jumin.js --mark`）。
3. **ページテンプレート作成**: `templates/jumin-simple.html`（制度別）＋自治体統合テンプレ。
4. **生成スクリプト**: 住民税ページ生成器（generate-official-pages の制度パラメータ化 or 新設）。
5. **deploy.sh 汎用化**: §3-3 の改修。新公開リポ `seido-keisan` 作成。
6. **Cloudflare/GH Pages 設定**: seido-keisan.jp の DNS/proxy＋Pages配信。
7. **段階公開**: verified 自治体から公開→ smoke test→ 拡大。

---

## 8. 決定事項サマリー

| 項目 | 決定 |
|------|------|
| ローンチ順 | 住民税 → 介護保険 |
| サイト構造 | 2層（制度別SEO＋自治体統合）・パス名前空間 |
| ドメイン | 中立アンブレラ seido-keisan.jp（空き確認済・取得推奨）＋ seido-keisan.com（防衛・301）。独立ドメインは不採用 |
| デプロイ | 国保2リポSOPを汎用化（kokuho-core → seido-keisan → GH Pages＋Cloudflare） |
| データ層 | 同一オリジン・制度別JSON・Promise.allSettled で部分成功許容 |
| 公開基準 | verified 先行公開を推奨。inferredは"推計"明示 or 非公開 |
| kokuho-keisan.jp | 当面併存→将来 Cloudflare 301 で集約（急がない） |
| 売却予定 | civic-exchange.com / civic-exchange.jp / civicexchange.jp |

---

*Civic Rule Lab — 2026-06-08*
