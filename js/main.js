(function () {
  "use strict";

  var toggle = document.querySelector(".menu-toggle");
  var navList = document.querySelector(".nav-list");

  if (toggle && navList) {
    toggle.addEventListener("click", function () {
      navList.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!toggle.contains(e.target) && !navList.contains(e.target)) {
        navList.classList.remove("open");
      }
    });
  }

  var navLinks = document.querySelectorAll(".nav-list a");
  var currentPage = window.location.pathname.split("/").pop() || "index.html";

  for (var i = 0; i < navLinks.length; i++) {
    var href = navLinks[i].getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      navLinks[i].classList.add("active");
    }
  }

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = document.getElementById("form-success");
      if (success) {
        success.style.display = "block";
        contactForm.reset();
      }
    });
  }

  /* Homepage header: transparent over hero, solid on scroll */
  var header = document.querySelector(".site-header");
  var heroVideo = document.querySelector(".page-hero-video");

  if (header && heroVideo && document.body.classList.contains("page-home")) {
    function updateHeaderScroll() {
      var threshold = heroVideo.offsetHeight * 0.65;
      if (window.scrollY > threshold) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    updateHeaderScroll();
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
  }

  /* Split panel click expand */
  var splitPanels = document.querySelectorAll("[data-split-panel]");

  splitPanels.forEach(function (panel) {
    var panes = panel.querySelectorAll(".split-panel-pane[data-panel]");

    var hint = document.createElement("span");
    hint.className = "split-panel-hint";
    hint.textContent = "点击左侧或右侧展开";
    panel.appendChild(hint);

    var resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "split-panel-reset";
    resetBtn.textContent = "恢复分栏";
    resetBtn.setAttribute("aria-label", "恢复左右分栏");
    panel.appendChild(resetBtn);

    function setExpanded(side) {
      panel.classList.remove("is-left-expanded", "is-right-expanded");
      if (side) {
        panel.classList.add("is-" + side + "-expanded");
      }
    }

    panes.forEach(function (pane) {
      var side = pane.getAttribute("data-panel");

      function activate() {
        if (panel.classList.contains("is-" + side + "-expanded")) {
          setExpanded(null);
        } else {
          setExpanded(side);
        }
      }

      pane.addEventListener("click", activate);
      pane.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });

    resetBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setExpanded(null);
    });
  });

  /* Scroll reveal animations */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll(".reveal, .reveal-title, .reveal-fade, .reveal-stagger");

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });

    /* Hero titles animate on load */
    var heroTitles = document.querySelectorAll(".split-hero-content .reveal-title, .page-hero .reveal-title");
    heroTitles.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add("visible");
      }, 200 + i * 150);
    });

    var heroLabels = document.querySelectorAll(".split-hero-content .reveal-fade, .page-hero .reveal-fade");
    heroLabels.forEach(function (el) {
      setTimeout(function () {
        el.classList.add("visible");
      }, 100);
    });
  } else {
    document.querySelectorAll(".reveal, .reveal-title, .reveal-fade, .reveal-stagger").forEach(function (el) {
      el.classList.add("visible");
    });
  }
})();
