/**
 * 記事生成スクリプト
 *
 * articles/*.md → {slug}/index.html を生成する
 *
 * 実行: node scripts/generate-articles.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { marked } from "marked";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "..");
const TMPL_DIR   = path.join(ROOT, "templates");
const ARTS_DIR   = path.join(ROOT, "articles");
const BASE_URL   = "https://kokuho-keisan.jp";

const template   = readFileSync(path.join(TMPL_DIR, "article.html"), "utf-8");

function fileHash(...filePaths) {
  const h = createHash("sha256");
  for (const p of filePaths) h.update(readFileSync(p));
  return h.digest("hex").slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, "css", "common.css"), path.join(ROOT, "css", "article.css"));

// Markdown の <!-- CTA-TOP --> コメントを実際の HTML に変換
function replaceCta(html, frontmatter) {
  const toolUrl = frontmatter.toolUrl || "https://kokuho-keisan.jp/";
  const ctaLabel = frontmatter.ctaLabel || "計算ツールを開く →";

  return html
    .replace(/<!-- CTA-TOP[^>]*-->/g,
      `<div class="article-cta">
        <a href="${toolUrl}">${ctaLabel}</a>
        <p class="article-cta-sub">無料・登録不要・公式データ使用</p>
      </div>`)
    .replace(/<!-- CTA-MIDDLE[^>]*-->/g,
      `<div class="article-cta">
        <a href="${toolUrl}">自分の世帯の保険料を計算する →</a>
      </div>`)
    .replace(/<!-- TOOL-EMBED[^>]*-->/g,
      `<div class="article-cta">
        <a href="${toolUrl}">計算ツールを開く（別ページ）→</a>
        <p class="article-cta-sub">入力した所得・世帯情報はブラウザ内のみで処理され、サーバーには送信されません。</p>
      </div>`);
}

function buildJsonLd(fm) {
  const canonical = `${BASE_URL}/${fm.slug}/`;
  const article = {
    "@type": "Article",
    "headline": fm.title,
    "description": fm.description,
    "url": canonical,
    "datePublished": fm.publishedAt,
    "dateModified": fm.updatedAt,
    "inLanguage": "ja",
    "author": { "@type": "Organization", "name": "kokuho-keisan.jp", "url": BASE_URL },
    "publisher": { "@type": "Organization", "name": "kokuho-keisan.jp", "url": BASE_URL },
  };
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "ホーム", "item": `${BASE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": fm.breadcrumbLabel || fm.title, "item": canonical },
    ],
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [article, breadcrumb] });
}

// articles/ 内の .md ファイルを処理
const files = readdirSync(ARTS_DIR).filter(f => f.endsWith(".md"));
let generated = 0;

for (const file of files) {
  const src = readFileSync(path.join(ARTS_DIR, file), "utf-8");
  const { data: fm, content } = matter(src);

  if (!fm.slug) {
    console.warn(`⚠️  ${file}: slug が未定義のためスキップ`);
    continue;
  }

  const htmlBody = replaceCta(marked.parse(content), fm);
  const jsonLd   = buildJsonLd(fm);
  const canonical = `${BASE_URL}/${fm.slug}/`;

  const html = template
    .replaceAll("__TITLE__",            fm.title)
    .replaceAll("__META_DESC__",        fm.description || fm.title)
    .replaceAll("__CANONICAL_URL__",    canonical)
    .replaceAll("__JSON_LD__",          jsonLd)
    .replaceAll("__BREADCRUMB_LABEL__", fm.breadcrumbLabel || fm.title)
    .replaceAll("__ARTICLE_CONTENT__",  htmlBody)
    .replaceAll("__CSS_V__",            CSS_V);

  const outDir = path.join(ROOT, fm.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
  generated++;
  console.log(`  ✅ /${fm.slug}/ ← ${file}`);
}

console.log(`\n✅ 記事生成完了: ${generated}件`);
