#!/usr/bin/env python3
# 東京 残り17市町村のR8化  2026-06-03
# verified 2件(東村山/狛江=令和8実告示) + standard_r8 15件(都標準2方式)
import json, os, argparse, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, "registry", "index.json")
MUNI = os.path.join(ROOT, "data", "municipalities")
TOKYO_PAGE = "https://www.hokeniryo.metro.tokyo.lg.jp/kenkou/kokuho/nouhukinhyoujyunhokenryouritsu"
TOKYO_PDF = "https://www.hokeniryo.metro.tokyo.lg.jp/documents/d/hokeniryo/r8hyouzyunhokenryouritsu"
ap = argparse.ArgumentParser(); ap.add_argument("--apply", action="store_true"); A = ap.parse_args(); DRY = not A.apply
def pct(x): return round(x/100, 6)

RED8 = {"enabled": True, "standards": {"sevenTenths": {"base": 430000, "perPersonAdd": 0},
    "fiveTenths": {"base": 430000, "perPersonAdd": 310000}, "twoTenths": {"base": 430000, "perPersonAdd": 570000}},
    "salaryPensionAdd": 100000, "ratios": {"sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2}}
PRE = {"enabled": True, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5}
CAPS8 = {"medical": 670000, "support": 260000, "care": 170000, "childcare": 30000}

# --- verified 2件: (slug, code, name, [med_r,med_k, sup_r,sup_k, care_r,care_k, kod_r,kod_k], url) ---
VER = [
 ("higashimurayama","13213","東村山市",[6.85,41900, 2.40,14500, 2.25,16500, 0.31,1922],
   "https://www.city.higashimurayama.tokyo.jp/kurashi/zei/kokuho/hoken/hokenzei/kokuhozei.html"),
 ("komae","13219","狛江市",[5.65,27900, 1.97,11300, 1.84,13600, 0.29,1900],
   "https://www.city.komae.tokyo.jp/index.cfm/41,135373,316,2011,html"),
]
# --- standard_r8 15件: (slug, code, name, [med_r,med_k, sup_r,sup_k, care_r,care_k, kod_r,kod_k], 18plus) ---
STD = [
 ("machida","13209","町田市",[7.33,45666,2.92,18107,2.49,18228,0.30,1855],105),
 ("kodaira","13211","小平市",[7.26,45265,2.90,17932,2.46,18086,0.30,1872],95),
 ("higashiyamato","13220","東大和市",[6.89,42963,2.97,17937,2.46,17997,0.30,1813],119),
 ("kiyose","13221","清瀬市",[7.43,46308,2.93,18119,2.47,18065,0.30,1836],115),
 ("higashikurume","13222","東久留米市",[7.65,47701,2.94,18213,2.53,18502,0.30,1870],100),
 ("musashimurayama","13223","武蔵村山市",[7.83,48825,2.97,18376,2.53,18457,0.31,1813],241),
 ("tama","13224","多摩市",[7.59,47306,2.99,18487,2.56,18699,0.30,1890],42),
 ("inagi","13225","稲城市",[7.10,44282,3.00,18578,2.51,18333,0.30,1826],111),
 ("hamura","13227","羽村市",[6.98,43531,2.91,18003,2.48,18111,0.30,1839],89),
 ("akiruno","13228","あきる野市",[6.99,43546,2.91,18049,2.46,18226,0.30,1824],178),
 ("mizuho","13303","瑞穂町",[7.44,46376,3.05,18882,2.60,18963,0.31,1877],196),
 ("hinode","13305","日の出町",[6.89,43037,2.86,17679,2.46,17959,0.30,1819],108),
 ("hinohara","13307","檜原村",[4.89,30507,2.89,17908,2.47,18023,0.28,1805],124),
 ("okutama","13308","奥多摩町",[5.82,36295,2.99,17942,2.50,18329,0.30,1820],73),
 ("ogasawara","13421","小笠原村",[5.18,32312,2.65,16406,2.21,16166,0.29,1548],369),
]

def base(slug, code, name, v):
    return {"cityCode": code, "citySlug": slug, "cityName": name, "fiscalYear": 2026, "system": "kokuho",
        "basicDeduction": 430000,
        "rate": {"medical": pct(v[0]), "support": pct(v[2]), "care": pct(v[4])},
        "perCapita": {"medical": v[1], "support": v[3], "care": v[5]},
        "household": {"medical": 0, "support": 0, "care": 0},
        "caps": dict(CAPS8), "preschoolReduction": dict(PRE), "reduction": json.loads(json.dumps(RED8)),
        "childcareLevy": {"rate": pct(v[6]), "perCapita": v[7], "household": 0, "cap": 30000}}

def ver_meta(name, url):
    return {"schemaVersion": "2.0", "dataVersion": "2.1.0", "status": "verified",
        "lifecycle": {"createdAt": "2026-04-08T00:00:00.000Z", "updatedAt": "2026-06-03T00:00:00.000Z",
            "validFrom": "2026-04-01", "validUntil": "2027-03-31", "expiresAt": "2027-04-30",
            "r8Stage": "verified_r8", "sourceStatus": "official_rate_page", "sourceUrls": [url],
            "previousYearTemplate": False, "r8Updated": True, "verifiedAt": "2026-06-03", "verificationLevel": "official_source_checked"},
        "source": {"type": "official", "title": f"{name} 令和8年度 国民健康保険税 税率", "url": url, "publishedAt": "2026"},
        "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "2026-06-03", "method": "official-site"},
        "quality": {"confidenceScore": 1.0, "completeness": "full"},
        "notes": f"{name}公式ページの令和8年度 国民健康保険税 税率を照合。2方式(平等割なし)・資産割なし。子ども・子育て支援金分を含む(perCapitaはフラット、18歳以上加算/未就学等の細目は昇格時精査)。"}

def std_meta(name, p18):
    return {"schemaVersion": "2.0", "dataVersion": "2.1.0", "status": "provisional",
        "lifecycle": {"createdAt": "2026-04-08T00:00:00.000Z", "updatedAt": "2026-06-03T00:00:00.000Z",
            "validFrom": "2026-04-01", "validUntil": "2027-03-31", "expiresAt": "2027-04-30",
            "r8Stage": "standard_r8", "sourceStatus": "prefecture_standard_municipal_list", "sourceUrls": [TOKYO_PDF],
            "previousYearTemplate": False, "r8Updated": True, "verifiedAt": "", "verificationLevel": "prefecture_standard_unverified", "watchUrls": []},
        "source": {"type": "prefecture_standard", "title": "令和8年度 東京都 市町村標準保険料率（2方式）", "url": TOKYO_PAGE, "publishedAt": "2026"},
        "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "", "method": "prefecture-standard-municipal-list"},
        "quality": {"confidenceScore": 0.6, "completeness": "full"},
        "notes": f"{name}は令和8実告示が未掲載/未確定のため、東京都公表の市町村標準保険料率(2方式)を参考値として採用。法定外繰入ゼロ前提の理論値で実告示と異なる。子ども子育て分の18歳以上均等割={p18}円はフラット暫定で省略。市告示確認後 verified_r8 へ昇格。"}

reg = json.load(open(REGISTRY)); ridx = {m["citySlug"]: m for m in reg["municipalities"]}
done_v, done_s, err, pub = [], [], [], []
def write(slug, code, name, nd):
    p = os.path.join(MUNI, slug, "kokuho-2026.json")
    if not os.path.exists(p): err.append((slug, "no 2026 file")); return False
    if not DRY:
        json.dump(nd, open(p, "w"), ensure_ascii=False, indent=2); open(p, "a").write("\n")
    m = ridx.get(slug)
    if m and m.get("publishYear", {}).get("kokuho") != 2026:
        m.setdefault("publishYear", {})["kokuho"] = 2026; pub.append(name)
    return True

for slug, code, name, v, url in VER:
    nd = base(slug, code, name, v); nd["meta"] = ver_meta(name, url)
    if write(slug, code, name, nd): done_v.append(name)
for slug, code, name, v, p18 in STD:
    nd = base(slug, code, name, v); nd["meta"] = std_meta(name, p18)
    if write(slug, code, name, nd): done_s.append(name)

if not DRY and pub:
    shutil.copyfile(REGISTRY, REGISTRY + ".bak3")
    json.dump(reg, open(REGISTRY, "w"), ensure_ascii=False, indent=2); open(REGISTRY, "a").write("\n")
print(f"{'[DRY]' if DRY else '[APPLIED]'} verified {len(done_v)}: {done_v}")
print(f"standard_r8 {len(done_s)}: {done_s}")
print(f"registry publishYear→2026: {len(pub)} / err: {err}")
