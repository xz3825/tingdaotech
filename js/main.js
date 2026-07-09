(function () {
  "use strict";

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.querySelector(".nav");

  if (btn && nav) {
    btn.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });

    document.addEventListener("click", function (e) {
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove("is-open");
      }
    });
  }

  /* Active nav link */
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (link) {
    var href = link.getAttribute("href").split("#")[0];
    if (href === page || (page === "" && href === "index.html")) {
      link.classList.add("is-active");
    }
  });

  /* Contact form */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("form-success");
      if (msg) {
        msg.style.display = "block";
        form.reset();
      }
    });
  }

  /* Homepage only: light nav over dark hero, dark nav over light sections */
  var header = document.querySelector(".header");
  var hero = document.querySelector(".hero");

  if (header && hero && document.body.classList.contains("page-home")) {
    function updateHeaderScroll() {
      var threshold = hero.offsetHeight * 0.55;
      if (window.scrollY > threshold) {
        header.classList.add("header--solid");
      } else {
        header.classList.remove("header--solid");
      }
    }

    updateHeaderScroll();
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
    window.addEventListener("resize", updateHeaderScroll);
  }
})();
