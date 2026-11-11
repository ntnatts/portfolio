/* Small shared helpers used by every page. */

export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const touch = matchMedia("(hover: none)").matches;
export const clamp01 = v => Math.min(1, Math.max(0, v));
export const easeOut = t => 1 - (1 - t) ** 3;
export const $ = (sel, root = document) => root.querySelector(sel);

export const ARROW = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;

/* Escape text for HTML, then turn **words** into orange <b>words</b>. */
export function esc(s = ""){
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function fmt(s = ""){
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

/* Fake browser window around an image (case study mockups). */
export const BAR = label => `<div class="bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(label)}</span></div>`;
export const win = (src, label, alt = "", cls = "") =>
  `<div class="win ${cls}">${BAR(label)}<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></div>`;

/* Fade/slide elements in as they scroll into view. Also starts counters and growing bars. */
const hooks = [];
export const onReveal = fn => hooks.push(fn);
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in"); io.unobserve(e.target);
  hooks.forEach(fn => fn(e.target));
}), { threshold: .18 });
export function observeReveals(root = document){ root.querySelectorAll(".reveal:not(.in)").forEach(e => io.observe(e)); }

/* Load a JSON file from content/. */
export async function loadJSON(path){
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}
