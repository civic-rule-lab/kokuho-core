#!/usr/bin/env python3
"""
総務省コード snapshot (data/reference/soumu-jichitai-codes.json) から
citycode 正準 CSV (docs/canonical/soumu-citycode-{date}.csv) を生成する。

POLICIES §10「cityCode 一次資料準拠ルール」の正準テーブルを、
verify-citycode-cityslug.py が読む CSV 形式で外出しするための派生スクリプト。
JSON snapshot が一次資料、本 CSV はその忠実なダンプ（加工なし）。

Usage:
  python3 scripts/build-canonical-citycode-csv.py
  python3 scripts/build-canonical-citycode-csv.py --date 2026-05-24
  python3 scripts/build-canonical-citycode-csv.py --snapshot path/to.json --out path/to.csv

CSV columns:
  code5,code6,prefecture,cityName,cityKana,prefectureKana,isPrefecture
"""

import argparse
import csv
import datetime
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SNAPSHOT = ROOT / "data" / "reference" / "soumu-jichitai-codes.json"

FIELDS = [
    "code5",
    "code6",
    "prefecture",
    "cityName",
    "cityKana",
    "prefectureKana",
    "isPrefecture",
]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--snapshot", type=Path, default=DEFAULT_SNAPSHOT,
                    help="総務省コード JSON snapshot (default: %(default)s)")
    ap.add_argument("--date", default=None,
                    help="出力ファイル名の日付サフィックス YYYY-MM-DD (default: 今日)")
    ap.add_argument("--out", type=Path, default=None,
                    help="出力 CSV パス（指定時は --date を無視）")
    args = ap.parse_args()

    if not args.snapshot.exists():
        print(f"❌ snapshot 不在: {args.snapshot}", file=sys.stderr)
        print("   scripts/parse-soumu-xlsx.py で総務省 .xls を取り込んでから再実行してください。", file=sys.stderr)
        return 2

    data = json.loads(args.snapshot.read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    if not entries:
        print(f"❌ snapshot に entries がありません: {args.snapshot}", file=sys.stderr)
        return 2

    if data.get("partialCoverage") is True:
        print("⚠️  snapshot は partialCoverage:true — 生成 CSV はカバレッジ不完全です。", file=sys.stderr)

    date = args.date or datetime.date.today().isoformat()
    out = args.out or (ROOT / "docs" / "canonical" / f"soumu-citycode-{date}.csv")
    out.parent.mkdir(parents=True, exist_ok=True)

    n = 0
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        w.writeheader()
        for e in entries:
            w.writerow({
                "code5": e.get("code5", ""),
                "code6": e.get("code6", ""),
                "prefecture": e.get("prefecture", ""),
                "cityName": e.get("cityName", ""),
                "cityKana": e.get("cityKana", ""),
                "prefectureKana": e.get("prefectureKana", ""),
                "isPrefecture": "true" if e.get("isPrefecture") else "false",
            })
            n += 1

    cities = sum(1 for e in entries if not e.get("isPrefecture"))
    print(f"✅ {out.relative_to(ROOT)}")
    print(f"   source     : {data.get('source', '?')}")
    print(f"   sourceTitle: {data.get('sourceTitle', '?')}")
    print(f"   fetchedAt  : {data.get('fetchedAt', '?')}")
    print(f"   rows       : {n} (うち市区町村 {cities} / 都道府県 {n - cities})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
