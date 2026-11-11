#!/usr/bin/env node
/* =====================================================================
   Content check
   Reads everything in content/ and stops with a clear message if something
   would break the site (a missing comma, a missing field, an image that
   doesn't exist...). GitHub runs this before every publish; if it fails,
   the live site keeps the last working version.

   Run it yourself from the site folder:   node scripts/check-content.mjs
   No packages to install.
   ===================================================================== */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

/* ---------- helpers ---------- */
function readJSON(rel){
  const path = join(ROOT, rel);
  if (!existsSync(path)){ err(rel, "file is missing"); return null; }
  const text = readFileSync(path, "utf8");
  try { return JSON.parse(text); }
  catch (e){
    // turn "position 1234" into a line number people can find
    const m = /position (\d+)/.exec(e.message);
    let where = "";
    if (m){
      const before = text.slice(0, +m[1]).split("\n");
      where = ` (around line ${before.length}, column ${before.at(-1).length + 1})`;
    }
    err(rel, `not valid JSON${where}. Usual causes: a missing or extra comma, or a missing "quote". Details: ${e.message}`);
    return null;
  }
}
const isStr = v => typeof v === "string" && v.trim() !== "";
const isNum = v => typeof v === "number" && Number.isFinite(v);
const isHex = v => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + "T00:00:00Z"));
function need(file, obj, where, fields){
  for (const [k, test, hint] of fields){
    if (!test(obj?.[k])) err(file, `${where}: "${k}" ${hint}`);
  }
}
function fileExists(file, where, p){
  if (!isStr(p)) return;
  if (/^https?:\/\//.test(p)) return;
  if (!existsSync(join(ROOT, p))) err(file, `${where}: can't find "${p}". Check the file name and folder (names are case-sensitive).`);
}
const STR = [isStr, "must be some text"];
const ARR = [Array.isArray, "must be a list [ ... ]"];

/* ---------- site.json ---------- */
const site = readJSON("content/site.json");
if (site){
  const F = "content/site.json";
  need(F, site, "top", [["eyebrow", ...STR], ["tagline", ...STR], ["boardCaption", ...STR], ["credit", ...STR]]);
  need(F, site.name, "name", [["short", ...STR], ["line1", ...STR], ["line2", ...STR], ["initial", ...STR], ["full", ...STR]]);
  if (!Array.isArray(site.typedPhrases) || !site.typedPhrases.length || !site.typedPhrases.every(isStr)) err(F, `"typedPhrases" must be a list of phrases`);
  need(F, site.approach, "approach", [["line1", ...STR], ["line2", ...STR], ["paragraphs", ...ARR], ["toolkit", ...ARR]]);
  need(F, site.contact, "contact", [["heading1", ...STR], ["heading2", ...STR], ["links", ...ARR]]);
  (site.contact?.links || []).forEach((l, i) => need(F, l, `contact link ${i + 1}`, [["label", ...STR], ["url", ...STR]]));
}

/* ---------- projects.json ---------- */
const pj = readJSON("content/projects.json");
if (pj){
  const F = "content/projects.json";
  if (!Array.isArray(pj.projects) || !pj.projects.length) err(F, `"projects" must be a list with at least one project`);
  const ids = new Set();
  (pj.projects || []).forEach((p, i) => {
    const W = `project ${i + 1}${isStr(p?.name) ? ` ("${p.name}")` : ""}`;
    need(F, p, W, [
      ["id", v => isStr(v) && /^[a-z0-9-]+$/.test(v), "must be lowercase letters, numbers and dashes, e.g. \"my-project\""],
      ["name", ...STR], ["short", ...STR], ["stat", ...STR], ["label", ...STR], ["intro", ...STR],
      ["accent", isHex, "must be a colour like \"#F2600C\""],
      ["tags", ...ARR], ["cover", ...STR],
      ["title", v => Array.isArray(v) && v.length === 2 && v.every(isStr), "must be two lines, e.g. [\"Bank\", \"VaR\"]"],
      ["highlights", v => Array.isArray(v) && v.length > 0, "must be a list with at least one highlight"],
      ["stats", v => Array.isArray(v) && v.length > 0, "must be a list of stat cards"],
      ["overview", ...ARR], ["deliverables", ...ARR],
    ]);
    if (ids.has(p?.id)) err(F, `${W}: id "${p.id}" is used twice`);
    ids.add(p?.id);
    if (["experience", "work", "approach", "contact"].includes(p?.id) || /^blog-/.test(p?.id || "")) err(F, `${W}: id "${p.id}" is reserved for another page, pick a different one`);
    need(F, p?.problem, `${W} → problem`, [["text", ...STR]]);
    if (isStr(p?.problem?.highlight) && isStr(p?.problem?.text) && !p.problem.text.includes(p.problem.highlight))
      err(F, `${W} → problem: the "highlight" phrase must appear exactly in the "text" sentence`);
    if (p?.cover !== "dashboard") fileExists(F, `${W} → cover`, p?.cover);
    (p?.previews || []).forEach(s => fileExists(F, `${W} → previews`, s));
    if (p?.video != null) fileExists(F, `${W} → video`, p.video);
    (p?.highlights || []).forEach((h, k) => {
      const H = `${W} → highlight ${k + 1}`;
      need(F, h, H, [["title", ...STR], ["text", ...STR]]);
      const m = h?.media || {};
      if (m.img) fileExists(F, H, m.img);
      else if (m.pair){ if (!Array.isArray(m.pair) || m.pair.length !== 2) err(F, `${H}: "pair" must be a list of two images`); else m.pair.forEach(s => fileExists(F, H, s)); }
      else if (m.chart){ if (!p.charts?.[m.chart]) err(F, `${H}: chart "${m.chart}" isn't defined in this project's "charts"`); }
      else if (!m.dashboard) err(F, `${H}: "media" needs "img", "pair", "chart" or "dashboard"`);
      if ((m.img || m.pair) && !isStr(m.alt)) warn(F, `${H}: add an "alt" text describing the image (helps screen readers)`);
    });
    (p?.stats || []).forEach((s, k) => need(F, s, `${W} → stat ${k + 1}`, [["number", isNum, "must be a number without quotes, e.g. 15 or 3.92"], ["title", ...STR], ["text", ...STR]]));
    (p?.overview || []).forEach((o, k) => { if (!Array.isArray(o) || o.length !== 2) err(F, `${W} → overview row ${k + 1}: must be ["Label", "Text"]`); });
    (p?.tech || []).forEach((o, k) => { if (!Array.isArray(o) || o.length !== 2) err(F, `${W} → tech row ${k + 1}: must be ["Label", "Text"]`); });
  });
}

/* ---------- experience.json ---------- */
const ex = readJSON("content/experience.json");
if (ex){
  const F = "content/experience.json";
  need(F, ex, "top", [["summary", ...STR], ["jobs", ...ARR]]);
  (ex.jobs || []).forEach((j, i) => {
    const W = `job ${i + 1}${isStr(j?.role) ? ` ("${j.role}")` : ""}`;
    need(F, j, W, [["when", ...STR], ["type", ...STR], ["role", ...STR], ["company", ...STR], ["about", ...STR], ["results", ...ARR]]);
  });
}

/* ---------- hobbies.json ---------- */
const hb = readJSON("content/hobbies.json");
const catIds = new Set();
if (hb){
  const F = "content/hobbies.json";
  if (!Array.isArray(hb.categories) || !hb.categories.length) err(F, `"categories" must be a list`);
  (hb.categories || []).forEach((c, i) => {
    const W = `category ${i + 1}${isStr(c?.name) ? ` ("${c.name}")` : ""}`;
    need(F, c, W, [
      ["id", v => isStr(v) && /^[a-z0-9-]+$/.test(v), "must be lowercase letters, numbers and dashes"],
      ["emoji", ...STR], ["name", ...STR], ["subtitle", ...STR],
      ["colour", isHex, "must be a colour like \"#B9763F\""],
      ["intro", v => typeof v === "string", "must be text (use \"\" if you haven't written it yet)"],
    ]);
    if (catIds.has(c?.id)) err(F, `${W}: id "${c.id}" is used twice`);
    catIds.add(c?.id);
    const b = c?.board;
    if (!b || ![b.x, b.y, b.size, b.tilt].every(isNum)) err(F, `${W}: "board" needs numbers x, y, size and tilt`);
    else if (b.x < 0 || b.x > 1 || b.y < 0 || b.y > 1) err(F, `${W}: board x and y must be between 0 and 1`);
    if (isStr(c?.id) && !existsSync(join(ROOT, "content/posts", c.id))) warn(F, `${W}: there's no folder content/posts/${c.id}/ yet`);
  });
}

/* ---------- blog posts ---------- */
function frontMatter(text){
  const m = /^﻿?---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/.exec(text);
  if (!m) return null;
  const meta = {};
  m[1].split(/\r?\n/).forEach(line => {
    const i = line.indexOf(":"); if (i < 1) return;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  });
  return meta;
}
const idx = readJSON("content/posts/index.json");
const listed = new Set();
if (idx){
  const F = "content/posts/index.json";
  if (!Array.isArray(idx.posts)) err(F, `"posts" must be a list, e.g. ["cafe/my-post.md"]`);
  (idx.posts || []).forEach(p => {
    if (!isStr(p) || !/^[^/]+\/[^/]+\.md$/.test(p)){ err(F, `"${p}" should look like "category/file-name.md"`); return; }
    if (listed.has(p)) err(F, `"${p}" is listed twice`);
    listed.add(p);
    const [cat] = p.split("/");
    if (catIds.size && !catIds.has(cat)) err(F, `"${p}": "${cat}" isn't a category in hobbies.json`);
    const path = join(ROOT, "content/posts", p);
    if (!existsSync(path)){ err(F, `"${p}" is listed but the file content/posts/${p} doesn't exist`); return; }
    const P = `content/posts/${p}`;
    const meta = frontMatter(readFileSync(path, "utf8"));
    if (!meta){ err(P, `must start with a header between --- lines (copy the top of _template.md)`); return; }
    if (!isStr(meta.title)) err(P, `header needs a "title:"`);
    if (!isDate(meta.date || "")) err(P, `header "date:" must look like 2026-11-20`);
    if (!isStr(meta.excerpt)) warn(P, `header has no "excerpt:", the card will have no summary`);
    if (meta.cover) fileExists(P, "cover", meta.cover);
    const body = readFileSync(path, "utf8");
    for (const m of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) fileExists(P, "image", m[1]);
  });
}
// posts sitting in a folder but not in index.json (fine for drafts, but easy to forget)
for (const cat of catIds){
  const dir = join(ROOT, "content/posts", cat);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) if (f.endsWith(".md") && !listed.has(`${cat}/${f}`))
    warn("content/posts/index.json", `"${cat}/${f}" exists but isn't listed, so it won't show (fine if it's a draft)`);
}

/* ---------- report ---------- */
if (warnings.length){ console.log(`\n⚠️  ${warnings.length} note(s), these won't stop publishing:`); warnings.forEach(w => console.log("   - " + w)); }
if (errors.length){
  console.log(`\n❌ ${errors.length} problem(s) found. The site was NOT published; fix these and push again:`);
  errors.forEach(e => console.log("   - " + e));
  console.log("");
  process.exit(1);
}
console.log("\n✅ Content looks good.\n");
