#!/usr/bin/env python3
# 令和8年度 北海道 standard_r8 適用  2026-06-03
# 出典: https://www.pref.hokkaido.lg.jp/hf/kki/101133.html
#       03_市町村標準保険料率(市町村別一覧).pdf （pdfplumberで列座標抽出）
# 仕様:
#  - registry/index.json の prefectureSlug=="hokkaido" を正本に cityName で突合
#  - 3方式（所得割+均等割+平等割）。資産割は北海道に列なし=なし。子育て分も平等割あり。
#  - 子育ての18歳以上均等割はフラット暫定（perCapita=base均等割、perCapitaAdult省略）
#  - verified_r8 はスキップ。kokuho-2026無→2025雛形から新規。registry publishYear→2026。
#  - 大雪地区広域連合(#177=東川/美瑛/東神楽)は registry/dir に無いため対象外（報告のみ）。
#  - 泊村は registry に2件(tomari 01403 / tomari-kunashir 01696=国後・ファイル無)。ファイル有のみ適用。
import json, os, sys, argparse, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, "registry", "index.json")
MUNI = os.path.join(ROOT, "data", "municipalities")
PAGE = "https://www.pref.hokkaido.lg.jp/hf/kki/101133.html"
PDF  = "https://www.pref.hokkaido.lg.jp/fs/1/3/0/1/4/1/1/2/_/03_市町村標準保険料率(市町村別一覧).pdf"

ap = argparse.ArgumentParser()
ap.add_argument("--data", required=True)
ap.add_argument("--apply", action="store_true")
args = ap.parse_args()
DRY = not args.apply
def pct(x): return round(x/100, 6)

data = json.load(open(args.data))["insurers"]   # bango -> {name, medical, support, care, child}
pdf_by_name = {}
for d in data.values():
    if d["name"] == "大雪地区広域連合": continue
    pdf_by_name[d["name"]] = d

reg = json.load(open(REGISTRY))
hok = [m for m in reg["municipalities"] if m.get("prefectureSlug") == "hokkaido"]

R8_REDUCTION = {"enabled": True, "standards": {
    "sevenTenths": {"base": 430000, "perPersonAdd": 0},
    "fiveTenths": {"base": 430000, "perPersonAdd": 310000},
    "twoTenths": {"base": 430000, "perPersonAdd": 570000}},
    "salaryPensionAdd": 100000, "ratios": {"sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2}}
R8_CAPS = {"medical": 670000, "support": 260000, "care": 170000, "childcare": 30000}
R8_PRESCHOOL = {"enabled": True, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5}

def build(slug, code, name, v, createdAt, watch):
    med, sup, care, ch = v["medical"], v["support"], v["care"], v["child"]
    return {
        "cityCode": code, "citySlug": slug, "cityName": name, "fiscalYear": 2026,
        "system": "kokuho", "basicDeduction": 430000,
        "rate": {"medical": pct(med["income"]), "support": pct(sup["income"]), "care": pct(care["income"])},
        "perCapita": {"medical": med["perCapita"], "support": sup["perCapita"], "care": care["perCapita"]},
        "household": {"medical": med["household"], "support": sup["household"], "care": care["household"]},
        "caps": dict(R8_CAPS), "preschoolReduction": dict(R8_PRESCHOOL),
        "reduction": json.loads(json.dumps(R8_REDUCTION)),
        "meta": {"schemaVersion": "2.0", "dataVersion": "2.1.0", "status": "provisional",
            "lifecycle": {"createdAt": createdAt, "updatedAt": "2026-06-03T00:00:00.000Z",
                "validFrom": "2026-04-01", "validUntil": "2027-03-31", "expiresAt": "2027-04-30",
                "r8Stage": "standard_r8", "sourceStatus": "prefecture_standard_municipal_list",
                "sourceUrls": [PDF], "previousYearTemplate": False, "r8Updated": True,
                "verifiedAt": "", "verificationLevel": "prefecture_standard_unverified", "watchUrls": watch},
            "source": {"type": "prefecture_standard", "title": "令和8年度 北海道 市町村標準保険料率（市町村別一覧）", "url": PAGE, "publishedAt": "2026"},
            "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "", "method": "prefecture-standard-municipal-list"},
            "quality": {"confidenceScore": 0.6, "completeness": "full"},
            "notes": f"北海道公表の令和8年度 市町村標準保険料率（市町村別一覧）を参考値として採用。法定外繰入ゼロ前提の理論値で、{name}が実際に告示する料率とは異なる場合がある。3方式（所得割+均等割+平等割）・資産割なし。子ども・子育て支援金分は18歳以上均等割(={ch['perCapitaAdult18']}円・合計{ch['perCapitaTotal']}円)の分割を省いたフラット均等割で暫定。市町村告示が出たら verified_r8 へ昇格。"},
        "childcareLevy": {"rate": pct(ch["income"]), "perCapita": ch["perCapita"], "household": ch["household"], "cap": 30000},
    }

updated, created, skipped_verified, errors = [], [], [], []
reg_pub_changed = []
for m in hok:
    slug, code, name = m["citySlug"], m["cityCode"], m["cityName"]
    v = pdf_by_name.get(name)
    if v is None:
        errors.append((name, slug, "PDFデータ無し")); continue
    d2026 = os.path.join(MUNI, slug, "kokuho-2026.json")
    d2025 = os.path.join(MUNI, slug, "kokuho-2025.json")
    if os.path.exists(d2026):
        old = json.load(open(d2026))
        if old.get("meta", {}).get("lifecycle", {}).get("r8Stage") == "verified_r8":
            skipped_verified.append(name); continue
        lc = old.get("meta", {}).get("lifecycle", {})
        nd = build(slug, code, name, v, lc.get("createdAt", "2026-04-08T00:00:00.000Z"), lc.get("watchUrls", []))
        if not DRY:
            json.dump(nd, open(d2026, "w"), ensure_ascii=False, indent=2); open(d2026, "a").write("\n")
        updated.append(name)
    elif os.path.exists(d2025):
        nd = build(slug, code, name, v, "2026-06-03T00:00:00.000Z", [])
        if not DRY:
            json.dump(nd, open(d2026, "w"), ensure_ascii=False, indent=2); open(d2026, "a").write("\n")
        created.append((name, slug))
    else:
        errors.append((name, slug, "2025も2026も無し(幽霊エントリ?)")); continue
    if m.get("publishYear", {}).get("kokuho") != 2026:
        m.setdefault("publishYear", {})["kokuho"] = 2026
        reg_pub_changed.append(name)

if not DRY and reg_pub_changed:
    shutil.copyfile(REGISTRY, REGISTRY + ".bak")
    json.dump(reg, open(REGISTRY, "w"), ensure_ascii=False, indent=2); open(REGISTRY, "a").write("\n")

unmatched_pdf = [d["name"] for d in data.values() if d["name"] not in {m["cityName"] for m in hok}]
print(f"{'[DRY-RUN] ' if DRY else '[APPLIED] '}北海道 結果:")
print(f"  registry北海道: {len(hok)}件 / PDF保険者: {len(data)}件")
print(f"  更新(standard_r8): {len(updated)}")
print(f"  新規作成(2025→2026): {len(created)} -> {created}")
print(f"  スキップ(verified_r8): {len(skipped_verified)} -> {skipped_verified}")
print(f"  registry publishYear→2026: {len(reg_pub_changed)}")
print(f"  エラー(幽霊/データ無): {errors}")
print(f"  PDFにありregistry未収録(対象外): {unmatched_pdf}")
print(f"  合計処理: {len(updated)+len(created)+len(skipped_verified)} / 対象176")
