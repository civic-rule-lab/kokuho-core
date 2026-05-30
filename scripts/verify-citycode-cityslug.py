#!/usr/bin/env python3
"""
verify-citycode-cityslug.py

SOP `docs/verification-sop-citycode-cityslug.md` §4 準拠の検証スクリプト。

入力:
  --canonical PATH   docs/canonical/soumu-citycode-*.csv (SOP §2.3 形式)
  --registry  PATH   registry/index.json (kokuho-core)
  --target    PATH   r8-values-collected-*.md (検証対象)
  --output    PATH   検証レポート md ファイル(出力先)

検証項目(SOP §4.2):
  1. cityCode 形式チェック(5 桁、先頭ゼロ保持)
  2. cityName が canonical と一致
  3. citySlug が registry と一致 / 未登録なら §3.3 規約で算出 + 衝突未発生
  4. source URL の自治体特定性(cityCode / citySlug がURL に含まれる、または cityName がタイトル含む)
  5. 重複 cityCode(target md 内で同一 cityCode が複数行)
  6. 衝突 citySlug(同じ citySlug が異なる cityCode に紐づいている)
  7. 行ずれ(prefectureCode と target md セクション内 prefecture が不一致)

出力: SOP §6 フォーマットの md レポート
終了コード: ERROR が 1 件以上なら 1、それ以外 0
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable


# --------------------------------------------------------------------------
# データ構造
# --------------------------------------------------------------------------

@dataclass
class CanonicalRow:
    city_code: str
    city_name: str
    city_name_kana: str
    prefecture_code: str
    prefecture_name: str
    source_tier: str = ""


@dataclass
class RegistryRow:
    city_code: str
    city_slug: str
    city_name: str
    prefecture: str
    prefecture_slug: str = ""


@dataclass
class TargetRow:
    """target md から抽出した 1 行。"""
    line_no: int
    raw: str
    city_code: str | None = None
    city_slug: str | None = None
    city_name: str | None = None
    source_url: str | None = None
    section_pref: str | None = None
    section_title: str | None = None
    section_kind: str = ""


@dataclass
class Issue:
    line_no: int
    city_code: str | None
    city_name: str | None
    severity: str
    rule_id: str
    message: str


@dataclass
class VerifyResult:
    ok_count: int = 0
    warn_count: int = 0
    error_count: int = 0
    untested_count: int = 0
    issues: list[Issue] = field(default_factory=list)
    untested_codes: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------
# ローダ
# --------------------------------------------------------------------------

def load_canonical(path: Path) -> dict[str, CanonicalRow]:
    out: dict[str, CanonicalRow] = {}
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            code = (r.get("cityCode") or "").strip()
            if not code:
                continue
            out[code] = CanonicalRow(
                city_code=code,
                city_name=(r.get("cityName") or "").strip(),
                city_name_kana=(r.get("cityNameKana") or "").strip(),
                prefecture_code=(r.get("prefectureCode") or "").strip(),
                prefecture_name=(r.get("prefectureName") or "").strip(),
                source_tier=(r.get("sourceTier") or "").strip(),
            )
    return out


def load_registry(path: Path) -> dict[str, RegistryRow]:
    data = json.loads(path.read_text(encoding="utf-8"))
    munis = data.get("municipalities") if isinstance(data, dict) else data
    out: dict[str, RegistryRow] = {}
    for m in munis:
        code = (m.get("cityCode") or "").strip()
        if not code:
            continue
        out[code] = RegistryRow(
            city_code=code,
            city_slug=(m.get("citySlug") or "").strip(),
            city_name=(m.get("cityName") or "").strip(),
            prefecture=(m.get("prefecture") or "").strip(),
            prefecture_slug=(m.get("prefectureSlug") or "").strip(),
        )
    return out


# --------------------------------------------------------------------------
# target md パーサ
# --------------------------------------------------------------------------

PREF_NAMES = {
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
}

# 「### N. 福岡県 …」「## 福岡県」「### 福岡県 #44」「### A 分類 #14 奈良県 大和高田市」等
SECTION_HEADING = re.compile(r"^#{1,6}\s+(.+?)\s*$")

# A 分類冒頭メタ欄 "- **cityCode:** `09201`" / "- **citySlug:** `oita`" / "- **source(…):** https://..."
# 形式: "- **<key>:** <value>" — コロンは ** ... ** の内側
META_LINE = re.compile(
    r'^\s*-\s+\*\*(?P<key>cityCode|citySlug|source(?:\([^)]*\))?):\*\*\s+(?P<value>.+?)\s*$'
)

# 戦略 C 表行 (パイプ区切り) を粗く抽出: 行頭 "|" がある + パイプ列数 >= 4
TABLE_ROW = re.compile(r"^\s*\|(.+)\|\s*$")

# 表内 cityCode セル候補: 5 桁数字
CITY_CODE_5 = re.compile(r"\b\d{5}\b")

# URL
URL_RE = re.compile(r"https?://\S+")


def parse_target_md(path: Path) -> list[TargetRow]:
    """target md を行単位で走査し、検証対象 1 行に 1 TargetRow を生成。

    戦略 C 表 (`| cityCode | cityName | citySlug | rate.medical | ...`) は表 1 行 = 1 TargetRow。
    A 分類「### N. 県名 自治体名(…)」セクションは、直後の cityCode/citySlug/source メタ欄を集約して 1 TargetRow。
    どちらの形式でも、抽出できなかったフィールドは None。
    """
    rows: list[TargetRow] = []
    lines = path.read_text(encoding="utf-8").splitlines()

    current_section_pref: str | None = None
    current_section_title: str | None = None
    # A 分類セクション内の継続中エントリ
    pending: TargetRow | None = None

    # 表ヘッダの列順を覚える
    table_columns: list[str] | None = None

    def flush_pending():
        nonlocal pending
        if pending is None:
            return
        # 実体(cityCode / citySlug / source / cityName のいずれか)を持つエントリのみ採用。
        # それ以外は単なるセクション見出し(「## 福岡県 #44」「## 大分県 A 分類」など)の取り違えなので破棄。
        if any([pending.city_code, pending.city_slug, pending.source_url]) or (
            pending.city_name and re.search(r"[市区町村]", pending.city_name)
        ):
            rows.append(pending)
        pending = None

    for i, line in enumerate(lines, start=1):
        heading = SECTION_HEADING.match(line)
        if heading:
            # 新セクション開始 → 直前の A 分類エントリを確定
            flush_pending()
            title = heading.group(1).strip()
            current_section_title = title
            # 県名抽出
            pref_in_title = next((p for p in PREF_NAMES if p in title), None)
            if pref_in_title:
                current_section_pref = pref_in_title

            # A 分類 / 暫定 / 個別自治体セクションは「### N. 県名 自治体名(…)」または「### A 分類 #N 県名 自治体名」型と推定
            looks_like_a_class = bool(re.search(r"^\d+\.\s|A\s*分類|#\d+", title))
            if looks_like_a_class and pref_in_title:
                pending = TargetRow(
                    line_no=i,
                    raw=line,
                    section_pref=current_section_pref,
                    section_title=current_section_title,
                    section_kind="a-class",
                )
                # 自治体名は title から県名を取り除いた残りから推定(最良努力)
                rest = title.replace(pref_in_title, "").strip(" .、,#")
                # 番号や注記の除去
                rest = re.sub(r"^[\d\.#A 分類\s]+", "", rest).strip()
                if rest:
                    pending.city_name = rest.split(" ")[0].split("(")[0].split("（")[0]
            # 表ヘッダ検出のため、表開始は次行以降で判定
            table_columns = None
            continue

        # A 分類メタ欄
        if pending is not None:
            m = META_LINE.match(line)
            if m:
                key = m.group("key")
                val = m.group("value").strip()
                if key == "cityCode":
                    # 先頭ゼロ保持の 5 桁数字を期待。バックティック等の囲みは無視
                    m2 = re.search(r"\d{4,6}", val)
                    if m2:
                        c = m2.group(0)
                        if len(c) == 4:
                            c = "0" + c
                        pending.city_code = c
                elif key == "citySlug":
                    # 先頭の英小ハイフン形式トークンを抽出 (バックティック等の囲みを無視)
                    m2 = re.search(r"[a-z][a-z0-9\-]*", val)
                    if m2:
                        pending.city_slug = m2.group(0)
                elif key.startswith("source"):
                    urls = URL_RE.findall(val)
                    if urls and pending.source_url is None:
                        pending.source_url = urls[0]
                continue

        # 戦略 C 表行
        table_match = TABLE_ROW.match(line)
        if table_match:
            cells = [c.strip() for c in table_match.group(1).split("|")]
            # ヘッダ行(区切り線「|---|---|...」は二段目)
            if all(set(c) <= {"-", ":"} and c for c in cells):
                # 区切り線、無視
                continue
            # 1 段目(ヘッダ)候補: cells に "cityCode" を含むなら列順記憶
            lower = [c.lower() for c in cells]
            if "citycode" in lower or "cityCode" in cells:
                table_columns = lower
                continue

            # データ行
            if table_columns is None:
                # ヘッダなし: cityCode 列を 5桁数字で推定
                code = None
                slug = None
                name = None
                for c in cells:
                    if code is None and re.fullmatch(r"\d{5}", c):
                        code = c
                    elif name is None and re.search(r"[市区町村]", c):
                        name = c
                    elif slug is None and re.fullmatch(r"[a-z0-9\-]+", c):
                        slug = c
                url = None
                urls_here = URL_RE.findall(line)
                if urls_here:
                    url = urls_here[0]
                if code or slug or name:
                    rows.append(TargetRow(
                        line_no=i, raw=line,
                        city_code=code, city_slug=slug, city_name=name, source_url=url,
                        section_pref=current_section_pref,
                        section_title=current_section_title,
                        section_kind="strategy-c-table",
                    ))
            else:
                # ヘッダ既知: 列順で取得
                def cell(name: str) -> str | None:
                    if name in table_columns:
                        idx = table_columns.index(name)
                        return cells[idx] if idx < len(cells) else None
                    return None

                code_raw = cell("citycode") or ""
                code_m = re.search(r"\d{4,5}", code_raw)
                code = code_m.group(0) if code_m else None
                if code and len(code) == 4:
                    code = "0" + code  # 北海道等で先頭ゼロが落ちている救済
                slug = (cell("cityslug") or "").strip("` ")
                name = (cell("cityname") or "").strip()
                url_col = cell("source") or cell("sourceurl") or ""
                urls_here = URL_RE.findall(line) if not url_col else URL_RE.findall(url_col)
                url = urls_here[0] if urls_here else None
                if code or slug or name:
                    rows.append(TargetRow(
                        line_no=i, raw=line,
                        city_code=code, city_slug=slug or None,
                        city_name=name or None, source_url=url,
                        section_pref=current_section_pref,
                        section_title=current_section_title,
                        section_kind="strategy-c-table",
                    ))
            continue

        # 表終端
        if table_columns is not None and line.strip() == "":
            table_columns = None

    flush_pending()
    return rows


# --------------------------------------------------------------------------
# 検証ロジック
# --------------------------------------------------------------------------

def verify(
    canonical: dict[str, CanonicalRow],
    registry: dict[str, RegistryRow],
    target_rows: list[TargetRow],
) -> VerifyResult:
    res = VerifyResult()

    # 重複 cityCode (item 5)
    code_counts: dict[str, list[TargetRow]] = defaultdict(list)
    for r in target_rows:
        if r.city_code:
            code_counts[r.city_code].append(r)
    for code, rs in code_counts.items():
        if len(rs) > 1:
            for r in rs[1:]:
                res.issues.append(Issue(
                    line_no=r.line_no, city_code=code, city_name=r.city_name,
                    severity="ERROR", rule_id="5-duplicate-citycode",
                    message=f"cityCode={code} が複数行に出現 (他: L{rs[0].line_no})",
                ))

    # 衝突 citySlug (item 6)
    slug_to_codes: dict[str, set[str]] = defaultdict(set)
    slug_first_occurrence: dict[str, TargetRow] = {}
    for r in target_rows:
        if r.city_slug and r.city_code:
            slug_to_codes[r.city_slug].add(r.city_code)
            slug_first_occurrence.setdefault(r.city_slug, r)
    for slug, codes in slug_to_codes.items():
        if len(codes) > 1:
            for r in target_rows:
                if r.city_slug == slug:
                    res.issues.append(Issue(
                        line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                        severity="ERROR", rule_id="6-citySlug-collision",
                        message=f"citySlug={slug} が複数 cityCode に紐付 ({sorted(codes)})",
                    ))

    # 行単位検証 (item 1,2,3,4,7)
    for r in target_rows:
        # item 1: cityCode 形式
        if r.city_code is None:
            res.issues.append(Issue(
                line_no=r.line_no, city_code=None, city_name=r.city_name,
                severity="ERROR", rule_id="1-citycode-missing",
                message="cityCode 欠落",
            ))
            continue
        if not re.fullmatch(r"\d{5}", r.city_code):
            res.issues.append(Issue(
                line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                severity="ERROR", rule_id="1-citycode-format",
                message=f"cityCode={r.city_code!r} が 5 桁形式違反",
            ))
            continue

        canon = canonical.get(r.city_code)
        reg = registry.get(r.city_code)

        # item 2: cityName が canonical と一致
        if canon is None:
            # 未検証扱い
            res.untested_codes.append(r.city_code)
            res.issues.append(Issue(
                line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                severity="WARN", rule_id="2-canonical-missing",
                message=f"cityCode={r.city_code} が canonical (Soumu) に存在せず",
            ))
        else:
            if r.city_name and r.city_name.strip() != canon.city_name:
                # cityName が違う場合は ERROR
                res.issues.append(Issue(
                    line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                    severity="ERROR", rule_id="2-cityname-mismatch",
                    message=f"cityName が canonical と不一致: md={r.city_name!r} vs canonical={canon.city_name!r}",
                ))

        # item 3: citySlug が registry と一致
        if r.city_slug is None:
            res.issues.append(Issue(
                line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                severity="ERROR", rule_id="3-cityslug-missing",
                message="citySlug 欠落",
            ))
        else:
            if reg is None:
                res.issues.append(Issue(
                    line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                    severity="WARN", rule_id="3-registry-missing",
                    message=f"cityCode={r.city_code} が registry に未登録 (md citySlug={r.city_slug!r})",
                ))
            elif reg.city_slug != r.city_slug:
                res.issues.append(Issue(
                    line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                    severity="ERROR", rule_id="3-cityslug-mismatch",
                    message=f"citySlug が registry と不一致: md={r.city_slug!r} vs registry={reg.city_slug!r}",
                ))

        # item 4: source URL の自治体特定性
        if r.source_url is None:
            res.issues.append(Issue(
                line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                severity="WARN", rule_id="4-source-missing",
                message="source URL 欠落",
            ))
        else:
            url = r.source_url
            hints: list[str] = []
            if r.city_slug and r.city_slug.lower() in url.lower():
                hints.append("citySlug")
            if r.city_code in url:
                hints.append("cityCode")
            # 都道府県名から「県/府/都/道」を除いたローマ字スラッグも気休めに見る
            if reg and reg.prefecture_slug and reg.prefecture_slug in url.lower():
                hints.append("prefectureSlug")
            if not hints:
                res.issues.append(Issue(
                    line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                    severity="WARN", rule_id="4-source-not-citySpecific",
                    message=f"source URL に citySlug / cityCode / prefectureSlug の手がかりなし: {url}",
                ))

        # item 7: 行ずれ(section の県名 vs cityCode の prefectureCode)
        if r.section_pref and canon is not None:
            if r.section_pref != canon.prefecture_name:
                res.issues.append(Issue(
                    line_no=r.line_no, city_code=r.city_code, city_name=r.city_name,
                    severity="ERROR", rule_id="7-row-shift",
                    message=(
                        f"section 県名={r.section_pref!r} と "
                        f"cityCode={r.city_code} の canonical 県名={canon.prefecture_name!r} 不一致"
                    ),
                ))

    # 集計
    seen_ok_lines: set[int] = set()
    issue_lines: set[int] = set(i.line_no for i in res.issues)
    for r in target_rows:
        if r.line_no in issue_lines:
            continue
        seen_ok_lines.add(r.line_no)
    res.ok_count = len(seen_ok_lines)
    res.error_count = sum(1 for i in res.issues if i.severity == "ERROR")
    res.warn_count = sum(1 for i in res.issues if i.severity == "WARN")
    res.untested_count = len(set(res.untested_codes))
    return res


# --------------------------------------------------------------------------
# レポート出力 (SOP §6)
# --------------------------------------------------------------------------

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def git_commit(path: Path) -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(path.parent), "log", "-1", "--format=%H"],
            capture_output=True, text=True, check=False,
        ).stdout.strip() or "n/a"
    except Exception:
        return "n/a"


def write_report(
    out_path: Path,
    canonical_path: Path,
    registry_path: Path,
    target_path: Path,
    result: VerifyResult,
) -> None:
    lines: list[str] = []
    A = lines.append
    A(f"# 検証レポート: {target_path.name} vs {registry_path.name}")
    A("")
    A(f"**実行日時:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    A("**スクリプト:** scripts/verify-citycode-cityslug.py")
    A("**入力:**")
    A(f"- canonical: `{canonical_path}` (sha256: `{sha256(canonical_path)}`)")
    A(f"- registry: `{registry_path}` (commit: `{git_commit(registry_path)}`)")
    A(f"- target: `{target_path}` (sha256: `{sha256(target_path)}`)")
    A("")
    A("## サマリ")
    A("")
    A("| 区分 | 件数 |")
    A("|---|---|")
    A(f"| OK(全 7 項目 pass) | {result.ok_count} |")
    A(f"| WARN(項目 2,3,4 の informational) | {result.warn_count} |")
    A(f"| ERROR(項目 1,2,3,5,6,7 の修正必須) | {result.error_count} |")
    A(f"| 未検証(canonical 未登録 cityCode) | {result.untested_count} |")
    A("")

    def issues_for(sev: str) -> list[Issue]:
        return sorted(
            (i for i in result.issues if i.severity == sev),
            key=lambda i: (i.line_no, i.rule_id),
        )

    A("## ERROR 詳細")
    A("")
    errs = issues_for("ERROR")
    if not errs:
        A("(ERROR なし)")
    for it in errs:
        A(f"- **L{it.line_no}** cityCode={it.city_code or 'n/a'} {it.city_name or ''}")
        A(f"  - rule: `{it.rule_id}`")
        A(f"  - {it.message}")
    A("")

    A("## WARN 詳細")
    A("")
    warns = issues_for("WARN")
    if not warns:
        A("(WARN なし)")
    for it in warns:
        A(f"- **L{it.line_no}** cityCode={it.city_code or 'n/a'} {it.city_name or ''}")
        A(f"  - rule: `{it.rule_id}`")
        A(f"  - {it.message}")
    A("")

    A("## 未検証(canonical 未登録 cityCode)")
    A("")
    if not result.untested_codes:
        A("(なし)")
    else:
        for code in sorted(set(result.untested_codes)):
            A(f"- {code}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--canonical", required=True, type=Path)
    p.add_argument("--registry", required=True, type=Path)
    p.add_argument("--target", required=True, type=Path)
    p.add_argument(
        "--output", type=Path, default=None,
        help="検証レポートの出力先 md パス(省略時は stdout サマリのみ)",
    )
    args = p.parse_args(argv)

    for label, path in [("canonical", args.canonical), ("registry", args.registry), ("target", args.target)]:
        if not path.exists():
            print(f"[error] {label} not found: {path}", file=sys.stderr)
            return 2

    canonical = load_canonical(args.canonical)
    registry = load_registry(args.registry)
    target_rows = parse_target_md(args.target)

    print(f"[info] canonical rows: {len(canonical)}")
    print(f"[info] registry rows:  {len(registry)}")
    print(f"[info] target rows:    {len(target_rows)}")

    result = verify(canonical, registry, target_rows)
    print(
        f"[summary] OK={result.ok_count}  "
        f"WARN={result.warn_count}  "
        f"ERROR={result.error_count}  "
        f"UNTESTED={result.untested_count}"
    )

    if args.output:
        write_report(args.output, args.canonical, args.registry, args.target, result)
        print(f"[info] wrote report: {args.output}")

    return 1 if result.error_count > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
