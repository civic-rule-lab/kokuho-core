#!/usr/bin/env node
// check-slug-kana.cjs — citySlug が自治体の読み(総務省カナ)から説明できるかを検査する
//
// 目的: citySlug は URL になるが、読みと一致しているかを誰も見ていなかった。
//       2026-09-01 の海外版作業で、香美町=mihamacho / 猿払村=sarobetsu /
//       日吉津村=hichisomura のように「別の自治体の名前」が slug になっている例が
//       見つかった(TASKS Z26)。個別に直しても、次に自治体を追加したとき同じことが
//       起きる。本スクリプトは「読みから説明できない slug」を検出する。
//
// 使い方:
//   node check-slug-kana.cjs              検査する(既定)
//   node check-slug-kana.cjs --list       不一致を全部出す(例外に入っているものも)
//   node check-slug-kana.cjs --write-exceptions  現状の不一致で例外ファイルを作り直す
//
// 終了コード: 0=ERROR なし / 1=ERROR あり / 2=入力ファイルが読めない
//
// 設計上の約束:
//  - ネットワークも git も使わない。リポ内の2ファイルだけを読む(CI で安定させるため)
//  - citySlug は変更しない・提案もしない(規範13)。検出して報告するだけ
//  - 例外には cityCode と citySlug の両方を記録する。slug を変えたのに例外が
//    効き続けることを防ぐ(slug が変わった例外は ERROR にする)
//  - ローマ字化は国土地理院「地名等の英語表記規程」別紙1 に拠るが、
//    長音短縮(ou/oo/uu→o/o/u)と拗音(半角カナに小書きが無い)は
//    **どちらの候補でも一致すれば OK** とする。厳密な一意判定ではなく
//    「読みから説明がつくか」を見るための緩さであり、意図的なもの。

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = process.env.KOKUHO_ROOT || process.cwd();
const SOUMU = path.join(ROOT, "data/reference/soumu-jichitai-codes.json");
const REGISTRY = path.join(ROOT, "registry/index.json");
const EXCEPTIONS = process.env.KOKUHO_SLUG_EXCEPTIONS || path.join(ROOT, "registry/known-slug-kana-exceptions.json");

const T = {
  "キャ":"kya","キュ":"kyu","キョ":"kyo","シャ":"sha","シュ":"shu","ショ":"sho",
  "チャ":"cha","チュ":"chu","チョ":"cho","ニャ":"nya","ニュ":"nyu","ニョ":"nyo",
  "ヒャ":"hya","ヒュ":"hyu","ヒョ":"hyo","ミャ":"mya","ミュ":"myu","ミョ":"myo",
  "リャ":"rya","リュ":"ryu","リョ":"ryo","ギャ":"gya","ギュ":"gyu","ギョ":"gyo",
  "ジャ":"ja","ジュ":"ju","ジョ":"jo","ビャ":"bya","ビュ":"byu","ビョ":"byo",
  "ピャ":"pya","ピュ":"pyu","ピョ":"pyo",
  "ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko",
  "サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to",
  "ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho",
  "マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo",
  "ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"o","ン":"n",
  "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo",
  "ダ":"da","ヂ":"ji","ヅ":"zu","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo",
  "パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ヴ":"vu",
};
const BIG = /([キシチニヒミリギジビピ])([ヤユヨ])/g;
const SMALL = { "ヤ":"ャ", "ユ":"ュ", "ヨ":"ョ" };
const ADMIN_KANA = ["チョウ","マチ","ムラ","ソン","シ","ク"];
const ADMIN_ROMAJI = ["shi","ku","cho","machi","mura","son","city","town","village","gun"];

function romanize(kana) {
  const out = [];
  for (let i = 0; i < kana.length; ) {
    const ch = kana[i], two = kana.slice(i, i + 2);
    if (ch === "ッ") {
      const r = T[kana.slice(i + 1, i + 3)] || T[kana[i + 1]] || "";
      out.push(r.startsWith("ch") ? "t" : (r[0] || ""));
      i += 1; continue;
    }
    if (T[two]) { out.push(T[two]); i += 2; continue; }
    if (T[ch]) { out.push(T[ch]); i += 1; continue; }
    if (ch === "ー") { i += 1; continue; }
    return null; // 変換できない文字
  }
  return out.join("");
}

function candidates(cityKana) {
  let k = cityKana.normalize("NFKC");
  for (const suf of ADMIN_KANA) {
    if (k.endsWith(suf)) { k = k.slice(0, -suf.length); break; }
  }
  const set = new Set();
  for (const variant of [k, k.replace(BIG, (m, a, b) => a + SMALL[b])]) {
    const r = romanize(variant);
    if (r === null) continue;
    set.add(r);
    set.add(r.replace(/ou|oo/g, "o").replace(/uu/g, "u"));
  }
  return set;
}

function slugBases(slug, prefSlugs) {
  const seen = new Set([slug.replace(/-/g, "")]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const x of [...seen]) {
      for (const suf of [...ADMIN_ROMAJI, ...prefSlugs]) {
        if (x.endsWith(suf) && x.length > suf.length + 2) {
          const cut = x.slice(0, -suf.length);
          if (!seen.has(cut)) { seen.add(cut); changed = true; }
        }
      }
    }
  }
  return seen;
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { console.error(`読めない: ${p}\n  ${e.message}`); process.exit(2); }
}

function main() {
  const LIST = process.argv.includes("--list");
  const WRITE = process.argv.includes("--write-exceptions");

  const soumu = readJson(SOUMU);
  const entries = soumu.entries || soumu;
  const byCode = new Map();
  for (const e of entries) {
    if (!e.isPrefecture && e.code5 && e.cityKana) byCode.set(String(e.code5), e);
  }

  const registry = readJson(REGISTRY);
  const munis = registry.municipalities || registry;
  const prefSlugs = [...new Set(munis.map((m) => m.prefectureSlug).filter(Boolean))]
    .sort((a, b) => b.length - a.length);

  let exceptions = { note: "", entries: [] };
  if (fs.existsSync(EXCEPTIONS)) exceptions = readJson(EXCEPTIONS);
  const exByCode = new Map((exceptions.entries || []).map((x) => [String(x.cityCode), x]));

  const mismatches = [];
  const errors = [];
  let checked = 0, matched = 0, noKana = 0;

  for (const m of munis) {
    const code = String(m.cityCode || "");
    const slug = String(m.citySlug || "");
    const e = byCode.get(code);
    if (!e) { noKana++; continue; }
    checked++;
    const cands = candidates(e.cityKana);
    const bases = slugBases(slug, prefSlugs);
    const hit = [...cands].some((c) => bases.has(c));
    if (hit) { matched++; continue; }

    const rec = {
      cityCode: code,
      cityName: m.cityName || e.cityName || "",
      prefecture: m.prefecture || "",
      citySlug: slug,
      cityKana: e.cityKana.normalize("NFKC"),
      expected: [...cands].sort().join(" | "),
    };
    mismatches.push(rec);

    const ex = exByCode.get(code);
    if (!ex) {
      errors.push({ ...rec, why: "例外リストに無い新規の不一致" });
    } else if (ex.citySlug !== slug) {
      errors.push({ ...rec, why: `例外は citySlug="${ex.citySlug}" を凍結しているが現在は "${slug}"。例外が古い` });
    }
  }

  if (WRITE) {
    const payload = {
      note: "citySlug が総務省カナの読みから説明できない既知の自治体。check-slug-kana.cjs が参照する。"
          + "新規の不一致は ERROR になる。ここから1件外すと、その自治体が ERROR になる(是正の進捗管理に使える)。",
      generatedAt: new Date().toISOString().slice(0, 10),
      entries: mismatches.map((r) => ({
        cityCode: r.cityCode, cityName: r.cityName, prefecture: r.prefecture,
        citySlug: r.citySlug, cityKana: r.cityKana, expected: r.expected, reason: "",
      })),
    };
    fs.writeFileSync(EXCEPTIONS, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`例外ファイルを書き出した: ${EXCEPTIONS} (${payload.entries.length}件)`);
    return;
  }

  console.log(`検査 ${checked}件 / 読みと一致 ${matched}件 / 不一致 ${mismatches.length}件`
    + ` (うち既知の例外 ${mismatches.length - errors.length}件・ERROR ${errors.length}件)`);
  if (noKana) console.log(`WARN: 総務省コード表に読みが無い自治体 ${noKana}件 (検査対象外)`);

  if (LIST) {
    for (const r of mismatches) {
      const known = exByCode.has(r.cityCode) && exByCode.get(r.cityCode).citySlug === r.citySlug;
      console.log(`  ${known ? "known" : "ERROR"}  ${r.cityCode} ${r.cityName} (${r.prefecture})`
        + `  slug=${r.citySlug}  読み=${r.cityKana}  期待=${r.expected}`);
    }
  }

  if (errors.length) {
    console.error("\nERROR:");
    for (const r of errors) {
      console.error(`  ${r.cityCode} ${r.cityName} (${r.prefecture}) slug="${r.citySlug}"`
        + ` 読み="${r.cityKana}" 期待="${r.expected}"\n    理由: ${r.why}`);
    }
    console.error("\ncitySlug は勝手に変更しない(規範13)。");
    console.error("意図した追加なら registry/known-slug-kana-exceptions.json に理由つきで足す。");
    process.exit(1);
  }
  process.exit(0);
}

main();
