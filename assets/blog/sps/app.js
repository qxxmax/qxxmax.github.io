// SPS blog: language switch, KaTeX and two demos.
// Fig. 2: annealed Langevin on a 1D double well; entropy production of forward paths vs number of steps.
// Fig. 6: ESS fraction exp(-a|L|) and IMH acceptance erfc(sqrt(a|L|)/2) versus volume.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  function setLang(l) {
    if (!["zh", "en", "both"].includes(l)) return;
    document.body.className = "lang-" + l;
    document.documentElement.lang = l === "en" ? "en" : "zh-CN";
    document.querySelectorAll(".switch button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === l));
    try {
      localStorage.setItem("sps-blog-lang", l);
    } catch (e) {}
  }
  document.querySelectorAll(".switch button").forEach((b) =>
    b.addEventListener("click", () => {
      setLang(b.dataset.lang);
      epPlot(true);
      eaPlot();
    })
  );
  try {
    const l = localStorage.getItem("sps-blog-lang") || localStorage.getItem("site-lang");
    if (l) setLang(l);
  } catch (e) {}
  const isZh = () => !document.body.classList.contains("lang-en");

  // ---------- helpers ----------
  function erfc(x) {
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
  function gauss() {
    let u = 0;
    while (u === 0) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }
  const fmt = (x, n = 3) => ((Math.abs(x) < 1e-3 && x !== 0) || Math.abs(x) >= 1e4 ? x.toExponential(1) : x.toFixed(n));
  const NS = "http://www.w3.org/2000/svg";
  function el(svg, tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    svg.appendChild(e);
    return e;
  }
  const sc = (lo, hi, a, b) => (v) => a + ((v - lo) / (hi - lo)) * (b - a);
  function axes(svg, X0, X1, Y0, Y1, xt, yt, xl, yl) {
    xt.forEach(([v, s]) => {
      el(svg, "line", { x1: v, x2: v, y1: Y0, y2: Y1, class: "grid" });
      el(svg, "text", { x: v, y: Y1 + 16, "text-anchor": "middle", class: "tick" }, s);
    });
    yt.forEach(([v, s]) => {
      el(svg, "line", { x1: X0, x2: X1, y1: v, y2: v, class: "grid" });
      el(svg, "text", { x: X0 - 6, y: v + 4, "text-anchor": "end", class: "tick" }, s);
    });
    el(svg, "line", { x1: X0, x2: X1, y1: Y1, y2: Y1, class: "ax" });
    el(svg, "line", { x1: X0, x2: X0, y1: Y0, y2: Y1, class: "ax" });
    el(svg, "text", { x: (X0 + X1) / 2, y: Y1 + 34, "text-anchor": "middle" }, xl);
    const ym = (Y0 + Y1) / 2,
      xx = X0 - 40;
    el(svg, "text", { x: xx, y: ym, "text-anchor": "middle", transform: `rotate(-90 ${xx} ${ym})` }, yl);
  }
  function path(svg, pts, col, dash, w) {
    el(svg, "path", {
      d: pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(""),
      fill: "none",
      stroke: col,
      "stroke-width": w || 2,
      "stroke-dasharray": dash || "",
    });
  }

  // ======================================================================
  // Fig. 2: entropy production. log pi_beta = (1-beta) log N(0,1) + beta (-b (x^2-1)^2), beta_k = k/T.
  // Forward ULA step to pi_{beta_{k+1}}; backward kernel: ULA step of the same pi_{beta_{k+1}} from x_{k+1}.
  // Sigma = log pi0(x0) - log pitilde(xT) + sum_k [log F_k - log B_k];  E[Sigma] = KL - log Z >= -log Z.
  // ======================================================================
  const TS = [4, 8, 16, 32, 64, 128, 256, 512],
    NP = 2000;
  const etaOf = (T) => 0.03 * Math.min(1, Math.sqrt(16 / T)); // total time grows as sqrt(T) while the per-path ULA error T*eta^2 stays fixed
  let epCache = null;
  function logZ(b) {
    let s = 0,
      dx = 0.002;
    for (let x = -4; x <= 4; x += dx) s += Math.exp(-b * (x * x - 1) * (x * x - 1));
    return Math.log(s * dx);
  }
  function simulate(T, b) {
    const ETA = etaOf(T);
    const grad = (x, be) => (1 - be) * -x + be * (-4 * b * x * (x * x - 1));
    const logN = (v, m) => (-0.5 * (v - m) * (v - m)) / (2 * ETA) - 0.5 * Math.log(4 * Math.PI * ETA);
    const xs = new Float64Array(NP),
      sig = new Float64Array(NP);
    for (let n = 0; n < NP; n++) {
      let x = gauss(),
        S = -0.5 * x * x - 0.5 * Math.log(2 * Math.PI);
      for (let k = 0; k < T; k++) {
        const be = (k + 1) / T,
          m = x + ETA * grad(x, be),
          y = m + Math.sqrt(2 * ETA) * gauss();
        S += logN(y, m) - logN(x, y + ETA * grad(y, be));
        x = y;
        // Abort the entire demo batch on numerical runaway; do not drop paths or resample.
        if (!Number.isFinite(x) || !Number.isFinite(S) || Math.abs(x) > 1e6) return { unstable: true };
      }
      xs[n] = x;
      sig[n] = S + b * (x * x - 1) * (x * x - 1);
    }
    return { xs, sig };
  }
  function epPlot(keep) {
    const svg = $("ep-svg");
    if (!svg) return;
    const T = TS[+$("ep-T").value],
      b = +$("ep-b").value,
      zh = isZh();
    $("ep-Tv").textContent = T;
    $("ep-bv").textContent = b;
    if (!keep || !epCache || epCache.T !== T || epCache.b !== b) epCache = Object.assign({ T, b, lz: logZ(b) }, simulate(T, b));
    const { xs, sig, lz } = epCache;
    svg.innerHTML = "";
    if (epCache.unstable) {
      $("ep-out").textContent = zh
        ? "数值发散：本轮不报告 KL 或 ESS，请增加步数。"
        : "Numerical instability: no KL or ESS reported for this batch. Increase the step count.";
      el(svg, "text", { x: 280, y: 135, "text-anchor": "middle" }, zh ? "当前步长下出现发散轨迹" : "A trajectory diverged at this step size");
      el(
        svg,
        "text",
        { x: 280, y: 160, "text-anchor": "middle" },
        zh ? "整轮结果已停用，未筛除异常样本" : "Batch disabled; no outliers were discarded"
      );
      return;
    }
    // left: endpoint histogram vs target density
    let X0 = 55,
      X1 = 255,
      Y0 = 20,
      Y1 = 250;
    const nb = 44,
      lo = -2.2,
      hi = 2.2,
      wbin = (hi - lo) / nb,
      cnt = new Array(nb).fill(0);
    xs.forEach((x) => {
      const i = Math.floor((x - lo) / wbin);
      if (i >= 0 && i < nb) cnt[i]++;
    });
    const dens = cnt.map((c) => c / (NP * wbin)),
      tgt = (x) => Math.exp(-b * (x * x - 1) ** 2 - lz);
    const ymax = Math.max(1.2 * Math.max(...dens), 1.15 * tgt(1));
    let xs_ = sc(lo, hi, X0, X1),
      ys_ = sc(0, ymax, Y1, Y0);
    axes(
      svg,
      X0,
      X1,
      Y0,
      Y1,
      [-2, -1, 0, 1, 2].map((v) => [xs_(v), v]),
      [0, ymax / 2, ymax].map((v) => [ys_(v), v.toFixed(1)]),
      "x",
      zh ? "密度" : "density"
    );
    dens.forEach((d, i) =>
      el(svg, "rect", {
        x: xs_(lo + i * wbin) + 0.5,
        y: ys_(d),
        width: Math.max(xs_(lo + wbin) - xs_(lo) - 1, 1),
        height: Y1 - ys_(d),
        fill: "#9ecae1",
      })
    );
    const tp = [];
    for (let i = 0; i <= 200; i++) {
      const x = lo + ((hi - lo) * i) / 200;
      tp.push([xs_(x), ys_(tgt(x))]);
    }
    path(svg, tp, "#08306b");
    // right: histogram of Sigma, dashed line at -log Z
    X0 = 345;
    X1 = 545;
    const sorted = Array.from(sig).sort((p, q) => p - q),
      s1 = sorted[Math.floor(0.005 * NP)],
      s2 = sorted[Math.floor(0.995 * NP)];
    const a = Math.min(s1, -lz) - 0.2,
      c = Math.max(s2, -lz + 0.5) + 0.2,
      nb2 = 40,
      w2 = (c - a) / nb2,
      cnt2 = new Array(nb2).fill(0);
    sig.forEach((s) => {
      const i = Math.floor((s - a) / w2);
      if (i >= 0 && i < nb2) cnt2[i]++;
    });
    const ym2 = Math.max(...cnt2) * 1.15;
    xs_ = sc(a, c, X0, X1);
    ys_ = sc(0, ym2, Y1, Y0);
    const step = c - a > 6 ? 2 : c - a > 3 ? 1 : 0.5,
      tk = [];
    for (let v = Math.ceil(a / step) * step; v <= c; v += step) tk.push([xs_(v), +v.toFixed(1)]);
    axes(svg, X0, X1, Y0, Y1, tk, [], "Σ", zh ? "路径数" : "paths");
    cnt2.forEach((n, i) =>
      el(svg, "rect", { x: xs_(a + i * w2) + 0.5, y: ys_(n), width: Math.max(xs_(a + w2) - xs_(a) - 1, 1), height: Y1 - ys_(n), fill: "#fdd0a2" })
    );
    el(svg, "line", { x1: xs_(-lz), x2: xs_(-lz), y1: Y0, y2: Y1, stroke: "#4a5263", "stroke-dasharray": "4 3", "stroke-width": 1.5 });
    el(svg, "text", { x: xs_(-lz) + 4, y: Y0 + 12, class: "tick" }, "−log Z");
    const mean = sig.reduce((s, v) => s + v, 0) / NP,
      kl = mean + lz;
    const mx = Math.max(...Array.from(sig, (s) => -s));
    let s0 = 0,
      s2w = 0;
    sig.forEach((s) => {
      const w = Math.exp(-s - mx);
      s0 += w;
      s2w += w * w;
    });
    $("ep-out").textContent = zh
      ? `KL = ⟨Σ⟩ + log Z = ${fmt(kl)} · ESS 比例 = ${fmt((s0 * s0) / (NP * s2w))}`
      : `KL = ⟨Σ⟩ + log Z = ${fmt(kl)} · ESS fraction = ${fmt((s0 * s0) / (NP * s2w))}`;
  }

  // ======================================================================
  // Fig. 6: ESS fraction and IMH acceptance versus volume at fixed per-site variance a
  // ======================================================================
  function eaPlot() {
    const svg = $("ea-svg");
    if (!svg) return;
    const a = Math.pow(10, +$("ea-a").value),
      V = Math.pow(10, +$("ea-V").value),
      zh = isZh();
    $("ea-av").textContent = a.toExponential(1);
    $("ea-Vv").textContent = Math.round(V);
    svg.innerHTML = "";
    const X0 = 70,
      X1 = 420,
      Y0 = 20,
      Y1 = 250;
    const xs = (v) => X0 + ((Math.log10(v) - 1) / 3) * (X1 - X0),
      ys = sc(0, 1, Y1, Y0);
    axes(
      svg,
      X0,
      X1,
      Y0,
      Y1,
      [
        [xs(10), "10"],
        [xs(100), "10²"],
        [xs(1000), "10³"],
        [xs(10000), "10⁴"],
      ],
      [0, 0.25, 0.5, 0.75, 1].map((v) => [ys(v), v.toFixed(2)]),
      zh ? "体积 |Λ|" : "volume |Λ|",
      zh ? "ESS 比例 / 接受率" : "ESS fraction / acceptance"
    );
    const pe = [],
      pa = [];
    for (let i = 0; i <= 240; i++) {
      const v = Math.pow(10, 1 + (3 * i) / 240);
      pe.push([xs(v), ys(Math.exp(-a * v))]);
      pa.push([xs(v), ys(erfc(Math.sqrt(a * v) / 2))]);
    }
    path(svg, pe, "#3b3f4a");
    path(svg, pa, "#0072B2");
    [128, 256, 384, 512].forEach((v) => el(svg, "line", { x1: xs(v), x2: xs(v), y1: Y1 - 6, y2: Y1, stroke: "#7a8191", "stroke-width": 2 }));
    el(svg, "line", { x1: xs(V), x2: xs(V), y1: Y0, y2: Y1, stroke: "#9aa1ad", "stroke-dasharray": "4 3" });
    const e = Math.exp(-a * V),
      acc = erfc(Math.sqrt(a * V) / 2);
    el(svg, "circle", { cx: xs(V), cy: ys(e), r: 5, fill: "#3b3f4a", stroke: "#fff", "stroke-width": 2 });
    el(svg, "circle", { cx: xs(V), cy: ys(acc), r: 5, fill: "#0072B2", stroke: "#fff", "stroke-width": 2 });
    [
      ["ESS/N = e^{−a|Λ|}", "#3b3f4a"],
      [zh ? "IMH 接受率" : "IMH acceptance", "#0072B2"],
    ].forEach(([t, c], i) => {
      const lx = X0 + i * 230;
      el(svg, "line", { x1: lx, x2: lx + 18, y1: 316, y2: 316, stroke: c, "stroke-width": 2.5 });
      el(svg, "text", { x: lx + 24, y: 320 }, t.replace("e^{−a|Λ|}", "exp(−a|Λ|)"));
    });
    $("ea-out").textContent = zh
      ? `a|Λ| = ${fmt(a * V, 2)} · ESS 比例 ${fmt(e)} · IMH 接受率 ${fmt(acc)}`
      : `a|Λ| = ${fmt(a * V, 2)} · ESS fraction ${fmt(e)} · IMH acceptance ${fmt(acc)}`;
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
    if ($("ep-T")) {
      let tm;
      const go = () => {
        clearTimeout(tm);
        tm = setTimeout(() => epPlot(false), 60);
      };
      $("ep-T").addEventListener("input", go);
      $("ep-b").addEventListener("input", go);
      epPlot(false);
    }
    if ($("ea-a")) {
      $("ea-a").addEventListener("input", eaPlot);
      $("ea-V").addEventListener("input", eaPlot);
      eaPlot();
    }
  });
})();
