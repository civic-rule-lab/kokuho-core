#!/usr/bin/env python3
# 大雪地区広域連合 構成3町（東川/美瑛/東神楽）を新規収録  2026-06-03
# R7(kokuho-2025)=連合公式 令和7年度 実料率 / R8(kokuho-2026)=道標準#177 standard_r8
# 出典R7: https://taisetsu-kouiki.jp/2019/02/15/国民健康保険料/
# 出典R8: https://www.pref.hokkaido.lg.jp/hf/kki/101133.html （市町村別一覧 #177 大雪地区広域連合）
import json, os, argparse, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, "registry", "index.json")
MUNI = os.path.join(ROOT, "data", "municipalities")
RENGO = "https://taisetsu-kouiki.jp/2019/02/15/国民健康保険料/"
PREF_PAGE = "https://www.pref.hokkaido.lg.jp/hf/kki/101133.html"
PREF_PDF = "https://www.pref.hokkaido.lg.jp/fs/1/3/0/1/4/1/1/2/_/03_市町村標準保険料率(市町村別一覧).pdf"

ap = argparse.ArgumentParser(); ap.add_argument("--apply", action="store_true"); args = ap.parse_args()
DRY = not args.apply

TOWNS = [  # (slug, cityCode, cityName)
    ("higashikawa", "01458", "東川町"),
    ("biei", "01459", "美瑛町"),
    ("higashikagura", "01453", "東神楽町"),
]

# R8(2026)国基準: 5割31万/2割57万。R7(2025)国基準: 5割30.5万/2割56万。
REDUCTION = {"enabled": True, "standards": {
    "sevenTenths": {"base": 430000, "perPersonAdd": 0},
    "fiveTenths": {"base": 430000, "perPersonAdd": 310000},
    "twoTenths": {"base": 430000, "perPersonAdd": 570000}},
    "salaryPensionAdd": 100000, "ratios": {"sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2}}
REDUCTION_R7 = {"enabled": True, "standards": {
    "sevenTenths": {"base": 430000, "perPersonAdd": 0},
    "fiveTenths": {"base": 430000, "perPersonAdd": 305000},
    "twoTenths": {"base": 430000, "perPersonAdd": 560000}},
    "salaryPensionAdd": 100000, "ratios": {"sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2}}
PRESCHOOL = {"enabled": True, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5}

def r7(slug, code, name):
    # 令和7年度 大雪地区広域連合 公式統一料率（3町共通）
    return {
        "cityCode": code, "citySlug": slug, "cityName": name, "fiscalYear": 2025,
        "system": "kokuho", "basicDeduction": 430000,
        "rate": {"medical": 0.071, "support": 0.026, "care": 0.018},
        "perCapita": {"medical": 27000, "support": 9000, "care": 9000},
        "household": {"medical": 27000, "support": 9000, "care": 7000},
        "caps": {"medical": 660000, "support": 260000, "care": 170000},
        "preschoolReduction": dict(PRESCHOOL),
        "reduction": json.loads(json.dumps(REDUCTION_R7)),
        "meta": {"schemaVersion": "2.0", "dataVersion": "2.0.0", "status": "verified",
            "lifecycle": {"createdAt": "2026-06-03T00:00:00.000Z", "updatedAt": "2026-06-03T00:00:00.000Z",
                "validFrom": "2025-04-01", "validUntil": "2026-03-31", "expiresAt": "2026-04-30",
                "sourceStatus": "official_rate_page", "sourceUrls": [RENGO],
                "verifiedAt": "2026-06-03", "verificationLevel": "official_source_checked"},
            "source": {"type": "official", "title": "大雪地区広域連合 国民健康保険料（令和7年度）", "url": RENGO, "publishedAt": "2025"},
            "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "2026-06-03", "method": "official-site"},
            "quality": {"confidenceScore": 1.0, "completeness": "full"},
            "notes": f"{name}は大雪地区広域連合(東川/美瑛/東神楽の3町統一)が国保を賦課。令和7年度の連合統一料率。3方式・資産割なし・子ども子育て分は令和8年度から開始のためR7には無し。"}
    }

def r8(slug, code, name):
    # 令和8年度 道標準（市町村別一覧 #177 大雪地区広域連合）standard_r8
    return {
        "cityCode": code, "citySlug": slug, "cityName": name, "fiscalYear": 2026,
        "system": "kokuho", "basicDeduction": 430000,
        "rate": {"medical": 0.0823, "support": 0.0244, "care": 0.0197},
        "perCapita": {"medical": 28470, "support": 9039, "care": 9015},
        "household": {"medical": 28027, "support": 8899, "care": 7035},
        "caps": {"medical": 670000, "support": 260000, "care": 170000, "childcare": 30000},
        "preschoolReduction": dict(PRESCHOOL),
        "reduction": json.loads(json.dumps(REDUCTION)),
        "meta": {"schemaVersion": "2.0", "dataVersion": "2.1.0", "status": "provisional",
            "lifecycle": {"createdAt": "2026-06-03T00:00:00.000Z", "updatedAt": "2026-06-03T00:00:00.000Z",
                "validFrom": "2026-04-01", "validUntil": "2027-03-31", "expiresAt": "2027-04-30",
                "r8Stage": "standard_r8", "sourceStatus": "prefecture_standard_municipal_list",
                "sourceUrls": [PREF_PDF], "previousYearTemplate": False, "r8Updated": True,
                "verifiedAt": "", "verificationLevel": "prefecture_standard_unverified", "watchUrls": [RENGO]},
            "source": {"type": "prefecture_standard", "title": "令和8年度 北海道 市町村標準保険料率（市町村別一覧・#177大雪地区広域連合）", "url": PREF_PAGE, "publishedAt": "2026"},
            "audit": {"verifiedBy": "civic-rule-lab", "verifiedAt": "", "method": "prefecture-standard-municipal-list"},
            "quality": {"confidenceScore": 0.6, "completeness": "full"},
            "notes": f"{name}は大雪地区広域連合が国保運営。令和8年度 北海道公表の市町村標準保険料率(#177 大雪地区広域連合)を3町共通の参考値として採用。3方式・資産割なし。子育て分は18歳以上均等割(100円・合計1,100円)を省いたフラット暫定(perCapita=base1,000)。連合の実料率は毎年6月下旬決定→告示後 verified_r8 へ昇格(watchUrl=連合ページ)。"},
        "childcareLevy": {"rate": 0.0029, "perCapita": 1000, "household": 1000, "cap": 30000}
    }

reg = json.load(open(REGISTRY))
existing = {m["citySlug"] for m in reg["municipalities"]}
created_files, added_reg = [], []
for slug, code, name in TOWNS:
    d = os.path.join(MUNI, slug)
    if not DRY: os.makedirs(d, exist_ok=True)
    for year, fn, builder in [(2025, "kokuho-2025.json", r7), (2026, "kokuho-2026.json", r8)]:
        p = os.path.join(d, fn)
        nd = builder(slug, code, name)
        if not DRY:
            json.dump(nd, open(p, "w"), ensure_ascii=False, indent=2); open(p, "a").write("\n")
        created_files.append(p.replace(ROOT+"/", ""))
    if slug not in existing:
        reg["municipalities"].append({"cityCode": code, "citySlug": slug, "cityName": name,
            "prefecture": "北海道", "prefectureSlug": "hokkaido", "systems": ["kokuho"],
            "publishYear": {"kokuho": 2026}})
        added_reg.append(f"{name}({slug}/{code})")
    else:
        added_reg.append(f"{name} 既存registry(スキップ)")

if not DRY:
    shutil.copyfile(REGISTRY, REGISTRY + ".bak2")
    json.dump(reg, open(REGISTRY, "w"), ensure_ascii=False, indent=2); open(REGISTRY, "a").write("\n")

print(f"{'[DRY-RUN] ' if DRY else '[APPLIED] '}大雪3町 新規収録")
print("  作成ファイル:", created_files)
print("  registry追加:", added_reg)
