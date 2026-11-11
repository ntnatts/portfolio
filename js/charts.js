/* Charts for case studies.
   - varDashboard(): the animated VaR dashboard preview (ILLUSTRATIVE data, labelled as such).
   - chartHTML(): small bar charts drawn from the real numbers in content/projects.json ("charts"). */
import { reduce, esc } from "./util.js";

/* ---------- live VaR mini-dashboard (deep-green panel, peach VaR line) ----------
   Returns a controller: set ctl.playing = true to animate the what-if buffer. */
export function varDashboard(svg){
  const ctl = { playing: false };
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const N = 260, loss = [], vol = []; let v = .8;
  for (let t = 0; t < N; t++){
    const shock = (t > 70 && t < 95) || (t > 190 && t < 205) ? 1.9 : 1;
    v = .92 * v + .08 * (.75 * shock) + (rnd() - .5) * .05; vol.push(v);
    const z = Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    loss.push(Math.abs(z) * v * (rnd() < .5 ? 1 : -1));
  }
  const X0 = 90, X1 = 1530, Y0 = 380, Y1 = 820, maxL = 3.6;
  const x = t => X0 + (X1 - X0) * t / (N - 1), y = l => Y1 - (Y1 - Y0) * (l + 1.2) / (maxL + 1.2);
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, a, p = svg) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Animated VaR backtest dashboard preview with illustrative data");
  const gid = "g" + Math.random().toString(36).slice(2, 7);
  const defs = mk("defs", {}); const g = mk("radialGradient", { id: gid, cx: "85%", cy: "0%", r: "70%" }, defs);
  mk("stop", { offset: "0", "stop-color": "#EFB11D", "stop-opacity": ".35" }, g); mk("stop", { offset: "1", "stop-color": "#EFB11D", "stop-opacity": "0" }, g);
  mk("rect", { width: 1600, height: 900, fill: "#22362C" }); mk("rect", { width: 1600, height: 900, fill: `url(#${gid})` });
  const tx = (str, X, Y, size, fill, w = 500) => { const e = mk("text", { x: X, y: Y, "font-size": size, fill, "font-weight": w }); e.textContent = str; return e; };
  tx("VaR BACKTEST DASHBOARD", 90, 95, 22, "#B9CBB8", 600);
  tx("Canadian bank trading book · 99% 1-day VaR", 90, 140, 38, "#FFFFFF", 600);
  const tv = [];
  [["Avg 99% VaR", "1.29%"], ["Breaks", "15"], ["Days in green", "83%"], ["Avg capital", "3.92%"]].forEach(([k, val], i) => {
    const X = 90 + i * 365; mk("rect", { x: X, y: 180, width: 340, height: 150, rx: 18, fill: "#2C4337", stroke: "#3A5446" });
    tx(k, X + 26, 225, 20, "#B9CBB8"); tv.push(tx(val, X + 26, 295, 52, "#FFFFFF", 600));
  });
  const light = mk("circle", { cx: 90 + 2 * 365 + 300, cy: 220, r: 12, fill: "#34C759" });
  mk("line", { x1: X0, x2: X1, y1: y(0), y2: y(0), stroke: "#3E5649" });
  const bars = loss.map((l, t) => mk("rect", { x: x(t) - 2, width: 3.4, y: Math.min(y(l), y(0)), height: Math.abs(y(l) - y(0)), fill: "#6E8576" }));
  const path = mk("path", { fill: "none", stroke: "#FFB78F", "stroke-width": 4, "stroke-linejoin": "round" });
  const marks = mk("g", {});
  const sy = 862; mk("line", { x1: 1080, x2: 1530, y1: sy, y2: sy, stroke: "#3E5649", "stroke-width": 6, "stroke-linecap": "round" });
  const thumb = mk("circle", { cx: 1200, cy: sy, r: 12, fill: "#FFFFFF" });
  const bl = tx("VaR buffer 1.00×", 820, sy + 8, 22, "#E4EADF", 600);
  tx("illustrative data", 90, sy + 8, 18, "#8AA090");
  const base = loss.filter((l, t) => l > 2.33 * vol[t] * .82).length || 1;
  let buf = 1, ph = 0, last = performance.now(), atRest = false;
  (function draw(){
    const now = performance.now(), dt = (now - last) / 1000; last = now;
    if (ctl.playing && !reduce){ ph += dt * .55; buf = 1.15 + .35 * Math.sin(ph * 2.2); } else buf += (1 - buf) * .08;
    const resting = !ctl.playing && Math.abs(buf - 1) < .001;
    if (!(resting && atRest)){  // skip redraws while idle
      let d = "", br = 0; marks.textContent = "";
      for (let t = 0; t < N; t++){
        const VaR = 2.33 * vol[t] * buf * .82; d += (t ? "L" : "M") + x(t).toFixed(1) + " " + y(VaR).toFixed(1);
        const hit = loss[t] > VaR; bars[t].setAttribute("fill", hit ? "#FF6A3D" : "#6E8576");
        if (hit){ br++; mk("circle", { cx: x(t), cy: y(loss[t]) - 12, r: 6, fill: "#FF6A3D" }, marks); }
      }
      path.setAttribute("d", d); thumb.setAttribute("cx", 1080 + (buf - .8) / .7 * 450); bl.textContent = "VaR buffer " + buf.toFixed(2) + "×";
      if (Math.abs(buf - 1) > .005){
        const b = Math.round(15 * br / base);
        tv[0].textContent = (1.29 * buf).toFixed(2) + "%"; tv[1].textContent = b; tv[3].textContent = (3.92 * buf).toFixed(2) + "%";
        light.setAttribute("fill", b <= 15 ? "#34C759" : b <= 25 ? "#FFCC00" : "#FF6A3D");
      } else { tv[0].textContent = "1.29%"; tv[1].textContent = "15"; tv[3].textContent = "3.92%"; light.setAttribute("fill", "#34C759"); }
    }
    atRest = resting;
    if (svg.isConnected) requestAnimationFrame(draw);
  })();
  return ctl;
}

/* ---------- bar charts from content/projects.json ---------- */
const TONES = accent => ({ base: "#DCCDB8", soft: "#F6B48F", strong: accent });

function bars(c, accent){
  const tone = TONES(accent), rows = c.rows, dec = c.decimals || 0, unit = c.unit || "";
  const W = 560, rowH = 46, H = rows.length * rowH + 30, L = 168, Rr = 60;
  const sx = v => L + (W - L - Rr) * v / c.max;
  let o = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
  rows.forEach((r, i) => {
    const yy = 10 + i * rowH;
    o += `<text x="0" y="${yy + 22}" font-size="13">${esc(r.label)}</text>`;
    o += `<rect x="${L}" y="${yy + 6}" height="24" rx="6" width="0" fill="${tone[r.tone] || accent}" class="growbar" data-w="${sx(r.value) - L}"/>`;
    o += `<text x="${sx(r.value) + 8}" y="${yy + 23}" font-size="13" font-weight="600" style="fill:var(--ink)">${r.value.toFixed(dec)}${esc(unit)}</text>`;
  });
  if (c.reference != null) o += `<line x1="${sx(c.reference)}" x2="${sx(c.reference)}" y1="4" y2="${H - 22}" stroke="currentColor" stroke-dasharray="4 4" style="color:var(--muted)"/><text x="${sx(c.reference)}" y="${H - 6}" font-size="11.5" text-anchor="middle">${esc(c.referenceLabel || "")}</text>`;
  return o + `</svg>`;
}
function years(c, accent){
  const soft = "#F6B48F", W = 560, H = 250, L = 30, B = 210, top = Math.max(...c.a, ...c.b, 1), sy = v => B - v * (170 / top), bw = 30;
  const step = (W - L - 60) / c.years.length;
  let o = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
  for (let t = 0; t <= top; t += 2) o += `<line x1="${L}" x2="${W}" y1="${sy(t)}" y2="${sy(t)}" stroke="currentColor" style="color:var(--line)"/><text x="0" y="${sy(t) + 4}" font-size="11">${t}</text>`;
  c.years.forEach((yv, i) => {
    const cx = L + 40 + i * step, a = c.a[i], b = c.b[i];
    o += `<rect x="${cx}" width="${bw}" rx="5" y="${sy(a)}" height="${B - sy(a)}" fill="${soft}"/>`;
    o += `<rect x="${cx + bw + 4}" width="${bw}" rx="5" y="${sy(b)}" height="${B - sy(b)}" fill="${accent}"/>`;
    o += `<text x="${cx + bw + 2}" y="${B + 22}" font-size="12" text-anchor="middle">${esc(yv)}</text>`;
    if (a) o += `<text x="${cx + bw / 2}" y="${sy(a) - 6}" font-size="11" text-anchor="middle">${a}</text>`;
    if (b) o += `<text x="${cx + bw * 1.5 + 4}" y="${sy(b) - 6}" font-size="11" text-anchor="middle" font-weight="600" style="fill:var(--ink)">${b}</text>`;
  });
  return o + `</svg>`;
}
export function chartHTML(c, accent, plain = false){
  if (!c) return `<div class="chartbox"><p class="todo">Chart missing in projects.json</p></div>`;
  const caption = c.type === "years"
    ? `<span style="color:#F6B48F">■</span> ${esc(c.series[0])} &nbsp; <span style="color:${accent}">■</span> ${esc(c.series[1])}`
    : esc(c.caption || "");
  return `<div class="chartbox"${plain ? ' style="border:0;box-shadow:none;border-radius:0"' : ""}><h4>${esc(c.title)}</h4><p>${caption}</p>${c.type === "years" ? years(c, accent) : bars(c, accent)}</div>`;
}
