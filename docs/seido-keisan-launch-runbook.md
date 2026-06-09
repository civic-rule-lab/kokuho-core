# seido-keisan.jp 立ち上げ手順書（住民税ローンチ）

**目的**: 住民税＋家計簿シミュレーターを新アンブレラ **seido-keisan.jp** で試験公開する。
**前提**: コード側（kokuho-core）の実装は完了済み。残るは外部インフラ整備と公開作業のみ。
**作成**: 2026-06-09 / 関連: `docs/phase2-site-deploy-design-2026-06-08.md`, `scripts/deploy-seido.sh`

---

## 0. 必要なアカウント・ツール（着手前に確認）

- ドメインレジストラのアカウント（`.jp` を扱えるもの。例: お名前.com / Cloudflare Registrar 等）
- Cloudflare アカウント（国保と同じ運用。DNS/proxy 前段に使う）
- GitHub アカウント（civic-rule-lab org。公開リポ作成権限）
- ローカルに `git` / `node` / `rsync`（kokuho-core が動く環境ならOK）

---

## 1. ドメイン取得（最初に確保）

2026-06-08 時点で空き確認済み。早めに押さえる。

1. **seido-keisan.jp** を取得（本体）。
2. **seido-keisan.com** を取得（防衛用・`.jp` へ301する）。

> ハイフン無し（seidokeisan.jp/.com）は今回は取得しない（必須でない・後追い可）。

**登録者名義（決定 2026-06-09）: 親会社「Civic Systems」**
- 理由: seido-keisan は家計簿シミュレーター（国保＋住民税＋介護を跨ぐ）を載せるアンブレラ。将来どの事業（国保／税制）をスピンオフしても巻き込まれないよう、**両者を跨ぐ資産は親会社で保有**する。
- 国保ドメイン kokuho-keisan.jp は国保ライン側、という整理。
- .jp は WHOIS 代理公開不可だが、汎用JPは**登録者名のみ公開・住所/電話は非公開**。組織名（Civic Systems）で登録すれば個人名も出ない。

**確認**: レジストラの管理画面に2ドメインが表示されること。

---

## 2. 公開リポジトリ作成（kokuho-keisan と同じ2リポ構成）

1. GitHub（civic-rule-lab）で公開リポ **`seido-keisan`** を新規作成（Public）。
   - 役割: GitHub Pages がここを配信する「生成物リポ」。国保の `kokuho-keisan` と同型。
2. ローカルに clone:
   ```bash
   cd ~/Desktop
   git clone https://github.com/civic-rule-lab/seido-keisan.git
   ```
   - これで `deploy-seido.sh` の同期先 `~/Desktop/seido-keisan` が用意できる。
3. 最低限のディレクトリを用意（無くても deploy 時に作られるが、初回は空コミットしておくと楽）:
   ```bash
   cd ~/Desktop/seido-keisan
   mkdir -p js/core/shared css data/municipalities
   touch .nojekyll          # GitHub Pages の Jekyll 処理を無効化
   git add . && git commit -m "init: seido-keisan 公開リポ" && git push
   ```

**確認**: `~/Desktop/seido-keisan` が存在し、push 済みであること。

---

## 3. Cloudflare + GitHub Pages 設定（国保と同じ構成）

配信実態は **GitHub Pages（origin）＋ Cloudflare（DNS/proxy 前段）**。Cloudflare Pages ではない。

1. **GitHub Pages を有効化**: `seido-keisan` リポの Settings → Pages →
   - Source: `Deploy from a branch`、Branch: `main` / `(root)`。
   - Custom domain: `seido-keisan.jp` を入力。
2. **Cloudflare に seido-keisan.jp を追加**:
   - サイト追加 → ネームサーバをレジストラ側で Cloudflare に向ける。
   - DNS レコード: `seido-keisan.jp` と `www` を GitHub Pages 宛て（`username.github.io` の CNAME、または GitHub Pages の A レコード4本）に設定。proxy（オレンジ雲）ON。
3. **HTTPS**: GitHub Pages の "Enforce HTTPS" を ON（証明書発行を待つ）。

> ⚠️ `_redirects`（Cloudflare Pages 固有）は GitHub Pages では効かない。301 は必ず Cloudflare 側（次節）で行う。

**確認**:
```bash
curl -sI https://seido-keisan.jp/ | head -5     # 200 か、まだ空なら 404（配信経路が通っていればOK）
```

---

## 4. `.com → .jp` の301リダイレクト（Cloudflare Redirect Rules）

1. Cloudflare に **seido-keisan.com** も追加（DNS は proxy ON のダミーAレコードでよい）。
2. Rules → Redirect Rules で新規ルール:
   - When: `Hostname equals seido-keisan.com`（www 含めるなら OR で `www.seido-keisan.com`）
   - Then: `Static`／`301`／`https://seido-keisan.jp${uri.path}`（パス保持）。

**確認**:
```bash
curl -sI https://seido-keisan.com/aichi/nagoya/jumin/ | grep -i location
# → location: https://seido-keisan.jp/aichi/nagoya/jumin/
```

---

## 5. ローカルで変更をコミット（kokuho-core 側）

今セッションの未コミット変更を確定する。**`git push` だけでは本番に届かない**点は国保と同じ。

対象（kokuho-core）:
- データ修正: `data/municipalities/nagoya/jumin-2026.json`, `data/municipalities/toyookashi/jumin-2026.json`
- エンジン: `js/core/jumin.js`, `js/core/package.json`（ESM根治）
- テンプレ: `templates/jumin-simple.html`, `jumin-income.html`, `city-integrated.html`, `seido-index.html`
- スクリプト: `scripts/generate-jumin-pages.js`, `generate-seido-index.js`, `deploy-seido.sh`
- registry: `registry/index.json`（6市に jumin 追加）

```bash
cd ~/Desktop/kokuho-core
# 生成物（aichi/nagoya/jumin 等）はそのままだと untracked ガードに引っかかる。
# 生成物もコミットする運用なら add、しない運用なら生成は deploy に任せて clean する。
git add -A
git commit -m "feat(jumin): 住民税＋家計簿シミュレーター 実装（6市 試験公開）"
```

> `deploy-seido.sh` は untracked ファイルが残っていると停止する（2026-05-20 横浜事案対策）。
> 先に commit するか、生成物を `git clean -fd` してから deploy する（deploy が再生成する）。

---

## 6. デプロイ実行

```bash
cd ~/Desktop/kokuho-core
bash scripts/deploy-seido.sh --dry-run   # まず検証＋生成＋件数だけ確認
bash scripts/deploy-seido.sh --push      # 本番反映（seido-keisan を push → GitHub Pages auto-deploy）
```

`deploy-seido.sh` が行うこと:
1. `validate-jumin-data.js` でデータ検証
2. `generate-jumin-pages.js`（6市の jumin/ ＋ kakeibo/）＋ `generate-seido-index.js`（トップ）生成
3. untracked 混入ガード
4. `seido-keisan` へ同期（jumin/kakeibo ページ・data・js/core・css・index.html）
5. コミット → push → 本番 smoke test

---

## 7. 本番疎通テスト（smoke test）

`--push` 時に自動実行されるが、手動でも:
```bash
for u in / /aichi/nagoya/jumin/ /aichi/nagoya/jumin/income.html /aichi/nagoya/kakeibo/ /kanagawa/yokohama/kakeibo/; do
  echo "$u → $(curl -sI -o /dev/null -w '%{http_code}' https://seido-keisan.jp$u)"
done
# すべて 200 ならOK（反映に数分かかることがある）
```
ページ内の計算が動くか（ブラウザで給与500万→住民税が表示されるか）も1件は目視確認する。

---

## 8. 段階拡大（試験公開 → verified 21市 → さらに）

1. `registry/index.json` の対象自治体に `systems: [..., "jumin"]` と `publishYear.jumin: 2026` を追加。
   - 現在の verified 21市: 政令市20＋豊岡市（slug は `data/municipalities/*/jumin-2026.json` の status=verified で確認可）。
2. `bash scripts/deploy-seido.sh --push` を再実行 → トップのセレクタも自動で増える。
3. inferred 自治体を公開する場合は「推計」明示の方針（design §5）に従う。

---

## 9. 補足・既知の論点

- **家計簿ページの「国保だけ詳しく ↗」リンク**: ✅ 暫定対応 実装済み（2026-06-09）。
  - `generate-jumin-pages.js` が `__LINK_KOKUHO__` を `https://kokuho-keisan.jp/{pref}/{slug}/` に置換し、別タブ（target=_blank）で開く。seido-keisan に国保ページが無くても 404 にならない。
  - 恒久対応: 国保を seido-keisan.jp に移行後、`__LINK_KOKUHO__` を内部 `../` に戻し、`templates/city-integrated.html` の target=_blank を外す（design §6）。急がない。
- **kokuho-keisan.jp との関係**: 当面併存。将来 Cloudflare 301 で `seido-keisan.jp/kokuho/` に集約（design §6）。
- **介護保険**: 家計簿ページでは `KAIGO_ENABLED=false` で「準備中」。データ検証後に true へ。

---

*Civic Rule Lab — 2026-06-09*
