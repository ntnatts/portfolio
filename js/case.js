/* CASE STUDY PAGE (#var, #deaf-game, ...). Layout:
   hero → the problem (fills word by word) → what I built → stat cards → overview → technical details → next project */
import { reduce, touch, clamp01, easeOut, esc, fmt, ARROW, BAR, win, onReveal, observeReveals } from "./util.js";
import { varDashboard, chartHTML } from "./charts.js";

const el = () => document.getElementById("case");

function mediaHTML(m, p){
  if (m.chart) return chartHTML(p.charts && p.charts[m.chart], p.accent);
  if (m.dashboard) return `<div class="win">${BAR("VaR dashboard · hover to move the buffer")}<svg class="varsvg" viewBox="0 0 1600 900"></svg></div>`;
  if (m.pair) return win(m.pair[0], p.short, m.alt) + win(m.pair[1], p.short, m.alt);
  return win(m.img, p.short, m.alt);
}

/* split the problem sentence into words; words inside the highlight phrase turn accent-coloured */
function statementHTML(problem){
  const text = problem.text, hl = problem.highlight || "";
  const s = hl ? text.indexOf(hl) : -1, e = s + hl.length;
  let pos = 0;
  return text.split(" ").map(w => {
    const isHl = s >= 0 && pos >= s && pos < e; pos += w.length + 1;
    return `<span class="w${isHl ? " hl" : ""}">${esc(w)}</span>`;
  }).join(" ");
}

const num = (st, v) => (st.prefix || "") + (st.decimals ? v.toFixed(st.decimals) : Math.round(v)) + (st.suffix || "");

export function renderCase(p, projects){
  const root = el();
  const next = projects[(projects.indexOf(p) + 1) % projects.length];
  root.style.setProperty("--pa", p.accent);
  const prev = p.previews || [];
  const heroMock = p.cover === "dashboard"
    ? `<div class="win w1">${BAR("var-dashboard · hover me")}<svg class="varsvg" viewBox="0 0 1600 900"></svg></div>
       <div class="win w2">${BAR("results")}${chartHTML(p.charts && p.charts.breaks, p.accent, true)}</div>`
    : `<div class="win w1">${BAR(p.short)}<img src="${esc(prev[0] || p.cover)}" alt=""></div>
       <div class="win w2">${BAR(p.short)}<img src="${esc(prev[1] || prev[0] || p.cover)}" alt=""></div>`;

  root.innerHTML = `
    <section class="chero">
      <div class="sky"></div>
      <div>
        <a class="back" href="#">← All work</a>
        <h1 class="ctitle serif"><span class="rise"><span>${esc(p.title[0])}</span></span><span class="rise"><span>${esc(p.title[1])}</span></span></h1>
        <span class="label">${esc(p.label)}</span>
        <p class="intro">${fmt(p.intro)}</p>
        <a class="btn" href="#stats" data-jump>See the results<span class="arrow">${ARROW}</span></a>
      </div>
      <div class="mock reveal" aria-hidden="true">${heroMock}</div>
    </section>

    <section class="problem"><div class="kicker">The problem</div><p class="statement" id="statement">${statementHTML(p.problem)}</p></section>

    <div class="hl-head"><h2 class="serif reveal">What I built</h2></div>
    ${p.highlights.map((h, i) => `
      <section class="hrow ${i % 2 ? "flip" : ""}">
        <div class="hmedia ${h.media.pair ? "pair" : ""} reveal">${mediaHTML(h.media, p)}</div>
        <div class="htext reveal d1"><span class="num">${i + 1}</span><h3>${fmt(h.title)}</h3><p>${fmt(h.text)}</p></div>
      </section>`).join("")}

    <section class="stats" id="stats" aria-label="Results">
      ${p.stats.map((st, i) => `<div class="stat reveal d${i}"><span class="n" data-i="${i}">${esc(num(st, reduce ? st.number : 0))}</span><div><h3>${fmt(st.title)}</h3><p>${fmt(st.text)}</p></div></div>`).join("")}
    </section>

    <section class="overview">
      <h2 class="serif">Project overview</h2>
      <div class="ogrid">
        ${p.overview.map(([k, v]) => `<div class="ocell reveal"><b>${esc(k)}</b><p>${fmt(v)}</p></div>`).join("")}
        <div class="ocell wide reveal"><b>Deliverables</b><ul>${p.deliverables.map(d => `<li>${fmt(d)}</li>`).join("")}</ul></div>
      </div>
    </section>

    ${p.tech && p.tech.length ? `<details class="tech"><summary><span class="pm">+</span> Technical details</summary>
      <table class="ttable">${p.tech.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${fmt(v)}</td></tr>`).join("")}</table>
    </details>` : ""}
    ${p.note ? `<p class="note">${fmt(p.note)}</p>` : ""}

    <a class="nextp" href="#${esc(next.id)}" style="--npa:${esc(next.accent)}"><small>Next project</small><span class="big serif">${esc(next.name)}<span class="arrow">${ARROW}</span></span></a>`;

  root._p = p;
  root.querySelectorAll(".varsvg").forEach(svg => {
    const c = varDashboard(svg), w = svg.closest(".win");
    w.addEventListener("mouseenter", () => c.playing = true); w.addEventListener("mouseleave", () => c.playing = false);
    if (touch) new IntersectionObserver(es => es.forEach(e => c.playing = e.isIntersecting), { threshold: .7 }).observe(w);
  });
  root.querySelector("[data-jump]").addEventListener("click", e => { e.preventDefault(); document.getElementById("stats").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  observeReveals(root);
  return p.name;
}

/* the problem sentence fills in word by word as you scroll */
export function caseFrame(){
  const st = document.getElementById("statement"); if (!st) return;
  const r = st.getBoundingClientRect();
  const prog = reduce ? 1 : clamp01((innerHeight * .85 - r.top) / (r.height + innerHeight * .4));
  const ws = st.children, k = Math.floor(prog * ws.length * 1.05);
  for (let i = 0; i < ws.length; i++) ws[i].classList.toggle("on", i < k);
}

/* count-up numbers and growing chart bars, started when they scroll into view */
onReveal(t => {
  t.querySelectorAll(".growbar").forEach(b => {
    const w = +b.dataset.w;
    if (reduce){ b.setAttribute("width", w); return; }
    const t0 = performance.now();
    (function f(now){ const k = Math.min(1, Math.max(0, (now - t0) / 900)); b.setAttribute("width", w * easeOut(k)); if (k < 1) requestAnimationFrame(f); })(t0);
  });
  const n = t.querySelector(".stat .n, .n[data-i]");
  const p = el()._p;
  if (n && p && !reduce){
    const st = p.stats[+n.dataset.i], to = st.number, t0 = performance.now();
    (function f(now){ const k = Math.min(1, Math.max(0, (now - t0) / 1400)); n.textContent = num(st, to * easeOut(k)); if (k < 1) requestAnimationFrame(f); })(t0);
  }
});
