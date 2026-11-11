/* BLOG PAGES
   #blog-cafe            → category page (hero, category chips, posts grid, next category)
   #blog-cafe/my-post    → one post (from content/posts/cafe/my-post.md)
   #blog-cafe/template   → the post template (content/posts/_template.md) */
import { reduce, esc, ARROW, observeReveals } from "./util.js";
import { allPosts, templatePost, renderMarkdown, niceDate } from "./posts.js";

const el = () => document.getElementById("blog");

function titleHTML(name){
  const [first, ...rest] = name.split(" ");
  return `<span class="rise"><span>${esc(first)}</span></span>${rest.length ? `<span class="rise"><span><em>${esc(rest.join(" "))}</em></span></span>` : ""}`;
}
const coverHTML = (src, emoji, alt = "") => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : emoji;

export async function renderBlog(c, cats){
  const root = el();
  const next = cats[(cats.indexOf(c) + 1) % cats.length];
  root.style.setProperty("--ca", c.colour);
  const posts = (await allPosts()).filter(p => p.cat === c.id);

  const cards = posts.map(p => `
      <a class="pcard reveal" href="#blog-${esc(c.id)}/${esc(p.slug)}">
        <div class="ph">${coverHTML(p.cover, c.emoji)}</div>
        <div class="pb"><small>${esc(niceDate(p.date))} · ${esc(p.read)} read</small><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div>
      </a>`).join("")
    + (posts.length ? "" : `
      <a class="pcard reveal" href="#blog-${esc(c.id)}/template">
        <div class="ph">${c.emoji}</div>
        <div class="pb"><small>Template · how a post will look</small><h3>Post template</h3><p>Open to see the layout every ${esc(c.name.toLowerCase())} post will use.</p></div>
      </a>`)
    + (posts.length ? [] : [1, 2]).map(k => `
      <div class="pcard soon reveal d${k}" aria-hidden="true"><div class="ph">${c.emoji}</div><div class="pb"><small>Coming soon</small><h3>Next post</h3><p>On its way.</p></div></div>`).join("");

  root.innerHTML = `
    <section class="bhero"><div class="sky"></div>
      <div>
        <a class="back" href="#">← Back to home</a>
        <div class="eyebrow">Off the clock · Blog</div>
        <h1 class="serif">${titleHTML(c.name)}</h1>
        <p class="intro">${esc(c.subtitle)}.${c.intro ? " " + esc(c.intro) : ` <span class="todo">TODO: one or two lines from Nat on why this matters to her (content/hobbies.json → "intro").</span>`}</p>
      </div>
      <div class="bigemoji" id="bigemoji" aria-hidden="true">${c.emoji}</div>
    </section>
    <nav class="catnav" aria-label="Blog categories">${cats.map(x => `<a href="#blog-${esc(x.id)}" class="${x.id === c.id ? "on" : ""}"${x.id === c.id ? ' aria-current="page"' : ""}><span aria-hidden="true">${x.emoji}</span>${esc(x.name)}</a>`).join("")}</nav>
    <section class="posts">
      <h2 class="serif">Posts</h2>
      <div class="pgrid">${cards}</div>
    </section>
    <a class="nextp" href="#blog-${esc(next.id)}" style="--npa:${esc(next.colour)}"><small>Next category</small><span class="big serif"><span aria-hidden="true">${next.emoji}</span> ${esc(next.name)}<span class="arrow">${ARROW}</span></span></a>`;

  // the giant emoji drifts with the cursor
  const big = document.getElementById("bigemoji");
  root.querySelector(".bhero").addEventListener("pointermove", e => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    big.style.translate = `${((e.clientX - r.left) / r.width - .5) * 40}px ${((e.clientY - r.top) / r.height - .5) * 30}px`;
  });
  observeReveals(root);
  return `${c.name} — Nat's blog`;
}

export async function renderPost(c, slug){
  const root = el();
  root.style.setProperty("--ca", c.colour);
  const post = slug === "template" ? await templatePost() : (await allPosts()).find(p => p.cat === c.id && p.slug === slug);
  if (!post){
    root.innerHTML = `<article class="post"><a class="back" href="#blog-${esc(c.id)}">← ${c.emoji} ${esc(c.name)}</a><h1 class="serif">Post not found</h1><p>Check that it is listed in content/posts/index.json.</p></article>`;
    return "Post not found";
  }
  root.innerHTML = `
    <article class="post">
      <a class="back" href="#blog-${esc(c.id)}">← ${c.emoji} ${esc(c.name)}</a>
      <h1 class="serif">${esc(post.title)}</h1>
      <div class="meta"><span class="label">${c.emoji} ${esc(c.name)}</span>${post.date ? `<span>${esc(niceDate(post.date))}</span><span aria-hidden="true">·</span>` : (post.template ? "<span>Date</span><span aria-hidden=\"true\">·</span>" : "")}<span>${esc(post.read)} read</span></div>
      <div class="cover">${coverHTML(post.cover, c.emoji, post.title)}</div>
      <div class="body">${renderMarkdown(post.body)}</div>
      <a class="nextp" href="#blog-${esc(c.id)}" style="--npa:${esc(c.colour)}"><small>Back to</small><span class="big serif"><span aria-hidden="true">${c.emoji}</span> ${esc(c.name)}<span class="arrow">${ARROW}</span></span></a>
    </article>`;
  return `${post.title} — Nat's blog`;
}
