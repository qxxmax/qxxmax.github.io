---
---
(function () {
  var key = "site-lang";

  function apply(lang) {
    document.documentElement.setAttribute("data-lang", lang);
    localStorage.setItem(key, lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-lang") || "en";
      apply(cur === "en" ? "zh" : "en");
    });
  });
})();
