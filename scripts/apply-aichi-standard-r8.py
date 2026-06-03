#!/usr/bin/env python3
# 令和8年度 愛知県 standard_r8 適用  2026-06-03
# 出典: https://www.pref.aichi.jp/uploaded/attachment/604944.pdf (市町村標準保険料率, pdfplumber抽出)
# 3方式(所得割+均等割+平等割)・資産割なし。子ども分は平等割＋18歳以上均等割あり(フラット暫定)。
# 突合: registry prefectureSlug=="aichi" を正本に cityName。verified_r8 スキップ。欠落は2025雛形から新規。
import json, os, sys, argparse, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, "registry", "index.json")
MUNI = os.path.join(ROOT, "data", "municipalities")
PAGE = "https://www.pref.aichi.jp/soshiki/kokuho/hyojunhokenryoritsu.html"
PDF = "https://www.pref.aichi.jp/uploaded/attachment/604944.pdf"
ap = argparse.ArgumentParser(); ap.add_argument("--data", required=True); ap.add_argument("--apply", action="store_true")
A = ap.parse_args(); DRY = not A.apply
def pct(x): return round(x/100, 6)
data = json.load(open(A.data))["municipalities"]
reg = json.load(open(REGISTRY)); aichi = [m for m in reg["municipalities"] if m.get("prefectureSlug") == "aichi"]
reg_by_name = {m["cityName"]: m for m in aichi}
RED8 = {"enabled": True, "standards": {"sevenTenths": {"base": 430000, "perPersonAdd": 0},
    "fiveTenths": {"base": 430000, "perPersonAdd": 310000}, "twoTenths": {"base": 430000, "perPersonAdd": 570000}},
    "salaryPensionAdd": 100000, "ratios": {"sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2}}
PRE = {"enabled": True, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5}
CAPS = {"medical": 670000, "support": 260000, "care": 170000, "childcare": 30000}
def build(slug, code, name, v, createdAt, watch):
    m, s, c, k = v["medical"], v["support"], v["care"], v["childcare"]
    return {"cityCode": code, "citySlug": slug, "cityName": name, "fiscalYear": 2026, "system": "kokuho", "basicDeduction": 430000,
        "rate": {"medical": pct(m["income"]), "support": pct(s["income"]), "care": pct(c["income"])},
        "perCapita": {"medical": m["perCapita"], "support": s["perCapita"], "care": c["perCapita"]},
        "household": {"medical": m["household"], "support": s["household"], "care": c["household"]},
        "caps": dict(CAPS), "preschoolReduction": dict(PRE), "reduction": json.loads(json.dumps(RED8)),
        "meta": {"schemaVersion": "2.0", "dataVersion": "2.1.0", "status": "provisional",
            "lifecycle": {"createdAt": createdAt, "updatedAt": "2026-06-03T00:00:00.000Z", "validFrom": "2026-04-01",
                "validUntil": "2027-03-31", "expiresAt": "2027-04-30", "r8Stage": "standard_r8",
                "sourceStatus": "prefecture_standard_municipal_list", "sourceUrls": [PDF], "previousYearTemplate": False,
                "r8Updated": True, "verifiedAt": "", "verificationLevel": "prefecture_standard_unverified", "watchUrls": watch},
            "source": {"type": "prefecture_standard", "title": "令和8年度 愛知県 市町村標準保険料率", "url": PAGE, "publishedAt": "2026"},
            "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "", "method": "prefecture-standard-municipal-list"},
            "quality": {"confidenceScore": 0.6, "completeness": "full"},
            "notes": f"愛知県公表の令和8年度 市町村標準保険料率を参考値として採用。法定外繰入ゼロ前提の理論値で、{name}が実際に告示する料率とは異なる場合がある。3方式(所得割+均等割+平等割)・資産割なし。子ども子育て分は18歳以上均等割(={k['perCapitaAdult18']}円)を省いたフラット暫定。市町村告示後 verified_r8 へ昇格。"},
        "childcareLevy": {"rate": pct(k["income"]), "perCapita": k["perCapita"], "household": k["household"], "cap": 30000}}
upd, crt, skip, err, pub = [], [], [], [], []
for name, m in reg_by_name.items():
    slug, code = m["citySlug"], m["cityCode"]
    v = data.get(name)
    if v is None: err.append((name, "PDF無")); continue
    d26 = os.path.join(MUNI, slug, "kokuho-2026.json"); d25 = os.path.join(MUNI, slug, "kokuho-2025.json")
    if os.path.exists(d26):
        old = json.load(open(d26)); lc = old.get("meta", {}).get("lifecycle", {})
        if lc.get("r8Stage") == "verified_r8": skip.append(name); continue
        nd = build(slug, code, name, v, lc.get("createdAt", "2026-04-08T00:00:00.000Z"), lc.get("watchUrls", []))
        if not DRY: json.dump(nd, open(d26, "w"), ensure_ascii=False, indent=2); open(d26, "a").write("\n")
        upd.append(name)
    elif os.path.exists(d25):
        nd = build(slug, code, name, v, "2026-06-03T00:00:00.000Z", [])
        if not DRY: json.dump(nd, open(d26, "w"), ensure_ascii=False, indent=2); open(d26, "a").write("\n")
        crt.append((name, slug))
    else: err.append((name, slug + " 2025/2026無")); continue
    if m.get("publishYear", {}).get("kokuho") != 2026: m.setdefault("publishYear", {})["kokuho"] = 2026; pub.append(name)
if not DRY and pub:
    shutil.copyfile(REGISTRY, REGISTRY + ".bak4"); json.dump(reg, open(REGISTRY, "w"), ensure_ascii=False, indent=2); open(REGISTRY, "a").write("\n")
unm = [n for n in data if n not in reg_by_name]
print(f"{'[DRY]' if DRY else '[APPLIED]'} registry愛知 {len(aichi)} / PDF {len(data)}")
print(f"更新 standard_r8: {len(upd)} / 新規: {len(crt)} -> {crt}")
print(f"スキップ verified_r8: {len(skip)} -> {skip}")
print(f"publishYear→2026: {len(pub)} / err: {err} / PDF未突合: {unm}")
print(f"合計: {len(upd)+len(crt)+len(skip)} / 54")
