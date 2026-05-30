#!/usr/bin/env python3
"""
apply-cityslug-fixes.py

`docs/cityslug-mismatch-enumeration-2026-05-24.md` の P1b / P2 / P5 パターンを
target md (r8-values-collected-*.md) に word-boundary 安全に一括適用する。

特徴:
  - sed の `\\b` は CJK 隣接時に意図しない誤マッチを起こすことがあるが、本スクリプトは
    Python の re.sub で「英数 or `-` で囲まれない slug 候補」のみ置換する
  - 置換前に diff(行単位)を生成して `--dry-run` で確認可能
  - 適用後に verify-citycode-cityslug.py を自動再実行する `--auto-verify` オプション
  - 修正ログ(SOP §5)に追記する 1 件 1 エントリの md を `--correction-log-out` で出力可能

使い方:
  # dry-run(変更内容を表示するだけ、ファイル書き換えなし)
  python3 scripts/apply-cityslug-fixes.py \
    --target r8-values-collected-2026-05-21.md \
    --patterns p1b,p2,p5 \
    --dry-run

  # 実適用 + diff レポート + 修正ログ案
  python3 scripts/apply-cityslug-fixes.py \
    --target r8-values-collected-2026-05-21.md \
    --patterns p1b,p2,p5 \
    --backup-suffix .bak-cityslug-fix \
    --diff-report-out docs/cityslug-fix-diff-$(date +%Y-%m-%d).md \
    --correction-log-out docs/correction-logs/correction-log-citycode-cityslug-$(date +%Y-%m-%d).md

  # 適用 + verify 再実行(全部入り)
  python3 scripts/apply-cityslug-fixes.py \
    --target r8-values-collected-2026-05-21.md \
    --patterns p1b,p2,p5 \
    --backup-suffix .bak-cityslug-fix \
    --auto-verify \
    --canonical docs/canonical/soumu-citycode-2026-05-24.csv \
    --registry  registry/index.json
"""

from __future__ import annotations

import argparse
import difflib
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


# --------------------------------------------------------------------------
# パッチ定義(docs/cityslug-mismatch-enumeration-2026-05-24.md と同期)
# --------------------------------------------------------------------------

# P1b: 県名同名市 -city suffix 残り 18 件(2026-05-23 で fix 済 11 件は除外)
P1B = [
    ("aomoricity",     "aomori",     "02201", "青森市"),
    ("akitacity",      "akita",      "05201", "秋田市"),
    ("tochigicity",    "tochigi",    "09203", "栃木市"),
    ("chibacity",      "chiba",      "12100", "千葉市"),
    ("toyamacity",     "toyama",     "16201", "富山市"),
    ("fukuicity",      "fukui",      "18201", "福井市"),
    ("yamanashicity",  "yamanashi",  "19205", "山梨市"),
    ("naganocity",     "nagano",     "20201", "長野市"),
    ("gifucity",       "gifu",       "21201", "岐阜市"),
    ("osakacity",      "osaka",      "27100", "大阪市"),
    ("naracity",       "nara",       "29201", "奈良市"),
    ("tottoricity",    "tottori",    "31201", "鳥取市"),
    ("okayamacity",    "okayama",    "33100", "岡山市"),
    ("yamaguchicity",  "yamaguchi",  "35203", "山口市"),
    ("tokushimacity",  "tokushima",  "36201", "徳島市"),
    ("kochicity",      "kochi",      "39201", "高知市"),
    ("fukuokacity",    "fukuoka",    "40130", "福岡市"),
    ("nagasakicity",   "nagasaki",   "42201", "長崎市"),
]

# P2: ハイフン disambiguator を md がフラット連結している 22 件
P2 = [
    ("kamikawahokkaido",   "kamikawa-hokkaido",   "01457", "上川町(北海道)"),
    ("nakagawahokkaido",   "nakagawa-hokkaido",   "01471", "中川町(北海道)"),
    ("esashihokkaido",     "esashi-hokkaido",     "01514", "枝幸町(北海道)"),
    ("hidakahokkaido",     "hidaka-hokkaido",     "01601", "日高町(北海道)"),
    ("ikedahokkaido",      "ikeda-hokkaido",      "01644", "池田町(北海道)"),
    ("kushirotown",        "kushiro-town",        "01661", "釧路町(北海道)"),
    ("shibetsuhokkaido",   "shibetsu-hokkaido",   "01693", "標津町(北海道)"),
    ("tomarikunashir",     "tomari-kunashir",     "01696", "泊村(北海道)"),
    ("kogaibaraki",        "koga-ibaraki",        "08204", "古河市(茨城県)"),
    ("otagunma",           "ota-gunma",           "10205", "太田市(群馬県)"),
    ("ichinomiyachiba",    "ichinomiya-chiba",    "12421", "一宮町(千葉県)"),
    ("nakanoku",           "nakano-ku",           "13114", "中野区(東京都)"),
    ("tateyamatoyama",     "tateyama-toyama",     "16323", "立山町(富山県)"),
    ("minamialps",         "minami-alps",         "19208", "南アルプス市(山梨県)"),
    ("hokutoyamanashi",    "hokuto-yamanashi",    "19209", "北杜市(山梨県)"),
    ("chuoyamanashi",      "chuo-yamanashi",      "19214", "中央市(山梨県)"),
    ("nanbumachitottori",  "nanbumachi-tottori",  "31389", "南部町(鳥取県)"),
    ("kofutottori",        "kofu-tottori",        "31403", "江府町(鳥取県)"),
    ("misatoshimane",      "misato-shimane",      "32448", "美郷町(島根県)"),
    ("konankochi",         "konan-kochi",         "39211", "香南市(高知県)"),
    ("kamikochi",          "kami-kochi",          "39212", "香美市(高知県)"),
    ("kashimasaga",        "kashima-saga",        "41207", "鹿島市(佐賀県)"),
]

# P5: registry が -city suffix を持つ(SOP §3.5 例外)。md が base のみで書いていれば違反。
# 注: 「正典 registry 実体」に合わせるため md → registry 方向のみ適用。
P5 = [
    ("yuzawa",     "yuzawacity",   "05207", "湯沢市(秋田県)"),
    ("daisen",     "daisencity",   "05212", "大仙市(秋田県)"),
    ("yamagata",   "yamagatacity", "06201", "山形市(山形県)"),
    ("shinjo",     "shinjocity",   "06205", "新庄市(山形県)"),
]

# P3a: suffix 維持型 49 件(canonical kana で base 厳密判定済、base が他自治体と非衝突)。
# md が base のみで書いていれば registry の suffix 保持版に書き直す。
# ⚠ 注意: opt-in 専用。base が URL や注釈で出現する場合に誤書き換えする可能性ゼロではない。
#   `--patterns p3a` を含める時は必ず --dry-run で diff 全件確認すること。
P3A = [
    ('aka',                'akamura',                '40609', '赤村(福岡県)'),
    ('okinawa',            'okinawashi',             '47211', '沖縄市(沖縄県)'),
    ('ginan',              'ginancho',               '21302', '岐南町(岐阜県)'),
    ('kasamatsu',          'kasamatsucho',           '21303', '笠松町(岐阜県)'),
    ('tarui',              'taruicho',               '21361', '垂井町(岐阜県)'),
    ('sekigahara',         'sekigaharacho',          '21362', '関ケ原町(岐阜県)'),
    ('uki',                'ukishi',                 '43213', '宇城市(熊本県)'),
    ('iwate',              'iwatemachi',             '03303', '岩手町(岩手県)'),
    ('noto',               'notocho',                '17463', '能登町(石川県)'),
    ('kosaka',             'kosakacho',              '05303', '小坂町(秋田県)'),
    ('kamikoani',          'kamikoanicho',           '05327', '上小阿仁村(秋田県)'),
    ('fujisato',           'fujisatomachi',          '05346', '藤里町(秋田県)'),
    ('ikawa',              'ikawacho',               '05366', '井川町(秋田県)'),
    ('ugo',                'ugocho',                 '05463', '羽後町(秋田県)'),
    ('higashinaruse',      'higashinarusemura',      '05464', '東成瀬村(秋田県)'),
    ('nakayama',           'nakayamacho',            '06302', '中山町(山形県)'),
    ('ichikawamisato',     'ichikawamisatomachi',    '19346', '市川三郷町(山梨県)'),
    ('hayakawa',           'hayakawamachi',          '19364', '早川町(山梨県)'),
    ('fujikawa',           'fujikawamachi',          '19368', '富士川町(山梨県)'),
    ('oshino',             'oshinomura',             '19424', '忍野村(山梨県)'),
    ('kosuge',             'kosugemura',             '19442', '小菅村(山梨県)'),
    ('tabayama',           'tabayamamura',           '19443', '丹波山村(山梨県)'),
    ('iwami',              'iwamimachi',             '31302', '岩美町(鳥取県)'),
    ('wakasa',             'wakasacho',              '31325', '若桜町(鳥取県)'),
    ('chizu',              'chizucho',               '31328', '智頭町(鳥取県)'),
    ('chibu',              'chibumura',              '32527', '知夫村(島根県)'),
    ('naoshima',           'naoshimamachi',          '37364', '直島町(香川県)'),
    ('utazu',              'utazumachi',             '37386', '宇多津町(香川県)'),
    ('ayagawa',            'ayagawamachi',           '37387', '綾川町(香川県)'),
    ('kotohira',           'kotohiramachi',          '37403', '琴平町(香川県)'),
    ('tadotsu',            'tadotsumachi',           '37404', '多度津町(香川県)'),
    ('nahari',             'naharimachi',            '39302', '奈半利町(高知県)'),
    ('tano',               'tanomachi',              '39303', '田野町(高知県)'),
    ('yasuda',             'yasudamachi',            '39304', '安田町(高知県)'),
    ('kitagawa',           'kitagawamura',           '39305', '北川村(高知県)'),
    ('umaji',              'umajimura',              '39306', '馬路村(高知県)'),
    ('motoyama',           'motoyamamachi',          '39341', '本山町(高知県)'),
    ('ino',                'inomachi',               '39386', 'いの町(高知県)'),
    ('niyodogawa',         'niyodogawamachi',        '39387', '仁淀川町(高知県)'),
    ('nakatosa',           'nakatosamachi',          '39401', '中土佐町(高知県)'),
    ('sakawa',             'sakawamachi',            '39402', '佐川町(高知県)'),
    ('ochi',               'ochimachi',              '39403', '越知町(高知県)'),
    ('yusuhara',           'yusuharamachi',          '39405', '梼原町(高知県)'),
    ('kuroshio',           'kuroshiomachi',          '39428', '黒潮町(高知県)'),
    ('yoshinogari',        'yoshinogaricho',         '41327', '吉野ヶ里町(佐賀県)'),
    ('kiyama',             'kiyamamachi',            '41341', '基山町(佐賀県)'),
    ('miyaki',             'miyakimachi',            '41346', 'みやき町(佐賀県)'),
    ('genkai',             'genkaimachi',            '41387', '玄海町(佐賀県)'),
    ('arita',              'aritamachi',             '41401', '有田町(佐賀県)'),
]


@dataclass
class PatchEntry:
    pattern_id: str   # "P1b" / "P2" / "P5"
    wrong: str        # md にあれば誤りの slug
    correct: str      # 修正後の registry 実体 slug
    city_code: str
    city_name: str


def collect_patches(names: list[str]) -> list[PatchEntry]:
    sources = {
        "p1b": ("P1b", P1B),
        "p2":  ("P2",  P2),
        "p5":  ("P5",  P5),
        "p3a": ("P3a", P3A),
    }
    out: list[PatchEntry] = []
    for n in names:
        if n.lower() not in sources:
            raise SystemExit(f"unknown pattern: {n} (choose from p1b,p2,p5,p3a)")
        pid, lst = sources[n.lower()]
        for w, c, code, name in lst:
            out.append(PatchEntry(pid, w, c, code, name))
    return out


# --------------------------------------------------------------------------
# 置換ロジック
# --------------------------------------------------------------------------

def make_pattern(slug: str) -> re.Pattern:
    """`slug` を「英数 / アンダースコア / `-` / URL 構成文字 で囲まれていない」位置でのみマッチさせる。

    重要: URL 内 (`town.ino.kochi.jp` 等) のホスト名部分の誤書き換えを防ぐため、
    前後の禁止文字に `.` / `/` / `:` を含める。これにより、URL のホスト要素や
    パス要素として登場する slug 候補は置換対象外となる。

    md 内で正規に citySlug が書かれる文脈(`| ino |` テーブルセル、`` `ino` `` バックティック内、
    スペース・改行隣接など)は依然マッチする。
    """
    return re.compile(
        r"(?<![A-Za-z0-9_\-./:])" + re.escape(slug) + r"(?![A-Za-z0-9_\-./:])"
    )


def apply_patches(text: str, patches: list[PatchEntry]) -> tuple[str, list[tuple[PatchEntry, int]]]:
    """順に置換し、各 patch がヒットした件数を返す。"""
    counts: list[tuple[PatchEntry, int]] = []
    for p in patches:
        pat = make_pattern(p.wrong)
        new_text, n = pat.subn(p.correct, text)
        text = new_text
        counts.append((p, n))
    return text, counts


def line_diff(before: str, after: str, fromfile: str, tofile: str) -> str:
    return "".join(difflib.unified_diff(
        before.splitlines(keepends=True),
        after.splitlines(keepends=True),
        fromfile=fromfile,
        tofile=tofile,
        n=2,
    ))


# --------------------------------------------------------------------------
# 修正ログ生成
# --------------------------------------------------------------------------

CORRECTION_LOG_TEMPLATE = """### {pattern_id}-{idx:02d} cityCode={code} {name}

**発覚日:** 2026-05-23(correction-log で 163 件不一致として記録)
**確定日:** {today}
**発覚契機:** scripts/apply-cityslug-fixes.py + verify-citycode-cityslug.py
**修正前 (md):**
- citySlug: `{wrong}`
**修正後 (md):**
- citySlug: `{correct}`
**正典 source:**
- `registry/index.json` cityCode `{code}` (citySlug = `{correct}`)
- 補強: `docs/canonical/soumu-citycode-2026-05-24.csv` ({name} の cityName 一致確認)
**修正の根拠:**
- SOP §3.2 Step 1: registry 実体を canonical とする
- {rationale}
**registry 修正の必要性:** **不要**(registry が正)
**ヒット件数 (本 patch 適用時):** {hits}
**関連 INCIDENTS:** #6
"""


def gen_correction_log(patches_with_counts: list[tuple[PatchEntry, int]], today: str) -> str:
    rationale_by_pattern = {
        "P1b": "県名同名市の -city suffix は handoff-2026-05-22 規則に基づき推定値を md に書いていたが、registry 実体が suffix なし → registry に合わせる",
        "P2":  "registry は同名衝突回避のためハイフン区切り disambiguator を採用。md がフラット連結していたため不一致 → registry のハイフン形式に統一",
        "P5":  "registry が SOP §3.5 例外として -city suffix を保持(同読み他自治体との衝突回避)。md が base のみだったため不一致 → registry 実体に合わせる",
        "P3a": "canonical cityNameKana から行政接尾辞を剝離した base が registry slug の prefix と一致し、registry が suffix(machi/cho/mura/shi 等)を保持。md が base のみで書いていたため不一致 → registry の suffix 保持版に合わせる",
    }
    lines: list[str] = [
        f"# 修正ログ: cityCode × citySlug × cityName × source URL — {today}",
        "",
        f"**起票:** {today}(scripts/apply-cityslug-fixes.py 適用、SOP §5 準拠)",
        "**対象ファイル:** `r8-values-collected-2026-05-21.md`",
        "**SOP バージョン:** 2026-05-23 初版",
        f"**前日ログ:** `correction-log-citycode-cityslug-2026-05-24.md`",
        "",
        "## サマリ",
        "",
        "| パターン | 適用件数 | ヒット件数合計 |",
        "|---|---|---|",
    ]
    by_pattern: dict[str, list[tuple[PatchEntry, int]]] = {}
    for p, n in patches_with_counts:
        by_pattern.setdefault(p.pattern_id, []).append((p, n))
    for pid, items in by_pattern.items():
        applied = sum(1 for _, n in items if n > 0)
        total_hits = sum(n for _, n in items)
        lines.append(f"| {pid} | {applied}/{len(items)} | {total_hits} |")

    lines.append("")
    lines.append("---")
    lines.append("")
    idx_per_pattern: dict[str, int] = {}
    for p, n in patches_with_counts:
        if n == 0:
            continue
        idx_per_pattern.setdefault(p.pattern_id, 0)
        idx_per_pattern[p.pattern_id] += 1
        lines.append(CORRECTION_LOG_TEMPLATE.format(
            pattern_id=p.pattern_id,
            idx=idx_per_pattern[p.pattern_id],
            code=p.city_code,
            name=p.city_name,
            today=today,
            wrong=p.wrong,
            correct=p.correct,
            rationale=rationale_by_pattern.get(p.pattern_id, ""),
            hits=n,
        ))
    return "\n".join(lines)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--target", required=True, type=Path,
                   help="r8-values-collected-*.md 等の置換対象 md")
    p.add_argument("--patterns", default="p1b,p2,p5",
                   help="適用パターン(カンマ区切り、選択肢: p1b / p2 / p5)")
    p.add_argument("--dry-run", action="store_true",
                   help="ファイルを書き換えず、ヒット件数と diff だけ表示")
    p.add_argument("--backup-suffix", default=".bak-cityslug-fix",
                   help="バックアップサフィックス(--dry-run でないとき)")
    p.add_argument("--diff-report-out", type=Path, default=None,
                   help="unified diff を md ファイルに保存(レビュー用)")
    p.add_argument("--correction-log-out", type=Path, default=None,
                   help="SOP §5 形式の修正ログを md ファイルに保存(その日の log として)")
    p.add_argument("--auto-verify", action="store_true",
                   help="適用後に scripts/verify-citycode-cityslug.py を自動実行")
    p.add_argument("--canonical", type=Path, default=None,
                   help="--auto-verify 用、verify への引き渡し")
    p.add_argument("--registry", type=Path, default=None,
                   help="--auto-verify 用、verify への引き渡し")
    args = p.parse_args(argv)

    if not args.target.exists():
        print(f"[error] target not found: {args.target}", file=sys.stderr)
        return 2

    patterns = [s.strip() for s in args.patterns.split(",") if s.strip()]
    patches = collect_patches(patterns)
    before = args.target.read_text(encoding="utf-8")
    after, counts = apply_patches(before, patches)

    total_hits = sum(n for _, n in counts)
    print(f"[info] target: {args.target}")
    print(f"[info] patterns: {patterns}")
    print(f"[info] patches: {len(patches)}, total hits: {total_hits}")

    # per-patch report
    print(f"\n[patch results]")
    for p_entry, n in counts:
        mark = "OK" if n > 0 else "..."
        print(f"  {mark} [{p_entry.pattern_id}] {p_entry.city_code} {p_entry.city_name}: "
              f"`{p_entry.wrong}` -> `{p_entry.correct}` x{n}")

    if total_hits == 0:
        print("\n[info] no patches applied — target md may already be clean (or patterns don't appear)")
        return 0

    diff_text = line_diff(before, after, str(args.target) + ".before", str(args.target) + ".after")

    if args.diff_report_out:
        args.diff_report_out.parent.mkdir(parents=True, exist_ok=True)
        args.diff_report_out.write_text(
            f"# cityslug fix diff — {datetime.now().isoformat(timespec='seconds')}\n\n"
            f"target: `{args.target}`\n\npatterns: `{args.patterns}`\n\ntotal hits: {total_hits}\n\n"
            "```diff\n" + diff_text + "```\n",
            encoding="utf-8",
        )
        print(f"[info] wrote diff report: {args.diff_report_out}")

    if args.dry_run:
        print("\n[dry-run] file NOT modified")
        print("\n[diff preview (first 40 lines)]")
        for line in diff_text.splitlines()[:40]:
            print(line)
        return 0

    # backup + write
    backup = args.target.with_suffix(args.target.suffix + args.backup_suffix)
    backup.write_text(before, encoding="utf-8")
    args.target.write_text(after, encoding="utf-8")
    print(f"\n[info] wrote {args.target}, backup: {backup}")

    if args.correction_log_out:
        today = datetime.now().strftime("%Y-%m-%d")
        log_text = gen_correction_log(counts, today)
        args.correction_log_out.parent.mkdir(parents=True, exist_ok=True)
        args.correction_log_out.write_text(log_text, encoding="utf-8")
        print(f"[info] wrote correction log: {args.correction_log_out}")

    if args.auto_verify:
        if not args.canonical or not args.registry:
            print("[error] --auto-verify requires --canonical and --registry", file=sys.stderr)
            return 2
        script = Path(__file__).parent / "verify-citycode-cityslug.py"
        verify_out = args.target.parent / f"verification-report-after-fixes-{datetime.now().strftime('%Y-%m-%d')}.md"
        cmd = [
            "python3", str(script),
            "--canonical", str(args.canonical),
            "--registry",  str(args.registry),
            "--target",    str(args.target),
            "--output",    str(verify_out),
        ]
        print(f"\n[info] running verify: {' '.join(cmd)}")
        r = subprocess.run(cmd)
        return r.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
