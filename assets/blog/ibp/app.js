// IBP blog: language switch and KaTeX rendering (interactive figures to be added).
(function () {
  "use strict";
  function setLang(l) {
    if (!["zh", "en", "both"].includes(l)) return;
    document.body.className = "lang-" + l;
    document.documentElement.lang = l === "en" ? "en" : "zh-CN";
    document.querySelectorAll(".switch button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === l));
    try {
      localStorage.setItem("ibp-blog-lang", l);
    } catch (e) {}
  }
  document.querySelectorAll(".switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  try {
    const l = localStorage.getItem("ibp-blog-lang");
    if (l) setLang(l);
  } catch (e) {}
  window.addEventListener("load", function () {
    if (window.renderMathInElement)
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
  });
})();
