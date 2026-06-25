---
---
(function () {
  var key = "site-lang";

  function applyPlaceholders(lang) {
    document.querySelectorAll("[data-placeholder-en][data-placeholder-zh]").forEach(function (el) {
      var v = el.getAttribute("data-placeholder-" + lang);
      if (v != null) el.setAttribute("placeholder", v);
    });
  }

  function apply(lang) {
    document.documentElement.setAttribute("data-lang", lang);
    localStorage.setItem(key, lang);
    applyPlaceholders(lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cur = document.documentElement.getAttribute("data-lang") || "en";
    applyPlaceholders(cur);

    var btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var nxt = (document.documentElement.getAttribute("data-lang") || "en") === "en" ? "zh" : "en";
      apply(nxt);
    });
  });
})();
