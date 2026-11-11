/* HOME PAGE: hero text, typed phrase, "Off the clock" emoji board,
   the scroll-stacking project deck, Approach and the footer. */
import { reduce, touch, clamp01, easeOut, esc, fmt, ARROW, $ } from "./util.js";
import { varDashboard } from "./charts.js";

/* ---------- hero, approach, footer text from content/site.json ---------- */
export function fillSiteText(site){
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set("nav-initial", esc(site.name.initial)); set("nav-name", esc(site.name.short));
  set("hero-eyebrow", esc(site.eyebrow));
  set("name-1", esc(site.name.line1)); set("name-2", esc(site.name.line2));
  set("tagline", fmt(site.tagline));
  set("typed", esc(site.typedPhrases[0] || ""));
  set("boardcap", esc(site.boardCaption));
  set("approach-1", esc(site.approach.line1)); set("approach-2", esc(site.approach.line2));
  set("approach-text", site.approach.paragraphs.map(p => `<p>${fmt(p)}</p>`).join(""));
  set("toolkit", site.approach.toolkit.map(t => `<span>${esc(t)}</span>`).join(""));
  set("contact-1", esc(site.contact.heading1)); set("contact-2", esc(site.contact.heading2));
  set("contact-links", site.contact.links.map(l => `<a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}</a>`).join(""));
  set("copyright", `© ${new Date().getFullYear()} ${esc(site.name.full)}`);
  set("credit", esc(site.credit));
  typed(site.typedPhrases);
}

/* ---------- typed rotating phrase ---------- */
function typed(words){
  const el = document.getElementById("typed");
  if (reduce || !words.length) return;
  let w = 0, c = words[0].length + 14, del = true;
  setInterval(() => {
    if (del){ c = Math.min(c, words[w].length) - 1; if (c <= 0){ del = false; w = (w + 1) % words.length; } }
    else { c++; if (c >= words[w].length + 14) del = true; }
    el.textContent = words[w].slice(0, Math.max(0, Math.min(c, words[w].length))) || "​";
  }, 70);
}

/* ---------- Experience preview (after the project deck) ----------
   One card per job from content/experience.json, showing the first result.
   The full timeline lives on its own page (#experience). */
export function buildExperience(exp){
  const grid = document.getElementById("xgrid");
  grid.innerHTML = exp.jobs.map((j, i) => `
    <a class="xcard reveal d${i % 3}" href="#experience">
      <div class="xtop"><span class="kind">${esc(j.type)}</span><span class="when">${esc(j.when)}</span></div>
      <h3>${esc(j.role)}</h3>
      <div class="org">${esc(j.company)}${j.place ? ` <span>· ${esc(j.place)}</span>` : ""}</div>
      <p>${fmt((j.results && j.results[0]) || j.about)}</p>
    </a>`).join("");
}

/* ---------- Off the clock: draggable emoji stickers ---------- */
export function buildBoard(cats){
  const board = document.getElementById("board");
  cats.forEach((st, i) => {
    const b = st.board || { x: .5, y: .5, size: 1, tilt: 0 };
    const el = document.createElement("div");
    el.className = "sticker";
    el.style.left = `calc((100% - var(--sw)) * ${b.x})`; el.style.top = `calc((100% - var(--sh)) * ${b.y})`;
    el.style.setProperty("--sc", b.size); el.style.setProperty("--rot", b.tilt + "deg");
    el.style.setProperty("--d", (i * .09) + "s"); el.style.setProperty("--bob", (4.5 + (i % 3) * 1.2) + "s");
    el.innerHTML = `<span class="e" aria-hidden="true" style="animation-delay:${-i * .8}s">${st.emoji}</span><span class="lbl" style="--c:${esc(st.colour)}" aria-hidden="true"><i></i>${esc(st.name)}</span>`;
    if (b.x < .15) el.classList.add("edge-l");
    if (b.x > .85) el.classList.add("edge-r");
    if (b.y > .9) el.classList.add("edge-b");
    el.setAttribute("role", "link"); el.tabIndex = 0; el.setAttribute("aria-label", st.name + " blog");
    const open = () => { location.hash = "blog-" + st.id; };
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } });
    board.appendChild(el);

    // drag; a press that moves less than 6px counts as a click
    let sx, sy, ox, oy, moved = 0, dragging = false;
    el.addEventListener("pointerdown", e => {
      moved = 0; dragging = true; el.setPointerCapture(e.pointerId); el.classList.add("drag");
      sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop; el.style.zIndex = 10;
    });
    el.addEventListener("pointermove", e => {
      if (!dragging) return;
      moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
      const bw = board.clientWidth - el.offsetWidth, bh = board.clientHeight - el.offsetHeight;
      el.style.left = Math.max(0, Math.min(bw, ox + e.clientX - sx)) + "px";
      el.style.top = Math.max(0, Math.min(bh, oy + e.clientY - sy)) + "px";
    });
    const end = e => {
      const wasDrag = dragging; dragging = false; el.classList.remove("drag"); el.style.zIndex = "";
      if (wasDrag && moved < 6 && e.type === "pointerup") open();
    };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  });

  // stickers lean away from the cursor
  board.addEventListener("pointermove", e => {
    if (reduce) return;
    const r = board.getBoundingClientRect(), cx = (e.clientX - r.left) / r.width - .5, cy = (e.clientY - r.top) / r.height - .5;
    board.querySelectorAll(".sticker:not(.drag)").forEach((el, i) => { const k = 6 + (i % 3) * 5; el.style.translate = `${-cx * k}px ${-cy * k}px`; });
  });
}

/* ---------- Project deck ----------
   Scroll-stacking card effect adapted from "Project Deck" by Aakash Mehra.
   Each card rises from below in 3D (blurred), then flattens; cards underneath lean back and dim. */
const R = 18;
const cornerSVG = cls => `<svg class="corner ${cls}" width="${R}" height="${R}" viewBox="0 0 ${R} ${R}" aria-hidden="true"><path d="M${R} 0 V${R} H0 A${R} ${R} 0 0 0 ${R} 0 Z"/></svg>`;
let cards = [], deck, ctl = {}, smooth = 0;

function previewHTML(p){
  if (reduce) return "";  // reduced motion: keep the still image
  if (p.video) return `<span class="preview"><video muted loop playsinline preload="none" data-src="${esc(p.video)}"${p.cover !== "dashboard" ? ` poster="${esc(p.cover)}"` : ""}></video></span>`;
  if (!p.previews || !p.previews.length) return "";
  const n = p.previews.length;
  return `<span class="preview" style="--dur:${n * 2.6}s">${p.previews.map((s, k) => `<img src="${esc(s)}" alt="" loading="lazy" style="animation-delay:${k * 2.6}s">`).join("")}</span>`;
}

export function buildDeck(projects){
  const stage = document.getElementById("stage");
  deck = document.getElementById("deck");
  deck.style.height = `calc(${projects.length * 100} * var(--vh))`;
  projects.forEach((p, i) => {
    const el = document.createElement("article");
    el.className = "card"; el.style.zIndex = i + 1;
    el.innerHTML = `
      <div class="frame">
        <a class="media" href="#${esc(p.id)}" aria-label="${esc(p.name)}: ${esc(p.stat)} Open case study.">
          ${p.cover === "dashboard"
            ? `<svg class="varsvg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"></svg>`
            : `<img src="${esc(p.cover)}" alt="" loading="${i < 2 ? "eager" : "lazy"}">`}
          ${previewHTML(p)}
          ${reduce ? "" : `<span class="chip" aria-hidden="true"><i class="dot"></i><span class="t1">${touch ? "Preview" : "Hover to preview"}</span><span class="t2">Playing preview</span></span>`}
          <span class="info" aria-hidden="true"><span class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join("")}</span><span class="istat">${fmt(p.stat)}</span></span>
        </a>
        <div class="visit">${cornerSVG("c1")}${cornerSVG("c2")}
          <a href="#${esc(p.id)}"><span class="nm"><b>${esc(p.name)}</b><span>Read case study</span></span><span class="arrow" style="background:${esc(p.accent)}">${ARROW}</span></a>
        </div>
        <div class="dim"></div>
      </div>`;
    stage.appendChild(el);
    if (p.cover === "dashboard") ctl[i] = varDashboard(el.querySelector("svg"));
    el.addEventListener("mouseenter", () => !reduce && !touch && setPlaying(el, i, true));
    el.addEventListener("mouseleave", () => !touch && setPlaying(el, i, false));
    el.addEventListener("focusin", () => !reduce && setPlaying(el, i, true));
    el.addEventListener("focusout", () => setPlaying(el, i, false));
  });
  cards = [...stage.children];

  // videos only load when their card gets near the screen
  const vio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const v = e.target.querySelector("video[data-src]");
    if (v){ v.src = v.dataset.src; v.removeAttribute("data-src"); }
    vio.unobserve(e.target);
  }), { rootMargin: "100% 0px" });
  cards.forEach(c => vio.observe(c));
}

function setPlaying(el, i, on){
  if (el.classList.contains("playing") === on) return;
  el.classList.toggle("playing", on);
  if (ctl[i]) ctl[i].playing = on;
  const v = el.querySelector("video");
  if (v){ if (on){ if (v.dataset.src){ v.src = v.dataset.src; v.removeAttribute("data-src"); } v.play().catch(() => {}); } else v.pause(); }
}

const ENTER = .72;
function arrived(j, v){ return j <= 0 ? 1 : easeOut(clamp01((v * Math.max(1, cards.length - 1) - (j - 1)) / ENTER)); }
function above(i, v){ let n = 0; for (let j = i + 1; j < cards.length; j++) n += arrived(j, v); return Math.min(3, n); }

/* called every frame while the home page is showing */
export function deckFrame(vhPx, flat){
  if (!deck || flat) return;
  const r = deck.getBoundingClientRect();
  const target = clamp01(-r.top / Math.max(1, r.height - innerHeight));
  smooth += (target - smooth) * (reduce ? 1 : .16);
  cards.forEach((el, i) => {
    const a = arrived(i, smooth), ab = above(i, smooth);
    if (reduce) el.style.transform = a >= .5 ? "none" : `translateY(${110 * vhPx}px)`;
    else {
      el.style.transform = `translateY(${((1 - a) * 108 - ab * 5) * vhPx}px) rotateX(${-(1 - a) * 30 + ab * 5}deg) scale(${.9 + .1 * a - ab * .05})`;
      el.style.filter = `blur(${((1 - a) ** 2 * 12 + ab * 1.1).toFixed(2)}px)`;
      $(".dim", el).style.opacity = ab * .15;
    }
    // touch screens: play when the card has landed in the middle of the screen
    if (touch && !reduce) setPlaying(el, i, a > .97 && ab < .05 && r.top < innerHeight * .5 && r.bottom > innerHeight * .5);
  });
}
