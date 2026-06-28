/**
 * registry/index.json の各自治体に kouki システムを追加する。
 *
 * 後期高齢者医療は全47広域連合（全自治体）に存在するため、kouki-spec が存在する
 * 都道府県の全自治体に "kouki" を systems[] へ追加し publishYear.kouki=YEAR を設定する。
 * 冪等（既にあれば変更しない）。
 *
 * 実行:
 *   node scripts/add-kouki-to-registry.js --dry-run   # 変更件数のみ表示
 *   node scripts/add-kouki-to-registry.js             # 実書き換え
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const SPECS_DIR = path.join(ROOT, "data", "kouki-specs");
const YEAR_ARG  = process.argv.find(a => a.startsWith("--year="));
const YEAR      = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const DRY       = process.argv.includes("--dry-run");

const specPrefs = new Set(readdirSync(SPECS_DIR).filter(f => f.endsWith(".js")).map(f => f.replace(".js", "")));
const registry  = JSON.parse(readFileSync(REGISTRY, "utf-8"));

let added = 0, already = 0, noSpec = 0;
for (const m of registry.municipalities) {
  if (!specPrefs.has(m.prefectureSlug)) { noSpec++; continue; }
  m.systems = m.systems || [];
  m.publishYear = m.publishYear || {};
  if (m.systems.includes("kouki")) { already++; }
  else { m.systems.push("kouki"); added++; }
  m.publishYear.kouki = YEAR;
}

console.log(`kouki登録: 追加${added} / 既存${already} / spec無${noSpec} (全${registry.municipalities.length}件)`);
if (DRY) { console.log("(dry-run: 書き込みなし)"); process.exit(0); }
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");
console.log("registry/index.json を更新しました。");
