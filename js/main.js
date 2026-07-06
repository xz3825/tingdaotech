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

  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  var navLinks = document.querySelectorAll(".nav-list a");

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
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
})();
