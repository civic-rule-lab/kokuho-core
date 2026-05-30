#!/usr/bin/env python3
"""
aggregate-r8-verified.py

data/municipalities/<slug>/kokuho-2026.json から R8 verified 自治体を抽出し、
人が読める md と機械読み用 json の両方で集約出力する。

Usage:
  cd ~/Desktop/kokuho-core
  python3 scripts/aggregate-r8-verified.py
  python3 scripts/aggregate-r8-verified.py --include-provisional
  python3 scripts/aggregate-r8-verified.py --output-md docs/r8-verified-2026-05-25.md
"""

import argparse
import json
import glob
import sys
from datetime import datetime
from pathlib import Path
from collections import defaultdict


def load_prefecture_map(registry_path: Path) -> dict:
    """registry/index.json から citySlug -> prefecture のマップを作る"""
    try:
        d = json.loads(registry_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[warn] registry 読み込み失敗: {e}", file=sys.stderr)
        return {}
    result = {}
    munis = d.get('municipalities') or d.get('items') or []
    for m in munis:
        slug = m.get('citySlug') or m.get('slug')
        pref = m.get('prefecture') or m.get('prefectureName') or m.get('prefectureSlug') or '?'
        if slug:
            result[slug] = pref
    return result


def fmt_rate(r):
    if r is None:
        return "—"
    return f"{r*100:.2f}%"


def fmt_yen(n):
    if n is None:
        return "—"
    if n == 0:
        return "0"
    return f"{n:,}"


def build_row(path: str, d: dict, pref_map: dict, confidence: str) -> dict:
    slug = d.get('citySlug') or path.split('/')[-2]
    meta = d.get('meta', {})
    lc = meta.get('lifecycle', {})
    return {
        'slug': slug,
        'cityCode': d.get('cityCode') or '?????',
        'cityName': d.get('cityName') or slug,
        'prefecture': pref_map.get(slug, '?'),
        'rate': d.get('rate', {}) or {},
        'perCapita': d.get('perCapita', {}) or {},
        'household': d.get('household', {}) or {},
        'caps': d.get('caps', {}) or {},
        'childcare': d.get('childcare', {}) or {},
        'confidence': confidence,
        'r8Stage': lc.get('r8Stage'),
        'sourceStatus': lc.get('sourceStatus'),
        'sourceUrls': lc.get('sourceUrls') or [],
        'verifiedAt': lc.get('verifiedAt'),
        'verificationLevel': lc.get('verificationLevel'),
        'dataVersion': meta.get('dataVersion'),
    }


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--root", default=".", help="kokuho-core ルート(デフォルト: cwd)")
    p.add_argument("--output-md", type=Path, default=None,
                   help="md 出力先(デフォルト: docs/r8-verified-aggregated-YYYY-MM-DD.md)")
    p.add_argument("--output-json", type=Path, default=None,
                   help="json 出力先(デフォルト: docs/r8-verified-aggregated-YYYY-MM-DD.json)")
    p.add_argument("--include-provisional", action="store_true",
                   help="provisional ステータスも含める")
    args = p.parse_args()

    root = Path(args.root).resolve()
    today = datetime.now().strftime("%Y-%m-%d")
    out_md = args.output_md or (root / "docs" / f"r8-verified-aggregated-{today}.md")
    out_json = args.output_json or (root / "docs" / f"r8-verified-aggregated-{today}.json")

    if not (root / "data" / "municipalities").exists():
        print(f"[error] {root}/data/municipalities が見つかりません。--root を指定してください。", file=sys.stderr)
        return 2

    pref_map = load_prefecture_map(root / "registry" / "index.json")

    rows = []
    skipped = []
    paths = sorted(glob.glob(str(root / "data" / "municipalities" / "*" / "kokuho-2026.json")))
    for path in paths:
        try:
            d = json.loads(Path(path).read_text(encoding="utf-8"))
        except Exception as e:
            skipped.append((path, str(e)))
            continue
        meta = d.get('meta', {})
        status = meta.get('status')
        if status == 'verified':
            rows.append(build_row(path, d, pref_map, 'verified'))
        elif status == 'provisional' and args.include_provisional:
            rows.append(build_row(path, d, pref_map, 'provisional'))

    # group by prefecture, sort by cityCode
    by_pref = defaultdict(list)
    for r in rows:
        by_pref[r['prefecture']].append(r)
    for k in by_pref:
        by_pref[k].sort(key=lambda r: r['cityCode'])

    verified_count = sum(1 for r in rows if r['confidence'] == 'verified')
    provisional_count = sum(1 for r in rows if r['confidence'] == 'provisional')
    r8stage_count = sum(1 for r in rows if r['r8Stage'] == 'verified_r8')
    inconsistent = [r for r in rows if r['confidence'] == 'verified' and r['r8Stage'] != 'verified_r8']

    # ============ Markdown 出力 ============
    md = []
    md.append(f"# R8 verified 自治体 料率集約 — {today}")
    md.append("")
    md.append(f"**生成元:** `{root.name}/data/municipalities/<slug>/kokuho-2026.json`")
    md.append(f"**抽出条件:** `meta.status` が `verified`" + (" または `provisional`" if args.include_provisional else ""))
    md.append(f"**自治体数:** {len(rows)} 件")
    md.append(f"  - verified: {verified_count}")
    if args.include_provisional:
        md.append(f"  - provisional: {provisional_count}")
    md.append(f"  - うち `meta.lifecycle.r8Stage = verified_r8`: {r8stage_count} 件")
    md.append(f"**生成日時:** {datetime.now().isoformat(timespec='seconds')}")
    md.append(f"**スキャン JSON 数:** {len(paths)} 件")
    if skipped:
        md.append(f"**読込失敗:** {len(skipped)} 件 (末尾に list)")
    md.append("")

    # データ整合性警告
    if inconsistent:
        md.append(f"## ⚠ 整合性警告: status=verified だが r8Stage != verified_r8 が {len(inconsistent)} 件")
        md.append("")
        md.append("これらは `meta.status` は `verified` だが `meta.lifecycle.r8Stage` が `verified_r8` ではない。")
        md.append("おそらく lifecycle 構造の retrofit (PR #2 など) が未完。次回 retrofit 対象。")
        md.append("")
        md.append("| citySlug | cityName | r8Stage 実値 |")
        md.append("|---|---|---|")
        for r in sorted(inconsistent, key=lambda r: r['cityCode']):
            md.append(f"| {r['slug']} | {r['cityName']} | `{r['r8Stage'] or 'NONE'}` |")
        md.append("")

    md.append("---")
    md.append("")
    md.append("## 凡例")
    md.append("")
    md.append("各料率列 (医療 / 後期支援 / 介護) は次の 4 値を ` / ` 区切りで並べた:")
    md.append("")
    md.append("```")
    md.append("所得割率 / 均等割 / 平等割 / 賦課限度額")
    md.append("```")
    md.append("")
    md.append("子育て分は cap (限度額) のみ表示。値 `—` は未設定 (household=0 は `0` 表示)。")
    md.append("")
    md.append("---")
    md.append("")

    # 都道府県ごとのテーブル
    for pref in sorted(by_pref.keys()):
        prows = by_pref[pref]
        md.append(f"## {pref} ({len(prows)} 自治体)")
        md.append("")
        md.append("| cityCode | citySlug | 自治体 | 医療 | 後期支援 | 介護 | 子育てcap | sourceStatus | verifiedAt | r8Stage |")
        md.append("|---|---|---|---|---|---|---|---|---|---|")
        for r in prows:
            med = f"{fmt_rate(r['rate'].get('medical'))} / {fmt_yen(r['perCapita'].get('medical'))} / {fmt_yen(r['household'].get('medical'))} / {fmt_yen(r['caps'].get('medical'))}"
            sup = f"{fmt_rate(r['rate'].get('support'))} / {fmt_yen(r['perCapita'].get('support'))} / {fmt_yen(r['household'].get('support'))} / {fmt_yen(r['caps'].get('support'))}"
            care = f"{fmt_rate(r['rate'].get('care'))} / {fmt_yen(r['perCapita'].get('care'))} / {fmt_yen(r['household'].get('care'))} / {fmt_yen(r['caps'].get('care'))}"
            cc_cap = fmt_yen(r['caps'].get('childcare'))
            ss = r.get('sourceStatus') or '—'
            vat = r.get('verifiedAt') or '—'
            r8s = r.get('r8Stage') or '—'
            md.append(f"| {r['cityCode']} | {r['slug']} | {r['cityName']} | {med} | {sup} | {care} | {cc_cap} | {ss} | {vat} | {r8s} |")
        md.append("")

    # ソース URL 一覧 (公開用)
    md.append("---")
    md.append("")
    md.append("## ソース URL 一覧")
    md.append("")
    for pref in sorted(by_pref.keys()):
        for r in by_pref[pref]:
            urls = r.get('sourceUrls') or []
            if not urls:
                continue
            md.append(f"### {r['cityCode']} {r['cityName']} ({pref})")
            for u in urls:
                md.append(f"- {u}")
            md.append("")

    if skipped:
        md.append("---")
        md.append("")
        md.append("## 読込失敗ファイル")
        md.append("")
        for path, err in skipped:
            md.append(f"- `{path}` — {err}")
        md.append("")

    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text("\n".join(md), encoding="utf-8")

    # ============ JSON 出力(機械可読) ============
    out_data = {
        "generatedAt": datetime.now().isoformat(timespec='seconds'),
        "generatedBy": "scripts/aggregate-r8-verified.py",
        "scope": {
            "filter": "meta.status in [verified" + (", provisional" if args.include_provisional else "") + "]",
            "scannedJsonCount": len(paths),
            "matchedCount": len(rows),
            "verifiedCount": verified_count,
            "provisionalCount": provisional_count,
            "r8StageVerifiedCount": r8stage_count,
            "inconsistentCount": len(inconsistent),
        },
        "municipalities": rows,
        "inconsistentSlugs": [r['slug'] for r in inconsistent],
        "loadFailures": [{"path": p, "error": e} for p, e in skipped],
    }
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(out_data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[ok] Wrote md  : {out_md}")
    print(f"[ok] Wrote json: {out_json}")
    print(f"[info] verified: {verified_count} / provisional: {provisional_count}")
    print(f"[info] r8Stage=verified_r8: {r8stage_count}")
    if inconsistent:
        print(f"[warn] status=verified ⊃ r8Stage!=verified_r8 が {len(inconsistent)} 件 (md 内に詳細)")
    if skipped:
        print(f"[warn] 読込失敗: {len(skipped)} 件")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
