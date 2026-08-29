(function () {
  "use strict";

  /* ── Acordeões exclusivos (módulos e dúvidas) ─────────────── */
  document.querySelectorAll("[data-acc]").forEach(function (group) {
    var items = Array.prototype.slice.call(group.querySelectorAll(".acc__item"));
    items.forEach(function (item) {
      var btn  = item.querySelector(".acc__btn");
      var sign = item.querySelector(".acc__sign");
      btn.addEventListener("click", function () {
        var wasOpen = item.classList.contains("open");
        items.forEach(function (other) {
          other.classList.remove("open");
          other.querySelector(".acc__btn").setAttribute("aria-expanded", "false");
          other.querySelector(".acc__sign").textContent = "+";
        });
        if (!wasOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
          sign.textContent = "−";
        }
      });
    });
  });

  /* ── Barra de progresso + seção ativa na trilha ───────────── */
  var fill     = document.querySelector(".progress__fill");
  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
  var sections  = railLinks.map(function (a) {
    return { link: a, el: document.getElementById(a.getAttribute("href").slice(1)) };
  }).filter(function (s) { return s.el; });

  var ticking = false;
  function update() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    fill.style.width = (max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0).toFixed(2) + "%";

    var active = sections.length ? sections[0] : null;
    sections.forEach(function (s) {
      if (s.el.getBoundingClientRect().top <= window.innerHeight * 0.35) active = s;
    });
    sections.forEach(function (s) {
      s.link.setAttribute("aria-current", s === active ? "true" : "false");
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  /* ── Menu mobile ──────────────────────────────────────────── */
  var burger = document.querySelector(".burger");
  var mnav   = document.querySelector(".mobile-nav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = mnav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mnav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }
})();
