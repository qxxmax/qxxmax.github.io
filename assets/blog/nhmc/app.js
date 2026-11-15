// NHMC round-trip blog: language switch, KaTeX, and interactive figures.
// 1) toy double-well chains (path-IMH vs full round trip, exact tempered-transition construction),
// 2) erfc law: alpha(sigma) curve + predicted vs measured acceptance in 2D phi^4 (data.js: accept),
// 3) volume/transfer: acceptance of the frozen L=16 model vs V with erfc(sqrt(sbar2 V)/2) (data.js: transfer, g).
(function () {
  "use strict";
  const D = window.BLOG_DATA || {};
  const COL = { rt: "#0072B2", prt: "#009E73", imh: "#D55E00" };
  const $ = (id) => document.getElementById(id);

  // ---------- language ----------
  function setLang(l) {
    if (!["zh", "en", "both"].includes(l)) return;
    document.body.className = "lang-" + l;
    document.documentElement.lang = l === "en" ? "en" : "zh-CN";
    document.querySelectorAll(".switch button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === l));
    try {
      localStorage.setItem("nhmc-blog-lang", l);
    } catch (e) {}
  }
  document.querySelectorAll(".switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  try {
    const l = localStorage.getItem("nhmc-blog-lang") || localStorage.getItem("site-lang");
    if (l) setLang(l);
  } catch (e) {}

  // ---------- math helpers ----------
  function erfc(x) {
    // Numerical Recipes erfcc, rel. error < 1.2e-7
    const z = Math.abs(x),
      t = 1 / (1 + 0.5 * z);
    const r =
      t *
      Math.exp(
        -z * z -
          1.26551223 +
          t *
            (1.00002368 +
              t *
                (0.37409196 +
                  t *
                    (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
      );
    return x >= 0 ? r : 2 - r;
  }
  function erfcinv(a) {
    // bisection on [0, 10]; erfc is decreasing
    let lo = 0,
      hi = 10;
    for (let i = 0; i < 80; i++) {
      const m = (lo + hi) / 2;
      if (erfc(m) > a) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }
  function gauss() {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const fmt = (x, n = 3) => (x === 0 ? "0" : Math.abs(x) < 1e-3 || Math.abs(x) >= 1e4 ? x.toExponential(1) : x.toFixed(n));

  // ---------- tooltip ----------
  const tip = document.createElement("div");
  tip.id = "tip";
  document.body.appendChild(tip);
  function showTip(e, html) {
    tip.innerHTML = html;
    tip.style.left = e.clientX + 12 + "px";
    tip.style.top = e.clientY + 12 + "px";
    tip.style.opacity = 1;
  }
  function hideTip() {
    tip.style.opacity = 0;
  }

  // ---------- SVG helpers ----------
  const NS = "http://www.w3.org/2000/svg";
  function el(svg, tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    svg.appendChild(e);
    return e;
  }
  function logAxis(svg, x0, x1, y0, y1, lo, hi, vertical) {
    // decade ticks
    for (let p = Math.ceil(Math.log10(lo)); p <= Math.floor(Math.log10(hi)); p++) {
      const f = (p - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
      const lab =
        p === 0
          ? "1"
          : p === 1
            ? "10"
            : "10" +
              String(p)
                .replace("-", "⁻")
                .replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
      if (vertical) {
        const y = y1 - f * (y1 - y0);
        el(svg, "line", { x1: x0, x2: x1, y1: y, y2: y, class: "grid" });
        el(svg, "text", { x: x0 - 6, y: y + 4, "text-anchor": "end", class: "tick" }, lab);
      } else {
        const x = x0 + f * (x1 - x0);
        el(svg, "line", { x1: x, x2: x, y1: y0, y2: y1, class: "grid" });
        el(svg, "text", { x, y: y1 + 16, "text-anchor": "middle", class: "tick" }, lab);
      }
    }
  }
  function marker(svg, shape, x, y, color, filled, r = 4.5) {
    const a = { fill: filled ? color : "#fff", stroke: filled ? "#fff" : color, "stroke-width": filled ? 1.5 : 1.8 };
    return shape === "sq"
      ? el(svg, "rect", Object.assign({ x: x - r, y: y - r, width: 2 * r, height: 2 * r, rx: 1.5 }, a))
      : el(svg, "circle", Object.assign({ cx: x, cy: y, r: r + 0.3 }, a));
  }

  // ======================================================================
  // 1) toy: d independent double wells, path of T annealed HMC stages
  //    U_k(x) = sum_i (1-b_k) x_i^2/2 + b_k b (x_i^2-1)^2, b_k = k/T; U_0 = N(0,1) sampled exactly.
  //    Each stage kernel is per-coordinate HMC with Metropolis test (reversible w.r.t. exp(-U_k)), so the reverse
  //    path uses the same kernels in reverse order. Work W = sum_k [U_k(x_{k-1}) - U_{k-1}(x_{k-1})] (NCMC form);
  //    a forward endpoint carries weight exp(-W). IMH: fresh forward path, accept min(1, exp(W_cur - W_new)).
  //    Full round trip: reverse path from x down to u_0 (record W_r), forward from the same u_0, accept min(1, exp(W_r - W_new)).
  // ======================================================================
  const toy = { d: 16, T: 8, b: 2, run: false };
  const NLF = 4,
    EPS = 0.25;
  const u1 = (x, bk, b) => ((1 - bk) * x * x) / 2 + bk * b * (x * x - 1) * (x * x - 1);
  const g1 = (x, bk, b) => (1 - bk) * x + bk * b * 4 * x * (x * x - 1);
  function Usum(x, bk) {
    let s = 0;
    for (let i = 0; i < x.length; i++) s += u1(x[i], bk, toy.b);
    return s;
  }
  function stage(x, bk) {
    // per-coordinate HMC, in place
    for (let i = 0; i < x.length; i++) {
      const q0 = x[i];
      let q = q0,
        p = gauss();
      const h0 = u1(q0, bk, toy.b) + (p * p) / 2;
      p -= (EPS / 2) * g1(q, bk, toy.b);
      for (let l = 0; l < NLF; l++) {
        q += EPS * p;
        if (l < NLF - 1) p -= EPS * g1(q, bk, toy.b);
      }
      p -= (EPS / 2) * g1(q, bk, toy.b);
      const h1 = u1(q, bk, toy.b) + (p * p) / 2;
      if (isFinite(h1) && Math.log(Math.random()) < h0 - h1) x[i] = q;
    }
  }
  function forward(u0) {
    const x = u0.slice();
    let W = 0;
    for (let k = 1; k <= toy.T; k++) {
      const bk = k / toy.T,
        bp = (k - 1) / toy.T;
      W += Usum(x, bk) - Usum(x, bp);
      stage(x, bk);
    }
    return { x, W };
  }
  function reverse(x0) {
    const y = x0.slice();
    let W = 0;
    for (let k = toy.T; k >= 1; k--) {
      const bk = k / toy.T,
        bp = (k - 1) / toy.T;
      stage(y, bk);
      W += Usum(y, bk) - Usum(y, bp);
    }
    return { u0: y, W };
  }
  const fresh = () => Array.from({ length: toy.d }, gauss);
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  function newChain() {
    const f = forward(fresh());
    return { x: f.x, W: f.W, n: 0, acc: 0, run: 0, maxrun: 0, trace: [], sD: 0, nD: 0, sW: 0, sW2: 0 };
  }
  let cI, cR;
  function reset() {
    cI = newChain();
    cR = newChain();
    draw();
  }
  function stepIMH(c) {
    const f = forward(fresh());
    c.sW += f.W;
    c.sW2 += f.W * f.W;
    const ok = Math.log(Math.random()) < c.W - f.W;
    if (ok) {
      c.x = f.x;
      c.W = f.W;
    }
    book(c, ok);
  }
  function stepRT(c) {
    const r = reverse(c.x),
      f = forward(r.u0),
      dl = f.W - r.W;
    if (isFinite(dl)) {
      c.sD += dl;
      c.nD++;
    }
    const ok = Math.log(Math.random()) < -dl;
    if (ok) c.x = f.x;
    book(c, ok);
  }
  function book(c, ok) {
    c.n++;
    if (ok) {
      c.acc++;
      c.run = 0;
    } else {
      c.run++;
      c.maxrun = Math.max(c.maxrun, c.run);
    }
    c.trace.push(mean(c.x));
    if (c.trace.length > 400) c.trace.shift();
  }
  function trace(cv, c, color) {
    const g = cv.getContext("2d"),
      W = cv.width,
      H = cv.height;
    g.clearRect(0, 0, W, H);
    g.strokeStyle = "#eef0f3";
    g.lineWidth = 1;
    [-1, 0, 1].forEach((v) => {
      const y = H / 2 - (v * H) / 3.2;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    });
    g.fillStyle = "#9aa1ad";
    g.font = "11px sans-serif";
    g.fillText("+1", 4, H / 2 - H / 3.2 - 3);
    g.fillText("−1", 4, H / 2 + H / 3.2 - 3);
    g.strokeStyle = color;
    g.lineWidth = 1.6;
    g.beginPath();
    c.trace.forEach((v, i) => {
      const x = (i / 399) * W,
        y = H / 2 - (Math.max(-1.55, Math.min(1.55, v)) * H) / 3.2;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.stroke();
  }
  function draw() {
    trace($("c-imh"), cI, COL.imh);
    trace($("c-rt"), cR, COL.rt);
    const zh = !document.body.classList.contains("lang-en");
    const L = zh
      ? ["步数", "接受率", "最长连续拒绝", "当前连续拒绝", "高斯平均接受率 erfc(σ/2)", "预测接受率 erfc(√⟨Δ⟩/2)"]
      : ["steps", "acceptance", "longest rejection run", "current run", "Gaussian mean acceptance erfc(σ/2)", "predicted erfc(√⟨Δ⟩/2)"];
    const a = (c) => (c.n ? c.acc / c.n : 0);
    const vI = cI.n > 1 ? cI.sW2 / cI.n - (cI.sW / cI.n) ** 2 : NaN;
    $("s-imh").innerHTML = `${L[0]} ${cI.n} · ${L[1]} ${fmt(a(cI))}<br>${L[2]} ${cI.maxrun} · ${L[3]} ${cI.run}`;
    const mD = cR.nD ? cR.sD / cR.nD : NaN;
    $("s-rt").innerHTML =
      `${L[0]} ${cR.n} · ${L[1]} ${fmt(a(cR))}<br>${L[2]} ${cR.maxrun} · ${L[3]} ${cR.run}<br>${L[5]} ${isFinite(mD) ? fmt(erfc(Math.sqrt(Math.max(mD, 0)) / 2)) : "–"}`;
  }
  function loop() {
    if (!toy.run) return;
    const t0 = performance.now();
    while (performance.now() - t0 < 14) {
      stepIMH(cI);
      stepRT(cR);
    }
    draw();
    requestAnimationFrame(loop);
  }
  function bindToy() {
    if (!$("toydemo")) return;
    const upd = () => {
      toy.d = +$("t-d").value;
      toy.T = +$("t-k").value;
      toy.b = +$("t-b").value;
      $("t-dv").textContent = toy.d;
      $("t-kv").textContent = toy.T;
      $("t-bv").textContent = toy.b;
      reset();
    };
    ["t-d", "t-k", "t-b"].forEach((i) => $(i).addEventListener("input", upd));
    $("t-run").addEventListener("click", () => {
      toy.run = !toy.run;
      if (toy.run) loop();
    });
    $("t-reset").addEventListener("click", reset);
    upd();
  }

  // ======================================================================
  // 2) erfc law
  // ======================================================================
  function lawPlot() {
    const svg = $("law-svg");
    if (!svg) return;
    const s = +$("l-s").value;
    $("l-sv").textContent = s.toFixed(2);
    const a = erfc(s / 2),
      C = 1.2,
      tau = C * (1 / a - 0.5);
    const zh = !document.body.classList.contains("lang-en");
    $("l-out").textContent = `α = ${fmt(a)}   ·   τ_int ≈ C(1/α − 1/2) = ${fmt(tau, 1)}  (C = 1.2)` + (zh ? "" : "");
    svg.innerHTML = "";
    // left: alpha(sigma)
    const X0 = 64,
      X1 = 265,
      Y0 = 30,
      Y1 = 300;
    const xs = (v) => X0 + (v / 8) * (X1 - X0),
      ys = (v) => Y1 - v * (Y1 - Y0);
    for (let v = 0; v <= 8; v += 2) {
      el(svg, "line", { x1: xs(v), x2: xs(v), y1: Y0, y2: Y1, class: "grid" });
      el(svg, "text", { x: xs(v), y: Y1 + 16, "text-anchor": "middle", class: "tick" }, v);
    }
    for (let v = 0; v <= 1.001; v += 0.25) {
      el(svg, "line", { x1: X0, x2: X1, y1: ys(v), y2: ys(v), class: "grid" });
      el(svg, "text", { x: X0 - 6, y: ys(v) + 4, "text-anchor": "end", class: "tick" }, v.toFixed(2));
    }
    el(svg, "line", { x1: X0, x2: X1, y1: Y1, y2: Y1, class: "ax" });
    el(svg, "line", { x1: X0, x2: X0, y1: Y0, y2: Y1, class: "ax" });
    let d = "";
    for (let i = 0; i <= 200; i++) {
      const v = (i / 200) * 8;
      d += (i ? "L" : "M") + xs(v).toFixed(1) + "," + ys(erfc(v / 2)).toFixed(1);
    }
    el(svg, "path", { d, fill: "none", stroke: COL.rt, "stroke-width": 2 });
    el(svg, "line", { x1: xs(s), x2: xs(s), y1: Y0, y2: Y1, stroke: "#9aa1ad", "stroke-dasharray": "3 3" });
    el(svg, "circle", { cx: xs(s), cy: ys(a), r: 5, fill: COL.rt, stroke: "#fff", "stroke-width": 2 });
    el(svg, "text", { x: (X0 + X1) / 2, y: Y1 + 36, "text-anchor": "middle" }, "σ");
    el(svg, "text", { x: 12, y: (Y0 + Y1) / 2, "text-anchor": "middle", transform: `rotate(-90 12 ${(Y0 + Y1) / 2})` }, "α");
    // right: predicted vs measured acceptance of the native models (linear; transfer is in Section 5)
    const P0 = 345,
      P1 = 545;
    const lx = sc(0, 1, P0, P1, false),
      ly = sc(0, 1, Y1, Y0, false);
    for (let v = 0; v <= 1.001; v += 0.25) {
      el(svg, "line", { x1: lx(v), x2: lx(v), y1: Y0, y2: Y1, class: "grid" });
      el(svg, "text", { x: lx(v), y: Y1 + 16, "text-anchor": "middle", class: "tick" }, v.toFixed(2));
      el(svg, "line", { x1: P0, x2: P1, y1: ly(v), y2: ly(v), class: "grid" });
      el(svg, "text", { x: P0 - 6, y: ly(v) + 4, "text-anchor": "end", class: "tick" }, v.toFixed(2));
    }
    el(svg, "line", { x1: P0, x2: P1, y1: Y1, y2: Y1, class: "ax" });
    el(svg, "line", { x1: P0, x2: P0, y1: Y0, y2: Y1, class: "ax" });
    el(svg, "line", { x1: lx(0), y1: ly(0), x2: lx(1), y2: ly(1), stroke: "#9aa1ad", "stroke-dasharray": "4 3" });
    (D.accept || [])
      .filter((r) => r.kind === "native")
      .forEach((r) => {
        const isRT = r.m === "rt";
        hover(
          marker(svg, isRT ? "c" : "sq", lx(r.pred), ly(r.meas), isRT ? COL.rt : COL.prt, true),
          `${isRT ? "RT" : "pRT"} · L=${r.L} · κ=${r.kappa}<br>predicted ${fmt(r.pred)} · measured ${fmt(r.meas)}`
        );
      });
    el(svg, "text", { x: (P0 + P1) / 2, y: Y1 + 36, "text-anchor": "middle" }, zh ? "预测 erfc(σ/2)" : "predicted erfc(σ/2)");
    el(
      svg,
      "text",
      { x: P0 - 44, y: (Y0 + Y1) / 2, "text-anchor": "middle", transform: `rotate(-90 ${P0 - 44} ${(Y0 + Y1) / 2})` },
      zh ? "实测 α" : "measured α"
    );
    legend(svg, P0 + 12, Y0 + 10, [
      ["RT", COL.rt],
      ["pRT", COL.prt, "sq"],
    ]);
  }

  // ======================================================================
  // 3) volume / transfer
  // ======================================================================
  function volPlot() {
    const svg = $("vol-svg");
    if (!svg) return;
    const k = +$("v-k").value,
      ast = +$("v-a").value;
    $("v-av").textContent = ast.toFixed(2);
    const key = (m) => ("00" + Math.round(k * 100)).slice(-3) + "_" + m;
    const zh = !document.body.classList.contains("lang-en");
    svg.innerHTML = "";
    const X0 = 60,
      X1 = 540,
      Y0 = 20,
      Y1 = 280,
      vlo = 100,
      vhi = 2e4,
      alo = 1e-4,
      ahi = 1;
    const xs = (v) => X0 + ((Math.log10(v) - Math.log10(vlo)) / (Math.log10(vhi) - Math.log10(vlo))) * (X1 - X0);
    const ys = (v) => Y1 - ((Math.log10(v) - Math.log10(alo)) / (Math.log10(ahi) - Math.log10(alo))) * (Y1 - Y0);
    logAxis(svg, X0, X1, Y0, Y1, vlo, vhi, false);
    logAxis(svg, X0, X1, Y0, Y1, alo, ahi, true);
    el(svg, "line", { x1: X0, x2: X1, y1: Y1, y2: Y1, class: "ax" });
    el(svg, "line", { x1: X0, x2: X0, y1: Y0, y2: Y1, class: "ax" });
    el(svg, "text", { x: (X0 + X1) / 2, y: Y1 + 36, "text-anchor": "middle" }, zh ? "体积 V = L²" : "volume V = L²");
    el(
      svg,
      "text",
      { x: 16, y: (Y0 + Y1) / 2, "text-anchor": "middle", transform: `rotate(-90 16 ${(Y0 + Y1) / 2})` },
      zh ? "接受率 α" : "acceptance α"
    );
    const out = [];
    [
      ["rt", COL.rt, "c", ""],
      ["rtp12", COL.prt, "sq", "5 4"],
    ].forEach(([m, col, sh, dash]) => {
      const g = D.g && D.g[key(m)];
      if (!g) return;
      let d = "",
        first = true;
      for (let i = 0; i <= 200; i++) {
        const V = vlo * Math.pow(vhi / vlo, i / 200),
          a = erfc(Math.sqrt(g * V) / 2);
        if (a < alo) break;
        d += (first ? "M" : "L") + xs(V).toFixed(1) + "," + ys(a).toFixed(1);
        first = false;
      }
      el(svg, "path", { d, fill: "none", stroke: col, "stroke-width": 2, "stroke-dasharray": dash });
      const Vm = (4 * erfcinv(ast) ** 2) / g;
      if (Vm > vlo && Vm < vhi) {
        el(svg, "line", { x1: xs(Vm), x2: xs(Vm), y1: Y0, y2: Y1, stroke: col, "stroke-width": 1, "stroke-dasharray": "2 3" });
      }
      out.push(`${m === "rt" ? "RT" : "pRT"}: V_max ≈ ${Vm.toFixed(0)} (L ≈ ${Math.sqrt(Vm).toFixed(0)})`);
      (D.transfer || [])
        .filter((r) => Math.abs(r.kappa - k) < 1e-9 && r.m === m)
        .forEach((r) => {
          const V = r.L * r.L;
          if (r.acc > 0) {
            const mk = marker(svg, sh, xs(V), ys(Math.max(r.acc, alo)), col, true);
            mk.style.cursor = "pointer";
            mk.addEventListener("mousemove", (e) =>
              showTip(e, `${m === "rt" ? "RT" : "pRT"} · L=${r.L} · κ=${r.kappa}<br>measured ${fmt(r.acc)} · erfc ${fmt(erfc(Math.sqrt(g * V) / 2))}`)
            );
            mk.addEventListener("mouseleave", hideTip);
          } else {
            // no acceptance in the run: mark at the bottom edge
            el(svg, "path", { d: `M${xs(V) - 5},${Y1 - 10}L${xs(V) + 5},${Y1 - 10}L${xs(V)},${Y1 - 2}Z`, fill: col, opacity: 0.6 });
          }
        });
    });
    el(svg, "line", { x1: X1 - 120, x2: X1 - 96, y1: Y0 + 10, y2: Y0 + 10, stroke: COL.rt, "stroke-width": 2 });
    el(svg, "text", { x: X1 - 90, y: Y0 + 14 }, "RT");
    el(svg, "line", { x1: X1 - 120, x2: X1 - 96, y1: Y0 + 28, y2: Y0 + 28, stroke: COL.prt, "stroke-width": 2, "stroke-dasharray": "5 4" });
    el(svg, "text", { x: X1 - 90, y: Y0 + 32 }, "pRT (s = 12)");
    $("v-out").textContent = out.join("   ·   ");
  }

  // ======================================================================
  // section 1 figures: (a) Var(log w) and ESS vs V, (b) tau vs L (Table J1), (c) tau vs 1/alpha - 1/2
  // ======================================================================
  const K3 = { HMC: "#3b3f4a", Wolff: "#CC79A7", RT: COL.rt, pRT: COL.prt, IMH: COL.imh };
  const isZh = () => !document.body.classList.contains("lang-en");
  function frame(svg, X0, X1, Y0, Y1, xl, yl) {
    el(svg, "line", { x1: X0, x2: X1, y1: Y1, y2: Y1, class: "ax" });
    el(svg, "line", { x1: X0, x2: X0, y1: Y0, y2: Y1, class: "ax" });
    el(svg, "text", { x: (X0 + X1) / 2, y: Y1 + 34, "text-anchor": "middle" }, xl);
    const ym = (Y0 + Y1) / 2,
      xx = X0 - 42;
    el(svg, "text", { x: xx, y: ym, "text-anchor": "middle", transform: `rotate(-90 ${xx} ${ym})` }, yl);
  }
  const lg10 = Math.log10;
  const sc = (lo, hi, a, b, log) => (v) =>
    log ? a + ((lg10(v) - lg10(lo)) / (lg10(hi) - lg10(lo))) * (b - a) : a + ((v - lo) / (hi - lo)) * (b - a);
  function hover(mk, html) {
    mk.style.cursor = "pointer";
    mk.addEventListener("mousemove", (e) => showTip(e, html));
    mk.addEventListener("mouseleave", hideTip);
  }
  function poly(svg, pts, col, dash) {
    if (pts.length < 2) return;
    el(svg, "path", {
      d: pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(""),
      fill: "none",
      stroke: col,
      "stroke-width": 2,
      "stroke-dasharray": dash || "",
    });
  }
  function legend(svg, x, y, items) {
    items.forEach((it, i) => {
      marker(svg, it[2] || "c", x, y + i * 17, it[1], true, 4);
      el(svg, "text", { x: x + 10, y: y + 4 + i * 17 }, it[0]);
    });
  }

  const LCOL = { 4: "#9ecae1", 8: "#6baed6", 10: "#4292c6", 12: "#2171b5", 16: "#08306b" };
  const kTicks = (svg, xs, Y1) =>
    [0.2, 0.22, 0.24, 0.26, 0.28, 0.3].forEach((v) => {
      el(svg, "line", { x1: xs(v), x2: xs(v), y1: 20, y2: Y1, class: "grid" });
      el(svg, "text", { x: xs(v), y: Y1 + 16, "text-anchor": "middle", class: "tick" }, v.toFixed(2));
    });

  function mlPlot() {
    const svg = $("ml-svg");
    if (!svg) return;
    const Lsel = +$("ml-L").value,
      zh = isZh();
    svg.innerHTML = "";
    const E = D.essV || [],
      C = D.chains || [];
    // left: Var(log w)/V vs kappa, one line per L
    let X0 = 62,
      X1 = 250,
      Y0 = 20,
      Y1 = 250;
    let xs = sc(0.195, 0.305, X0, X1, false),
      ys = sc(0, 0.035, Y1, Y0, false);
    kTicks(svg, xs, Y1);
    [0, 0.01, 0.02, 0.03].forEach((v) => {
      el(svg, "line", { x1: X0, x2: X1, y1: ys(v), y2: ys(v), class: "grid" });
      el(svg, "text", { x: X0 - 6, y: ys(v) + 4, "text-anchor": "end", class: "tick" }, v.toFixed(2));
    });
    frame(svg, X0, X1, Y0, Y1, "κ", "Var(log w) / V");
    const Ls = [...new Set(E.map((r) => r.L))].filter((L) => E.filter((r) => r.L === L).length > 3).sort((a, b) => a - b); // L = 6, 14 exist only at two couplings
    Ls.forEach((L) => {
      const pts = E.filter((r) => r.L === L).sort((a, b) => a.kappa - b.kappa);
      poly(
        svg,
        pts.map((r) => [xs(r.kappa), ys(r.var / L / L)]),
        LCOL[L] || "#888"
      );
      pts.forEach((r) =>
        hover(
          marker(svg, "c", xs(r.kappa), ys(r.var / L / L), LCOL[L] || "#888", true, 3.2),
          `L=${L} · κ=${r.kappa}<br>Var(log w) = ${fmt(r.var, 2)} · /V = ${fmt(r.var / L / L, 4)}`
        )
      );
    });
    Ls.forEach((L, n) => {
      el(svg, "line", { x1: X0 + 10, x2: X0 + 24, y1: Y0 + 8 + n * 15, y2: Y0 + 8 + n * 15, stroke: LCOL[L], "stroke-width": 2.5 });
      el(svg, "text", { x: X0 + 28, y: Y0 + 12 + n * 15 }, "L = " + L);
    });
    // right: ESS fraction and round-trip acceptance vs kappa at the selected L (log y)
    X0 = 360;
    X1 = 545;
    xs = sc(0.195, 0.305, X0, X1, false);
    ys = sc(1e-3, 1, Y1, Y0, true);
    kTicks(svg, xs, Y1);
    logAxis(svg, X0, X1, Y0, Y1, 1e-3, 1, true);
    frame(svg, X0, X1, Y0, Y1, "κ", zh ? "ESS 比例 / 接受率" : "ESS fraction / acceptance");
    const ser = [
      ["ESS/N", "#3b3f4a", "c", E.filter((r) => r.L === Lsel).map((r) => [r.kappa, r.ess])],
      ["RT", COL.rt, "c", C.filter((r) => r.L === Lsel && r.m === "RT").map((r) => [r.kappa, r.acc])],
      ["pRT", COL.prt, "sq", C.filter((r) => r.L === Lsel && r.m === "pRT").map((r) => [r.kappa, r.acc])],
    ];
    ser.forEach(([n, col, sh, pts]) => {
      pts = pts.filter((p) => p[1] > 0).sort((a, b) => a[0] - b[0]);
      poly(
        svg,
        pts.map((p) => [xs(p[0]), ys(Math.max(p[1], 1e-3))]),
        col
      );
      pts.forEach((p) => hover(marker(svg, sh, xs(p[0]), ys(Math.max(p[1], 1e-3)), col, true, 3.2), `${n} · L=${Lsel} · κ=${p[0]}<br>${fmt(p[1])}`));
    });
    legend(svg, X0 + 12, Y1 - 52, [
      ["ESS/N", "#3b3f4a"],
      ["RT", COL.rt],
      ["pRT", COL.prt, "sq"],
    ]);
    const e = E.find((r) => r.L === Lsel && Math.abs(r.kappa - 0.27) < 1e-9),
      a = C.find((r) => r.L === Lsel && r.m === "RT" && Math.abs(r.kappa - 0.27) < 1e-9);
    $("ml-out").textContent =
      e && a
        ? zh
          ? `L=${Lsel}，κ=0.27：ESS/N = ${fmt(e.ess)}，RT 接受率 = ${fmt(a.acc)}`
          : `L=${Lsel}, κ=0.27: ESS/N = ${fmt(e.ess)}, RT acceptance = ${fmt(a.acc)}`
        : "";
  }

  function latPlot() {
    const svg = $("lat-svg");
    if (!svg) return;
    const L = +$("lat-L").value,
      o = +$("lat-o").value,
      zh = isZh();
    svg.innerHTML = "";
    const key = o ? "tau_sign" : "tau";
    const X0 = 70,
      X1 = 420,
      Y0 = 20,
      Y1 = 250,
      lo = 0.5,
      hi = 2e4;
    const xs = sc(0.195, 0.305, X0, X1, false),
      ys = sc(lo, hi, Y1, Y0, true);
    kTicks(svg, xs, Y1);
    logAxis(svg, X0, X1, Y0, Y1, lo, hi, true);
    frame(svg, X0, X1, Y0, Y1, "κ", `τ_int (${o ? "sign m" : "|m|"})`);
    const items = [];
    ["HMC", "Wolff"].forEach((alg) => {
      const pts = (D.ref || []).filter((r) => r.L === L && r.alg === alg && key in r).sort((a, b) => a.kappa - b.kappa);
      poly(
        svg,
        pts.filter((r) => r[key] !== null).map((r) => [xs(r.kappa), ys(Math.min(Math.max(r[key], lo), hi))]),
        K3[alg],
        "4 3"
      ); // references: dashed
      pts.forEach((r) => {
        if (r[key] === null) {
          // sign never flipped in the record
          const x = xs(r.kappa);
          el(svg, "path", { d: `M${x - 5},${Y0 + 11}L${x + 5},${Y0 + 11}L${x},${Y0 + 1}Z`, fill: K3[alg] });
          hover(
            el(svg, "circle", { cx: x, cy: Y0 + 7, r: 8, fill: "transparent" }),
            zh
              ? `${alg} · L=${L} · κ=${r.kappa}：sign(m) 在 ${r.n} 条记录中未翻转`
              : `${alg} · L=${L} · κ=${r.kappa}: sign(m) never flipped in ${r.n} records`
          );
          return;
        }
        const mk = el(svg, "circle", {
          cx: xs(r.kappa),
          cy: ys(Math.min(Math.max(r[key], lo), hi)),
          r: 3.6,
          fill: "#fff",
          stroke: K3[alg],
          "stroke-width": 1.8,
        });
        hover(mk, `${alg} · L=${L} · κ=${r.kappa}<br>τ_int = ${fmt(r[key], 1)}`);
      });
      items.push([alg, K3[alg]]);
    });
    [
      ["IMH", "path-IMH"],
      ["RT", "RT"],
      ["pRT", "pRT"],
    ].forEach(([m, lab]) => {
      const col = K3[m],
        sh = m === "pRT" ? "sq" : "c";
      const pts = (D.chains || []).filter((r) => r.L === L && r.m === m && r[key] !== null).sort((a, b) => a.kappa - b.kappa);
      poly(
        svg,
        pts.map((r) => [xs(r.kappa), ys(Math.max(r[key], lo))]),
        col
      );
      pts.forEach((r) =>
        hover(
          marker(svg, sh, xs(r.kappa), ys(Math.max(r[key], lo)), col, true, 3.4),
          `${lab} · L=${L} · κ=${r.kappa}<br>α = ${fmt(r.acc)} · τ_int = ${fmt(r[key], 1)}`
        )
      );
      items.push([lab, col, sh]);
    });
    items.forEach((it, n) => {
      if (it[0] === "HMC" || it[0] === "Wolff") {
        el(svg, "circle", { cx: X1 + 30, cy: Y0 + 10 + n * 17, r: 4, fill: "#fff", stroke: it[1], "stroke-width": 1.8 });
        el(svg, "text", { x: X1 + 40, y: Y0 + 14 + n * 17 }, it[0]);
      } else {
        marker(svg, it[2] || "c", X1 + 30, Y0 + 10 + n * 17, it[1], true, 4);
        el(svg, "text", { x: X1 + 40, y: Y0 + 14 + n * 17 }, it[0]);
      }
    });
  }

  function imhPlot() {
    const svg = $("imh-svg");
    if (!svg) return;
    svg.innerHTML = "";
    const X0 = 70,
      X1 = 420,
      Y0 = 20,
      Y1 = 250,
      lo = 0.3,
      hi = 400;
    const xs = sc(0.1, 100, X0, X1, true),
      ys = sc(lo, hi, Y1, Y0, true);
    logAxis(svg, X0, X1, Y0, Y1, 0.1, 100, false);
    logAxis(svg, X0, X1, Y0, Y1, lo, hi, true);
    frame(svg, X0, X1, Y0, Y1, "1/α − 1/2", "τ_int (|m|)");
    poly(
      svg,
      [
        [xs(0.25), ys(0.3)],
        [xs(100), ys(120)],
      ],
      "#9aa1ad",
      "4 3"
    );
    el(svg, "text", { x: xs(95), y: ys(12), "text-anchor": "end", class: "tick" }, "τ = 1.2(1/α − 1/2)");
    const name = { RT: "RT", IMH: "path-IMH" };
    ["RT", "IMH"].forEach((m) =>
      (D.chains || [])
        .filter((r) => r.m === m && r.acc > 0 && r.tau)
        .forEach((r) => {
          const x = 1 / r.acc - 0.5;
          hover(
            marker(svg, "c", xs(Math.max(x, 0.1)), ys(Math.min(Math.max(r.tau, lo), hi)), K3[m], true, 3.4),
            `${name[m]} · L=${r.L} · κ=${r.kappa}<br>α = ${fmt(r.acc)} · τ_int = ${fmt(r.tau, 1)}`
          );
        })
    );
    legend(svg, X1 + 30, Y0 + 10, [
      ["RT", COL.rt],
      ["path-IMH", COL.imh],
    ]);
  }

  // Fig. 7: three samplers at L = 8 (left: Var(log w) vs kappa; right: refinement m at fixed kappa)
  const SCOL = { NHMC: "#2b2f3a", CMCD: "#E69F00", DBS: "#56B4E9" };
  function smpPlot() {
    const svg = $("smp-svg");
    if (!svg) return;
    const k = +$("smp-k").value,
      zh = isZh();
    svg.innerHTML = "";
    const S = D.smp || [],
      R = D.refine || [];
    let X0 = 62,
      X1 = 250,
      Y0 = 20,
      Y1 = 250;
    let xs = sc(0.195, 0.305, X0, X1, false),
      ys = sc(0.1, 10, Y1, Y0, true);
    kTicks(svg, xs, Y1);
    logAxis(svg, X0, X1, Y0, Y1, 0.1, 10, true);
    frame(svg, X0, X1, Y0, Y1, "κ", "Var(log w)");
    ["NHMC", "CMCD", "DBS"].forEach((a) => {
      const pts = S.filter((r) => r.sampler === a && r.var).sort((p, q) => p.kappa - q.kappa);
      poly(
        svg,
        pts.map((r) => [xs(r.kappa), ys(r.var)]),
        SCOL[a]
      );
      pts.forEach((r) =>
        hover(
          marker(svg, "c", xs(r.kappa), ys(r.var), SCOL[a], true, 3.2),
          `${a} · L=8 · κ=${r.kappa}<br>Var(log w) = ${fmt(r.var, 2)} · ESS = ${fmt(r.ess)}`
        )
      );
    });
    legend(svg, X0 + 12, Y0 + 8, [
      ["NHMC (T=16)", SCOL.NHMC],
      ["CMCD (T=80)", SCOL.CMCD],
      ["DBS (T=80)", SCOL.DBS],
    ]);
    // right: Var(log w) vs m (substeps per trained step), nets held at the trained step
    X0 = 360;
    X1 = 545;
    xs = sc(0.8, 10, X0, X1, true);
    const mOf = (c) => +c.replace("h", "").split("x")[0];
    const pts = (a) =>
      R.filter((r) => r.alg === a.toLowerCase() && Math.abs(r.kappa - k) < 1e-9 && (r.config === "1x1" || r.config.endsWith("x1h")))
        .map((r) => [mOf(r.config), r.var])
        .sort((p, q) => p[0] - q[0]);
    const all = [...pts("CMCD"), ...pts("DBS")].map((p) => p[1]);
    const nh = S.find((r) => r.sampler === "NHMC" && Math.abs(r.kappa - k) < 1e-9);
    if (nh) all.push(nh.var);
    const lo = Math.pow(10, Math.floor(lg10(Math.min(...all)) * 2) / 2),
      hi = Math.pow(10, Math.ceil(lg10(Math.max(...all)) * 2) / 2);
    ys = sc(lo, hi, Y1, Y0, true);
    [1, 2, 4, 8].forEach((m) => {
      el(svg, "line", { x1: xs(m), x2: xs(m), y1: Y0, y2: Y1, class: "grid" });
      el(svg, "text", { x: xs(m), y: Y1 + 16, "text-anchor": "middle", class: "tick" }, m);
    });
    logAxis(svg, X0, X1, Y0, Y1, lo, hi, true);
    [0.2, 0.3, 0.5, 2, 3, 5].forEach((v) => {
      if (v > lo && v < hi) el(svg, "text", { x: X0 - 6, y: ys(v) + 4, "text-anchor": "end", class: "tick" }, v);
    });
    frame(svg, X0, X1, Y0, Y1, zh ? "每个训练步的子步数 m" : "substeps per trained step m", "Var(log w)");
    ["CMCD", "DBS"].forEach((a) => {
      const p = pts(a);
      poly(
        svg,
        p.map((q) => [xs(q[0]), ys(q[1])]),
        SCOL[a]
      );
      p.forEach((q) => hover(marker(svg, "c", xs(q[0]), ys(q[1]), SCOL[a], true, 3.4), `${a} · κ=${k} · m=${q[0]}<br>Var(log w) = ${fmt(q[1], 3)}`));
    });
    if (nh) {
      el(svg, "line", { x1: X0, x2: X1, y1: ys(nh.var), y2: ys(nh.var), stroke: SCOL.NHMC, "stroke-dasharray": "5 4", "stroke-width": 1.6 });
      el(svg, "text", { x: X1 - 4, y: ys(nh.var) - 5, "text-anchor": "end", class: "tick" }, "NHMC");
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (window.renderMathInElement)
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    bindToy();
    if ($("l-s")) {
      $("l-s").addEventListener("input", lawPlot);
      lawPlot();
    }
    if ($("v-k")) {
      $("v-k").addEventListener("change", volPlot);
      $("v-a").addEventListener("input", volPlot);
      volPlot();
    }
    if ($("ml-L")) {
      $("ml-L").addEventListener("change", mlPlot);
      mlPlot();
    }
    if ($("lat-L")) {
      $("lat-L").addEventListener("change", latPlot);
      $("lat-o").addEventListener("change", latPlot);
      latPlot();
    }
    imhPlot();
    if ($("smp-k")) {
      $("smp-k").addEventListener("change", smpPlot);
      smpPlot();
    }
    document.querySelectorAll(".switch button").forEach((b) =>
      b.addEventListener("click", () => {
        if (cI) draw();
        lawPlot();
        volPlot();
        mlPlot();
        latPlot();
        imhPlot();
        smpPlot();
      })
    );
  });
})();
