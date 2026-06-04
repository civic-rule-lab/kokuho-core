#!/usr/bin/env python3
# 令和8年度 千葉県 standard_r8 適用スクリプト  2026-06-03
# 出典: https://www.pref.chiba.lg.jp/hoken/kokubo/documents/std-rate-municipal-method.pdf (市町村算定方式)
# 仕様:
#  - 突合は registry/index.json の prefectureSlug=="chiba" を正本に cityName でマッチ（slug衝突回避）
#  - verified_r8 はスキップ。既存 kokuho-2026.json は standard_r8 で上書き。無ければ 2025雛形から新規作成
#  - registry/index.json の publishYear.kokuho を 2026 に（verified は既に2026・不変）
#  - 資産割なし。平等割は市町村の実方式。子育て分は18歳以上均等割をフラット暫定(perCapitaAdult省略)
# 使い方: python3 scripts/apply-chiba-standard-r8.py --data /path/chiba-r8-standard-2026-06-03.json [--apply]
import json, os, sys, argparse, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, "registry", "index.json")
MUNI = os.path.join(ROOT, "data", "municipalities")
PDF = "https://www.pref.chiba.lg.jp/hoken/kokubo/documents/std-rate-municipal-method.pdf"

ap = argparse.ArgumentParser()
ap.add_argument("--data", required=True, help="chiba-r8-standard-*.json")
ap.add_argument("--apply", action="store_true", help="実書き込み（無指定はdry-run）")
args = ap.parse_args()
DRY = not args.apply

def pct(x): return round(x / 100, 6)

data = json.load(open(args.data))["municipalities"]   # key=保険者番号, has cityName + rates
# PDF側: cityName -> values
pdf = {}
for r in data.values():
    pdf[r["cityName"]] = r

reg = json.load(open(REGISTRY))
chiba = [m for m in reg["municipalities"] if m.get("prefectureSlug") == "chiba"]
reg_by_name = {m["cityName"]: m for m in chiba}

print(f"registry 千葉: {len(chiba)}件 / PDF: {len(pdf)}件")
miss_pdf = [n for n in reg_by_name if n not in pdf]
miss_reg = [n for n in pdf if n not in reg_by_name]
if miss_pdf: print("  registryにありPDFに無い:", miss_pdf)
if miss_reg: print("  PDFにありregistryに無い:", miss_reg)

R8_REDUCTION = {"enabled": True, "standards": {
    "sevenTenths": {"base": 430000, "perPersonAdd": 0},
    "fiveTenths": {"base": 430000, "perPersonAdd": 310000},
    "twoTenths": {"base": 430000, "perPersonAdd": 570000}},
    "salaryPensionAdd": 100000, "ratios": {"sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2}}
R8_CAPS = {"medical": 670000, "support": 260000, "care": 170000, "childcare": 30000}
R8_PRESCHOOL = {"enabled": True, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5}

def build(slug, code, name, v, adult18, createdAt, watchUrls):
    return {
        "cityCode": code, "citySlug": slug, "cityName": name, "fiscalYear": 2026,
        "system": "kokuho", "basicDeduction": 430000,
        "rate": {"medical": pct(v["medical"]["income"]), "support": pct(v["support"]["income"]), "care": pct(v["care"]["income"])},
        "perCapita": {"medical": v["medical"]["perCapita"], "support": v["support"]["perCapita"], "care": v["care"]["perCapita"]},
        "household": {"medical": v["medical"]["household"], "support": v["support"]["household"], "care": v["care"]["household"]},
        "caps": dict(R8_CAPS),
        "preschoolReduction": dict(R8_PRESCHOOL),
        "reduction": json.loads(json.dumps(R8_REDUCTION)),
        "meta": {"schemaVersion": "2.0", "dataVersion": "2.1.0", "status": "provisional",
            "lifecycle": {"createdAt": createdAt, "updatedAt": "2026-06-03T00:00:00.000Z",
                "validFrom": "2026-04-01", "validUntil": "2027-03-31", "expiresAt": "2027-04-30",
                "r8Stage": "standard_r8", "sourceStatus": "prefecture_standard_municipal_method",
                "sourceUrls": [PDF], "previousYearTemplate": False, "r8Updated": True,
                "verifiedAt": "", "verificationLevel": "prefecture_standard_unverified", "watchUrls": watchUrls},
            "source": {"type": "prefecture_standard", "title": "令和8年度 千葉県 市町村標準保険料率（市町村算定方式）", "url": PDF, "publishedAt": "2026"},
            "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "", "method": "prefecture-standard-municipal-method"},
            "quality": {"confidenceScore": 0.6, "completeness": "full"},
            "notes": f"千葉県公表の令和8年度 市町村標準保険料率（市町村算定方式）を参考値として採用。法定外繰入ゼロ前提の理論値で、{name}が実際に告示する料率とは異なる場合がある。資産割なし。平等割は当該市町村の実方式に従う。子ども・子育て支援金分は18歳以上均等割(={adult18}円)の分割を省いたフラット均等割で暫定。市町村告示が出たら verified_r8 へ昇格。"},
        "childcareLevy": {"rate": pct(v["childcare"]["income"]), "perCapita": v["childcare"]["perCapita"], "household": v["childcare"]["household"], "cap": 30000},
    }

updated, created, skipped_verified, errors = [], [], [], []
reg_pub_changed = []

for name, m in reg_by_name.items():
    slug, code = m["citySlug"], m["cityCode"]
    if name not in pdf:
        errors.append((name, "PDFデータ無し")); continue
    v = pdf[name]; adult18 = v["childcare"]["perCapitaAdult18plus"]
    d2026 = os.path.join(MUNI, slug, "kokuho-2026.json")
    d2025 = os.path.join(MUNI, slug, "kokuho-2025.json")
    if os.path.exists(d2026):
        old = json.load(open(d2026))
        stage = old.get("meta", {}).get("lifecycle", {}).get("r8Stage")
        if stage == "verified_r8":
            skipped_verified.append(name); continue
        createdAt = old.get("meta", {}).get("lifecycle", {}).get("createdAt", "2026-04-08T00:00:00.000Z")
        watch = old.get("meta", {}).get("lifecycle", {}).get("watchUrls", [])
        nd = build(slug, code, name, v, adult18, createdAt, watch)
        if not DRY:
            json.dump(nd, open(d2026, "w"), ensure_ascii=False, indent=2); open(d2026, "a").write("\n")
        updated.append(name)
    elif os.path.exists(d2025):
        nd = build(slug, code, name, v, adult18, "2026-06-03T00:00:00.000Z", [])
        if not DRY:
            json.dump(nd, open(d2026, "w"), ensure_ascii=False, indent=2); open(d2026, "a").write("\n")
        created.append(name)
    else:
        errors.append((name, "2025も2026も無し")); continue
    # registry publishYear -> 2026
    if m.get("publishYear", {}).get("kokuho") != 2026:
        m.setdefault("publishYear", {})["kokuho"] = 2026
        reg_pub_changed.append(name)

if not DRY and reg_pub_changed:
    shutil.copyfile(REGISTRY, REGISTRY + ".bak")
    json.dump(reg, open(REGISTRY, "w"), ensure_ascii=False, indent=2); open(REGISTRY, "a").write("\n")

print(f"\n{'[DRY-RUN] ' if DRY else '[APPLIED] '}結果:")
print(f"  更新(standard_r8): {len(updated)}")
print(f"  新規作成(2025→2026): {len(created)} -> {created}")
print(f"  スキップ(verified_r8): {len(skipped_verified)} -> {skipped_verified}")
print(f"  registry publishYear→2026: {len(reg_pub_changed)}")
print(f"  エラー: {errors}")
print(f"  合計処理: {len(updated)+len(created)+len(skipped_verified)} / 54")
