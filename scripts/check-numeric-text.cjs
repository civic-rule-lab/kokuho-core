#!/usr/bin/env node
// check-numeric-text.cjs — 数値リテラルの「表記」が変わっていないかを検査する
//
// 目的: 料率 JSON の 0.0700 / 0.0030 / 1.0 などの末尾ゼロは意味を持つ
//       (civic-site-common-rules 中核ルール2)。ファイル全体を parse→stringify で
//       書き戻すと値は同じまま表記だけが 0.07 / 0.003 / 1 に変わり、diff に紛れて
//       通ってしまう。本スクリプトは staged(または作業ツリー)の JSON を HEAD と
//       比べ、「値は等しいのに表記が変わった数値」を検出して commit を止める。
//
// 使い方:
//   node check-numeric-text.cjs                 staged (git index) を HEAD と比較 (pre-commit 用)
//   node check-numeric-text.cjs --worktree      作業ツリーを HEAD と比較 (素振り用)
//   node check-numeric-text.cjs --base <ref>    <ref> と HEAD を比較 (CI 用。例 --base origin/main)
//
// 意図した表記変更を通すとき (例: 浮動小数点のゴミ 0.030600000000000002 → 0.0306 の是正):
//   ローカル: ALLOW_NUMFMT=1 node check-numeric-text.cjs
//   CI:       比較範囲内のいずれかの commit message に [numfmt] を含める
//   どちらも理由を commit message に書くこと。
//
// 対象: data/**/*.json と registry/index.json。新規ファイルは比較対象なし=スキップ。
// 終了コード: 0=問題なし / 1=表記変更あり(または解析エラー)
//
// 実装方針: json.loads/JSON.parse を経由せず、生テキストを自前で走査して
//           「パス → 数値リテラルの原文」を集める(丸め・整形を一切しない)。

"use strict";
const { execFileSync } = require("child_process");

const argv = process.argv.slice(2);
const WORKTREE = argv.includes("--worktree");
const BASE = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : null;
if (argv.includes("--base") && !BASE) {
  console.error("--base には比較元の ref を指定する (例 --base origin/main)");
  process.exit(1);
}
const TARGET = /^(data\/.*\.json|registry\/index\.json)$/;

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...opts });
}

function listChangedFiles() {
  const args = BASE
    ? ["diff", "--name-only", "--diff-filter=M", BASE, "HEAD"]
    : WORKTREE
      ? ["diff", "--name-only", "--diff-filter=M", "HEAD"]
      : ["diff", "--cached", "--name-only", "--diff-filter=M"];
  return git(args).split("\n").filter((f) => TARGET.test(f));
}

function readOld(path) {
  return git(["show", `${BASE || "HEAD"}:${path}`]);
}
function readNew(path) {
  if (BASE) return git(["show", `HEAD:${path}`]);
  if (WORKTREE) return require("fs").readFileSync(path, "utf8");
  return git(["show", `:${path}`]);
}

function allowedByCommitMessage() {
  if (!BASE) return false;
  try {
    return /\[numfmt\]/.test(git(["log", "--format=%B", `${BASE}..HEAD`]));
  } catch (e) {
    return false;
  }
}

// 生テキスト走査: 文字列・数値・構造だけを追い、数値の原文を path 付きで返す
function collectNumbers(text, file) {
  const out = new Map(); // path -> raw literal
  let i = 0;
  const n = text.length;
  const ws = () => {
    while (i < n && /\s/.test(text[i])) i++;
  };
  const fail = (msg) => {
    throw new Error(`${file}: ${msg} (offset ${i})`);
  };
  const readString = () => {
    if (text[i] !== '"') fail("string expected");
    let s = "";
    i++;
    while (i < n) {
      const c = text[i];
      if (c === "\\") {
        s += text[i] + text[i + 1];
        i += 2;
        continue;
      }
      if (c === '"') {
        i++;
        return s;
      }
      s += c;
      i++;
    }
    fail("unterminated string");
  };
  const readValue = (path) => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++;
      ws();
      if (text[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        ws();
        const key = readString();
        ws();
        if (text[i] !== ":") fail("':' expected");
        i++;
        readValue(path ? `${path}.${key}` : key);
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return;
        }
        fail("',' or '}' expected");
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (text[i] === "]") {
        i++;
        return;
      }
      let k = 0;
      for (;;) {
        readValue(`${path}[${k++}]`);
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return;
        }
        fail("',' or ']' expected");
      }
    }
    if (c === '"') {
      readString();
      return;
    }
    const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i, i + 64));
    if (m) {
      out.set(path, m[0]);
      i += m[0].length;
      return;
    }
    for (const lit of ["true", "false", "null"]) {
      if (text.startsWith(lit, i)) {
        i += lit.length;
        return;
      }
    }
    fail("unexpected token");
  };
  readValue("");
  ws();
  if (i !== n) fail("trailing garbage");
  return out;
}

let problems = 0;
let scanned = 0;
for (const file of listChangedFiles()) {
  scanned++;
  let oldNums, newNums;
  try {
    oldNums = collectNumbers(readOld(file), `${file}@HEAD`);
    newNums = collectNumbers(readNew(file), file);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    problems++;
    continue;
  }
  const hits = [];
  for (const [path, rawNew] of newNums) {
    const rawOld = oldNums.get(path);
    if (rawOld === undefined || rawOld === rawNew) continue;
    if (Number(rawOld) === Number(rawNew)) hits.push(`${path}: ${rawOld} → ${rawNew}`);
  }
  if (hits.length) {
    problems++;
    console.error(`❌ ${file}: 値は同じなのに数値の表記が変わっています(${hits.length}件)`);
    for (const h of hits.slice(0, 20)) console.error(`     ${h}`);
    if (hits.length > 20) console.error(`     … 他 ${hits.length - 20} 件`);
  }
}

if (problems) {
  console.error(
    "\n原因の典型: JSON を parse→stringify で全体書き戻しした。中核ルール2(text-replacement 方式)に従い部分置換でやり直すこと。\n" +
      "意図した表記変更なら ALLOW_NUMFMT=1 (ローカル) か commit message の [numfmt] (CI) で通し、理由を commit message に書く。"
  );
  if (process.env.ALLOW_NUMFMT === "1") {
    console.error("⚠️  ALLOW_NUMFMT=1 により通過");
    process.exit(0);
  }
  if (allowedByCommitMessage()) {
    console.error("⚠️  commit message の [numfmt] により通過");
    process.exit(0);
  }
  process.exit(1);
}
if (scanned) console.log(`✅ check-numeric-text: ${scanned} ファイル、表記変更なし`);
