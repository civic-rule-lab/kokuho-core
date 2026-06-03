#!/usr/bin/env python3
# 令和8年度 福島県 standard_r8 適用  2026-06-03
# データ: r8-values-collected-2026-05-21.md 由来(fukushima-r8-standard-2026-06-03.json)
# 3方式(医療/後期/介護=所得+均等+平等)・子ども=所得+均等+18歳以上(平等割なし)・資産割なし
# 突合: registry prefectureSlug=="fukushima" を cityCode で。verified_r8スキップ。欠落は2025雛形から新規。
import json, os, argparse, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, "registry", "index.json"); MUNI = os.path.join(ROOT, "data", "municipalities")
PAGE = "https://www.pref.fukushima.lg.jp/hoken/kenko/iryohoken/joho/r8hyojun.html"
ap = argparse.ArgumentParser(); ap.add_argument("--data", required=True); ap.add_argument("--apply", action="store_true")
A = ap.parse_args(); DRY = not A.apply
def pct(x): return round(x/100, 6)
data = json.load(open(A.data))["municipalities"]   # key=cityCode
reg = json.load(open(REGISTRY)); nag = [m for m in reg["municipalities"] if m.get("prefectureSlug") == "fukushima"]
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
                "sourceStatus": "prefecture_standard_municipal_list", "sourceUrls": [PAGE], "previousYearTemplate": False,
                "r8Updated": True, "verifiedAt": "", "verificationLevel": "prefecture_standard_unverified", "watchUrls": watch},
            "source": {"type": "prefecture_standard", "title": "令和8年度 福島県 市町村標準保険料率", "url": PAGE, "publishedAt": "2026"},
            "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "", "method": "prefecture-standard-municipal-list"},
            "quality": {"confidenceScore": 0.6, "completeness": "full"},
            "notes": f"福島県公表の令和8年度 市町村標準保険料率を参考値として採用。法定外繰入ゼロ前提の理論値で{name}の実告示と異なる場合あり。3方式・資産割なし。子ども子育て分は18歳以上均等割(={k['perCapitaAdult18']}円)を省いたフラット暫定。市告示後 verified_r8 昇格。"},
        "childcareLevy": {"rate": pct(k["income"]), "perCapita": k["perCapita"], "household": k["household"], "cap": 30000}}
upd, crt, skip, err, pub, namechk = [], [], [], [], [], []
for m in nag:
    slug, code, name = m["citySlug"], m["cityCode"], m["cityName"]
    v = data.get(code)
    if v is None: err.append((name, code, "PDF無")); continue
    if v["cityName"] != name: namechk.append((code, v["cityName"], name))
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
    else: err.append((name, slug, "2025/2026無")); continue
    if m.get("publishYear", {}).get("kokuho") != 2026: m.setdefault("publishYear", {})["kokuho"] = 2026; pub.append(name)
if not DRY and pub:
    shutil.copyfile(REGISTRY, REGISTRY + ".bak6"); json.dump(reg, open(REGISTRY, "w"), ensure_ascii=False, indent=2); open(REGISTRY, "a").write("\n")
unm = [c for c in data if c not in {m["cityCode"] for m in nag}]
print(f"{'[DRY]' if DRY else '[APPLIED]'} registry福島 {len(nag)} / data {len(data)}")
print(f"更新 standard_r8: {len(upd)} / 新規: {len(crt)} -> {crt}")
print(f"スキップ verified_r8: {len(skip)} -> {skip}")
print(f"publishYear→2026: {len(pub)} / err: {err} / data未突合cityCode: {unm}")
print(f"cityName不一致(警告): {namechk}")
print(f"合計: {len(upd)+len(crt)+len(skip)} / 77")
