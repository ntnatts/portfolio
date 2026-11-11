/* MAIN: loads content/, sets up the clock, theme toggle and cursor glow,
   and switches between pages based on the address (#var, #experience, #blog-cafe, ...). */
import { reduce, loadJSON, observeReveals } from "./util.js";
import { fillSiteText, buildBoard, buildDeck, deckFrame } from "./home.js";
import { renderCase, caseFrame } from "./case.js";
import { renderExp, expFrame } from "./experience.js";
import { renderBlog, renderPost } from "./blog.js";

let C = {};            // all content
let route = "home";
let renderId = 0;

/* ---------- real screen height (fixes mobile address-bar jumps) ---------- */
let vhPx = innerHeight / 100, flat = false;
function setVH(){
  const scr = (screen && screen.height) || innerHeight;
  flat = innerHeight > scr * 1.25 || innerHeight < 200;   // embedded/auto-sized: show cards as a plain list
  vhPx = Math.min(innerHeight, scr) / 100;
  document.documentElement.style.setProperty("--vh", vhPx + "px");
  document.body.classList.toggle("flatdeck", flat);
}

/* ---------- router ---------- */
async function go(){
  const id = decodeURIComponent(location.hash.slice(1));
  const my = ++renderId;
  const home = document.getElementById("home"), caseEl = document.getElementById("case"),
        blogEl = document.getElementById("blog"), expEl = document.getElementById("exp");

  const project = C.projects.find(p => p.id === id);
  const blogMatch = /^blog-([^/]+)(?:\/(.+))?$/.exec(id);
  const cat = blogMatch && C.cats.find(c => c.id === blogMatch[1]);
  const isExp = id === "experience";

  route = project ? "case" : cat ? "blog" : isExp ? "experience" : "home";
  [caseEl, blogEl, expEl].forEach(e => { e.innerHTML = ""; e.classList.remove("on"); });
  home.classList.toggle("on", route === "home");
  // colour of the page-wide background gradient (see "page-wide background gradient" in css/style.css)
  const tint = project ? project.accent : cat ? cat.colour : isExp ? "var(--yellow)" : "";
  if (tint) document.documentElement.style.setProperty("--tint", tint);
  else document.documentElement.style.removeProperty("--tint");

  let title = "";
  if (project){ title = renderCase(project, C.projects); caseEl.classList.add("on"); }
  else if (cat){
    blogEl.classList.add("on");
    title = blogMatch[2] ? await renderPost(cat, blogMatch[2]) : await renderBlog(cat, C.cats);
    if (my !== renderId) return;      // user already navigated elsewhere
  }
  else if (isExp){ title = renderExp(C.experience); expEl.classList.add("on"); }

  document.title = title ? `${title} · ${C.site.name.short}` : `${C.site.name.short} — Portfolio`;
  // home sections like #work / #approach scroll into place; everything else starts at the top
  const anchor = route === "home" && id && document.getElementById(id);
  if (anchor) anchor.scrollIntoView(); else scrollTo(0, 0);
}

/* nav links that scroll to a section on the home page */
function wireNav(){
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-go]"); if (!a) return;
    e.preventDefault();
    const target = a.dataset.go;
    const scrollToIt = () => document.getElementById(target).scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    if (route !== "home" && target !== "contact"){
      history.pushState(null, "", location.pathname + location.search);
      go().then(() => setTimeout(scrollToIt, 60));
    } else scrollToIt();
  });
  document.querySelector(".nav .me").addEventListener("click", e => {
    if (route === "home"){ e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
  });
}

/* ---------- Montréal clock ---------- */
function clock(){
  const b = document.querySelector("#clock b");
  const f = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });
  const tick = () => b.textContent = f.format(new Date());
  tick(); setInterval(tick, 10000);
}

/* ---------- dark mode toggle (remembers the choice) ---------- */
function theme(){
  const btn = document.getElementById("theme");
  const sync = () => btn.setAttribute("aria-pressed", document.documentElement.classList.contains("dark"));
  sync();
  btn.addEventListener("click", () => {
    const on = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("nat-theme", on ? "dark" : "light"); } catch (e) {}
    sync();
  });
}

/* ---------- soft orange glow that follows the cursor ---------- */
function glow(){
  const g = document.getElementById("glow");
  g.style.transform = "translate(-999px,-999px)";
  if (reduce) return;
  addEventListener("pointermove", e => { g.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`; }, { passive: true });
}

/* ---------- one animation loop for the whole site ---------- */
function loop(){
  if (route === "home") deckFrame(vhPx, flat);
  else if (route === "case") caseFrame();
  else if (route === "experience") expFrame();
  requestAnimationFrame(loop);
}

/* ---------- start ---------- */
(async function boot(){
  setVH(); addEventListener("resize", setVH);
  clock(); theme(); glow();
  try {
    const [site, projects, experience, hobbies] = await Promise.all([
      loadJSON("content/site.json"), loadJSON("content/projects.json"),
      loadJSON("content/experience.json"), loadJSON("content/hobbies.json"),
    ]);
    C = { site, projects: projects.projects, experience, cats: hobbies.categories };
  } catch (err){
    console.error(err);
    document.getElementById("home").classList.add("on");
    document.getElementById("home").innerHTML = `<div class="error"><h1 class="serif">Couldn't load the content files</h1>
      <p>${location.protocol === "file:" ? "Browsers block reading files when you double-click index.html. Start a small local server instead: open Terminal in this folder and run <code>python3 -m http.server 8000</code>, then visit <code>http://localhost:8000</code>." : "One of the files in <code>content/</code> has a mistake (often a missing comma or quote). Check the browser console for which one."}</p>
      <p><small>${String(err.message || err).replace(/</g, "&lt;")}</small></p></div>`;
    return;
  }
  fillSiteText(C.site);
  buildBoard(C.cats);
  buildDeck(C.projects);
  wireNav();
  observeReveals(document);
  addEventListener("hashchange", go);
  await go();
  loop();
})();
