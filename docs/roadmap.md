# ロードマップ

## フェーズ設計
| フェーズ | 内容 |
|---------|------|
| Phase 1（現在） | kokuho-keisan.jp — 信頼と実績を積む |
| Phase 2-B | 自治体APIから公式データを自動取得 |
| Phase 2-A | 自治体職員が直接管理・承認 |
| Phase 3 | 自治体↔市民の相互認証インフラ（Civic Trust Layer） |

## 制度展開ロードマップ
| 制度 | 優先度 |
|------|--------|
| 国保 | ✅ Phase 1 |
| 住民税 | Phase 2 |
| 介護保険 | Phase 2 |
| 子育て支援金 | Phase 2 |
| 奨学金・所得税 | Phase 3 |

**条件：国保の needs_update 解消・全ファイル精査完了後に複数制度実装開始**

## 将来のサイト構成
```
kokuho-keisan.jp    ✅ 稼働中
juminzei-keisan.jp  → 将来
kaigo-keisan.jp     → 将来
civic-keisan.jp     → 全制度横断ポータル
```

## ビジネス方針
- 非営利で信頼・実績を積み、自治体からオファーを待つ
- 防衛は特許でなく「信頼の既成事実」
- 月インフラコスト約1,500円（Cloudflare+ドメイン）
