/* EXPERIENCE PAGE (#experience): vertical timeline from content/experience.json.
   The line fills with orange as you scroll and each dot lights up as its role passes. */
import { esc, fmt, ARROW, observeReveals } from "./util.js";

export function renderExp(data){
  const root = document.getElementById("exp");
  root.innerHTML = `
    <section class="xhero"><div class="sky"></div>
      <div><a class="back" href="#">← Home</a><div class="eyebrow" style="margin-bottom:14px">Experience</div><h1 class="serif"><span class="rise"><span>Experience</span></span></h1></div>
      <p class="reveal">${fmt(data.summary)}</p>
    </section>
    <section class="timeline" id="tl" aria-label="Timeline"><div class="tl-fill" id="tlfill"></div>
      ${data.jobs.map(j => `<article class="job reveal"><span class="dot" aria-hidden="true"></span><div class="when">${esc(j.when)}</div>
        <div class="card"><span class="kind">${esc(j.type)}</span><h3>${esc(j.role)}</h3>
          <div class="org">${esc(j.company)}${j.place ? ` <span>· ${esc(j.place)}</span>` : ""}</div>
          <p class="desc">${fmt(j.about)}</p>
          ${j.results && j.results.length ? `<ul>${j.results.map(x => `<li>${fmt(x)}</li>`).join("")}</ul>` : ""}
        </div></article>`).join("")}
    </section>
    <a class="nextp" href="#work" data-go="work" style="--npa:var(--accent)"><small>See what I built</small><span class="big serif">Projects<span class="arrow">${ARROW}</span></span></a>`;
  observeReveals(root);
  expFrame();
  return "Experience";
}

export function expFrame(){
  const tl = document.getElementById("tl"); if (!tl) return;
  const r = tl.getBoundingClientRect(), line = innerHeight * .6;
  document.getElementById("tlfill").style.height = Math.max(0, Math.min(r.height - 50, line - r.top - 50)) + "px";
  tl.querySelectorAll(".job").forEach(j => j.classList.toggle("lit", j.getBoundingClientRect().top + 18 < line));
}
