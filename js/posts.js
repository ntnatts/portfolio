/* BLOG POSTS: loads Markdown files listed in content/posts/index.json.
   Each file starts with a small header between --- lines:
     ---
     title: My first café post
     date: 2026-11-20
     cover: img/posts/cafe/cover.webp
     excerpt: One or two sentences for the card.
     read: 4 min        (optional; otherwise worked out from the word count)
     ---
   The category comes from the folder name (content/posts/cafe/... → cafe). */

let cache = null;

/* read the header block into an object, return { meta, body } */
export function parseFrontMatter(src){
  const m = /^﻿?---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  m[1].split(/\r?\n/).forEach(line => {
    const i = line.indexOf(":"); if (i < 1) return;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    meta[k] = v;
  });
  return { meta, body: src.slice(m[0].length) };
}

function readTime(body){
  const words = body.replace(/<!--[\s\S]*?-->/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)) + " min";
}

async function loadOne(path){
  const r = await fetch("content/posts/" + path, { cache: "no-cache" });
  if (!r.ok) throw new Error(path + ": " + r.status);
  const { meta, body } = parseFrontMatter(await r.text());
  const [cat, file] = path.split("/");
  return {
    cat, slug: file.replace(/\.md$/i, ""), path,
    title: meta.title || "Untitled", date: meta.date || "", cover: meta.cover || "",
    excerpt: meta.excerpt || "", read: meta.read || readTime(body), body,
  };
}

/* all posts, newest first */
export async function allPosts(){
  if (cache) return cache;
  let list = [];
  try {
    const r = await fetch("content/posts/index.json", { cache: "no-cache" });
    list = (await r.json()).posts || [];
  } catch (e){ console.warn("Could not read content/posts/index.json", e); }
  const got = await Promise.all(list.map(p => loadOne(p).catch(e => { console.warn("Skipping post", e.message); return null; })));
  cache = got.filter(Boolean).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return cache;
}

export async function templatePost(){
  const r = await fetch("content/posts/_template.md", { cache: "no-cache" });
  const { meta, body } = parseFrontMatter(await r.text());
  return { title: meta.title, date: "", cover: "", read: readTime(body), body, template: true };
}

/* Markdown → HTML. Two or more images alone on one line become a 2-up gallery. */
export function renderMarkdown(md){
  const html = window.marked ? window.marked.parse(md) : `<p>${md.replace(/</g, "&lt;")}</p>`;
  const box = document.createElement("div");
  box.innerHTML = html;
  box.querySelectorAll("p").forEach(p => {
    const imgs = p.querySelectorAll("img");
    if (imgs.length >= 2 && !p.textContent.trim()){
      const g = document.createElement("div"); g.className = "gallery";
      imgs.forEach(i => { i.loading = "lazy"; g.appendChild(i); });
      p.replaceWith(g);
    }
  });
  box.querySelectorAll("img").forEach(i => { i.loading = "lazy"; });
  box.querySelectorAll('a[href^="http"]').forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
  return box.innerHTML;
}

export function niceDate(d){
  if (!d) return "";
  const t = new Date(d + "T12:00:00Z");
  return isNaN(t) ? d : t.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
